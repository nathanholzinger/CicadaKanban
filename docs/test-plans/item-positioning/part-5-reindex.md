# TC-5 — Reindexing and its disclosure

**Next ID:** TC-5.16

| ID | Case | Priority | Status |
|---|---|---|---|
| TC-5.1 | A reindex keeps the scope's order | P0 | Automated |
| TC-5.2 | Crossing the magnitude threshold reindexes before the append | P0 | Automated |
| TC-5.3 | The magnitude threshold scales with the scope's size | P1 | Automated |
| TC-5.4 | Active items reindex as one scope, across every active workphase | P0 | Automated |
| TC-5.5 | Done items are never reindexed | P1 | Automated |
| TC-5.6 | A reindex breaks an exact tie by creation time | P1 | Automated |
| TC-5.7 | An attached-siblings reindex doesn't touch the workflow scope | P0 | Automated |
| TC-5.8 | A workflow reindex doesn't touch attached siblings | P0 | Automated |
| TC-5.9 | A write that triggered a reindex discloses every renumbered position | P0 | Automated |
| TC-5.10 | Each disclosed entry is `{id, position}` and nothing more | P1 | Automated |
| TC-5.11 | The written item is in the disclosure when its scope was reindexed | P0 | Automated |
| TC-5.12 | With no reindex, the disclosure is absent or empty | P1 | Automated |
| TC-5.13 | The disclosure covers the whole reindexed scope, not the caller's view | P0 | Automated |
| TC-5.14 | Every item write that can reindex discloses | P1 | Automated |
| TC-5.15 | Done items don't count toward the magnitude threshold | P2 | Open |

---

## TC-5.1 — A reindex keeps the scope's order

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §6

*Given* a comparison scope whose items are in some order, at any positions, *when* it is reindexed, *then* its items take clean sequential values, `1`, `2`, `3` and on, and their order is exactly what it was.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-5.2 — Crossing the magnitude threshold reindexes before the append

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §6

*Given* a scope of `n` items whose next appended value would cross `max(1000, n + 100)`, *when* an item is appended, *then* the scope is reindexed first, and the appended item takes the value after the reindexed last item: `n + 1`.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-5.3 — The magnitude threshold scales with the scope's size

**Priority:** P1 · **Status:** Automated · **Rule:** wiki positioning §6

*Given* a scope of 1,200 items whose true last is at `1250`, *when* an item is appended, at `1251`, *then* no reindex happens: `1251` doesn't cross `max(1000, 1200 + 100)`, which is `1300`.

**Automation test:** `server/tests/lib/positionResolver.test.ts`

## TC-5.4 — Active items reindex as one scope, across every active workphase

**Priority:** P0 · **Status:** Automated · **Rule:** wiki item-positioning §5

*Given* a workflow's Free items in two non-terminal workphases, `W1` and `W2`, *when* a reindex fires in `W1`, by either trigger, *then* `W2`'s items are renumbered in the same operation, in one sequence with `W1`'s and in their combined order. No workphase is reindexed on its own.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-5.5 — Done items are never reindexed

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §5, wiki item-positioning §6

*Given* a done Free item, with no position, in a workflow, *when* the workflow's active scope is reindexed, *then* the done item still has no position, and nothing else about it changes.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-5.6 — A reindex breaks an exact tie by creation time

**Priority:** P1 · **Status:** Automated · **Rule:** wiki positioning §1, wiki positioning §6

*Given* two items in one scope with the same `position`, *when* the scope is reindexed, *then* the one created earlier takes the lower new value, whatever order the database holds them in. How a client sorts a tie is [TC-5a.5](part-5a-client-reconciliation.md).

**Automation test:** `server/tests/lib/positionResolver.test.ts`

## TC-5.7 — An attached-siblings reindex doesn't touch the workflow scope

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §6, wiki item-positioning §5

*Given* `P`'s attached children with a gap too tight to split, and a Free item in the same workphase, *when* an insert among `P`'s children triggers a reindex, *then* the Free item and `P` itself keep their positions exactly.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-5.8 — A workflow reindex doesn't touch attached siblings

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §6, wiki item-positioning §5

*Given* Free items with a gap too tight to split, and `Q`'s attached children in the same workphase, *when* an insert among the Free items triggers a reindex, *then* `Q`'s children keep their positions exactly.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-5.9 — A write that triggered a reindex discloses every renumbered position

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §7, wiki item-positioning §5.1

*Given* a caller that renders `A` (`1.0`), `C` and `E`, with `C` and `E` so close above `A` that no value fits between `A` and `C`, *when* it places `X` after `A`, *then* the scope is reindexed first, to `A = 1`, `C = 2` and `E = 3`, and `X` is then placed at `1.5` ([TC-2.12](part-2-anchor-resolution.md)). The response's `reindexed` field holds an `{id, position}` pair for every item the reindex renumbered: `A → 1`, `C → 2` and `E → 3`. A caller that applies them all renders `A, X, C, E`. One that learned only `X = 1.5`, and kept its old values for `C` and `E`, would sort `X` last.

**Automation test:** `server/tests/routes/items.test.ts`

## TC-5.10 — Each disclosed entry is `{id, position}` and nothing more

**Priority:** P1 · **Status:** Automated · **Rule:** wiki positioning §7, wiki item-positioning §5.1

*Given* a response carrying `reindexed`, *when* an entry is read, *then* it has exactly two fields, `id` and `position`, and no other field of the item.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-5.11 — The written item is in the disclosure when its scope was reindexed

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §7, wiki item-positioning §5.1

*Given* a write whose own scope is reindexed as part of resolving it, *when* the response is read, *then* `reindexed` holds the written item's pair, and the `position` there equals the `position` in the response body.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-5.12 — With no reindex, the disclosure is absent or empty

**Priority:** P1 · **Status:** Automated · **Rule:** wiki positioning §7, wiki item-positioning §5.1

*Given* a position write that resolves without a reindex (a gap that fits, or an append under the magnitude threshold), *when* the response is read, *then* `reindexed` is absent, or an empty collection.

**Automation test:** `server/tests/routes/items.hierarchy.test.ts`

## TC-5.13 — The disclosure covers the whole reindexed scope, not the caller's view

**Priority:** P0 · **Status:** Automated · **Rule:** wiki positioning §7, wiki item-positioning §5.1

*Given* an active scope across non-terminal workphases `W1` and `W2`, and a caller whose view holds only `W1`'s items, *when* its write triggers a reindex of that scope, *then* `reindexed` also holds a pair for each of `W2`'s renumbered items: every item the reindex touched ([TC-5.4](part-5-reindex.md)). *And given* the reindexed scope is `P`'s attached children, *then* it holds a pair for every child of `P` that was renumbered. What a caller does with ids it doesn't hold is [TC-5a.4](part-5a-client-reconciliation.md).

**Automation test:** `server/tests/routes/items.test.ts`, `server/tests/routes/items.hierarchy.test.ts`

## TC-5.14 — Every item write that can reindex discloses

**Priority:** P1 · **Status:** Automated · **Rule:** wiki item-positioning §5.1

*Given* each of `POST /items`, `PUT /items/:id` and `PATCH /items/:id/move`, *when* the write triggers a reindex, whether through a tight gap beside its anchor or through the magnitude threshold on an append (including the append a scope change takes), *then* its response carries `reindexed` as [TC-5.9](part-5-reindex.md) describes. The rule covers any write that reindexed, not only a move.

**Automation test:** `server/tests/routes/items.test.ts`, `server/tests/routes/items.hierarchy.test.ts`

## TC-5.15 — Done items don't count toward the magnitude threshold

**Priority:** P2 · **Status:** Open · **Rule:** wiki positioning §6, wiki item-positioning §5

*Given* a workflow with 950 done Free items and 5 active Free items, the last of them at `1040`, *when* a Free item is appended, *then* the scope is reindexed first, and the new item takes `6`. `n` is 5, since done items have no position and aren't in the scope, so `1041` crosses `max(1000, 5 + 100)`, which is `1000`.

**Automation test:** —
