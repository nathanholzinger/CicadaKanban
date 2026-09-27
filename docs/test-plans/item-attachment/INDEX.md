# Test Plan — Item Attachment & Hierarchy Placement

**Feature:** [`../../wiki/item-attachment/`](../../wiki/item-attachment/)
**Derived from:** the wiki page as of Epic 3.5 (2026-09-10). No
implementation code or existing test files were consulted when deriving
these — see `../README.md` for why.

**Suite IDs:** `ATT-1` … `ATT-7`. A case is written by its full ID, `<suite>.<n>` (e.g.
`ATT-4.5`), in its own suite file as everywhere else.

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
| [ATT-7 — Detaching preserves the parent](att-7-detach-preserves-parent.md) | 6 | 5 | 1 | 0 |
| **Total** | **38** | **25** | **12** | **1** |

## Status

**37 of 38 cases are ⏳ pending triage.** None have been compared against
existing automation yet — that's the Test Reconciler's pass (Epic 3.5
Story 10). The exception is ATT-7.6, added 2026-09-21 from the Story 4
audit's #1 finding and mapped to its test on the day. Several
(ATT-1.4, ATT-3.2/3.3, ATT-5.3, ATT-7.2) are cross-references to cases
already catalogued and automated under
[`../item-positioning/`](../item-positioning/) and are expected to map to
the same tests.

## Explicitly not covered (wiki "Open questions" — do not derive)

- **Free-item reparent while staying Free *as a board gesture*** (Story 9)
  — no case. *(The API rule itself was settled 2026-09-11 — see below.)*
- **`CAP`'s real value** (Story 7) — cases parameterize on `CAP`, never on 6.
- **Beyond the cap** (pagination/folder scheme) — not MVP, no case.
- ~~**Cross-workflow reparent at the API** — no rule exists; recorded in
  [`../../planning/epic-7-decisions.md`](../../planning/epic-7-decisions.md).~~
  *Superseded 2026-09-10 — accepted at the API, see below.*

## Flagged for the Product Owner — all resolved 2026-09-10

Derived cases deliberately stopped short where the wiki was silent. Each
answer below has been written into the wiki; the affected cases should be
sharpened when Story 1's plan is written:

1. **§8 — over-cap subtrees and move direction → strict.** The formula
   `D + 1 + h <= CAP` is the whole rule; the "increase" sentence was
   removed. ATT-4.7 can now assert that an already-over-cap subtree is
   refused for *every* target, including a shallower one.
2. **§8/§9 — detached descendants → now explicit in the wiki.** ATT-4.5
   and ATT-5.2 stand as written.
3. **§1 — a parentless "attach" request → rejected (400)**, and clearing
   `parentId` clears the flag. ATT-1.1 can assert the rejection, not only
   the outcome.
4. **§7.1 (positioning) — an anchor outside the resulting scope →
   rejected (400), nothing commits.** TC-7.10 stands as written.

Newly settled alongside these, with no case yet (derive when Story 1's
plan is written): §4's Free-item reparent at the API (flag omitted keeps
current state), §7's "every write" clause (cap on create/edit/move), §9's
cross-workflow acceptance ("Unknown status"), §11's reparent-to-root via
`parentId: null`, §11a's activity log, and positioning §7.3's position
nulling for subtree items left holding a foreign workphase.

ATT-3's scope note ("§4 is about Attached items only") is now partly
stale: Free-item reparent is settled at the API and derivable; only the
*gesture* remains open.

Cross-workflow reparent at the API is therefore **no longer** uncovered —
the "Explicitly not covered" bullet above is superseded.
