import { describe, expect, it } from 'vitest';
import { candidateFactories } from './candidates.js';
import { generateTypes, documentValidator } from './documents.js';
import {
  basicConsumer,
  compileConsumer,
  fixtureConsumer,
  optionalFieldConsumer,
  responseFieldConsumer,
} from './typeChecks.js';
import { app } from '../../../src/index.js';
import { createCompatibilityFixture, captureCompatibilityCase } from '../compatibilityHarness.js';
import { compatibilityCases } from '../compatibilityCases.js';

for (const create of candidateFactories) {
  describe(`${create().name} field changes`, () => {
    it('generated types compile with a representative existing consumer', async () => {
      expect(compileConsumer(await generateTypes(create().document()), basicConsumer)).toEqual([]);
    });

    it('an optional request field updates generated typing from one authoring site', async () => {
      const baseline = create();
      const changed = create('optional-request-field');
      const oldTypes = await generateTypes(baseline.document());
      const newTypes = await generateTypes(changed.document());
      expect(newTypes).not.toBe(oldTypes);
      expect(compileConsumer(oldTypes, optionalFieldConsumer).length).toBeGreaterThan(0);
      expect(compileConsumer(newTypes, optionalFieldConsumer)).toEqual([]);
      expect(changed.requestValid('item', { workphaseId: null, clientNote: 'note' })).toBe(true);
      expect(changed.requestValid('item', { workphaseId: null, clientNote: 7 })).toBe(false);
    });

    it('a required response field reaches types and rejects an unchanged real response', async () => {
      const fixture = await createCompatibilityFixture();
      const example = compatibilityCases.find(c => c.name.includes('invalid side ignored without anchor'))!;
      const observed = await captureCompatibilityCase(app, example, fixture);
      if (!observed || typeof observed !== 'object' || !('response' in observed)) throw new Error('Missing response');
      const baseline = create();
      const changed = create('required-response-field');
      const oldTypes = await generateTypes(baseline.document());
      const newTypes = await generateTypes(changed.document());
      expect(compileConsumer(oldTypes, responseFieldConsumer).length).toBeGreaterThan(0);
      expect(compileConsumer(newTypes, responseFieldConsumer)).toEqual([]);
      expect(compileConsumer(oldTypes, fixtureConsumer(observed.response))).toEqual([]);
      expect(compileConsumer(newTypes, fixtureConsumer(observed.response)).length).toBeGreaterThan(0);
      expect(baseline.responseValid('item', observed.response)).toBe(true);
      expect(changed.responseValid('item', observed.response)).toBe(false);
      expect(documentValidator(changed.document(), 'ItemWrite')(observed.response)).toBe(false);
    });

    it('removing workphase nullability breaks an existing typed caller and both validators', async () => {
      const changed = create('workphase-not-null');
      expect(compileConsumer(await generateTypes(changed.document()), basicConsumer).length).toBeGreaterThan(0);
      expect(changed.requestValid('item', { workphaseId: null })).toBe(false);
      expect(documentValidator(changed.document(), 'ItemMove')({ workphaseId: null })).toBe(false);
      expect(create().requestValid('item', { workphaseId: null })).toBe(true);
    });
  });
}
