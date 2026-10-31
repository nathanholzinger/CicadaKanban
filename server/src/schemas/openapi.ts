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
type SchemaName = keyof typeof contractSchemas;
type Parameter = {
  name: string;
  in: 'path' | 'query';
  required: boolean;
  schema: SchemaName;
  style?: 'form';
  explode?: boolean;
};
type Operation = {
  method: 'get' | 'patch';
  path: string;
  operationId: string;
  body?: SchemaName;
  parameters: Parameter[];
  response: SchemaName;
  errors: number[];
};
const itemId: Parameter = { name: 'id', in: 'path', required: true, schema: 'Id' };

export const contractOperations: Operation[] = [
  {
    method: 'patch',
    path: '/api/items/{id}/move',
    operationId: 'moveItem',
    body: 'ItemMove',
    parameters: [itemId],
    response: 'ItemWrite',
    errors: [400, 404, 500],
  },
  {
    method: 'patch',
    path: '/api/projects/{id}/move',
    operationId: 'moveProject',
    body: 'ProjectMove',
    parameters: [itemId],
    response: 'ProjectWrite',
    errors: [400, 404, 500],
  },
  {
    method: 'get',
    path: '/api/items/{id}',
    operationId: 'getItem',
    parameters: [itemId],
    response: 'ItemDetail',
    errors: [404, 500],
  },
  {
    method: 'get',
    path: '/api/workflows',
    operationId: 'listWorkflows',
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
    response: 'WorkflowList',
    errors: [400, 500],
  },
];

export function createContractDocument() {
  const registry = z.registry<{ id: string }>();
  for (const [name, schema] of Object.entries(contractSchemas)) registry.add(schema, { id: name });
  const options = { uri: (id: string) => `#/components/schemas/${id}` };
  const input = z.toJSONSchema(registry, { ...options, io: 'input' });
  const output = z.toJSONSchema(registry, { ...options, io: 'output' });
  const inputs = new Set<string>(['ItemMoveFields', 'ProjectMoveFields', 'WorkflowQuery', 'IdParams']);
  for (const operation of contractOperations) {
    if (operation.body) inputs.add(operation.body);
    operation.parameters.forEach(parameter => inputs.add(parameter.schema));
  }
  const schemas = Object.fromEntries(
    Object.keys(contractSchemas).map(name => {
      const { $schema, $id, ...schema } = (inputs.has(name) ? input : output).schemas[name];
      void $schema;
      void $id;
      return [name, schema];
    }),
  );
  const ref = (name: SchemaName) => ({ $ref: `#/components/schemas/${name}` });
  const response = (name: SchemaName, description: string) => ({
    description,
    content: { 'application/json': { schema: ref(name) } },
  });
  const paths: Record<string, Record<string, unknown>> = {};
  for (const operation of contractOperations) {
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
      responses: {
        200: response(operation.response, 'Existing success response'),
        ...Object.fromEntries(operation.errors.map(code => [code, response('Error', 'Existing error response')])),
      },
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
