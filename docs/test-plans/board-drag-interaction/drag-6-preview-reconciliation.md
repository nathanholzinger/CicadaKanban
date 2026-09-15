# DRAG-6 — Optimistic preview, reconciliation, and failure

**Wiki:** [`../../wiki/board-drag-interaction/`](../../wiki/board-drag-interaction/README.md) §10

**Suite ID:** `DRAG-6`. Cases are `TC-n` within this file; from elsewhere,
refer to them as `DRAG-6.n`.

The generic client rules — ordinal preview, pending-is-not-null, the
four-step reconciliation order, the tie-break — are catalogued in
[`../item-positioning/part-2-anchor-resolution.md`](../item-positioning/part-2-anchor-resolution.md)
(TC-2.27–2.30) and
[`../item-positioning/part-5a-client-reconciliation.md`](../item-positioning/part-5a-client-reconciliation.md).
This suite holds what the *board* adds on top: applying the placement on
release, clearing the pending marker, the inversion tripwire, per-item
response sequencing, and failure resync.

**Not catalogued: the interim picture during a re-drag.** §10 describes,
as built in Story 3 and *accepted for now*, what the board shows while a
pending item is re-dragged (the ghost replaces the pending marker; a
cancel or a no-write release clears the placement so the item shows at
its pre-write slot until the response lands; a response landing mid-drag
clears the ghost until the machine's next state change). The wiki names
the intended replacements (restore the marker on cancel, keep the ghost
through a mid-drag response) as riding along with reconciliation #15/#22.
No case is derived from the interim picture; the durable rule — the
picture corrects itself when the response lands, and the final state is
the latest write's — is TC-5.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-1 | The board applies the drop's placement synchronously on release, before the request is sent, with no position invented | P0 | ⏳ pending triage |
| TC-2 | The previewed item is marked pending; its `position` is left alone and is not `null` | P0 | ⏳ pending triage |
| TC-3 | On the response: reindex → position → clear pending → inversion check → re-sort only if needed | P0 | ⏳ pending triage |
| TC-4 | An inversion is surfaced in the panel's inversion log, not silently repaired | P1 | ⏳ pending triage |
| TC-5 | Re-dragging a pending item: responses are sequenced per item so a stale one can't land last | P0 | ⏳ pending triage |
| TC-6 | A failed drop resyncs the board from the server; the guess is never kept | P0 | ⏳ pending triage |
| TC-7 | A stale response carrying reindex pairs triggers a resync rather than a guess | P1 | ⏳ pending triage |

---

## TC-1 — The board applies the drop's placement synchronously on release, before the request is sent, with no position invented

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

## TC-2 — The previewed item is marked pending; its `position` is left alone and is not `null`

**Priority:** P0 · **Automated:** ⏳ pending triage

Cross-reference [TC-2.30](../item-positioning/part-2-anchor-resolution.md).
*Given* the preview in TC-1, *when* the board's state is inspected while
the write is in flight, *then* `X` carries a pending marker, `X.position`
equals its pre-drop value, and `X.position` is not `null`. Nothing in the
item itself is touched until the response; the placement is layered over
the position sort. *And when* another item's response causes a re-sort
during that window, *then* `X` does not jump to the top of the column.

**Automation test:** —

## TC-3 — On the response: reindex → position → clear pending → inversion check → re-sort only if needed

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

## TC-4 — An inversion is surfaced in the panel's inversion log, not silently repaired

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

## TC-5 — Re-dragging a pending item: responses are sequenced per item so a stale one can't land last

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* `X` dropped once (write 1 in flight) and immediately dragged and
dropped again to a different slot (write 2 in flight), *when* the
responses arrive in either order — including write 2's before write 1's —
*then* the board's final state for `X` is write 2's result (its position
and its ordinal slot), and write 1's response, if it arrives later, is
not applied over it: its row for `X` is discarded. Responses are
sequenced per item; a stale one can't be applied last. (If the stale
response also carried reindex pairs, TC-7 applies.)

**Automation test:** —

## TC-6 — A failed drop resyncs the board from the server; the guess is never kept

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

## TC-7 — A stale response carrying reindex pairs triggers a resync rather than a guess

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* the two-writes-in-flight setup of TC-5, where write 1's response
arrives *after* write 2's and carries a reindex collection (other items'
positions rewritten by the server — [`../item-positioning/`](../item-positioning/)
§5a), *when* the stale response is received, *then* `X`'s own row from it
is discarded (TC-5) **and** the board resyncs its item state from the
server instead of applying the reindex pairs — the client does not guess
whether those pairs are still current after write 2. After the resync the
board matches the server, including every reindexed item.

*And given* a stale response with **no** reindex pairs, *then* discarding
its row is the whole handling; no resync is needed.

*(Reconciliation #15, ruled in the wiki; code pending.)*

**Automation test:** —
