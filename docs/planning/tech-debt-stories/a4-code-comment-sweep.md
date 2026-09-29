# A4 — Code Comment Sweep

**Type:** tech-debt story · **Written:** 2026-09-26 by the Coder · **Status:** in progress

**Source:**
- the round table at `docs/planning/round-tables/documentation-purposes-and-standards` (tags like "Coder F4" or "Architect F6");
- A1's plan, `a1-documentation-standards.md` (tags like "A1 D7");
- A2's plan, archived at `docs/archive/a2-wiki-standards-and-sweep.md`. Its Handoff holds the anchor-changes table (D10) and the removed-mechanism lists (D5);
- the Story 6 audit.

This plan is transient, so it may cite all three. The comments it produces are living, so they cite none of them.

## Goal

After A1, the rules exist and a checker enforces them. But about 800 existing comment lines in code and tests still break those rules. A4 has two jobs:
- bring every code comment and module header into line with `code-comments.md`, in batches with a stop after each;
- make the checker part of `npm run lint`, so the count stays at zero.

The sweep also adds three things:
- **Index pointers:** one `wiki <page> §N` at the site that mainly enforces each wiki rule. With the wiki naming no code, this is how you find a rule's code by grepping (A1 D7).
- **Site rulings:** the Story 6 audit's "deliberately separate" and "looks wrong but isn't" rulings, written at the code they apply to (Auditor F7).
- **Placements:** the implementation passages the wiki sweep (A2) removes, each written into its home per A1 D5, or marked as already covered.

**Out of scope, each owned elsewhere:**
- **A1:** the checker itself, the comment guide, the `CLAUDE.md` files and `.claude/`.
- **A2 (PO):** the wiki.
- **A3 (Test Planner, with the Coder writing the IDs into titles):** the test-plan files, case IDs in test titles, and qualifying bare `TC-n` IDs in titles.
- **Any change to code** (D3).

## Decisions

### D1. What the sweep covers

| In | Out |
|---|---|
| Comments and module headers in `client/src`, `server/src`, `server/tests` and `tests` (`.ts` and `.tsx`) | CSS, config files, `server/drizzle/` migrations, `bruno/` |
| Provenance left in test titles after A3 has written its IDs into them | Writing case IDs into test titles (A3) |
| Bare `TC-n` IDs in test *comments*, qualified against A3's catalog | Every `CLAUDE.md` and `.claude/` (A1) |
| Placing A2's handed-off passages into module headers, site comments or `workflow/CLAUDE.md` | New directory `CLAUDE.md` files (D3) |

### D2. How each kind of comment is rewritten

The rules themselves are in `code-comments.md`; this is the method for applying them to existing comments. I read every comment in a swept file against the guide, not only the checker's hits. Two rules can't be checked mechanically: no history narration, and no prose about other files.

| What's there now | What it becomes |
|---|---|
| A provenance tag or date on a sentence that's otherwise true ("Story 4: a Card is also a region") | The sentence without the tag |
| A tag standing in for a reason ("…for the column it happens to resemble (audit epic-3-5-story-4 #8)") | The reason, in the present tense. I read the cited doc to recover it, and confirm against today's code that it still holds, before writing it. If it no longer holds, the comment goes. |
| History ("used to", "no longer", "originally") | The current constraint, or nothing |
| A forward reference ("provisional until Story 8") | The present-tense fact ("provisional look") |
| A bare `§N` that means a wiki section | `wiki <page> §N` if the pointer has a guard or index job (A1 D7); otherwise the pointer goes |
| A `§N` that means a section of a plan | What that section said, restated in present tense, or nothing |
| A `§N` in a test | The qualified ID of the case the test covers, if there is one; otherwise treated like any other `§N` |
| A qualified case ID (`DRAG-5.5`) in a test title or test comment | Unchanged. This is the one sanctioned pointer from code to a test plan. |
| A case ID in a comment outside the tests | `wiki <page> §N` if the pointer has a guard or index job; otherwise it goes. Rule (a)'s exception covers test titles and test comments only. |
| Prose about another file's internals | This code's own assumption, or a `file::symbol` reference |
| A comment that fails the umbrella test | Removed |

A comment that breaks no rule stays as it is, even if I'd word it differently. A comment that turns out to be false is corrected to match the code. If it's the code that looks wrong, it goes in the handoff (D3).

### D3. What the sweep never does

- **Change code.** No renames, no simplifications that look obvious, no fixes, even of a bug. Every batch proves it changed nothing but comments (D8). Anything that looks wrong while I'm reading goes in the handoff, for the next story or audit.
- **Touch directive comments.** `eslint-disable…`, `@ts-expect-error`, `prettier-ignore` and `check-docs-ignore…` are never moved or reworded. Their placement is load-bearing. Only the reason text after the directive's `--` may be edited.
- **Rewrite a comment that follows the rules**, just for style.
- **Create a directory `CLAUDE.md`.** A passage that spans modules outside `workflow/` belongs in root `CLAUDE.md`. That file is the Architect's, so the passage goes through the handoff.
- **Write case IDs into test titles.** That's A3's job.

### D4. Index pointers: which site counts as a rule's main enforcement site

A1 D7 gives wiki pointers two jobs. The index job needs exactly one pointer per rule, at the site that mainly enforces it. For each section of a swept wiki page that states a rule the code enforces:
- **A rule the API refuses** (the depth cap, attaching with no parent): the server check that refuses it.
- **A rule only the UI enforces** (drop bands, pop timing, where the ghost lands): the client module that decides it.
- **A rule both sides enforce:** the server site carries the index pointer. The client site may carry a guard pointer where it would otherwise look like duplication, as `dragClassification.ts::isWithinDepthCap` already does.

**When each page is done:** board-drag-interaction at the end of batch 1c; the other three pages at the end of batch 3. Each of those batch reports includes a table mapping every section either to its site or to "no enforcing code".

Two kinds of mismatch go to the PO as possible wiki gaps:
- a section that states a rule, with no enforcing code and no `**Planned:**` marker;
- a rule I find enforced in code that no section states.

The PO accepted the index job on one condition: the checker only confirms that a section exists, not that it still holds the rule. So whenever A2's handoff names a rule that moved to a different section, I move the pointers to match. D10 lists the ones A2 moved.

**Pointers cite the wiki as it stands** (Nathan, 2026-09-29). A5 will move the project sidebar's rules out of board-drag-interaction §7 and §7.1, but the sidebar's sites still get their pointers to today's sections. Any story that moves or renumbers a wiki rule re-points the comments that cite it, found by searching for `wiki <page> §N`. That's in the Handoff to A5.

### D5. Placing what the wiki sweep removes

A2 ends each page's sweep with a list of the implementation passages it took out (PO F8). Each passage gets one disposition:
- **placed:** written into its home per A1 D5, which is the module header, a site comment, or `workflow/CLAUDE.md` (its mental model, or a rule that spans modules);
- **covered:** already stated somewhere, which I name;
- **root:** belongs in root `CLAUDE.md`, so it's handed to the Architect;
- **dropped:** no longer true of the code.

The disposition table lives in this plan's Handoff section while the story is open. A2 has closed, so the passages are read from its archived plan. The quoted code names there are leads, not facts: some were already stale in the old page text.

### D6. The Story 6 audit's rulings, written at their sites

Two findings in the Story 6 audit hold rulings that exist nowhere else:
- **#24** re-rules four hypotheses carried over from earlier audits;
- **#30** confirms twelve pairs that look like duplication but are separate on purpose.

A cold duplication pass would work all of these out again. So each one gets a single present-tense line at its site, naming the other half as `file::symbol`. The line states the reason, never where the ruling came from. Where the audit's reason is only a pointer ("decision 3", "F6"), I recover it from the cited plan and confirm it against today's code before writing it.

A1's handoff asks for these rulings to be written before the audit is archived. The table below copies everything the work needs, which removes that ordering constraint: Nathan can archive the Story 6 audit whenever it closes.

| Ruling | Site | Where the reason comes from |
|---|---|---|
| #24: drag writes take the containing Card's `workphaseId`. The client doesn't mirror the server's cascade to attached descendants, so their stored copies stay stale until the next load | `itemWriteReconciliation.ts::applyItemWriteResponse` | the audit |
| #24: the one remaining mixed-space comparison in `dragCollision.ts` diverges only while a Card carries a sortable transform, which at the default clocks can't overlap a Descendants lock | that comparison, in `dragCollision.ts` | the audit |
| #24: a Descendants release with no `over` | no comment: the release reads only the projection, so nothing there looks wrong | — |
| #24: a release over the bare container is a no-op for a Card. dnd-kit doesn't shuffle when `over` is the container, so the ghost never left its slot | `placement.ts::resolvePlacementOver`, plus a guard pointer to the wiki rule "the drop lands where the ghost is" | the audit |
| #30: `dragCollision.ts::travelingRowsFor` vs `projectTreeUtils.ts::resolveGap` | `travelingRowsFor` | to be recovered. The audit says only "semantic", and its "Story 7" is a forward reference that gets dropped. |
| #30: the board's projection seed vs the sidebar's | `descendantsProjection.ts::seedFor` | Story 6 plan, decision 3 |
| #30: the board's per-row blue line vs the sidebar's gap indicator. Only the class string is shared | `dragChrome.tsx::useLiveDropSide` | the audit |
| #30: `projectTreeUtils.ts::siblingIdsFromAnchor` vs the board release's anchor → slot step | the board side, located while writing | the audit ("different APIs") |
| #30: the board's `(d+1)·12` indent vs the sidebar's `12 + d·14`. The two 12s are a coincidence | `cardMetrics.ts`'s depth indent | the audit |
| #30: `dragClassification.ts::isWithinDepthCap` vs `itemTree.ts::assertWithinDepthCap` | already written at the client site; only its pointer format gets checked | — |
| #30: the `SortableContext` in `CardList.tsx` vs the Descendants one in `KanbanCard.tsx` | the one in `KanbanCard.tsx` | the audit ("different contents") |
| #30: `StubRows.tsx::AttachGhostRow` vs `AttachedChildRow`. Only the box class is shared | `AttachGhostRow` | Story 6 plan, decision 4 |
| #30: `placement.ts::placementFor`'s Card branch deliberately skips `priorPlacement`, unlike its Descendants branch | the Card branch | to be recovered (Story 6 plan) |
| #30: `dragOverlayGeometry.ts::clampToCurrentContext`'s `!== 'column'` vs `popSession.ts::containmentRect`'s `=== 'column'` | both sides, since each reads as the other's inverse | Story 4.1 plan, F6 |
| #30: `popSession.ts::popInDelayFor` is a genuine per-kind table | `popInDelayFor` | the audit |
| #30: `useBoardDnd.ts::regionItems` vs `BoardColumn.tsx`'s render lists. The selectors are already shared | `regionItems` | the audit |

Every site is in the board-drag files. Each ruling lands in the batch (1a, 1b or 1c) that owns its site's file.

### D7. Batches, and what each waits for

The line counts are estimates: a grep on 2026-09-26 for story, epic, phase, audit, ledger and decision IDs, dates, and `§` in comment lines. The checker's first run when A4 starts gives the real baseline. By then, A1 batch 3 will already have cleaned some module headers in `workflow/`.

1a's figures are that baseline (2026-09-29): the comment lines I read, and the checker's hits. At 248 hits, 1a split into two stops (Nathan).

Paths in 1a–1c are under `client/src/components/`, with the drag modules in its `workflow/` directory.

| Batch | Files | Est. lines | Waits for |
|---|---|---|---|
| **1a-i** Board drag: the pop machine | `popSession.ts`, `dragTuning.ts`, `useSnapTween.ts`, `dragOverlayGeometry.ts` | ~400 read, 124 hits | A1; A2's board-drag-interaction page |
| **1a-ii** Board drag: regions and bands | `dragRegions.ts`, `dragBands.ts`, `cardMetrics.ts` | ~410 read, 124 hits | 1a-i |
| **1b** Board drag: placement and requests | `placement.ts`, `dragCollision.ts`, `dragRequest.ts`, `dragClassification.ts`, `descendantsProjection.ts`, `itemListOps.ts`, `itemWriteReconciliation.ts`, `DragSessionContext.ts`, `client/src/lib/hierarchyPlacement.ts` | ~135 | 1a-ii |
| **1c** Board drag: the hook and components | `useBoardDnd.ts`, `useItemManagement.ts`, `usePendingGhostGuard.ts`, `KanbanCard.tsx`, `StubRows.tsx`, `dragChrome.tsx`, `BandGuides.tsx`, `BoardColumn.tsx`, `CardList.tsx`, `BoardView.tsx`, `DragTuningPanel.tsx` | ~140 | 1b |
| **2** The rest of the client | everything else in `client/src` that isn't a test: the sidebar, item detail, modals, `api/`, `lib/`, `types.ts` | ~55 | A1 |
| **3** Server | `server/src` | ~100 | A2's other three pages |
| **4a** Unit tests | co-located `*.test.ts(x)`, `client/src/test/`, `server/tests` | ~115 comment lines, ~34 titles | A3 (closed) |
| **4b** E2E | `tests/`: specs and helpers | ~105 comment lines, ~5 titles | A3 (closed) |
| **5** Lint | root `package.json` | — | A2, A3, and batches 1a–4b |

**Why this order:**
- **Batches 1 and 3 follow the wiki sweep's page order (PO F8),** because they place what each page removed.
- **Batch 2 has no wiki page behind it,** so it can run any time after A1.
- **Test files wait for A3,** whose ID-writing step edits the same titles.

**Running alongside other stories (Nathan, 2026-09-26):** nothing starts until A1 is complete. After that, some stories may run in parallel, and that gets decided when the work is scheduled. For A4 this means:
- **Batches 1–3 can overlap A3.** They touch no test file, and they depend on A2's pages, not on A3.
- **Batches 4a and 4b wait for A3** either way. A3 closed on 2026-09-29, so they no longer wait.

### D8. What each batch must pass

- **The checker.** `npm run check:docs -- <the batch's paths>` reports zero hits. Any remaining exception carries an ignore marker with a reason.
- **Moved sections.** Every D10 site in the batch's files cites the new number. The checker can't see this, so the batch summary lists them.
- **No code changed.** For every touched file, I transpile the old and new versions with comments removed and compare them. They must match, except for test-title strings in batches 4a and 4b. This is a scratch check: I report it in the batch summary but don't commit it.
- **The usual gates:**
  - `npm run typecheck`, `npm run lint` and `npm run test:unit`;
  - Prettier `--check` on the touched client and server files (`tests/` has no Prettier config);
  - batch 4b also runs the E2E suite once, since it edits spec files.
- **History words.** The checker can't flag history narration, so I review words like "used to", "previously", "no longer" and "originally" by hand. Each remaining hit in the batch's files is justified in the summary. Today there are about 70 such lines across 38 files.

Then the batch stops for Nathan's review and commit, and I draft the commit message. This is the same rhythm as the audit fix batches. Reading each batch is also a chance to see what the drag layer now says about itself.

### D9. The checker joins lint last

The default scope is clean once three things hold:
- A2 reports zero hits in `docs/wiki`;
- A3 reports zero hits in `docs/test-plans`;
- batches 1a–4b report zero hits in code.

Batch 5 then changes the root `lint` script to run `check:docs` before the client's eslint: `"lint": "npm run check:docs && npm --prefix client run lint"`. From then on, the checks every story already runs catch any new hit.

The first two hold: A2 and A3 have closed, and `check:docs -- docs/wiki docs/test-plans` reports 0 hits on 32 files (2026-09-29). If a story that edits the wiki or the test plans leaves hits there by the time 4b is done, batch 5 waits and A4 stays open until they're cleared. It's a one-line change.

### D10. Pointers to wiki sections that A2 moved

A2 moved three rules into new subsections. A comment that cites the old number still passes the checker, because §2, §5 and §6 all still exist. So this list is the checklist: each site is re-pointed in the batch that owns its file, as part of its D2 rewrite. The line numbers are from 2026-09-27; if they've drifted, search for the pointer.

- **board-drag-interaction §6 → §6.1**, which Card is zoomed into (the dwell, the cue, the reset rule, invalid targets):
  - **1a-i:** `popSession.ts` lines 118, 329 and 344. The header's range "§5–§6" (line 22) becomes "§5–§6.1", since the module runs the zoom-in clock.
  - **1b:** `dragCollision.ts` line 85's range, the same way.
  - **1c:** `dragChrome.tsx` line 126.
  - **4a:** the `popSession.test.ts` title at line 198.
  - **4b:** `drag-card-zoom-in.spec.ts` line 49. `drag-5-stub-detach.spec.ts` line 26 also lists §6, probably for the auto-drop. Check which rule it means before changing it.

  §6 keeps the auto-drop and the pinned ghost, so a pointer to those stays, e.g. `placement.ts` line 88's "set back down".
- **item-positioning §2 → §2.1**, the scope-change table:
  - **3:** `itemHierarchy.ts` lines 237 and 263.
  - **4a:** `items.hierarchy.test.ts` line 11.

  §2 keeps anchor + side resolution, the client-side role and the workphase-only rule, so pointers to those stay.
- **item-positioning §5 → §5.1**, reindexing must be disclosed to the caller:
  - **2:** `api/items.ts` line 9.
  - **3:** `positionResolver.ts` lines 25 and 50, `itemHierarchy.ts` line 220, `routes/items.ts` line 73.
  - **4a:** `items.hierarchy.test.ts` lines 12 and 584 (a `describe` title), `positionResolver.test.ts` lines 99 and 103 (a `describe` title), `dragRequest.test.ts` line 296, `itemWriteReconciliation.test.ts` line 16.

  §5 keeps the reindex itself and its two triggers.
- **"§2 addendum" → "§2's workphase-only rule"**, still §2. The word "addendum" goes when these are rewritten: `itemListOps.ts` line 53 (1b); `routes/items.ts` line 39, `itemHierarchy.ts` line 272 and `itemPositionScope.ts` line 30 (3). "Story 3's carve-out addendum" is a different thing: provenance on board-drag §5's bands, handled like any other tag.

That's 20 sites to re-point, 2 header ranges and 1 to check. Batch 1c's D4 table and batch 3's use the new numbers from the start.

### D11. What A3's close-out routes here

A3's close-out report (`test-reconciliation-a3-close.md`, archived) leaves these comments to A4. Line numbers are from 2026-09-29.

- **Case IDs in comments outside the tests** (D2's row for them). The checker doesn't flag these, so this list is the checklist:
  - **1b:** `placement.ts` lines 88 and 128 (DRAG-5.12 and DRAG-5.4, which A3 qualified); `dragRequest.ts` lines 22 ("TC-7.1/7.2"), 37–38, 133 and 135; `dragClassification.ts` lines 15, 19–22, 61, 88 and 95; `itemListOps.ts` lines 28, 119 and 155; `itemWriteReconciliation.ts` lines 77 and 93.
  - **1c:** `useItemManagement.ts` line 18; `StubRows.tsx` line 82.
- **Prefix-less tails in test comments,** each written out in full:
  - **4a:** `dragBands.test.ts` lines 101–102 ("DRAG-3.6/3.7 and DRAG-3.8/1.6") and 360 ("DRAG-3.6/3.7"); `itemListOps.test.ts` line 298 ("TC-2.27–2.30, DRAG-6.1/6.2"), whose range also becomes four IDs.
- **4b:** `itemRepositioningAttachedSiblings.spec.ts`'s header. Its "A.5", "B.6" and "B.7" are finding numbers from an old audit, and it calls TC-2.5 the append fallback, when TC-2.5 is the prepend fallback.

## Work, in batches

Each batch does six things, then stops for review and commit:
- sweeps its files per D2 and D3;
- writes the D6 rulings whose sites are in those files;
- places the D5 passages whose homes are in those files;
- re-points the D10 sites in those files;
- clears the D11 items in those files;
- runs D8's checks.

- **1a-i to 1c, board drag.** The D7 files, plus the placements from A2's board-drag-interaction handoff, some of which land in `workflow/CLAUDE.md`. 1c ends with D4's index-pointer table for board-drag-interaction.
- **2, the rest of the client.** The sweep only.
- **3, the server.** The sweep, A2's placements for item-attachment, item-positioning and boards-columns-unsorted, and D4's index-pointer tables for those three pages.
- **4a and 4b, the tests.** The sweep, including:
  - provenance left in titles;
  - bare `TC-n` IDs in comments, qualified against A3's catalog;
  - each `§N` becoming the ID of the case its test covers, where there is one.

  4b runs the E2E suite.
- **5, lint.** Per D9.

## Code map

| File or area | Batch | Change |
|---|---|---|
| The board-drag files in D7 | 1a-i to 1c | comments only, plus the D6 rulings |
| `client/src/components/workflow/CLAUDE.md` | 1a-i to 1c | receives placed passages (D5), mental model or rules that span modules only |
| The rest of `client/src` (not tests) | 2 | comments only |
| `server/src` | 3 | comments only, plus index pointers for three wiki pages |
| Test files in `client/src`, `server/tests`, `tests` | 4a, 4b | comments and title provenance only |
| Root `package.json`, the `lint` script | 5 | runs `check:docs` |

## Acceptance

- **The checker:** `npm run check:docs` over its default scope reports zero hits, and every exception carries an ignore marker with a reason. `npm run lint` runs it.
- **No code changed:** every batch's comparison was clean. Unit tests, typecheck and lint pass, and the E2E suite passed in 4b.
- **Index pointers:** every section of the four wiki pages that states a rule the code enforces has one pointer at its main enforcement site (D4's tables).
- **Moved sections:** every D10 site cites its new section.
- **Rulings:** all sixteen D6 rulings have a disposition. Each is either written, or "no comment" with the reason.
- **Placements:** every passage in A2's handoff lists has a D5 disposition.
- **No four-pass audit of its own.** No code is restructured (A1 D10). The swept comments get reviewed by the next audit whose range covers A4's commits.

## Handoff

Filled in as the batches land:
- **To the PO:** possible wiki gaps from D4, i.e. rules the code enforces that no section states, and unmarked sections that nothing enforces.
- **To the Architect:** passages that belong in root `CLAUDE.md` (D5's "root").
- **To Nathan, for the next story or audit:** code that looked wrong while I was reading (D3), each with its site.
- **To A5 (wiki and test-plan hierarchy):** every pointer A4 writes cites the wiki as it stands (D4). When A5 moves or renumbers a rule, it re-points the comments that cite it, found by searching for `wiki <page> §N`. The project sidebar's rules in board-drag-interaction §7 and §7.1 are the ones A5 already plans to move.
- **To A6 (the Auditor):** comments whose reason I couldn't recover. The tag is gone and the site is listed here, so the dry run can look at them.
- **The D5 disposition table** for A2's passages.

### D5 dispositions

board-drag-interaction, from A2's list. Rows are added as each passage's home batch lands.

| Section | Passage | Disposition |
|---|---|---|
| Page header | The pop machine is `popSession.ts`, the regions `dragRegions.ts`, the placement layer `itemListOps.ts`, the thresholds and bands `dragTuning.ts` | **Covered:** `workflow/CLAUDE.md`'s "Where each concern lives" names each module. The lead was stale: the placement layer is `placement.ts`, and the bands are `dragBands.ts`. (1a-i) |
| §2 | The carried card's clamp is `clampToCurrentContext` | **Placed:** an index pointer at `dragOverlayGeometry.ts::clampToCurrentContext`. (1a-i) |
| §3.1 | The panel values persist in `localStorage` under `kanban_drag_tuning`, and tests seed that key | **Covered:** `dragTuning.ts`'s header and `DRAG_TUNING_STORAGE_KEY`, with an index pointer to §3.1. `workflow/CLAUDE.md`'s testing conventions name `seedDragTuning`. (1a-i) |
| §8 | The two pops come from `popSession.ts`'s layer-generic pop-out clock, through the region's `parentRegionKey` | **Placed:** `popSession.ts`'s header, under "Pop out, from any layer". (1a-i) |
| §10 | The no-anchor slot is `popSession.ts::noAnchorSlot` | Stale lead: it's `placement.ts::noAnchorSlot`. Goes to 1b. |

### Progress toward D4 and D6

**D6 rulings written** (2 of 16):
- #30, `popInDelayFor` is a genuine per-kind table: at `popSession.ts::popInDelayFor`. The reason comes from the Story 5 audit's #23: the other kind tests are separate properties that only happen to split the kinds alike, and one table would couple them. (1a-i)
- #30, `clampToCurrentContext`'s `!== 'column'` vs `containmentRect`'s `=== 'column'`: at both sites. The reason comes from the Story 4.1 plan's F6: one decides how far the carried copy follows, the other whether the context still holds, and a merged column answers them against different boxes (wiki board-drag-interaction §2). (1a-i)

**Board-drag-interaction pointers so far.** 1c turns these into D4's table.
- **Index:**
  - `popSession.ts`'s header: §1.1 (rules 2 and 3), §3, §3.1 and §6.1.
  - `popSession.ts::namedCardCandidate`: §6.1, for "the Card zoomed into is the one the side highlight names".
  - `popSession.ts::containmentRect`: §2, for "a merged column holds against its outer body".
  - `dragOverlayGeometry.ts::clampToCurrentContext`: §2, for the clamp.
  - `dragTuning.ts`'s header: §3.1, for the tuning panel and its persistence.
  - `useSnapTween.ts`'s header: §3, for the snap on a pop.
- **Guard:**
  - `popSession.ts::PopHover.side`: §6.1's reset rule.
  - `popSession.ts::ParentKeyOf`: §1.1 rule 2.
  - `namedCardCandidate`'s resolution against `regions`: §3.2.
  - `dragTuning.ts`: §5. The reservation isn't a tuning value.

## Amendments

- **2026-09-29, before batch 1 (Coder, with Nathan):**
  - 1a split into 1a-i and 1a-ii (D7), since its baseline is 248 hits.
  - D2 gains a row for case IDs in comments outside the tests, and D11 lists what A3's close-out routes here.
  - D4: pointers cite the wiki as it stands, with a Handoff line to A5.
  - D7 and D9: A3 has closed, and the wiki and test plans report 0 hits.
  - The Auditor's story is A6 now, after its file name. The Handoff says so.
