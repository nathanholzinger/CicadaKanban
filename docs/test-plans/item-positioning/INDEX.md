# Test Plan — Item Positioning & Board-Scoped Ordering

**Feature:** [`../../wiki/item-positioning/`](../../wiki/item-positioning/)
**Derived from:** Epic 3.2 hardened design (see the wiki page's design
history for how it was reached). No implementation code or existing test
files were consulted when deriving these — see `../README.md` for why.

## Suites

| Suite | Cases | P0 | P1 | P2 |
|---|---|---|---|---|
| [Part 1 — Position scalar](part-1-position-scalar.md) | 1 | 0 | 0 | 1 |
| [Part 2 — Anchor+side resolution](part-2-anchor-resolution.md) | 26 | 16 | 9 | 1 |
| [Part 3 — Attached-sibling reorder](part-3-attached-sibling-reorder.md) | 5 | 4 | 1 | 0 |
| [Part 4 — Merged-column interleaving](part-4-merged-column.md) | 5 | 4 | 1 | 0 |
| [Part 5 — Reindex mechanism](part-5-reindex.md) | 8 | 5 | 3 | 0 |
| [Part 6 — Active/done split](part-6-active-done-split.md) | 9 | 7 | 2 | 0 |
| [Cross-cutting regression guards](cross-cutting-regression.md) | 5 | 0 | 4 | 1 |
| **Total** | **59** | **36** | **20** | **3** |

## Status

**All 59 cases are triaged.** 58 are **✅ automated**; the remaining one
(TC-X.5, the drag-gesture rect-measurement limitation) is **⏸ deferred to
Epic 3.5**, not a gap — see `cross-cutting-regression.md`. None are
**❌ not automated**.

This reflects the full test reconciliation pass
([`../../audits/test-reconciliation-report-epic-3-2.md`](../../audits/test-reconciliation-report-epic-3-2.md)):
the original 55-case catalog (derived pre-implementation, per `../README.md`)
grew to 59 as reconciliation surfaced real documented rules with no catalog
entry (Section E) and shed one case (TC-4.6, folded into TC-4.1's existing
proof once workflow-wide scope made "drift" no longer a distinct
phenomenon). Keep this index current as future features touch this area —
it's a rollup, not a source of truth; the suite files themselves are that.
