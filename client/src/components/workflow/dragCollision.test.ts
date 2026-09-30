import { describe, it, expect } from 'vitest';
import type { CollisionDetection, Over } from '@dnd-kit/core';
import { rect } from '../../test/dragFixtures';
import { SHORT_CARD_HEIGHT_PX, STUB_ROW_HEIGHT_PX } from '../cardMetrics';
import {
  dropAnchorFor,
  resolveBoardCollisions,
  resolveDropSide,
  columnData,
  isColumnData,
  isItemData,
  itemRowData,
  namedAnchorFor,
  travelingRowsFor,
  type CollisionSession,
} from './dragCollision';

// Minimal fixture for the collision detection's args — by default every
// candidate gets an identical rect, close enough to the pointer that
// closestCorners would happily pick any of them; the interesting assertion
// is which ones survive the *filter* before closestCorners ever runs, not
// the geometry itself. A container may carry its own rect for the
// in-context containment rule.
const SAME_RECT = rect(0, 0, 10, 10);

type Container = { id: string; data: Record<string, unknown>; rect?: ReturnType<typeof rect> };

function collisionArgs(
  activeId: string,
  activeData: Record<string, unknown>,
  containers: Container[],
): Parameters<CollisionDetection>[0] {
  return {
    active: { id: activeId, data: { current: activeData }, rect: { current: SAME_RECT } } as never,
    collisionRect: SAME_RECT as never,
    droppableRects: new Map(containers.map(c => [c.id, c.rect ?? SAME_RECT])) as never,
    droppableContainers: containers.map(c => ({
      id: c.id,
      data: { current: c.data },
      rect: { current: c.rect ?? SAME_RECT },
    })) as never,
    pointerCoordinates: { x: 5, y: 5 },
  };
}

describe('resolveBoardCollisions', () => {
  it('never collides an item with itself', () => {
    const result = resolveBoardCollisions(
      collisionArgs('card-a', itemRowData('card'), [{ id: 'card-a', data: itemRowData('card') }]),
      null,
    );
    expect(result).toHaveLength(0);
  });

  it('excludes Stub rows from a Card drag (the collision-hijack bug this guards against)', () => {
    // A card being dragged must never resolve onto its own (or any)
    // attached child, even when that child's rect happens to be closest:
    // the nested row would hijack its parent's cross-column drop.
    const result = resolveBoardCollisions(
      collisionArgs('card-a', itemRowData('card'), [
        { id: 'child-1', data: itemRowData('stub', 'card-a') },
        { id: 'col-1', data: columnData() },
      ]),
      null,
    );
    expect(result.map(r => r.id)).not.toContain('child-1');
    expect(result.map(r => r.id)).toContain('col-1');
  });

  // The Descendants-context scope comes from the *live session's* own
  // measured section rect (`descendantsSectionRect`), never from the active
  // row's own `data`: every Stub row inside it is a candidate, at any depth
  // and under any real `parentId`.
  it("scopes a Descendants context's collisions to every Stub row inside the section's rect, any real parent", () => {
    const sectionRect = rect(0, 0, 100, 400);
    const session: CollisionSession = { hoverContainerId: null, context: null, descendantsSectionRect: sectionRect };
    const result = resolveBoardCollisions(
      collisionArgs('child-a', itemRowData('stub', 'parent-1'), [
        { id: 'child-b', data: itemRowData('stub', 'parent-1'), rect: rect(5, 10, 90, 20) }, // inside, true sibling
        { id: 'grandchild-c', data: itemRowData('stub', 'parent-2'), rect: rect(5, 40, 90, 20) }, // inside, different real parent — still a candidate
        { id: 'other-section-d', data: itemRowData('stub', 'parent-3'), rect: rect(500, 0, 90, 20) }, // outside the rect — a different card's section
        { id: 'col-1', data: columnData(), rect: rect(0, 0, 100, 400) }, // never a valid target for a Descendants-context drag
      ]),
      session,
    );
    expect(result.map(r => r.id)).toContain('child-b');
    expect(result.map(r => r.id)).toContain('grandchild-c');
    expect(result.map(r => r.id)).not.toContain('other-section-d');
    expect(result.map(r => r.id)).not.toContain('col-1');
  });

  // As at a column, holding still over its own slot must be `over` itself:
  // excluding the dragged row moves the gap to a neighbor's, one off.
  it("a Descendants context: the dragged Stub's own row is a candidate too", () => {
    const sectionRect = rect(0, 0, 100, 400);
    const session: CollisionSession = { hoverContainerId: null, context: null, descendantsSectionRect: sectionRect };
    const ids = resolveBoardCollisions(
      collisionArgs('child-a', itemRowData('stub', 'parent-1'), [
        { id: 'child-a', data: itemRowData('stub', 'parent-1'), rect: rect(5, 10, 90, 20) },
        { id: 'child-b', data: itemRowData('stub', 'parent-1'), rect: rect(5, 40, 90, 20) },
      ]),
      session,
    ).map(c => c.id);
    expect(ids).toContain('child-a');
  });

  // The hazard: a Stub's row unmounts from its Descendants section and
  // remounts as a Card row for the *same* id mid-drag, so
  // `active.data.current.role` can lag one frame behind. Every policy
  // decision here is keyed off the live session (pure state) instead. This
  // feeds a deliberately *wrong* active role (`'card'`, as if the remount
  // hadn't been picked up yet) alongside a live session that says
  // otherwise, and asserts the outcome still matches the live session, not
  // the stale active data.
  it("never reads the active row's own role — a stale 'card' role alongside a live Descendants session still scopes correctly", () => {
    const sectionRect = rect(0, 0, 100, 400);
    const session: CollisionSession = { hoverContainerId: null, context: null, descendantsSectionRect: sectionRect };
    const result = resolveBoardCollisions(
      collisionArgs('child-a', itemRowData('card'), [
        { id: 'child-b', data: itemRowData('stub', 'parent-1'), rect: rect(5, 10, 90, 20) },
        { id: 'card-c', data: itemRowData('card'), rect: rect(5, 40, 90, 20) }, // never a candidate — a Card row, not a Stub
      ]),
      session,
    );
    expect(result.map(r => r.id)).toEqual(['child-b']);
  });

  describe('under the pop machine', () => {
    const context = { containerId: 'col-a', rect: rect(0, 0, 100, 400) };
    const containers: Container[] = [
      { id: 'col-a', data: columnData(), rect: rect(0, 0, 100, 400) },
      { id: 'card-a1', data: itemRowData('card'), rect: rect(5, 10, 90, 50) },
      { id: 'col-b', data: columnData(), rect: rect(120, 0, 100, 400) },
      { id: 'card-b1', data: itemRowData('card'), rect: rect(125, 10, 90, 50) },
      { id: 'child-1', data: itemRowData('stub', 'card-a1'), rect: rect(10, 30, 80, 20) },
    ];

    it('in-context: only the context container and the cards inside it are candidates', () => {
      const session: CollisionSession = { hoverContainerId: null, context, descendantsSectionRect: null };
      const ids = resolveBoardCollisions(collisionArgs('card-x', itemRowData('card'), containers), session).map(
        c => c.id,
      );
      expect(ids).toContain('col-a');
      expect(ids).toContain('card-a1');
      expect(ids).not.toContain('col-b');
      expect(ids).not.toContain('card-b1');
      expect(ids).not.toContain('child-1');
    });

    // As in stock dnd-kit sortable, the dragged card's own row is an
    // in-context candidate, so resting over its own slot is
    // `over` itself and nothing shuffles. Only a column drag (no session)
    // never collides with itself (the first case above).
    it("in-context: the dragged card's own row is a candidate too", () => {
      const session: CollisionSession = { hoverContainerId: null, context, descendantsSectionRect: null };
      const own: Container = { id: 'card-x', data: itemRowData('card'), rect: rect(5, 70, 90, 50) };
      const ids = resolveBoardCollisions(
        collisionArgs('card-x', itemRowData('card'), [...containers, own]),
        session,
      ).map(c => c.id);
      expect(ids).toContain('card-x');
    });

    it("hovering another region: `over` is exactly that region's container, never a card in it", () => {
      const session: CollisionSession = { hoverContainerId: 'col-b', context, descendantsSectionRect: null };
      expect(
        resolveBoardCollisions(collisionArgs('card-x', itemRowData('card'), containers), session).map(c => c.id),
      ).toEqual(['col-b']);
    });

    it('no context (picked up in Unsorted) and no hover: nothing to collide with', () => {
      const session: CollisionSession = { hoverContainerId: null, context: null, descendantsSectionRect: null };
      expect(resolveBoardCollisions(collisionArgs('card-x', itemRowData('card'), containers), session)).toHaveLength(0);
    });
  });
});

describe('resolveDropSide', () => {
  const card = (top: number, height = 100) => ({ top, height });

  it('defaults to before when the active rect is missing', () => {
    expect(resolveDropSide(null, card(100))).toBe('before');
    expect(resolveDropSide(undefined, card(100))).toBe('before');
  });

  it('defaults to before when the over rect is missing', () => {
    expect(resolveDropSide(card(100), null)).toBe('before');
    expect(resolveDropSide(card(100), undefined)).toBe('before');
  });

  it("resolves before when the dragged card is centered in the target's upper region", () => {
    // Target spans 100-200 (center 150); dragged card centered at 115,
    // mirroring the E2E suite's topQuarter (15% down the target).
    expect(resolveDropSide(card(65), card(100))).toBe('before');
  });

  it("resolves after when the dragged card is centered in the target's lower region", () => {
    // Dragged card centered at 185, mirroring bottomQuarter (85% down).
    expect(resolveDropSide(card(135), card(100))).toBe('after');
  });

  it('resolves before on an exact center-to-center tie', () => {
    expect(resolveDropSide(card(100), card(100))).toBe('before');
  });

  it('resolves before on a near-tie within the epsilon', () => {
    // Active center at 150.5 vs. target center 150 — 0.5px over, inside
    // the 1px tie band.
    expect(resolveDropSide(card(100.5), card(100))).toBe('before');
  });

  it('resolves after just outside the epsilon', () => {
    // Active center at 152 vs. target center 150 — 2px over, past the
    // 1px tie band.
    expect(resolveDropSide(card(102), card(100))).toBe('after');
  });
});

// In a column or a Descendants section alike, dnd-kit's shuffle decides the
// ghost's slot and the dragged copy's center, above or below the ghost's
// middle, picks which neighbor names it. Rows 100 tall, `over` rects
// unshifted (as dnd-kit measures them). The ghost's own height is read off
// `over`'s own kind — `SHORT_CARD_HEIGHT_PX` over a Card row,
// `STUB_ROW_HEIGHT_PX` over a Stub row — so a case that depends on it
// computes the ghost's middle from the constant. Only the dragged copy's
// center is compared, never its height.
describe('dropAnchorFor', () => {
  function overRow(id: string, top: number, items: string[], role: 'card' | 'stub' = 'card'): Over {
    return {
      id,
      rect: { top, height: 100, bottom: top + 100, left: 0, right: 100, width: 100 },
      disabled: false,
      data: { current: { ...itemRowData(role), sortable: { containerId: 'col', index: items.indexOf(id), items } } },
    } as unknown as Over;
  }

  function dragged(id: string, centerY: number) {
    const translated = { top: centerY - 10, height: 20, bottom: centerY + 10, left: 0, right: 100, width: 100 };
    return { id, rect: { current: { initial: null, translated } } };
  }

  it('moving up onto B: the ghost takes B\'s slot top-aligned; up names "after A", down "before B" — one slot', () => {
    const items = ['a', 'b', 'c', 'x'];
    const ghostMiddle = 110 + SHORT_CARD_HEIGHT_PX / 2; // a Card row's ghost, top-aligned to B (top 110)
    expect(dropAnchorFor(dragged('x', ghostMiddle - 15), overRow('b', 110, items))).toEqual({
      anchorId: 'a',
      side: 'after',
    });
    expect(dropAnchorFor(dragged('x', ghostMiddle + 15), overRow('b', 110, items))).toEqual({
      anchorId: 'b',
      side: 'before',
    });
  });

  it('moving down onto C: the ghost takes C\'s slot bottom-aligned; up names "after C", down "before D"', () => {
    const items = ['x', 'b', 'c', 'd'];
    const ghostMiddle = 320 - SHORT_CARD_HEIGHT_PX / 2; // bottom-aligned to C (220..320)
    expect(dropAnchorFor(dragged('x', ghostMiddle - 12), overRow('c', 220, items))).toEqual({
      anchorId: 'c',
      side: 'after',
    });
    expect(dropAnchorFor(dragged('x', ghostMiddle + 12), overRow('c', 220, items))).toEqual({
      anchorId: 'd',
      side: 'before',
    });
  });

  it('over its own slot, nothing shuffles, and the lean still names a neighbor (items from other workphases can sit between them, so the two differ)', () => {
    const items = ['a', 'x', 'c'];
    // Its own rect, 110..210: middle at 160.
    expect(dropAnchorFor(dragged('x', 140), overRow('x', 110, items))).toEqual({ anchorId: 'a', side: 'after' });
    expect(dropAnchorFor(dragged('x', 180), overRow('x', 110, items))).toEqual({
      anchorId: 'c',
      side: 'before',
    });
  });

  it('at either end there is one neighbor, whichever way it leans', () => {
    expect(dropAnchorFor(dragged('x', 10), overRow('a', 0, ['a', 'x']))).toEqual({
      anchorId: 'a',
      side: 'before',
    });
    expect(dropAnchorFor(dragged('x', 90), overRow('a', 0, ['a', 'x']))).toEqual({
      anchorId: 'a',
      side: 'before',
    });
    expect(dropAnchorFor(dragged('x', 120), overRow('b', 110, ['x', 'b']))).toEqual({
      anchorId: 'b',
      side: 'after',
    });
    expect(dropAnchorFor(dragged('x', 200), overRow('b', 110, ['x', 'b']))).toEqual({
      anchorId: 'b',
      side: 'after',
    });
  });

  it('DRAG-4.23: alone in its list: nothing to anchor to', () => {
    expect(dropAnchorFor(dragged('x', 50), overRow('x', 0, ['x']))).toBeNull();
  });

  // A bare container is never a row to anchor beside — no card/Stub data at all, the shape a locked column/sub-row's
  // own container droppable (or the pop machine's Board-layer hover
  // container) registers.
  it('over a bare container (no row data): nothing to anchor to', () => {
    const bareContainer = {
      id: 'column-container',
      rect: { top: 0, height: 400, bottom: 400, left: 0, right: 100, width: 100 },
      disabled: false,
      data: { current: {} },
    } as unknown as Over;
    expect(dropAnchorFor(dragged('x', 50), bareContainer)).toBeNull();
  });

  it("over a card not in over's list: over itself, on the which-half side", () => {
    expect(dropAnchorFor(dragged('x', 190), overRow('b', 110, ['a', 'b']))).toEqual({
      anchorId: 'b',
      side: 'after',
    });
  });

  // A Descendants section's flat list follows the same ghost-slot rule
  // (DRAG-4.8's gap), with the Stub row's own (shorter) ghost height.
  it("over a Stub row: the same shuffle-slot rule, with a Stub row's own ghost height", () => {
    const items = ['a', 'b', 'c', 'x'];
    const ghostMiddle = 110 + STUB_ROW_HEIGHT_PX / 2; // a Stub row's ghost, top-aligned to B (top 110)
    expect(dropAnchorFor(dragged('x', ghostMiddle - 6), overRow('b', 110, items, 'stub'))).toEqual({
      anchorId: 'a',
      side: 'after',
    });
    // Past a Stub ghost's middle, though still above where a Card ghost's would be.
    expect(dropAnchorFor(dragged('x', ghostMiddle + 6), overRow('b', 110, items, 'stub'))).toEqual({
      anchorId: 'b',
      side: 'before',
    });
  });

  it("over a Stub row not in over's own sortable list: over itself, on the which-half side", () => {
    expect(dropAnchorFor(dragged('x', 125), overRow('b', 110, ['a', 'b'], 'stub'))).toEqual({
      anchorId: 'b',
      side: 'before',
    });
  });

  // The dragged Stub's own child `xa` is still rendered right below it, but
  // travels with it: naming it would put the gap at the section's end, so
  // the search steps past it.
  it('DRAG-4.8: steps past rows that travel with the dragged item', () => {
    const items = ['s1', 'x', 'xa', 's3'];
    const travels = (id: string) => id === 'x' || id === 'xa';
    // Over its own slot (top 110, middle 160).
    expect(dropAnchorFor(dragged('x', 170), overRow('x', 110, items, 'stub'), travels)).toEqual({
      anchorId: 's3',
      side: 'before',
    });
    expect(dropAnchorFor(dragged('x', 150), overRow('x', 110, items, 'stub'), travels)).toEqual({
      anchorId: 's1',
      side: 'after',
    });
    // Without it, leaning down names the child.
    expect(dropAnchorFor(dragged('x', 170), overRow('x', 110, items, 'stub'))).toEqual({
      anchorId: 'xa',
      side: 'before',
    });
  });

  // The one call shape every reader uses: the blue line, the pop machine and
  // the release.
  describe('namedAnchorFor', () => {
    const items = ['s1', 'x', 'xa', 's3'];
    const session = (contextKey: string) => ({
      pop: { contextKey },
      classification: { subtreeIds: new Set(['x', 'xa']) },
    });

    it("at a Descendants context, steps past the dragged item's subtree", () => {
      const over = overRow('x', 110, items, 'stub');
      expect(namedAnchorFor(dragged('x', 170), over, session('descendants:p'))).toEqual({
        anchorId: 's3',
        side: 'before',
      });
    });

    it('at a column, a Free descendant is a real anchor', () => {
      expect(namedAnchorFor(dragged('x', 170), overRow('x', 110, items), session('column:c1'))).toEqual({
        anchorId: 'xa',
        side: 'before',
      });
    });

    it('with nothing under the drag, no anchor', () => {
      expect(namedAnchorFor(dragged('x', 170), null, session('column:c1'))).toBeNull();
    });
  });
});

describe('isItemData / isColumnData', () => {
  it("tell an item row (Card or Stub alike) from a column by the registration's type", () => {
    expect(isItemData(itemRowData('card'))).toBe(true);
    expect(isItemData(itemRowData('stub', 'p'))).toBe(true);
    expect(isItemData(columnData())).toBe(false);
    expect(isColumnData(columnData())).toBe(true);
    expect(isColumnData(itemRowData('card'))).toBe(false);
    expect(isItemData(undefined)).toBe(false);
  });
});

describe('travelingRowsFor', () => {
  const classification = { subtreeIds: new Set(['x', 'xa']) };

  it("at a Descendants context: the dragged subtree (classification's own subtreeIds)", () => {
    const travels = travelingRowsFor({ pop: { contextKey: 'descendants:p' }, classification });
    expect(['x', 'xa', 's1'].map(id => travels?.(id))).toEqual([true, true, false]);
  });

  it('anywhere else: none — at a column a Free descendant is a real anchor', () => {
    expect(travelingRowsFor({ pop: { contextKey: 'column:c1' }, classification })).toBeUndefined();
    expect(travelingRowsFor({ pop: { contextKey: null }, classification })).toBeUndefined();
    expect(travelingRowsFor(null)).toBeUndefined();
  });
});
