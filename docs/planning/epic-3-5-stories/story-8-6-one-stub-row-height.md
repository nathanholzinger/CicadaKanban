# Epic 3.5 Story 8.6 — One height for every Stub row

**Type:** story · **Written:** 2026-11-03 by the Architect, from the Story 6 + 6.1 audit's finding #8 (2026-09-25) · **Status:** planning

## Goal

Every Stub-sized row is one height, whether its item has a type pill or not, so the drag math's Stub heights are exact on every row.

**What happens today** (measured by the audit, 2026-09-25; `cardMetrics.ts`):

| Row | No pill | With a type pill |
|---|---|---|
| A section's Stub row, the ghost's included (`StubRows.tsx::AttachedChildRow`) | 24 px | 29 px |
| The carried copy as a Stub (`KanbanCard.tsx::OVERLAY_STUB_CLASS`), 2 px more for its border | 26 px | 31 px |

- **The pill is taller than the title.** Its 10 px text takes the inherited 1.5 line height (15 px), plus `py-0.5` and a border: 21 px, against the title's 16 px line (`text-xs`).
- **The drag math reads the pill-less heights:**
  - the lean's ghost middle, `dragCollision.ts::dropAnchorFor` (`STUB_ROW_HEIGHT_PX`);
  - the carried copy's re-anchor at the zoom into a Card, `dragOverlayGeometry.ts::reanchorOverlayTransform` (`CARRIED_STUB_HEIGHT_PX`).

  When the dragged item has a pill, both sit 2.5 px off. Only the dragged item's own pill counts: the hovered row's height is measured.
- **Typed rows are the common case.** The board's add form always sets a type (`BoardColumn.tsx` offers no "no type"), and the deep stack types every item. So nearly every row Nathan drags is off. The E2E specs seed items with no type, so they only ever see the exact rows.

**How it runs: code first** (roadmap, Story 8, "How Story 8 runs"):
- The Coder builds the candidate, and Nathan picks hands-on.
- The PO and the Test Planner write the docs after.
- No new drag specs.

**Out of scope:**
- **The Card tier's pills** (`KanbanCard.tsx::CardPillsRow`, the shortCard's and the full Card's), and the Sheet's children list (`ChildrenSection.tsx`). Neither is a Stub row, and the drag math reads neither.
- **The project sidebar's rows** (Story 8.7).
- **The Stub rows' look otherwise:** their padding, their color, the carried copy's shadow. That's "The cues' final look".
- **Reading the dragged row's real height** in place of a constant. It would leave the look as it is, but two things are against it:
  - the measured box lags the carried copy's switch into a Stub (`dragOverlayGeometry.ts`'s comment);
  - a height per item is two facts that must agree, where the story wants one.

## Scope

- **Wiki passages:** none. The wiki doesn't give a Stub row's height (§5a gives the carried copy's width and its held look). The PO decides at close whether one height is a rule.
- **Test-plan cases:** none yet. The Test Planner decides after Nathan's approval. The handoff names a candidate.

## Inbound deferrals

- **The Story 6 + 6.1 audit, finding #8** (`docs/archive/code-quality-audit-epic-3-5-story-6.md`), by way of the roadmap's 8.6 entry. Its fix corrected the constants and gave the rows one box class (`cardMetrics.ts::STUB_ROW_BOX_CLASS`). It left the pill's 5 px to Story 8 as a look change, which this story takes in.
- **From Story 8.5's close.** `check:docs` finds the retired DRAG-2.5 in a fixture comment (`tests/ui/drag-target-classification.spec.ts:45`), so `npm run check` fails until it goes.
  - The spec asserts states, never an overlay's look (its header), so there's no assertion to skip.
  - Drop the ID and keep DRAG-2.2's. Don't put a tier case's ID in its place, since the spec asserts no tier (the Test Planner's 8.5 handoff pass).

## Approach and phases

### Decisions

**D1. Which rows.** Every Stub-sized row, in a Card's section and in the hierarchy modal (`StubRows.tsx`, `KanbanCard.tsx`):
- a section's Stub rows, the dragged item's own row included, which is the ghost;
- the overflow row, which has no pill and is 24 px today;
- the static rows a section draws under the modal's backdrop;
- the carried copy as a Stub. It keeps its 2 px for the border, unless Nathan asks otherwise at the hands-on (Phase 2).

**D2. Two candidate heights.** Nathan picks one at the hands-on.
- **A: the pill fits the title's line.** In a Stub row the type pill is no taller than the title's 16 px line. So every row is 24 px, and the carried copy 26, typed or not.
  - **The pill keeps its text, width and color.** Only its height tightens. One way is no line height of its own (`leading-none`), which makes it 10 + 4 + 2 = 16 px. The way is the Coder's.
  - **It's a Stub-tier variant,** through `StubRows.tsx::StubBody`. The Card's pill stays as it is (Out of scope).
  - **The constants keep their values,** so nothing the drag math reads changes.
  - **On Nathan's boards,** where nearly every row is typed, every section gets 5 px shorter per row.
- **B: every row as tall as a typed one.** The shared box holds today's pill, so an untyped row is 29 px, and the carried copy 31.
  - **Nathan's boards look as they do today.** The untyped rows grow, and in the E2E specs that's every row.
  - **`STUB_ROW_HEIGHT_PX` and `CARRIED_STUB_HEIGHT_PX` become 29 and 31.**
- **Phase 1 builds A only, behind a temporary switch.** B's look is already on the board, since every typed row today is B's height. The switch puts back today's pill, so Nathan can compare the two on the same rows. With today's pill the math is off as it is today, no worse.

**D3. The height is set, not measured.** The chosen height goes on the shared box as a class, beside the constant the math reads, in `cardMetrics.ts`. The file already pairs `CARD_LIST_GAP_PX` with `CARD_LIST_GAP_CLASS`, and the shortCard's height is set from `SHORT_CARD_HEIGHT_PX`.
- **So the math and the look read one fact.** A pill that grows later spills out of its row, where it's seen, instead of moving the math off again unseen.
- **The carried copy sets its own height, its border included.** The box's height counts its border, so a bordered box at the row's height has 2 px less inside than the title needs.
- **`cardMetrics.ts`'s comment** says the heights are set. "Measured rather than derived from the classes" and the 2.5 px caveat go.
- **Built in Phase 3,** for the height Nathan picks.

### Phases

Each phase ends with the gate and a stop for review and commit. The gate is `npm run check`, plus `npm run test:e2e` where the phase says so.

**Phase 1: candidate A** (D1, D2)
- **First, the gate:** the retired DRAG-2.5 in the fixture comment (Inbound deferrals).
- **The Stub-tier pill,** no taller than the title's line, through `StubBody`.
- **A temporary switch in the drag tuning panel** between A's pill and today's, defaulting to A. The panel is temporary: no wiki, no cases, no tests.
- **Measure the rows** in the browser, typed and untyped: a section's row, the overflow row, the modal's row, and the carried copy at the Descendants layer. Record them in Amendments. Under A they should all be 24 px, and the copy 26.
- **Tests:** none new. No unit test can see a row's height (jsdom lays nothing out), and nothing the math reads changes.
- **Gate:** `npm run check`. The E2E specs seed no types, so none of their rows changes, and `npm run test:e2e` waits for Phase 3.

**Phase 2: Nathan's hands-on**
- **What to try:**
  - **A section that mixes typed and untyped rows.** The board's add form always sets a type, but the Sheet's children list can add a child with none. Flip the switch on the same rows.
  - **The hierarchy modal,** on the same rows.
  - **Drag a typed Stub** within its section, and **zoom a typed Free Card into a Card.** With A, the ghost's lean and the carried copy under the pointer are exact. With today's pill they sit 2.5 px off, which may be too small to see.
- **Nathan decides:**
  - A, or B (every row at today's typed height);
  - whether the carried copy should match the row's height too, its border drawn without adding to it. One constant would then serve both.

**Phase 3: settle** (D3)
- **The switch goes,** and the chosen height stays:
  - **If A:** the Stub-tier pill stays.
  - **If B:** the Stub-tier pill goes, and the constants become 29 and 31. The unit tests that read them by name follow. The E2E specs' rows grow by 5 px. A drag spec that fails for that alone is skipped with a one-line reason, for Story 10.
  - **If the copy matches the row:** `CARRIED_STUB_HEIGHT_PX` folds into `STUB_ROW_HEIGHT_PX`, and the re-anchor and its comments (`dragOverlayGeometry.ts`, `useBoardDnd.ts`) read the one.
- **The height set on the boxes** (D3), and `cardMetrics.ts`'s comment.
- **Measure the rows again,** and record them in Amendments.
- **The Coder writes the handoff.**
- **Gate:** `npm run check` and `npm run test:e2e`.
- **No audit runs for this story alone.** Story 8 closes with one over all its stories. Nathan may call one sooner.

## Code map

Filled in by the Coder.

| Symbol | Carries |
|---|---|

## Amendments

## Open questions

None yet.

## Living-docs handoff

Written by the Coder in Phase 3. What's expected:
- **Behavior decisions made while building, for the PO to rule on:** the chosen height, and the pill's look in a Stub row. Whether "every Stub row is one height, typed or not" is a rule; §5a holds the carried copy's other facts.
- **Planned passages now built:** none.
- **Passages superseded:** none known.
- **Implementation passages to place:** `cardMetrics.ts`'s comment (D3), and `TypePill.tsx`'s header if the pill gains a Stub-tier variant.
- **Test-plan cases affected:** none known. A candidate for the Test Planner: every Stub row is one height, with a pill or without. Its test would read the rows' boxes against `cardMetrics.ts`'s constant (`tests/helpers/dragGesture.ts::boxOf`), with no drag.
- **Wiki sections added, changed, moved or removed** (PO, at close):
