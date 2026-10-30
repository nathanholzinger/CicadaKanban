// Characterizes existing transport behavior with exact response and database-change snapshots.
// Additional checks here do not replace the domain-rule tests or turn observed behavior into product rules.

import { describe, expect, it } from 'vitest';
import { app } from '../../src/index.js';
import { compatibilityCases } from './compatibilityCases.js';
import { captureCompatibilityCase, createCompatibilityFixture } from './compatibilityHarness.js';

describe('HTTP compatibility corpus', () => {
  for (const example of compatibilityCases) {
    it(example.name, async () => {
      const fixture = await createCompatibilityFixture(example.fixture);
      const result = await captureCompatibilityCase(app, example, fixture);
      expect(result).toMatchSnapshot();
    });
  }
});
