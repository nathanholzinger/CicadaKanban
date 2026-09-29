# A3 — Test Plan Rules and Catalog Sweep

**Type:** tech-debt story · **Written:** 2026-09-26 by the Test Planner · **Approved to proceed:** Nathan, 2026-09-27 · **Sequenced:** after A1; each feature batch after A2's batch for its page

**Sources:**
- **The round table** at `docs/planning/round-tables/documentation-purposes-and-standards`. Tags like "TP F4" or "NZ11" point to items there.
- **A1's decisions** (`a1-documentation-standards.md`), cited as "A1 D3".

This plan is transient, so it may cite both. The README and persona text it produces are living, so they cite no round-table item, story or date.

## Goal

A3 does three things:
- **It settles the test-plan rules that A1 left to A3:**
  - the status vocabulary;
  - case IDs, and how tests carry them;
  - what the Reconciler may write;
  - what a test plan holds.
- **It sweeps the catalog, one feature at a time,** against the swept wiki. Every case ends up current, in the new format, and in one of three states:
  - backed by a test that carries its ID;
  - manual-only, by the Test Planner's judgment or Nathan's approval (D3);
  - routed by ID to a named story.
- **It closes the known coverage gap** in item-positioning (TP F11).

**Depends on:**
- **A1:** the checker, the standards guide and the story checklist exist.
- **A2:** a feature's pass starts only once A2 has swept that feature's wiki page (PO F8). Batches 1 and 2 don't wait for A2.

**Out of scope:**
- **Test comments.** They belong to A4. A3 edits test titles only.
- **Precise-move drag E2E tests.** Writing them stays with Epic 3.5 Story 10 (D10).
- **The wiki.** Gaps found during the sweep go to the PO as Pending PO questions (D1).
- **A catalog for `boards-columns-unsorted`** (D11).

## Decisions

These answer every question the work below depends on. Each one names the round-table items or A1 decisions it builds on. Two go beyond what the round table settled, and are flagged for Nathan:
- D4's switch to qualified IDs inside suite files;
- D8's INDEX files without counts.

### D1. Inputs, and where cases are written

*(TP F1, TP F2, NZ1, NZ3, NZ14, PO F2, PO F3)*

- **Rules come from the wiki.** By the time a story closes, everything a case asserts traces to a wiki section.
- **The story plan is an input for scope and for detail that is still settling.** The Test Planner reads it to decide which cases to add, change or delete.
- **The Test Planner reads no code, test code included, and writes no test code.** Developers write the tests (NZ3's "easy rule").
- **The case pins the assertion, not the test's author.** Each *Then* names concrete expected values, so the developer writing the test doesn't choose what to assert. The Reconciler's quality check confirms that the test asserts what the case says.
- **Cases go straight into the feature catalog** (PO F3). There is no story-side test plan; the story plan lists the IDs of the cases in its scope (A1 D10).
- **Thinking past the wiki is part of the job (NZ1).**
  - When the wiki is silent and the Test Planner infers a case, the case is written with status `Pending PO`.
  - Its question goes in the story plan's Open questions, and the PO answers it as PO F2 describes.
  - The Test Planner then keeps, edits or deletes the case. The Test Planner never edits the wiki to match a case.

### D2. Statuses

*(TP F4, NZ12, NZ13, A1 D6)*

Five statuses replace ⏳ / ✅ / ❌ / ⏸:

| Status | Means | Set by |
|---|---|---|
| `Planned` | The passage it derives from carries `**Planned:**`. It can't be built yet. | Test Planner |
| `Open` | The rule is live. The tests that carry its ID don't yet assert all of it, and it isn't `Manual`. | Test Planner: for a new case, from `Planned` or `Pending PO`, or from a `Manual` case whose reason no longer holds. Reconciler: from `Automated`, when the test is gone. |
| `Pending PO` | The case was inferred where the wiki is silent (D1). | Test Planner |
| `Automated` | The tests that carry the case's ID assert all of it, alone or together (D3, D5). | Reconciler |
| `Manual` | Checked by hand, for a present-tense reason (D3). | Test Planner, when the case can't be reduced to precise assertions. Reconciler, once Nathan approves a case that could be automated but isn't worth it. |

- **`Planned` follows the wiki marker, not the story.**
  - The marker sits on a passage, not a section, so a section can hold both `Planned` and live cases.
  - When the PO removes a marker at story close, the Test Planner moves that passage's cases to `Open`.
  - The Reconciler moves them to `Automated` once tests carry their IDs.
- **A `Planned` case that will replace a live one says so on its status line:** `Planned, replaces DRAG-3.4`. Both cases stay until the build lands; then the old case is deleted.
- **When behavior is removed, its case is deleted.** No tombstone, no "was" text (NZ12). D4 keeps the ID from being reused.
- **Each case has one status.** If part of a case can be automated and part can't, it becomes two cases.
- **A `Manual` reason is a present-tense condition,** for example "its pass depends on a tunable threshold". If the condition stops holding, the case goes back to `Open`.

### D3. Which tests count for a case, and which need approval

*(NZ4, `testing-strategy.md`, Nathan on the Test Planner's wiki README review)*

This follows the layer rule in `testing-strategy.md`: a rule a user or an API caller can see gets a test through that surface.

- **A test through a surface needs no approval.** That means:
  - a Playwright UI test (`tests/ui/`);
  - a Playwright API test (`tests/api/`);
  - a server route test (`server/tests/routes/`).
- **A test of internal code needs Nathan's approval.** This covers a test that calls a client module or a server `lib/` function directly.
  - The Reconciler proposes the mapping in its report, and writes the pointer only once Nathan approves.
  - A later run treats an existing internal pointer as approved.
- **Manual-only has two routes:**
  - **The Test Planner's call, made from the wiki when the case is written.**
    - Everything the wiki states as settled gets a case, feel included: "the drag reads as one continuous motion" is a case.
    - A case whose outcome can't be reduced to precise assertions is `Manual` from the start.
    - This also covers a case whose pass depends on a tunable drag threshold (`testing-strategy.md`, "What stays manual").
    - Where part of such a rule can be pinned, such as reaching the gesture or the write it makes, that part becomes its own case and can be automated.
  - **Nathan's call.** A case that could be automated but isn't worth it (too flaky, or too costly) becomes `Manual` only with Nathan's approval, one case at a time or for a named category. The Reconciler proposes it.
- **An approved category of internal test** (Nathan, batch 3 Stop 1): a drag clock's logic, tested in the pop state machine with the threshold as a parameter. A case about a clock's logic is therefore `Open`, not `Manual`. Only whether the tuned values feel right stays `Manual`.
- **A second approved category** (Nathan, batch 5 Stop 1): a client ordering or request rule whose only surface is a drag. It's tested in the pure modules `itemListOps.ts`, `itemWriteReconciliation.ts` and `dragRequest.ts`.

### D4. Case IDs

*(TP F5, TP F6, TP F9, NZ12, PO F7)*

- **Each case has one ID form, used everywhere, including in its own file.**
  - DRAG and ATT suites switch from in-file `TC-n` to their qualified IDs (`DRAG-5.5`), in headings and tables too.
  - Then a search for an ID finds the case itself, every test that carries it, and every cross-reference.
  - The item-positioning form `TC-<part>.<n>` (`TC-4.3`, `TC-5a.1`, `TC-X.2`) is already qualified, so it stays.
  - A new catalog picks a prefix of its own.
- **IDs are never reused.** Each suite's header carries a `**Next ID:**` line. The Test Planner numbers the next case from it and then advances it. Gaps in the numbering are expected.
- **A case that moves to another suite gets a new ID.**
  - This happens only in the end-of-epic pass (D9), or in a story that moves the wiki rules the case derives from, such as A5.
  - The epic's close-out doc, or the story's plan, gets an old → new list.
  - A developer re-titles the tests, and the Reconciler confirms.

**For Nathan:** switching to qualified IDs inside suite files is new here. It costs a one-time mechanical rename in batch 1. It's also what lets D7's `case-id` rule find cases by searching the catalog.

### D5. How tests and the plan point at each other

*(NZ11, TP F3, Coder F4, A1 D3)*

- **A test that covers a case starts its title with the case's qualified ID and a colon:** `'DRAG-6.6: a rejected move fails the write …'`.
  - With several IDs: `'DRAG-4.9, DRAG-4.10: …'`.
  - An ID on a `describe` covers every test inside it.
  - A case may have several tests.
- **The plan points at files, not at individual tests.**
  - A case's `**Automation test:**` line lists repo-relative file paths, and only the Reconciler writes it.
  - For a `Manual` case, the line reads `none — manual: <reason>`.
- **Direction.** The ID in the test title is the reference that matters. It runs from the side that changes more (tests) to the side that changes less (cases). The file pointer is a convenience, and can be dropped if the catalog ever leaves the repo.
- **Where the rule is written.** It lives in `docs/test-plans/README.md`. Root `CLAUDE.md` gets one guardrail line pointing there, and so does `coder.md`.
- **Deleting a test that carries an ID, or dropping the ID from its title, goes in the story's handoff.** The Coder doesn't edit the plan.

### D6. The Reconciler writes two fields

*(TP F3, Architect F3, NZ11)*

- **Where it may write in `docs/test-plans/`:**
  - each case's status: `Open` ↔ `Automated`, and `Manual` once Nathan approves it (D3). It leaves a `Manual` case set by the Test Planner alone, and reports it if a test starts carrying that case's ID;
  - each case's `**Automation test:**` line.

  Nothing else: no case text, no priorities, never `Planned` or `Pending PO`, and it never deletes a case.
- **Its report:** it writes the report to `docs/audits/` while the report is open. The report moves to `docs/archive/` with its story.
- **How it maps:**
  - First, it searches test titles for each case's ID.
  - For a case with no test carrying its ID, it *proposes* a mapping (which test gets which ID) and never writes one.
- **On every run, across the whole catalog:**
  - It moves any `Automated` case with no test carrying its ID back to `Open`. This is the check that would have caught TC-4.4.
  - It lists tests whose titles carry an ID the catalog doesn't have. The checker catches these too (D7).
- **Unchanged:** the test-quality check, duplication, uncatalogued tests, and candidate new cases.
- **Tools:** it gains Edit and Write. A tool list can't limit Edit to two fields, so the limit is written in its instructions. Its diffs are small enough to review (Architect F3).
- **After A3, it runs once per story** (A1 D9 step 5). A3's migration needs two runs per feature, because existing tests carry no IDs yet (Coder F4).

### D7. Checker additions

*(extends A1 D8)*

| Addition | What it does |
|---|---|
| Rule `case-id` | Flags an ID-shaped token that isn't a case in the catalog. It checks test titles, code comments and `docs/test-plans/**`. The catalog is the source of truth: the rule reads case headings (`## <ID> — …`) from the suite files, and takes the ID shapes from their prefixes. It catches a typo in a title, a test still carrying a deleted case's ID, and a cross-reference to a deleted case. |
| Flag `--rules <id>[,<id>]` | Limits a run to the named rules. This lets a batch check test titles before A4 has swept the comments beside them. |

**Details for the Coder:**
- **Suite files** are every `.md` under `docs/test-plans/` except `README.md` and the `INDEX.md` files. A case heading is a line `## <ID> — <title>`.
- **ID shapes today:** `DRAG-<n>.<n>`, `ATT-<n>.<n>`, and item-positioning's `TC-<part>.<n>`, where the part is digits with an optional lowercase letter (`5a`) or `X`. Take the prefixes from the headings rather than hard-coding them, so a new catalog's prefix works without a code change.
- **Not ID-shaped:** a bare `TC-n`, which is `bare-case-id`'s; an angle-bracket placeholder such as `<suite>.<n>`; and the tail of a range, such as the `4.11` in `DRAG-4.8–4.11`, which has no prefix. Anything inside a fenced block is skipped, as with every rule.
- **A suite's `**Next ID:**` line is exempt from the lookup,** because it names an ID that doesn't exist yet by design. The rule checks it the other way instead: its number must be higher than every case heading in the same suite. That makes D4's "never reused" partly mechanical.
- **`--rules`** takes rule IDs separated by commas, and an unknown ID is a usage error: exit 2, like a bad path. The ignore marker accepts `case-id`.
- **The expected result today:** `check:docs --rules case-id -- docs/test-plans` should report zero hits, since batch 1 left every reference pointing at a heading that exists. That's batch 1's deferred check. Test titles may already give hits; those belong to the feature batches, not batch 2.

**"An `Automated` case with no test" is not a lint rule.** The fix is a status change that only the Reconciler may make. A lint failure on it would block the Coder on a field they can't edit, so the Reconciler checks it instead (D6).

### D8. What a test plan holds

*(TP #3, TP F7, A1 D3, A1 D4)*

A1's history rule applies. That means no provenance, no "used to", no dates, no story or audit IDs, and no forward references. Here is what that means for a test plan.

**A suite file:**

```
# DRAG-5 — Stub → out: detach, depth overflow

**Next ID:** DRAG-5.13

<setup that several cases share, if any>

| ID | Case | Priority | Status |
|---|---|---|---|
| DRAG-5.1 | … | P0 | Open |

---

## DRAG-5.1 — <the rule, stated as behavior>

**Priority:** P0 · **Status:** Open · **Rule:** wiki board-drag-interaction §8

*Given* … *when* … *then* …

**Automation test:** `tests/ui/….spec.ts`
```

- **Each case names its wiki section** on its status line, in the `wiki <page> §N` form (A1 D3), with one entry per section. It names the most specific section that holds the rule: `§3.2`, not `§3`. The wiki's own in-page forms (a bare `§N`, or a relative link followed by `§N`; A2 D9) don't apply in test plans. A2 left that call to A3.
  - When the PO's handoff says a section changed, a search finds every case derived from it.
  - A `Pending PO` case has no `**Rule:**` field. That absence is its marker.
- **A title states the rule, never the bug.** A regression case may say which mistake it guards against, in the present tense ("… so hovering over a covered member never snaps it to the entry workphase"). It doesn't say where or when the mistake was found.
- **No build status** in suite headers or INDEX files. The statuses carry it (D2).
- **No restating the wiki's model.** A preamble holds only what cases need and the wiki doesn't give, such as a shared setup ("the tree of DRAG-4.8"). A value the wiki names, whether a tunable (`popDelayMs`) or a limit (`CAP`), goes by its name, never as a literal.
- **A `Manual` case is still as specific as its rule allows.** Its *Then* says what the person checking looks for, so two people checking it would judge the same thing.

**An INDEX file** holds two things:
- the wiki page's name;
- the list of suites, with one line on what each covers.

It leaves out three things:
- **Counts.** Two roles now write statuses, so a hand-kept total would drift with every edit. The Reconciler's report prints the totals on each run.
- **Open-question or "flagged for the PO" lists.** Open questions go in the story plan (D1). Resolved ones are deleted.
- **A "not catalogued" list.** Everything the wiki states as settled gets a case (D3). The wiki's open questions get none, and the wiki already marks them.

**The README** holds everything above, plus:
- how feel, and rules that depend on a tunable value, become cases, and when those cases are `Manual` (D3). The wiki README leaves this to the test-plans README;
- the one standing exclusion: no case differs from another only in being made through an MCP tool, since a rule the wiki states once holds on every surface;
- the priorities;
- **when a test for a case fails:**
  - if the case misread a clear page, the Test Planner fixes the case;
  - otherwise the PO rules on whether the wiki or the code is wrong (PO #9).

### D9. The Test Planner in the story and epic flow

*(A1 D9, A1 D10, NZ4, TP F6, PO F6)*

- **Story planning.** For each Planned passage the story builds, the Test Planner writes or updates its `Planned` cases, and lists their IDs in the story plan's Scope.
- **Story close, step 3.** The Test Planner applies the living-docs handoff:
  - `Planned` → `Open` for passages whose markers came off;
  - cases revised for changed rules, or deleted for removed ones;
  - `Pending PO` cases resolved from the PO's rulings.
- **A rule change outside a story.** The PO's report names the sections it touched, and the Test Planner updates the cases derived from them.
- **Sign-off conditions**, in D2's vocabulary. These replace A1 D9's wording:
  - **Every case in the story's Scope is `Automated` or `Manual`,** or is listed by ID in a later story's Scope. A routing counts only once the destination names it, as with audit deferrals (A1 D11).
  - **No case in the story's Scope is `Pending PO`.**
  - **Every `Open` case in the catalog is listed in some story's Scope.** This catches coverage that a story's refactor broke outside its own Scope.
- **A tech-debt story that deleted, moved or split test files** runs the Reconciler's catalog-wide check before it closes, and the last condition above applies to it. Refactor stories are where coverage gets lost: TC-4.4 lost its test in one.
- **Epic close: the end-of-epic pass (NZ4).**
  - The Test Planner re-reads each feature the epic touched against the finished wiki, and adds, revises or deletes cases.
  - Suites may be regrouped (D4's ID rule applies).
  - Then the Reconciler runs once.
  - The epic signs off on the same conditions as a story, applied to the whole catalog.

### D10. What A3 closes, and what it routes to Story 10

*(TP F11; Epic 3.5 roadmap, Story 10)*

Story 10's roadmap entry already owns two items:
- a Reconciler pass over DRAG and ATT (its item 1);
- the `GHOST_H` parameter drift in the drag INDEX (its item 5).

It defers only drag automation that depends on precise cursor placement or timer margins. API tests, pure-function unit tests, and classification/overlay assertions keep landing with their stories. A3 draws the same line:
- **A3 takes the catalog side of items 1 and 5.** Every DRAG and ATT case is swept, mapped against existing tests, and stamped with its ID.
- **A3 closes every gap whose test doesn't depend on precise cursor placement or timer margins.** That includes TC-4.2–4.5.
- **A3 routes the rest to Story 10, by ID.** These are gaps that need a precise-move or timer-dependent drag E2E. Story 10's entry names them before the batch signs off.
- **Nathan may route an oversized set of gaps** to its own named tech-debt story instead. The same naming rule applies.

### D11. `boards-columns-unsorted` gets no catalog in A3

- **The situation:** the wiki page is a TODO capture, not hardened rules, and the feature has no catalog.
- **The rule:** the Test Planner doesn't derive cases from an unhardened page (the persona's "stop and flag").
- **So:** A3 has no batch for it. A2 brings the page to the standard without writing it out, and hands Nathan a follow-up story to write it out in full and give it a test plan (A2 Handoff). That story owns the catalog.

### D12. Changes to personas, agents and guides

*(TP F1–F3, A1 D2, A1 D12)*

The Test Planner drafts these, and the Architect applies them (A1 D2).

**`test-planner.md`:**
- inputs: the wiki for rules and the story plan for scope (D1). Still no code;
- an inferred case becomes `Pending PO`, with a question in the story plan (D1);
- the Test Planner writes `Planned`, `Open` and `Pending PO`, plus `Manual` for a case that can't be reduced to precise assertions. It never writes `Automated` (D2, D3);
- feel is catalogued: the Test Planner judges which cases can be pinned to precise assertions (D3);
- touchpoints: story planning, story close, epic close, and a rule change outside a story (D9);
- point to `docs/test-plans/README.md` instead of restating its conventions;
- drop "every case starts life as ⏳ pending triage", and drop the INDEX counts.

**`test-reconciler.md`:**
- all of D6;
- four new report sections:
  - *Proposed stamps*;
  - *Proposed internal mappings (need approval)*;
  - *Proposed Manual (needs approval)*;
  - *Unbacked → Open*.

**The standards guide** (A1 D2, A1 D8):
- **The test-plan row:** "Owner: Test Planner. The Reconciler writes each case's status and Automation test line. Other roles hand changes off."
- **The checker list** gains `case-id`: "case IDs that don't match a case in the catalog."
- **The reference rule stays as A1 wrote it.** It defers to `docs/test-plans/README.md` for how a case and its tests point at each other, so the rule lives in one place.

**`story-done-checklist.md` and `epic-done-checklist.md`:** A1 already landed the structure of D9: step 3's pass, step 5's catalog-wide check, the lost-coverage condition, the tech-debt check, and the epic's exceptions for Planned and routed cases. What's left for A3 is restating their test conditions in D2's vocabulary.

**`testing-strategy.md`, "What stays manual":** "Anything else manual is approved case by case" becomes "decided case by case in the test-plan catalog", since the Test Planner makes some of those calls (D3).

**`coder.md` and root `CLAUDE.md`:** one line each. A test that covers a test-plan case starts its title with the case's qualified ID; see `docs/test-plans/README.md`.

## Work, in batches

Each batch ends with its checks, then stops for Nathan's review and commit. Feature batches stop twice.

**Order:**
- **Batches 1 and 2** run together, alongside A2.
- **Batches 3–5 follow, one feature each.** Each starts once A2 has swept that feature's page. A feature's Test Planner pass can overlap the previous feature's Coder step, since they touch different files.
- **Batch 6** closes out.

### Batch 1: the rules (Test Planner; the Architect applies `.claude/`)

**Work:**
- **Rewrite `docs/test-plans/README.md`** per D1–D9.
- **Rename the IDs.** Rename every DRAG and ATT case to its qualified ID inside its own file, and add each suite's `**Next ID:**` line (D4). This is a mechanical rename only: no case content changes. It comes first so that `case-id` can resolve every cross-reference from the start.
- **Draft D12's changes** for the Architect.

**Check:**
- `check:docs --rules case-id -- docs/test-plans` reports zero hits;
- `check:docs -- docs/test-plans/README.md .claude` reports zero hits;
- Nathan approves.

### Batch 2: the checker additions (Coder)

**Work:** add D7's `case-id` rule and `--rules` flag.

**Check:**
- `case-id`'s tests use fixtures and cover a hit, a clean case and an ignored case;
- `--rules` is tested.

### Batches 3–5: one feature each

Every feature follows the same steps.

1. **The Test Planner's pass.**
   - Re-derive the cases from the whole swept wiki page: add, revise and delete. A2's handoff for the page is where to start, not the whole diff. It lists what the sweep changed, and the catalogs predate earlier rule changes too.
   - Write each case's `**Rule:**` field against the new anchors in A2's anchor-changes table (the archived A2 plan, Handoff), which is repeated below. The checker can't catch an old anchor, because every old section still exists; the Test Planner checks each moved rule by hand.

     | Page | Rule | Was cited as | Now | Batch |
     |---|---|---|---|---|
     | board-drag-interaction | Which Card is zoomed into: dwell, cue, resets, invalid targets | §6 | §6.1 | 3 |
     | item-positioning | The scope-change reassignment table | §2 | §2.1 | 5 |
     | item-positioning | Reindexing must be disclosed to the caller | §5 | §5.1 | 5 |
     | item-positioning | The no-anchor move that keeps its position | "§2 addendum" | "§2's workphase-only rule" (still §2) | 5 |
   - Apply D8's layout, and set `Planned`, `Open` or `Pending PO`.
   - Delete superseded cases.
   - Leave the status and pointer lines of `✅` cases for the Reconciler, which rewrites both in step 4.
2. **A proposing Reconciler run.** This run writes only its report, which:
   - maps every case that isn't `Planned` or `Pending PO`;
   - proposes stamps, internal mappings and `Manual`;
   - lists the gaps and the unbacked `✅` cases.

   → **Stop 1.**
   - Nathan reviews the Test Planner's pass.
   - He approves internal mappings, and any `Manual` the Reconciler proposes (D3). The Test Planner's own `Manual` calls are part of the pass he reviews.
   - He rules on each gap: close it in A3, or route it (D10).
   - `Pending PO` questions go to the PO.
3. **The Coder.**
   - Stamps IDs into test titles, qualifying any bare `TC-n`.
   - Strips provenance from every title it touches.
   - Writes the tests for the gaps closed in A3.
4. **A confirming Reconciler run.** It writes the two fields.
5. **Checks,** listed below.

   → **Stop 2:** review and commit.

**Checks for a feature:**
- `check:docs -- docs/test-plans/<feature>` reports zero hits.
- `check:docs --rules case-id,bare-case-id -- <test files this batch touched>` reports zero hits.
- Every case has one of D2's statuses, and every case except `Pending PO` names its wiki section.
- Every `Open` case is named by ID in Story 10's roadmap entry or in another named destination.
- `npm run test:unit` passes, and `npm run test:e2e` passes if a spec changed.

**Work each feature needs beyond the standard steps:**

- **Batch 3, `board-drag-interaction`** (82 active cases, 7 superseded):
  - Story 10 item 5's parameter drift;
  - the threshold-timed cases (part of DRAG-1.3; DRAG-1.11, 1.14, 1.18, 1.19 and 5.11): set `Manual` in step 1 (D3), with any reachable part or write split into its own case;
  - the feel behaviors the old INDEX left uncatalogued (the tilt, the pop-snap tween, the locked-layer outline, and others): each settled one the swept wiki states gets a case, most of them `Manual`;
  - remove the INDEX's model preamble, its "no cases for" list, and its list of flags for the PO;
  - cases on which Card a drag zooms into (the dwell, the cue, the resets, the invalid targets) cite §6.1, not §6. That's mostly DRAG-1's zoom-in cases, DRAG-2's invalid targets and DRAG-4's Card-layer cases. §6 keeps only the auto-drop and the pinned ghost.
- **Batch 4, `item-attachment`** (38 cases):
  - derive cases for the six rules the INDEX lists as settled but still without a case;
  - fix ATT-3's stale scope note;
  - reduce ATT-7.6's pointer to a file-level one.
- **Batch 5, `item-positioning`** (87 active cases, 3 superseded):
  - TP F11: re-map TC-4.2–4.5; TC-4.4 gets a test or a routing, and its wording follows §4's "the column's entry workphase";
  - cases on the scope-change table and on the `reindexed` disclosure cite the new §2.1 and §5.1, not §2 and §5;
  - "the §2 addendum" becomes "§2's workphase-only rule", still cited as §2, in part 2's and part 7's text;
  - part 5a: the Architect kept §5a's steps in the wiki, so each step stays a rule and keeps a case. A step that only a test of client code can prove goes to Nathan for approval (D3). Whether step 4 stays is on Nathan's list; the pass follows the page as it stands then;
  - part 7's middle-band cases follow §7.5, which now defers to board-drag §5's bands;
  - re-verify TC-2.5 and TC-2.11 against their corrected text;
  - reduce the 54 pointers that name individual tests to file-level ones;
  - remove the "previous mapping" notes;
  - retitle TC-4.3, whose title names a bug.

### Batch 6: close-out

**Work:** one Reconciler run over the whole catalog, which covers:
- the catalog-wide unbacked and unknown-ID checks;
- uncatalogued tests;
- candidate new cases.

What it finds is resolved in this batch.

**Check:** A3's Acceptance, below.

## Code map

| File | Batch | Change | Who |
|---|---|---|---|
| `docs/test-plans/README.md` | 1 | rewritten | Test Planner |
| `docs/test-plans/{board-drag-interaction,item-attachment}/**` | 1 | IDs renamed, Next ID lines added | Test Planner |
| `.claude/personas/test-planner.md`, `.claude/agents/test-reconciler.md` | 1 | D12 | Test Planner drafts, Architect applies |
| `.claude/guides/documentation-standards.md`, `story-done-checklist.md`, `epic-done-checklist.md`, `testing-strategy.md` | 1 | D12 | Test Planner drafts, Architect applies |
| `.claude/personas/coder.md`, root `CLAUDE.md` | 1 | one line each (D5) | Architect |
| `scripts/check-docs/**` | 2 | `case-id`, `--rules` | Coder |
| `docs/test-plans/<feature>/**` | 3–5 | swept | Test Planner; the Reconciler writes the two fields |
| Test files the Reconciler maps | 3–6 | titles stamped; provenance stripped from touched titles | Coder |
| New tests for gaps closed in A3 | 3–6 | new | Coder |
| `docs/audits/test-reconciliation-a3-<feature>.md`, `…-a3-close.md` | 3–6 | new reports | Reconciler |

## Acceptance

- **The rules:**
  - the README is rewritten;
  - D12's changes are applied;
  - Nathan has approved both.
- **The checker:** `case-id` and `--rules` exist and are tested.
- **The catalog:**
  - `check:docs -- docs/test-plans` reports zero hits;
  - no ⏳, ✅, ❌ or ⏸ remains, and no case is `Pending PO` unless A5 names it by ID. Nathan made A5 the home for the rulings deferred at batch 4's Stop 1;
  - batch 6's run confirms that every `Automated` case has at least one test carrying its ID;
  - every `Open` case is named by ID in Story 10's roadmap entry or in another named destination;
  - TC-4.4's snapping rule (wiki item-positioning §4) is `Automated`. Batch 5 found DRAG-3.6 and 3.8 assert it, and deleted TC-4.2–4.5 as restatements;
  - no `**Rule:**` field cites the old anchor of a moved rule. This is checked by review against the anchor table in the feature batches, since the checker can't see it.
- **The tests:**
  - `check:docs --rules case-id,bare-case-id -- tests server/tests client/src` reports zero hits;
  - the unit and E2E suites pass.
- **No four-pass audit** (A1 D10). A3 adds tests and edits titles, but restructures no code. The new tests fall inside Story 7's audit range (Auditor F8).

## Handoff

- **To the Architect:** everything owed through batch 4 is applied (checked 2026-09-28).
  - **Story 10's roadmap entry:** item 1 names every case A3 has routed there: 66 from board-drag-interaction and ATT-4.9. It points at both reports' Gaps and "Confirming run" sections. Items 2 and 4 use qualified IDs. **Still owed, from batch 5's confirming run:** item 1's item-positioning placeholder ("added when A3's batch 5 routes its gaps") becomes "**item-positioning:** none. A3 batch 5 closed every gap in A3. TC-5.15 is routed to Epic 4 (`epic-4-decisions.md` §12), and TC-2.32, 6.10 and 7.18 to A5."
  - **`docs/planning/epic-4-decisions.md`:** *applied 2026-09-29;* §12 names TC-5.15 by ID, beside the done-column items. The magnitude threshold's `n` counts done items today, though they're outside the scope (wiki item-positioning §5, §2). Nathan deferred the fix to Epic 4's done-column rework (A3's Open question 18). The routing counts once that doc names the case (D9).
  - **`.claude/agents/test-reconciler.md`, "How You Map":** the many-to-many bullet (Amendments, "2026-09-28, many-to-many coverage").
  - **`.claude/guides/testing-strategy.md`, "What stays manual":** the approved clock-logic category.
- **To the PO:** the drag INDEX's flag 14 lists edits owed to the "Placement rules for a Hierarchy" design doc. It goes when the flag list is removed. The design doc is transient, and wiki §7 already carries the agreed wording. Please confirm nothing is lost.
- **To A4 (the Coder):** test comments in the files A3 touched are still A4's, except for their case IDs. A3's Coder qualifies bare `TC-n` and re-points IDs of deleted cases in the comments of every file it touches (Nathan, batch 3 Stop 1).
  - **Stale section references in code comments,** from batch 5's report: "the §2 addendum" near `items.ts::crossWorkflowMoveError`, in `itemHierarchy.ts::applyHierarchyRequest` and in `itemListOps.ts::workphaseOnlySlot`, and the disclosure cited as §5 rather than §5.1. A2's anchor table gives the new names.
- **To A5:**
  - **DRAG-4.26, 4.28 and 4.31** are routed there by ID (A5's D1). All three are the project sidebar's, and move with its rules.
  - **Eight `Pending PO` item-attachment cases**, from batch 4's Stop 1 (A5's D2): ATT-1.8, 1.10, 1.13, 3.11, 4.12, 4.13, 5.7 and 5.8. When A5 lands their wiki changes, the Test Planner resolves them: each is kept, changed or deleted. A5's D2 also lists, by title, the tests to check each answer against.
  - **Three `Pending PO` item-positioning cases**, from batch 5's Stop 1 (A5's D2): TC-2.32, 6.10 and 7.18. The Test Planner resolves them the same way.
- **To every later story:** the flow is D9's, with one Reconciler run at close.

## Drafts for the Architect (batch 1)

D12's changes, for the Architect to apply once Nathan approves. The two full replacements come first, then the line changes. Each one points to `docs/test-plans/README.md` rather than restating it.

### `.claude/personas/test-planner.md`: full replacement

```markdown
# Persona: Test Planner

You are working on **Cicada Kanban** — a personal single-user Kanban app with Claude
agent integration. Your role in this session is **Test Planner**: you own the
test-plan catalog in `docs/test-plans/`, and you write each feature's cases from
the wiki's business rules — never from code.

## Where Cases Come From

- **The wiki is the source of rules.** `docs/wiki/<feature>/` holds the settled
  rules. By the time a story closes, everything a case asserts traces to a wiki
  section. Nothing in a page's Open questions gets a case.
- **The story plan gives scope, and detail that's still settling.** Read it to
  decide which cases to add, change or delete, and list the case IDs in its Scope.
- **Never read code, test code included, and never write test code.** A case
  derived from code only proves the code does what it does. Developers write the
  tests, and the Test Reconciler compares them with your cases.
- **Think past the wiki's edges.** Where two rules meet, or a user can do
  something the page doesn't cover, write the case anyway, with status
  `Pending PO`, and put the question in the story plan's Open questions for the
  PO (outside a story, in your report to Nathan). Never edit the wiki to match a
  case. Once the PO has written the answer in, keep, change or delete the case.

## Your Job

- For each rule: the golden path, what fails at the boundary, the state
  transitions (before → action → after), and where it meets other rules.
- Write each case as Given/When/Then, with concrete expected values in the
  *Then*, so whoever writes the test doesn't choose what to assert.
- Everything settled gets a case, feel included. Judge which cases can be pinned
  to precise assertions; a case that can't is `Manual` from the start.
- Give each case a priority (P0, P1 or P2) and a status: `Planned`, `Open`,
  `Pending PO` or `Manual`. `Automated` is the Reconciler's to set.
- Don't choose a test layer or name a test file. That takes knowledge of the
  code you deliberately don't have.

`docs/test-plans/README.md` holds the catalog's conventions: layout, case IDs,
statuses, which tests count, and how tests and cases point at each other. Follow
it rather than a copy here. `.claude/guides/documentation-standards.md` holds the
rules every doc follows: ownership, which way references point, no provenance.

## When You Work

- **Story planning:** write or update the `Planned` cases for each Planned
  passage the story builds, and list their IDs in the plan's Scope.
- **Story close:** step 3 of `.claude/guides/story-done-checklist.md`. Apply the
  handoff wherever it lands, resolve `Pending PO` cases, and add any new or
  reopened case to the Scope.
- **A rule change outside a story:** update the cases derived from the sections
  the PO's report names.
- **Epic close:** the end-of-epic pass in `.claude/guides/epic-done-checklist.md`.

## Questions You Always Ask

1. **What's the golden path?** The most common successful use, per the wiki.
2. **What fails at the boundary?** What the wiki names as invalid, refused or
   degenerate, and what happens when it's tried.
3. **What are the state transitions?** Before → action → after, as the wiki
   states them.
4. **Where does this rule meet another?** The combinations are where the cases
   the wiki didn't spell out come from, and where `Pending PO` questions start.
5. **Can this be pinned to precise assertions?** If not, the case is `Manual`,
   and its *Then* still says what the person checking looks for.

## Relationship to Other Personas

- **Product Owner** — owns the wiki you read, and answers your `Pending PO`
  questions. A case that misread a clear page is yours to fix; a disagreement
  between the wiki and the code is a ruling the PO takes to Nathan.
- **Test Reconciler** — an agent that compares your cases with the automated
  tests. It writes two fields on each case, its status and its Automation test
  line, and nothing else. You never do that comparison, and you never read the
  code it reads.
- **Architect / Coder** — implement against the same wiki, and write the tests.
  A test that covers a case carries the case's ID in its title. They don't edit
  the test plans: a change they need there reaches you in the story's handoff.
```

### `.claude/agents/test-reconciler.md`: full replacement

````markdown
---
name: test-reconciler
description: Cross-references the test-plan catalog with the automated tests — mapping cases to tests by the case IDs in test titles, flagging gaps and lost coverage, and checking whether tests assert the business rule or just restate the code. Writes each case's status and Automation test line, and a report; decides nothing else.
tools: Read, Grep, Glob, Edit, Write
model: opus
---

# Test Reconciler

You are working on **Cicada Kanban**. Your job is to reconcile the test-plan
catalog (`docs/test-plans/`) with the automated tests (Vitest under
`server/tests/` and `client/src/**/*.test.ts(x)`, Playwright under `tests/`).
`docs/test-plans/README.md` holds the catalog's conventions, and
`.claude/guides/documentation-standards.md` the rules every doc follows.

## What You May Write

- **Two fields on each case, and nothing else in `docs/test-plans/`:**
  - its status: `Open` ↔ `Automated`, and `Manual` only once Nathan has
    approved it;
  - its `**Automation test:**` line: repo-relative file paths, or
    `none — manual: <reason>` for a `Manual` case you set.
- **Your report,** in `docs/audits/`.

Never write a case's text, title or priority. Never set `Planned` or
`Pending PO`, never delete a case, and leave a `Manual` case the Test Planner
set alone. Never edit the wiki or a test file. Your tools allow more than this;
these limits are the rule.

When you're asked for a proposing run, write only the report.

## How You Map

- **By ID first.** A test that covers a case starts its title with the case's
  ID, and an ID on a `describe` covers every test inside it. Search the test
  titles for each case's ID.
- **A case with no test carrying its ID:** look for a test that covers it
  anyway. If you find one, propose it in the report (which test gets which ID).
  Never write that mapping: a developer adds the ID, and a later run confirms it.
- **Which tests count** (`docs/test-plans/README.md`): a Playwright UI or API
  test, or a server route test, counts as it is. A test that calls client or
  server internals directly counts only once Nathan approves it: propose it, and
  write it after approval. An existing internal pointer is already approved.
- **Check that each mapped test asserts the case's *Then*,** not just the code's
  current output (Test Quality, below).

## On Every Run, Across the Whole Catalog

- **Lost coverage:** an `Automated` case with no test carrying its ID goes back
  to `Open`. List each one: a story can delete the only test for a case it never
  scoped.
- **Unknown IDs:** list every test whose title carries an ID the catalog doesn't
  have.
- **A `Manual` case the Test Planner set,** whose ID a test now carries: report
  it.

## What You Look For

**Gaps:** an `Open` case with no test. If it looks genuinely hard to automate,
say why and propose `Manual`; whether it becomes `Manual` is Nathan's call.

**Duplication (report, don't judge):** several tests, especially across layers,
covering the same case. This is often fine and intentional; report it anyway.

**Test quality:** for each mapped test, check whether it asserts the *business
rule* (per the wiki and the case's *Then*) or just restates what the code
happens to do — e.g. a test that hardcodes today's output as the expected value
without grounding it in the rule. Flag tautological tests, with a pointer to
the rule they should verify.

**Uncatalogued tests:** keep two kinds apart.
- Tests that exist for the coverage gate and don't correspond to a standalone
  business rule: list them, and don't force a mapping.
- Tests that exercise a genuine scenario the catalog missed: **candidate new
  cases**. Don't add them yourself. Note whether the rule is already in the wiki
  (a Test Planner gap) or isn't documented anywhere (a Product Owner gap).

## Known Non-Priorities

- **MCP tools** (`server/src/mcp.ts`) — don't flag missing MCP tool coverage as
  a gap. A case that differs from another only in being made through an MCP tool
  is a candidate for removal from the catalog.

## Output

Write one report, with these sections: Coverage Mapping, Lost Coverage, Unknown
IDs, Proposed Stamps, Proposed Internal Mappings (need approval), Proposed Manual
(need approval), Gaps, Duplication, Test Quality Concerns, Uncatalogued Tests,
Candidate New Cases, and Totals (cases per status and priority). Be specific:
case ID, test file path and test title for every mapping or gap named.
````

### Line changes

**`.claude/guides/documentation-standards.md`**, the ownership table's test-plan row:

```markdown
| `docs/test-plans/**` | living | Test Planner | The Test Reconciler writes each case's status and Automation test line. Everyone else hands changes off to the Test Planner |
```

When batch 2 lands, "What the checker checks" gains a bullet: "test-plan case IDs that don't match a case in the catalog."

**`.claude/guides/story-done-checklist.md`:**
- **Step 4,** second bullet: "tests for the cases in Scope that are still `Open`, each starting its title with the case's ID (`docs/test-plans/README.md`)."
- **Before sign-off,** three bullets:
  - "Every test-plan case in the story's Scope is `Automated` or `Manual`, or has been routed by ID to a later story whose plan or roadmap entry names it."
  - "Every case the Reconciler moved from `Automated` to `Open` has its test again, or is routed the same way."
  - "No Open question is still waiting on the PO, so no case in the Scope is `Pending PO`."

**`.claude/guides/epic-done-checklist.md`**, the Tests section's fourth item:

```markdown
- [ ] Every test-plan case in the features the epic touched is `Automated` or `Manual`, except `Planned` cases, and `Open` cases routed by ID to a later story whose plan or roadmap entry names them. None is `Pending PO`.
```

**`.claude/guides/testing-strategy.md`**, "What stays manual": "**Anything else manual** is decided case by case in the test-plan catalog (`docs/test-plans/README.md`)."

**`.claude/personas/coder.md`**, "Stack Context", after the testing-layers bullet:

```markdown
- **Tests for a test-plan case:** start the test's title with the case's ID
  (`docs/test-plans/README.md`). Deleting such a test, or dropping the ID from its
  title, goes in the story's handoff.
```

**Root `CLAUDE.md`**, "Conventions & Guardrails", after the two test bullets:

```markdown
- **A test that covers a test-plan case starts its title with the case's ID**
  (`DRAG-5.5: …`) — see `docs/test-plans/README.md`.
```

## Open questions

`Pending PO` questions raised during the passes are listed here, and are answered before A3 closes.

**For the PO, from batch 3 (board-drag-interaction).** Nathan answered all three on 2026-09-27. The wiki changes have landed, and the cases follow them (Amendments, 2026-09-28).

1. **DRAG-3.24, a card moved within its own done column.** A Free done item has no position, so the ghost can't name a neighbor as an anchor (wiki item-positioning §7.4), and a drop into a done column is a workphase change, which here is no change. Does the ghost stay at the card's own completion slot while the cursor moves, and does the release write nothing?
   - **Nathan:** the release writes nothing. This may change when Epic 4 reworks the done column.
   - **To the PO:**
     - Add the rule to the wiki, in board-drag §5's done region or item-positioning §7.4, whichever you prefer.
     - Settle the other half of the question: where the ghost sits while the cursor moves. The Test Planner suggests it stays at the card's own slot, since a release lands where the ghost is (board-drag §2).
     - The Epic 4 caveat goes in `docs/planning/epic-4-decisions.md`, not in the wiki or the case, since neither carries forward references.
   - **Then:** DRAG-3.24 → `Open`, with the new section as its Rule.
   - **Done (PO):** wiki board-drag-interaction §2, rule 6 holds the ruling and the ghost's place. The ghost stays in the card's own slot (a deduction; see Amendments). The Epic 4 caveat is `epic-4-decisions.md` §12. DRAG-3.24's Rule is §2.
   - **A new question: how a Card in a done column is zoomed into.** §6.1 zooms into a neighbor of the ghost, and a done list's ghost doesn't move. **Nathan deferred it to Epic 4's done-column rework** (2026-09-28). The wiki carries it under Open questions, and `epic-4-decisions.md` §12 has it with the PO's recommendation. It doesn't block A3.
2. **DRAG-4.27, the partial-hierarchy rule (board-drag §7.2).** "Without full context, only anchor and side against a visible item are offered." Board §9 leaves open whether the board ever shows a partial hierarchy. Does any surface show one today, such as a collapsed branch in the project sidebar? If none does, the case has no scenario yet.
   - **Nathan:**
     - The project sidebar assumes full context when it reorders projects, and it has it: under a collapsed project it reads the real tree, not the rendered rows.
     - Cards on a Board should never assume full context. They might have it by chance, but the board doesn't know that.
     - Stubs within a Card might know they have full context.
     - This is flagged as a question to think through. If a Card's descendants can't be trusted to be complete, §7.1's depth walk isn't safe there, and Stub re-positioning may need rework.
   - **To the PO:**
     - Carry the question in the wiki's Open questions. Its Depth overflow entry already assumes the board shows a Card's hierarchy with full context "until decided", so the two may be one entry.
     - Then decide how §7.2's partial-context passage stands meanwhile. If it moves into Open questions, DRAG-4.27 is deleted and rewritten from the answer, since no case derives from that section. If it's marked `**Planned:**`, DRAG-4.27 becomes `Planned`.
     - Either way, A3 can close. A rework of Stub re-positioning would be its own story.
   - **Done (PO):** §7.2's partial-context passage moved into Open questions. It's merged with depth overflow as one entry, "Whether a Card shows its whole hierarchy". No case derives from it, so DRAG-4.27 is deleted. Nathan's sidebar answer is now a rule in §7.1: the sidebar always has full context, and places against the real tree under a collapsed project.
3. **DRAG-4.28, the sidebar's root (board-drag §7.1).** The page says the range is floored at the root, "the project in the sidebar", and that an empty hierarchy offers one state, the root's sole child. Which level of the sidebar's tree is that root, and when is the sidebar's hierarchy empty?
   - **Nathan:** the case is about moving projects in the project sidebar. It seems misplaced in DRAG-4, because neither the wiki nor the test plans have a place for the sidebar.
   - **What the case tests.** §7.1's two boundaries, in the sidebar:
     - no project can be tabbed shallower than the top level;
     - with nothing else to place against, there is exactly one drop state.
   - **Terms.** The sidebar's root is the top level, meaning projects with no parent, not "the project". The client agrees: its placement is rooted at a virtual `null` parent. The hierarchy is empty when the dragged project's subtree holds every project, as in a sidebar with one top-level project.
   - **To the PO:**
     - Fix §7.1's "the project in the sidebar". DRAG-4.28 then → `Open`.
     - On Nathan's placement point: test plans follow the wiki's layout, so a sidebar suite starts with a wiki home for the sidebar. That could be its own page, or the shared placement rule on a page that both the board and the sidebar cite.
     - The sidebar already has behavior no page states. For example, a collapsed project opens when a project is dropped into it.
     - The move belongs to A5 (`a5-wiki-and-test-plan-heirarchy-updates.md`, its D1), not A3, since A3 sweeps the pages as they stand. When A5 moves the sidebar's rules, DRAG-4.26 and DRAG-4.28 move to the matching suite with new IDs, and their DRAG IDs retire.
   - **Done (PO):**
     - §7.1's "The root, per context" now names the sidebar's root: the top of the tree, whose children are the top-level projects.
     - The empty-hierarchy boundary says when the sidebar's hierarchy is empty.
     - "Below the last item" now starts from "the root's own children". "The root's depth" would have allowed tabbing out of `P`.
     - DRAG-4.28 → `Open`.

**For the PO, from batch 3's proposing Reconciler run.** All five are answered: question 5 by deduction, and questions 4, 6, 7 and 8 by Nathan, who took the PO's recommendations on 2026-09-28.

4. **DRAG-1.33, a Card's hand-set display during a drag.** The page doesn't say whether a drag may reset a Card's collapsed or expanded list of Stubs. A client test guards that a drag's layer changes keep every Card mounted. Is keeping the display a rule, or only a regression guard?
   - **Nathan: yes, a rule, and a Card attached into stays open.** It's in wiki board-drag-interaction §1.1:
     - a drag leaves every Card's list of Stubs as the user set it, through every layer change and after the release;
     - the carried Card's own Stubs aren't shown while it's dragged (§5a), and its list is back as set after the release;
     - a Card the drag zooms into opens. It goes back to how the user set it if the drag leaves again, and stays open if the item is attached into it.
   - DRAG-1.33 → `Open`, Rule §1.1.
5. **DRAG-4.29, a Stub set back down in its own gap and depth.** In a column, a set-down in the card's own slot saves the named anchor, because unseen items can sit between the neighbors (board-drag §2, rule 5). Does that hold inside a Card's descendants section, or does the release write nothing? This turns on question 2's full-context answer.
   - **Answered (PO deduction): the release writes nothing.** §7.1 now says so, with the reason. §2 rule 5 saves the anchor in a column only because unseen items can sit between the neighbors, and with full context none can. It's stated for any item, since §7 is one ruleset for the board and the sidebar.
   - If question 2's "whole hierarchy" entry goes the other way, this rule changes; the wiki's Open questions entry names it.
   - DRAG-4.29 → `Open`, Rule §7.1.
6. **DRAG-4.30, where the ghost starts on a zoom into Descendants.** §7 doesn't say which gap and depth the ghost starts in. The client starts it at the section's last gap, at the last row's depth, which matches the Card layer's last-child auto-drop. Is that the rule?
   - **Nathan: zooming in doesn't move the ghost.** It's in wiki board-drag-interaction §7, before §7.1. The ghost starts where the Card layer showed it: in the last gap, as `P`'s last child, for an item from outside; in its own slot, for `P`'s own Stub coming back in.
   - The two readings differ when the section's last row is nested. There, the report's tests pin the last row's depth, which makes `X` that row's next sibling instead of `P`'s last child.
   - DRAG-4.30 → `Open`, Rule §7. A case with a nested last row would pin the difference.
7. **DRAG-2.8's Inert.** §4 lists the Inert targets: the Unsorted bucket, a broken column, and an expanded column's outer wrapper. The Reconciler found the state declared in the client, but nothing that assigns it. Is Inert still a classification the board shows? If so, a failing test is a code fix. If not, §4 changes and so does the case.
   - **Nathan: Inert is dropped.** §4 now has three states. The three places are nowhere and aren't classified (§1, §3.1): no drag enters them, and a release there writes nothing.
   - "A Stub drag is classified exactly like a Card drag" stays in §4, as its own line.
   - DRAG-2.8 keeps its Stub-drag half.
   - Per the report, the client declares an `'inert'` state that nothing assigns. What happens to it is the Coder's call.
8. **DRAG-3.20's band tint.** §5 says the hovered band is tinted at Board layer. A comment in the band spec calls the tinted highlight retired, replaced by the live ghost. Is the tint current?
   - **Nathan: the tint is out of §5's body.** The band table's rows no longer tint, and the guides paragraph says the ghost shows which band a release resolves by.
   - Whether the band under the cursor gets a highlight of its own is now part of the "look of the drag's cues" Open question.
   - DRAG-3.20 keeps the dividers and drops the tint.

**For the PO, from batch 4 (item-attachment).** Nathan answered both on 2026-09-28, and gave the PO the same context. Both wiki changes are in.

9. **ATT-8.3, creating an item with a parent.** §11a logs "any write that changes an item's parent or attachment flag". Does a create that gives the new item a parent count? If so, the item gets a hierarchy entry ("attached to `P`") beside its creation entry. If not, the creation entry accounts for where the item starts.
   - **Nathan:** yes, a log entry is created.
     - Ideally the parent reads the same entry too. The child would show "created as a child of `P`", and the parent "child `X` created".
     - How each item reads and shows it is deferred, possibly to Epic 7, since it may need changes to the activity-log system. For now, only the entry being created matters.
   - **To the PO:**
     - Add to §11a that creating an item with a parent records a hierarchy entry on the new item.
     - The deferred display belongs in the planning docs, since neither the wiki nor the case carries forward references.
   - **Then:** ATT-8.3 → `Open`, with Rule §11a. Its *Then* asserts only that the entry exists on `X` and names `P`, not how it's shown or whether `P`'s history lists it.
   - **Done (PO):**
     - §11a's new paragraph, "Creating an item with a parent counts": the new item's activity records the parent it was created under, and whether it's attached to it, whichever entry point created it.
     - "Whether it's attached" is a deduction; see Amendments.
     - How the entry reads, and the parent's side, are under item-attachment's Open questions. They're deferred in `epic-7-decisions.md` Q3, a new section, with your ideal wording.
10. **"Every reparent re-resolves" in item-attachment §9 and item-positioning §7.3.** This is wording only, and blocks no case. Both pages say a cross-project reparent's position "is still re-resolved, because a reparent always re-resolves". But item-attachment §4 says only an Attached item's reparent always re-resolves: a Free item's reparent with no anchor leaves its position alone. Both sentences are about the board, whose only reparent is an attach, so nothing is wrong. Read alone, though, they say a Free item's cross-project reparent re-resolves. Would "every attach re-resolves" say it?
    - **Nathan:** §4 is the rule. An item has one position, compared either among its attached siblings or among Free items. A Free item that is reparented and stays Free keeps its position, because its context is the Free items', not its siblings'. Story 9 may change this, since it decides whether a detached item also keeps a position among its siblings.
    - **To the PO:** reword the sentence on both pages so it doesn't read as covering a Free item's reparent. Whether Story 9's question belongs in the wiki's Open questions is the PO's call.
    - **Then:** no case changes. ATT-3.10 already follows §4. Batch 5 checks TC-7.14 against the reworded §7.3.
    - **Done (PO):**
      - item-attachment §9 and item-positioning §7.3's "Consequence" now say the position re-resolves as for any reparent, never because of the project. An item Attached before or after the write gets a fresh position. A Free item that stays Free keeps its position unless the write carries an anchor. On a board every reparent is an attach, so it always re-resolves.
      - Story 9's question goes in item-positioning's Open questions: whether a Free child also needs a position among its siblings. It challenges §1's single position, so it belongs there while it's open. Story 9 remains where it's decided.

**For the PO, from batch 4's proposing Reconciler run** (`docs/audits/test-reconciliation-a3-item-attachment.md`). Not yet answered.

Two are rulings, since the code does what the wiki says it mustn't. Per the README, neither side is assumed right:

11. **Ruling A: a top-level item is stored with the attachment flag set.**
    - The create stores the flag on a parentless item by default, and the flag is kept while the item has no parent. So a later write that gives the item a parent without mentioning the flag attaches it.
    - Wiki item-attachment §1 forbids exactly this: "silently accepting it would leave a stray flag on the row that later attaches the item the instant it gains a parent". §4 says "nothing attaches by default".
    - Two tests pin the code's side: `items.test.ts` line 1202, and the parent-picker test in `tests/ui/attached-children.spec.ts` line 328.
    - Affected cases: ATT-1.11, and the top-level half of ATT-3.9.
    - **The Test Planner's view:** the page states the rule and gives its reason, so the code looks wrong. Fixing it touches the create route, the hierarchy primitive, the schema default, the existing rows and those two tests. That's probably its own story, not A3.
    - **Inside it, for Nathan:** when the parent picker in an item's panel sets a parent, should it attach the item? If so, it sends the flag.
12. **Ruling B: a Card shows no tags.** §12 lists tags among what a Card shows, and the board renders none. Should the PO mark the tags `**Planned:**` (the tags rework), or should the Card render them? The tags now have their own case, ATT-1.10, so ATT-1.9 doesn't wait on this.

Four are `Pending PO` cases, where the wiki is silent and the code has chosen:

13. **ATT-1.13.** A write that leaves an item attached, but names a workphase other than its parent's: is it refused, or accepted with the workphase ignored? Moving an item refuses it today, and creating one ignores it.
14. **ATT-4.13.** Must an item's parent picker offer legal parents from other projects? §7 says the UI and the API must agree, and the API accepts them. The picker lists only the item's own project today.
15. **ATT-5.7.** A create under a parent that names a different project: is it refused (today), or does the item take the parent's project, as a reparent's cascade does?
16. **ATT-5.8.** May a write name a workphase from a workflow the item's project doesn't use, either without a reparent or in the same write as a cross-workflow reparent, re-filing the item in one step? The move endpoint refuses both today.

**Nathan Rulings**
These are deferred to docs\planning\tech-debt-stories\a5-wiki-and-test-plan-heirarchy-updates.md. We are ok to move on with the wiki and code staying as is

**For the PO, from batch 5's proposing Reconciler run** (`docs/audits/test-reconciliation-a3-item-positioning.md`). Not yet answered.

Two are rulings, where a test fails against today's code:

17. **Ruling C: TC-7.18, the `positionScope` of an item left in another workflow's workphase.**
    - A Free item reparented across workflows keeps a workphase its new project's workflow doesn't use. Its position is nulled: that's TC-7.17, which passes.
    - The page disagrees with itself:
      - wiki item-positioning §7.3 says the item reads `"none"`;
      - §2's definition of `"none"` names only a done item and an item with no workphase.
    - The API returns `"workflow"`, following §2's list, and `items.hierarchy.test.ts` line 697 pins that.
    - **The Test Planner's view:** §7.3's reason is that the item has no meaningful comparison scope. That's what `"none"` means, and why its position is nulled, as a done item's is. So `"none"`: §2's list gains the case, and the code follows.
    - The alternative is that §7.3 drops its parenthetical, and the case follows the code.
18. **Ruling D: TC-5.15, done items and the magnitude threshold.**
    - Wiki item-positioning §5's `n` is "the number of items in the scope", and a Free item's scope is the workflow's active items (§2). Done items have no position, so they don't count.
    - The Reconciler found that the code counts them. A test fails today, though only with hundreds of done items.
    - **The Test Planner's view:** the page is clear, so the code looks wrong. The Reconciler puts the fix at one filter, small enough for A3's Coder, as ATT-8.3's was.

Two are `Pending PO` cases, where the wiki is silent:

19. **TC-2.32, a write that names a final position.**
    - The page says a write carries relative intent, never a final number.
    - The API accepts one anyway, in two ways:
      - a raw `position` on a move;
      - a reorder endpoint that sets positions outright.
    - The route calls this an escape hatch for scripts, the MCP server and tests. No client calls the reorder endpoint.
    - Is it part of the API, which the page would then state, or is it to be retired, perhaps in the API contract epic?
20. **TC-6.10, two done items with the same `completedAt`.**
    - What orders them? §6 orders a done list by `completedAt`, and §5a's tie-break is for a sort by position.
    - The client puts the one created first ahead today.

**Nathan's rulings (2026-09-29):** 17, 19 and 20 go to A5's D2, question 17 alongside the other item movement cases. On 18, Nathan agrees that done items are a different scope, so they don't count toward `n`; the fix is deferred to Epic 4.

## Amendments

**2026-09-27, batch 1:**
- **IDs renamed (D4).** The 13 DRAG and ATT suites now write every case by its qualified ID, in headings, tables and text: 374 occurrences. Item-positioning references inside them (`TC-2.19`, `TC-5a.1`, `TC-X.5`) were left alone. No bare in-suite ID pointed at another suite, and none was higher than its own suite's top case. Each suite's "Cases are `TC-n` within this file" sentence is gone, and the two INDEX sentences now describe the new form.
- **Next ID lines** are on all 22 suites, the item-positioning ones included, under each title. Each is one past the suite's highest existing case, superseded and withdrawn cases included, since those are still in place.
- **Mechanical only.** `check:docs -- docs/test-plans` gives the same 287 hits before and after the rename, with the same rules and messages. Only line numbers moved.
- **`docs/test-plans/README.md` rewritten** per D1–D9: 0 hits, and `.claude` is at 0 too.
- **What waits for batch 2:** `case-id` and `--rules` don't exist yet, so batch 1's check `check:docs --rules case-id -- docs/test-plans` runs when they land. The README gains a line on `case-id` then, and so does the standards guide (Drafts, above).
- **Drafts for the Architect:** above, for Nathan's approval.

**2026-09-27, from A2's close (via the PO):**
- **Anchor changes.** The feature batches' step 1 now carries A2's anchor-changes table: board-drag §6 → §6.1, item-positioning §2 → §2.1 and §5 → §5.1, and "§2 addendum" → "§2's workphase-only rule". Batches 3 and 5 name the cases each change affects, and Acceptance checks that no `**Rule:**` field cites an old anchor. The checker can't catch these, since the old sections still exist. Today most suites cite the wiki only in their headers, so the new `**Rule:**` fields written in batches 3–5 are where this lands.
- **§5a is settled for now.** The Architect kept its steps in the wiki, so batch 5's part 5a note no longer assumes they move out. Each step keeps a case, and a step only a test of client code can prove goes to Nathan (D3).

**2026-09-27, before batch 2:**
- **Batch 2 goes to a Coder session,** as planned (Nathan). The Test Planner writes no code, and tooling is no exception.
- **D7 gains the details a Coder would otherwise guess:** which files are suite files, the ID shapes, what isn't ID-shaped, `--rules`'s error behavior, and the zero hits expected on `docs/test-plans`.
- **The `**Next ID:**` exemption.** A dry run by grep showed every other reference in the catalog resolves to a heading, but the 22 `**Next ID:**` values don't, by design. D7 exempts that line, and checks it's above every case in its suite instead.

**2026-09-27, batch 2 (Coder):**
- **`case-id` and `--rules` landed as D7 describes.** The catalog is read from the suite files' `## <ID>` headings, and the ID shapes come from the prefixes those headings use (today `DRAG`, `ATT` and `TC`).
- **Batch 1's deferred check passes.** `npm run check:docs -- --rules case-id -- docs/test-plans` reports 0 hits. Over the whole default scope, all 1,074 case-ID references resolve: 890 in the test plans (the 22 Next ID lines included) and 184 in code.
- **The npm form.** `npm run check:docs -- --rules <ids> -- <paths>`. npm keeps options that come before its own `--` for itself, so the first `--` is needed. The second is optional.
- **Two calls D7 left open:**
  - **`--rules` and ignore markers.** Every rule still runs and every marker is applied; only the report is narrowed. A marker problem is reported only when the marker names a rule being reported, or an unknown rule, which may be a typo of one. A title-only run is never blocked by a marker belonging to A4's comments.
  - **A Next ID that names another suite** (for example, `DRAG-6.n` in the DRAG-5 file) is flagged, since "past every case" can't be judged across suites.
- **Handoff:**
  - **To the Architect:** the standards guide's "What the checker checks" gains its bullet, as drafted above. `code-comments.md`'s "What the checker enforces" table also needs a `case-id` row, a case ID in a test title or comment that isn't in the catalog; the drafts don't cover that.
  - **To the Test Planner:** the README's line on `case-id` (batch 1's note), and `--rules` if it's worth naming there.

**2026-09-27, batch 2 follow-up (Test Planner):**
- **Batch 1's deferred check, re-run:** `check:docs -- --rules case-id -- docs/test-plans` reports 0 hits. Repo-wide, `case-id` also reports 0. `bare-case-id` reports 34, all unqualified `TC-n` in existing test titles, which the feature batches' Coder step qualifies (step 3).
- **The README's "How tests and cases point at each other"** gains the checker's line: an unknown case ID, a bare `TC-n` in a test, and a Next ID that isn't past its suite's cases. It adds that the checker can't tell whether a case still has a test, which is the Reconciler's job. It checks at 0 hits.
- **`--rules` isn't named in the README.** It's how the checker is run, not a catalog convention, and the checker's own docs cover it.
- **The Architect's two lines have both landed:** the standards guide's checker bullet and `code-comments.md`'s `case-id` row.

**2026-09-27, batch 3 step 1 (Test Planner, board-drag-interaction):**
- **Re-derived from the whole swept page.** 111 cases: 80 carried over and revised, and 31 new. 96 are `Open`, 12 `Manual` and 3 `Pending PO` (Open questions). Priorities: 50 P0, 48 P1, 13 P2. No passage is marked Planned, so no case is `Planned`.
- **Deleted, 9 cases:**
  - superseded or withdrawn: DRAG-1.15, 4.4, 4.6, 4.7 and 5.6–5.8;
  - DRAG-3.13 and 3.14, whose frozen-rect rule the page reverses: §5 now reads the live rect on every sample, and gives the reason. Their scenario lives on in DRAG-3.21.
- **Rules that changed the cases most:**
  - §2's ghost rules replace the "half of the hovered card" wording (DRAG-1.2, 1.22–1.24);
  - §6.1's zoom-in by the named relation, with a dwell and a cue, replaces "the cursor rests on the Card" (DRAG-4.19–4.25, and every zoom-in step);
  - §5's shortCard geometry (`h`, `gap`) replaces `GHOST_H` (DRAG-3.5, 3.15–3.18), which covers Story 10's item 5.
- **Named values** now go by the tuning panel's names (`popDelayMs`, `cardZoomDwellMs` and so on), not `POP_OUT` and the like.
- **Feel is catalogued.** The behaviors the old preamble left out now have cases: the tilt, the bounding, the snap, the locked outline, the guides, the cue, and the shortCard and Stub-row copies. They're `Open` wherever presence can be asserted and `Manual` where it's a judgment (DRAG-1.32, 4.24, 4.25).
- **`Manual` by the Test Planner (D3):** the threshold-dependent cases (DRAG-1.4, 1.11, 1.14, 1.18, 1.19, 1.29, 1.30, 5.5, 5.11) and the feel judgments above. DRAG-1.3's momentary half became DRAG-1.30.
- **New rules with cases:** the merged column's outer body (DRAG-1.25), the tuning panel (1.31), "Cycle-forming wins" (2.9), `itemDepthCap` (2.10), live bands (3.21), a done column at Column layer (3.23), the project sidebar (4.26), nested Stubs (5.13), detaching in place in a done column (5.14), and non-comparable positions (6.12).
- **Rule anchors:** the zoom-in cases cite §6.1, per the anchor table.
- **Automation test lines** on these cases were all `—` or notes, since nothing was `✅`. They're reset to `—` for the Reconciler, and the old notes, such as "E2E deferred to Story 10", are gone.
- **INDEX** is reduced to the wiki page and the suite list.
- **README fix, found in this batch:** a case the Test Planner makes `Manual` needs its `none — manual: <reason>` line written by the Test Planner, since the Reconciler leaves such cases alone. The README now says so, and adds that a case with no test shows `—`.
- **Checks:** `check:docs -- docs/test-plans/board-drag-interaction` reports 0 hits. `case-id` reports 0 across the catalog and across the tests, so no reference points at a deleted case.

**2026-09-27, Nathan's answers to batch 3's Open questions:**
- All three are answered, and each is handed to the PO under Open questions.
- The catalog doesn't change yet. An answer lands in the wiki first, and then the case follows.
- DRAG-4.27's question outlives A3 as a design question. The PO's handoff lets A3 close without it: the wiki carries the question, and the case is either deleted or `Planned`.
- **A5 takes DRAG-4.28's placement point.** Nathan opened `a5-wiki-and-test-plan-heirarchy-updates.md` for rules filed on the wrong wiki page, and for a sweep to find more. Moving a case to another suite was allowed only in the end-of-epic pass, so D4 and the README now also allow it in a story that moves the wiki rules the case derives from.

**2026-09-27, batch 3 step 2 (the proposing Reconciler run, and the Test Planner's response):**
- **The report** is `docs/audits/test-reconciliation-a3-board-drag-interaction.md`. For the 96 `Open` cases it proposes 20 stamps, 17 internal mappings, 38 gaps closable in A3 and 21 Story 10 routes. It found no lost coverage and no unknown IDs.
- **The Test Planner's changes, from its notes:**
  - **Deleted:** DRAG-4.2, whose only assertion was the project cascade (ATT-5.1, ATT-5.2), and DRAG-6.3, which restated the reconciliation order that DRAG-6's preamble gives to item-positioning (TC-5a.1, TC-5a.2).
  - **Revised:**
    - DRAG-4.3 asserts the attach the gesture makes, and leaves the done-parent consequences to ATT-6.1.
    - DRAG-2.2 classifies only descendants that are shown: `X`'s own attached Stubs travel with it, and aren't shown (§5a).
    - DRAG-1.20's `X` is alone in its column, so no neighbor can be zoomed into instead.
    - DRAG-6.9 drops "at most a single render". §10's "only for the instant it takes the board to notice" reads as "without waiting for further cursor movement".
    - DRAG-1.30 gains §3.1's "wherever it goes": moving between foreign places never restarts the pop-out clock. This was the report's first candidate case.
  - **Reopened from `Manual`:** DRAG-1.14, 1.18, 1.19 and 5.11. A single cursor sample decides these distance rules, and a test sets its own values, so "depends on a tunable threshold" didn't hold.
  - **New:** DRAG-6.13, a re-dragged pending item's ghost starting where the board shows it. §10 settles it: the board never shows the pre-drop order while a write is outstanding. Also new are DRAG-1.33, 4.29 and 4.30, as `Pending PO` (Open questions 4–6).
  - **Now 113 cases:** 99 `Open`, 8 `Manual` and 6 `Pending PO`. `check:docs` on the suites reports 0 hits.
- **For Nathan at Stop 1, beyond the report's approvals and gap rulings:**
  - **Clock logic.** DRAG-1.4, 1.11, 1.30 and 5.5 stay `Manual` unless Nathan approves one category of internal test: the clock rules (resets, what counts toward a clock, which band fires) pinned in the pop state machine, with the threshold as a parameter. Their pass then doesn't depend on the tuned values. Whether the values feel right stays manual (DRAG-1.32).
  - **Bare `TC-n` in comments.** A3 edits test titles only ("Out of scope"), so the Test Planner recommends that batch 3's check runs `--rules case-id` on the touched files, and leaves `bare-case-id`'s comment hits to A4.
- **For the Coder, step 3:** deleting DRAG-6.3 leaves three `case-id` hits in comments: `itemWriteReconciliation.ts` line 93, and `itemWriteReconciliation.test.ts` lines 17 and 109. They re-point to TC-5a.1 or TC-5a.2. The deletion is A3's, so the fix is too, even though the lines are comments.
- **An addendum to the report** maps the reopened, revised and new cases, before Stop 1.

**2026-09-27, batch 3 Stop 1 (Nathan's rulings):**
- **Approved:**
  - the 16 internal mappings in the report: DRAG-1.7, 1.8, 1.10, 1.25, 3.15, 3.21, 4.8, 4.9, 4.10, 4.11, 4.18, 4.19, 4.23, 6.10, 6.12 and 6.13;
  - the clock-logic category (D3). The Test Planner reopened DRAG-1.4, 1.11, 1.30 and 5.5, which leaves 103 `Open`, 4 `Manual` and 6 `Pending PO`.
- **Not approved:** the four other non-UI gaps (DRAG-1.28, 2.9, 3.16 and 6.6), which go to Story 10. The report's "optional supporting pointers" weren't asked for, so pointer lines list only the tests that make a case `Automated`.
- **Every UI drag gap goes to Story 10,** rather than being closed in A3 (D10's oversized-set clause, applied to Story 10 itself). A3 writes only the two new clock-logic tests.
- **A test that asserts part of a case still gets its ID.** The case stays `Open`, and the story that closes the gap extends that test. The README and D2 now say so.
- **Routed to Story 10, 62 cases:**
  - DRAG-1.1, 1.2, 1.5, 1.6, 1.9, 1.12, 1.13, 1.14, 1.16, 1.17, 1.18, 1.19, 1.20, 1.21, 1.22, 1.24, 1.26, 1.27, 1.28, 1.31;
  - DRAG-2.4, 2.5, 2.6, 2.8, 2.9;
  - DRAG-3.5, 3.11, 3.12, 3.16, 3.17, 3.18, 3.19, 3.20, 3.22, 3.23;
  - DRAG-4.1, 4.3, 4.5, 4.12, 4.13, 4.14, 4.15, 4.16, 4.17, 4.20, 4.21, 4.22;
  - DRAG-5.1, 5.2, 5.3, 5.9, 5.10, 5.11, 5.13, 5.14;
  - DRAG-6.2, 6.4, 6.6, 6.7, 6.8, 6.9, 6.11.

  The tests for DRAG-2.8 and 3.20 wait on the PO's answers (Open questions 7 and 8). The report's Gaps and Addendum say what each test asserts.
- **Routed to A5:** DRAG-4.26. A5's D1 names it.
- **Expected after the confirming run:** 40 `Automated` (20 by surface test, 20 by approved internal tests); 63 `Open`, of which 62 are routed to Story 10 and 1 to A5; 4 `Manual`; and 6 `Pending PO`.

**2026-09-27, the PO's answers to Open questions 1–8:**
- **Wiki sections changed** (board-drag-interaction). No section was renumbered or added.
  - §2: new rule 6.
  - §7.1:
    - the "Below the last item" and empty-hierarchy boundaries;
    - "The root, per context";
    - two new paragraphs: the sidebar's full context, and a set-down in its own gap.
  - §7.2: the partial-context passage moved out.
  - Open questions:
    - the depth-overflow entry widened into "Whether a Card shows its whole hierarchy";
    - a new entry on zooming into a Card in a done column.
- **Nathan's rulings written in:**
  - a card released inside its own done column writes nothing (question 1);
  - the project sidebar places against the real tree under a collapsed project (question 2).
- **The PO's deductions:**
  - **A done list's ghost stays where the release lands (question 1).**
    - It follows from §10's general rule (the preview shows where the write will land), from §2's "a release lands the item exactly where the ghost is", and from Nathan's ruling.
    - The same reading places an item from another column as the newest completion, which §10 already said.
  - **The sidebar's root (question 3).** §7.1's floor ("the shallowest level anywhere is the root's own children") puts the sidebar's shallowest level at the top-level projects. "The project" named no level.
  - **The sidebar's empty hierarchy (question 3).** It follows from §7.2: the dragged subtree is never a candidate.
  - **"Below the last item" starts from the root's own children, not "the root's depth".** The same paragraph's floor rules out the root's own level, so the behavior is unchanged.
  - **A set-down in its own gap and depth writes nothing (question 5).**
    - §2 rule 5's own reason, unseen items between the neighbors, can't arise with full context (§7.1).
    - The page's pattern is that a set-down which can't change anything writes nothing: rule 5's last sentence, §5's middle band, and §6's own Stub.
  - **§7.2's partial-context passage moves to Open questions (question 2).**
    - Nathan called whether the board can trust a Card's section to be complete a question to think through. The passage was one possible answer, not a settled rule.
    - Marking it Planned would have claimed a decision.
- **With Nathan:**
  - questions 4, 6, 7 and 8, above;
  - the new done-column zoom-in question, which the question 1 deduction exposed.
- **For the Test Planner:**
  - **Status changes:**
    - DRAG-3.24 → `Open`, Rule §2;
    - DRAG-4.27 is deleted;
    - DRAG-4.28 → `Open`, Rule §7.1;
    - DRAG-4.29 → `Open`, Rule §7.1.
  - **DRAG-4.3** now touches the new done-column question: its *Given* holds only with `P` beside the ghost.
  - **The sidebar's full-context rule** is part 2 of the Reconciler's candidate 5. It moves with the sidebar's rules in A5.

**2026-09-28, Nathan's rulings on the PO's recommendations:**
- **Nathan took all four:** questions 4, 6, 7 and 8.
  - He also agreed that a Card attached into stays open.
  - The done-column zoom-in question is deferred to Epic 4's done-column rework.
- **Wiki sections changed** (board-drag-interaction). No section was renumbered or added.
  - §1.1: new paragraph, "A drag leaves every Card's list of Stubs as the user set it" (question 4).
  - §4: the Inert row and "What is Inert" are removed; the Stub-drag line and a line on non-targets replace them (question 7).
  - §5: the tint is removed from the band table and the guides paragraph (question 8).
  - §7: new paragraph before §7.1, "Zooming in doesn't move the ghost" (question 6).
  - Open questions: the look entry now names the hovered band's highlight.
- **A deduction inside question 4's rule.** A Card zoomed into and then left goes back to how the user set it. That's the ruling's "after the release" applied to the one Card the drag opened.
- **The deferral is recorded** in `epic-4-decisions.md` §12, beside question 1's caveat.
- **For the Test Planner:**
  - DRAG-1.33 → `Open`, Rule §1.1;
  - DRAG-4.30 → `Open`, Rule §7;
  - DRAG-2.8: drop the Inert half;
  - DRAG-3.20: drop the tint.
- **For the Coder, with whichever story DRAG-4.30 is routed to:**
  - per the report, the client starts a zoom at the last row's depth, which question 6's rule changes when that row is nested;
  - per the report, the client's unused `'inert'` classification state no longer matches any rule.

**Batch 3, step 3: the Coder's brief.** It was written at Stop 1, and items 8 and 9 were added on 2026-09-28, after the PO's answers above.
The report is `docs/audits/test-reconciliation-a3-board-drag-interaction.md`. Where its Addendum names a case, the Addendum wins.
1. **Stamp titles** as the report's Proposed Stamps, Proposed Internal Mappings and the Addendum's "Net changes" list them:
   - every surface test listed, including those that assert only part of a case;
   - the internal tests behind the 16 approved mappings;
   - for DRAG-1.4 and 1.30, the popSession titles in the Addendum's clock table;
   - `DRAG-6.13:` on placement's "priorPlacement (a re-dragged item)" describe.

   Titles take the README form: full IDs, comma-separated, then a colon. The skipped zoom tests keep their titles until Story 10 un-skips them.
2. **Fix what the report flags in titles:**
   - drop DRAG-3.5 from the bands carve-out title (Test Quality 1);
   - make the bands "between columns or over Unsorted" title say only what it asserts (Test Quality 2);
   - drop the misattributed DRAG-3.9 and 3.10 from dragRequest's "same workphase, empty others" title (Test Quality 11), and leave its TC-7.x IDs for batch 5;
   - replace "DRAG-1.3 (momentary)" wherever the report re-stamps it;
   - replace "wiki §6's own reset rule" with §6.1, or drop it.
3. **Strip provenance from every title you touch.** The report's list is under Test Quality Concerns.
4. **Comments in the files you touch** (Nathan's ruling; the rest of each comment is A4's):
   - Qualify every bare `TC-n`. The report lists hierPlace lines 14, 149, 176, 207 and 282; placement line 239; dragRequest lines 75, 84 and 192; dragClassification line 134; and classify line 141.
   - Re-point DRAG-6.3 to TC-5a.1 or TC-5a.2 in `itemWriteReconciliation.ts` (line 93) and `itemWriteReconciliation.test.ts` (lines 17 and 109).
   - Map each ID to the case that now states the rule the comment describes. The deleted cases are DRAG-1.15, 3.13, 3.14, 4.2, 4.4, 4.6, 4.7, 5.6, 5.7, 5.8 and 6.3. For one of those, point at the case that now states the rule, or drop the ID. Don't guess.
5. **Write two popSession tests** (the approved clock-logic category):
   - `DRAG-1.11:` time in the top band counts toward the pop-in clock, so a slide into the middle band after `popInDelayMs` pops in at once. Also, leaving the region and coming back restarts the clock.
   - `DRAG-5.5:` an excursion out of a Descendants context and back, shorter than `popDelayMs`, pops nothing and resets the clock.
6. **Write no other gap tests.** They're routed.
7. **Checks:**
   - `npm run check:docs -- --rules case-id,bare-case-id -- <the files you touched>` reports 0 hits;
   - `npm run check` passes;
   - `npm run test:e2e` passes, since spec titles change.
8. **DRAG-4.30's fix** (Nathan, 2026-09-28). At the zoom into a Card's Descendants layer, the ghost starts where the Card layer showed it (wiki board-drag-interaction §7, "Zooming in doesn't move the ghost"):
   - for an item from outside, in the last gap as `P`'s last child, at depth 0, even when the last row is nested;
   - for `P`'s own Stub coming back in, in its own slot at its own depth.

   descendantsProjection's "a foreign item enters at the section's last gap, at the last row's depth" asserts the old start. Change the code and that test to the rule, using a nested last row, and title the test `DRAG-4.30:`. If no test covers the own-Stub start, add one. Nathan approved this as DRAG-4.30's internal mapping.
9. **Remove the client's unused `'inert'` classification state** from `dragClassification.ts`, since §4 now has three states. Remove it from any test or comment that names it too.

**Step 4, the confirming run:** apply the approvals above, including DRAG-4.30's (item 8). Leave a case whose ID a test carries, but which the test asserts only in part, `Open` with `—`.

**2026-09-28, the Test Planner applies the PO's answers and Nathan's rulings:**
- **Case changes** (board-drag-interaction):
  - **`Pending PO` → `Open`:**
    - DRAG-3.24 (§2, rule 6): a card set back down in its own done column; the ghost stays in its slot, and nothing is written.
    - DRAG-4.28 (§7.1): the sidebar's top-level floor and its empty hierarchy.
    - DRAG-4.29 (§7.1): a Stub set down in its own gap and depth writes nothing.
    - DRAG-1.33 (§1.1, §6.1): a drag leaves every Card's list of Stubs as the user set it. A Card zoomed into opens, closes again if the drag leaves it, and stays open if the item is attached into it.
    - DRAG-4.30 (§7): zooming in doesn't move the ghost. The case's *Given* has a nested last row, so the rule bites.
  - **Deleted:** DRAG-4.27. Its passage moved to the wiki's Open questions.
  - **Revised:**
    - DRAG-2.8 drops Inert. It keeps the Stub-drag half, and adds §4's new line: a place that's no target carries no classification.
    - DRAG-2.6's contrast with Inert is reworded to match.
    - DRAG-3.20 drops the tint. The ghost shows which band a release resolves by (DRAG-3.11).
    - DRAG-4.3's `P` is the newest completion, so it sits beside the ghost. Which other done Cards can be zoomed into is deferred to Epic 4 (`epic-4-decisions.md` §12).
  - **New:** DRAG-4.31 (§7.1): the sidebar places against the real tree under a collapsed project. The PO routed this rule's move to A5.
  - The INDEX now says three classification states.
- **The catalog now:** 113 cases, 109 `Open` and 4 `Manual`, and none is `Pending PO`. `check:docs` on the suites reports 0 hits, and `case-id` across the plans and tests reports 0.
- **Routing for the newly `Open` cases:**
  - **Story 10:** DRAG-1.33, 3.24 and 4.29, which are UI drag gaps under Stop 1's ruling. That makes 65 routed there.
  - **A5:** DRAG-4.28 and 4.31, with DRAG-4.26.
  - **A3:** DRAG-4.30, by the fix and internal test in the Coder's brief (item 8). If the confirming run finds that test covers only part of the case, the rest routes to Story 10.
- **Expected after the confirming run:** 41 `Automated`; 68 `Open`, of which 65 are routed to Story 10 and 3 to A5; 4 `Manual`. This replaces Stop 1's figures.
- **Open questions 1–8 are all answered.** The PO's entry and Nathan's rulings, above, record the answers.

**2026-09-28, batch 3 step 3 (Coder):**
- **Titles (brief items 1–3).** Stamped in the README form as the report and its Addendum list them, in 18 test files. Provenance is stripped from every title on the report's list, and the titles it flagged are fixed.
- **Stamps the brief didn't name.** The Addendum's clock table lists these as mapping once the clock category is approved, which Nathan did:
  - `DRAG-1.11` on popSession's four existing pop-in clock tests;
  - `DRAG-1.4` on placement's "a specific card…" test, which moves its `TC-2.11` to the front of the title;
  - `DRAG-5.5` on dragRequest's sibling-reorder test.

  Placement's "a real anchor at the column layer…" carries `DRAG-6.12` as well as `DRAG-5.1`, since the approved DRAG-6.12 mapping lists it.
- **Left alone, for the confirming run to list rather than map.** None of these has an approved mapping:
  - popSession's "DRAG-1.1: starts locked…", which the report doesn't propose;
  - about 11 internal titles that mention a DRAG ID mid-title, in dragClassification, dragRequest and dragRegions;
  - placement's prefix-form `DRAG-3.7`, `DRAG-3.9` and `DRAG-3.11` titles, and dragRequest's `DRAG-6.6` title.
- **Comments (item 4).**
  - Every bare `TC-n` in a touched file is qualified. The old DRAG-4 and DRAG-5 in-suite numbers map straight across, and none named a deleted case.
  - `DRAG-6.3` → `TC-5a.1`, the case for the reconciliation step order.
- **New popSession tests (item 5):** two `DRAG-1.11` tests (time in the top band counts; leaving for nowhere and coming back restarts the clock) and one `DRAG-5.5` test.
- **DRAG-4.30 (item 8).**
  - An item from outside is seeded in the last gap at depth 0.
  - The test uses a nested last row and checks that a release right away attaches as `P`'s last child.
  - The own-Stub start was already covered by "leaving the section clears it; coming back reseeds at the own slot". That test is now titled `DRAG-4.30:` and also checks that the release writes nothing.
- **Inert (item 9):** removed from `DropTargetState`. Every comment and test comment that named it is reworded, and nothing in code or tests says Inert now.
- **DRAG-4.29, beyond the brief (Nathan, 2026-09-28).**
  - The client sent the named anchor for a Stub set down in its own gap and depth. The release now writes nothing there: the projection records `atOwnSlot`.
  - `isIdentity` is unchanged.
  - A unit test titled `DRAG-4.29, DRAG-4.30:` covers it.
  - DRAG-4.29 stays routed to Story 10 unless Nathan approves that internal mapping. If he does, the expected figures become 42 `Automated` and 64 routed to Story 10.
- **`workflow/CLAUDE.md`:** the mental model now says where the Descendants ghost is seeded, and that a set-down in the Stub's own slot writes nothing.
- **Checks:**
  - `check:docs -- --rules case-id,bare-case-id` on every touched file reports 0 hits;
  - `npm run check` passes: server 317, client 393, scripts 75;
  - `npm run test:e2e` passes: 140 passed, and 8 skipped, all of them known.

**2026-09-28, before the confirming run (Test Planner):**
- **DRAG-4.29 internal mapping approved** (Nathan). It maps to its descendantsProjection test, so the expected figures are 42 `Automated`, 64 routed to Story 10, 3 to A5 and 4 `Manual`. Story 10's entry no longer needs DRAG-4.29.
- **The clock category's reach.** For DRAG-1.4 and 5.5 it also covers the release's tests that the report's clock table named: placement's "a specific card…" and dragRequest's sibling-reorder test. Nathan approved the category with that table in front of him.
- **Three bare `TC-n` remain outside the files the Coder touched:**
  - `placement.ts` lines 88 and 128 carry old DRAG-5 in-suite IDs;
  - `items.hierarchy.test.ts` line 14 is for batch 4 or 5.

  The batch check covers touched files only, and reports 0.

**2026-09-28, batch 3 steps 4 and 5 (the confirming run, and the Test Planner's checks):**
- **The confirming run** wrote the status and Automation test line on every case: 42 `Automated` (20 by surface tests, 22 by approved internal ones), 67 `Open` and 4 `Manual`. That matched the expected figures. Its report section is "Confirming run (2026-09-28)".
- **Eight cases were `Automated` with a clause their tests don't assert.** The Reconciler read Nathan's approvals as covering those clauses. The README's partial-coverage rule says otherwise, so the Test Planner made the cases whole instead:
  - **A clause that restated another case's rule became a pointer:**
    - DRAG-1.11's and 1.30's release clauses, to DRAG-3.1 and 1.16;
    - DRAG-1.25's release, to DRAG-1.16;
    - DRAG-4.23's release, to DRAG-1.23;
    - DRAG-3.21's second sentence, to DRAG-3.17.
  - **A rule the approved tests don't cover became its own case, `Open` and routed to Story 10:**
    - DRAG-4.32, an over-cap tab state's visible invalid cue, split from DRAG-4.18;
    - DRAG-4.33, the states below a nested last item, split from DRAG-4.11.
  - **DRAG-1.7 and 1.8 stay `Automated`.** Their *Then* is asserted. What's untested is the wiring in `useBoardDnd.ts` from classification to regions, an integration risk the report disclosed before Nathan approved them.
- **The batch's catalog:** 115 cases, 42 `Automated`, 69 `Open` and 4 `Manual`. Of the `Open` cases, 66 are routed to Story 10 and 3 to A5. None is `Pending PO`.
- **Checks:**
  - `check:docs` on the suites and the README: 0 hits.
  - `case-id` across the plans, `tests`, `server/tests` and `client/src`: 0 hits.
  - The files the Coder touched: `case-id,bare-case-id` reports 0 (the Coder's run).
  - Every case has a D2 status, and all 115 name their wiki section.
  - Each status matches its Automation test line and its row in the suite table.
  - `npm run check` and `npm run test:e2e` pass (the Coder's run). Only docs changed after it.
  - No `**Rule:**` field cites an old anchor. The zoom-in cases cite §6.1.
- **Before sign-off:** Story 10's entry drops DRAG-4.29 and adds DRAG-4.32 and 4.33 (Handoff, To the Architect).
- **Batch 6's close-out** picks these up:
  - `placement.ts` lines 88 and 128 still carry bare `TC-12` and `TC-4`, which are DRAG-5.12 and 5.4;
  - dragClassification's "(DRAG-2.3, 2.6)" title carries a prefix-less "2.6", which should go, since a classification test can't assert de-emphasis.

  Neither file was touched in batch 3.
- **Ready for Stop 2.**

**2026-09-28, many-to-many coverage (Nathan, at Stop 2):**
- **Tests and cases map many-to-many.** One test can prove several cases, and one case can be proved by several tests together.
- **A case is `Automated`** once the tests carrying its ID assert all of it, alone or together.
- **Closing a partial gap is a case-by-case judgment call.** Any of these is acceptable:
  - extend a test that already carries the ID;
  - write a new test focused on the case;
  - put the ID on another existing test that asserts the missing part.

  A test through the surface where the rule is visible, usually a Playwright test for a behavior, is preferred.
- **The earlier wording ruled this out,** by reading as one test per case:
  - the README's `Automated` row ("at least one test … asserts it");
  - Stop 1's partial-coverage line ("extends that test rather than writing another");
  - the Reconciler's "check that each mapped test asserts the case's *Then*".

  The README, D2 and the Story 10 handoff line now say the above.
- **Batch 3's statuses stand** (Nathan). Its 18 partly-covered `Open` cases are handled after A3 closes, under this rule. Batches 4 and 5 run under it from the start.
- **To the Architect,** `.claude/agents/test-reconciler.md`, "How You Map". Replace the bullet "Check that each mapped test asserts the case's *Then*, not just the code's current output (Test Quality, below)." with:

  ```markdown
  - **Check that the mapped tests, alone or together, assert all of the case's
    *Then*,** and that each asserts the rule, not just the code's current output
    (Test Quality, below). Tests and cases map many-to-many. Where the tests
    assert only part of a case, leave it `Open` and name the part they miss. How
    the gap closes is a judgment call made later, not yours
    (`docs/test-plans/README.md`).
  ```

**2026-09-28, batch 4 step 1 (Test Planner, item-attachment):**
- **Re-derived from the whole swept page.** A2 changed no rules here, so most of the work was the new format, plus the rules settled after the catalog was written. The catalog has 46 cases: 44 `Open`, 1 `Pending PO` (Open question 9), and ATT-7.6's ✅, left for the confirming run. Priorities: 29 P0, 13 P1, 4 P2. No passage is marked Planned. No case is `Manual`: every rule here can be asserted precisely, and none depends on feel or a tuned value.
- **New suite:** ATT-8, hierarchy changes are logged (§11a).
- **New cases for the rules the INDEX listed as settled but uncatalogued:**
  - ATT-3.9 and 3.10: a Free item's reparent at the API (§4). Omitting the flag keeps the item's state, and a Free reparent with no anchor leaves its position alone.
  - ATT-4.10: the "every write" clause (§7). Creating, editing and moving all enforce the same rules.
  - ATT-5.4 and 5.5: cross-workflow reparenting (§9).
  - ATT-7.7 and 7.8: reparenting to root (§11).
  - ATT-8.1 and 8.2: the activity log (§11a).
  - **The sixth, item-positioning §7.3's position nulling, is item-positioning's.** Batch 5 writes it, and ATT-5.4 points there.
- **Other new cases:**
  - ATT-1.8: attached means has a parent, in the stored row (§1's 400 and "clearing `parentId` clears the flag"). It was split from ATT-1.1, whose note said the rule wasn't settled.
  - ATT-1.9: what a Card and a Stub show (§12).
  - ATT-4.11: a move that makes an over-cap tree shallower but still over the cap is rejected (§8's "the formula is the whole rule"). ATT-4.7 keeps the rule that existing data stays usable.
- **Deleted, as restatements of rules another catalog owns:**
  - ATT-3.2 and 3.3: the placement form and the append fallback. §4 hands these to item-positioning §7.1 (TC-7.1, 7.2, 7.7).
  - ATT-3.8: the client's resync on a rejection (DRAG-6.6).
  - ATT-4.8: one `CAP` for the UI and the API (DRAG-2.10).
  - ATT-5.3: a cross-project reparent's position (item-positioning §7.3, TC-7.14).

  DRAG-6.6 and item-positioning part 2 no longer cite ATT-3.8.
- **A3's batch 4 list:**
  - ATT-3's stale scope note is replaced by a preamble that assigns placement to item-positioning;
  - ATT-7.6's pointer is file-level.
- **Removed:** provenance throughout (Epic and Story numbers, dates, the PO's confirmations, the audit behind ATT-7.6), ATT-1's history preamble, ATT-5's stale cross-workflow note, the per-suite Wiki lines and the INDEX's status, not-covered and flag sections.
- **Not catalogued:**
  - §7's "never in the database schema": no API or UI surface can observe it.
  - §12's Sheet, Headline and Dossier vocabulary: nothing a case could assert today.
- **Checks:**
  - `check:docs -- docs/test-plans/item-attachment` reports 0 hits.
  - `case-id` across the plans reports 0.
  - `case-id` in the tests reports 4 hits, each one pointing at a deleted case. The Coder fixes them in step 3:
    - `dragClassification.test.ts` line 8, `itemTree.test.ts` line 73 and `boards.test.ts` line 93 cite ATT-4.8 in comments. They re-point to DRAG-2.10.
    - `items.hierarchy.test.ts` line 254's title cites ATT-3.3. It drops it, since TC-7.7 remains.

**2026-09-28, Open questions 9 and 10 (Nathan's answers, written in by the PO):**
- **Wiki sections changed.** No section was renumbered or added.
  - item-attachment §9: the cross-project reparent paragraph (question 10).
  - item-attachment §11a: new paragraph, "Creating an item with a parent counts" (question 9).
  - item-attachment Open questions: new entry, how a create under a parent reads in the activity lists.
  - item-positioning §7.3: the "Consequence" paragraph (question 10).
  - item-positioning Open questions: new entry, whether a Free child also needs a position among its siblings. It was "None open".
- **The PO's deductions:**
  - **§11a's entry names whether the new item is attached,** as well as its parent. §11a's own "the entry says what changed" applies, and a create sets both fields.
  - **Question 10's rewording** takes its cases from item-attachment §4 and item-positioning §2.1: an attach or detach toggle and an Attached reparent get a fresh position, and a Free-stays-Free reparent without an anchor keeps its own. The rules are unchanged; only the two sentences that overstated them changed.
- **Deferred:**
  - the entry's reading and the parent's side, to Epic 7 (`epic-7-decisions.md` Q3, a new section, which goes with the activity log if Epic 7 splits);
  - the second-position question, already in the Epic 3.5 roadmap's Story 9. The wiki now carries it as an Open question.

**2026-09-28, batch 4 step 2 (the proposing Reconciler run, and the Test Planner's response):**
- **The report** is `docs/audits/test-reconciliation-a3-item-attachment.md`. Of 45 mapped cases:
  - 18 are `Automated` by stamps alone;
  - 1 needs an internal mapping (ATT-4.6);
  - 22 have route or API gaps A3 can close;
  - 3 have UI gaps with no drag;
  - ATT-4.9 needs a routing ruling.

  No coverage was lost, and board-drag's 42 `Automated` cases are all still backed. The one unknown ID in a title is the known ATT-3.3.
- **The Test Planner's changes, from its notes:**
  - **ATT-8.3 → `Open`.** Question 9's answer is in §11a. The case asserts the entry exists on the new item, names its parent and says whether it's attached, and nothing about how it reads.
  - **ATT-1.5 and 6.3** now allow the modification timestamp the cascade updates. What's never written is anything recording whether the child is done.
  - **ATT-4.7** drops "shown in the sidebar". The sidebar lists projects, not items.
  - **ATT-8.1** says "exactly one hierarchy entry", since an attach that changes the workphase also logs that change.
  - **The tags split out of ATT-1.9** into ATT-1.10 (Ruling B), so ATT-1.9 doesn't wait on the ruling.
- **New cases from the report's candidates:**
  - **Where the wiki states the rule** (`Open`):
    - ATT-1.11: a create keeps the invariant (§1). It fails today (Ruling A).
    - ATT-1.12: attaching a done Free item clears its `completedAt` (§2).
    - ATT-4.12: an item's parent picker never offers a parent the API would refuse (§7). Its cap half fails today, since the picker applies no cap.
    - ATT-5.6: an item created under a parent takes the parent's project (§9).
    - ATT-8.4: a hierarchy change that also changes the workphase logs that too (§11a).
  - **Where it's silent** (`Pending PO`): ATT-1.13, 4.13, 5.7 and 5.8, which are Open questions 13–16.
- **Fixed in batch 5's catalog:** `cross-cutting-regression.md`'s "ATT-5.1–5.3" range now reads "ATT-5.1 and ATT-5.2".
- **The catalog now:** 56 cases, of which 51 are `Open`, 4 `Pending PO`, and ATT-7.6's ✅. `check:docs` on the suites reports 0 hits, and `case-id` across the plans reports 0.
- **Next:** an addendum to the report maps the new and revised cases, then Stop 1.

**2026-09-28, batch 4 Stop 1 (Nathan's rulings):**
- **Ruling A: a parentless item may hold the attachment flag.**
  - Free is derived: an item is Free when it has no parent or its flag is clear. Tests should check all four combinations of parent and flag: Free renders as a Card in its column, Attached as a Stub inside its Card.
  - The UI should send no flag when it creates a top-level item.
  - This reverses wiki item-attachment §1's stored-row invariant, and touches §4's "omitting the flag keeps the item's state" and §11's clearing of the flag. So the wiki changes first, in A5 with the other deferred rulings.
  - **Cases:**
    - ATT-1.8 is now the `Pending PO` question.
    - ATT-1.11 is deleted, merged into ATT-1.8.
    - ATT-3.9's top-level variant moved to ATT-3.11 (`Pending PO`), and ATT-3.9 keeps a detached child.
    - ATT-7.7 now points to ATT-1.8 for the flag.
    - No code fix story is needed.
- **Ruling B: no tests for tags until the fuller tags system (Epic 5).** ATT-1.10 is `Pending PO`, for the PO to mark §12's tags `**Planned:**`.
- **Approved:**
  - ATT-4.6's internal mapping (itemTree's "a root item is at depth 1 and a leaf has height 0");
  - dropping `dragRequest.test.ts` from ATT-7.6's pointer.
- **Routing, as the Test Planner proposed:**
  - **A3's Coder:**
    - 24 route and API gaps;
    - ATT-8.3's logging fix;
    - 3 UI gaps with no drag (ATT-1.2, 1.7, 1.9).
  - **Story 10:** ATT-4.9.
  - **A5, by ID, as `Pending PO`:**
    - ATT-1.8, 1.10 and 3.11 (Rulings A and B);
    - ATT-4.12 (the picker is the Sheet's, and Nathan's A5 ruling 14 makes Sheet rules in-progress until Epic 7);
    - ATT-1.13, 4.13, 5.7 and 5.8 (Open questions 13–16, which Nathan has ruled on in A5's D2).
- **The catalog:** 56 cases, of which 47 are `Open`, 8 `Pending PO` (all routed to A5), and ATT-7.6's ✅. `check:docs -- docs/test-plans/item-attachment` reports 0 hits.
- **Expected after the confirming run,** if every A3 gap closes: 47 `Automated`, 1 `Open` routed to Story 10, and 8 `Pending PO` routed to A5.

**Batch 4, step 3: the Coder's brief.**
The report is `docs/audits/test-reconciliation-a3-item-attachment.md`, and where its Addendum names a case, the Addendum wins.
1. **Stamp titles** as the report's Proposed Stamps and the Addendum list them, including tests that assert only part of a case.
   - ATT-4.6 goes on itemTree's "a root item is at depth 1 and a leaf has height 0" (approved).
   - Don't stamp `dragRequest.test.ts` for ATT-7.6.
   - For the cases now `Pending PO`: hier:115 and hier:668 swap their misattributed ATT-1.1 for ATT-1.8, and attachedUI:328 stays unstamped until A5 settles ATT-4.12.
2. **Fix titles:**
   - hier:254 drops the deleted ATT-3.3;
   - items:354 says "workflow", not "workphase";
   - the "Epic 3.2 —" wrapper on items:305's `describe` goes.
   - Strip provenance from every title in a file you touch (the report lists hier:179, items:115, :509, :925, :1111 and attachedUI:213). "(wiki §N)" in a titled test can go too.
3. **Comments in files you touch:**
   - re-point the ATT-4.8 comments to DRAG-2.10 (`dragClassification.test.ts` line 8, `itemTree.test.ts` line 73, `boards.test.ts` line 93);
   - qualify every bare `TC-n`, such as hier's header "(TC-7.n)".
4. **ATT-8.3's fix.** Creating an item with a parent records, in the new item's activity, the parent it was created under and whether it's attached to it (wiki item-attachment §11a). How it reads, and whether the parent's activity shows it, aren't rules.
5. **Write the gap tests.** The report's Gaps and Addendum say what each one asserts.
   - **Route or API, partly covered:** ATT-1.4, 1.5, 1.6, 1.12, 3.9, 3.10, 4.10, 5.1, 5.5, 6.1, 6.2, 7.4, 7.5, 8.1, 8.2 and 8.4.
   - **Route or API, no test yet:** ATT-2.1, 3.4, 4.5, 4.7, 4.11, 6.3, 7.8 and 8.3.
   - **UI with no drag:** ATT-1.2, 1.7 and 1.9.
   - **Notes:**
     - ATT-3.9's and 3.10's Free item is a detached child, not a top-level item created the ordinary way.
     - ATT-1.5 and 6.3 don't compare the modification timestamp.
6. **Don't** write tests for `Pending PO` cases, or change how the attachment flag is stored or derived. That's A5's.
7. **Checks:**
   - `npm run check:docs -- --rules case-id,bare-case-id -- <the files you touched>` reports 0 hits;
   - `npm run check` passes;
   - `npm run test:e2e` passes.

**Step 4, the confirming run:** apply the approvals above. ATT-7.6's pointer lists only the route test. A case whose tests assert only part of it stays `Open`, with `—`.

**2026-09-28, batch 4 step 3 (Coder):**
Line numbers below are the report's, from before these edits.
- **Titles (brief items 1 and 2).** Stamped as the report and its Addendum list them, in five test files.
  - hier:306 carries `ATT-1.8` beside `ATT-7.7`, as the report proposes, so three tests carry the `Pending PO` ATT-1.8: hier:115, :306 and :668.
  - attachedUI:328 and `dragRequest.test.ts` are unstamped.
  - "(wiki §N)" is gone from every stamped title that had one.
  - Two titles are reworded as well as stamped, since each now covers more: hier:357 (`ATT-1.12`) and hier:569 (`ATT-8.4`).
  - **Provenance stripped beyond the report's list:** two "(regression: …)" notes in `items.test.ts`, the "pre-feature" note on its TC-X.1 `describe`, and itemTree's "cycle guards (Finding #11)" `describe`.
  - **Left alone, as the report recommends:** itemTree's mid-title ATT-4.5 and ATT-4.4, and dragClassification's ATT-4.5.
- **Comments (item 3).**
  - The three ATT-4.8 comments now point to DRAG-2.10.
  - hier's header no longer carries "(TC-7.n)". It now says the IDs in titles name item-attachment and item-positioning cases.
- **ATT-8.3's fix (item 4).**
  - `POST /items` now logs a `hierarchy_change` entry on an item created under a parent. It goes through a new `itemHierarchy.ts::logCreatedUnderParent`.
  - The entry's metadata has the shape the other hierarchy entries use, `toParentId` and `toAttached` included. It reads 'Created under "P" (attached)', and the item panel's activity list shows it. Nothing is logged on the parent.
  - hier:264 and :277 now count only the entries the write adds, since their Stubs are created under a parent.
- **Gap tests (item 5).** Every case the brief lists now has its tests.
  - **New route tests:**
    - `items.test.ts`: ATT-1.5 and 1.6;
    - `items.hierarchy.test.ts`: ATT-2.1, 3.4, 3.9, 3.10, 4.5, 4.7, 4.10, 4.11, 5.5, 6.3, 7.4, 7.5, 7.8, 8.1, 8.2 and 8.3.
  - **Extended:**
    - ATT-1.4 (items:1034);
    - ATT-1.12 (hier:357), which adds the done-parent variant;
    - ATT-5.1 (hier:381);
    - ATT-6.1 and 6.2 (hier:334), which add the unanchored attach;
    - ATT-8.4 (hier:569), now at both entry points.
  - **UI, no drag:**
    - ATT-1.2 and 1.9 extend attachedUI:40 and :177;
    - ATT-1.7 has a new test: checking Attached in a detached child's own panel makes it a Stub in its nearest Free ancestor's Card.
  - **Fixtures:**
    - Every Free item in ATT-3.9, 3.10 and 7.8 is a detached child.
    - ATT-2.1 first sets `B.updatedAt` to 1, so any write to `B` would show.
    - ATT-1.5 and 6.3 compare the whole row, allowing only `workphaseId` and `updatedAt` to differ.
- **ATT-3.9, beyond the brief's route class.** Its *Then* says `X` renders as a Card, so a new UI test covers that clause. It reparents a detached child with the item panel's parent picker, which sends no flag, and checks that the child is still a Card in its own column. The route test covers the rest: both flag-omitted items, and all four combinations with the flag.
- **Checks:**
  - `check:docs -- --rules case-id,bare-case-id` on the eight touched files reports 0 hits;
  - `npm run check` passes: server 335, client 393, scripts 75;
  - `npm run test:e2e` passes: 142 passed, and 8 skipped, all of them known.
- **Expected after the confirming run:** as at Stop 1, 47 `Automated`, ATT-4.9 `Open` and routed to Story 10, and 8 `Pending PO` routed to A5.

**2026-09-28, batch 4 steps 4 and 5 (the confirming run, and the Test Planner's checks):**
- **The confirming run** wrote the status and Automation test line on every case. That matched the expected figures:
  - 47 `Automated`: 46 by surface tests, and ATT-4.6 by its approved internal test;
  - ATT-4.9 `Open`, routed to Story 10;
  - 8 `Pending PO`, untouched and routed to A5.

  ATT-7.6's ✅ is gone, and its line lists only the route test. The report's section is "Confirming run (2026-09-28)".
- **The Reconciler disclosed four readings.** None of the Test Planner's calls on them changes a status:
  - **Made whole by rewording, as in batch 3:**
    - ATT-2.1 said `A`'s position changes. The tests assert its scope moving, and the number can come out the same (the coincidence ATT-3.4 describes). It now says the change is written to `A`'s row, with each field set as ATT-1.7 sets it.
    - ATT-7.3's "though `X.parentId` is still `P`", after the parent moves, is now a pointer to ATT-7.1, which asserts it.
  - **Stands:**
    - ATT-1.1. Its test's top-level item holds the flag a parentless create stores today, and still reads Free. Ruling A keeps that combination Free. It's re-checked after A5, since it depends on that default.
    - ATT-4.6. The counting is what Nathan approved.
- **Tests for A5,** now in A5's D2 by title, from the report's "`Pending PO` cases: tests for A5":
  - the three tests stamped ATT-1.8, two of which invert if Ruling A is written in;
  - ATT-7.7's two tests, which assert that clearing the parent clears the flag. That's ATT-1.8's question;
  - ATT-1.1's and ATT-4.7's tests, which depend on a parentless create storing the flag;
  - tests with no case ID that pin today's answer to ATT-1.8, 1.13, 3.11, 4.12, 5.7 and 5.8.
- **Batch 6's close-out** also picks up one title: `items.hierarchy.test.ts`'s "ATT-3.9, ATT-3.10: a Free item can be reparented and stay Free…" drops ATT-3.9. Its item is top-level, which is ATT-3.11's scenario, and ATT-3.9 is whole without it.
- **Checks:**
  - `check:docs` on the suites: 0 hits.
  - `case-id` across the plans, `tests`, `server/tests` and `client/src`: 0 hits.
  - The files the Coder touched: `case-id,bare-case-id` reports 0 (the Coder's run).
  - Each status matches its row in the suite table. The nine `—` lines are exactly the `Open` and `Pending PO` cases.
  - Every live case names its wiki section. The 8 `Pending PO` cases have no Rule field (D2).
  - `npm run check` and `npm run test:e2e` pass (the Coder's runs). Only docs changed after them.
  - **Destinations:** Story 10's item 1 names ATT-4.9, and A5's D2 names all 8 `Pending PO` cases. No mismatch either way.
  - Every Architect item in the Handoff is applied.
- **The batch's catalog:** 56 cases, of which 47 are `Automated`, 1 `Open` (routed to Story 10) and 8 `Pending PO` (routed to A5).
- **Ready for Stop 2.**

**2026-09-28, batch 5 step 1 (Test Planner, item-positioning):**
- **Re-derived from the swept page:** 74 cases.
  - 46 carry the legacy ✅. Their status is left for the Reconciler, and their pointers are file-level now.
  - 28 are `Open`.
  - None is `Pending PO` or `Planned`. No case needed an answer the page doesn't give, and the page has no `**Planned:**` marker.
- **Format:**
  - D8's layout, with suites titled `TC-<suite>` and a `**Rule:**` field on every case;
  - the INDEX lists the suites. Its counts, status block and history are gone.
  - From the suites: every history note, "previous mapping" note and "(regression/guard)" tag.
- **Anchors:**
  - The scope-change table's cases cite §2.1: TC-2.19–2.21, 2.23–2.25 and 7.17.
  - The disclosure's cite §5.1: TC-5.9–5.14 and 5a.4.
  - "§2 addendum" appears nowhere.
- **Deleted: 19.**
  - **Superseded:** TC-3.3, X.3 and X.5.
  - **Rules another catalog's cases hold:**
    - **TC-4.2–4.5, the merged-column drop resolution.** DRAG-3.6, 3.7 and 3.8 assert it, and are `Automated`. Their Rule fields now cite wiki item-positioning §4, and so does DRAG-5.2's. This closes TP F11: TC-4.4's snapping rule is DRAG-3.6's and 3.8's.
    - **TC-7.5 and 7.6 (an empty region), TC-7.8 (a done column) and TC-7.16 (the middle band).** The page says each takes a path §2 already has: "unchanged", "no new mechanism", "not a new rule".
      - DRAG-3.10, 3.9 and 3.3 make the requests. Their Rule fields now cite §7.1, §7.4 and §7.5.
      - The server's side is TC-2.24, 2.7, 6.1 and 6.3.
    - **TC-7.7, an empty Stub list:** DRAG-4.12 makes the request, and TC-2.20 holds the result. DRAG-4.12 now cites §7.1.
    - **TC-7.12:** ATT-3.5 asserts it with the same fixture. Item-attachment §5 holds the sequencing rule, and item-positioning §7.2 defers to it.
    - **TC-X.2, cycles:** ATT-4.2 and 4.3 (item-attachment §7).
  - **Within the catalog:**
    - TC-2.26 was only a pointer to part 6.
    - TC-2.3's example (`1.0` and `3.0` give `2`) can't tell coarsest fit from the raw midpoint. TC-2.2's `1.8` can.
    - TC-2.22: TC-2.1 now covers a moved item as well as a created one, and both mapped to the same test.
    - TC-7.9 is merged into TC-7.11, the same request. TC-7.11 now asserts the acceptance too, and cites §7.1.
    - TC-5a.3, re-sorting only on an inversion, was §5a's step 4, which Nathan dropped in A2.
- **New: 3.**
  - **TC-2.31:** a move within the item's own workphase that names no anchor appends it. This is §2's "a same-workphase reorder/append with no specific target card".
  - **TC-5a.6:** the board records no inversion for a write it didn't preview (§5a).
  - **TC-7.17:** a cross-workflow reparent nulls the position of the moved Free item and of its detached descendants (§7.3, §2.1).
    - Attached descendants keep their positions.
    - Re-filing takes the append fallback.
    - ATT-5's preamble points there. This is the case batch 4 left to batch 5.
- **Revised beyond wording.** The ✅ cases among these are the Reconciler's to re-check.
  - **Concrete values where the rule fixes one:** TC-2.1, 2.4–2.7, 2.9, 2.19–2.21, 3.4, 3.5, 5.2, 5.3, 6.9, 7.1, 7.2, 7.4, 7.11, 7.13–7.15, X.1 and X.6. For example, TC-2.4 is now `3`, not `3.4`.
  - **Part 2:**
    - TC-2.7 adds that an empty workphase isn't an empty scope, which was TC-7.6's rule.
    - TC-2.8 adds an anchor that doesn't exist, and that no fallback appends instead (§7.1).
    - TC-2.10 is now the workflow-wide scope: a neighbor in another workphase, and an attached child that isn't one. Its old example had an attached item as a Free item's neighbor, which §2 rules out.
    - TC-2.11 is now the request: relative intent, with no `position` field. The preview's side is TC-2.27 and 2.30.
    - TC-2.19 said "workphase-scoped". The scope is the workflow.
  - **Parts 5 and 5a:**
    - TC-5.6 is now the server's tie-break in a reindex. The client's is TC-5a.5.
    - TC-5a.1 is now §5a's outcome rule: the server's order, no reload, and no correctly ordered row moving, for each kind of write.
    - TC-5a.2 asserts that the inversion log gains no entry.
  - **Parts 6 and 7:**
    - TC-6.4 now has a direction: oldest completion first, the newest last. Board-drag §10 says a done list orders a missing `completedAt` last, "matching the server's stamp", so the case cites that section too.
    - TC-7.10 adds a plain move that names an anchor from another scope.
    - TC-7.14 follows the reworded §7.3. A cross-project attach resolves as it would within one project, and a Free item that stays Free keeps its position through a reparent with no anchor.
  - **TC-X:** TC-X.1 is now a detached child's workflow scope, and TC-X.6 a moving item not being its own neighbor. Each has values that tell the rule from its failure.
- **For the Reconciler:**
  - `useItemManagement.test.ts` no longer exists.
    - TC-4.1's pointer is `itemListOps.test.ts`, where the catalog's old note said its test moved.
    - TC-5.6's lists only the server test.
    - TC-6.4's is `—`.
  - TC-2.17 is the `positionScope` side of Ruling A's parentless flag (A5), and holds under either answer.
- **Deleted IDs in test titles and comments.** `case-id` reports 12, for the Coder in step 3. The report proposes where each goes.
  - `dragRequest.test.ts`: TC-7.16 at lines 26 and 104, TC-7.5 and 7.8 at line 32, and TC-7.8 at line 160;
  - `dragRequest.ts`, comments: TC-7.16 at line 37, and TC-7.5 at line 38;
  - `items.hierarchy.test.ts`: TC-7.9 at line 199, TC-7.12 at 280, TC-7.7 at 370, and TC-7.8 at 588;
  - `itemWriteReconciliation.ts`, a comment: TC-5a.3 at line 95.

  `placement.ts`'s two bare `TC-n` are batch 6's, as already listed.
- **Also edited:**
  - cross-references to deleted cases, and the Rule additions above, in DRAG-3.3, 3.6–3.10, 4.12, 5.2 and 6.10, and in ATT-3.1, 3.5 and 4.2;
  - the README's example ID, from TC-4.3 to TC-4.1.
- **Acceptance's TC-4.4 line** now asks for the snapping rule to be `Automated` in DRAG-3.6 and 3.8.
- **Checks:**
  - `check:docs -- docs/test-plans` reports 0 hits. item-positioning had 72.
  - Every status matches its suite table.
  - Every Next ID is past its suite's last case.
  - Every case has a Rule field.
- **Next:** step 2, the proposing Reconciler run.

**2026-09-28, batch 5 step 2 (the proposing Reconciler run, and the Test Planner's response):**
- **The report** is `docs/audits/test-reconciliation-a3-item-positioning.md`. Of the 74 cases:
  - 31 are `Automated` by stamps alone: 27 through surface tests, and 4 under the existing resolver and itemListOps pointers;
  - 6 need an internal mapping approved;
  - 24 have route, API or no-drag UI gaps that A3 can close. For 8 of them, a range only needs tightening to the case's value;
  - 10 are client cases, split between internal tests and the drag;
  - 3 needed a ruling.

  No coverage was lost. Board-drag's 42 `Automated` cases and item-attachment's 47 are all still backed, and the cases step 1 edited keep their statuses.
- **16 of the 46 ✅ cases don't hold as they now read:** TC-2.1, 2.6, 2.7, 2.8, 2.9, 2.10, 2.19, 3.4, 5.4, 5.6, 6.1, 6.4, 6.7, 6.9, X.1 and X.6.
  - Most fail on the exact values and new clauses step 1 added.
  - TC-2.10's ✅ rested on resolver tests that scope to one workphase.
  - TC-X.1's describe holds no detached child.
- **The Test Planner's response:**
  - **R2, TC-2.1:** a create takes no anchor, and the page never says one does. TC-2.1 is now a move, and TC-2.11's "an inline create into a slot" is now "an inline create".
  - **R3, TC-5.9:** its values were wiki item-positioning §5.1's illustration. A tight gap reindexes first and then inserts, so they're now `A = 1`, `C = 2` and `E = 3`, with `X` at `1.5`.
  - **R1, TC-7.17:** its `positionScope` clause is split out as TC-7.18, `Pending PO` (Open question 17). TC-7.17 is now the nulled positions, which pass today.
  - **TC-7.14:** `X` is now a detached child, so its Free half doesn't turn on Ruling A (ATT-3.11).
  - **TC-7.10** gains two more rejected anchors, both outside the resulting scope (§7.1):
    - an anchor in another workflow (candidate 2);
    - the moving item as its own anchor (candidate 1), which follows from TC-X.6.
  - **New cases:**
    - TC-5.15, `Open`: done items don't count toward `n` (candidate 6, read from §5 and §2). It fails today (Open question 18).
    - TC-2.32, `Pending PO`: a write that names a final position (candidate 3; question 19).
    - TC-6.10, `Pending PO`: a tie in `completedAt` (candidate 5; question 20).
  - **Not catalogued:** candidate 4, that a client applies the pairs before the written row. Against a correct server the two agree (TC-5.11), so no surface can see the order.
  - **The overlaps the report lists stay.** Each case states its own rule, even where one test proves several.
  - **For the confirming run:** TC-2.16's, 2.17's and 6.6's pointers name the wrong file.
- **The catalog now:** 78 cases: 46 ✅, 29 `Open` and 3 `Pending PO`. `check:docs -- docs/test-plans` reports 0 hits.
- **The report's addendum** maps the changed and new cases:
  - TC-2.1 (as a move) and TC-7.17 (without its `positionScope` clause) are whole on existing tests, and pass today.
  - TC-7.10 isn't whole yet: two of its rejections need a re-read of the row.
  - TC-5.9 passes today once items:669 reads `reindexed`. That one assertion also closes TC-5.13's and 5.14's missing halves.
  - TC-5.15 fails today, as expected.
  - 15 of the 46 ✅ cases don't hold as they now read. TC-2.1 holds as a move.
- **Expected at the confirming run:**
  - 38 `Automated` if Stop 1 approves only the six internal mappings;
  - 65 if A3's Coder also closes every tighten, route, API and no-drag UI gap, TC-5.15 included only if its fix lands;
  - 75 if the client-case category is approved too.

  The 3 `Pending PO` cases stay out of these counts.
- **Next:** Stop 1.

**2026-09-29, batch 5 Stop 1 (Nathan's rulings):**
- **Internal tests:**
  - **Approved:** TC-2.27, 5a.2, 5a.4 and 5a.6 (the report's mappings A).
  - **TC-2.16 and 2.17** become route tests: one assertion each, on tests that already set up the item.
  - **A new approved category:** a client ordering or request rule whose only surface is a drag, tested in the pure modules `itemListOps.ts`, `itemWriteReconciliation.ts` and `dragRequest.ts` (D3, README).
    - It covers the report's partial mappings B.
    - It covers four new tests: TC-2.28's client half, TC-2.29's reconciled half, TC-2.30's re-sort half, and TC-7.3.
    - It covers TC-5a.5's `null` half.
    - placement:63 keeps TC-2.11.
- **Exact values:** the Coder tightens the eight tests the report lists (R4) to each case's value.
- **Gaps:** every route, API and no-drag UI gap goes to A3's Coder. Under the category, nothing from this batch goes to Story 10.
- **Open question 17, TC-7.18's `positionScope`:** to A5, with the other item-movement cases in its D2.
- **Open question 18, TC-5.15:** Nathan agrees that done items are a different scope, so they don't count toward `n`. The fix is deferred to Epic 4, with the done-column rework. TC-5.15 stays `Open`, routed there.
- **Open questions 19 and 20, TC-2.32 and TC-6.10:** to A5.
- **The catalog:** 78 cases: 46 ✅, 29 `Open` and 3 `Pending PO`.
  - Of the `Open` cases, TC-5.15 is routed to Epic 4, and the rest are A3's.
  - The 3 `Pending PO` cases are routed to A5.
- **Expected after the confirming run,** if every A3 gap closes: 74 `Automated`, TC-5.15 `Open` and routed to Epic 4, and 3 `Pending PO` routed to A5.

**Batch 5, step 3: the Coder's brief.**
The report is `docs/audits/test-reconciliation-a3-item-positioning.md`. Where its Addendum names a case, the Addendum wins. Line numbers are the report's.
1. **Stamp titles** as the report's Proposed Stamps and the Addendum list them, including tests that assert only part of a case. That covers:
   - the surface tests;
   - the internal tests under existing pointers (resolver, and listOps:125 for TC-4.1);
   - the approved internal tests:
     - TC-2.27 (listOps:292) and 5a.2 (reconcile:130), already stamped;
     - TC-5a.4 (reconcile:49 and :26);
     - TC-5a.6 (reconcile:153);
   - under the new category, the report's mappings B:
     - TC-2.11, on dragRequest's `toRequest` describe (placement:63 keeps its TC-2.11);
     - TC-2.29, on listOps:318;
     - TC-2.30, on listOps:343, with the ID moved to the front;
     - TC-5a.1, on reconcile:26, reconcile:56 and dragRequest:261;
     - TC-5a.5, on listOps:73;
     - TC-7.1, 7.2 and 7.4, on dragRequest:127.
2. **Deleted and misattributed IDs**, as the report's Unknown IDs table proposes:
   - the 12 `case-id` hits;
   - the range tails the checker can't see: reconcile:108's "TC-5a.1–5a.3" and the "7.8" in `dragRequest.ts` line 38;
   - TC-5.6 on items:658, :712 and :742's comment, which becomes TC-5.5;
   - TC-X.1 comes off items:410's describe.
3. **Titles:** strip provenance from every title in a file you touch, as the report's "For the Coder" lists. The "(wiki …)" and "(positioning §N)" pointers can go.
   - items:258 states the rule §2 replaced. Retitle it to what it asserts, or remove it.
   - items:338 can't tell a fresh position from a kept one. Fix its fixture, or leave it without an ID.
4. **Tighten** the eight tests in the report's R4 to the case's value:
   - **TC-2.9:** resolver:163 asserts `2.9`.
   - **TC-2.19:** items:354 asserts the exact append, and `positionScope` `"workflow"`.
   - **TC-5.6:** resolver:82's older row is inserted later.
   - **TC-6.1:** items:328 and :577 assert that `completedAt` falls between timestamps read just before and just after the write.
   - **TC-7.11:** hier:260 asserts `1.5`.
   - **TC-7.13:** hier:352 asserts `10.5`.
   - **TC-7.15:** hier:540 asserts `1.5`.
   - **TC-X.6:** items:462 asserts `2`.
5. **Route and API gap tests.** The report's Gaps and Addendum say what each one asserts.
   - **Partly covered:** TC-2.5, 2.6, 2.7, 2.8, 2.10, 3.4, 5.4, 5.9, 5.12, 5.13, 5.14, 6.7, 6.9, 7.10 and 7.14.
     - TC-5.9 closes with one assertion on items:669's `reindexed`. That assertion also closes TC-5.13's and 5.14's missing halves.
     - TC-7.10's rejections need a re-read of the row.
   - **No test yet:**
     - TC-2.31 and X.1;
     - the server halves of TC-7.1 and 7.2;
     - TC-2.16 (one assertion on boardsRoute:133) and TC-2.17 (one on items:1244).
6. **UI with no drag:**
   - TC-6.4;
   - TC-2.11's inline create: its `POST` body carries no `position`;
   - TC-5a.1's inline create and Sheet edit: the server's order, with no reload.
7. **New internal tests, under the category:**
   - TC-2.28's client half: fold `X = 1.5`, and then `X = 2.5`, into `A, C, E` and sort;
   - TC-2.29's reconciled half;
   - TC-2.30's re-sort half;
   - TC-7.3: a tie given newest first, then `toRequest`'s first and last;
   - TC-5a.5's `null` half.
8. **Don't:**
   - write tests for the `Pending PO` cases (TC-2.32, 6.10 and 7.18);
   - change hier:697's `positionScope` assertion (A5);
   - fix TC-5.15's threshold count (Epic 4);
   - edit the "§2 addendum" comments, which are A4's.
9. **Checks:**
   - `npm run check:docs -- --rules case-id,bare-case-id -- <the files you touched>` reports 0 hits. `placement.ts`'s two bare IDs are batch 6's unless you touch that file;
   - `npm run check` passes;
   - `npm run test:e2e` passes.

**Step 4, the confirming run:** apply the approvals above.
- The existing pointers count, and `itemListOps.test.ts` counts for TC-4.1.
- Correct the pointers that name the wrong file: TC-2.16, 2.17 and 6.6.
- A case whose tests assert only part of it stays `Open`, with `—`.
- Story 10's item 1 then says item-positioning routed nothing, or names what's left (Handoff).

**2026-09-29, batch 5 step 3 (Coder):**
Line numbers below are the report's, from before these edits.
- **Titles (brief items 1 and 3).** Stamped as the report's Proposed Stamps and its Addendum list them, in ten test files, with the partial stamps under mappings B.
  - Provenance is stripped as the report's "For the Coder" lists it, both optional items included. Every "(wiki …)" and "(positioning §N)" pointer is gone from the touched titles, including the resolver's "disclosure (wiki §5)" describe, which the list doesn't name.
  - A trailing ID is gone wherever the title or its describe now carries it at the front: the "(TC-n)" suffixes in `items.test.ts`, the API specs' "(TC-2.n-equivalent)", and two "(TC-2.11)" suffixes inside dragRequest's `toRequest` describe.
  - **items:258 is removed.** It asserted the rule §2 replaced, and items:284 (TC-2.24) asserts the one that holds.
  - **items:338's fixture is fixed.** The item is pinned at `5.0` before it attaches, and the test asserts `2.0` and `"attached-siblings"`. It carries TC-2.20, which the report didn't propose (Test Quality 1). TC-2.20 is whole on hier:540 and :370 either way.
  - **Left alone:** resolver:399's "(the Date.now()-scale legacy-data self-heal)". It names the data the rule is for, not where the test came from.
- **IDs (item 2).**
  - The 12 `case-id` hits are resolved as the Unknown IDs table proposes. dragRequest:26 keeps DRAG-3.12 mid-title, as the table allows.
  - The range tails: reconcile:108 now reads "TC-5a.1, TC-5a.2", and `dragRequest.ts`:37–38 name DRAG-3.12, 3.10 and 3.24.
  - items:712's title and :742's comment carry TC-5.5 in place of TC-5.6. The describes at items:410 and :658 lose their IDs.
- **Tightened (item 4):** all eight. TC-6.1's two tests bracket `completedAt` between timestamps read before and after the write.
- **Route and API gap tests (item 5).**
  - **New, in `items.test.ts`:** TC-2.5, 2.6, 2.7, 2.10, 2.31, 3.4, 6.9, 7.1, 7.2 and X.1, and one magnitude test stamped TC-5.4, 5.13 and 5.14. Its two items are created before either is pinned high, since a create after the pin would reindex the scope itself.
  - **New, in `items.hierarchy.test.ts`:** TC-7.14's Free half. A detached child reparented across projects with no anchor keeps `5.0`.
  - **Extended:**
    - TC-2.8: items:487 and hier:588 re-read the row, so the refused move is shown to write nothing.
    - TC-5.9: items:669 asserts the whole `reindexed`, which also closes TC-5.13's and 5.14's halves there.
    - TC-5.12: hier:1055 adds a plain append with no `reindexed`.
    - TC-6.7: columnsRoute's two rejections re-read the board's columns.
    - TC-7.10: items:510 and :537 re-read the row.
    - TC-2.16 and 2.17: one assertion each, on boardsRoute:133 and items:1244.
  - One server test less than planned: items:258, above.
- **UI with no drag (item 6):** a new `tests/ui/item-positioning.spec.ts`.
  - **TC-6.4:** three items are completed in the order D2, D3, D1, each once the clock has passed the one before, so no two share a `completedAt` (TC-6.10's tie is `Pending PO`). The Done column reads D2, D3, D1.
  - **TC-2.11 and 5a.1, the inline create:** the `POST` body has a `workphaseId` and no `position`.
  - **TC-5a.1, the Sheet edit:** a detach from the item's own panel, a `PUT` whose position the server resolves.
  - Both TC-5a.1 tests seed two items at `1100` and `1200`, so the write reindexes. Only a board that applied the pairs renders the new item last. Each test also records every `GET /api/boards/:id` after the board loads, and expects none.
  - `titlesIn` moved from `drag-column-bands.spec.ts` to `tests/helpers/boardLocators.ts`, so both specs share it.
- **New internal tests, under the category (item 7):**
  - `itemWriteReconciliation.test.ts`, "the preview through its responses": TC-2.28, 2.29 and 2.30. Each asserts the rendered order at each step, and TC-2.30 that `X` keeps its position and placement while another item's response lands.
  - `dragRequest.test.ts`: TC-7.3.
  - `itemListOps.test.ts`: TC-5a.5's `null` half, as its own test beside the tie.
- **Not done, as the brief says (item 8):** no tests for TC-2.32, 6.10 or 7.18; hier:697 unchanged; TC-5.15's count unchanged; the "§2 addendum" comments untouched. Also left for batch 6: hier:415's ATT-3.9 and `placement.ts`'s bare IDs.
- **Checks:**
  - `check:docs -- --rules case-id,bare-case-id` on the 15 touched files reports 0 hits;
  - `npm run check` passes: server 346, client 398, scripts 75;
  - `npm run test:e2e` passes: 145 passed, and 8 skipped, all of them known.
- **Expected after the confirming run,** as at Stop 1: 74 `Automated`, TC-5.15 `Open` and routed to Epic 4, and 3 `Pending PO` routed to A5.

**2026-09-29, batch 5 steps 4 and 5 (the confirming run, and the Test Planner's checks):**
- **The confirming run** wrote the status and Automation test line on every case, and matched the expected figures:
  - 74 `Automated`: 52 by surface tests alone, 14 by internal tests alone, and 8 by both. The 14 are 6 under existing pointers and 8 under Nathan's approvals;
  - TC-5.15 `Open`, routed to Epic 4;
  - 3 `Pending PO`, untouched and routed to A5.

  The pointers that named the wrong file are corrected. The report's section is "Confirming run (2026-09-29)".
- **The Coder left no step 3 entry,** so the run mapped from the tests as they stand.
- **Six readings, disclosed. None changes a status.**
  - **Made whole by rewording:**
    - **TC-2.11** listed a request's forms as an anchor and a side, or a workphase, but an attach or detach also names a parent. The case now says the request names what the placement is relative to, and carries no `position`.
    - **TC-7.14's** attach half runs on a top-level `X`. The detached child now applies only to its Free half, where it matters.
  - **Stand:**
    - **TC-2.7:** two clauses rest on the resolver's bootstrap tests, under an existing pointer. The route tests that show them carry other IDs.
    - **TC-5.9:** its test's fixture differs from the case's, but its values are exact.
    - **TC-5a.1:** the inline create and the Sheet edit without a reindex rest on the reducer test, under the category. The UI tests show the harder path, with a reindex.
    - **TC-2.30:** the pending marker is asserted as the placement entry, not the board's attribute. The case asks for a separate marker, not a particular one.
- **A5's D2:**
  - batch 5's entry moved after batch 4's tests list, since it had split batch 4's entry;
  - the parentless-create test that pins ATT-1.8 now carries TC-2.17 too, so it moved to the list that's re-checked once A5 answers.
- **Batch 6's close-out** also picks up:
  - `itemPositionScope.test.ts`'s titles, which still end in TC IDs that don't count;
  - `items.test.ts`'s "detached siblings" describe, which holds top-level items;
  - optionally, TC-2.7 on the route test that shows a first attached child's `1.0`.
- **Checks:**
  - `check:docs -- docs/test-plans` reports 0 hits, and no ✅, ⏳, ❌ or ⏸ remains anywhere in the catalog.
  - `case-id,bare-case-id` across `tests`, `server/tests`, `client/src` and `server/src` reports only `placement.ts`'s two bare IDs, which are batch 6's.
  - Every status matches its suite table (74, 1 and 3), and the four `—` lines are exactly the `Open` and `Pending PO` cases.
  - Every live case names its wiki section. The `Pending PO` cases have no Rule field (D2).
  - `npm run check` passes. So does `npm run test:e2e`: 145 passed and 8 skipped, the known skips. The Test Planner ran both, since the Coder left no results.
  - **Destinations:** Epic 4's decisions §12 names TC-5.15, and A5's D2 names TC-2.32, 6.10 and 7.18. Nothing is routed to Story 10. Its item-positioning placeholder is the Architect's to replace (Handoff).
- **The batch's catalog:** 78 cases. 74 are `Automated`, 1 is `Open` (routed to Epic 4), and 3 are `Pending PO` (routed to A5).
- **Ready for Stop 2.**
