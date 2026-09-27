# DRAG-6 — Optimistic preview, reconciliation, and failure

**Next ID:** DRAG-6.12

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §10

The generic client rules — ordinal preview, pending-is-not-null, the
four-step reconciliation order, the tie-break — are catalogued in
[`../item-positioning/part-2-anchor-resolution.md`](../item-positioning/part-2-anchor-resolution.md)
(TC-2.27–2.30) and
[`../item-positioning/part-5a-client-reconciliation.md`](../item-positioning/part-5a-client-reconciliation.md).
This suite holds what the *board* adds on top: applying the placement on
release, clearing the pending marker, the inversion tripwire, per-item
response sequencing, and failure resync.

The re-drag picture (reconciliation #22) and the stale-response resync
(#15) were built in the Story 3 follow-up (2026-09-15) and are now settled
rules — DRAG-6.7–DRAG-6.9. A placement can also carry a `parentId` (Story 4's
attach ghost — [DRAG-4.16](drag-4-attach-and-stub-placement.md)); the
reconciliation rules below apply to it unchanged.

| ID | Case | Priority | Automated |
|---|---|---|---|
| DRAG-6.1 | The board applies the drop's placement synchronously on release, before the request is sent, with no position invented | P0 | ⏳ pending triage |
| DRAG-6.2 | The previewed item is marked pending; its `position` is left alone and is not `null` | P0 | ⏳ pending triage |
| DRAG-6.3 | On the response: reindex → position → clear pending → inversion check → re-sort only if needed | P0 | ⏳ pending triage |
| DRAG-6.4 | An inversion is surfaced in the panel's inversion log, not silently repaired | P1 | ⏳ pending triage |
| DRAG-6.5 | Re-dragging a pending item: responses are sequenced per item so a stale one can't land last | P0 | ⏳ pending triage |
| DRAG-6.6 | A failed drop resyncs the board from the server; the guess is never kept | P0 | ⏳ pending triage |
| DRAG-6.7 | A stale response carrying reindex pairs triggers a resync rather than a guess | P1 | ⏳ pending triage |
| DRAG-6.8 | Cancelling a re-drag restores the still-pending marker rather than clearing it | P1 | ⏳ pending triage |
| DRAG-6.9 | A response landing mid-drag of the same item does not leave the ghost missing | P1 | ⏳ pending triage |
| DRAG-6.10 | `existing` never means "no position": an item with none previews at `last` | P1 | ⏳ pending triage |
| DRAG-6.11 | A done list previews an incoming item as the newest completion, not the oldest | P1 | ⏳ pending triage |

---

## DRAG-6.1 — The board applies the drop's placement synchronously on release, before the request is sent, with no position invented

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [TC-2.27](../item-positioning/part-2-anchor-resolution.md).
*Given* a drop resolved to `{anchorId: A, side: after}` in a column
rendering `A, C, E`, *when* the user releases, *then* — synchronously, in
the same step as the release and before the request leaves the client —
the dragged item is rendered at index 1 (`A, X, C, E`), the ghost's index,
and no `position` value is assigned to it to get there. The placement the
board applies is the same relation the request carries (`first`, `last`,
`existing`, or `{anchorId, side}`), so the picture before and after the
response is the same one. There is no window in which the board shows
its pre-drop order after the release.

**Automation test:** —

## DRAG-6.2 — The previewed item is marked pending; its `position` is left alone and is not `null`

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [TC-2.30](../item-positioning/part-2-anchor-resolution.md).
*Given* the preview in DRAG-6.1, *when* the board's state is inspected while
the write is in flight, *then* `X` carries a pending marker, `X.position`
equals its pre-drop value, and `X.position` is not `null`. Nothing in the
item itself is touched until the response; the placement is layered over
the position sort. *And when* another item's response causes a re-sort
during that window, *then* `X` does not jump to the top of the column.

**Automation test:** —

## DRAG-6.3 — On the response: reindex → position → clear pending → inversion check → re-sort only if needed

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [TC-5a.1](../item-positioning/part-5a-client-reconciliation.md)
/ [TC-5a.2](../item-positioning/part-5a-client-reconciliation.md). *Given*
the pending `X`, *when* its response arrives, *then* the board: applies
the reindex disclosure if any; assigns `X.position` from the response;
clears `X`'s pending marker; checks for inversions among items with real
positions; re-sorts only if one is found. The board's addition to the
generic order is that the pending marker is cleared *after* the position
is assigned and *before* the inversion check — so the check runs on a
list where `X` is an ordinary positioned item.

**Automation test:** —

## DRAG-6.4 — An inversion is surfaced in the panel's inversion log, not silently repaired

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a response whose reconciled positions invert the rendered order
(which a correctly-formed response never does — [TC-2.28](../item-positioning/part-2-anchor-resolution.md)),
*when* the inversion check fires, *then* the board re-sorts **and**
records the event in the dev/test panel's inversion log — the panel is
where it surfaces; nothing is written to the console. *And when* the
board's data is reloaded while the board stays open, *then* the recorded
entry is still in the log. An inversion means the client and server
disagreed about what the drop meant; it is a tripwire, and a record that
vanished on the next reload would defeat it.

**Automation test:** —

## DRAG-6.5 — Re-dragging a pending item: responses are sequenced per item so a stale one can't land last

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `X` dropped once (write 1 in flight) and immediately dragged and
dropped again to a different slot (write 2 in flight), *when* the
responses arrive in either order — including write 2's before write 1's —
*then* the board's final state for `X` is write 2's result (its position
and its ordinal slot), and write 1's response, if it arrives later, is
not applied over it: its row for `X` is discarded. Responses are
sequenced per item; a stale one can't be applied last. (If the stale
response also carried reindex pairs, DRAG-6.7 applies.)

**Automation test:** —

## DRAG-6.6 — A failed drop resyncs the board from the server; the guess is never kept

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a previewed drop whose write the server rejects, *when* the
rejection arrives, *then* the board discards the optimistic placement and
resyncs its item state from the server — the previewed order is not
retained, and no client-held value from the preview survives. Cross-
reference [ATT-3.7](../item-attachment/att-3-reparent-placement-atomicity.md)
(nothing changed server-side) and
[ATT-3.8](../item-attachment/att-3-reparent-placement-atomicity.md).

Per §3.2 a rejection should be nearly unreachable — an invalid target
shouldn't have been poppable ([DRAG-1.7/1.8](drag-1-contexts-and-popping.md))
— so a rejection arriving at all is itself a signal that the two
enforcement points have drifted ([ATT-4.9](../item-attachment/att-4-legal-parent-depth-cap.md)).

*(This case takes over the still-valid half of the Epic 3.2 case
[TC-2.11](../item-positioning/part-2-anchor-resolution.md), whose
`positionBetween` premise was superseded.)*

**Automation test:** —

## DRAG-6.7 — A stale response carrying reindex pairs triggers a resync rather than a guess

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* the two-writes-in-flight setup of DRAG-6.5, where write 1's response
arrives *after* write 2's and carries a reindex collection (other items'
positions rewritten by the server — [`../item-positioning/`](../item-positioning/)
§5a), *when* the stale response is received, *then* `X`'s own row from it
is discarded (DRAG-6.5) **and** the board resyncs its item state from the
server instead of applying the reindex pairs — the client does not guess
whether those pairs are still current after write 2. After the resync the
board matches the server, including every reindexed item.

*And given* a stale response with **no** reindex pairs, *then* discarding
its row is the whole handling; no resync is needed.

*(Reconciliation #15.)*

**Automation test:** —

## DRAG-6.8 — Cancelling a re-drag restores the still-pending marker rather than clearing it

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `X` dropped at slot `s1` (write 1 in flight, `X` rendered pending
at `s1`), *when* `X` is picked up again — the ghost taking over from the
pending marker — and the drag is then cancelled, or released where
nothing is written ([DRAG-1.9](drag-1-contexts-and-popping.md),
[DRAG-3.12](drag-3-card-column-bands.md)), while write 1 is still in
flight, *then* `X` is rendered pending at `s1` again — the stashed
placement is restored, not cleared — so the board never shows `X` at its
pre-write slot while a write that moves it is outstanding. *And given*
write 1 had already landed before the cancel, *then* there is nothing to
restore: `X` sits at its authoritative position with no marker.

*(Reconciliation #22.)*

**Automation test:** —

## DRAG-6.9 — A response landing mid-drag of the same item does not leave the ghost missing

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* `X` pending from write 1 and being re-dragged (ghost at the
drag's current placement), *when* write 1's response lands mid-drag,
*then* the response is reconciled normally (DRAG-6.3, DRAG-6.5) **and** the ghost
is restored at the drag's current placement without waiting for any
further cursor movement or state change — the board corrects the missing
placement reactively, so at most a single render shows `X` without one.
The drag continues, and its eventual release commits against the
reconciled board.

*(Reconciliation #22.)*

**Automation test:** —

## DRAG-6.10 — `existing` never means "no position": an item with none previews at `last`

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a Card `X` with `position = null` — a reopened done item, or an
item receiving its first workphase — *when* it is previewed with the
"keep existing position" placement (a middle-band release,
[DRAG-3.3](drag-3-card-column-bands.md)), *then* the ghost, and the
pending marker after release, sit at the **end** of the receiving list,
not the top — matching the append fallback the write will resolve to
([TC-6.9](../item-positioning/part-6-active-done-split.md),
[TC-7.5](../item-positioning/part-7-board-placement-intents.md)). The
picture before and after the response is the same one.

**Automation test:** —

## DRAG-6.11 — A done list previews an incoming item as the newest completion, not the oldest

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a done column rendering `D1, D2` by `completedAt` and a Card `X`
with no `completedAt` yet, *when* `X` is released into the done column
([DRAG-3.9](drag-3-card-column-bands.md)), *then* the preview and the
pending marker place `X` **after** `D2` — a missing `completedAt` sorts
last, matching the server's stamp on the write — and when the response
lands with `completedAt` set, `X` stays where it was previewed.

**Automation test:** —
