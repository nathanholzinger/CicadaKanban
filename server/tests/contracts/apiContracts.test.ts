import { readFile } from 'node:fs/promises';
import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { app } from '../../src/index.js';
import { resetTestDb } from '../../src/db/resetTestDb.js';
import { callMcpItemTool, mcpItemInputSchema } from '../../src/lib/mcpItemTools.js';
import { contractSchemas, createContractDocument } from '../../src/schemas/openapi.js';
import { compatibilityCases } from './compatibilityCases.js';
import { captureCompatibilityCase, createCompatibilityFixture } from './compatibilityHarness.js';
import { documentValidator } from '../../../tools/api-contracts/document.js';
import { assertCurrentArtifact, renderContractArtifacts } from '../../../tools/api-contracts/artifacts.js';

const document = createContractDocument();
const validators = Object.fromEntries(
  ['ItemWrite', 'ProjectWrite', 'ItemDetail', 'WorkflowList', 'Error'].map(name => [
    name,
    documentValidator(document, name),
  ]),
);

function assertResponse(name: keyof typeof validators, body: unknown) {
  const validate = validators[name];
  if (!validate(body)) throw new Error(`${name} response mismatch: ${JSON.stringify(validate.errors)}`);
}

function scopeOf(path: string) {
  return path.split('?')[0].replace(/\/(items|projects)\/[^/]+/, '/$1/{id}');
}

function assertContractRegistration(paths: typeof document.paths, scope: Set<string>) {
  for (const entry of scope) {
    const [method, path] = entry.split(' ');
    if (!paths[path]?.[method]) throw new Error(`Missing contract registration: ${entry}`);
  }
  expect(
    Object.entries(paths)
      .flatMap(([path, methods]) => Object.keys(methods).map(method => `${method} ${path}`))
      .sort(),
  ).toEqual([...scope].sort());
}

describe('integrated HTTP contract', () => {
  it('generated request components agree with the runtime schemas on characterized wire inputs', async () => {
    const fixture = await createCompatibilityFixture();
    const moves = {
      ItemMove: documentValidator(document, 'ItemMove'),
      ProjectMove: documentValidator(document, 'ProjectMove'),
    };
    for (const example of compatibilityCases.filter(example => example.method === 'patch' && example.body)) {
      const name = example.path(fixture.ids).startsWith('/api/items/') ? 'ItemMove' : 'ProjectMove';
      const body = example.body!(fixture.ids);
      expect(moves[name](body), example.name).toBe(contractSchemas[name].safeParse(body).success);
    }
    const query = documentValidator(document, 'WorkflowQuery');
    for (const projectId of [undefined, '', fixture.ids.project, [fixture.ids.project, 'missing'], null, 7, {}]) {
      const body = projectId === undefined ? {} : { projectId };
      expect(query(body)).toBe(contractSchemas.WorkflowQuery.safeParse(body).success);
    }
  });

  it('all characterized responses meet both contracts, reusing only unchanged fixture state', async () => {
    let fixture: Awaited<ReturnType<typeof createCompatibilityFixture>> | undefined;
    let variant: string | undefined;
    for (const example of compatibilityCases) {
      const nextVariant = example.fixture ?? 'ordinary';
      if (!fixture || variant !== nextVariant) {
        vi.restoreAllMocks();
        resetTestDb();
        fixture = await createCompatibilityFixture(example.fixture);
        variant = nextVariant;
      }
      const observed = await captureCompatibilityCase(app, example, fixture);
      if (!observed || typeof observed !== 'object' || !('response' in observed)) throw new Error('Missing response');
      const path = example.path(fixture.ids);
      const name =
        example.status >= 400
          ? 'Error'
          : example.method === 'patch'
            ? path.startsWith('/api/items/')
              ? 'ItemWrite'
              : 'ProjectWrite'
            : path.startsWith('/api/items/')
              ? 'ItemDetail'
              : 'WorkflowList';
      const parsed = contractSchemas[name].safeParse(observed.response);
      expect(parsed.error?.issues, example.name).toBeUndefined();
      assertResponse(name, observed.response);
      if (example.method === 'patch' && example.status < 400) fixture = undefined;
    }
  });

  it('generated files are current and the freshness check rejects stale contents', async () => {
    for (const [path, expected] of await renderContractArtifacts()) {
      assertCurrentArtifact(path, await readFile(path, 'utf8'), expected);
      expect(() => assertCurrentArtifact(path, `${expected}\n// stale`, expected)).toThrow(
        `Stale generated artifact: ${path}`,
      );
      expect(() => assertCurrentArtifact(path, `${expected}\n// stale`, expected)).toThrow(
        'npm run contracts:generate',
      );
    }
  });

  it('every characterized endpoint is registered and deleting a registration fails', async () => {
    const fixture = await createCompatibilityFixture();
    const scope = new Set(compatibilityCases.map(example => `${example.method} ${scopeOf(example.path(fixture.ids))}`));
    expect(scope.size).toBe(4);
    assertContractRegistration(document.paths, scope);
    const missing = structuredClone(document.paths);
    delete missing['/api/items/{id}'];
    expect(() => assertContractRegistration(missing, scope)).toThrow(
      'Missing contract registration: get /api/items/{id}',
    );
  });

  it('the response assertion exposes a field removed by a real response interceptor', async () => {
    const fixture = await createCompatibilityFixture();
    const faulty = express();
    faulty.use((_req, res, next) => {
      const json = res.json.bind(res);
      res.json = body => {
        delete body.title;
        return json(body);
      };
      next();
    });
    faulty.use(app);
    const response = await request(faulty).get(`/api/items/${fixture.ids.movingItem}`).expect(200);
    expect(contractSchemas.ItemDetail.safeParse(response.body).success).toBe(false);
    expect(() => assertResponse('ItemDetail', response.body)).toThrow(/ItemDetail response mismatch:.*title/);
  });

  it('the existing authored Bruno move scenario validates and runs without edits', async () => {
    const fixture = await createCompatibilityFixture();
    const source = await readFile(new URL('../../../bruno/items/move-item.bru', import.meta.url), 'utf8');
    const variables: Record<string, string> = {
      baseUrl: '',
      itemId: fixture.ids.movingItem,
      workphaseId: fixture.ids.active,
      anchorId: fixture.ids.nextItem,
    };
    const resolved = source.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
      if (!(name in variables)) throw new Error(`Unresolved Bruno variable: ${name}`);
      return variables[name];
    });
    const path = resolved.match(/url: (.+)/)![1].trim();
    const body = JSON.parse(resolved.match(/body:json \{\s*([\s\S]*?)\n\}/)![1]);
    expect(documentValidator(document, 'ItemMove')(body)).toBe(true);
    const response = await request(app).patch(path).send(body).expect(200);
    assertResponse('ItemWrite', response.body);
  });
});

describe('existing MCP item tools', () => {
  it('keeps the advertised names, requiredness, descriptions and open unknown-field policy', () => {
    const item_id = { type: 'string', description: 'The item ID' };
    expect(mcpItemInputSchema('get_item')).toEqual({ type: 'object', properties: { item_id }, required: ['item_id'] });
    expect(mcpItemInputSchema('move_item')).toEqual({
      type: 'object',
      properties: { item_id, workphase_id: { type: 'string', description: 'Target workphase ID' } },
      required: ['item_id', 'workphase_id'],
    });
  });

  it('runs the original get/move argument mapping against the integrated endpoints', async () => {
    const fixture = await createCompatibilityFixture();
    const api = async (path: string, options?: RequestInit) => {
      const response =
        options?.method === 'PATCH'
          ? await request(app)
              .patch(`/api${path}`)
              .send(JSON.parse(String(options.body)))
          : await request(app).get(`/api${path}`);
      expect(response.status).toBe(200);
      assertResponse(options ? 'ItemWrite' : 'ItemDetail', response.body);
      return response.body;
    };
    expect(
      await callMcpItemTool('move_item', { item_id: fixture.ids.movingItem, workphase_id: fixture.ids.active }, api),
    ).toEqual({
      content: [{ type: 'text', text: `Moved item ${fixture.ids.movingItem} to workphase ${fixture.ids.active}` }],
    });
    const result = await callMcpItemTool('get_item', { item_id: fixture.ids.movingItem }, api);
    expect(JSON.parse(result.content[0].text).workphaseId).toBe(fixture.ids.active);
  });

  it('keeps raw argument forwarding and exceptions rather than adding runtime validation', async () => {
    const calls: unknown[] = [];
    const api = async (path: string, options?: RequestInit) => {
      calls.push([path, options]);
      return {};
    };
    await callMcpItemTool('move_item', { item_id: 'a/b', workphase_id: null }, api);
    expect(calls).toEqual([['/items/a%2Fb/move', { method: 'PATCH', body: '{"workphaseId":null}' }]]);
    await expect(callMcpItemTool('get_item', undefined, api)).rejects.toThrow(TypeError);
  });
});
