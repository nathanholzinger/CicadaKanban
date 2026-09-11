# Test Plan Catalog

Feature-organized catalog of business-requirement-driven test cases —
independent of whatever automated tests happen to already exist.

## Purpose

Each case here is derived from `../wiki/<feature>/` (or, pre-wiki-page, the
hardened parts of a design plan) — not from reading the implementation.
The goal is a set of cases that would catch a requirements violation even
if the code happens to do something consistent-but-wrong. A suite can be
written before the corresponding code exists; that's expected, not an
edge case. Existing coverage-driven unit tests are a separate, complementary
thing (see the `architecture-testing` project convention) — cases here get
compared against that coverage before anything gets automated, and only
survivors become new automated tests.

If a case here starts failing once real automation exists, or turns out to
describe behavior that's no longer accurate, that's a signal the paired
wiki page and the implementation have diverged — reconcile the wiki page
(see its "Keeping it honest during implementation" note), don't just
quietly fix the test case.

## Conventions

- One folder per **feature**, matching `../wiki/<feature>/` exactly (see
  that README for why).
- One file per **suite** within a feature folder (a suite = a cohesive
  sub-area, e.g. one "Part" of a design doc) — not one file per case, to
  keep this human-browsable rather than turning into dozens of tiny files.
- Each suite file opens with a scannable table (ID / case / priority /
  automated) followed by full detail per case below. The table's
  **Automated** column is the visible coverage flag. Each case's detail
  block is: a `**Priority:** … · **Automated:** …` header line, then the
  Given/When/Then, then a lower-visibility `**Automation test:**` line
  *below* the Given/When/Then — the specific test that covers it, filled in
  once that test exists. Keeping it below the behavioral description rather
  than beside it is deliberate: the rule should read standalone before the
  implementation pointer shows up.
- **Case IDs are unique per suite, not globally.** Each suite file declares
  a unique suite ID (e.g. `ATT-4`, `DRAG-3`); cases inside it are `TC-1`,
  `TC-2`, … From outside that suite — another suite, another feature, a
  reconciliation report — refer to a case as `<suite-id>.<n>` (`ATT-4.5`).
  `item-positioning/` predates this convention and keeps its `TC-<part>.<n>`
  form, where the part number is the suite ID.
- Automated-column states: **⏳ pending triage** (default — not yet
  compared against existing coverage), **✅ automated** (a specific test
  covers it — see the Automation test column), **❌ not automated** (triaged
  and confirmed there's a gap), **⏸ superseded** (a later epic replaced the
  rule; the case stays in place under its ID with a "was:" note and a
  pointer to the replacing cases, and drops out of the priority counts).
  A case whose rule text was corrected after being automated goes back to
  **⏳ pending re-triage** so the mapping is re-verified.
- Priority: **P0** = must-pass correctness/data-integrity, **P1** =
  important behavior, **P2** = edge case / nice-to-verify.
- No run-history tracking here by design — this catalog says *whether* a
  case is automated, not *how many times it's passed*.
- An `INDEX.md` per feature folder rolls up all suites' coverage counts.
