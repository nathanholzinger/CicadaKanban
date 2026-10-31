import { readFileSync } from 'node:fs';
import express from 'express';
import { describe, expect, it, vi } from 'vitest';
import { createContractDocument } from '../../src/schemas/openapi.js';
import { assertRouteCoverage, discoverRoutes, type Mount } from './routeDiscovery.js';

const pendingByOwner = JSON.parse(readFileSync(new URL('./pendingOperations.json', import.meta.url), 'utf8')) as Record<
  string,
  string[]
>;
const pending = Object.values(pendingByOwner).flat();
const registered = (paths: ReturnType<typeof createContractDocument>['paths']) =>
  Object.entries(paths).flatMap(([path, methods]) => Object.keys(methods).map(method => `${method} ${path}`));
const excluded = [
  'post /api/test/reset',
  'patch /api/test/items/{id}/position',
  'patch /api/test/projects/{id}/position',
  'patch /api/test/projects/{id}/created-at',
  'patch /api/test/projects/{id}/parent',
].sort();

async function applicationRoutes(testRoutes: boolean) {
  vi.resetModules();
  vi.stubEnv('ENABLE_TEST_ROUTES', String(testRoutes));
  const mounting = vi.spyOn(express.application, 'use');
  try {
    const { app } = await import('../../src/index.js');
    const mounts = (mounting.mock.calls as unknown[][]).flatMap(args => {
      const router = args[1] as { stack?: unknown } | undefined;
      if (typeof args[0] !== 'string') return [];
      if (!router?.stack) throw new Error(`Unsupported named mount: ${args[0]}; review discovery`);
      return [{ path: args[0], router } satisfies Mount];
    });
    return discoverRoutes(app, mounts);
  } finally {
    mounting.mockRestore();
    vi.unstubAllEnvs();
    const { sqlite } = await import('../../src/db/index.js');
    sqlite.close();
  }
}

describe('independent mounted-route coverage', () => {
  it.each([false, true])('accounts for actual mounts with test helpers enabled=%s', async enabled => {
    const routes = await applicationRoutes(enabled);
    const testRoutes = routes.filter(key => key.includes(' /api/test/'));
    expect(testRoutes).toEqual(enabled ? excluded : []);
    const business = routes.filter(key => !testRoutes.includes(key));
    expect(business).toHaveLength(54);
    expect(Object.keys(pendingByOwner)).toEqual(['M2', 'M3', 'M4']);
    const paths = createContractDocument().paths;
    assertRouteCoverage(business, registered(paths), pending);
    const missing = structuredClone(paths);
    delete missing['/api/items/{id}'].get;
    expect(() => assertRouteCoverage(business, registered(missing), pending)).toThrow(
      /missing: get \/api\/items\/\{id\}/,
    );
    const wrongMethod = registered(paths).map(key => (key === 'get /api/items/{id}' ? 'put /api/items/{id}' : key));
    expect(() => assertRouteCoverage(business, wrongMethod, pending)).toThrow(/Duplicate|missing/);
    const wrongParameter = registered(paths).map(key => key.replace('/items/{id}', '/items/{itemId}'));
    expect(() => assertRouteCoverage(business, wrongParameter, pending)).toThrow(/stale:/);
    expect(() => assertRouteCoverage([...business, 'post /api/new-resource'], registered(paths), pending)).toThrow(
      /missing: post \/api\/new-resource/,
    );
    expect(() => assertRouteCoverage(business, registered(paths), [...pending, 'get /api/removed'])).toThrow(
      /stale: get \/api\/removed/,
    );
  });

  it('preserves parameter names and excludes implicit HEAD/OPTIONS without hiding explicit declarations', () => {
    const app = express();
    const router = express.Router();
    router.get('/item/:itemId', (_req, res) => res.json({}));
    router.head('/explicit', (_req, res) => res.end());
    app.use('/api/example', router);
    expect(discoverRoutes(app, [{ path: '/api/example', router }])).toEqual([
      'get /api/example/item/{itemId}',
      'head /api/example/explicit',
    ]);
    expect(() => discoverRoutes(app, [])).toThrow('Unknown or multiply mounted router');
  });
});
