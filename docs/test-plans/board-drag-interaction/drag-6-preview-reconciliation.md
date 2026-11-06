# DRAG-6 — Optimistic preview, reconciliation, and failure

**Next ID:** DRAG-6.30

The generic client rules (the ordinal preview, pending isn't `null`, the reconciliation order, the tie-break) are in [`../item-positioning/part-2-anchor-resolution.md`](../item-positioning/part-2-anchor-resolution.md) and [`../item-positioning/part-5a-client-reconciliation.md`](../item-positioning/part-5a-client-reconciliation.md). This suite holds what the board adds: applying the placement on release, the pending marker, showing a response that disagrees with the preview as the server saved it, sequencing responses for the same or different items, and resyncing on failure. A placement can carry a `parentId` (an attach), and every rule here applies to it unchanged.

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-6.1 | The board shows the drop's placement at the moment of release, before the request is sent, with no position invented | P0 | Automated |
| DRAG-6.2 | The previewed item is marked pending; its `position` is left alone, and isn't `null` | P0 | Automated |
| DRAG-6.4 | A response that orders the item differently from its preview is shown as the server saved it | P1 | Automated |
| DRAG-6.5 | Re-dragging a pending item: responses are sequenced per item, so a stale one can't land last | P0 | Automated |
| DRAG-6.6 | A failed drop resyncs the board from the server; the guess is never kept | P0 | Automated |
| DRAG-6.7 | A stale response carrying reindex pairs triggers a resync, not a guess | P1 | Open |
| DRAG-6.8 | Cancelling a re-drag restores the still-pending marker rather than clearing it | P1 | Open |
| DRAG-6.9 | A response landing mid-drag of the same item doesn't leave the ghost missing | P1 | Open |
| DRAG-6.10 | "Where its kept position falls" never means "no position": an item with none previews last | P1 | Automated |
| DRAG-6.11 | A done list previews an incoming item as the newest completion, not the oldest | P1 | Automated |
| DRAG-6.12 | An item whose kept position isn't comparable in the list it enters previews last | P1 | Automated |
| DRAG-6.13 | Re-dragging a pending item starts its ghost where the board shows it, not at its stored position | P1 | Automated |
| DRAG-6.15 | A reload that lands mid-drag stops the drag, and nothing is written | P1 | Open |
| DRAG-6.16 | A forced stop shows its cause in a banner that stays across the reload | P1 | Open |
| DRAG-6.17 | Assistive tech announces the forced-stop explanation | P1 | Open |
| DRAG-6.18 | A click leaves the cue up; starting the next drag clears it | P1 | Open |
| DRAG-6.19 | The cue expires at its configured lifetime, with the last quarter a fade | P1 | Open |
| DRAG-6.20 | The stopped item flashes wherever the reloaded board draws it | P1 | Open |
| DRAG-6.21 | A hidden stopped item is not revealed for its flash | P1 | Open |
| DRAG-6.22 | Cancels, no-write releases and resyncs without an item drag show no stop cue | P1 | Open |
| DRAG-6.23 | A pending row pulses from its own strength to half of it | P1 | Open |
| DRAG-6.24 | A pending pulse leaves the drop line and nested rows independent | P1 | Open |
| DRAG-6.25 | A reload stops a column drag without saving its interrupted reorder | P1 | Open |
| DRAG-6.26 | A stopped column drag shows a cause-specific banner and no flash | P1 | Planned |
| DRAG-6.27 | The flash window starts with the reloaded board and ends independently of the banner | P1 | Open |
| DRAG-6.28 | A stopped item brought into view flashes only for the window's remaining time | P1 | Open |
| DRAG-6.29 | Answers for different items preserve positions set by the later write | P0 | Automated |

---

## DRAG-6.1 — The board shows the drop's placement at the moment of release, before the request is sent, with no position invented

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10, wiki item-positioning §7.1

*Given* a drop that resolves to `{anchorId: A, side: after}` in a column rendering `A, C, E`, *when* the user releases, *then*, before the request leaves the client, the dragged item `X` renders at index 1 (`A, X, C, E`), the ghost's index, and no `position` value is assigned to it to get there ([TC-2.27](../item-positioning/part-2-anchor-resolution.md)). The placement the board shows is the relation the request carries (a workphase, and first, last, where the kept position falls, or an anchor and side), so the picture before and after the response is the same. The board never shows its pre-drop order after the release. *And given* the same column, *when* the user releases in its top band, *then* the request is `before A` ([TC-7.1](../item-positioning/part-7-board-placement-intents.md)), and the placement the board shows is that same anchor and side, not a bare first slot: `X` renders first, and once the response is applied the list still reads `X, A, C, E`. A bottom-band release is the same, as `after E` ([TC-7.2](../item-positioning/part-7-board-placement-intents.md)), and the list reads `A, C, E, X`.

**Automation test:** `tests/ui/drag-column-bands.spec.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts`

## DRAG-6.2 — The previewed item is marked pending; its `position` is left alone, and isn't `null`

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10

*Given* the preview of [DRAG-6.1](drag-6-preview-reconciliation.md), *when* the board's state is inspected while the write is in flight, *then* `X` carries the pending marker, `X.position` equals its value before the drop, and `X.position` isn't `null` ([TC-2.30](../item-positioning/part-2-anchor-resolution.md)). Nothing in the item itself changes until the response. *When* another item's response re-sorts the list in that window, *then* `X` doesn't jump to the top of the column.

**Automation test:** `tests/ui/drag-column-bands.spec.ts`, `client/src/components/workflow/itemWriteReconciliation.test.ts`

## DRAG-6.4 — A response that orders the item differently from its preview is shown as the server saved it

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10, wiki item-positioning §5a

*Given* a column rendering `A, C, E`, and `X` released after `A`, so the board previews `A, X, C, E` ([DRAG-6.1](drag-6-preview-reconciliation.md)), *when* the response gives `X` a position that sorts it after `E`, which a correct response never does ([TC-2.28](../item-positioning/part-2-anchor-resolution.md)), *then* as soon as the response is applied the list reads `A, C, E, X`, with `X` unmarked and `X.position` the response's. The board shows the order the server saved, without a reload: it doesn't keep `X` at its previewed slot, and doesn't adjust any item's position to match the preview. A difference like this means the client and the server disagreed about what the drop meant.

**Automation test:** `client/src/components/workflow/itemWriteReconciliation.test.ts`

## DRAG-6.5 — Re-dragging a pending item: responses are sequenced per item, so a stale one can't land last

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10

*Given* `X` dropped once (write 1 in flight) and straight away dragged and dropped again at a different slot (write 2 in flight), *when* the responses arrive in either order, including write 2's before write 1's, *then* `X` ends in write 2's result (its position and its slot), and write 1's response, if it arrives later, is not applied over it: its row for `X` is discarded. A stale response that also carries reindex pairs is [DRAG-6.7](drag-6-preview-reconciliation.md).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-6.6 — A failed drop resyncs the board from the server; the guess is never kept

**Priority:** P0 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10

*Given* a previewed drop whose write the server rejects, *when* the rejection arrives, *then* the board drops the previewed placement and resyncs its items from the server. The previewed order isn't kept, and no value from the preview survives ([ATT-3.7](../item-attachment/att-3-reparent-placement-atomicity.md)). A rejection should be nearly unreachable, since an invalid target is never poppable ([DRAG-1.7](drag-1-contexts-and-popping.md), [DRAG-1.8](drag-1-contexts-and-popping.md)); one arriving at all means the board's and the API's checks have drifted apart ([ATT-4.9](../item-attachment/att-4-legal-parent-depth-cap.md)).

**Automation test:** `tests/ui/drag-column-bands.spec.ts`

## DRAG-6.7 — A stale response carrying reindex pairs triggers a resync, not a guess

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* the two writes of [DRAG-6.5](drag-6-preview-reconciliation.md), where write 1's response arrives after write 2's and carries reindex pairs, *when* the stale response is received, *then* its row for `X` is discarded, **and** the board resyncs from the server instead of applying the pairs: the client doesn't guess whether they are still current after write 2. After the resync, the board matches the server, every reindexed item included. *And given* a stale response with no reindex pairs, *then* discarding its row is all that happens; no resync is needed.

**Automation test:** —

## DRAG-6.8 — Cancelling a re-drag restores the still-pending marker rather than clearing it

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* `X` dropped at slot `s1` (write 1 in flight, `X` shown pending at `s1`), *when* `X` is picked up again and the drag is cancelled, or released where nothing is written ([DRAG-1.9](drag-1-contexts-and-popping.md), [DRAG-3.12](drag-3-card-column-bands.md)), while write 1 is still in flight, *then* `X` is shown pending at `s1` again: the earlier placement is restored, not cleared, so the board never shows `X` at its old slot while a write that moves it is outstanding. *And given* write 1 had already landed before the cancel, *then* there is nothing to restore: `X` sits at its saved position, with no marker.

**Automation test:** —

## DRAG-6.9 — A response landing mid-drag of the same item doesn't leave the ghost missing

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* `X` pending from write 1, and being dragged again with its ghost at the drag's current placement, *when* write 1's response lands mid-drag, *then* the response is reconciled as usual ([TC-5a.1](../item-positioning/part-5a-client-reconciliation.md), [DRAG-6.5](drag-6-preview-reconciliation.md)), **and** the ghost is back at the drag's current placement as soon as the board has applied the response, without waiting for any further cursor movement. The drag carries on, and its release commits against the reconciled board.

**Automation test:** —

## DRAG-6.10 — "Where its kept position falls" never means "no position": an item with none previews last

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10

*Given* Card `X` with `position` `null` (a reopened done item, or an item getting its first workphase), *when* it is previewed with the "keep its position" placement (a middle-band release, [DRAG-3.3](drag-3-card-column-bands.md)), *then* the ghost, and the pending marker after release, sit at the **end** of the receiving list, not the top, matching the append fallback the write resolves to ([TC-2.24](../item-positioning/part-2-anchor-resolution.md), [TC-6.9](../item-positioning/part-6-active-done-split.md)).

**Automation test:** `client/src/components/workflow/placement.test.ts`, `client/src/components/workflow/itemListOps.test.ts`

## DRAG-6.11 — A done list previews an incoming item as the newest completion, not the oldest

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10

*Given* a done column rendering `D1, D2` by `completedAt`, and Card `X` with no `completedAt` yet, *when* `X` is released into the done column ([DRAG-3.9](drag-3-card-column-bands.md)), *then* the preview and the pending marker place `X` **after** `D2`, since a missing `completedAt` sorts last, matching the server's stamp on the write. *When* the response lands with `completedAt` set, *then* `X` stays where it was previewed.

**Automation test:** `client/src/components/workflow/itemListOps.test.ts`

## DRAG-6.12 — An item whose kept position isn't comparable in the list it enters previews last

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10

*Given* Stub `X`, whose position is numbered among its attached siblings, popped out to its Card's column so that it arrives Free in the column's workflow-wide list, *when* no card's hover has displaced it, *then* its ghost rests **last** in the list, matching the append fallback a detach without an anchor resolves to. *When* the cursor moves over the list, *then* hovering displaces the ghost from there exactly as for any Card ([DRAG-1.2](drag-1-contexts-and-popping.md)).

**Automation test:** `client/src/components/workflow/placement.test.ts`

## DRAG-6.13 — Re-dragging a pending item starts its ghost where the board shows it, not at its stored position

**Priority:** P1 · **Status:** Automated · **Rule:** wiki board-drag-interaction §10, wiki board-drag-interaction §2

*Given* `X` dropped at slot `s1` and shown pending there (write 1 in flight), while its stored `position` still places it at its old slot `s0`, *when* `X` is picked up again, *then* its ghost starts at `s1`, where the board shows it, and resting there opens no gap elsewhere ([DRAG-1.22](drag-1-contexts-and-popping.md)). At no point in the re-drag does the ghost appear at `s0`: the board never shows the pre-drop order while a write that moves `X` is outstanding.

**Automation test:** `client/src/components/workflow/placement.test.ts`

## DRAG-6.15 — A reload that lands mid-drag stops the drag, and nothing is written

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10, wiki boards-columns-unsorted §7

*Given* the user is dragging item `X`, *when* the board reloads from the server mid-drag because another item's earlier drop failed ([DRAG-6.6](drag-6-preview-reconciliation.md)), because a stale response carries reindex pairs ([DRAG-6.7](drag-6-preview-reconciliation.md)), or because a column reorder released just before this pickup failed, *then* the drag ends at once: no carried copy or ghost is left, and `X` renders wherever the reloaded board has it, which is where the server has it. Nothing is written for `X`, and releasing the pointer afterwards sends no request. This holds in a column/sub-row, a Card's descendants section, and the hierarchy modal. These are the three resyncs that can land while an item drag is held; reloads requiring a click, such as a board switch or a workphase or column edit, are not additional mid-drag scenarios. A column drag stopped by the same resyncs is [DRAG-6.25](drag-6-preview-reconciliation.md)'s.

**Automation test:** —

## DRAG-6.16 — A forced stop shows its cause in a banner that stays across the reload

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* item `X` is being dragged when any of the three resyncs in [DRAG-6.15](drag-6-preview-reconciliation.md) stops it, *when* the stop occurs, *then* a banner appears along the window's top edge with the explanation for its cause:

- after an earlier item move or column save failed: “Your last move didn’t save, so the board reloaded. Nothing moved.”;
- after a stale response carrying reindex pairs triggers a refresh: “The board refreshed, which stopped your drag. Nothing moved.”

The banner is visible over “Loading board…” and remains over the reloaded board, without being cleared by either transition. This holds for an item dragged in a column/sub-row, in a Card's descendants section, or in the hierarchy modal. The cause is the write or response that forced the resync, not a failure of the interrupted drag to save: that drag writes nothing ([DRAG-6.15](drag-6-preview-reconciliation.md)).

**Automation test:** —

## DRAG-6.17 — Assistive tech announces the forced-stop explanation

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* no forced-stop cue is showing, *when* a live item drag is stopped by any of the three resyncs in [DRAG-6.15](drag-6-preview-reconciliation.md), *then* assistive tech announces that cause's full explanation from [DRAG-6.16](drag-6-preview-reconciliation.md) without the user moving focus to the banner. The loading transition does not lose the announcement or substitute the other cause's explanation.

**Automation test:** —

## DRAG-6.18 — A click leaves the cue up; starting the next drag clears it

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* a forced-stop banner is showing, the board has reloaded, and the cue's lifetime has not expired, *when* the user clicks the banner or elsewhere on the board without starting a drag, *then* the banner remains, with the same explanation. *When* the user starts the next drag before that lifetime expires, *then* the explanation disappears at pickup, rather than remaining over the new gesture. This holds when the next drag starts during the fully visible part of the cue or during its fade.

**Automation test:** —

## DRAG-6.19 — The cue expires at its configured lifetime, with the last quarter a fade

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* a forced-stop cue with a positive configured lifetime `T`, *when* no new drag starts, *then* the banner remains fully visible for the first three quarters of `T`, fades during the last quarter, and is gone when `T` expires. Completing the board reload does not restart its lifetime. The same lifecycle holds for both cause explanations in [DRAG-6.16](drag-6-preview-reconciliation.md).

This case asserts the lifecycle using `T` as a parameter, not whether today's tuned duration feels right. It pins neither a fixed millisecond duration nor the banner's final palette or styling.

**Automation test:** —

## DRAG-6.20 — The stopped item flashes wherever the reloaded board draws it

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* `X` is the item being dragged when a resync stops the drag, and the reloaded board draws `X`, *when* it appears at its server-saved place, *then* `X`'s row flashes with two amber pulses. This holds when `X` is drawn as a Free Card, as a Stub in an expanded descendants section, or as a row in an open hierarchy modal. If the reload moved `X` relative to the interrupted drag's pickup, the flash follows the reloaded place. It identifies `X`, not the item whose earlier failed write or stale response caused the resync, and does not change either item's saved placement.

**Automation test:** —

## DRAG-6.21 — A hidden stopped item is not revealed for its flash

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* `X` is stopped mid-drag, *when* the reloaded board does not draw `X` because it lies inside a collapsed descendants section, past an overflow row, or in a closed hierarchy modal, *then* while `X` remains hidden there is no flash for it and no substitute item flashes. The section stays collapsed, the overflow row does not open the hidden subtree, the modal stays closed, and neither the board nor a list scrolls to reveal `X`. The forced-stop banner still gives the explanation in [DRAG-6.16](drag-6-preview-reconciliation.md). A user bringing `X` into view is [DRAG-6.28](drag-6-preview-reconciliation.md)'s.

**Automation test:** —

## DRAG-6.22 — Cancels, no-write releases and resyncs without an item drag show no stop cue

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* no forced-stop cue is showing, *when* any of the following happens, *then* no forced-stop banner or announcement appears, and no item receives the forced-stop flash:

- the user ends an item drag with Escape or another cancel;
- the user releases where the drag writes nothing, such as nowhere or a Stub's original gap and depth;
- an earlier failed item drop, failed column reorder or stale response resyncs the board with no drag running, including when the preceding drag has already been released or cancelled;
- a column is being dragged, with no item drag running, when a resync lands.

An item drag interrupted by an earlier failed column save is different: it shows the failed-write explanation in [DRAG-6.16](drag-6-preview-reconciliation.md).

**Automation test:** —

## DRAG-6.23 — A pending row pulses from its own strength to half of it

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10, wiki board-drag-interaction §4.1

*Given* a row with a write still in flight, *when* it is drawn at Full strength, *then* its pending pulse runs between 1 and 0.5. *When* another item is dragged and the pending row is Mid or Low for that drag, *then* it pulses between `overlayAnchorOpacity` and half that value, or between `overlayNeitherOpacity` and half that value, respectively. A re-dragged pending item's ghost pulses between `overlayGhostOpacity` and half that value. None pulses toward a fixed opacity that would brighten a dim row. When the pending row's response is applied and its marker clears, the pending pulse ends; any tier belonging to the current drag still applies.

The case asserts the relative endpoints, without pinning tuned opacity values or an animation duration.

**Automation test:** —

## DRAG-6.24 — A pending pulse leaves the drop line and nested rows independent

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10, wiki board-drag-interaction §4.1, wiki hierarchy-placement §7

*Given* pending Card `P` with attached Stub `S` that has no write in flight, *when* `P` pulses, *then* only `P`'s own content pulses. `S` keeps its own strength, Full with no drag or its assigned tier during a drag, without inheriting `P`'s pulse. *Given* instead `S` alone is pending, *then* it pulses on its own and `P` does not. If both are pending, each pulses relative to its own strength, without multiplying the parent's pulse into the child's. A drop line naming a pending row remains Full and does not pulse, including on a Mid Card or Stub.

**Automation test:** —

## DRAG-6.25 — A reload stops a column drag without saving its interrupted reorder

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10, wiki boards-columns-unsorted §7

*Given* a board whose server-saved column order is `A, C, E`, with `E` currently being dragged toward the first slot, *when* a reload lands because an earlier item drop failed, a stale response carries reindex pairs, or a column reorder released just before this drag failed, *then* the column drag ends at once and the board shows the server-saved order `A, C, E`. The interrupted drag sends no reorder request, including when the pointer is subsequently released. No item is moved by ending this drag. The current cue boundary is [DRAG-6.22](drag-6-preview-reconciliation.md)'s; the column banner is [DRAG-6.26](drag-6-preview-reconciliation.md)'s.

**Automation test:** —

## DRAG-6.26 — A stopped column drag shows a cause-specific banner and no flash

**Priority:** P1 · **Status:** Planned · **Rule:** wiki board-drag-interaction §10

*Given* a column is being dragged when any of the three resyncs in [DRAG-6.25](drag-6-preview-reconciliation.md) stops it, *when* the stop occurs, *then* the banner appears over loading and the reloaded board. An earlier failed item drop or column reorder says “Your last move didn’t save, so the board reloaded. Nothing moved.”; a stale response's refresh says “The board refreshed, which stopped your drag. Nothing moved.” The explanation is announced without a focus change. A click leaves it up; the next drag clears it. Otherwise it lasts for configured lifetime `T`, fully visible for its first three quarters and fading for the last quarter, without restarting when the reload finishes. Neither the stopped column nor any item receives a forced-stop flash.

**Automation test:** —

## DRAG-6.27 — The flash window starts with the reloaded board and ends independently of the banner

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* a live item drag stopped by any of the three resyncs in [DRAG-6.15](drag-6-preview-reconciliation.md), with flash-window length `F`, *when* its reload takes longer than `F`, *then* loading spends none of the window. When the reloaded board first draws the stopped item at time `t0`, the item has the full window until `t0 + F`, with the two pulses of [DRAG-6.20](drag-6-preview-reconciliation.md). At `t0 + F` the flash ends even if the banner remains.

*Starting again, when* a new drag starts or another reload starts before `t0 + F`, *then* the flash ends at that start. The other reload, with no new stop behind it, draws no flash, even if it draws the same item or finishes before `t0 + F`. Ending the new drag, redrawing the row or keeping the banner visible does not replay the old flash. The window is measured from the board drawing, even when the stopped item is hidden ([DRAG-6.28](drag-6-preview-reconciliation.md)), and is not the banner's lifetime.

**Automation test:** —

## DRAG-6.28 — A stopped item brought into view flashes only for the window's remaining time

**Priority:** P1 · **Status:** Open · **Rule:** wiki board-drag-interaction §10

*Given* the reloaded board is drawn at time `t0` with stopped item `X` inside a collapsed descendants section and flash-window length `F`, *when* the user opens the section at `t0 + d`, where `0 < d < F`, *then* `X` flashes at its saved place only until `t0 + F`, for the remaining `F - d`; mounting it does not start a fresh window. No other item flashes and opening the section changes no saved placement. *Starting again, when* the section is first opened at or after `t0 + F`, *then* `X` is drawn without the flash, even if the stop banner is still visible. The same boundary holds for a stopped item brought into view from behind overflow or in a previously closed hierarchy modal. No section, overflow or modal is opened automatically ([DRAG-6.21](drag-6-preview-reconciliation.md)).

**Automation test:** —

## DRAG-6.29 — Answers for different items preserve positions set by the later write

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §7, wiki positioning §8, wiki board-drag-interaction §10

*Given* active Free items `X = 1`, `Y = 998` and `Z = 999` in one workflow, with the board showing all three in a position-ordered column, *when* these two moves are sent and saved in this order, with their answers held:

- move `X` after `Z`, returning `X = 3` and disclosing `Y = 1`, `Z = 2`, `X = 3`;
- move `Y` after `X`, returning `Y = 4` without a reindex;

*then*, when `Y`'s answer is applied first and `X`'s older answer arrives second, `Y` keeps `4`. The applicable values `Z = 2` and `X = 3` still take effect, and the final board order is `Z, X, Y`, matching the server. It never applies the older pair `Y = 1` over the newer `4`.

*Given* instead the same initial values, *when* the server first saves `X` between `Y` and `Z`, returning `X = 998.5` without a reindex, then saves `Y` after `Z`, returning `Y = 3` and disclosing `X = 1`, `Z = 2`, `Y = 3`, *then* applying the second answer before the first leaves `X = 1`, `Z = 2`, `Y = 3`, in order `X, Z, Y`. The older written-row value `X = 998.5` never replaces the newer disclosed `1`.

Answering either pair in its saved order ends in the same respective positions and order. Where currency cannot be established, a fresh read may supply the saved result instead; the older answer still never restores a superseded position. These fixtures specify the successful responses, not a fixed reindex threshold. The rule covers the board's position-bearing answers from drags, inline creates and Sheet writes, rather than only re-drags of one item.

**Automation test:** `client/src/components/workflow/useItemManagement.test.ts`
