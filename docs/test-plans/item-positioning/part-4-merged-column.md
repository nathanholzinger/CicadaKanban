# Part 4 — Merged-column interleaving + drag-bug fix

**Wiki:** [`../../wiki/item-positioning/#4-merged-column-interleaving`](../../wiki/item-positioning/README.md#4-merged-column-interleaving)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-4.1 | Merged column is a true union-sort, not concatenation | P0 | ✅ automated |
| TC-4.2 | Reorder within merged column is position-only when covered | P0 | ✅ automated |
| TC-4.3 | Drag-bug fix: hover no longer force-collapses to `entryWorkphaseId` | P0 | ✅ automated |
| TC-4.4 | Genuine cross-column move still snaps workphaceId correctly | P0 | ✅ automated |
| TC-4.5 | Expanded-column behavior unchanged | P1 | ✅ automated |
| TC-4.6 | No forced regrouping in merged columns | P1 | ⏳ pending triage |

---

## TC-4.1 — Merged column is a true union-sort, not concatenation

**Priority:** P0 · **Automated:** ✅ automated

*Given* a merged column covering workphaces W1 and W2, with items
interleaved by position across both (e.g. W1 item at 1.0, W2 item at 1.5,
W1 item at 2.0), *when* the column is rendered, *then* the displayed order
follows position across the union, not W1's items first followed by W2's
items.

**Automation test:** `client/src/components/workflow/useItemManagement.test.ts`
› `getMergedColumnItemsFrom` › "union-sorts across the covered workphases,
allowing genuine interleaving" (mirrors the wiki's W1/W2 interleave example)

## TC-4.2 — Reorder within merged column is position-only when covered

**Priority:** P0 · **Automated:** ✅ automated

*Given* a merged column covering W1 and W2, and an active item currently
in W1, *when* it is dropped elsewhere within the same merged column
(hovering an item in either W1 or W2), *then* only its `position` changes
— its `workphaceId` is untouched, regardless of which specific covered
workphase the hovered card belongs to.

**Automation test:** `client/src/components/workflow/boardDndUtils.test.ts`
› `resolveDropTarget` › "merged column body: reorder (append) when the
active item is already a covered-set member" and "merged column: reorder
across the whole covered set, not just the hovered card's own workphase
(the pre-Epic-3.2 bug)"

## TC-4.3 — Drag-bug fix: hover no longer force-collapses to `entryWorkphaseId`

**Priority:** P0 (regression-bug-fix) · **Automated:** ✅ automated

This replaces the prior bug where a merged column's hover always collapsed
to `entryWorkphaseId` even when the active item's workphace was already a
covered member. *Given* the same setup as TC-4.2, *when* the drop
previously would have incorrectly reassigned `workphaceId` to
`entryWorkphaseId`, *then* the fixed behavior leaves `workphaceId`
unchanged since the active item's current workphace is already in the
covered set.

**Automation test:** `boardDndUtils.test.ts` › `resolveDropTarget` ›
"merged column: reorder across the whole covered set, not just the hovered
card's own workphase (the pre-Epic-3.2 bug)" — the test's own name
identifies it as the fix for this exact bug

## TC-4.4 — Genuine cross-column move still snaps workphaceId correctly

**Priority:** P0 · **Automated:** ✅ automated

*Given* an item whose current workphace is *not* in the target merged
column's covered set, *when* it is dropped generically on the column body,
*then* it snaps to `entryWorkphaseId`; *when* dropped in expanded mode on
a specific sub-row, *then* it snaps to that precise workphaceId.

**Automation test:** `boardDndUtils.test.ts` › `resolveDropTarget` ›
"merged column body: move to entryWorkphaseId when the active item is not
a member", "merged column body: move when the active item has no known
workphase", "merged column: move to entryWorkphaseId when the active item
is genuinely from outside the covered set", and "expanded column: move to
the precise hovered workphase otherwise"

## TC-4.5 — Expanded-column behavior unchanged

**Priority:** P1 (regression/guard) · **Automated:** ✅ automated

*Given* an expanded column representing exactly one workphase, *when* an
item is dragged within it, *then* covered-set membership degenerates to
exact workphace equality and behavior matches pre-feature behavior.

**Automation test:** `boardDndUtils.test.ts` › "is a reorder when the
active item is already in that workphase", "is a move when the active item
is in a different workphase", and "expanded column: reorder when hovering
a card in the same workphase"

## TC-4.6 — No forced regrouping in merged columns

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a merged column where an item from W2 has drifted to sort ahead of
some W1 items (via normal reordering over time), *when* the column is
rendered, *then* the interleaved order is preserved as-is — nothing
silently regroups items back by workphase rank.

**Automation test:** — *(the mapped test, `useItemManagement.test.ts` ›
`getMergedColumnItemsFrom` › "union-sorts across the covered workphases...",
proves the mechanism has no regroup step, but doesn't simulate the
"drifted over time, then re-rendered" scenario this case describes)*
