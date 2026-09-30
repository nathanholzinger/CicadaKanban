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

**When each page is done:** board-drag-interaction at the end of batch 1c-ii; the other three pages at the end of batch 3-ii. Each of those batch reports includes a table mapping every section either to its site or to "no enforcing code".

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

1a's, 1b's and 1c's figures are that baseline (2026-09-29): the comment lines I read, and the checker's hits. At 248 hits, 1a split into two stops (Nathan). 1b split the same way at 214 hits, since it also carries most of D11 and eight D6 rulings, and 1c at 255.

Batch 2's baseline is 54 files, about 500 comment lines and 68 hits, far above the estimate of ~55 lines: the grep counted only tagged lines, and every comment in a swept file is read. That's more reading than any batch-1 stop, so it split too. `test-setup.ts` has no comments and is test setup, so it's left to 4a.

Batch 3's baseline is 35 files, about 805 comment lines and 111 hits, again far above the estimate for the same reason. It split in two: 3-i is the position and hierarchy layer, where most of item-attachment's and item-positioning's rules are enforced, and 3-ii is the rest. The three D4 tables come at the end of 3-ii, since some rule sites (column ranges, the terminal-flip backfill) are in its files.

Batch 4a's baseline is 40 files, about 840 comment lines and 235 hits, against an estimate of ~115 lines. It split in three: 4a-i is the tests of the pop machine, regions, bands and collision, with their fixtures; 4a-ii the tests of placement, requests, lists and client `lib/`; 4a-iii the server's tests.

Batch 4b's baseline is 32 files, about 1,200 comment lines and 155 hits, against an estimate of ~105 lines. It split in three: 4b-i is the helpers, the page object and the API specs; 4b-ii the four board-drag UI specs; 4b-iii the other UI specs. Each stop runs the E2E suite, since each is its own commit.

Paths in 1a–1c are under `client/src/components/`, with the drag modules in its `workflow/` directory. Paths in 3-i are under `server/src/lib/` unless they name `routes/`.

| Batch | Files | Est. lines | Waits for |
|---|---|---|---|
| **1a-i** Board drag: the pop machine | `popSession.ts`, `dragTuning.ts`, `useSnapTween.ts`, `dragOverlayGeometry.ts` | ~400 read, 124 hits | A1; A2's board-drag-interaction page |
| **1a-ii** Board drag: regions and bands | `dragRegions.ts`, `dragBands.ts`, `cardMetrics.ts` | ~410 read, 124 hits | 1a-i |
| **1b-i** Board drag: placement and requests | `placement.ts`, `dragRequest.ts`, `dragClassification.ts`, `itemListOps.ts`, `itemWriteReconciliation.ts` | ~450 read, 128 hits | 1a-ii |
| **1b-ii** Board drag: collision and projection | `dragCollision.ts`, `descendantsProjection.ts`, `DragSessionContext.ts`, `client/src/lib/hierarchyPlacement.ts` | ~375 read, 86 hits | 1b-i |
| **1c-i** Board drag: the hooks | `useBoardDnd.ts`, `useItemManagement.ts`, `usePendingGhostGuard.ts` | ~410 read, 88 hits | 1b-ii |
| **1c-ii** Board drag: the components | `KanbanCard.tsx`, `StubRows.tsx`, `dragChrome.tsx`, `BandGuides.tsx`, `BoardColumn.tsx`, `CardList.tsx`, `BoardView.tsx`, `DragTuningPanel.tsx` | ~455 read, 167 hits | 1c-i |
| **2-i** The rest of the client: the sidebar, `lib/`, `types.ts`, `api/` | `sidebar/`, `ProjectSidebar.tsx`, `client/src/lib/hierarchy.ts`, `isStub.ts`, `types.ts`, the 14 files in `api/` | ~230 read, 48 hits | A1 |
| **2-ii** The rest of the client: the other components | everything else in `client/src` that isn't a test: item detail, modals, the toolbar, the board-management hooks, `App.tsx` | ~270 read, 24 hits | 2-i |
| **3-i** Server: the position and hierarchy layer | `itemHierarchy.ts`, `itemPositionScope.ts`, `itemTree.ts`, `positionResolver.ts`, `attachedCascade.ts`, `coarsestFit.ts`, `reorder.ts`, `routes/items.ts` | ~420 read, 80 hits | A2's other three pages |
| **3-ii** Server: the rest | the other routes, the rest of `server/src/lib/`, `db/`, `index.ts`, `mcp.ts` | ~385 read, 31 hits | 3-i |
| **4a-i** Unit tests: the pop machine, regions, bands and collision | the `popSession`, `dragTuning`, `dragOverlayGeometry`, `dragRegions`, `dragBands`, `dragCollision`, `descendantsProjection` and `BandGuides` tests, `test/dragFixtures.ts`, `test/popFixtures.ts` | ~255 read, 86 hits | A3 (closed) |
| **4a-ii** Unit tests: placement, requests, lists, client `lib/` | the `placement`, `dragRequest`, `dragClassification`, `itemListOps`, `itemWriteReconciliation`, `hierarchy`, `hierarchyPlacement`, `projectTreeUtils`, `api/shared` and `pillUtils` tests, `test/itemFixture.ts`, `test-setup.ts` | ~260 read, 92 hits | 4a-i |
| **4a-iii** Unit tests: the server | `server/tests` | ~330 read, 57 hits | 4a-ii |
| **4b-i** E2E: helpers and API specs | `tests/helpers/`, `tests/pages/`, `tests/api/`, the global setup and teardown | ~360 read, 44 hits | A3 (closed) |
| **4b-ii** E2E: the board-drag UI specs | `drag-column-bands`, `drag-5-stub-detach`, `drag-card-zoom-in`, `drag-target-classification` | ~390 read, 76 hits | 4b-i |
| **4b-iii** E2E: the other UI specs | the rest of `tests/ui/` | ~380 read, 35 hits | 4b-ii |
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
  - **1b-ii:** `dragCollision.ts` line 85's range, the same way. Done differently: the comment guards one rule, so the range became that rule's pointer, §1.1 rule 1.
  - **1c-ii:** `dragChrome.tsx` line 126. Done: the zoom-in cue's comment cites §6.1.
  - **4a:** the `popSession.test.ts` title at line 198. Already cleared: A3's retitle to DRAG-1.4 dropped the pointer.
  - **4b:** `drag-card-zoom-in.spec.ts` line 49. `drag-5-stub-detach.spec.ts` line 26 also lists §6, probably for the auto-drop. Check which rule it means before changing it.

  §6 keeps the auto-drop and the pinned ghost, so a pointer to those stays, e.g. `placement.ts` line 88's "set back down".
- **item-positioning §2 → §2.1**, the scope-change table:
  - **3:** `itemHierarchy.ts` lines 237 and 263. Done in 3-i.
  - **4a:** `items.hierarchy.test.ts` line 11.

  §2 keeps anchor + side resolution, the client-side role and the workphase-only rule, so pointers to those stay.
- **item-positioning §5 → §5.1**, reindexing must be disclosed to the caller:
  - **2:** `api/items.ts` line 9. Done in 2-i.
  - **3:** `positionResolver.ts` lines 25 and 50, `itemHierarchy.ts` line 220, `routes/items.ts` line 73. Done in 3-i.
  - **4a:** `items.hierarchy.test.ts` lines 12 and 584 (a `describe` title), `positionResolver.test.ts` lines 99 and 103 (a `describe` title), `dragRequest.test.ts` line 296, `itemWriteReconciliation.test.ts` line 16. Done in 4a-ii for the two client files, both by D2's rule for a `§N` in a test: `dragRequest.test.ts`'s cites DRAG-6.7, the case its test asserts, and `itemWriteReconciliation.test.ts`'s header went, since it already names TC-5a.1 and TC-5a.2. Done in 4a-iii for the server files: `items.hierarchy.test.ts`'s header lost its pointers (every test below it names its cases), `positionResolver.test.ts` line 103 cites TC-5.9, and the two `describe` titles had already lost theirs when A3 retitled the tests.

  §5 keeps the reindex itself and its two triggers.
- **"§2 addendum" → "§2's workphase-only rule"**, still §2. The word "addendum" goes when these are rewritten: `itemListOps.ts` line 53 (1b-i, done); `routes/items.ts` line 39, `itemHierarchy.ts` line 272 and `itemPositionScope.ts` line 30 (3). Done in 3-i. `itemPositionScope.ts`'s was a tag on the workflow-wide scope, not on the workphase-only rule, so it went without a pointer: its sentence already says what it stands for, and `positionScopeFor` carries §2's pointer. "Story 3's carve-out addendum" is a different thing: provenance on board-drag §5's bands, handled like any other tag.

That's 20 sites to re-point, 2 header ranges and 1 to check. Batch 1c's D4 table and batch 3's use the new numbers from the start.

### D11. What A3's close-out routes here

A3's close-out report (`test-reconciliation-a3-close.md`, archived) leaves these comments to A4. Line numbers are from 2026-09-29.

- **Case IDs in comments outside the tests** (D2's row for them). The checker doesn't flag these, so this list is the checklist:
  - **1b-i:** `placement.ts` lines 88 and 128 (DRAG-5.12 and DRAG-5.4, which A3 qualified); `dragRequest.ts` lines 22 ("TC-7.1/7.2"), 37–38, 133 and 135; `dragClassification.ts` lines 15, 19–22, 61, 88 and 95; `itemListOps.ts` lines 28, 119 and 155; `itemWriteReconciliation.ts` lines 77 and 93. All cleared in 1b-i.
  - **1c-i:** `useItemManagement.ts` line 18. Cleared in 1c-i.
  - **1c-ii:** `StubRows.tsx` line 82. Cleared in 1c-ii: DRAG-2.8 became a guard pointer to §4.
- **Prefix-less tails in test comments,** each written out in full:
  - **4a:** `itemListOps.test.ts` line 298 ("TC-2.27–2.30, DRAG-6.1/6.2"), whose range also becomes four IDs. Done in 4a-ii.
  - **4b:** `drag-column-bands.spec.ts` lines 101–102 ("DRAG-3.6/3.7 and DRAG-3.8/1.6") and 360 ("DRAG-3.6/3.7"). A3's report put these in `dragBands.test.ts`, but they're in this E2E spec.
- **4b:** `itemRepositioningAttachedSiblings.spec.ts`'s header. Its "A.5", "B.6" and "B.7" are finding numbers from an old audit, and it calls TC-2.5 the append fallback, when TC-2.5 is the prepend fallback. Done in 4b-i.

## Work, in batches

Each batch does six things, then stops for review and commit:
- sweeps its files per D2 and D3;
- writes the D6 rulings whose sites are in those files;
- places the D5 passages whose homes are in those files;
- re-points the D10 sites in those files;
- clears the D11 items in those files;
- runs D8's checks.

- **1a-i to 1c, board drag.** The D7 files, plus the placements from A2's board-drag-interaction handoff, some of which land in `workflow/CLAUDE.md`. 1c ends with D4's index-pointer table for board-drag-interaction.
- **2-i and 2-ii, the rest of the client.** The sweep, plus index pointers for the rules these files enforce. 2-i adds the project sidebar's to D4's board-drag-interaction table.
- **3-i and 3-ii, the server.** The sweep, A2's placements for item-attachment, item-positioning and boards-columns-unsorted, and D4's index-pointer tables for those three pages at the end of 3-ii.
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
| The rest of `client/src` (not tests) | 2-i, 2-ii | comments only |
| `server/src` | 3-i, 3-ii | comments only, plus index pointers for three wiki pages |
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
  - **board-drag-interaction (1c-ii):** no unmarked section lacks enforcing code (§9 is "Not settled"). Three rules the code enforces that no section states:
    - a press becomes a drag only after 5px of pointer movement; less is a click, which opens the item (`useBoardDnd.ts`'s `PointerSensor` activation distance);
    - a board reload that lands mid-drag (from an earlier drop's failed or resyncing write) cancels the live drag the way Escape does (`useBoardDnd.ts::resyncBoard`);
    - columns reorder by dragging, and a column drag never runs the pop machine (`useBoardDnd.ts::handleDragEnd`'s column branch). This one may belong on boards-columns-unsorted.
  - **item-attachment (3-ii):** no unmarked section lacks enforcing code (§10 has none of its own, since it follows from §2). Two rules the code enforces that no section states:
    - deleting an item deletes its whole subtree, detached descendants included (`routes/items.ts`'s `DELETE /:id`, through `itemTree.ts::walkItemDescendants`);
    - an item created under a parent is attached unless the request says otherwise (`routes/items.ts`'s POST, and `schema.ts`'s `isAttached` default). §11a's "whether it's attached to it" implies a choice but doesn't give the default. The parentless side of that default is ATT-1.8, which A5 already carries.
  - **item-positioning (3-ii):** no unmarked section lacks enforcing code (§7.5 is §2's workphase-only rule reached through board-drag-interaction §5's middle band). One rule the code has that §2 contradicts: the API accepts a final position, as `PATCH /items/:id/move`'s raw `position` and `PATCH /items/reorder`. A5 already carries this as TC-2.32. For that ruling: no client code calls either one. `api/items.ts::reorderItems` wraps the reorder endpoint but has no caller.
  - **boards-columns-unsorted (3-ii):** the page has no numbered sections, so no comment can carry an index pointer to it; `wiki <page> §N` needs a section. D4's table for it maps each of the page's bullets to its site instead, so the follow-up story that writes the page out in full can add the pointers once it numbers them. No bullet lacks enforcing code. The rules the code enforces that the page doesn't state are already A2's input for that story (the last-board 409, the column range 400s, `needsAttention`).
- **To the Architect:** passages that belong in root `CLAUDE.md` (D5's "root"), and anything false in a `CLAUDE.md` file, which A4 doesn't edit.
  - **`workflow/CLAUDE.md`'s module list (2-ii):** it says `DragTuningContext.ts` serves "the components that draw thresholds and bands". Its one reader is `KanbanCard.tsx`, for the zoom-in cue's timing (`cardPopInDelayMs`); the band guides don't read it. The module's own comments now say so.
  - **Root `CLAUDE.md`'s "One hierarchy-write primitive" (3-i) overstates POST.** It says every write that can give an item a parent, `POST /items` included, routes through `itemHierarchy.ts`. `PUT /items/:id` and `PATCH /items/:id/move` do, through `validateHierarchyRequest` and `applyHierarchyRequest`. `POST /items` checks its parent itself (it exists, it's in the same project, and the depth cap through `itemTree.ts::assertWithinDepthCap`), and uses `itemHierarchy.ts` only to log (`logCreatedUnderParent`). The guardrail's instruction, not to reimplement that logic at the route level, still holds. `itemHierarchy.ts`'s header made the same claim and now names its two entry points.
- **To Nathan, for the next story or audit:** code that looked wrong while I was reading (D3), each with its site.
  - **The project sidebar writes on a set-down in its own slot (2-i).** wiki board-drag-interaction §7.1 says an item set back down in its own gap, at its own depth, writes nothing, and the board keeps to that (`descendantsProjection.ts::descendantsReleasePlacement`). The sidebar doesn't: once the pointer has left the project's own row and come back, `useProjectDragReorder.ts`'s `handleDragEnd` sends the move, and the server places the project between the same neighbors. Nothing visibly moves, but `position` and `updatedAt` change. A release before the pointer leaves its own row writes nothing, since there's no projection yet. The fix is a check against the project's own slot before `onReorderProject`, like the board's.
  - **The Sheet's parent picker offers parents over the depth cap (3-i).** wiki item-attachment §7 says the UI must never present a target the API would reject. `ParentSection.tsx::buildParentOptions` (through `hierarchy.ts::buildParentOptions`) leaves out the item itself and its descendants, but not a parent at which the item's subtree would exceed `ITEM_DEPTH_CAP`. Picking one gets the API's 400, which the section shows as an error. The board's drag doesn't have this gap: it classifies against `itemDepthCap`.
  - **Two redundant keys in `ProjectPage.tsx` (2-ii), not wrong.** Its `ConfirmDeleteInline` and `ProjectOverviewTab` are each keyed on `project.id` to reset their state on a project switch, but `App.tsx` already keys the whole `ProjectPage` on the selected project, so a switch remounts both anyway. The comment at the first key said nothing else reset that state; it now says only what the key guarantees.
- **To the Test Reconciler, on its next run:** test comments where a wiki pointer became the case ID the test asserts (D2), though the test's title doesn't carry that ID. A comment ID doesn't count as coverage, so each case's status is unchanged. The route test counts without approval. The rest are internal tests: those in a pre-approved category may be mapped outright, and the others need Nathan's approval.
  - `dragRequest.test.ts`, the stale-response test in `sendItemMove`: DRAG-6.7 (Open). (4a-ii)
  - `itemListOps.test.ts`, the done-list test that draws an item with no `completedAt` last: DRAG-6.11 (Open). (4a-ii)
  - `popSession.test.ts`, the "popping out of a context the sample has no region for" block: DRAG-1.17 (Open). (4a-i)
  - `popSession.test.ts`, the "locked Card: zoom-in into its own Descendants section" block: DRAG-1.21's zoom-in half (Open). (4a-i)
  - `dragCollision.test.ts`, the Stub-row `dropAnchorFor` test: DRAG-4.8 (Automated through other tests). (4a-i)
  - `positionResolver.test.ts`, the `disclosure` block: TC-5.9 (Automated through other tests). (4a-iii)
  - `routes/items.test.ts`, the PUT cross-project reparent test: ATT-5.1 (Automated through other tests). This is the route test. (4a-iii)
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
| §10 | The no-anchor slot is `popSession.ts::noAnchorSlot` | **Placed:** `placement.ts::noAnchorSlot`'s comment, with an index pointer to §10. The lead was stale: it's in `placement.ts`. (1b-i) |
| §1 | Region lookup is simple containment, through one lookup for every layer (`childRegionAt`). A sub-row is clipped to its column's visible scroll box when regions are measured (`measureRegions`) | **Placed:** `dragRegions.ts`'s header, with an index pointer to §1. `childRegionAt` and `measureRegions` say the same at the functions. (1a-ii) |
| §5 | `h` is `KanbanCard.tsx::SHORT_CARD_HEIGHT_PX` and `gap` is `CARD_LIST_GAP_PX`; the band math and the carve-out render read the same two numbers | **Covered:** `cardMetrics.ts::SHORT_CARD_METRICS` and `dragBands.ts::ShortCardMetrics`, and `workflow/CLAUDE.md`'s "Short-card sizing". `dragBands.ts::Reservation` names both readers of the formula. The lead was stale: both constants are in `cardMetrics.ts`, and the band math is `dragBands.ts`. (1a-ii) |
| §7 | `childRegionAt` returns a Descendants section as a zoom-in candidate | **Placed:** `dragRegions.ts::childRegionAt`. The shared placement library half goes to 1b-ii. (1a-ii) |
| §4 | Classification lives in `dragClassification.ts`. The depth cap comes from the server's `ITEM_DEPTH_CAP` through `GET /boards/:id`'s `itemDepthCap`, never hard-coded on the client | **Covered:** `dragClassification.ts`'s header, with an index pointer to §4, and `workflow/CLAUDE.md`'s module list. The cap: `useBoardDnd.ts`'s drag start says it comes off the board response, never hard-coded. (1b-i) |
| §8 | `dragRequest.ts::toRequest` sends the detach once `placementFor` previews the item Free | **Placed:** `toRequest`'s detach branch, with an index pointer to §8. (1b-i) |
| §10 | Per-item response sequencing: `ItemWriteTracker.complete` reports `needsResync`, and `sendItemMove` reloads the board when it's set | **Placed:** `dragRequest.ts::sendItemMove`'s comment, with an index pointer to §10. The tracker's own half is 1c's. (1b-i) |
| §10 | The preview placement's shape: `{ workphaseId?, slot }`, with the slot `first`, `last`, `existing` or `{ anchorId, side }` | **Covered:** `itemListOps.ts::Placement` and `PlacementSlot`. (1b-i) |
| §10 | The done-list comparator is `byCompletedAtThenCreatedAt` | **Placed:** its comment, with an index pointer to §10. (1b-i) |
| Page header | Every item drag, Card or Stub, shares one dnd-kit registration (`data: {type: 'item', role}`) | **Placed:** `dragCollision.ts`'s row-data comment, where the typed registration lives. `workflow/CLAUDE.md`'s mental model says the same. (1b-ii) |
| §2 | One function, `dragCollision.ts::dropAnchorFor`, feeds both the side highlight and the release | **Placed:** `dropAnchorFor`'s comment, with an index pointer to §2 and §7.1. `workflow/CLAUDE.md` names it too. (1b-ii) |
| §2 | In a Descendants section, the dragged Stub's traveling rows come from `travelingRowsFor` | **Placed:** `travelingRowsFor`'s comment, with a guard pointer to §7.2. (1b-ii) |
| §7 | The board's Descendants section and the project sidebar share one placement library (`client/src/lib/hierarchyPlacement.ts`) | **Covered:** `hierarchyPlacement.ts`'s header, with an index pointer to §7.1, and root `CLAUDE.md`'s "One position math layer". (1b-ii) |
| §8 | A Stub drag starts in its containing Card's Descendants region (`useBoardDnd.ts::handleDragStart` → `descendantsRegionKey`) | **Placed:** `useBoardDnd.ts::beginDragAt`'s comment, with an index pointer to §1, and `containingCardIdOf`'s. (1c-i) |
| §10 | The tracker's half of per-item sequencing: `ItemWriteTracker.complete` reports `needsResync` | **Placed:** `useItemManagement.ts::ItemWriteTracker`, with an index pointer to §10. (1c-i) |
| §10 | A re-drag stashes the pending placement at drag start and restores it on cancel | **Covered:** `useBoardDnd.ts::handleDragStart`'s `priorPlacement` comment, and `usePendingGhostGuard.ts`'s header, with an index pointer to §10. (1c-i) |
| §10 | The ghost is cleared reactively when its placement goes missing mid-drag | **Covered:** `usePendingGhostGuard.ts`'s header. The lead reads backwards: the guard puts the ghost back the instant a response clears it. (1c-i) |
| Page header | Classification is shown as a `data-drop-state` attribute | **Placed:** `dragChrome.tsx`'s overlays comment, with an index pointer to §4. `workflow/CLAUDE.md`'s testing conventions name the attribute too. (1c-ii) |
| §1.1 | The band guides are drawn by `BandGuides.tsx`; the locked-layer outline by `BandGuides.tsx` for a column or sub-row and by `KanbanCard.tsx` for a Card, both keyed on the locked context key | **Covered:** `BandGuides.tsx`'s header and `ACTIVE_CONTEXT_OUTLINE` (an index pointer to §1.1), and `KanbanCard.tsx`'s `data-active-context` comment. (1c-ii) |
| §5a | shortCard is a presentational body with no knowledge of dragging, so it can be reused outside a drag | **Placed:** `KanbanCard.tsx`'s `ShortCard` comment, with an index pointer to §5a. Its forward reference to a density option became "can be reused outside a drag". (1c-ii) |
| §10 | The pending marker is the `data-pending` attribute, which E2E tests read | **Covered:** `dragChrome.tsx`'s pending comment ("Test surface: `data-pending`") and `workflow/CLAUDE.md`'s testing conventions. (1c-ii) |

Every board-drag-interaction passage in A2's list now has a disposition.

item-attachment, from A2's list.

| Section | Passage | Disposition |
|---|---|---|
| Page header | One server primitive, `itemHierarchy.ts`, sits behind `POST /items`, `PUT /items/:id` and `PATCH /items/:id/move` | **Covered, with a correction:** `itemHierarchy.ts`'s header names its two entry points, `PUT` and `PATCH /move`, and root `CLAUDE.md`'s "One hierarchy-write primitive" names the module. The lead was partly stale: `POST /items` checks its parent itself and uses the module only to log. Root `CLAUDE.md`'s list makes the same claim, so that's in the Handoff to the Architect. (3-i) |
| §8 | The cap is one constant, `ITEM_DEPTH_CAP`, defined server-side and shared with the UI | **Placed:** `itemTree.ts::ITEM_DEPTH_CAP`'s comment, with an index pointer to §8. It names `GET /boards/:id`'s `itemDepthCap` as the way the value reaches the board's drag classification. (3-i) |

Every item-attachment passage in A2's list now has a disposition.

item-positioning, from A2's list. The rows whose home is on the client landed in batch 1; the server's land in batch 3.

| Section | Passage | Disposition |
|---|---|---|
| Page header | The client's apply order is `applyItemWriteResponse`, used on every item-write path. The inversion tripwire, the ordinal preview and the pending marker live in `itemListOps.ts` (`applyPlacements`, `completeItemWrite`) | **Covered:** `itemWriteReconciliation.ts`'s header (every item-write path goes through `completeItemWrite`, with an index pointer to §5a) and `itemListOps.ts`'s header (the ordinal preview). Root `CLAUDE.md` names `completeItemWrite`. The lead was stale: `completeItemWrite` is in `itemWriteReconciliation.ts`. (1b-i) |
| §5a | Step 4 has no separate mechanism: render order is derived from `position` on every render, so applying the pairs is the re-sort | **Covered:** `itemWriteReconciliation.ts::completeItemWrite`, "Re-sorting is implicit". (1b-i) |
| §5a | The tie-break is `(a.position ?? 0) - (b.position ?? 0) \|\| a.createdAt - b.createdAt` | **Covered:** `itemListOps.ts::byPositionThenCreatedAt`, with an index pointer to §5a. (1b-i) |
| §2.1 | The no-scope-change cascade row is `cascadeWorkphaseToAttachedDescendants` | **Placed:** its comment says the cascade leaves positions untouched, with an index pointer to §2.1. (3-i) |
| §5 | One shared server-side primitive does every reindex | **Placed:** `positionResolver.ts`'s header: both triggers, and every reindex, run through `reindexPositionsInScope`, with an index pointer to §5. (3-i) |
| §1 | `items.position` is a nullable `REAL` column | **Placed:** `schema.ts`'s `items.position` declares it, and now carries an index pointer to §1. (3-ii) |
| §6 | The split reads `workphases.isTerminal`, and `items.completedAt` is the stored column | **Covered:** `schema.ts`'s `completedAt` comment, whose link to a decisions doc became a pointer to §6, and `applyHierarchyRequest`'s active/done split, whose `isTerminal` reads `workphases.isTerminal`. (3-ii) |

Every item-positioning passage in A2's list now has a disposition.

boards-columns-unsorted, from A2's list. None can carry a pointer, since the page has no numbered sections.

| Passage | Disposition |
|---|---|
| The column range is stored as `start_workphase_id` / `end_workphase_id` | **Covered:** `schema.ts`'s `columns` table declares both. (3-ii) |
| Pre-existing workflows got their first board through a backfill in `runMigrations.ts` | **Covered:** `runMigrations.ts`'s header and its "Bootstrap a default board" step, and `boards.ts::createDefaultBoard`'s comment, which names the backfill as a caller. The step's "Phase 4" label went. (3-ii) |
| An item's workphase column is `items.workphase_id` | **Covered:** `schema.ts`'s `items.workphaseId`, with the SET NULL comment above it. (3-ii) |

Every passage in A2's lists now has a disposition.

### D6 rulings and D4's index pointers

**D6 rulings, all 16 with a disposition** (15 written, 1 "no comment"):
- #30, `popInDelayFor` is a genuine per-kind table: at `popSession.ts::popInDelayFor`. The reason comes from the Story 5 audit's #23: the other kind tests are separate properties that only happen to split the kinds alike, and one table would couple them. (1a-i)
- #30, `clampToCurrentContext`'s `!== 'column'` vs `containmentRect`'s `=== 'column'`: at both sites. The reason comes from the Story 4.1 plan's F6: one decides how far the carried copy follows, the other whether the context still holds, and a merged column answers them against different boxes (wiki board-drag-interaction §2). (1a-i)
- #30, the board's `(d+1)·12` indent vs the sidebar's `12 + d·14`: at `cardMetrics.ts::descendantsIndentPx`. The reason: there 12 is a base inset and the step is 14, here 12 is the step itself. The sidebar's half was already written, at `projectTreeUtils.ts::ROW_BASE_INSET_PX`. (1a-ii)
- #24, a Stub's stored `workphaseId` goes stale: at `itemWriteReconciliation.ts::applyItemWriteResponse`. Only the written row is upserted, so the server's cascade to attached descendants isn't mirrored; a drag never reads those copies, since a Stub's drag takes its containing Card's value at drag start. (1b-i)
- #24, a bare-container release is a no-op for a Card: at `placement.ts::resolvePlacementOver`, with a guard pointer to wiki board-drag-interaction §2. dnd-kit doesn't shuffle when `over` is the container, so the ghost never left its slot. (1b-i)
- #30, `placementFor`'s Card branch skips `priorPlacement`: at the Card branch. The reason, recovered from the code (the Story 6 plan doesn't state it): a set-down there must write nothing, `origin` is what `isIdentity` compares against, and `usePendingGhostGuard.ts::restorePriorPlacement` puts the pending marker back after a release that writes nothing. (1b-i)
- #30, `isWithinDepthCap` vs `assertWithinDepthCap`: at `dragClassification.ts::isWithinDepthCap`. Its pointer was already in the right format; it now names `itemTree.ts::assertWithinDepthCap` as a checked reference, and says why they're separate: the same formula on each side of the process boundary. (1b-i)
- #30, `siblingIdsFromAnchor` vs the board release's anchor → slot step: at `descendantsProjection.ts::descendantsReleasePlacement`. The item move carries `{anchorId, side}`, so the board keeps the relation as a slot; the projects API takes `prevId`/`nextId`. Two APIs, two shapes. (1b-ii)
- #24, the mixed-space comparison: at `dragCollision.ts::resolveBoardCollisions`'s Descendants branch. The section rect is painted space and dnd-kit measures droppables without transforms (its default `getTransformAgnosticClientRect`, with no override in `client/src`); they differ only while the Card carries a sortable transform, which can't overlap a Descendants lock at the default clocks. (1b-ii)
- #30, `travelingRowsFor` vs `resolveGap`: at `travelingRowsFor`. The reason, recovered from both functions (the audit said only "semantic"): the sidebar draws no ghost, so it maps an `over` inside the dragged block to the gap the block collapses to, while the board names the ghost's neighbor in dnd-kit's shuffled order. Same outcome from different inputs. (1b-ii)
- #30, the board's projection seed vs the sidebar's: at `descendantsProjection.ts::seedFor`. The reason comes from the Story 6 plan's decision 3, checked against today's code: a sidebar drag always starts at its own row, but a board drag can also enter a section from the Card layer, which seeds where that layer showed the ghost. The depth step itself is shared. (1b-ii)
- #30, `regionItems` vs `BoardColumn.tsx`'s render lists: at `useBoardDnd.ts::regionItems`. Both read the same selectors (`getMergedColumnItems`, `getWorkphaseItems`, checked in `BoardColumn.tsx`), so the release list and the rendered list can't disagree; only the call site repeats. (1c-i)
- #24, a Descendants release with no `over`: **no comment.** The release reads only the projection, which `handleDragEnd`'s Descendants branch already says, so nothing there looks wrong. (1c-i)
- #30, the board's per-row blue line vs the sidebar's gap indicator: at `dragChrome.tsx::useLiveDropSide`. The sidebar draws no ghost, so it draws one line at the projected gap (`useProjectDragReorder.ts::dropLine`); the board draws on whichever row the ghost's named neighbor is. Only `DROP_INDICATOR_LINE` is shared. (1c-ii)
- #30, the two `SortableContext`s: at the Descendants one, in `KanbanCard.tsx`'s section comment. `CardList.tsx`'s holds a card list's Free Cards, this one the section's rows at every depth, and each list's shuffle stays within its own rows. (1c-ii)
- #30, `AttachGhostRow` vs `AttachedChildRow`: at `StubRows.tsx::AttachGhostRow`. dnd-kit doesn't support two sortable registrations for one id, and the item's real registration is wherever it's being dragged from; only the box class is shared. The reason was already at the site, under history; `KanbanCard.tsx`'s call site gave a different, weaker one (the pop machine seeing the wrong role), which now points here instead. (1c-ii)

**D4: board-drag-interaction's index pointers** (done at the end of 1c-ii). Each section, the site that mainly enforces each of its rules (index pointers), and the guard pointers that also cite it.

| Section | Index pointers | Guard pointers |
|---|---|---|
| §1 | `dragRegions.ts`'s header: a region is a bounded box, nowhere is no region, and a region is clipped to what's visible. `useBoardDnd.ts::beginDragAt`: where a drag starts. | — |
| §1.1 | `placement.ts`'s header: rule 1. `popSession.ts`'s header: rules 2 and 3. `BandGuides.tsx::ACTIVE_CONTEXT_OUTLINE`: the locked-layer outline. `BandGuides.tsx::DragCarveFrame`'s keyed slot: a drag leaves every Card's Stub list as the user set it. `KanbanCard.tsx`'s forced-open comment: a Card the drag zooms into opens. | `popSession.ts::ParentKeyOf` and `dragRegions.ts::childRegionAt`: rule 2. `dragCollision.ts::resolveBoardCollisions`: rule 1. `KanbanCard.tsx`'s `sectionIsRegion`: a childless Card has no Descendants layer. |
| §2 | `dragCollision.ts::dropAnchorFor`: rules 1–4, the ghost's slot and the named neighbor. `dragRequest.ts::isIdentity`: rule 5. `dragOverlayGeometry.ts::clampToCurrentContext`: bounded by the context. `popSession.ts::containmentRect`: a merged column holds against its outer body. Rule 6 (a done list has no slot) has no pointer: its release fallback is `placementFor`'s `region.isTerminal` branch, but I didn't confirm how the done list stops the shuffle, so I left it unmarked. | `placement.ts::resolvePlacementOver`: the drop lands where the ghost is. `useBoardDnd.ts::handleDragEnd`: rule 5. |
| §3 | `popSession.ts`'s header: popping out and in. `useSnapTween.ts`'s header: the snap. | — |
| §3.1 | `popSession.ts`'s header: the clocks. `dragTuning.ts`'s header: the values and their persistence. `DragTuningPanel.tsx`'s header: the panel is part of the feature. | — |
| §3.2 | `dragRegions.ts::cardScopedStructure`: an invalid target is never enterable. The over-cap exception is §7.2's. | `popSession.ts::namedCardCandidate`. |
| §4 | `dragClassification.ts`'s header: the classification. `dragChrome.tsx`'s overlays comment: the overlay assignments. | `StubRows.tsx::AttachedChildRow`: every Stub is classified individually. |
| §5 | `dragBands.ts`'s header: the bands and the reservation. `BandGuides.tsx`'s header: the guides draw only at Board layer. `placement.ts::placementFor`'s Board branch: what each band means. `dragRegions.ts::CardListRegion.targetWorkphaseId`: a merged column's drop takes its first workphase. | `dragTuning.ts`'s header: the reservation isn't a tuning value. |
| §5a | `KanbanCard.tsx`'s `ShortCard` comment: both copies are shortCard. `placement.ts::overlayFormFor`: a Stub row from the Card layer down. | — |
| §6 | `placement.ts::placementFor`'s Card branch: the auto-drop. | — |
| §6.1 | `popSession.ts::namedCardCandidate`: the named relation is the signal. `dragChrome.tsx::ZoomCue`'s comment: the cue. | `popSession.ts::PopHover.side`: the reset rule. |
| §7 | `descendantsProjection.ts::advanceProjection`: zooming in doesn't move the ghost. | — |
| §7.1 | `hierarchyPlacement.ts`'s header: gap and depth. `dragCollision.ts::dropAnchorFor`: the gap is the ghost's neighbors. `descendantsProjection.ts::descendantsReleasePlacement`: a set-down in its own gap and depth writes nothing. Added in 2-i: `useProjectDragReorder.ts`'s header: the sidebar's drop line is the gap. `projectTreeUtils.ts::fullChildrenOf`: the sidebar places against the real tree. | `descendantsProjection.ts`'s header; `DragSessionContext.ts::DescendantsProjection.atOwnSlot`. |
| §7.2 | `hierarchyPlacement.ts::toRows`: the dragged subtree is never a candidate. `descendantsProjection.ts::advanceProjection`: the cap is checked per tab state. `descendantsProjection.ts::descendantsReleasePlacement`: an over-cap state commits nothing. `dragChrome.tsx::INVALID_PLACEMENT_CLASS`: the invalid cue. | `dragCollision.ts::travelingRowsFor`. |
| §8 | `dragRequest.ts::toRequest`'s detach branch: a detach writes `isAttached: false` and leaves `parentId`. The two pops are §1.1's and §3.1's clock. | — |
| §9 | **No enforcing code:** the section is "Not settled" and defers to Open questions. | — |
| §10 | `itemListOps.ts`'s header: the ordinal preview. `dragRequest.ts::toRequest`: the preview shows where the write lands. `DragSessionContext.ts::useIsPending`: the pending marker. `itemWriteReconciliation.ts`'s header: the response order and the tripwire. `useItemManagement.ts::ItemWriteTracker`: a stale response never lands last. `usePendingGhostGuard.ts`'s header: a re-drag's marker and ghost. `dragRequest.ts::sendItemMove`: a failed drop resyncs. `placement.ts::noAnchorSlot`: no comparable position previews last. `itemListOps.ts::byCompletedAtThenCreatedAt`: a done list shows a previewed item as the newest. | — |

Each section that states a rule the code enforces has at least one index pointer. §2's rule 6 is the one rule without one (above). The sidebar doesn't keep §7.1's "a set-down in its own gap writes nothing", so that rule's pointer stays on the board side; the gap is in the Handoff to Nathan.

**D4: the other three pages' index pointers** (done at the end of 3-ii). Paths under `server/src/lib/` and `client/src/components/workflow/` drop their directory. Each page's section has at least one index pointer, except where the table says why not.

item-attachment:

| Section | Index pointers | Guard pointers |
|---|---|---|
| §1 | `itemHierarchy.ts::validateHierarchyRequest`'s "attached with no parent" check. `ResultingState.attachedFlag`: clearing the parent clears the flag. | — |
| §2 | `attachedCascade.ts`'s header: the cascade, halted by a detached child. `applyHierarchyRequest`'s attached branch: no `completedAt`, and the position kept. | `routes/workphases.ts`'s terminal-flip backfill skips attached children. |
| §3 | `itemHierarchy.ts::HierarchyRequest`: a request names the moving item's new parent, never a parent's children. | — |
| §4 | `HierarchyRequest.isAttached`: omitting the flag keeps the state. `applyHierarchyRequest`'s scope-change branch: an attached reparent resolves a fresh position. | — |
| §5 | `itemHierarchy.ts::ResultingState`: reparent first, then resolve. | — |
| §6 | `itemHierarchy.ts`'s banner: validate before the transaction, then apply inside it with no early returns. | — |
| §7 | `validateHierarchyRequest`'s parent block: the four legality rules. | `routes/items.ts`'s POST: the cap gates creation too. |
| §8 | `itemTree.ts::assertWithinDepthCap`: the formula. `ITEM_DEPTH_CAP`: one cap for the UI and the API. `hierarchyDepth`: a root is depth 1. `subtreeHeight`: detached descendants count. `validateHierarchyRequest`'s cap check: the cap gates writes, not existing data. | `dragClassification.ts::isWithinDepthCap`; `hierarchy.ts::getDepth` and `getSubtreeHeight`; `routes/boards.ts`'s `itemDepthCap`. |
| §9 | `applyHierarchyRequest`'s project cascade: every descendant follows. `itemHierarchy.ts::nullForeignWorkphasePositions`: a cross-workflow reparent remaps nothing. | `routes/items.ts`'s POST (a child lives in its parent's project) and `PATCH /:id/move` (the project is never sent); `api/items.ts::MoveItemInput`. |
| §10 | **No enforcing code of its own:** it follows from §2 with no special case, so §2's pointers cover it. | — |
| §11 | `HierarchyRequest.parentId`: a detach keeps its parent, and `null` is reparent to root. | — |
| §11a | `applyHierarchyRequest`'s activity log. `itemHierarchy.ts::logCreatedUnderParent`: a create under a parent counts. | — |
| §12 | `isStub.ts::isStub`: an attached descendant renders as a Stub. | — |

`POST /items` doesn't refuse `isAttached: true` with no parent, which §1 and §7's "every write" say it should. That's ATT-1.8, Pending PO in A5, so it isn't raised again here.

item-positioning:

| Section | Index pointers | Guard pointers |
|---|---|---|
| §1 | `schema.ts`'s `items.position`: one scalar per item, never per board. | — |
| §2 | `positionResolver.ts`'s header: anchor + side against a fresh query, and the append and bootstrap fallbacks. `coarsestFit.ts`'s header: coarsest-fit rounding. `itemPositionScope.ts::positionScopeFor`: the workflow-wide scope. `withPositionScope`: the `positionScope` field. `applyHierarchyRequest`'s workphase-only branch: §2's workphase-only rule. `itemListOps.ts`'s header: the client-side role. | `itemListOps.ts::workphaseOnlySlot`, `routes/items.ts::crossWorkflowMoveError` and `mcp.ts`'s `move_item`: the workphase-only rule. |
| §2.1 | `applyHierarchyRequest`'s `scopeChanged`: the table's rows. Its scope-change branch: the principle. `attachedCascade.ts::cascadeWorkphaseToAttachedDescendants`: the cascade row. | — |
| §3 | `positionScopeFor`: an attached child's scope is `(parentId, isAttached)`. | — |
| §4 | `itemListOps.ts::getMergedColumnItemsFrom`: the union-sort. `placement.ts::regionWorkphaseFor`: the drop resolution rule, a pointer added in 3-ii. | — |
| §5 | `positionResolver.ts`'s header: both triggers, and every reindex. | — |
| §5.1 | `routes/items.ts::respondWithItem`. | `positionResolver.ts::ReindexedPosition`, `applyHierarchyRequest`'s return, `api/items.ts::ReindexedPosition`. |
| §5a | `itemWriteReconciliation.ts`'s header: the order. `itemListOps.ts::byPositionThenCreatedAt`: the tie-break. | — |
| §6 | `applyHierarchyRequest`'s active/done split. `columnRanges.ts::validateColumnRange`: a column never spans done and active. `itemListOps.ts::byCompletedAtThenCreatedAt`: a done list's order. | `schema.ts`'s `completedAt`; `routes/items.ts`'s POST position block; `routes/workphases.ts::backfillItemsForTerminalFlip`. |
| §7.1 | `dragRequest.ts::anchorFor`: the client picks the anchor from its rendered list. `validateHierarchyRequest`'s anchor-scope check: validated against the resulting state, and refused outside it. | — |
| §7.2 | `itemHierarchy.ts::ResultingState`. | — |
| §7.3 | `itemHierarchy.ts::nullForeignWorkphasePositions`. | `crossWorkflowMoveError`: re-filing an item already left foreign. |
| §7.4 | `validateHierarchyRequest`'s anchor-position check: a done item is never an anchor. | — |
| §7.5 | **No separate rule:** it's §2's workphase-only rule reached through board-drag-interaction §5's middle band, and both have index pointers. | — |

boards-columns-unsorted has no numbered sections, so this maps each of the page's bullets to its main enforcing site, for the follow-up story to point at once it numbers them:

| The page's rule | Main enforcing site |
|---|---|
| A column covers a range from `startWorkphaseId` to `endWorkphaseId`, worked out on every read from the current workphase order | `columnRanges.ts::getCoveredWorkphases`, from `routes/boards.ts`'s `GET /:id` |
| Unsorted holds the uncovered workphases and the items with a missing or dangling `workphaseId`; a new workphase lands there, never joining a column | `columnRanges.ts::computeUnsorted`. `workflowItems.ts::getBoardScopeItems` scopes the board by project, so those items are found at all. `routes/workphases.ts`'s POST appends a new workphase after every existing one (`nextPosition`), outside every column's range. |
| A broken column is flagged on every read, never stored, keeps showing its items, and refuses drops | `columnRanges.ts::isColumnBroken`. `dragRegions.ts::cardListStructure` gives a broken column no drop region. |
| Every workflow always has at least one board, set up 1:1, and so does an additional board | `routes/boards.ts::createDefaultBoard`, from workflow creation, `POST /boards` and the migration backfill. `DELETE /boards/:id` refuses a workflow's last board. |
| Items never reference a board or column; MCP works at the workphase level | `schema.ts`: `items` has no board or column field. `mcp.ts`'s tools send a `workphaseId`. |

## Amendments

- **2026-09-29, before batch 1 (Coder, with Nathan):**
  - 1a split into 1a-i and 1a-ii (D7), since its baseline is 248 hits.
  - D2 gains a row for case IDs in comments outside the tests, and D11 lists what A3's close-out routes here.
  - D4: pointers cite the wiki as it stands, with a Handoff line to A5.
  - D7 and D9: A3 has closed, and the wiki and test plans report 0 hits.
  - The Auditor's story is A6 now, after its file name. The Handoff says so.
- **2026-09-29, batch 1b (Coder):** 1b split into 1b-i and 1b-ii (D7), the same way as 1a: 214 hits, plus most of D11 and eight D6 rulings.
- **2026-09-29, batch 1c (Coder):** 1c split into 1c-i (the hooks) and 1c-ii (the components), at 255 hits. D4's board-drag table comes at the end of 1c-ii.
- **2026-09-29, end of batch 1 (Coder):** the Handoff's running pointer list became D4's board-drag-interaction table, and "To the PO" gained three possible gaps.
- **2026-09-29, batch 2 (Coder):** 2 split into 2-i (the sidebar, `lib/`, `types.ts`, `api/`) and 2-ii (the other components), at about 500 comment lines (D7). Batch 2 now also writes index pointers, and 2-i adds the project sidebar's two §7.1 pointers to D4's board-drag-interaction table.
- **2026-09-29, end of batch 2 (Coder):** the Architect's handoff also takes false statements in a `CLAUDE.md` file, since A4 doesn't edit those (D1).
- **2026-09-30, batch 3 (Coder):** 3 split into 3-i (the position and hierarchy layer) and 3-ii (the rest of `server/src`), at about 805 comment lines and 111 hits (D7). D4's tables for the other three pages come at the end of 3-ii.
- **2026-09-30, end of batch 3 (Coder):** the running pointer list became D4's tables for the other three pages. boards-columns-unsorted has no numbered sections, so its table maps rules to sites without pointers, and the Acceptance line on index pointers holds for the other three pages only until that page is numbered. Completing item-positioning §4's row took one pointer in a client file from 1b-i, `placement.ts::regionWorkphaseFor`. "To the PO" gained entries for all three pages.
- **2026-09-30, batch 4a (Coder):** 4a split into 4a-i to 4a-iii (D7), at about 840 comment lines and 235 hits. D11's prefix-less tails at "`dragBands.test.ts` lines 101–102 and 360" are in the E2E spec `drag-column-bands.spec.ts`, so they move to 4b. D10's `popSession.test.ts` site was already cleared by A3.
- **2026-09-30, end of batch 4a (Coder):** "To the Test Reconciler" joins the Handoff, for test comments whose wiki pointer became a case ID the test's title doesn't carry. Where a title named a function that no longer exists by that name (`positionResolver.test.ts`'s `reindexScope` and `resolveAnchorPosition`), the title was corrected like a false comment; D8's comparison already allows title changes.
- **2026-09-30, batch 4b (Coder):** 4b split into 4b-i to 4b-iii (D7), at about 1,200 comment lines and 155 hits. D8's single E2E run becomes one per stop, since each stop is its own commit.
