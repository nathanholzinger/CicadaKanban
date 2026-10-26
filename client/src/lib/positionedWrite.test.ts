import { describe, it, expect } from 'vitest';
import { applyWriteResponse } from './positionedWrite';
import type { Project } from '../types';
import type { ReindexedPosition } from '../api/shared';
import { makeItem } from '../test/itemFixture';
import { makeProject } from '../test/projectFixture';
import { workedList, workedResponse } from '../test/reindexFixtures';

const projectResponse = (written: Project, reindexed?: ReindexedPosition[]) => ({ ...written, reindexed });

// The client half of reindex disclosure (wiki positioning §7), over a list of items.
describe('applyWriteResponse, over items', () => {
  it('TC-5a.1: applies every reindexed pair the list holds, then the written item', () => {
    const result = applyWriteResponse(workedList(), workedResponse);
    const positionOf = (id: string) => result.find(i => i.id === id)!.position;
    expect([positionOf('A'), positionOf('X'), positionOf('C'), positionOf('E')]).toEqual([1, 2, 3, 4]);
    expect(result.find(i => i.id === 'X')).not.toHaveProperty('reindexed');
  });

  it('the written row wins over its own pair when they disagree — it is applied last', () => {
    const response = { ...makeItem('X', { position: 2.5 }), reindexed: [{ id: 'X', position: 2 }] };
    expect(applyWriteResponse(workedList(), response).find(i => i.id === 'X')!.position).toBe(2.5);
  });

  it('TC-5a.4: applies the pairs for ids the list holds and skips the rest — "not in this view," never missing data', () => {
    const response = {
      ...makeItem('X', { position: 2 }),
      reindexed: [
        { id: 'unseen', position: 1 },
        { id: 'A', position: 1.25 },
      ],
    };
    const result = applyWriteResponse(workedList(), response);
    expect(result.find(i => i.id === 'A')!.position).toBe(1.25);
    expect(result).toHaveLength(4);
    expect(result.some(i => i.id === 'unseen')).toBe(false);
  });

  it('TC-5a.1: with no reindex, replaces the written row by reference and leaves every other row untouched', () => {
    const before = workedList();
    const written = makeItem('X', { position: 3 });
    const result = applyWriteResponse(before, written);
    expect(result.find(i => i.id === 'X')).toBe(written);
    expect(result.find(i => i.id === 'A')).toBe(before[0]);
  });

  it('appends a written item the list does not yet hold (a create)', () => {
    const created = makeItem('N', { position: 10 });
    const result = applyWriteResponse(workedList(), created);
    expect(result).toHaveLength(5);
    expect(result[4]).toBe(created);
  });

  it("keeps a row's reference when its pair matches its current position", () => {
    const before = workedList();
    const response = { ...makeItem('X', { position: 2 }), reindexed: [{ id: 'A', position: 1.0 }] };
    expect(applyWriteResponse(before, response).find(i => i.id === 'A')).toBe(before[0]);
  });
});

describe('applyWriteResponse, over projects', () => {
  it('applies every renumbered pair the list holds, then the written project, and strips the pairs', () => {
    const list = [
      makeProject('A', { position: 1500 }),
      makeProject('B', { position: 1600 }),
      makeProject('X', { position: 4 }),
    ];
    const result = applyWriteResponse(
      list,
      projectResponse(makeProject('X', { position: 3 }), [
        { id: 'A', position: 1 },
        { id: 'B', position: 2 },
        { id: 'X', position: 3 },
        { id: 'elsewhere', position: 9 },
      ]),
    );
    expect(result.map(p => [p.id, p.position])).toEqual([
      ['A', 1],
      ['B', 2],
      ['X', 3],
    ]);
    expect(result.every(p => !('reindexed' in p))).toBe(true);
  });

  it('appends a written project the list does not hold yet, a create', () => {
    const result = applyWriteResponse(
      [makeProject('A', { position: 1 })],
      projectResponse(makeProject('N', { position: 2 })),
    );
    expect(result.map(p => p.id)).toEqual(['A', 'N']);
  });
});
