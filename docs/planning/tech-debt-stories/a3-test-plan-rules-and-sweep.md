# A3 — Test Plan Rules and Catalog Sweep

**Type:** tech-debt story · **Written:** 2026-09-26 by the Test Planner · **Ready for:** Nathan's review

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
  - approved as manual-only;
  - routed by ID to a named story.
- **It closes the known coverage gap** in item-positioning (TP F11).

**Depends on:**
- **A1:** the checker, the standards guide and the story checklist exist.
- **A2:** a feature's pass starts only once A2 has swept that feature's wiki page (PO F8). Batches 1 and 2 don't wait for A2.

**Out of scope:**
- **Test comments.** They belong to A4. A3 edits test titles only.
- **Precise-move drag E2E tests.** Writing them stays with Epic 3.5 Story 10 (D10).
- **The wiki.** Gaps found during the sweep go to the PO as Pending PO questions (D1).
- **`testing-strategy.md`.** It's stale, but it belongs to the Architect (see Handoff).

## Decisions

These answer every question the work below depends on. Each one names the round-table items or A1 decisions it builds on. Three go beyond what the round table settled, and are flagged for Nathan:
- D3's line on which tests need approval;
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
| `Planned` | Its wiki section carries `**Planned:**`. It can't be built yet. | Test Planner |
| `Open` | The rule is live, and no approved test or manual approval exists yet. | Test Planner: for a new case, from `Planned` or `Pending PO`, or from a `Manual` case whose reason no longer holds. Reconciler: from `Automated`, when the test is gone. |
| `Pending PO` | The case was inferred where the wiki is silent (D1). | Test Planner |
| `Automated` | At least one test carries the case's ID and asserts it (D3, D5). | Reconciler |
| `Manual` | Nathan approved it as manual-only, with a present-tense reason. | Reconciler, after approval |

- **`Planned` follows the wiki marker, not the story.**
  - When the PO removes a marker at story close, the Test Planner moves that section's cases to `Open`.
  - The Reconciler moves them to `Automated` once tests carry their IDs.
- **A `Planned` case that will replace a live one says so on its status line:** `Planned, replaces DRAG-3.4`. Both cases stay until the build lands; then the old case is deleted.
- **When behavior is removed, its case is deleted.** No tombstone, no "was" text (NZ12). D4 keeps the ID from being reused.
- **Each case has one status.** If part of a case can be automated and part can't, it becomes two cases.
- **A `Manual` reason is a present-tense condition,** for example "its pass depends on a tunable threshold". If the condition stops holding, the case goes back to `Open`.

### D3. Which tests count for a case, and which need approval

*(NZ4)*

- **A test through a public surface needs no approval.** That means:
  - a Playwright UI test (`tests/ui/`);
  - a Playwright API test (`tests/api/`);
  - a server route test that drives the app over HTTP (`server/tests/routes/`).
- **A test of internal code needs Nathan's approval.** This covers a test that calls a client module or a server `lib/` function directly.
  - The Reconciler proposes the mapping in its report, and writes the pointer only once Nathan approves.
  - A later run treats an existing internal pointer as approved.
- **Manual-only needs Nathan's approval,** either one case at a time or for a named category. An example category: "every DRAG case whose pass depends on a pop clock."

**For Nathan:** NZ4 asks for "a Playwright representative, or an approved Vitest one". Counting `server/tests/routes/` as a public surface widens that. Those tests are Vitest, but they go through the HTTP layer against a real database, which is the layer NZ4 cares about. If you'd rather they need approval too, the first bullet drops them.

### D4. Case IDs

*(TP F5, TP F6, TP F9, NZ12, PO F7)*

- **Each case has one ID form, used everywhere, including in its own file.**
  - DRAG and ATT suites switch from in-file `TC-n` to their qualified IDs (`DRAG-5.5`), in headings and tables too.
  - Then a search for an ID finds the case itself, every test that carries it, and every cross-reference.
  - The item-positioning form `TC-<part>.<n>` (`TC-4.3`, `TC-5a.1`, `TC-X.2`) is already qualified, so it stays.
  - A new catalog picks a prefix of its own.
- **IDs are never reused.** Each suite's header carries a `**Next ID:**` line. The Test Planner numbers the next case from it and then advances it. Gaps in the numbering are expected.
- **A case that moves to another suite gets a new ID.**
  - This happens only in the end-of-epic pass (D9).
  - The epic's close-out doc gets an old → new list.
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
  - each case's status: `Open` ↔ `Automated`, and `Manual` after approval;
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

- **Each case names its wiki section** on its status line, in the `wiki <page> §N` form (A1 D3), with one entry per section.
  - When the PO's handoff says a section changed, a search finds every case derived from it.
  - A `Pending PO` case has no `**Rule:**` field. That absence is its marker.
- **A title states the rule, never the bug.** A regression case may say which mistake it guards against, in the present tense ("… so hovering over a covered member never snaps it to the entry workphase"). It doesn't say where or when the mistake was found.
- **No build status** in suite headers or INDEX files. The statuses carry it (D2).
- **No restating the wiki's model.** A preamble holds only what cases need and the wiki doesn't give, such as a shared setup ("the tree of DRAG-4.8"). Tunable values go by the names the wiki uses, never as literals.

**An INDEX file** holds three things:
- the wiki page's name;
- the list of suites, with one line on what each covers;
- a *Not catalogued* list: things the wiki states that the catalog deliberately doesn't test, each with a present-tense reason. For example, the drag's tilt and tween are judged by feel. Things the wiki lists as open questions need no mention.

It leaves out two things:
- **Counts.** Two roles now write statuses, so a hand-kept total would drift with every edit. The Reconciler's report prints the totals on each run.
- **Open-question or "flagged for the PO" lists.** Open questions go in the story plan (D1). Resolved ones are deleted.

**The README** holds everything above, plus:
- the standing exclusions: MCP-only entry points, visual look, and literal values for tunables;
- the priorities;
- the rule that when a test for a case fails, the PO rules on whether the wiki or the code is wrong (PO #9).

### D9. The Test Planner in the story and epic flow

*(A1 D9, A1 D10, NZ4, TP F6, PO F6)*

- **Story planning.** For each Planned passage the story builds, the Test Planner writes or updates its `Planned` cases, and lists their IDs in the story plan's Scope.
- **Story close, step 3.** The Test Planner applies the living-docs handoff:
  - `Planned` → `Open` for sections whose markers came off;
  - cases revised for changed rules, or deleted for removed ones;
  - `Pending PO` cases resolved from the PO's rulings.
- **Sign-off conditions**, in D2's vocabulary. These replace A1 D9's wording:
  - **Every case in the story's Scope is `Automated` or `Manual`,** or is listed by ID in a later story's Scope. A routing counts only once the destination names it, as with audit deferrals (A1 D11).
  - **No case in the story's Scope is `Pending PO`.**
  - **Every `Open` case in the catalog is listed in some story's Scope.** This catches coverage that a story's refactor broke outside its own Scope.
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

### D11. `boards-columns-unsorted`: only once its page is hardened

- **The situation:** the wiki page is a TODO capture, not hardened rules, and the feature has no catalog.
- **The rule:** the Test Planner doesn't derive cases from an unhardened page (the persona's "stop and flag").
- **So:** batch 6 runs only if A2 hardens the page. Otherwise A3 skips it, and the Handoff asks for a roadmap entry.

### D12. Changes to personas, agents and guides

*(TP F1–F3, A1 D2, A1 D12)*

The Test Planner drafts these, and the Architect applies them (A1 D2).

**`test-planner.md`:**
- inputs: the wiki for rules and the story plan for scope (D1). Still no code;
- an inferred case becomes `Pending PO`, with a question in the story plan (D1);
- the Test Planner writes `Planned`, `Open` and `Pending PO`, never `Automated` or `Manual` (D2);
- touchpoints: story planning, story close and epic close (D9);
- point to `docs/test-plans/README.md` instead of restating its conventions;
- drop "every case starts life as ⏳ pending triage", and drop the INDEX counts.

**`test-reconciler.md`:**
- all of D6;
- four new report sections:
  - *Proposed stamps*;
  - *Proposed internal mappings (need approval)*;
  - *Proposed Manual (needs approval)*;
  - *Unbacked → Open*.

**The standards guide** (A1 D2, A1 D3):
- **The test-plan row:** "Owner: Test Planner. The Reconciler writes each case's status and Automation test line. Other roles hand changes off."
- **The reference rule:** "Test plan → test file: a file-level pointer that only the Reconciler writes. The test carries the case's qualified ID in its title."

**`story-done-checklist.md`:** D9's sign-off conditions, and the Test Planner's step 3 duties.

**`epic-done-checklist.md`, the Tests section:**
- the end-of-epic pass, then one Reconciler run;
- "all cases mapped or manual" becomes D9's epic condition;
- the report goes to `docs/audits/`.

**`coder.md` and root `CLAUDE.md`:** one line each. A test that covers a test-plan case starts its title with the case's qualified ID; see `docs/test-plans/README.md`.

## Work, in batches

Each batch ends with its checks, then stops for Nathan's review and commit. Feature batches stop twice.

**Order:**
- **Batches 1 and 2** run together, alongside A2.
- **Batches 3–6 follow, one feature each.** Each starts once A2 has swept that feature's page. A feature's Test Planner pass can overlap the previous feature's Coder step, since they touch different files.
- **Batch 7** closes out.

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

### Batches 3–6: one feature each

Every feature follows the same steps.

1. **The Test Planner's pass.**
   - Re-derive the cases from the swept wiki page: add, revise and delete.
   - Apply D8's layout, and set `Planned`, `Open` or `Pending PO`.
   - Delete superseded cases.
   - Leave the status and pointer lines of `✅` cases for the Reconciler, which rewrites both in step 4.
2. **A proposing Reconciler run.** This run writes only its report, which:
   - maps every case that isn't `Planned` or `Pending PO`;
   - proposes stamps, internal mappings and `Manual`;
   - lists the gaps and the unbacked `✅` cases.

   → **Stop 1.**
   - Nathan reviews the Test Planner's pass.
   - He approves internal mappings and `Manual`.
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
  - the threshold-timed cases (part of DRAG-1.3; DRAG-1.11, 1.14, 1.18, 1.19 and 5.11): propose each as `Manual`, or split it;
  - remove the INDEX's model preamble and its list of flags for the PO.
- **Batch 4, `item-attachment`** (38 cases):
  - derive cases for the six rules the INDEX lists as settled but still without a case;
  - fix ATT-3's stale scope note;
  - reduce ATT-7.6's pointer to a file-level one.
- **Batch 5, `item-positioning`** (87 active cases, 3 superseded):
  - TP F11: re-map TC-4.2–4.5; TC-4.4 gets a test or a routing;
  - re-verify TC-2.5 and TC-2.11 against their corrected text;
  - reduce the 54 pointers that name individual tests to file-level ones;
  - remove the "previous mapping" notes;
  - retitle TC-4.3, whose title names a bug.
- **Batch 6, `boards-columns-unsorted`** (new): only if A2 hardens the page (D11). It gets a new prefix, and its cases are derived from scratch.

### Batch 7: close-out

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
| `.claude/guides/documentation-standards.md`, `story-done-checklist.md`, `epic-done-checklist.md` | 1 | D12 | Test Planner drafts, Architect applies |
| `.claude/personas/coder.md`, root `CLAUDE.md` | 1 | one line each (D5) | Architect |
| `scripts/check-docs/**` | 2 | `case-id`, `--rules` | Coder |
| `docs/test-plans/<feature>/**` | 3–6 | swept | Test Planner; the Reconciler writes the two fields |
| Test files the Reconciler maps | 3–7 | titles stamped; provenance stripped from touched titles | Coder |
| New tests for gaps closed in A3 | 3–7 | new | Coder |
| `docs/audits/test-reconciliation-a3-<feature>.md`, `…-a3-close.md` | 3–7 | new reports | Reconciler |

## Acceptance

- **The rules:**
  - the README is rewritten;
  - D12's changes are applied;
  - Nathan has approved both.
- **The checker:** `case-id` and `--rules` exist and are tested.
- **The catalog:**
  - `check:docs -- docs/test-plans` reports zero hits;
  - no ⏳, ✅, ❌ or ⏸ remains, and no case is `Pending PO`;
  - batch 7's run confirms that every `Automated` case has at least one test carrying its ID;
  - every `Open` case is named by ID in Story 10's roadmap entry or in another named destination;
  - TC-4.4 is either `Automated`, with a test that asserts the snapping rule, or `Open` and routed.
- **The tests:**
  - `check:docs --rules case-id,bare-case-id -- tests server/tests client/src` reports zero hits;
  - the unit and E2E suites pass.
- **No four-pass audit** (A1 D10). A3 adds tests and edits titles, but restructures no code. The new tests fall inside Story 7's audit range (Auditor F8).

## Handoff

- **To the Architect:**
  - **Story 10's roadmap entry:** narrow item 1 to the IDs A3 routed there. Item 5 is done.
  - **`testing-strategy.md`:** it describes the test suite as of Epic 1.5 and predates D3. Rewrite it or retire it. A1 batch 4 only strips its provenance.
  - **A roadmap entry for the `boards-columns-unsorted` catalog,** if batch 6 was skipped.
- **To the PO:** the drag INDEX's flag 14 lists edits owed to the "Placement rules for a Hierarchy" design doc. It goes when the flag list is removed. The design doc is transient, and wiki §7 already carries the agreed wording. Please confirm nothing is lost.
- **To A4 (the Coder):** test comments in the files A3 touched are still A4's.
- **To every later story:** the flow is D9's, with one Reconciler run at close.

## Open questions

`Pending PO` questions raised during the passes are listed here, and are answered before A3 closes.
