import { describe, it, expect, vi } from 'vitest';
import { makeItem } from '../../test/itemFixture';
import { freeOrigin, stubOrigin } from '../../test/dragFixtures';
import { isIdentity, toRequest, sendItemMove } from './dragRequest';
import { getWorkphaseItemsFrom, type Placement } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';

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

  it('same workphase, slot existing: always identity (middle band member, DRAG-3.12)', () => {
    expect(isIdentity(freeOrigin, { workphaseId: 'w2', slot: 'existing' }, others)).toBe(true);
    // An omitted workphaseId means "unchanged" — same rule, no literal to compare.
    expect(isIdentity(freeOrigin, { slot: 'existing' }, others)).toBe(true);
  });

  it('same workphase, empty others: any slot is identity — nothing to order against', () => {
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

  // DRAG-5.12: a Stub released at its own containing Card's layer previews
  // `origin` itself (popSession.ts) — proving that's recognized as identity
  // here too, not just structurally equal by construction.
  it("DRAG-5.12: a Stub's own origin, placed back at itself, is identity — the set-back-down", () => {
    const stubOrigin: Placement = { parentId: 'card-p', slot: 'existing' };
    expect(isIdentity(stubOrigin, stubOrigin, others)).toBe(true);
  });
});

// TC-2.11, DRAG-3.1/3.2/3.6/3.7/3.9/3.10, and DRAG-5.1, DRAG-5.2, DRAG-5.4, DRAG-5.9: the
// request a resolved placement turns into — the one adapter from the
// ghost's own terms to the item's, replacing resolveDropTarget +
// buildMoveInput's independent re-derivation (F3). `item` is now only
// consulted for its own current `workphaseId` (whether the field is worth
// sending); the identity check itself is `origin`'s job (`isIdentity`,
// tested above).
describe('TC-2.11: toRequest', () => {
  const others = [{ id: 'A' }, { id: 'B' }, { id: 'C' }];

  it('a null placement sends nothing — drawn where it already is', () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), null, others)).toBeNull();
  });

  it('an identity sends nothing', () => {
    expect(
      toRequest({ workphaseId: 'w2' }, freeOrigin('w2'), { workphaseId: 'w2', slot: 'existing' }, others),
    ).toBeNull();
  });

  it('cross-column, no anchor: workphaseId alone (DRAG-3.3 outsider, middle band)', () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'w2', slot: 'existing' }, others)).toEqual(
      {
        workphaseId: 'w2',
      },
    );
  });

  it('cross-column with a specific anchor: workphaseId + anchor + side', () => {
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

  it("TC-7.1, TC-7.2, TC-7.4: first/last resolve to a concrete anchor beside others' own edge (DRAG-3.1, DRAG-3.2)", () => {
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

  it('TC-7.3: first and last anchor on the rendered order, which breaks a position tie by creation time', () => {
    // Each tied pair arrives newest first, so only the tie-break puts the older one ahead.
    const rendered = getWorkphaseItemsFrom(
      [
        makeItem('B', { position: 1, createdAt: 200 }),
        makeItem('A', { position: 1, createdAt: 100 }),
        makeItem('M', { position: 3, createdAt: 50 }),
        makeItem('E', { position: 5, createdAt: 400 }),
        makeItem('D', { position: 5, createdAt: 300 }),
      ],
      'todo',
    );
    expect(rendered.map(i => i.id)).toEqual(['A', 'B', 'M', 'D', 'E']);
    const place = (slot: Placement['slot']) =>
      toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'todo', slot }, rendered);
    expect(place('first')).toEqual({ workphaseId: 'todo', anchorId: 'A', side: 'before' });
    expect(place('last')).toEqual({ workphaseId: 'todo', anchorId: 'E', side: 'after' });
  });

  it('empty others: first/last send a bare workphase move, no anchor to resolve (DRAG-3.10)', () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'w2', slot: 'first' }, [])).toEqual({
      workphaseId: 'w2',
    });
  });

  it('same workphase, a real anchor: no workphaseId sent, just the anchor (in-context reorder)', () => {
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

  it("a done region never anchors — DRAG-3.9 is placementFor's own fallback to 'existing', already exercised there; toRequest just never sees a first/last/anchor slot for one", () => {
    expect(
      toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { workphaseId: 'done', slot: 'existing' }, [
        { id: 'D1' },
        { id: 'D2' },
      ]),
    ).toEqual({
      workphaseId: 'done',
    });
  });

  it('DRAG-4.1, DRAG-5.4: attach: parentId + isAttached, never an anchor — always an append for an item arriving from outside', () => {
    expect(toRequest({ workphaseId: 'w1' }, freeOrigin('w1'), { parentId: 'card-1', slot: 'last' }, [])).toEqual({
      parentId: 'card-1',
      isAttached: true,
    });
  });

  // Story 5 decision 1: a Descendants-layer sibling reorder — same parent
  // as `origin`'s own, an anchor slot — sends only the anchor + side, the
  // pre-Story-5 attached-child request shape unchanged. Nothing about the
  // attachment itself is in this request; only the ordinal is.
  it('DRAG-5.5: a Descendants-layer sibling reorder (parentId matching origin, an anchor slot): sends only the anchor + side', () => {
    const origin = stubOrigin('card-p');
    expect(
      toRequest({ workphaseId: 'w1' }, origin, { parentId: 'card-p', slot: { anchorId: 'S2', side: 'after' } }, [
        { id: 'S1' },
        { id: 'S2' },
      ]),
    ).toEqual({ anchorId: 'S2', side: 'after' });
  });

  // DRAG-5.1, DRAG-5.2, DRAG-5.3: detaching (`parentId: null` on the placement — the render-
  // preview signal) never sends a `parentId` field at all — item-
  // attachment §11's "detach preserves the parent," so the real parentId
  // stays whatever it already is; only `isAttached: false` is explicit.
  it('DRAG-5.1: detach (parentId: null on the placement): isAttached false, plus the anchor/workphase resolution otherwise', () => {
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

  it('DRAG-5.2: detaching within the same covered set sends no workphaseId field at all', () => {
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
  it('a reparent with an anchor slot for a *different* parent is a full reparent-with-placement, not a bare reorder', () => {
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

  it('TC-5a.1: begins the write with its pending placement, completes it with the response, and never calls loadBoard', async () => {
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
  it("a stale response's own row is still discarded, but resyncs instead of losing the reindex pairs it carried", async () => {
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
