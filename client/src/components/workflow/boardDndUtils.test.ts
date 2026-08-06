import { describe, it, expect } from 'vitest';
import {
  buildColumnForWorkphaseMap,
  resolveDropWorkphaseId,
  computeSameWorkphaseReorder,
  computeDropPosition,
  subrowContainerId,
  type DropColumn,
  type PositionedItem,
} from './boardDndUtils';

function column(id: string, workphaseIds: string[], overrides: Partial<DropColumn> = {}): DropColumn {
  return {
    id,
    broken: false,
    displayMode: 'merged',
    entryWorkphaseId: workphaseIds[0],
    subRows: workphaseIds.map(w => ({ workphase: { id: w } })),
    ...overrides,
  };
}

function item(id: string, position: number | null): PositionedItem {
  return { id, position };
}

// Board fixture: merged col-1 covers [todo, review], expanded col-2 covers
// [dev, qa], broken col-3 covers [old].
const columns = [
  column('col-1', ['todo', 'review']),
  column('col-2', ['dev', 'qa'], { displayMode: 'expanded' }),
  column('col-3', ['old'], { broken: true }),
];
const columnMap = buildColumnForWorkphaseMap(columns);

// Card lookup used by the hover-a-card path.
const cardWorkphases: Record<string, string> = {
  'card-in-review': 'review',
  'card-in-qa': 'qa',
  'card-in-old': 'old',
  'card-unplaced': '',
};
const findWorkphaseForItem = (id: string) => cardWorkphases[id] || null;

function resolve(overId: string): string | null {
  return resolveDropWorkphaseId(overId, columns, columnMap, findWorkphaseForItem);
}

describe('subrowContainerId', () => {
  it('encodes column and workphase into the droppable id', () => {
    expect(subrowContainerId('col-2', 'qa')).toBe('subrow::col-2::qa');
  });
});

describe('buildColumnForWorkphaseMap', () => {
  it('maps every covered workphase to its column', () => {
    expect(columnMap.get('todo')?.id).toBe('col-1');
    expect(columnMap.get('review')?.id).toBe('col-1');
    expect(columnMap.get('qa')?.id).toBe('col-2');
    expect(columnMap.has('elsewhere')).toBe(false);
  });
});

describe('resolveDropWorkphaseId', () => {
  it('resolves a sub-row droppable to its workphase', () => {
    expect(resolve(subrowContainerId('col-2', 'qa'))).toBe('qa');
  });

  it('rejects a sub-row of a broken column', () => {
    expect(resolve(subrowContainerId('col-3', 'old'))).toBeNull();
  });

  it('resolves hovering a merged column to its entry workphase', () => {
    expect(resolve('col-1')).toBe('todo');
  });

  it("rejects an expanded column's outer wrapper — a specific sub-row is required", () => {
    expect(resolve('col-2')).toBeNull();
  });

  it('rejects a broken column outright', () => {
    expect(resolve('col-3')).toBeNull();
  });

  it("resolves hovering a card in a merged column to the column's entry workphase", () => {
    expect(resolve('card-in-review')).toBe('todo');
  });

  it("resolves hovering a card in an expanded column to the card's own workphase", () => {
    expect(resolve('card-in-qa')).toBe('qa');
  });

  it('rejects a card whose column is broken, and unresolvable targets', () => {
    expect(resolve('card-in-old')).toBeNull();
    expect(resolve('card-unplaced')).toBeNull();
    expect(resolve('something-unknown')).toBeNull();
  });
});

describe('computeSameWorkphaseReorder', () => {
  const items = [item('a', 1), item('b', 2), item('c', 3)];

  it('moves the active item to the hovered slot and reindexes 1..n', () => {
    expect(computeSameWorkphaseReorder(items, 'a', 'c')).toEqual([
      { id: 'b', position: 1 },
      { id: 'c', position: 2 },
      { id: 'a', position: 3 },
    ]);
  });

  it('returns null when nothing changes or an id is unknown', () => {
    expect(computeSameWorkphaseReorder(items, 'b', 'b')).toBeNull();
    expect(computeSameWorkphaseReorder(items, 'ghost', 'c')).toBeNull();
    expect(computeSameWorkphaseReorder(items, 'a', 'ghost')).toBeNull();
  });
});

describe('computeDropPosition', () => {
  const items = [item('a', 1), item('b', 2), item('c', 3)];

  it('appends past the max when dropping on a container', () => {
    expect(computeDropPosition(items, 'ignored', true)).toBe(4.0);
  });

  it('starts at 1.0 in an empty workphase', () => {
    expect(computeDropPosition([], 'ignored', false)).toBe(1.0);
  });

  it('slots at the midpoint when dropped between two cards', () => {
    expect(computeDropPosition(items, 'b', false)).toBe(1.5);
  });

  it('prepends before the first card', () => {
    expect(computeDropPosition(items, 'a', false)).toBe(0.5);
  });

  it('uses index-based fallbacks for neighbors with unset positions', () => {
    const unset = [item('a', null), item('b', null)];
    // Dropping on 'b' (overIndex 1): both unset neighbors fall back to the
    // drop index — prev -> overIndex (1), next -> overIndex + 1 (2) -> midpoint 1.5.
    expect(computeDropPosition(unset, 'b', false)).toBe(1.5);
  });
});
