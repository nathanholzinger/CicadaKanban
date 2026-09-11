import { describe, it, expect } from 'vitest';
import type { Item } from '../../types';
import { makeItem } from '../../test/itemFixture';
import { classifyDragTargets, isWithinDepthCap } from './dragClassification';

// Cases follow docs/test-plans/board-drag-interaction/drag-2-target-
// classification.md (DRAG-2.n). Every depth case parameterizes on `cap`
// rather than a literal, per ATT-4.8.

// Positional alias over the shared fixture — these cases only ever vary
// parent and attachment (positionScope follows from those, per makeItem).
function item(id: string, parentId: string | null = null, attached = true): Item {
  return makeItem(id, { parentId, isAttached: attached ? 1 : 0, position: 1 });
}

// A root -> ... chain of `length` items named `${prefix}1..N`; returns them.
function chain(prefix: string, length: number): Item[] {
  const out: Item[] = [];
  for (let d = 1; d <= length; d++) out.push(item(`${prefix}${d}`, d === 1 ? null : `${prefix}${d - 1}`));
  return out;
}

const CAP = 6;

describe('isWithinDepthCap', () => {
  it('is the whole rule: D + 1 + h <= cap', () => {
    expect(isWithinDepthCap(1, 0, CAP)).toBe(true); // root target, leaf mover
    expect(isWithinDepthCap(CAP - 1, 0, CAP)).toBe(true); // exactly cap
    expect(isWithinDepthCap(CAP, 0, CAP)).toBe(false); // one deeper target
    expect(isWithinDepthCap(CAP - 1, 1, CAP)).toBe(false); // one more level under the mover
  });
});

describe('classifyDragTargets — Card drag', () => {
  it('a legal target is Valid (DRAG-2.1)', () => {
    const items = [item('X'), item('T')];
    expect(classifyDragTargets('X', items, CAP).states.get('T')).toBe('valid');
  });

  it('the dragged item and every descendant are Cycle-forming, regardless of attachment (DRAG-2.2)', () => {
    const items = [
      item('X'),
      item('S', 'X'), // attached Stub inside X
      item('D', 'X', false), // detached — its own Card
      item('D1', 'D'), // D's child
      item('V'),
    ];
    const { states } = classifyDragTargets('X', items, CAP);
    for (const id of ['X', 'S', 'D', 'D1']) expect(states.get(id)).toBe('cycle-forming');
    expect(states.get('V')).toBe('valid');
  });

  it('only the Free descendants carry the relationship marker (DRAG-2.5)', () => {
    const items = [item('X'), item('S', 'X'), item('D', 'X', false), item('D1', 'D'), item('D2', 'D', false)];
    const { freeDescendantIds } = classifyDragTargets('X', items, CAP);
    expect(freeDescendantIds).toEqual(new Set(['D', 'D2']));
  });

  it.each([4, 6, 8])('depth-caps a target one level too deep, parameterized on cap = %i (DRAG-2.3, 2.6)', cap => {
    // T_ok at depth cap - 1 with a leaf mover: exactly cap. T_over sits under it.
    const targets = chain('T', cap); // T1..T{cap}: T{cap-1} is T_ok, T{cap} is T_over
    const items = [...targets, item('X')];
    const { states } = classifyDragTargets('X', items, cap);
    expect(states.get(`T${cap - 1}`)).toBe('valid');
    expect(states.get(`T${cap}`)).toBe('depth-capped');
  });

  it('subtree height counts detached descendants (ATT-4.5 via classification)', () => {
    // X has an attached child (h=1 via that branch) and a detached child
    // with its own child (h=2). A target at depth CAP - 2 admits h = 1 but
    // not h = 2.
    const items = [...chain('T', CAP - 2), item('X'), item('X1', 'X'), item('X2', 'X', false), item('X2a', 'X2')];
    expect(classifyDragTargets('X', items, CAP).states.get(`T${CAP - 2}`)).toBe('depth-capped');
    // Remove the deeper branch and the same target is fine.
    const shallower = items.filter(i => i.id !== 'X2a');
    expect(classifyDragTargets('X', shallower, CAP).states.get(`T${CAP - 2}`)).toBe('valid');
  });

  it('Stubs are classified individually — no blanket exclusion (DRAG-2.7)', () => {
    // P's Stub is at depth 2: legal for a leaf. Q's Stub sits at the bottom
    // of a chain and would put X past the cap.
    const q = chain('Q', CAP); // Q{cap} is a Stub at depth cap
    const items = [item('X'), item('P'), item('S_P', 'P'), ...q];
    const { states } = classifyDragTargets('X', items, CAP);
    expect(states.get('S_P')).toBe('valid');
    expect(states.get(`Q${CAP}`)).toBe('depth-capped');
  });

  it('cycle-forming wins over depth-capped for a deep descendant', () => {
    const items = [item('X'), ...chain('D', CAP).map(d => (d.id === 'D1' ? { ...d, parentId: 'X' } : d))];
    expect(classifyDragTargets('X', items, CAP).states.get(`D${CAP}`)).toBe('cycle-forming');
  });

  it('classifies every item on the board, and nothing else', () => {
    const items = [item('X'), item('A'), item('B', 'A')];
    const { states } = classifyDragTargets('X', items, CAP);
    expect([...states.keys()].sort()).toEqual(['A', 'B', 'X']);
  });

  it('returns an empty classification for an unknown active id', () => {
    const { states, freeDescendantIds } = classifyDragTargets('ghost', [item('A')], CAP);
    expect(states.size).toBe(0);
    expect(freeDescendantIds.size).toBe(0);
  });
});

describe('classifyDragTargets — Stub drag (interim until Story 5)', () => {
  it('siblings under the same parent are Valid; everything else is Inert', () => {
    const items = [item('P'), item('S1', 'P'), item('S2', 'P'), item('Q'), item('SQ', 'Q'), item('V')];
    const { states } = classifyDragTargets('S1', items, CAP);
    expect(states.get('S1')).toBe('cycle-forming');
    expect(states.get('S2')).toBe('valid');
    expect(states.get('P')).toBe('inert');
    expect(states.get('Q')).toBe('inert');
    expect(states.get('SQ')).toBe('inert');
    expect(states.get('V')).toBe('inert');
  });

  it("a Stub's own descendants are still Cycle-forming, and its Free ones still marked", () => {
    const items = [item('P'), item('S1', 'P'), item('S1a', 'S1'), item('S1b', 'S1', false)];
    const { states, freeDescendantIds } = classifyDragTargets('S1', items, CAP);
    expect(states.get('S1a')).toBe('cycle-forming');
    expect(states.get('S1b')).toBe('cycle-forming');
    expect(freeDescendantIds).toEqual(new Set(['S1b']));
  });
});
