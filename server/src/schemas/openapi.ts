// Partial HTTP contract assembled from ordinary endpoint metadata and Zod's native registry.
// Request parsing is independent of this document; response enforcement is test-only.

import * as z from 'zod';
import {
  errorSchema,
  idParamsSchema,
  idSchema,
  positionScopeSchema,
  reindexedPositionSchema,
  sideSchema,
} from './common.js';
import {
  activitySchema,
  itemChildSchema,
  itemDetailSchema,
  itemMoveFieldsSchema,
  itemMoveSchema,
  itemSchema,
  itemWriteSchema,
} from './items.js';
import { projectMoveFieldsSchema, projectMoveSchema, projectSchema, projectWriteSchema } from './projects.js';
import { workflowListSchema, workflowProjectFilterSchema, workflowQuerySchema, workflowSchema } from './workflows.js';

export const contractSchemas = {
  Id: idSchema,
  IdParams: idParamsSchema,
  Side: sideSchema,
  PositionScope: positionScopeSchema,
  ReindexedPosition: reindexedPositionSchema,
  Error: errorSchema,
  ItemMoveFields: itemMoveFieldsSchema,
  ItemMove: itemMoveSchema,
  Item: itemSchema,
  ItemChild: itemChildSchema,
  ItemDetail: itemDetailSchema,
  ItemWrite: itemWriteSchema,
  Activity: activitySchema,
  ProjectMoveFields: projectMoveFieldsSchema,
  ProjectMove: projectMoveSchema,
  Project: projectSchema,
  ProjectWrite: projectWriteSchema,
  WorkflowProjectFilter: workflowProjectFilterSchema,
  WorkflowQuery: workflowQuerySchema,
  Workflow: workflowSchema,
  WorkflowList: workflowListSchema,
};
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace';
type Parameter = {
  name: string;
  in: 'path' | 'query';
  required: boolean;
  schema: string;
  style?: 'form';
  explode?: boolean;
};
export type Operation = {
  method: HttpMethod;
  path: string;
  operationId: string;
  body?: string;
  query?: string;
  parameters: Parameter[];
  responses: Record<number, { schema?: string; description: string }>;
};
const itemId: Parameter = { name: 'id', in: 'path', required: true, schema: 'Id' };
const error = { schema: 'Error', description: 'Existing error response' };

export const contractOperations: Operation[] = [
  {
    method: 'patch',
    path: '/api/items/{id}/move',
    operationId: 'moveItem',
    body: 'ItemMove',
    parameters: [itemId],
    responses: {
      200: { schema: 'ItemWrite', description: 'Existing success response' },
      400: error,
      404: error,
      500: error,
    },
  },
  {
    method: 'patch',
    path: '/api/projects/{id}/move',
    operationId: 'moveProject',
    body: 'ProjectMove',
    parameters: [itemId],
    responses: {
      200: { schema: 'ProjectWrite', description: 'Existing success response' },
      400: error,
      404: error,
      500: error,
    },
  },
  {
    method: 'get',
    path: '/api/items/{id}',
    operationId: 'getItem',
    parameters: [itemId],
    responses: { 200: { schema: 'ItemDetail', description: 'Existing success response' }, 404: error, 500: error },
  },
  {
    method: 'get',
    path: '/api/workflows',
    operationId: 'listWorkflows',
    query: 'WorkflowQuery',
    parameters: [
      {
        name: 'projectId',
        in: 'query',
        required: false,
        schema: 'WorkflowProjectFilter',
        style: 'form',
        explode: true,
      },
    ],
    responses: { 200: { schema: 'WorkflowList', description: 'Existing success response' }, 400: error, 500: error },
  },
];

export function createContractDocument(
  operations: readonly Operation[] = contractOperations,
  catalog: Record<string, z.ZodType> = contractSchemas,
) {
  const registry = z.registry<{ id: string }>();
  for (const [name, schema] of Object.entries(catalog)) registry.add(schema, { id: name });
  const options = { uri: (id: string) => `#/components/schemas/${id}` };
  const input = z.toJSONSchema(registry, { ...options, io: 'input' });
  const output = z.toJSONSchema(registry, { ...options, io: 'output' });
  const inputs = new Set<string>(['ItemMoveFields', 'ProjectMoveFields', 'WorkflowQuery', 'IdParams']);
  const keys = new Set<string>();
  const ids = new Set<string>();
  for (const operation of operations) {
    const key = `${operation.method} ${operation.path}`;
    if (keys.has(key) || ids.has(operation.operationId)) throw new Error(`Duplicate operation: ${key}`);
    keys.add(key);
    ids.add(operation.operationId);
    const pathNames = [...operation.path.matchAll(/\{([^}]+)\}/g)].map(match => match[1]).sort();
    const pathParameters = operation.parameters.filter(parameter => parameter.in === 'path');
    if (
      JSON.stringify(pathNames) !== JSON.stringify(pathParameters.map(parameter => parameter.name).sort()) ||
      pathParameters.some(parameter => !parameter.required)
    )
      throw new Error(`Path parameter disagreement: ${key}`);
    const parameters = operation.parameters.map(parameter => `${parameter.in}:${parameter.name}`);
    if (new Set(parameters).size !== parameters.length) throw new Error(`Duplicate parameter: ${key}`);
    const queryParameters = operation.parameters.filter(parameter => parameter.in === 'query');
    if (queryParameters.length && !operation.query) throw new Error(`Missing query schema: ${key}`);
    if (operation.query) {
      const query = input.schemas[operation.query];
      if (!query || query.type !== 'object') throw new Error(`Invalid query schema: ${key}`);
      if (
        JSON.stringify(Object.keys(query.properties ?? {}).sort()) !==
        JSON.stringify(queryParameters.map(p => p.name).sort())
      ) {
        throw new Error(`Query parameter disagreement: ${key}`);
      }
      for (const parameter of queryParameters) {
        const property = query.properties?.[parameter.name];
        if (
          typeof property !== 'object' ||
          property.$ref !== `#/components/schemas/${parameter.schema}` ||
          (query.required ?? []).includes(parameter.name) !== parameter.required
        )
          throw new Error(`Query parameter schema/requiredness disagreement: ${key} ${parameter.name}`);
      }
      inputs.add(operation.query);
    }
    if (operation.body) inputs.add(operation.body);
    operation.parameters.forEach(parameter => inputs.add(parameter.schema));
    if (!Object.keys(operation.responses).length) throw new Error(`Missing responses: ${key}`);
    for (const [status, response] of Object.entries(operation.responses)) {
      if (!/^[1-5]\d\d$/.test(status)) throw new Error(`Invalid response status: ${key} ${status}`);
      if ((status === '204' || status === '304') && response.schema)
        throw new Error(`Bodyless status has a schema: ${key} ${status}`);
    }
    for (const name of [
      operation.body,
      operation.query,
      ...operation.parameters.map(p => p.schema),
      ...Object.values(operation.responses).map(r => r.schema),
    ]) {
      if (name && !Object.hasOwn(catalog, name)) throw new Error(`Unknown schema: ${key} ${name}`);
    }
  }
  const schemas = Object.fromEntries(
    Object.keys(catalog).map(name => {
      const { $schema, $id, ...schema } = (inputs.has(name) ? input : output).schemas[name];
      void $schema;
      void $id;
      return [name, schema];
    }),
  );
  const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
  type Response = { description: string; content?: { 'application/json': { schema: { $ref: string } } } };
  type DocumentOperation = { operationId: string; responses: Record<string, Response> };
  const paths: Record<string, Record<string, DocumentOperation>> = {};
  for (const operation of operations) {
    paths[operation.path] ??= {};
    paths[operation.path][operation.method] = {
      operationId: operation.operationId,
      ...(operation.parameters.length
        ? {
            parameters: operation.parameters.map(({ schema, ...parameter }) => ({ ...parameter, schema: ref(schema) })),
          }
        : {}),
      ...(operation.body
        ? { requestBody: { required: true, content: { 'application/json': { schema: ref(operation.body) } } } }
        : {}),
      responses: Object.fromEntries(
        Object.entries(operation.responses).map(([status, { schema, description }]) => [
          status,
          {
            description,
            ...(schema ? { content: { 'application/json': { schema: ref(schema) } } } : {}),
          },
        ]),
      ),
    };
  }
  return {
    openapi: '3.1.0',
    info: {
      title: 'Kanban API contract',
      version: '0.0.0',
      description: 'Partial development contract: four endpoints only.',
    },
    paths,
    components: { schemas },
  };
}
