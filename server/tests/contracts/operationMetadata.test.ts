import express from 'express';
import request from 'supertest';
import * as z from 'zod';
import { describe, expect, it } from 'vitest';
import {
  contractOperations,
  contractSchemas,
  createContractDocument,
  type Operation,
} from '../../src/schemas/openapi.js';
import { responseAssertion } from '../../../tools/api-contracts/responses.js';

const catalog = {
  ...contractSchemas,
  Created: z.strictObject({ id: z.string() }),
  Conflict: z.strictObject({ error: z.string(), conflictingColumnId: z.string() }),
  MissingIds: z.strictObject({ error: z.string(), missingIds: z.array(z.string()) }),
};
const operations: Operation[] = [
  {
    method: 'post',
    path: '/api/example/item/{itemId}',
    operationId: 'createExample',
    parameters: [{ name: 'itemId', in: 'path', required: true, schema: 'Id' }],
    responses: {
      201: { schema: 'Created', description: 'Created' },
      400: { schema: 'Conflict', description: 'Conflict' },
      404: { schema: 'MissingIds', description: 'Missing rows' },
      409: { schema: 'Error', description: 'Ownership conflict' },
    },
  },
  {
    method: 'put',
    path: '/api/example/item/{itemId}',
    operationId: 'editExample',
    parameters: [{ name: 'itemId', in: 'path', required: true, schema: 'Id' }],
    responses: { 200: { schema: 'Created', description: 'Edited' } },
  },
  {
    method: 'delete',
    path: '/api/example/item/{itemId}',
    operationId: 'deleteExample',
    parameters: [{ name: 'itemId', in: 'path', required: true, schema: 'Id' }],
    responses: { 200: { schema: 'Created', description: 'Report' }, 204: { description: 'No changes' } },
  },
];

describe('operation metadata and real response associations', () => {
  it('supports ordinary methods, 201, per-status errors and JSON/bodyless alternatives', async () => {
    const document = createContractDocument(operations, catalog);
    const assertResponse = responseAssertion(document);
    const app = express();
    app.post('/api/example/item/:itemId', (req, res) => {
      if (req.params.itemId === 'conflict')
        return res.status(400).json({ error: 'overlap', conflictingColumnId: 'column' });
      if (req.params.itemId === 'missing') return res.status(404).json({ error: 'missing', missingIds: ['row'] });
      if (req.params.itemId === 'owned') return res.status(409).json({ error: 'already owned' });
      res.status(201).json({ id: req.params.itemId });
    });
    app.put('/api/example/item/:itemId', (req, res) => res.json({ id: req.params.itemId }));
    app.delete('/api/example/item/:itemId', (req, res) =>
      req.params.itemId === 'report' ? res.json({ id: 'report' }) : res.status(204).end(),
    );
    for (const [method, id, status, schema] of [
      ['post', 'new', 201, 'Created'],
      ['post', 'conflict', 400, 'Conflict'],
      ['post', 'missing', 404, 'MissingIds'],
      ['post', 'owned', 409, 'Error'],
      ['put', 'existing', 200, 'Created'],
      ['delete', 'report', 200, 'Created'],
      ['delete', 'empty', 204, undefined],
    ] as const) {
      const path = `/api/example/item/${id}`;
      const response = await request(app)[method](path).expect(status);
      expect(assertResponse({ method, path, status: response.status, body: response.body, text: response.text })).toBe(
        schema,
      );
    }
    expect(document.paths['/api/example/item/{itemId}'].delete.responses[204]).not.toHaveProperty('content');
  });

  it('fails missing operations/statuses, wrong associated schemas and malformed responses', () => {
    const document = createContractDocument(operations, catalog);
    const observed = {
      method: 'post',
      path: '/api/example/item/a?ignored=true',
      status: 201,
      body: { id: 'a' },
      text: '{"id":"a"}',
    };
    const missing = structuredClone(document);
    delete missing.paths['/api/example/item/{itemId}'].post;
    expect(() => responseAssertion(missing)(observed)).toThrow(/Missing response operation/);
    const wrong = structuredClone(document);
    wrong.paths['/api/example/item/{itemId}'].post.responses[201].content!['application/json'].schema.$ref =
      '#/components/schemas/Conflict';
    expect(() => responseAssertion(wrong)(observed)).toThrow(/Response mismatch: post .* 201 Conflict/);
    const assertResponse = responseAssertion(document);
    expect(() => assertResponse({ ...observed, status: 202 })).toThrow(/Undocumented response status/);
    expect(() => assertResponse({ ...observed, body: { id: 42 } })).toThrow(/Response mismatch/);
    expect(() => assertResponse({ ...observed, status: 400, body: { error: 'overlap' } })).toThrow(
      /conflictingColumnId/,
    );
    expect(() => assertResponse({ ...observed, method: 'delete', status: 204, text: 'unexpected' })).toThrow(
      /Expected empty response body/,
    );
  });

  it('rejects duplicate operations, broken parameter bindings and undocumented query keys', () => {
    expect(() => createContractDocument([...contractOperations, contractOperations[0]])).toThrow(/Duplicate operation/);
    const query = structuredClone(contractOperations.find(op => op.operationId === 'listWorkflows')!);
    query.parameters[0].name = 'project_id';
    expect(() => createContractDocument([query])).toThrow(/Query parameter disagreement/);
    query.parameters[0].name = 'projectId';
    query.parameters[0].schema = 'Id';
    expect(() => createContractDocument([query])).toThrow(/Query parameter schema\/requiredness disagreement/);
    query.parameters[0].schema = 'WorkflowProjectFilter';
    query.parameters[0].required = true;
    expect(() => createContractDocument([query])).toThrow(/requiredness disagreement/);
    const path = structuredClone(operations[0]);
    path.parameters[0].name = 'id';
    expect(() => createContractDocument([path], catalog)).toThrow(/Path parameter disagreement/);
    const bodyless = structuredClone(operations[2]);
    bodyless.responses[204].schema = 'Created';
    expect(() => createContractDocument([bodyless], catalog)).toThrow(/Bodyless status has a schema/);
    const unknown = structuredClone(operations[0]);
    unknown.responses[201].schema = 'Typo';
    expect(() => createContractDocument([unknown], catalog)).toThrow(/Unknown schema/);
  });
});
