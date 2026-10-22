import { describe, it, expect } from 'vitest';
import {
  computeColumnRange,
  isColumnBroken,
  getCoveredWorkphases,
  columnsOverlap,
  computeUnsorted,
} from '../../src/lib/columnRanges.js';
import { buildRankMap } from '../../src/lib/workphaseOrder.js';

// lib/columnRanges.ts over workphases given directly, with no database.

function phase(id: string, position: number) {
  return {
    id,
    position,
    name: id,
    workflowId: 'w',
    agentId: null,
    triggersNotification: 0,
    isTerminal: 0,
    createdAt: 0,
  };
}

describe('column range helpers', () => {
  const phases = [phase('a', 1), phase('b', 2), phase('c', 3), phase('d', 4)];
  const rankMap = buildRankMap(phases);

  it('buildRankMap assigns ordinal ranks in position order', () => {
    expect(rankMap.get('a')).toBe(0);
    expect(rankMap.get('d')).toBe(3);
  });

  it('computeColumnRange resolves a normal (non-inverted) range', () => {
    expect(computeColumnRange({ startWorkphaseId: 'b', endWorkphaseId: 'c' }, rankMap)).toEqual([1, 2]);
  });

  it('computeColumnRange uses min/max so an inverted range still resolves', () => {
    expect(computeColumnRange({ startWorkphaseId: 'c', endWorkphaseId: 'b' }, rankMap)).toEqual([1, 2]);
  });

  it('isColumnBroken is false for a normal range and true for an inverted one', () => {
    expect(isColumnBroken({ startWorkphaseId: 'b', endWorkphaseId: 'c' }, rankMap)).toBe(false);
    expect(isColumnBroken({ startWorkphaseId: 'c', endWorkphaseId: 'b' }, rankMap)).toBe(true);
  });

  it('getCoveredWorkphases returns the inclusive slice between start and end', () => {
    const covered = getCoveredWorkphases({ startWorkphaseId: 'b', endWorkphaseId: 'd' }, phases, rankMap);
    expect(covered.map(w => w.id)).toEqual(['b', 'c', 'd']);
  });

  it('columnsOverlap detects overlapping and non-overlapping ranges', () => {
    const rangeA = { startWorkphaseId: 'a', endWorkphaseId: 'b' };
    const rangeB = { startWorkphaseId: 'b', endWorkphaseId: 'c' };
    const rangeC = { startWorkphaseId: 'c', endWorkphaseId: 'd' };
    expect(columnsOverlap(rangeA, rangeB, rankMap)).toBe(true);
    expect(columnsOverlap(rangeA, rangeC, rankMap)).toBe(false);
  });

  it('treats unknown workphase ids as unresolvable: null range, broken column, no overlap', () => {
    const withUnknown = { startWorkphaseId: 'a', endWorkphaseId: 'zz' };
    expect(computeColumnRange(withUnknown, rankMap)).toBeNull();
    expect(isColumnBroken(withUnknown, rankMap)).toBe(true);
    expect(columnsOverlap(withUnknown, { startWorkphaseId: 'a', endWorkphaseId: 'b' }, rankMap)).toBe(false);
  });

  it('computeUnsorted reports uncovered workphases and invalid item references', () => {
    const columnsForBoard = [{ startWorkphaseId: 'a', endWorkphaseId: 'b' }];
    const workflowItems = [
      { id: 'i1', workphaseId: 'a' },
      { id: 'i2', workphaseId: 'z' }, // not a real workphase in this workflow
      { id: 'i3', workphaseId: null },
    ];
    const { uncovered, invalidItems } = computeUnsorted(phases, columnsForBoard, rankMap, workflowItems);
    expect(uncovered.map(w => w.id)).toEqual(['c', 'd']);
    expect(invalidItems.map(i => i.id)).toEqual(['i2', 'i3']);
  });
});
