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
  - no ⏳, ✅, ❌ or ⏸ remains, and no case is `Pending PO`;
  - batch 6's run confirms that every `Automated` case has at least one test carrying its ID;
  - every `Open` case is named by ID in Story 10's roadmap entry or in another named destination;
  - TC-4.4 is either `Automated`, with a test that asserts the snapping rule, or `Open` and routed;
  - no `**Rule:**` field cites the old anchor of a moved rule. This is checked by review against the anchor table in the feature batches, since the checker can't see it.
- **The tests:**
  - `check:docs --rules case-id,bare-case-id -- tests server/tests client/src` reports zero hits;
  - the unit and E2E suites pass.
- **No four-pass audit** (A1 D10). A3 adds tests and edits titles, but restructures no code. The new tests fall inside Story 7's audit range (Auditor F8).

## Handoff

- **To the Architect:**
  - **Story 10's roadmap entry:** narrow item 1 to the IDs A3 routed there, listed per batch in Amendments ("batch 3 Stop 1" names 62). Item 5 is done. Items 2 and 4 still use the old in-suite forms, such as "DRAG-4 TC-8", which become qualified IDs. Item 1's "82 active cases … all currently ⏳" goes. D10 needs this before each batch signs off.
    - *Applied for batch 3's 62 on 2026-09-27.* Still owed, from 2026-09-28's amendment:
      - add DRAG-1.33, 3.24 and 4.29 to item 1's board-drag list, which makes 65;
      - drop the note that DRAG-2.8's and 3.20's tests wait on the PO. The PO has answered: 2.8 lost its Inert half and 3.20 its tint, so both can be written as they read now.
    - *Also owed, from the confirming run:*
      - remove DRAG-4.29, which is `Automated` now;
      - add DRAG-4.32 and 4.33, which makes 66;
      - point item 1 at the report's "Confirming run" section as well. It lists the 18 tests that carry an ID but assert only part of the case. For each one, Story 10 decides whether to extend that test, write a new one, or map another test (README, "Tests and cases map many-to-many").
  - **`.claude/agents/test-reconciler.md`, "How You Map":** one bullet changes, so that tests and cases map many-to-many. The replacement text is in Amendments, "2026-09-28, many-to-many coverage".
  - **`.claude/guides/testing-strategy.md`, "What stays manual":** add that a drag clock's logic is tested in the pop state machine, with the threshold as a parameter. That's the category Nathan approved at batch 3's Stop 1. Such a test asserts no duration, and only whether the tuned values feel right stays manual.
- **To the PO:** the drag INDEX's flag 14 lists edits owed to the "Placement rules for a Hierarchy" design doc. It goes when the flag list is removed. The design doc is transient, and wiki §7 already carries the agreed wording. Please confirm nothing is lost.
- **To A4 (the Coder):** test comments in the files A3 touched are still A4's, except for their case IDs. A3's Coder qualifies bare `TC-n` and re-points IDs of deleted cases in the comments of every file it touches (Nathan, batch 3 Stop 1).
- **To A5:** DRAG-4.26, 4.28 and 4.31 are routed there by ID (A5's D1). All three are the project sidebar's, and move with its rules.
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
