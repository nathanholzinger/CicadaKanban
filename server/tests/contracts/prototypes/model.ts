// Shared comparison vocabulary and endpoint metadata. Schema authorship stays with each
// candidate; conditional request policies feed both validation and document assembly.

export type Resource = 'item' | 'project';
export type Change = 'baseline' | 'optional-request-field' | 'required-response-field' | 'workphase-not-null';
export type Field = 'position' | 'parentId' | 'isAttached' | 'workphaseId' | 'prevId' | 'nextId' | 'side';
export type JsonSchema = Record<string, unknown>;
export type Document = {
  openapi: string;
  info: { title: string; version: string; description: string };
  paths: Record<string, unknown>;
  components: { schemas: Record<string, JsonSchema> };
};

export interface Candidate {
  name: string;
  fieldValid: (field: Field, value: unknown) => boolean;
  requestValid: (resource: Resource, value: unknown) => boolean;
  responseValid: (resource: Resource | 'error', value: unknown) => boolean;
  document: () => Document;
}

export const info = {
  title: 'Kanban move contract comparison',
  version: '0.0.0',
  description: 'Partial development document: two existing move endpoints only.',
};

export const moves = [
  { resource: 'item', path: '/api/items/{id}/move', operationId: 'moveItem', input: 'ItemMove', output: 'ItemWrite' },
  {
    resource: 'project',
    path: '/api/projects/{id}/move',
    operationId: 'moveProject',
    input: 'ProjectMove',
    output: 'ProjectWrite',
  },
] as const;

export const intentFields = ['workphaseId', 'anchorId', 'parentId', 'isAttached'] as const;

export function hasItemIntent(body: Record<string, unknown>): boolean {
  return (
    intentFields.some(field => body[field] !== undefined) ||
    (Array.isArray(body.scopeWorkphaseIds) && body.scopeWorkphaseIds.length > 0)
  );
}

export function objectBody(value: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(value)) return {};
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;
}

export function requestPolicies(side: JsonSchema): JsonSchema {
  return {
    allOf: [
      {
        anyOf: [
          ...intentFields.map(field => ({ required: [field] })),
          { required: ['scopeWorkphaseIds'], properties: { scopeWorkphaseIds: { type: 'array', minItems: 1 } } },
        ],
      },
      { if: { required: ['anchorId'] }, then: { required: ['side'], properties: { side } } },
    ],
  };
}

export function decorateItemRequest(schema: JsonSchema, side: JsonSchema): JsonSchema {
  // The legacy item endpoint rejects array bodies for lack of intent; the project endpoint
  // accepts them as an empty move. Document that transport difference explicitly.
  return { ...schema, ...requestPolicies(side) };
}

export function assembleDocument(schemas: Record<string, JsonSchema>): Document {
  const response = (name: string, description: string) => ({
    description,
    content: { 'application/json': { schema: { $ref: `#/components/schemas/${name}` } } },
  });
  return {
    openapi: '3.1.0',
    info,
    paths: Object.fromEntries(
      moves.map(move => [
        move.path,
        {
          patch: {
            operationId: move.operationId,
            parameters: [{ name: 'id', in: 'path', required: true, schema: { $ref: '#/components/schemas/Id' } }],
            requestBody: {
              required: true,
              content: { 'application/json': { schema: { $ref: `#/components/schemas/${move.input}` } } },
            },
            responses: {
              200: response(move.output, 'Stored row with optional reindex disclosure'),
              400: response('Error', 'Existing validation or domain refusal'),
              404: response('Error', 'Target not found before handler validation'),
              500: response('Error', 'Existing global error-handler response'),
            },
          },
        },
      ]),
    ),
    components: { schemas },
  };
}

export function requestIssue(candidate: Candidate, resource: Resource, value: unknown): string | undefined {
  const body = objectBody(value);
  if (!body) return undefined; // Let the existing missing-body error pipeline run.
  if (!candidate.fieldValid('position', body.position)) {
    return resource === 'item'
      ? 'position is not accepted: name an anchorId and side to place the item instead'
      : 'position is not accepted: name a prevId or nextId to place the project instead';
  }
  if (resource === 'item' && !hasItemIntent(body)) {
    return 'workphaseId, parentId, isAttached, and/or anchorId+side required';
  }
  const fields: Field[] =
    resource === 'item' ? ['parentId', 'isAttached', 'workphaseId'] : ['prevId', 'nextId', 'parentId'];
  for (const field of fields) {
    if (!candidate.fieldValid(field, body[field])) {
      return field === 'isAttached' ? 'isAttached must be a boolean' : `${field} must be a string or null`;
    }
  }
  if (resource === 'item' && body.anchorId !== undefined && !candidate.fieldValid('side', body.side)) {
    return "side must be 'before' or 'after' when anchorId is given";
  }
  if (!candidate.requestValid(resource, value)) throw new Error('Aggregate schema disagrees with staged validation');
  return undefined;
}
