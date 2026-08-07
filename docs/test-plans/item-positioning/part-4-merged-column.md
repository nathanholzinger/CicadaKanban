# Part 4 — Merged-column interleaving + drag-bug fix

**Wiki:** [`../../wiki/item-positioning/#4-merged-column-interleaving`](../../wiki/item-positioning/README.md#4-merged-column-interleaving)

| ID | Case | Priority | Automated | Automation test |
|---|---|---|---|---|
| TC-4.1 | Merged column is a true union-sort, not concatenation | P0 | ⏳ pending triage | — |
| TC-4.2 | Reorder within merged column is position-only when covered | P0 | ⏳ pending triage | — |
| TC-4.3 | Drag-bug fix: hover no longer force-collapses to `entryWorkphaseId` | P0 | ⏳ pending triage | — |
| TC-4.4 | Genuine cross-column move still snaps workphaceId correctly | P0 | ⏳ pending triage | — |
| TC-4.5 | Expanded-column behavior unchanged | P1 | ⏳ pending triage | — |
| TC-4.6 | No forced regrouping in merged columns | P1 | ⏳ pending triage | — |

---

## TC-4.1 — Merged column is a true union-sort, not concatenation

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a merged column covering workphaces W1 and W2, with items
interleaved by position across both (e.g. W1 item at 1.0, W2 item at 1.5,
W1 item at 2.0), *when* the column is rendered, *then* the displayed order
follows position across the union, not W1's items first followed by W2's
items.

## TC-4.2 — Reorder within merged column is position-only when covered

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a merged column covering W1 and W2, and an active item currently
in W1, *when* it is dropped elsewhere within the same merged column
(hovering an item in either W1 or W2), *then* only its `position` changes
— its `workphaceId` is untouched, regardless of which specific covered
workphase the hovered card belongs to.

## TC-4.3 — Drag-bug fix: hover no longer force-collapses to `entryWorkphaseId`

**Priority:** P0 (regression-bug-fix) · **Automated:** ⏳ pending triage · **Automation test:** —

This replaces the prior bug where a merged column's hover always collapsed
to `entryWorkphaseId` even when the active item's workphase was already a
covered member. *Given* the same setup as TC-4.2, *when* the drop
previously would have incorrectly reassigned `workphaceId` to
`entryWorkphaseId`, *then* the fixed behavior leaves `workphaceId`
unchanged since the active item's current workphase is already in the
covered set.

## TC-4.4 — Genuine cross-column move still snaps workphaceId correctly

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an item whose current workphace is *not* in the target merged
column's covered set, *when* it is dropped generically on the column body,
*then* it snaps to `entryWorkphaseId`; *when* dropped in expanded mode on
a specific sub-row, *then* it snaps to that precise workphaseId.

## TC-4.5 — Expanded-column behavior unchanged

**Priority:** P1 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* an expanded column representing exactly one workphase, *when* an
item is dragged within it, *then* covered-set membership degenerates to
exact workphace equality and behavior matches pre-feature behavior.

## TC-4.6 — No forced regrouping in merged columns

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a merged column where an item from W2 has drifted to sort ahead of
some W1 items (via normal reordering over time), *when* the column is
rendered, *then* the interleaved order is preserved as-is — nothing
silently regroups items back by workphase rank.
