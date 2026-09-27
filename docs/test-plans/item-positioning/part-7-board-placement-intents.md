# Part 7 — Placement intents added by the board gesture

**Next ID:** TC-7.17

**Wiki:** [`../../wiki/item-positioning/#7-placement-intents-added-by-the-board-gesture-epic-35`](../../wiki/item-positioning/README.md#7-placement-intents-added-by-the-board-gesture-epic-35)

**Added by Epic 3.5.** These cases are the *positioning* half of the board
gesture — what the request looks like and what number the server produces.
The gesture itself (bands, popping, which band produces which request) is
[`../board-drag-interaction/`](../board-drag-interaction/); what a legal
parent is, and what attaching means, is [`../item-attachment/`](../item-attachment/).

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-7.1 | "First in list" is `{anchorId: first rendered item, side: before}` — no new request shape | P0 | ⏳ pending triage |
| TC-7.2 | "Last in list" is `{anchorId: last rendered item, side: after}` | P0 | ⏳ pending triage |
| TC-7.3 | First/last are read off the client's rendered order using the tie-break | P1 | ⏳ pending triage |
| TC-7.4 | First-visible is the right anchor under a narrow view | P0 | ⏳ pending triage |
| TC-7.5 | Empty column region: workphaseId-only move, existing position kept | P0 | ⏳ pending triage |
| TC-7.6 | Empty column region, item with no position: append fallback | P1 | ⏳ pending triage |
| TC-7.7 | Empty Stub list: attach/reparent with no anchor takes the append fallback | P0 | ⏳ pending triage |
| TC-7.8 | Done column: bands produce no anchor request; the drop is workphase-only | P0 | ⏳ pending triage |
| TC-7.9 | Anchor scope is validated against the item's *resulting* state | P0 | ⏳ pending triage |
| TC-7.10 | An anchor outside the resulting scope is rejected, nothing committed | P1 | ⏳ pending triage |
| TC-7.11 | Attach-with-placement resolves among the new parent's children, after the reparent | P0 | ⏳ pending triage |
| TC-7.12 | Reparent-while-attached-with-placement resolves in the new parent's scope, never the old | P0 | ⏳ pending triage |
| TC-7.13 | Detach-with-placement resolves in the workflow scope against the anchor | P0 | ⏳ pending triage |
| TC-7.14 | Cross-project reparent placement is not a special case | P1 | ⏳ pending triage |
| TC-7.15 | A done Card's Stubs are anchorable and place normally | P0 | ⏳ pending triage |
| TC-7.16 | The column's middle band is §2's workphaseId-only move | P1 | ⏳ pending triage |

---

### 7.1 First-in-list and last-in-list are anchor + side, chosen by the client

## TC-7.1 — "First in list" is `{anchorId: first rendered item, side: before}` — no new request shape

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a target context (a merged column, an expanded sub-row, or a
parent's Stub list) whose client-rendered order is `A, B, C`, *when* the
user expresses "first in list" (e.g. the board's top band), *then* the
request sent is an ordinary §2 anchor+side request with `anchorId = A` and
`side = before` — there is no distinct "first" intent on the wire — and the
server resolves it exactly as any `before A` request: coarsest-fit between
`A`'s true predecessor and `A`, or the floor-bounded prepend fallback
(TC-2.5) if `A` is the true first item.

**Automation test:** —

## TC-7.2 — "Last in list" is `{anchorId: last rendered item, side: after}`

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* the same rendered `A, B, C`, *when* the user expresses "last in
list" (e.g. the board's bottom band), *then* the request is `anchorId =
C`, `side = after`, and the server resolves it as any `after C` request:
coarsest-fit between `C` and its true successor, or the append fallback
`round(C.position + 1.0)` (TC-2.4) if `C` is the true last item.

**Automation test:** —

## TC-7.3 — First/last are read off the client's rendered order using the tie-break

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a target context in which the two leading items have an identical
`position` value and differ only in `createdAt`, *when* the client chooses
the anchor for "first in list," *then* it picks the item that Part 5's
tie-break sorts first (the earlier `createdAt`) — so the anchor the client
names is the same item the server would consider first, and an exact tie
cannot make the two disagree. Symmetrically for "last in list."

**Automation test:** —

## TC-7.4 — First-visible is the right anchor under a narrow view

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a true order `Z, A, B` where the client's view has loaded only
`A, B` (an unseen `Z` sits before the visible first item), *when* the
client places `X` "first in list" — sending `anchorId = A, side = before`
— *then* the server resolves `X` strictly between `Z` and `A`, and the
client's re-rendered view reads `X, A, B`: first in the list the user was
looking at. `X` is **not** placed ahead of `Z`, an item the user never saw
and expressed no intent about.

This is the case that distinguishes "client chooses the anchor" (safe —
the server still resolves against the anchor's *true* neighbor, so nothing
is leapfrogged) from "client computes the number" (TC-2.9/TC-2.11, unsafe).

**Automation test:** —

### Empty target context

## TC-7.5 — Empty column region: workphaseId-only move, existing position kept

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a column region (merged column, or one expanded sub-row) with no
items, and an item that already holds a real `position`, *when* the item
is dropped into it — via the top band, the middle band, or the bottom band,
indifferently, since there is no first or last item to anchor to — *then*
the request is a workphaseId-only move with no anchor, the item takes the
region's workphase, and its `position` is exactly unchanged (the §2
addendum, TC-2.24). "First" and "last" are the same slot here and neither
produces an anchor.

**Automation test:** —

## TC-7.6 — Empty column region, item with no position: append fallback

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* the same empty column region and an item with **no** position to
keep (a done item being reopened into it, or an item receiving its first
workphase), *when* it is dropped into the region, *then* it receives a
fresh position via the append fallback against the *workflow-wide* scope —
the true last positioned item anywhere in the workflow, or the bootstrap
`1.0` only if the whole workflow has no positioned items (TC-2.7). The
region being empty does not by itself make the scope empty.

**Automation test:** —

## TC-7.7 — Empty Stub list: attach/reparent with no anchor takes the append fallback

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a Card with no attached children, *when* an item is attached to
it (or reparented into it while staying attached) with no anchor — there
is none to name — *then* this is a scope change per Part 2's table and the
item takes the append fallback in its new `(parentId, isAttached)` scope,
which for an empty scope is the bootstrap `1.0`. Its previous position
(workflow-scoped, or from a former parent's sibling list) is not carried
over.

**Automation test:** —

### Done columns

## TC-7.8 — Done column: bands produce no anchor request; the drop is workphase-only

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a column whose covered workphases are terminal, rendering done
items `D1, D2` (ordered by `completedAt`, each with `position = null`),
*when* a detached/root item is dropped into it via the top band or the
bottom band, *then* the client sends a workphaseId-only move with **no**
`anchorId` — `D1`/`D2` have no position and cannot be anchors — and the
server resolves it as a workphase change: `completedAt` is set,
`position` is dropped (Part 6, TC-6.1/6.3), and the item's place among the
done items follows from `completedAt`, not from which band it was dropped
in.

Cross-reference TC-2.8: were a client to send a done item as `anchorId`
anyway, the server rejects it.

**Automation test:** —

### Scope check against the resulting state

## TC-7.9 — Anchor scope is validated against the item's *resulting* state

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Free Card `X` and Card `P` with attached children `S1, S2`, *when*
one request both attaches `X` to `P` and places it with `anchorId = S1,
side = after`, *then* the request is **accepted**: `S1` is a member of the
scope `X` will be in *after* the reparent (`(P, attached)`), even though
`X` is not in that scope when the request arrives. The server validates
the anchor against where the item will be, not where it is.

**Automation test:** —

## TC-7.10 — An anchor outside the resulting scope is rejected, nothing committed

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* the same `X`, `P`, `S1`, and an unrelated Card `Q` with attached
child `T1`, *when* a request attaches `X` to `P` but names `anchorId =
T1` (a member of `Q`'s sibling scope, not `P`'s), *then* the request is
rejected and — per the atomicity rule
([`../item-attachment/att-3-reparent-placement-atomicity.md`](../item-attachment/att-3-reparent-placement-atomicity.md)
ATT-3.7) — `X` is unchanged: still Free, same parent, same workphase,
same position.

**Automation test:** —

### 7.2 Reparenting re-resolves position, and the order matters

## TC-7.11 — Attach-with-placement resolves among the new parent's children, after the reparent

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Free Card `X` at workflow position `50.0` and Card `P` with
attached children `S1 = 1.0, S2 = 2.0`, *when* one request attaches `X`
to `P` with `anchorId = S1, side = after`, *then* `X`'s resulting
position is strictly between `1.0` and `2.0` — a number drawn from `P`'s
sibling list — and is neither `50.0` (kept) nor a value resolved against
`X`'s old workflow-wide neighbors. The scope change (Part 2's table:
detach → attach, fresh position) and the placement land in one request.

**Automation test:** —

## TC-7.12 — Reparent-while-attached-with-placement resolves in the new parent's scope, never the old

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* parent `A` with attached children `A1 = 1.0, A2 = 2.0, X = 3.0`,
and parent `B` with attached children `B1 = 100.0, B2 = 200.0` (ranges
chosen so a number from the wrong scope is unmistakable), *when* one
request reparents `X` to `B` (staying attached) with `anchorId = B1, side
= after`, *then* `X`'s position is strictly between `100.0` and `200.0`.
A value between `1.0` and `3.0` would mean the position was resolved
before the new parent took effect — the silently-wrong outcome
[`../item-attachment/`](../../wiki/item-attachment/README.md) §5 exists to
rule out. `A1`/`A2` and `B1`/`B2` are untouched.

**Automation test:** —

## TC-7.13 — Detach-with-placement resolves in the workflow scope against the anchor

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* attached child `X` of `P` (sibling-scoped position `2.0`) and
Free Cards `F1 = 10.0, F2 = 11.0` in the same workflow, *when* one request
detaches `X` and places it with `anchorId = F1, side = after`, *then*
`X` is Free (attachment cleared, `parentId` still `P` — see
[`../item-attachment/att-7-detach-preserves-parent.md`](../item-attachment/att-7-detach-preserves-parent.md)),
and its position is strictly between `10.0` and `11.0` — resolved in the
workflow-wide scope it now belongs to, not carried over as `2.0`.

**Automation test:** —

### 7.3 Cross-project reparenting doesn't change the comparison scope

## TC-7.14 — Cross-project reparent placement is not a special case

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* two projects `P1` and `P2` on the same workflow, Free Card `X` in
`P1`, and Card `Q` in `P2` with attached children `Q1 = 1.0, Q2 = 2.0`,
*when* `X` is attached to `Q` with `anchorId = Q1, side = after`, *then*
`X`'s position is strictly between `1.0` and `2.0` — computed by exactly
the same anchor + true-neighbor rule as the same-project TC-7.11, with no
cross-project adjustment. For a detached/root item moved cross-project
without a parent change of scope, the comparison scope is the same
workflow on both sides, so the number depends only on the anchor and its
true neighbor.

The project cascade itself is
[`../item-attachment/att-5-cross-project-reparenting.md`](../item-attachment/att-5-cross-project-reparenting.md).

**Automation test:** —

### 7.4 Done columns accept drops, but never positioned inserts

## TC-7.15 — A done Card's Stubs are anchorable and place normally

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* Card `P` in a terminal workphase (done, `position = null`,
`completedAt` set) with attached children `S1 = 1.0, S2 = 2.0` (positions
retained per Part 6 TC-6.5), *when* an item is placed among them with
`anchorId = S1, side = after`, *then* the request is accepted, the item
lands strictly between `1.0` and `2.0` in scope `(P, attached)`, inherits
`P`'s terminal workphase, and receives no `completedAt`. `P`'s terminality
has no bearing — its Stubs' scope is `(parentId, isAttached)`.

Contrast TC-7.8/TC-2.8: `P` itself is not anchorable; its Stubs are.

**Automation test:** —

### 7.5 The column's middle band is §2's workphaseId-only move

## TC-7.16 — The column's middle band is §2's workphaseId-only move

**Priority:** P1 · **Automated:** ⏳ pending triage

Cross-reference. The gesture's middle band sends a workphaseId-only move
with no anchor, which is exactly TC-2.24 (existing position kept
unchanged) — and, when the item has no position to keep, TC-6.9 / TC-7.6
(fresh position via the append fallback). No new positioning rule; this
case records that the band and the addendum are the same behavior so the
band's request can be asserted to hit that path and no other.

The band's client side is
[`../board-drag-interaction/drag-3-card-column-bands.md`](../board-drag-interaction/drag-3-card-column-bands.md)
DRAG-3.3.

**Automation test:** —
