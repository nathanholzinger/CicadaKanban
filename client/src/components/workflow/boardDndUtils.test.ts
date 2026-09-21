import { describe, it, expect, vi } from 'vitest';
import type { CollisionDetection } from '@dnd-kit/core';
import { makeItem } from '../../test/itemFixture';
import { rect, column } from '../../test/dragFixtures';
import { buildColumnForWorkphaseMap, subrowContainerId } from './dragRegions';
import {
  resolveBoardCollisions,
  resolveDropSide,
  isIdentity,
  toRequest,
  sendItemMove,
  type CollisionSession,
} from './boardDndUtils';
import type { Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';

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

// Board fixture: merged col-1 covers [todo, review], expanded col-2 covers
// [dev, qa], broken col-3 covers [old].
const columns = [
  column('col-1', ['todo', 'review']),
  column('col-2', ['dev', 'qa'], { displayMode: 'expanded' }),
  column('col-3', ['old'], { broken: true }),
];
const columnMap = buildColumnForWorkphaseMap(columns);

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

describe('resolveBoardCollisions', () => {
  it('never collides an item with itself', () => {
    const result = resolveBoardCollisions(
      collisionArgs('card-a', { type: 'card' }, [{ id: 'card-a', data: { type: 'card' } }]),
      null,
    );
    expect(result).toHaveLength(0);
  });

  it('excludes attached-child containers from a card drag (the collision-hijack bug this guards against)', () => {
    // Regression: a card being dragged must never resolve onto its own (or
    // any) attached child, even when that child's rect happens to be
    // closest — this is exactly what let a nested "Cascading Kid" row
    // hijack its parent's cross-column drop once attached children became
    // draggable (Epic 3.2 Part 3).
    const result = resolveBoardCollisions(
      collisionArgs('card-a', { type: 'card' }, [
        { id: 'child-1', data: { type: 'attached-child', parentId: 'card-a' } },
        { id: 'col-1', data: { type: 'column' } },
      ]),
      null,
    );
    expect(result.map(r => r.id)).not.toContain('child-1');
    expect(result.map(r => r.id)).toContain('col-1');
  });

  it('scopes an attached-child drag to siblings under the same parent only', () => {
    const result = resolveBoardCollisions(
      collisionArgs('child-a', { type: 'attached-child', parentId: 'parent-1' }, [
        { id: 'child-b', data: { type: 'attached-child', parentId: 'parent-1' } }, // true sibling
        { id: 'child-c', data: { type: 'attached-child', parentId: 'parent-2' } }, // different parent
        { id: 'col-1', data: { type: 'column' } }, // never a valid target for an attached-child drag
      ]),
      null,
    );
    expect(result.map(r => r.id)).toEqual(['child-b']);
  });

  // Epic 3.5 Story 3: `over` follows the pop machine (wiki §2–§3, §5).
  describe('under the pop machine', () => {
    const context = { containerId: 'col-a', rect: rect(0, 0, 100, 400) };
    const containers: Container[] = [
      { id: 'col-a', data: { type: 'column' }, rect: rect(0, 0, 100, 400) },
      { id: 'card-a1', data: { type: 'card' }, rect: rect(5, 10, 90, 50) },
      { id: 'col-b', data: { type: 'column' }, rect: rect(120, 0, 100, 400) },
      { id: 'card-b1', data: { type: 'card' }, rect: rect(125, 10, 90, 50) },
      { id: 'child-1', data: { type: 'attached-child', parentId: 'card-a1' }, rect: rect(10, 30, 80, 20) },
    ];

    it('in-context: only the context container and the cards inside it are candidates', () => {
      const session: CollisionSession = { hoverContainerId: null, context };
      const ids = resolveBoardCollisions(collisionArgs('card-x', { type: 'card' }, containers), session).map(c => c.id);
      expect(ids).toContain('col-a');
      expect(ids).toContain('card-a1');
      expect(ids).not.toContain('col-b');
      expect(ids).not.toContain('card-b1');
      expect(ids).not.toContain('child-1');
    });

    it("hovering another region: `over` is exactly that region's container, never a card in it", () => {
      const session: CollisionSession = { hoverContainerId: 'col-b', context };
      expect(
        resolveBoardCollisions(collisionArgs('card-x', { type: 'card' }, containers), session).map(c => c.id),
      ).toEqual(['col-b']);
    });

    it('no context (picked up in Unsorted) and no hover: nothing to collide with', () => {
      const session: CollisionSession = { hoverContainerId: null, context: null };
      expect(resolveBoardCollisions(collisionArgs('card-x', { type: 'card' }, containers), session)).toHaveLength(0);
    });

    it('the machine only governs card drags — an attached-child drag is scoped to its siblings as before', () => {
      const session: CollisionSession = { hoverContainerId: 'col-b', context };
      const ids = resolveBoardCollisions(
        collisionArgs('child-x', { type: 'attached-child', parentId: 'card-a1' }, containers),
        session,
      ).map(c => c.id);
      expect(ids).toEqual(['child-1']);
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

// Story 4.1 Phase 3 — decision 2 (2026-09-17): a placement that resolves to
// the item's own current list and ordinal writes nothing. Replaces
// bandDropResolution's per-case nulls and resolveDropTarget's "same
// workphase → reorder" branch alike: both were really this one rule.
describe('isIdentity', () => {
  const outsider = { workphaseId: 'w1', parentId: null, isAttached: 0 };
  const member = { workphaseId: 'w2', parentId: null, isAttached: 0 };
  const others = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

  it('a different workphase is never identity, whatever the slot (DRAG-3.1/3.2/3.6)', () => {
    expect(isIdentity(outsider, { workphaseId: 'w2', slot: 'existing' }, others)).toBe(false);
    expect(isIdentity(outsider, { workphaseId: 'w2', slot: 'first' }, others)).toBe(false);
    expect(isIdentity(outsider, { workphaseId: 'w2', slot: { anchorId: 'A', side: 'before' } }, others)).toBe(false);
  });

  it('same workphase, slot existing: always identity (middle band member, TC-7.16)', () => {
    expect(isIdentity(member, { workphaseId: 'w2', slot: 'existing' }, others)).toBe(true);
    // An omitted workphaseId means "unchanged" — same rule, no literal to compare.
    expect(isIdentity(member, { slot: 'existing' }, others)).toBe(true);
  });

  it('same workphase, empty others: any slot is identity — nothing to order against (DRAG-3.10 / TC-7.5, DRAG-3.9 / TC-7.8)', () => {
    expect(isIdentity(member, { workphaseId: 'w2', slot: 'first' }, [])).toBe(true);
    expect(isIdentity(member, { workphaseId: 'w2', slot: 'last' }, [])).toBe(true);
    expect(isIdentity(member, { workphaseId: 'w2', slot: { anchorId: 'ghost', side: 'before' } }, [])).toBe(true);
  });

  it('same workphase, empty others, but a genuine outsider: not identity — the workphase itself is still changing', () => {
    expect(isIdentity(outsider, { workphaseId: 'w2', slot: 'first' }, [])).toBe(false);
  });

  it('same workphase, non-empty others, a real anchor found: not identity — a genuine reorder (DRAG-3.7 top/bottom)', () => {
    expect(isIdentity(member, { workphaseId: 'w2', slot: { anchorId: 'A', side: 'before' } }, others)).toBe(false);
    expect(isIdentity(member, { workphaseId: 'w2', slot: 'first' }, others)).toBe(false);
    expect(isIdentity(member, { workphaseId: 'w2', slot: 'last' }, others)).toBe(false);
  });

  it('same workphase, an anchor absent from others (hovering itself, or a stray id): identity — nothing sensible to order against', () => {
    expect(isIdentity(member, { workphaseId: 'w2', slot: { anchorId: 'not-there', side: 'after' } }, others)).toBe(
      true,
    );
  });

  it("a parentId placement compares against the item's current parent, never its workphase", () => {
    const stub = { workphaseId: 'w1', parentId: 'card-1', isAttached: 1 };
    expect(isIdentity(stub, { parentId: 'card-1', slot: 'existing' }, others)).toBe(true);
    expect(isIdentity(stub, { parentId: 'card-2', slot: 'existing' }, others)).toBe(false);
    // A root-level Free Card has no parent to match at all.
    expect(isIdentity(outsider, { parentId: 'card-1', slot: 'last' }, [])).toBe(false);
  });

  it("a detached child re-attaching to its own parent is not identity — same parentId, but it isn't in that parent's list (audit epic-3-5-story-4 #1)", () => {
    // Epic 3's model: `parentId` set, `isAttached` off — a Free Card in a
    // column, classified `valid` against its own parent (an ancestor is
    // never a descendant), so it can zoom in. The parent's Stub list is a
    // different list from the column it's in; "same parent" alone is not
    // "same list."
    const detachedChild = { workphaseId: 'w1', parentId: 'card-1', isAttached: 0 };
    expect(isIdentity(detachedChild, { parentId: 'card-1', slot: 'last' }, [])).toBe(false);
    expect(isIdentity(detachedChild, { parentId: 'card-1', slot: 'existing' }, [])).toBe(false);
  });
});

// TC-2.11, DRAG-3.1/3.2/3.6/3.7/3.9/3.10: the request a resolved placement
// turns into — the one adapter from the ghost's own terms to the item's,
// replacing resolveDropTarget + buildMoveInput's independent re-derivation
// (F3).
describe('toRequest', () => {
  const outsider = { workphaseId: 'w1', parentId: null, isAttached: 0 };
  const member = { workphaseId: 'w2', parentId: null, isAttached: 0 };
  const others = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

  it('a null placement sends nothing — drawn where it already is', () => {
    expect(toRequest(outsider, null, others)).toBeNull();
  });

  it('an identity sends nothing (decision 2)', () => {
    expect(toRequest(member, { workphaseId: 'w2', slot: 'existing' }, others)).toBeNull();
  });

  it('cross-column, no anchor: workphaseId alone (DRAG-3.3 outsider / TC-7.16-shaped, middle band)', () => {
    expect(toRequest(outsider, { workphaseId: 'w2', slot: 'existing' }, others)).toEqual({ workphaseId: 'w2' });
  });

  it('cross-column with a specific anchor: workphaseId + anchor + side (TC-2.11)', () => {
    expect(toRequest(outsider, { workphaseId: 'w2', slot: { anchorId: 'A', side: 'after' } }, others)).toEqual({
      workphaseId: 'w2',
      anchorId: 'A',
      side: 'after',
    });
  });

  it("first/last resolve to a concrete anchor beside others' own edge (DRAG-3.1, 3.2)", () => {
    expect(toRequest(outsider, { workphaseId: 'w2', slot: 'first' }, others)).toEqual({
      workphaseId: 'w2',
      anchorId: 'A',
      side: 'before',
    });
    expect(toRequest(outsider, { workphaseId: 'w2', slot: 'last' }, others)).toEqual({
      workphaseId: 'w2',
      anchorId: 'C',
      side: 'after',
    });
  });

  it('empty others: first/last send a bare workphase move, no anchor to resolve (DRAG-3.10)', () => {
    expect(toRequest(outsider, { workphaseId: 'w2', slot: 'first' }, [])).toEqual({ workphaseId: 'w2' });
  });

  it('same workphase, a real anchor: no workphaseId sent, just the anchor (in-context reorder, TC-2.11)', () => {
    expect(toRequest(member, { workphaseId: 'w2', slot: { anchorId: 'A', side: 'before' } }, others)).toEqual({
      anchorId: 'A',
      side: 'before',
    });
  });

  it("a done region never anchors — DRAG-3.9/TC-7.8 is placementFor's own fallback to 'existing', already exercised there; toRequest just never sees a first/last/anchor slot for one", () => {
    expect(toRequest(outsider, { workphaseId: 'done', slot: 'existing' }, [{ id: 'D1' }, { id: 'D2' }])).toEqual({
      workphaseId: 'done',
    });
  });

  it('attach: parentId + isAttached, never an anchor — always an append (Story 4, no manual placement among Stubs until Story 6)', () => {
    expect(toRequest(outsider, { parentId: 'card-1', slot: 'last' }, [])).toEqual({
      parentId: 'card-1',
      isAttached: true,
    });
  });

  it('re-attaching a detached child to its own parent sends the same attach request — the server treats a same-parent attach as a flag toggle and skips the depth check (audit epic-3-5-story-4 #1)', () => {
    const detachedChild = { workphaseId: 'w1', parentId: 'card-1', isAttached: 0 };
    expect(toRequest(detachedChild, { parentId: 'card-1', slot: 'last' }, [])).toEqual({
      parentId: 'card-1',
      isAttached: true,
    });
  });
});

// TC-2.11: extracted from useBoardDnd's handleDragEnd so the "server
// resolution is authoritative over a stale client guess, resync via
// loadBoard() on failure" contract can be unit tested directly — no
// dnd-kit runtime or rendered component needed, per the same reasoning
// this whole module already exists for (see its header comment).
describe('sendItemMove', () => {
  const input = { workphaseId: 'wp-2', anchorId: 'anchor-1', side: 'after' as const };
  // Story 4.1 Phase 3: the pending marker is just the placement that
  // produced `input` (toRequest's own input) — no separate re-derivation
  // (F3) — so this is pinned directly rather than built from a function.
  const pending: Placement = { workphaseId: 'wp-2', slot: { anchorId: 'anchor-1', side: 'after' } };
  const fakeItem = (id: string) => makeItem(id, { isAttached: 0, workphaseId: 'wp-2', position: 1.5 });
  const tracker = () => ({
    begin: vi.fn<ItemWriteTracker['begin']>(() => 7),
    complete: vi.fn<ItemWriteTracker['complete']>(() => ({ applied: true, needsResync: false })),
    fail: vi.fn<ItemWriteTracker['fail']>(),
    isPending: vi.fn<ItemWriteTracker['isPending']>(() => false),
  });

  it('begins the write with its pending placement, completes it with the response, and never calls loadBoard', async () => {
    const updated = fakeItem('active-1');
    const moveItem = vi.fn(async () => updated);
    const writes = tracker();
    const loadBoard = vi.fn();

    await sendItemMove(moveItem, 'active-1', input, pending, writes, loadBoard);

    expect(writes.begin).toHaveBeenCalledWith('active-1', pending);
    expect(moveItem).toHaveBeenCalledWith('active-1', input);
    expect(writes.complete).toHaveBeenCalledWith('active-1', 7, updated);
    expect(writes.fail).not.toHaveBeenCalled();
    expect(loadBoard).not.toHaveBeenCalled();
  });

  it('DRAG-6.6: a rejected move fails the write (the guess is dropped) and resyncs via loadBoard', async () => {
    const moveItem = vi.fn(async () => {
      throw new Error('anchorId does not reference an existing item');
    });
    const writes = tracker();
    const loadBoard = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await sendItemMove(moveItem, 'active-1', input, pending, writes, loadBoard);

    expect(writes.complete).not.toHaveBeenCalled();
    expect(writes.fail).toHaveBeenCalledWith('active-1', 7);
    expect(loadBoard).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });

  // Reconciliation #15: the row itself is rightly dropped whole when the
  // response is stale (a newer write for the same item superseded it) —
  // but if it also disclosed a reindex, those pairs renumbered other rows
  // for real, and losing them silently is the exact wrong-looking-
  // consistent failure item-positioning §5 warns about. The tracker is the
  // one that knows staleness; this only has to act on what it reports.
  it("#15: a stale response's own row is still discarded, but resyncs instead of losing the reindex pairs it carried", async () => {
    const updated = fakeItem('active-1');
    const moveItem = vi.fn(async () => updated);
    const writes = tracker();
    writes.complete.mockReturnValue({ applied: false, needsResync: true });
    const loadBoard = vi.fn();

    await sendItemMove(moveItem, 'active-1', input, pending, writes, loadBoard);

    expect(writes.complete).toHaveBeenCalledWith('active-1', 7, updated);
    expect(writes.fail).not.toHaveBeenCalled();
    expect(loadBoard).toHaveBeenCalledTimes(1);
  });

  it('a stale response with no reindex disclosed needs no resync', async () => {
    const updated = fakeItem('active-1');
    const moveItem = vi.fn(async () => updated);
    const writes = tracker();
    writes.complete.mockReturnValue({ applied: false, needsResync: false });
    const loadBoard = vi.fn();

    await sendItemMove(moveItem, 'active-1', input, pending, writes, loadBoard);

    expect(loadBoard).not.toHaveBeenCalled();
  });
});
