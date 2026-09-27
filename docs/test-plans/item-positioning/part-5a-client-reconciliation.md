# Part 5a — Client reconciliation order

**Next ID:** TC-5a.6

**Wiki:** [`../../wiki/item-positioning/#5a-client-reconciliation-order`](../../wiki/item-positioning/README.md#5a-client-reconciliation-order)

**Added by Epic 3.5.** Applies to any client holding a locally-ordered
list. The board drag is what exercises it; the board-specific steps
(clearing the pending marker, surfacing an inversion, sequencing per-item
responses) are in
[`../board-drag-interaction/drag-6-preview-reconciliation.md`](../board-drag-interaction/drag-6-preview-reconciliation.md),
which cross-references these cases rather than restating them.

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-5a.1 | Reconciliation runs its four steps in the stated order | P0 | ⏳ pending triage |
| TC-5a.2 | Applying the reindex disclosure first prevents a spurious inversion | P0 | ⏳ pending triage |
| TC-5a.3 | Re-sort happens only when an inversion is actually found | P1 | ⏳ pending triage |
| TC-5a.4 | Unrecognized ids in the disclosure are ignored, not fetched | P1 | ⏳ pending triage |
| TC-5a.5 | Any client-side sort uses the tie-break verbatim | P1 | ⏳ pending triage |

---

## TC-5a.1 — Reconciliation runs its four steps in the stated order

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a client holding a locally-ordered list and a pending position
write for item `X`, *when* the write's response arrives, *then* the client
performs, in this order and no other:

1. apply the reindex disclosure collection, if populated (every `{id,
   position}` pair it holds an item for);
2. assign `X`'s authoritative `position` from the response;
3. check for inversions among items that have real positions — i.e. is
   there any adjacent pair in the rendered order whose `position` values
   (tie-broken per TC-5a.5) are out of order;
4. re-sort the list only if step 3 found an inversion.

The observable contract: after a correctly-formed response, the rendered
order equals what a fresh sort of the updated positions would produce,
*and* (per TC-5a.3) no re-sort was performed when none was needed.

**Automation test:** —

## TC-5a.2 — Applying the reindex disclosure first prevents a spurious inversion

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* rendered `A=1.0, C=1.5, E=1.75` with `X` previewed ordinally after
`A` (`A, X, C, E`), *when* the response arrives carrying `X=2` and the
disclosure `A→1, X→2, C→3, E→4`, *then* after reconciliation the positions
read `A=1, X=2, C=3, E=4`, the inversion check finds nothing, no re-sort
occurs, and the rendered order is still `A, X, C, E`.

*The negative this guards:* had the client checked for inversions *before*
applying the disclosure — seeing `A=1.0, X=2, C=1.5, E=1.75` — it would
have detected an "inversion" on data that was never inconsistent and
"fixed" it by reordering correct rows to `A, C, E, X`. The order of the
steps is the rule.

**Automation test:** —

## TC-5a.3 — Re-sort happens only when an inversion is actually found

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a reconciled response whose positions are already consistent with
the rendered order (the common case — see Part 2 TC-2.28 for why), *when*
reconciliation reaches step 4, *then* no re-sort is performed and the
rendered order is left exactly as it was — the list is not gratuitously
rebuilt.

*And given* a response whose reconciled positions genuinely invert the
rendered order (two items with real positions now out of sequence), *when*
step 3 detects it, *then* a re-sort is performed and the rendered order
afterward follows the positions.

**Automation test:** —

## TC-5a.4 — Unrecognized ids in the disclosure are ignored, not fetched

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a disclosure collection containing pairs for items the client
never loaded (the reindexed scope was wider than the view — Part 5
TC-5.13), *when* the client applies it, *then* the pairs whose ids it
holds are applied, the rest are silently skipped, no fetch or requery is
issued for them, and the client's list gains no entries. An unrecognized
id means "not in this view," never "missing data."

**Automation test:** —

## TC-5a.5 — Any client-side sort uses the tie-break verbatim

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* any place the client sorts a list of items by position — including
step 4's re-sort and the reading of "first"/"last" for Part 7's anchor
choice — *when* two items have identical `position` values (or one is
`null`), *then* the comparator is exactly
`(a.position ?? 0) - (b.position ?? 0) || a.createdAt - b.createdAt`: ties
break by `createdAt` ascending, nulls coerce to `0`. Any divergence from
this makes the client and server disagree on an exact tie.

Cross-reference [Part 5 TC-5.6](part-5-reindex.md) (the tie-break rule
itself); this case is that the rule is applied *everywhere* the client
sorts, not just in one path.

**Automation test:** —
