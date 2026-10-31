// Bounded JSON-shape probes compare staged parsing with aggregate Zod/emitted acceptance.
// Exact errors, parser exceptions, domain failures and no-write effects remain in HTTP captures.

import { describe, expect, it } from 'vitest';
import { contractSchemas, createContractDocument } from '../../src/schemas/openapi.js';
import { parseItemMove } from '../../src/schemas/items.js';
import { parseProjectMove } from '../../src/schemas/projects.js';
import { documentValidator } from '../../../tools/api-contracts/document.js';

const values = [null, '', false, true, 0, 'row', 'before', 'after', [], [null], {}];
function probes(fields: string[], bases: Record<string, unknown>[]) {
  const bodies: unknown[] = [[], [null], ...bases];
  for (const base of bases) {
    for (const field of fields) for (const value of values) bodies.push({ ...base, [field]: value });
    for (const [i, first] of fields.entries())
      for (const second of fields.slice(i + 1)) bodies.push({ ...base, [first]: 42, [second]: false });
  }
  return bodies;
}

describe('bounded structural parse parity', () => {
  it('item stages preserve aggregate/document acceptance and do not mutate JSON inputs', () => {
    const emitted = documentValidator(createContractDocument(), 'ItemMove');
    const bodies = probes(
      ['position', 'parentId', 'isAttached', 'workphaseId', 'anchorId', 'side', 'scopeWorkphaseIds', 'surprise'],
      [{}, { workphaseId: null }, { anchorId: 'row', side: 'after' }],
    );
    expect(bodies).toHaveLength(353);
    for (const body of bodies) {
      const before = structuredClone(body);
      const accepted = contractSchemas.ItemMove.safeParse(body).success;
      expect(!parseItemMove(body).error, JSON.stringify(body)).toBe(accepted);
      expect(emitted(body), JSON.stringify(body)).toBe(accepted);
      expect(body).toEqual(before);
    }
  });

  it('project stages preserve aggregate/document acceptance and explicit array normalization', () => {
    const emitted = documentValidator(createContractDocument(), 'ProjectMove');
    const bodies = probes(['position', 'parentId', 'prevId', 'nextId', 'surprise'], [{}, { prevId: 'row' }]);
    expect(bodies).toHaveLength(134);
    for (const body of bodies) {
      const before = structuredClone(body);
      const accepted = contractSchemas.ProjectMove.safeParse(body).success;
      expect(!parseProjectMove(body).error, JSON.stringify(body)).toBe(accepted);
      expect(emitted(body), JSON.stringify(body)).toBe(accepted);
      expect(body).toEqual(before);
    }
    expect(parseProjectMove([]).data).toEqual({});
    for (const missing of [undefined, null]) {
      expect(() => parseItemMove(missing)).toThrow(TypeError);
      expect(() => parseProjectMove(missing)).toThrow(TypeError);
    }
  });
});
