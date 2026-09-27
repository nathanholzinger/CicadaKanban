# Part 5 — Reindex mechanism

**Next ID:** TC-5.15

**Wiki:** [`../../wiki/item-positioning/#5-reindexing-precision--magnitude`](../../wiki/item-positioning/README.md#5-reindexing-precision--magnitude)

| ID | Case | Priority | Automated |
|---|---|---|---|
| TC-5.1 | Reindex preserves current relative order | P0 | ✅ automated |
| TC-5.2 | Magnitude threshold triggers reindex before append | P0 | ✅ automated |
| TC-5.3 | Magnitude threshold scales with scope size | P1 | ✅ automated |
| TC-5.4 | Active items reindex as one coordinated cross-workphase scope | P0 | ✅ automated |
| TC-5.5 | Done items are never reindexed | P1 | ✅ automated |
| TC-5.6 | Tie-break on exact position equality | P1 | ✅ automated |
| TC-5.7 | Attached-siblings reindex doesn't leak into workflow-wide scope | P0 (regression/guard) | ✅ automated |
| TC-5.8 | Workflow-wide reindex doesn't leak into attached-siblings scope | P0 (regression/guard) | ✅ automated |
| TC-5.9 | A write that triggered a reindex discloses every renumbered position | P0 | ⏳ pending triage |
| TC-5.10 | Disclosure entries are `{id, position}` and nothing more | P1 | ⏳ pending triage |
| TC-5.11 | The written item is included in the disclosure when it was in the reindexed scope | P0 | ⏳ pending triage |
| TC-5.12 | No reindex → disclosure is absent or empty | P1 | ⏳ pending triage |
| TC-5.13 | Disclosure covers the whole reindexed scope, not just the caller's view | P0 | ⏳ pending triage |
| TC-5.14 | Every reindex-capable write path discloses | P1 | ⏳ pending triage |

*(TC-5.9–5.14 added by Epic 3.5 from §5 "Reindexing must be disclosed to
the caller." The client's side of the contract — what to do with the
disclosure — is [Part 5a](part-5a-client-reconciliation.md).)*

---

## TC-5.1 — Reindex preserves current relative order

**Priority:** P0 · **Automated:** ✅ automated

*Given* a comparison scope with items in some order (regardless of their
raw position values), *when* a reindex is triggered, *then* the items' new
clean sequential positions preserve their pre-reindex relative order
exactly.

**Automation test:** `server/tests/lib/positionResolver.test.ts` ›
`reindexScope` › "reassigns clean sequential positions while preserving
relative order"

## TC-5.2 — Magnitude threshold triggers reindex before append

**Priority:** P0 · **Automated:** ✅ automated

*Given* a scope where the next append-fallback value would cross
`max(1000, currentScopeItemCount + 100)`, *when* an append is attempted,
*then* the scope is reindexed first, and the append proceeds afterward
with a small, clean value.

**Automation test:** `positionResolver.test.ts` › `resolveAppendPosition`
› "reindexes before appending once the magnitude threshold is crossed"

## TC-5.3 — Magnitude threshold scales with scope size

**Priority:** P1 · **Automated:** ✅ automated

*Given* a scope that legitimately holds 1200 items with positions already
in a comparable range, *when* an append occurs, *then* it does *not*
trigger a reindex merely because a flat 1000 ceiling was crossed — the
threshold accounts for item count.

**Automation test:** `positionResolver.test.ts` › `resolveAppendPosition`
› "does not reindex when a large position is proportionate to a large item
count"

## TC-5.4 — Active items reindex as one coordinated cross-workphase scope

**Priority:** P0 · **Automated:** ✅ automated

*Given* multiple non-terminal workphases whose combined items need
reindexing, *when* a reindex is triggered by either cause (tight-gap or
magnitude) affecting the active scope, *then* all active items across
every non-terminal workphase are reset together in one operation — not
workphase-by-workphase.

**Automation test:** `items.test.ts` › "reindexes every non-terminal
workphase in the workflow together, in one coordinated pass (TC-5.4)".
Uses the tight-gap trigger (crossing the magnitude threshold via real
appends would need 1000+ POSTs — `max(1000, count+100)` is never crossed
by a plain `count+1` append). Seeds a tight gap in one workphase, an item
in a second non-terminal workphase in the same workflow, forces the
reindex via a real `PATCH /:id/move` anchor+side call, and confirms the
second workphase's item was renumbered in the same pass — the
coordination proof.

## TC-5.5 — Done items are never reindexed

**Priority:** P1 (regression/guard) · **Automated:** ✅ automated

*Given* a terminal-workphase (done) item, *when* an active-scope reindex
occurs elsewhere, *then* the done item's data is untouched — done items
have no stored `position` to reindex (see [Part 6](part-6-active-done-split.md)).

**Automation test:** `items.test.ts` › "excludes a done item from an
active-scope reindex (TC-5.6)". Found a real bug on first write (2026-08-18):
`positionScopeFor`'s workflow-wide scope (`workphaseIdsInSameWorkflow`)
includes terminal workphase ids with no `isTerminal` filter, so a done
item (`position: null`) was a scope member by `workphaseId` alone, and
SQLite sorts `NULL` first in `ASC` order — so `reindexScope` assigned the
done item a real position, contradicting this very rule. **Fixed** by
filtering `isNotNull(items.position)` directly in `reindexScope`
(`positionResolver.ts`) rather than narrowing `positionScopeFor`: the
append/anchor neighbor-lookup queries elsewhere in that file were already
safe (`gt()`/`lt()` against a real value can never match a null
position, and `ORDER BY position DESC` sorts `NULL` *last*, both
confirmed empirically) — `reindexScope`'s blind order-and-renumber loop
was the only exposed spot, so the fix lives there.

## TC-5.6 — Tie-break on exact position equality

**Priority:** P1 · **Automated:** ✅ automated

*Given* two items with identical `position` values in the same rendered
list, *when* the list is sorted client-side, *then* the item with the
earlier `createdAt` sorts first, deterministically, regardless of
underlying DB row order.

**Automation test:** `positionResolver.test.ts` › `reindexScope` ›
"breaks exact ties by createdAt, oldest first" (server reindex-time) and
`useItemManagement.test.ts` › `getWorkphaseItemsFrom` › "breaks an exact
position tie by createdAt, oldest first" (client render-time) — two
genuinely different code paths, not redundant

## TC-5.7 — Attached-siblings reindex doesn't leak into workflow-wide scope

**Priority:** P0 (regression/guard) · **Automated:** ✅ automated

*Given* a tight-gap reindex triggered within one parent's attached-siblings
scope (`parentId = X AND isAttached = 1`), *when* the reindex runs, *then*
an unrelated workflow-wide item sharing the same workphase — and the
parent itself — are completely untouched by it.

**Automation test:** `items.test.ts` › `describe('reindex scope isolation:
attached-siblings vs. workflow-wide', ...)` › "an attached-siblings
reindex does not touch an unrelated workflow-wide item". Added 2026-08-18
after a direct question about whether `positionScopeFor`'s two branches
(attached-siblings vs. workflow-wide — literal complements of each other
by construction, see the describe block's own header comment) could
cross-contaminate under a real reindex, the same class of gap TC-5.6
turned out to hide. Verified empirically rather than trusting the
construction argument alone. The pre-existing isolation coverage in
`itemRepositioningAttachedSiblings.spec.ts` never actually triggers a
reindex (its gaps are always resolvable directly), so this is genuinely
new coverage, not a duplicate.

## TC-5.8 — Workflow-wide reindex doesn't leak into attached-siblings scope

**Priority:** P0 (regression/guard) · **Automated:** ✅ automated

*Given* a tight-gap reindex triggered in the workflow-wide scope, *when*
the reindex runs, *then* an unrelated parent's attached children, sharing
the same workphase, are completely untouched by it.

**Automation test:** `items.test.ts` › same describe block as TC-5.8 ›
"a workflow-wide reindex does not touch an unrelated parent's attached
children" — the reverse direction of TC-5.8, added alongside it.

### Reindexing must be disclosed to the caller (Epic 3.5)

## TC-5.9 — A write that triggered a reindex discloses every renumbered position

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a comparison scope rendered by a caller as `A=1.0, C=1.5, E=1.75`
(with a gap too tight to insert into between `C` and `E`, or a scope past
the magnitude threshold), *when* the caller writes `X` with a placement
that triggers a reindex — say the scope is renumbered to `A=1, X=2, C=3,
E=4` — *then* the write's response carries a collection of `{id,
position}` pairs containing `A→1`, `X→2`, `C→3`, `E→4` (every item the
reindex renumbered), so that a caller who applies all of them renders
`A, X, C, E`.

*Negative framing the case exists for:* a caller that learned only `X=2`
and mixed it into its old values would sort `1.0, 2, 1.5, 1.75` → `A, C,
E, X` — consistent-looking and wrong. The disclosure is what makes that
impossible.

**Automation test:** —

## TC-5.10 — Disclosure entries are `{id, position}` and nothing more

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* a response carrying a reindex disclosure, *when* an entry is
inspected, *then* it has exactly two fields — the item's `id` and its new
`position` — and no other item fields (no title, workphase, parent, etc.).
A reindex changes positions and never any other field; a fuller row would
imply otherwise.

**Automation test:** —

## TC-5.11 — The written item is included in the disclosure when it was in the reindexed scope

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a write whose target scope is reindexed as part of resolving it,
*when* the response is inspected, *then* the written item's own `{id,
position}` pair appears in the disclosure collection alongside its
neighbors', and the value there equals the written item's `position` in the
response body. A caller therefore has exactly one rule — apply every pair
— and no precedence between "the item I wrote" and "the collection" to
reason about.

**Automation test:** —

## TC-5.12 — No reindex → disclosure is absent or empty

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* an ordinary position write that resolves directly (a gap that fits
at some precision; an append well under the magnitude threshold), *when*
the response is inspected, *then* the disclosure is either absent or an
empty collection — and a caller treats both identically as "no reindex
occurred." This is the overwhelmingly common path and must not carry any
per-item cost.

**Automation test:** —

## TC-5.13 — Disclosure covers the whole reindexed scope, not just the caller's view

**Priority:** P0 · **Automated:** ⏳ pending triage

*Given* a workflow-wide active scope spanning two non-terminal workphases
`W1` and `W2` (and, for the attached-siblings variant, a parent whose
attached children are the scope), and a caller whose view only loaded the
`W1` items, *when* the caller's write triggers a reindex of the active
scope, *then* the disclosure includes the renumbered `W2` items as well —
every item the coordinated reindex (TC-5.4) touched — not only the ids the
caller could have known about.

Corollary on the receiving side (Part 5a, TC-5a.4): an id the caller doesn't
recognize means "not in this view," never "missing data to go fetch."

**Automation test:** —

## TC-5.14 — Every reindex-capable write path discloses

**Priority:** P1 · **Automated:** ⏳ pending triage

*Given* each distinct write that can trigger a reindex —

- an anchor+side move whose gap exhausts precision (tight-gap, TC-2.12),
- a create or anchor-free append whose value would cross the magnitude
  threshold (TC-5.2),
- a scope-change reassignment (attach, detach, reparent — Part 2's table)
  whose append fallback crosses the magnitude threshold in the *new* scope,

*when* the reindex fires, *then* that write's response carries the
disclosure per TC-5.9 — the rule is "a response to a write that triggered
a reindex," not "a response to a move."

**Automation test:** —
