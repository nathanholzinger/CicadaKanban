import { describe, it, expect } from 'vitest';
import type { Item } from '../../types';
import { makeItem } from '../../test/itemFixture';
import { classifyDragTargets, isValidParent } from './dragClassification';

// Every depth case parameterizes on `cap` rather than a literal, so a change to the
// cap's value touches none of them.

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

// The one parent-legality answer: the region gate and the Descendants
// layer's over-cap cue both read it, off the same drag-start snapshot.
describe('isValidParent', () => {
  it('DRAG-1.7, DRAG-1.8: is true only for a Valid target — never depth-capped, cycle-forming, or unknown', () => {
    // X carries a one-level subtree (X1), so a parent at depth CAP - 1 is one too deep.
    const items = [item('X'), item('X1', 'X'), ...chain('d', CAP - 1), item('T')];
    const classification = classifyDragTargets('X', items, CAP);
    expect(isValidParent(classification, 'T')).toBe(true);
    expect(isValidParent(classification, `d${CAP - 2}`)).toBe(true);
    expect(isValidParent(classification, `d${CAP - 1}`)).toBe(false); // depth-capped
    expect(isValidParent(classification, 'X1')).toBe(false); // cycle-forming
    expect(isValidParent(classification, 'ghost')).toBe(false); // not on the board at drag start
  });
});

describe('classifyDragTargets — Card drag', () => {
  it('DRAG-2.1: a legal target is Valid', () => {
    const items = [item('X'), item('T')];
    expect(classifyDragTargets('X', items, CAP).states.get('T')).toBe('valid');
  });

  it('DRAG-2.2: the dragged item and every descendant are Cycle-forming, regardless of attachment', () => {
    const items = [
      item('X'),
      item('S', 'X'), // attached Stub inside X
      item('D', 'X', false), // detached — its own Card
      item('D1', 'D'), // D's child
      item('V'),
    ];
    const { states, subtreeIds } = classifyDragTargets('X', items, CAP);
    for (const id of ['X', 'S', 'D', 'D1']) expect(states.get(id)).toBe('cycle-forming');
    expect(states.get('V')).toBe('valid');
    // The one derivation of "the dragged subtree" — the same set the
    // cycle-forming states above encode, exposed directly rather than
    // re-derived by filtering them.
    expect(subtreeIds).toEqual(new Set(['X', 'S', 'D', 'D1']));
  });

  describe('the tier of each target: what it can be to the carried item', () => {
    // X is a Free Card carrying two levels: a Stub S with a Stub S1 of its own, and a Free
    // descendant D with a Stub DS. A chain T1..T{CAP} is the target the cap cuts: with X two
    // levels deep, T{CAP - 3} is the last legal parent, and T{CAP - 2} on down are too deep.
    const T = (depth: number) => `T${depth}`;
    const items = [
      item('X'),
      item('S', 'X'),
      item('S1', 'S'),
      item('D', 'X', false),
      item('DS', 'D'),
      ...chain('T', CAP),
      item('FC', T(CAP - 3), false), // a Free Card too deep to take X, under the last legal parent
      item('V'), // a Free Card that fits
      item('VS', 'V'), // and its Stub
    ];
    const { tiers } = classifyDragTargets('X', items, CAP);

    it('is "parent" for a legal parent, a Free Card or a Stub', () => {
      for (const id of ['V', 'VS', T(CAP - 3)]) expect(tiers.get(id), id).toBe('parent');
    });

    it('is "anchor" for a Free Card that is no legal parent, whatever its parent, and for a Stub too deep under a legal parent', () => {
      expect(tiers.get('D')).toBe('anchor'); // a Free descendant: cycle-forming
      expect(tiers.get('FC')).toBe('anchor'); // depth-capped, and a Stub's parent is not what makes a Card an anchor
      expect(tiers.get(T(CAP - 2))).toBe('anchor'); // depth-capped Stub, its parent a legal one
    });

    it('is "neither" for a Stub whose parent is no legal parent, at any depth below it', () => {
      expect(tiers.get('S')).toBe('neither'); // X's own descendants: under the carried item
      expect(tiers.get('S1')).toBe('neither');
      expect(tiers.get('DS')).toBe('neither'); // a Stub inside a Free descendant's Card
      expect(tiers.get(T(CAP - 1))).toBe('neither'); // under an anchor-only Stub
      expect(tiers.get(T(CAP))).toBe('neither');
    });

    it('is none for the carried item', () => {
      expect(tiers.has('X')).toBe(false);
    });

    it('is none for an id that is not on the board, and a tier for every other item', () => {
      expect(tiers.has('ghost')).toBe(false);
      expect([...tiers.keys()].sort()).toEqual(
        items
          .filter(i => i.id !== 'X')
          .map(i => i.id)
          .sort(),
      );
    });

    it('is one tier per item for a dragged Stub: its descendants "neither", its sibling and parent "parent"', () => {
      const stubs = [item('P'), item('S1', 'P'), item('S1a', 'S1'), item('S1a1', 'S1a'), item('S2', 'P')];
      const stubTiers = classifyDragTargets('S1', stubs, CAP).tiers;
      expect(stubTiers.get('S1a')).toBe('neither');
      expect(stubTiers.get('S1a1')).toBe('neither');
      expect(stubTiers.get('S2')).toBe('parent');
      expect(stubTiers.get('P')).toBe('parent');
      expect(stubTiers.has('S1')).toBe(false);
    });

    it('reads a descendant by the Stub test it is handed, not its stored attachment', () => {
      // C is stored detached but its attach is in flight, so the board draws it as a Stub of X's, which
      // a Stub of the carried item can't be named for. A is stored attached but its detach is in
      // flight, so it is a Card of its own.
      const pending = [item('X'), item('A', 'X'), item('C', 'X', false)];
      const drawnAsStub = (i: Item) => i.id === 'C';
      const handed = classifyDragTargets('X', pending, CAP, drawnAsStub).tiers;
      expect(handed.get('C')).toBe('neither');
      expect(handed.get('A')).toBe('anchor');
    });
  });

  it.each([4, 6, 8])('DRAG-2.3: depth-caps a target one level too deep, parameterized on cap = %i', cap => {
    // T_ok at depth cap - 1 with a leaf mover: exactly cap. T_over sits under it.
    const targets = chain('T', cap); // T1..T{cap}: T{cap-1} is T_ok, T{cap} is T_over
    const items = [...targets, item('X')];
    const { states } = classifyDragTargets('X', items, cap);
    expect(states.get(`T${cap - 1}`)).toBe('valid');
    expect(states.get(`T${cap}`)).toBe('depth-capped');
  });

  it('ATT-4.5: subtree height counts detached descendants, as classification reads it', () => {
    // X has an attached child (h=1 via that branch) and a detached child
    // with its own child (h=2). A target at depth CAP - 2 admits h = 1 but
    // not h = 2.
    const items = [...chain('T', CAP - 2), item('X'), item('X1', 'X'), item('X2', 'X', false), item('X2a', 'X2')];
    expect(classifyDragTargets('X', items, CAP).states.get(`T${CAP - 2}`)).toBe('depth-capped');
    // Remove the deeper branch and the same target is fine.
    const shallower = items.filter(i => i.id !== 'X2a');
    expect(classifyDragTargets('X', shallower, CAP).states.get(`T${CAP - 2}`)).toBe('valid');
  });

  it('DRAG-2.7: Stubs are classified individually — no blanket exclusion', () => {
    // P's Stub is at depth 2: legal for a leaf. Q's Stub sits at the bottom
    // of a chain and would put X past the cap.
    const q = chain('Q', CAP); // Q{cap} is a Stub at depth cap
    const items = [item('X'), item('P'), item('S_P', 'P'), ...q];
    const { states } = classifyDragTargets('X', items, CAP);
    expect(states.get('S_P')).toBe('valid');
    expect(states.get(`Q${CAP}`)).toBe('depth-capped');
  });

  it('DRAG-2.9: cycle-forming wins over depth-capped for a deep descendant', () => {
    const items = [item('X'), ...chain('D', CAP).map(d => (d.id === 'D1' ? { ...d, parentId: 'X' } : d))];
    expect(classifyDragTargets('X', items, CAP).states.get(`D${CAP}`)).toBe('cycle-forming');
  });

  it('classifies every item on the board, and nothing else', () => {
    const items = [item('X'), item('A'), item('B', 'A')];
    const { states } = classifyDragTargets('X', items, CAP);
    expect([...states.keys()].sort()).toEqual(['A', 'B', 'X']);
  });

  it('returns an empty classification for an unknown active id', () => {
    const { states, tiers } = classifyDragTargets('ghost', [item('A')], CAP);
    expect(states.size).toBe(0);
    expect(tiers.size).toBe(0);
  });
});

describe('DRAG-2.8: classifyDragTargets — Stub drag (full classification)', () => {
  it('a Stub is classified exactly like a Card would be — its own parent, its siblings, and every other Card/Stub included, no blanket exclusion', () => {
    const items = [item('P'), item('S1', 'P'), item('S2', 'P'), item('Q'), item('SQ', 'Q'), item('V')];
    const { states } = classifyDragTargets('S1', items, CAP);
    expect(states.get('S1')).toBe('cycle-forming');
    // S1's own parent P is a legal target (S1 is already under it, well within
    // depth), Q and its Stub are ordinary Valid targets (the zoom-in reparent,
    // DRAG-5.4), and a sibling is Valid.
    expect(states.get('S2')).toBe('valid');
    expect(states.get('P')).toBe('valid');
    expect(states.get('Q')).toBe('valid');
    expect(states.get('SQ')).toBe('valid');
    expect(states.get('V')).toBe('valid');
  });

  it("a Stub's own descendants are still Cycle-forming, the Free ones an anchor and the Stubs neither", () => {
    const items = [item('P'), item('S1', 'P'), item('S1a', 'S1'), item('S1b', 'S1', false)];
    const { states, tiers } = classifyDragTargets('S1', items, CAP);
    expect(states.get('S1a')).toBe('cycle-forming');
    expect(states.get('S1b')).toBe('cycle-forming');
    expect(tiers.get('S1a')).toBe('neither');
    expect(tiers.get('S1b')).toBe('anchor');
  });

  it.each([4, 6, 8])('depth-caps a target one level too deep for a Stub drag exactly like a Card, cap = %i', cap => {
    const targets = chain('T', cap);
    const items = [...targets, item('P'), item('S1', 'P')];
    const { states } = classifyDragTargets('S1', items, cap);
    expect(states.get(`T${cap - 1}`)).toBe('valid');
    expect(states.get(`T${cap}`)).toBe('depth-capped');
  });
});
