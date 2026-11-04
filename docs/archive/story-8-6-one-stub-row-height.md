# Epic 3.5 Story 8.6 — One height for every Stub row

**Type:** story · **Written:** 2026-11-03 by the Architect, from the Story 6 + 6.1 audit's finding #8 (2026-09-25) · **Status:** built, for review and commit; the handoff is written

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

- **Wiki passages:** board-drag-interaction §5a now states one fixed height for every Stub-sized row, typed or untyped, including the carried copy's border inside that height. §2's subtree wording is corrected to match §7.2; no section is moved or renumbered.
- **Test-plan cases:**
  - **DRAG-3.25, new, Open:** fixed-height equality across typed/untyped section, ghost, overflow, modal, static-backdrop and carried rows; the pill fits the title's line and content does not grow the row.
  - **DRAG-3.22, Open:** retains the representation-switch/pointer rule, with a cross-reference to DRAG-3.25 for the shared height. The height measurements in this handoff do not establish the complete zoom-in gesture.
  - **DRAG-7.17:** its second spec is now skipped by Nathan; the Reconciler assesses the remaining full-case coverage at Story 8 close-out. The Planner leaves its existing status and mapping unchanged.

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
| `cardMetrics.ts::STUB_ROW_HEIGHT_PX`, `STUB_ROW_HEIGHT_CLASS` | The one height of a Stub-sized row, as the number the drag math reads (24) and the class that draws it (`h-6`), paired as `CARD_LIST_GAP_PX` and `CARD_LIST_GAP_CLASS` are. `CARRIED_STUB_HEIGHT_PX` is gone: the carried copy is this height too. |
| `cardMetrics.ts::STUB_ROW_BOX_CLASS` | The box every Stub-sized row shares, now with `STUB_ROW_HEIGHT_CLASS` and no vertical padding, so the height is set and not the sum of a title line and its padding. Its users are unchanged: `StubRows.tsx::AttachedChildRow`, `OverflowRow`, `StaticStubRow`, and `KanbanCard.tsx::OVERLAY_STUB_CLASS`. |
| `KanbanCard.tsx::OVERLAY_STUB_CLASS` | The carried copy: the shared box plus its border, fill and shadow. Its border is inside the 24 px, so the copy is as tall as a row. |
| `dragOverlayGeometry.ts::reanchorOverlayTransform` | Centers the copy on the pointer at the zoom into a Card, by `STUB_ROW_HEIGHT_PX`. Its comment and `useBoardDnd.ts`'s read the one constant. |
| `dragCollision.ts::dropAnchorFor` | Reads `STUB_ROW_HEIGHT_PX` for the ghost's middle over a Stub row or an overflow row, as before. |
| `TypePill.tsx::TypePill`'s `fitsLine` | A Stub row's pill: it drops the line height it inherits (`leading-none`), so it is 16 px (10 px text, `py-0.5`, a 1 px border), the height of the title's line. The Card tier never passes it. |
| `StubRows.tsx::StubBody` | Passes `fitsLine` to the pill. Every Stub-sized row that has a pill draws it here: a section's row, the ghost, the static row under the modal's backdrop, and the carried copy. The overflow row has no pill. |

## Amendments

**1. Phase 1's gate item.** The retired DRAG-2.5 is out of the fixture comment in `tests/ui/drag-target-classification.spec.ts`, which keeps DRAG-2.2's ID. `check:docs` is clean again.

**2. A test for the pill's class, where the story planned none.** `TypePill.test.tsx` reads the pill's classes: `leading-none` is there with `fitsLine` and absent without, and nothing else in the class list changes.
- **Why:** the first form of the class (`${pillClass}${fitsLine ? ' leading-none' : ''}`) passed type-check, lint and the measurement, then lost its leading space to the Tailwind Prettier plugin, which trims a class string inside a `className` expression. The class glued onto `border` (`borderleading-none`), which drops the pill's border and the line height both. Nothing else in the suite sees it.
- **The test fails against that glued form** and passes on the form built (`` `${pillClass} leading-none` ``).

**3. Phase 1's rows, measured in the browser** (Playwright's Chromium, a section of six rows, typed and untyped, read with `tests/helpers/dragGesture.ts::boxOf`; a throwaway spec, deleted). Heights in px, with the switch on (A) and off (today's pill):

| Row | A | Today's pill |
|---|---|---|
| A section's Stub row, typed / untyped | 24 / 24 | 29 / 24 |
| The overflow row | 24 | 24 |
| The hierarchy modal's row, typed / untyped | 24 / 24 | 29 / 24 |
| The static row under the modal's backdrop, typed / untyped | 24 / 24 | 29 / 24 |
| The ghost, typed / untyped | 24 / 24 | 29 / 24 |
| The carried copy, typed / untyped | 26 / 26 | 31 / 26 |

The off column is the audit's numbers (24 and 29, 26 and 31), so the switch compared today's board with A on the same rows.

**4. Phase 2: Nathan's picks.** A, so every row is 24 px, and the carried copy matches the row's height.

**5. Phase 3: what was built.**
- **The switch is gone:** the tuning field, the panel's checkbox, and the `DragTuningContext` that Phase 1 put around `DragOverlay` so the carried copy could read it. `StubBody` reads no tuning, and `BoardView.tsx` is as it was.
- **The height is set on the box** (D3). `STUB_ROW_BOX_CLASS` holds `STUB_ROW_HEIGHT_CLASS` (`h-6`) and has no `py-1`, so a row's height is the class's and a pill that grows later spills out of its row, where it shows, instead of growing the row and moving the math off unseen.
- **The carried copy's border is inside its 24 px.** Tailwind boxes are border-box, so the copy is the shared box with a border drawn in it, and the 2 px it added is gone with `py-1`. `CARRIED_STUB_HEIGHT_PX` folded into `STUB_ROW_HEIGHT_PX`, and `dragOverlayGeometry.test.ts`'s DRAG-3.22 reads the one.
- **`cardMetrics.ts`'s comment** says the height is set. "Measured rather than derived from the classes" and the 2.5 px caveat are out.
- **A test for the class and the number** (`cardMetrics.test.ts`): `h-6` is 24 px at a quarter of a rem a step, the shared box holds it and has no vertical padding, and the card lists' gap class and number agree the same way. It catches one of the pair edited alone.

**6. Phase 3: the rows measured again** (the same throwaway spec, deleted). Every row is 24 px: a section's rows typed and untyped, the overflow row, the modal's rows, the static rows under its backdrop, and the ghost. The carried copy is 24 px typed and untyped (it was 26 and 31).
- **A screenshot of each shape** shows the pill whole inside its row and the copy's border drawn, with nothing clipped.
- **The carried copy was read from a Stub picked up in its own section,** which starts at the Descendants layer. That is the render branch (`overlayIsStub`) a Free Card takes when it zooms into a Card, but the zoom itself was not driven here: its specs are skipped, since Playwright's frozen pointer undoes the hold.

**7. Phase 3: the gate.**
- **`npm run check`:** passes. `check:docs` is clean, the client has 635 tests (6 new, in `TypePill.test.tsx` and `cardMetrics.test.ts`), the server 432 and the scripts 235.
- **`npm run test:e2e`:** 217 passed, 19 skipped and 1 failed, run with nothing else running. The one failure is DRAG-7.17's second case ("from the gap above R's overflow row, a list that scrolls puts the ghost's spot under the cursor too"), the roadmap's watch item, which also failed in 8.5's full run.
- **It isn't this story's.** The case, run alone 48 times in a row, failed 8 times on this story's code and 8 times on the committed code (this story's work stashed for the run).
  - **It fails two ways, on both.** The ghost's painted box misses the cursor (the poll in `expectGhostUnder`), or the projection settles above where the case expects it: `23:3:true` or `22:3:true` for `24:3:true`, after the modal's list scrolls. On the committed code that was 5 misses and 3 projections.
  - **The rate varies by batch:** on this story's code, 1 in 6, 0 in 24, 8 in 48 and 1 in 12; on the committed code, 8 in 48. So it reproduces alone, at around one run in six at its worst, where the roadmap's earlier notes had it not reproducing alone.
  - **Not traced.** The roadmap says to trace it if it recurs. That's a task of its own, and this story's changes aren't in its way.
  - **Skipped, for Story 10.** Nathan skipped the case (`test.skip`, with the reason in a comment above it) after seeing it flake. The rate over those runs, this story's code and the committed code together, is 18 in 138, about one in eight. DRAG-7.17's first case ("when R's children run longer than the modal") still runs, and didn't fail in any run here.

**8. 2026-11-03, the wiki (PO).**
- **§5a: one height is a rule.** A new paragraph after the Descendants layer's: every Stub-sized row is one fixed height, with a type pill or without. That covers a section's rows, the ghost, the overflow row, the modal's rows, the rows under its backdrop, and the carried copy with its border inside. A row's pill fits the title's line, and nothing a row holds changes its height. The Why names rule 3's ghost middle and the copy staying under the pointer, by analogy with shortCard's one height at the column layers.
- **Deductions, for Nathan to overrule:**
  - **A rule, not a look.** Nathan's pick between A and B is look, but either way the rows are one height, and §2 rule 3 and §5a's "stays under the pointer" lean on it. It's testable without a drag.
  - **No pixel value.** The wiki names the height as one fact, not a number. The number is `cardMetrics.ts`'s. Why: it's not tunable, and B would have kept the rule with another number.
  - **The pill fitting the title's line is in the rule,** since it's what Nathan picked (A). Its color and text stay with "The cues' final look", as does the copy's text sitting 1 px right.
- **§2's "Why not the half" paragraph** said a dragged Stub's subtree rows "travel with it", which 8.5's pass missed. It now says they stay drawn and are passed over (§7.2).
- **For the Test Planner:** the handoff's candidate fits §5a as written: typed and untyped rows, the overflow row and the modal's rows at one height, and the carried copy at the same height after a drag starts at the Descendants layer.
- **Checks:** `check:docs` passes (394 files, 0 hits).

**9. Test Planner's handoff pass.**
- Applied the PO's §5a addition as DRAG-3.25, P1/Open, with no fixed pixel value. Its assertions include typed fixtures, the overflow row without a pill, the rows under the modal's backdrop, and both ghost and carried copy from a Stub pickup. DRAG-3.22 remains the separate representation-switch/pointer case and now points to the common-height case.
- The §2 correction adds no new placement rule: the existing subtree-exclusion cases and DRAG-2.17 already state that descendant rows stay drawn and are passed over. No additional case is needed for that wording correction.
- The handoff's class-list and class/number consistency tests are implementation checks, not proof of the full rendered-height case. The throwaway measurements and screenshots are useful build evidence, not a running automation mapping. No test code was read or changed in this Planner pass, and no new mapping is proposed merely because those unit tests exist.
- **Coder/Reconciler:** assess DRAG-3.25's eventual full-case coverage and DRAG-3.22's existing geometry candidate separately, including any required internal-mapping approval. Typed row rendering and the carried copy need actual height assertions; a class list alone cannot establish them. Remaining gesture-driven work is Story 10's under the existing no-new-drag-spec rule.
- **DRAG-7.17:** Amendment 7 supersedes the old "doesn't reproduce alone" watch notes. Its second spec failed on both this story's code and the committed baseline, and Nathan skipped it with a reason. The first spec still runs. Reconciliation must assess the missing above-overflow/scrolling clause, and Story 10 must trace the failure before restoring the skipped spec. No cause or fix is established here.
- **8.5's retired-ID follow-up:** the Coder removed DRAG-2.5 from a fixture comment while retaining DRAG-2.2. This corrects the earlier Planner description of the checker location as a title claim; the handoff says no overlay assertion was present to skip. The roadmap records that cleanup as resolved.
- The new case and revised coverage/watch tasks are carried into Story 8's close-out and Story 10 in the roadmap so they survive this plan's archival.

## Open questions

None.

## Living-docs handoff

Written by the Coder in Phase 3.

- **Behavior decisions made while building, for the PO to rule on:**
  - **Every Stub-sized row is one height, typed or not: 24 px.** A section's row, the ghost, the overflow row, the hierarchy modal's row, and the row a section keeps under the modal's backdrop. Whether that is a rule is the PO's to say.
  - **The carried copy as a Stub is that height too,** its border inside it. §5a gives the copy's width and its "held" look and no height. If the one height is a rule, §5a is a home for the copy's half of it.
  - **A Stub row's type pill is 16 px tall,** with the same text, width and color as the Card's. Only its height tightens, to the title's line. The Card tier's pill is unchanged. On a board of typed rows, each row got 5 px shorter.
  - **A row doesn't grow with its content.** Its height is set, so content taller than the row spills out of it. Nothing spills today (the pill and the title are both 16 px), and it's what keeps the drag math's height the one drawn.
  - **Unchanged, and in "The cues' final look":** the copy's text sits 1 px further right than a row's, since its border takes that from inside the box, as it did before.
- **Planned passages now built:** none.
- **Passages superseded:** none known.
- **Implementation passages placed,** all in comments the Coder owns: `cardMetrics.ts`'s comment on the Stub row's height (set, with the class and the number paired), `TypePill.tsx`'s header (`fitsLine`), `StubRows.tsx::StubBody`'s comment, and the comments in `dragOverlayGeometry.ts` and `useBoardDnd.ts`, which now name `STUB_ROW_HEIGHT_PX`. Nothing for the PO to place.
- **Test-plan cases affected:**
  - **`dragOverlayGeometry.test.ts`'s DRAG-3.22** reads `STUB_ROW_HEIGHT_PX` where it read `CARRIED_STUB_HEIGHT_PX`. Its claim, the pointer on the copy's vertical middle, is the same.
  - **Two new unit tests with no case ID:** `TypePill.test.tsx` and `cardMetrics.test.ts`. Both pin an implementation fact (a class list; a class and the number it spells), not a rule from a plan. The Test Reconciler may leave them unmapped.
  - **A candidate for the Test Planner: every Stub row is one height, with a pill or without.** Its test reads the rows' boxes against `cardMetrics.ts::STUB_ROW_HEIGHT_PX` (`tests/helpers/dragGesture.ts::boxOf`), with no drag, and one more with a drag for the carried copy at the Descendants layer. The specs seed no types, so the case needs typed rows (`seedItem` takes `type`; the ids are `GET /api/item-types`'s).
  - **Planner applied:** the candidate is DRAG-3.25, Open, from wiki board-drag-interaction §5a. DRAG-3.22 references its shared-height rule while keeping the zoom/pointer assertions distinct. Story 8 close-out reconciliation assesses coverage; Story 10 carries remaining surface work by ID.
- **Wiki sections added, changed, moved or removed** (PO, at close): board-drag-interaction §5a (a paragraph added) and §2 (a leftover from 8.5). Amendment 8.
- **For the Architect:**
  - **The roadmap's 8.6 entry** still describes the 24 and 29, 26 and 31 that this story removed, and names `CARRIED_STUB_HEIGHT_PX`, which is gone. That is right as the problem's statement and wrong as live. The 8.8 entry's pointer to the constant now names `STUB_ROW_HEIGHT_PX`.
  - **Story 10's drag specs: one skipped.** DRAG-7.17's second case ("from the gap above R's overflow row…", `tests/ui/drag-7-modal-hold.spec.ts`), skipped by Nathan for its flake, with the reason in a comment above it. It joins the specs Story 10's item 10 reworks, and the roadmap's item 8 (the call on DRAG-7.17) is where it is traced. Nothing was skipped for the row heights: the specs seed no types, so none of their rows changed.
  - **DRAG-7.17 reproduces alone now** (Amendment 7): its second case failed 8 of 48 runs on the committed code, and the same on this story's. The roadmap says to trace it if it recurs, and it has now failed in a full run in Story 7, 8.1, 8.5 and here. Two shapes of failure are in Amendment 7 for whoever traces it. The first case didn't fail in any run, and still runs.
