# Part 5 — Reindex mechanism

**Wiki:** [`../../wiki/item-positioning/#5-reindexing-precision--magnitude`](../../wiki/item-positioning/README.md#5-reindexing-precision--magnitude)

| ID | Case | Priority | Automated | Automation test |
|---|---|---|---|---|
| TC-5.1 | Reindex preserves current relative order | P0 | ⏳ pending triage | — |
| TC-5.2 | Magnitude threshold triggers reindex before append | P0 | ⏳ pending triage | — |
| TC-5.3 | Magnitude threshold scales with scope size | P1 | ⏳ pending triage | — |
| TC-5.4 | Active items reindex as one coordinated cross-workphase scope | P0 | ⏳ pending triage | — |
| TC-5.5 | Two independently-reindexed active scopes never collide | P0 | ⏳ pending triage | — |
| TC-5.6 | Done items are never reindexed | P1 | ⏳ pending triage | — |
| TC-5.7 | Tie-break on exact position equality | P1 | ⏳ pending triage | — |

---

## TC-5.1 — Reindex preserves current relative order

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a comparison scope with items in some order (regardless of their
raw position values), *when* a reindex is triggered, *then* the items' new
clean sequential positions preserve their pre-reindex relative order
exactly.

## TC-5.2 — Magnitude threshold triggers reindex before append

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a scope where the next append-fallback value would cross
`max(1000, currentScopeItemCount + 100)`, *when* an append is attempted,
*then* the scope is reindexed first, and the append proceeds afterward
with a small, clean value.

## TC-5.3 — Magnitude threshold scales with scope size

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a scope that legitimately holds 1200 items with positions already
in a comparable range, *when* an append occurs, *then* it does *not*
trigger a reindex merely because a flat 1000 ceiling was crossed — the
threshold accounts for item count.

## TC-5.4 — Active items reindex as one coordinated cross-workphase scope

**Priority:** P0 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* multiple non-terminal workphaces whose combined items need
reindexing, *when* a reindex is triggered by either cause (tight-gap or
magnitude) affecting the active scope, *then* all active items across
every non-terminal workphace are reset together in one operation — not
workphace-by-workphace.

## TC-5.5 — Two independently-reindexed active scopes never collide

**Priority:** P0 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* two non-terminal workphaces that both needed reindexing at
different times, *when* their items are later compared in a merged
column, *then* there is no position collision — because both were part of
the same coordinated reindex, not separate resets.

## TC-5.6 — Done items are never reindexed

**Priority:** P1 (regression/guard) · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* a terminal-workphace (done) item, *when* an active-scope reindex
occurs elsewhere, *then* the done item's data is untouched — done items
have no stored `position` to reindex (see [Part 6](part-6-active-done-split.md)).

## TC-5.7 — Tie-break on exact position equality

**Priority:** P1 · **Automated:** ⏳ pending triage · **Automation test:** —

*Given* two items with identical `position` values in the same rendered
list, *when* the list is sorted client-side, *then* the item with the
earlier `createdAt` sorts first, deterministically, regardless of
underlying DB row order.
