import { describe, it, expect } from 'vitest';
import { applyWriteResponse } from './positionedWrite';
import type { Project } from '../types';
import type { ReindexedPosition } from '../api/shared';

function project(id: string, position: number | null): Project {
  return { id, parentId: null, name: id, description: null, position, createdAt: 0, updatedAt: 0 };
}

const response = (written: Project, reindexed?: ReindexedPosition[]) => ({ ...written, reindexed });

describe('applyWriteResponse, over projects', () => {
  it('applies every renumbered pair the list holds, then the written project, and strips the pairs', () => {
    const list = [project('A', 1500), project('B', 1600), project('X', 4)];
    const result = applyWriteResponse(
      list,
      response(project('X', 3), [
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
    const result = applyWriteResponse([project('A', 1)], response(project('N', 2)));
    expect(result.map(p => p.id)).toEqual(['A', 'N']);
  });
});
