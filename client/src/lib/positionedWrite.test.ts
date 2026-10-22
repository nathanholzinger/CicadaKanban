import { describe, it, expect } from 'vitest';
import { applyWriteResponse } from './positionedWrite';
import type { Project } from '../types';
import type { ReindexedPosition } from '../api/shared';
import { makeProject } from '../test/projectFixture';

const response = (written: Project, reindexed?: ReindexedPosition[]) => ({ ...written, reindexed });

describe('applyWriteResponse, over projects', () => {
  it('applies every renumbered pair the list holds, then the written project, and strips the pairs', () => {
    const list = [
      makeProject('A', { position: 1500 }),
      makeProject('B', { position: 1600 }),
      makeProject('X', { position: 4 }),
    ];
    const result = applyWriteResponse(
      list,
      response(makeProject('X', { position: 3 }), [
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
    const result = applyWriteResponse([makeProject('A', { position: 1 })], response(makeProject('N', { position: 2 })));
    expect(result.map(p => p.id)).toEqual(['A', 'N']);
  });
});
