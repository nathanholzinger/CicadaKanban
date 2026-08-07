# Test Plan — Item Positioning & Board-Scoped Ordering

**Feature:** [`../../wiki/item-positioning/`](../../wiki/item-positioning/)
**Derived from:** Epic 3.2 hardened design (see the wiki page's design
history for how it was reached). No implementation code or existing test
files were consulted when deriving these — see `../README.md` for why.

## Suites

| Suite | Cases | P0 | P1 | P2 |
|---|---|---|---|---|
| [Part 1 — Position scalar](part-1-position-scalar.md) | 1 | 0 | 0 | 1 |
| [Part 2 — Anchor+side resolution](part-2-anchor-resolution.md) | 22 | 16 | 5 | 1 |
| [Part 3 — Attached-sibling reorder](part-3-attached-sibling-reorder.md) | 5 | 4 | 1 | 0 |
| [Part 4 — Merged-column interleaving](part-4-merged-column.md) | 6 | 4 | 2 | 0 |
| [Part 5 — Reindex mechanism](part-5-reindex.md) | 7 | 4 | 3 | 0 |
| [Part 6 — Active/done split](part-6-active-done-split.md) | 9 | 7 | 2 | 0 |
| [Cross-cutting regression guards](cross-cutting-regression.md) | 5 | 0 | 4 | 1 |
| **Total** | **55** | **35** | **17** | **3** |

## Status

All 55 cases are **⏳ pending triage** — none have been compared against
existing coverage-driven unit tests yet. That comparison is a separate,
later step (see `../README.md`); only survivors of that comparison get
turned into automated tests. This index's counts should be kept current as
triage and automation progress.
