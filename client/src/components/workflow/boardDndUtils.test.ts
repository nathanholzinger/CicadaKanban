import { describe, it, expect, vi } from 'vitest';
import type { CollisionDetection } from '@dnd-kit/core';
import { makeItem } from '../../test/itemFixture';
import { freeOrigin, rect, column, stubOrigin } from '../../test/dragFixtures';
import { buildColumnForWorkphaseMap, subrowContainerId } from './dragRegions';
import {
  resolveBoardCollisions,
  resolveDropSide,
  isIdentity,
  itemRowData,
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
      collisionArgs('card-a', itemRowData('card'), [{ id: 'card-a', data: itemRowData('card') }]),
      null,
    );
    expect(result).toHaveLength(0);
  });

  it('excludes Stub rows from a Card drag (the collision-hijack bug this guards against)', () => {
    // Regression: a card being dragged must never resolve onto its own (or
    // any) attached child, even when that child's rect happens to be
    // closest — this is exactly what let a nested "Cascading Kid" row
    // hijack its parent's cross-column drop once attached children became
    // draggable (Epic 3.2 Part 3).
    const result = resolveBoardCollisions(
      collisionArgs('card-a', itemRowData('card'), [
        { id: 'child-1', data: itemRowData('stub', 'card-a') },
        { id: 'col-1', data: { type: 'column' } },
      ]),
      null,
    );
    expect(result.map(r => r.id)).not.toContain('child-1');
    expect(result.map(r => r.id)).toContain('col-1');
  });

  // Story 6 Phase B: the Descendants-context scope comes from the *live
  // session's* own measured section rect (`descendantsSectionRect`,
  // computed by useBoardDnd.ts from the locked region) — every Stub row
  // inside it is a candidate, any depth and any real `parentId` (replacing
  // Story 5's interim same-real-parent-only `siblingScopeParentId`; the
  // within-action itself still keeps a release scoped to true siblings —
  // `useBoardDnd.ts::handleDragEnd`'s own membership check, not this one).
  // Never from the active row's own `data`.
  it("scopes a Descendants context's collisions to every Stub row inside the section's rect, any real parent", () => {
    const sectionRect = rect(0, 0, 100, 400);
    const session: CollisionSession = { hoverContainerId: null, context: null, descendantsSectionRect: sectionRect };
    const result = resolveBoardCollisions(
      collisionArgs('child-a', itemRowData('stub', 'parent-1'), [
        { id: 'child-b', data: itemRowData('stub', 'parent-1'), rect: rect(5, 10, 90, 20) }, // inside, true sibling
        { id: 'grandchild-c', data: itemRowData('stub', 'parent-2'), rect: rect(5, 40, 90, 20) }, // inside, different real parent — still a candidate
        { id: 'other-section-d', data: itemRowData('stub', 'parent-3'), rect: rect(500, 0, 90, 20) }, // outside the rect — a different card's section
        { id: 'col-1', data: { type: 'column' }, rect: rect(0, 0, 100, 400) }, // never a valid target for a Descendants-context drag
      ]),
      session,
    );
    expect(result.map(r => r.id)).toContain('child-b');
    expect(result.map(r => r.id)).toContain('grandchild-c');
    expect(result.map(r => r.id)).not.toContain('other-section-d');
    expect(result.map(r => r.id)).not.toContain('col-1');
  });

  // Decision 4's own regression guard (2026-09-21): the hazard is a Stub's
  // row unmounting from its Descendants section and remounting as a Card
  // row for the *same* id mid-drag, so `active.data.current.role` could in
  // principle lag one frame behind. Every policy decision here is keyed off
  // `liveSession` (our own pure state) instead — this proves it, by feeding
  // a deliberately *wrong* active role (`'card'`, as if the remount hadn't
  // been picked up yet) alongside a live session that says otherwise, and
  // asserting the outcome still matches the live session, not the stale
  // active data.
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

  // Epic 3.5 Story 3: `over` follows the pop machine (wiki §2–§3, §5).
  describe('under the pop machine', () => {
    const context = { containerId: 'col-a', rect: rect(0, 0, 100, 400) };
    const containers: Container[] = [
      { id: 'col-a', data: { type: 'column' }, rect: rect(0, 0, 100, 400) },
      { id: 'card-a1', data: itemRowData('card'), rect: rect(5, 10, 90, 50) },
      { id: 'col-b', data: { type: 'column' }, rect: rect(120, 0, 100, 400) },
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

// Story 4.1 Phase 3 — decision 2 (2026-09-17), replaced by Story 5
// (2026-09-21): a placement that resolves to the item's own *origin* list
// and ordinal writes nothing. Replaces bandDropResolution's per-case nulls
// and resolveDropTarget's "same workphase → reorder" branch alike: both
// were really this one rule.
describe('isIdentity', () => {
  const freeOrigin: Placement = { workphaseId: 'w2', slot: 'existing' };
  const others = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

  it('a different workphase is never identity, whatever the slot (DRAG-3.1/3.2/3.6)', () => {
    const outsiderOrigin: Placement = { workphaseId: 'w1', slot: 'existing' };
    expect(isIdentity(outsiderOrigin, { workphaseId: 'w2', slot: 'existing' }, others)).toBe(false);
    expect(isIdentity(outsiderOrigin, { workphaseId: 'w2', slot: 'first' }, others)).toBe(false);
    expect(isIdentity(outsiderOrigin, { workphaseId: 'w2', slot: { anchorId: 'A', side: 'before' } }, others)).toBe(
      false,
    );
  });

  it('same workphase, slot existing: always identity (middle band member, TC-7.16)', () => {
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: 'existing' }, others)).toBe(true);
    // An omitted workphaseId means "unchanged" — same rule, no literal to compare.
    expect(isIdentity(freeOrigin, { slot: 'existing' }, others)).toBe(true);
  });

  it('same workphase, empty others: any slot is identity — nothing to order against (DRAG-3.10 / TC-7.5, DRAG-3.9 / TC-7.8)', () => {
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: 'first' }, [])).toBe(true);
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: 'last' }, [])).toBe(true);
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: { anchorId: 'ghost', side: 'before' } }, [])).toBe(true);
  });

  it('same workphase, empty others, but a genuine outsider: not identity — the workphase itself is still changing', () => {
    const outsiderOrigin: Placement = { workphaseId: 'w1', slot: 'existing' };
    expect(isIdentity(outsiderOrigin, { workphaseId: 'w2', slot: 'first' }, [])).toBe(false);
  });

  it('same workphase, non-empty others, a real anchor found: not identity — a genuine reorder (DRAG-3.7 top/bottom)', () => {
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: { anchorId: 'A', side: 'before' } }, others)).toBe(false);
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: 'first' }, others)).toBe(false);
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: 'last' }, others)).toBe(false);
  });

  it('same workphase, an anchor absent from others (hovering itself, or a stray id): identity — nothing sensible to order against', () => {
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: { anchorId: 'not-there', side: 'after' } }, others)).toBe(
      true,
    );
  });

  it("a parentId placement compares against the origin's own parentId, never a workphase", () => {
    const stubOrigin: Placement = { parentId: 'card-1', slot: 'existing' };
    expect(isIdentity(stubOrigin, { parentId: 'card-1', slot: 'existing' }, others)).toBe(true);
    expect(isIdentity(stubOrigin, { parentId: 'card-2', slot: 'existing' }, others)).toBe(false);
    // A Free Card's origin has no parentId key at all to match against.
    expect(isIdentity(freeOrigin, { parentId: 'card-1', slot: 'last' }, [])).toBe(false);
  });

  // Story 5 (2026-09-21): the origin comparison retires audit
  // epic-3-5-story-4 #1's `isAttached` guard entirely — a detached child's
  // origin is a *workphase* placement (its own, wherever it currently sits
  // on the board), never a `parentId` one, so it can never collide with a
  // re-attach's `parentId` placement the way the old raw-item comparison
  // could.
  it("a detached child re-attaching to its own former parent is not identity — its origin is a workphase placement, never that parent's", () => {
    const detachedChildOrigin: Placement = { workphaseId: 'w1', slot: 'existing' };
    expect(isIdentity(detachedChildOrigin, { parentId: 'card-1', slot: 'last' }, [])).toBe(false);
    expect(isIdentity(detachedChildOrigin, { parentId: 'card-1', slot: 'existing' }, [])).toBe(false);
  });

  // TC-12: a Stub released at its own containing Card's layer previews
  // `origin` itself (popSession.ts) — proving that's recognized as identity
  // here too, not just structurally equal by construction.
  it("a Stub's own origin, placed back at itself, is identity — TC-12's set-back-down", () => {
    const stubOrigin: Placement = { parentId: 'card-p', slot: 'existing' };
    expect(isIdentity(stubOrigin, stubOrigin, others)).toBe(true);
  });
});

// TC-2.11, DRAG-3.1/3.2/3.6/3.7/3.9/3.10, and Story 5's TC-1/2/4/9: the
// request a resolved placement turns into — the one adapter from the
// ghost's own terms to the item's, replacing resolveDropTarget +
// buildMoveInput's independent re-derivation (F3). `item` is now only
// consulted for its own current `workphaseId` (whether the field is worth
// sending); the identity check itself is `origin`'s job (`isIdentity`,
// tested above).
describe('toRequest', () => {
  const others = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

  it('a null placement sends nothing — drawn where it already is', () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), null, others)).toBeNull();
  });

  it('an identity sends nothing (decision 2)', () => {
    expect(
      toRequest({ workphaseId: 'w2' }, freeOrigin('w2'), { workphaseId: 'w2', slot: 'existing' }, others),
    ).toBeNull();
  });

  it('cross-column, no anchor: workphaseId alone (DRAG-3.3 outsider / TC-7.16-shaped, middle band)', () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'w2', slot: 'existing' }, others)).toEqual(
      {
        workphaseId: 'w2',
      },
    );
  });

  it('cross-column with a specific anchor: workphaseId + anchor + side (TC-2.11)', () => {
    expect(
      toRequest(
        { workphaseId: 'w1' },
        freeOrigin('w1'),
        { workphaseId: 'w2', slot: { anchorId: 'A', side: 'after' } },
        others,
      ),
    ).toEqual({
      workphaseId: 'w2',
      anchorId: 'A',
      side: 'after',
    });
  });

  it("first/last resolve to a concrete anchor beside others' own edge (DRAG-3.1, 3.2)", () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'w2', slot: 'first' }, others)).toEqual({
      workphaseId: 'w2',
      anchorId: 'A',
      side: 'before',
    });
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'w2', slot: 'last' }, others)).toEqual({
      workphaseId: 'w2',
      anchorId: 'C',
      side: 'after',
    });
  });

  it('empty others: first/last send a bare workphase move, no anchor to resolve (DRAG-3.10)', () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'w2', slot: 'first' }, [])).toEqual({
      workphaseId: 'w2',
    });
  });

  it('same workphase, a real anchor: no workphaseId sent, just the anchor (in-context reorder, TC-2.11)', () => {
    expect(
      toRequest(
        { workphaseId: 'w2' },
        freeOrigin('w2'),
        { workphaseId: 'w2', slot: { anchorId: 'A', side: 'before' } },
        others,
      ),
    ).toEqual({
      anchorId: 'A',
      side: 'before',
    });
  });

  it("a done region never anchors — DRAG-3.9/TC-7.8 is placementFor's own fallback to 'existing', already exercised there; toRequest just never sees a first/last/anchor slot for one", () => {
    expect(
      toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'done', slot: 'existing' }, [
        { id: 'D1' },
        { id: 'D2' },
      ]),
    ).toEqual({
      workphaseId: 'done',
    });
  });

  it('attach: parentId + isAttached, never an anchor — always an append for an item arriving from outside (Story 4/5 TC-4, no manual placement among Stubs until Story 6)', () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { parentId: 'card-1', slot: 'last' }, [])).toEqual({
      parentId: 'card-1',
      isAttached: true,
    });
  });

  // Story 5 decision 1: a Descendants-layer sibling reorder — same parent
  // as `origin`'s own, an anchor slot — sends only the anchor + side, the
  // pre-Story-5 attached-child request shape unchanged. Nothing about the
  // attachment itself is in this request; only the ordinal is.
  it('a Descendants-layer sibling reorder (parentId matching origin, an anchor slot): sends only the anchor + side', () => {
    const origin = stubOrigin('card-p');
    expect(
      toRequest({ workphaseId: 'w1' }, origin, { parentId: 'card-p', slot: { anchorId: 'S2', side: 'after' } }, [
        { id: 'S1' },
        { id: 'S2' },
      ]),
    ).toEqual({ anchorId: 'S2', side: 'after' });
  });

  // TC-1/2/3: detaching (`parentId: null` on the placement — the render-
  // preview signal) never sends a `parentId` field at all — item-
  // attachment §11's "detach preserves the parent," so the real parentId
  // stays whatever it already is; only `isAttached: false` is explicit.
  it('detach (parentId: null on the placement): isAttached false, plus the anchor/workphase resolution otherwise (TC-1)', () => {
    const origin = stubOrigin('card-p');
    expect(
      toRequest(
        { workphaseId: 'w1' },
        origin,
        { parentId: null, workphaseId: 'w2', slot: { anchorId: 'Q', side: 'after' } },
        [],
      ),
    ).toEqual({ workphaseId: 'w2', isAttached: false, anchorId: 'Q', side: 'after' });
  });

  it('TC-2: detaching within the same covered set sends no workphaseId field at all', () => {
    const origin = stubOrigin('card-p');
    expect(
      toRequest(
        { workphaseId: 'w1' },
        origin,
        { parentId: null, workphaseId: 'w1', slot: { anchorId: 'Q', side: 'after' } },
        [],
      ),
    ).toEqual({ isAttached: false, anchorId: 'Q', side: 'after' });
  });

  // Audit epic-3-5-story-5 #3: this branch used to key on the *slot's own
  // shape* (`typeof slot === 'object'`), not the parent equality its own
  // comment stated — a proxy that happened to hold because Story 5's own
  // Descendants branch is the only producer of an anchor-shaped slot
  // alongside a `parentId`, and it always sets `parentId: origin.parentId`.
  // Story 6's reparent-with-placement (a different Card's Stubs) breaks
  // that coincidence: a genuinely different parent, still an anchor slot —
  // this must be a full reparent (parentId + isAttached + the anchor), not
  // a bare position-only reorder that silently drops the attachment change.
  it('a reparent with an anchor slot for a *different* parent is a full reparent-with-placement, not a bare reorder (Story 6 seam)', () => {
    const origin = stubOrigin('card-p');
    expect(
      toRequest(
        { workphaseId: 'w1' },
        origin,
        { parentId: 'card-q', slot: { anchorId: 'other-stub', side: 'before' } },
        [{ id: 'other-stub' }],
      ),
    ).toEqual({ parentId: 'card-q', isAttached: true, anchorId: 'other-stub', side: 'before' });
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
