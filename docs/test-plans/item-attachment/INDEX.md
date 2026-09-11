# Test Plan — Item Attachment & Hierarchy Placement

**Feature:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/)
**Derived from:** the wiki page as of Epic 3.5 (2026-09-10). No
implementation code or existing test files were consulted when deriving
these — see `../README.md` for why.

**Suite IDs:** `ATT-1` … `ATT-7`. Cases are `TC-n` inside each suite file;
from outside a suite, refer to a case as `ATT-<suite>.<n>` (e.g.
`ATT-4.5`).

The wiki page is gesture-agnostic; every case here holds identically
whether the change arrives by drag, the Sheet's checkbox, the child badge,
or an MCP tool call. Cases don't distinguish entry points unless the rule
does.

## Suites

| Suite | Cases | P0 | P1 | P2 |
|---|---|---|---|---|
| [ATT-1 — Free / Attached state model](att-1-free-attached-state.md) | 7 | 5 | 2 | 0 |
| [ATT-2 — Reparenting is one-way](att-2-reparenting-is-one-way.md) | 2 | 2 | 0 | 0 |
| [ATT-3 — Reparent placement and atomic commit](att-3-reparent-placement-atomicity.md) | 8 | 4 | 3 | 1 |
| [ATT-4 — Legal parent and depth cap](att-4-legal-parent-depth-cap.md) | 9 | 6 | 3 | 0 |
| [ATT-5 — Cross-project reparenting](att-5-cross-project-reparenting.md) | 3 | 2 | 1 | 0 |
| [ATT-6 — Attaching to a done parent](att-6-attaching-to-done-parent.md) | 3 | 1 | 2 | 0 |
| [ATT-7 — Detaching preserves the parent](att-7-detach-preserves-parent.md) | 5 | 4 | 1 | 0 |
| **Total** | **37** | **24** | **12** | **1** |

## Status

**All 37 cases are ⏳ pending triage.** None have been compared against
existing automation yet — that's the Test Reconciler's pass. Several
(ATT-1.4, ATT-3.2/3.3, ATT-5.3, ATT-7.2) are cross-references to cases
already catalogued and automated under
[`../item-positioning/`](../item-positioning/) and are expected to map to
the same tests.

## Explicitly not covered (wiki "Open questions" — do not derive)

- **Free-item reparent while staying Free** (Story 9) — no case; ATT-3's
  scope note records that §4 is about Attached items only.
- **`CAP`'s real value** (Story 7) — cases parameterize on `CAP`, never on 6.
- **Beyond the cap** (pagination/folder scheme) — not MVP, no case.
- **Cross-workflow reparent at the API** — no rule exists; recorded in
  [`../../planning/epic-7-decisions.md`](../../planning/epic-7-decisions.md).

## Flagged for the Product Owner

Derived cases deliberately stop short where the wiki is silent. Each of
these would sharpen or add a case once answered:

1. **§8 — over-cap subtrees and move direction.** "Only a gesture that
   would *increase* depth past the cap is refused" and the formula
   `D + 1 + h <= CAP` disagree when the moving subtree is already taller
   than `CAP`: moving it to a shallower parent *decreases* its deepest
   leaf's depth but can still fail the formula. ATT-4.7 covers only the
   uncontested parts. Which reading is the rule?
2. **§8/§9 — detached descendants.** The PO confirmed (2026-09-10) that
   "entire descendant subtree" and `draggedSubtreeHeight` both include
   detached descendants. ATT-4.5 and ATT-5.2 are written that way; the
   wiki text would benefit from saying so explicitly.
3. **§1 — a parentless "attach" request.** The wiki says a top-level item
   is always Free, but not whether setting the attachment flag with no
   parent is *rejected* or *ignored*. ATT-1.1 asserts only the outcome.
4. **§7.1 (positioning) — an anchor outside the resulting scope.** The
   wiki says the server "validates the anchor's scope against where the
   item will be," which implies a rejection path but doesn't state it.
   [TC-7.10](../item-positioning/part-7-board-placement-intents.md) is
   written as a P1 rejection; confirm.
