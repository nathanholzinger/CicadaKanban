# Product Wiki

Feature-organized source of truth for Cicada's settled product rules.

## Purpose

This tree answers "what are the current rules for feature X" — collated
from Kanban work-item descriptions/rules and from design plans once they've
**hardened** (open questions resolved, ready to build against or already
built). It exists so a test-planner can derive test cases from a single
page or section — simultaneously with, or even ahead of, a coder writing
the implementation.

It is **not** a design-discussion log and **not** an implementation plan:

- `docs/planning/epic-N-decisions.md` captures *deliberation* — open
  questions, alternatives considered, why one option won over another.
  Once a question resolves, the answer graduates here; the discussion of
  how it got resolved stays there.
- `docs/planning/*.md` (implementation plans) capture *how to build it* —
  files touched, sequencing, migration steps. Once built, that plan is a
  historical record, not something to keep re-reading for "what's true."
- This wiki captures the *rules themselves* — testable, agent-readable,
  feature-organized — regardless of whether the code exists yet.

## Conventions

- One folder per **feature**, not per epic — epics are a planning/
  sequencing concept and don't always map 1:1 to a durable product feature;
  a feature folder here should stay meaningful even as multiple epics touch
  it over time (e.g. Epic 3.2 and Epic 3.5 both land inside
  `item-positioning/`).
- Folder names mirror `../test-plans/<feature>/` exactly, so the wiki and
  test-suite hierarchies stay aligned even though they may diverge from how
  the codebase itself is organized. See `../test-plans/README.md`.
- A page can be written as soon as its rules have hardened — pre-code is
  fine and expected. Mark its build status plainly at the top (e.g. "not
  yet implemented" / "implemented as of Epic N") so a reader knows whether
  a rule is aspirational-but-settled or already live.
- **Keeping it honest during implementation:** if coding a hardened rule
  surfaces a new decision or a deviation, the wiki page must be updated to
  match — it should never silently drift from reality. The practical
  tripwire for drift: test cases derived from this page (see
  `../test-plans/`) starting to fail against real code, or turning out to
  test something that's become obsolete, is exactly the signal that this
  page and the implementation disagree and need reconciling. Don't assume
  either side is automatically right when that happens — check which one
  the drift actually came from.
- Pages should be periodically re-collated from the source Kanban
  work-items as behavior changes, not left to drift out of sync on their
  own.
- This convention (in-repo markdown, feature-aligned with the test-plan
  tree) is a deliberate near-term choice, not a permanent one — see the
  discussion captured for Epic 3.2 on when/how this might migrate to a
  dedicated tool (possibly Cicada itself, post-MVP).
