# Test Plan — Item Positioning & Board-Scoped Ordering

**Feature:** [`../../wiki/item-positioning/`](../../wiki/item-positioning/)
**Derived from:** the wiki page as of Epic 3.5 (Epic 3.2's hardened
design, plus the Epic 3.5 additions: §2's amended "Client-side role," §5's
"Reindexing must be disclosed," §5a, and §7). No implementation code or
existing test files were consulted when deriving these — see `../README.md`
for why.

**Suite IDs:** this folder predates the per-suite ID convention and keeps
its `TC-<part>.<n>` form; the part number *is* the suite id, so `TC-7.4`
is suite 7, case 4. Cross-references from other features use the same
form.

## Suites

| Suite | Cases | P0 | P1 | P2 | Superseded |
|---|---|---|---|---|---|
| [Part 1 — Position scalar](part-1-position-scalar.md) | 1 | 0 | 0 | 1 | — |
| [Part 2 — Anchor+side resolution](part-2-anchor-resolution.md) | 30 | 19 | 10 | 1 | — |
| [Part 3 — Attached-sibling reorder](part-3-attached-sibling-reorder.md) | 4 | 3 | 1 | 0 | 1 (TC-3.3) |
| [Part 4 — Merged-column interleaving](part-4-merged-column.md) | 5 | 4 | 1 | 0 | — |
| [Part 5 — Reindex mechanism + disclosure](part-5-reindex.md) | 14 | 8 | 6 | 0 | — |
| [Part 5a — Client reconciliation order](part-5a-client-reconciliation.md) | 5 | 2 | 3 | 0 | — |
| [Part 6 — Active/done split](part-6-active-done-split.md) | 9 | 7 | 2 | 0 | — |
| [Part 7 — Board placement intents](part-7-board-placement-intents.md) | 16 | 11 | 5 | 0 | — |
| [Cross-cutting regression guards](cross-cutting-regression.md) | 3 | 0 | 3 | 0 | 2 (TC-X.3, TC-X.5) |
| **Total (active)** | **87** | **54** | **31** | **2** | **3** |

## Status

**54 cases ✅ automated · 33 ⏳ pending triage · 3 ⏸ superseded.**

- The 33 pending cases are Epic 3.5's additions (TC-2.27–2.30, TC-5.9–5.14,
  all of Part 5a, all of Part 7), plus two Epic 3.2 cases whose rule text
  changed: **TC-2.11** (rewritten — the client no longer computes a
  position even for display) and **TC-2.5** (text corrected to the wiki's
  floor-bounded prepend; its existing mapping needs re-verifying against
  the corrected rule).
- The 3 superseded cases (TC-3.3, TC-X.3, TC-X.5) guarded Epic 3.2 interim
  behavior that Epic 3.5 deliberately replaces. Each is kept in place under
  its ID with a "was:" note and a pointer to the replacing cases in
  [`../item-attachment/`](../item-attachment/) and
  [`../board-drag-interaction/`](../board-drag-interaction/). Their previous
  automation now asserts behavior the wiki no longer describes and is
  expected to be inverted or retired when the replacements are automated.

Epic 3.2's reconciliation pass
([`../../audits/test-reconciliation-report-epic-3-2.md`](../../audits/test-reconciliation-report-epic-3-2.md))
brought the original 55-case catalog to 59, all automated but one deferred
(TC-X.5). Keep this index current as future features touch this area —
it's a rollup, not a source of truth; the suite files themselves are that.
