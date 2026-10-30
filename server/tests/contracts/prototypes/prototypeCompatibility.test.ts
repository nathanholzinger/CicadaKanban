// All candidates replay the same captures against the same unchanged domain handlers. Generated
// request acceptance is checked independently so a permissive document cannot hide parser differences.

import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/index.js';
import { resetTestDb } from '../../../src/db/resetTestDb.js';
import { compatibilityCases } from '../compatibilityCases.js';
import { captureCompatibilityCase, createCompatibilityFixture } from '../compatibilityHarness.js';
import { candidateFactories } from './candidates.js';
import { preflightApp } from './preflightApp.js';
import { documentValidator } from './documents.js';

function responseOf(observation: unknown): unknown {
  if (observation && typeof observation === 'object' && 'response' in observation) return observation.response;
  throw new Error('Capture has no response');
}

for (const create of candidateFactories) {
  const candidate = create();
  const prototype = preflightApp(candidate);
  const document = candidate.document();
  const responses = {
    item: documentValidator(document, 'ItemWrite'),
    project: documentValidator(document, 'ProjectWrite'),
    error: documentValidator(document, 'Error'),
  };
  describe(candidate.name, () => {
    it('preflight and body-parser errors retain the application CORS and JSON headers', async () => {
      const fixture = await createCompatibilityFixture();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const path = `/api/items/${fixture.ids.movingItem}/move`;
      for (const body of ['{}', '{']) {
        const baseline = await request(app).patch(path).set('Content-Type', 'application/json').send(body);
        const actual = await request(prototype).patch(path).set('Content-Type', 'application/json').send(body);
        expect(actual.status).toBe(baseline.status);
        expect(actual.body).toEqual(baseline.body);
        expect(actual.headers['access-control-allow-origin']).toBe('*');
        expect(actual.headers['access-control-allow-origin']).toBe(baseline.headers['access-control-allow-origin']);
        expect(actual.headers['content-type']).toBe(baseline.headers['content-type']);
      }
    });

    for (const example of compatibilityCases) {
      it(example.name, async () => {
        const baselineFixture = await createCompatibilityFixture(example.fixture);
        const baseline = await captureCompatibilityCase(app, example, baselineFixture);
        vi.restoreAllMocks();
        resetTestDb();
        const fixture = await createCompatibilityFixture(example.fixture);
        const actual = await captureCompatibilityCase(prototype, example, fixture);
        expect(actual).toEqual(baseline);
        if (example.method === 'patch') {
          const resource = example.path(fixture.ids).startsWith('/api/items/') ? 'item' : 'project';
          const responseKind = example.status >= 400 ? 'error' : resource;
          expect(candidate.responseValid(responseKind, responseOf(actual))).toBe(true);
          expect(responses[responseKind](responseOf(actual))).toBe(true);
        }
      });
    }

    it('generated request acceptance agrees with runtime schemas for the shared transport cases', async () => {
      const fixture = await createCompatibilityFixture();
      const document = candidate.document();
      const checks = {
        item: documentValidator(document, 'ItemMove'),
        project: documentValidator(document, 'ProjectMove'),
      };
      for (const example of compatibilityCases.filter(c => c.method === 'patch' && c.body)) {
        const resource = example.path(fixture.ids).startsWith('/api/items/') ? 'item' : 'project';
        const value = example.body!(fixture.ids);
        expect(checks[resource](value), example.name).toBe(candidate.requestValid(resource, value));
      }
    });
  });
}
