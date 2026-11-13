# MVP Test-Process Trim

**Type:** tech-debt story. It changes how the test work is run, not what the app does, so it closes by the gate and its own acceptance, with no audit · **Written:** 2026-11-13 by Claude, from a conversation with Nathan about Epic 3.5 Story 10's cost · **Sequenced:** batches 1 and 2 at once; batch 3 after Story 10's batch 4d is committed (`e4f34b9a`), before 4e starts · **Status:** batches 1–3 and the Planner's handoff applied, and not committed. The Open question after 4e remains

## Goal

Keep the independent checks: the code-blind Planner, the Test Reviewer that doesn't read app source, and the cold Reconciler. Soften what they add. Story 10 has cost far more than expected, and the cost comes from three places:

- **Later passes that keep finding "improvements."** A second or third reviewer pass, with its scope widened each time, finds more to add, and nothing in the process can cut. Gaps have to be fixed, and cost notes are optional.
- **Implementation choices that become rules.** Story 8.4's D3 proposed `role="status"` for the forced-stop cue. The Coder's handoff listed it as a behavior decision, the PO wrote it into wiki board-drag-interaction §10, the Planner made DRAG-6.17 from it, and the QA Engineer had to prove it. Nathan never ruled that screen reading was wanted. Each role faithfully passed the last one's output along.
- **Variant matrices the Then never asked for,** and geometry assertions about how something looks, which are the flaky ones.

The Story 10 batch doc had also grown to about 2,580 lines, and every session that opens it pays to read them.

**Out of scope:**
- Changing a case, a test or the app. Story 10's batches apply the new rules as they run.
- The format of the decision lists Nathan approves. Nathan takes this on himself, and follows up on any item he can't rule on.
- DRAG-6.16's alignment with the text-only banner ruling, which Nathan routes himself.
- The Planner's edge-hunting, apart from the areas the deferrals catalog rules out.

## Decisions

All by Nathan, 2026-11-13.

**D1. Shipped doesn't make it a rule.** A behavior decision in a handoff stays implementation, with no wiki rule, no case and no test, unless Nathan rules it in. When a question would send work back to the PO or the Coder, it lists "defer" and "leave as shipped, no rule" among its options, next to "change it." The main safeguard is Nathan's own review of these recommendations. The docs make the default visible.

**D2. A catalog of what's ruled out of the MVP:** [`docs/planning/mvp-deferrals.md`](../mvp-deferrals.md), standalone. It's not in the roadmap, which tracks features only and which the test agents don't read. Root `AGENTS.md`, the personas and the test agents point at it, under the documentation standards' exception for "the place where open work is tracked." It lists the areas ruled out, what's built and frozen, and the stories that hold deferred findings.

**D3. A confirming pass finds nothing new.**
- **Test Reviewer:** the first pass reviews in full, and widens its scope to every ID in the changed files. A later pass checks only the earlier pass's gaps and the changes made for them, and may report a regression. It raises nothing new. A third pass runs only when Nathan asks.
- **Reconciler:** one run, plus at most one follow-up, which applies Nathan's approvals and raises nothing new.

Reason: the over-reach mostly comes from the later loops, where a reviewer feels it has to find something.

**D4. The reviewer's cost verdict carries real weight.** Every test that shows one of the testing guide's cost signals gets a verdict: Keep, Simplify, Cut or Manual. Flakiness risk and assertions about looks are signals. The verdict carries the same weight as a gap, and Nathan decides on it. It never drops a clause of a Then.

**D5. Reconciler candidates are deferred by default.** A candidate new case, and a quality concern about a test the Reconciler still counts as covering its case, go to the deferrals catalog's destination. They never go into the current scope. For Story 10, that's [Drag Automation Deferrals](drag-automation-deferrals.md).

**D6. Story 10 runs four stops, for at least batch 4e.** Stops 4 and 5 merge into "Frozen validation and closure." If the freeze holds, the same session spawns the Reconciler. The change that mattered most against snowballing was that the QA Engineer can't spawn the Coder, and D3 adds to it. If Nathan rarely overrules the Stop 1 proposal in 4e, Stops 1 and 2 may merge as well (Open questions).

**D7. One test per case, as a standing rule.** A variant the Then names is part of the Then, and gets covered, usually as a loop over shared setup. A variant it doesn't name gets no test. It's listed as a suggested variant, to revisit after the smoke suite. A missing unnamed variant is never a gap. This lives in the testing guide, so it outlasts Story 10.

**D8. Story 10's D13 becomes a standing rule, extended to geometry about appearance.** A measurement that only says how something is drawn, such as an exact height, width, offset or alignment, goes to manual with the paint. It must not restrict a test of relative placement, which is behavior. For example, Card X placed between A and B with the highlight under A, not above B. The same goes for the ghost between two rows, and the banner at the top of the board. An existing geometry assertion is cut only on cost or stability, like any test. Written into the testing guide's "What stays manual."

**D9. Story 10's docs are split.**
- The batch doc becomes an index, with one file per remaining batch (4e to 4h).
- 4a to 4d's closed history moves, word for word, to a log file that no session reads by default.
- 4i and 4j move, word for word, to [Drag Automation Deferrals](drag-automation-deferrals.md), as raw catalogs for grooming that story.
- Story 10 closes after 4h. 4i's and 4j's cases and skips are routed there under its D10.

## Work, in batches

1. **The catalog and this plan:** `mvp-deferrals.md`, the placeholder [Drag Automation Deferrals](drag-automation-deferrals.md), and this plan.
2. **Process edits** (D1 to D8). Files are in the Code map. Living docs name no story or date. A link from a living doc to a `docs/planning/` file carries the checker's `transient-link` ignore marker.
3. **Story 10 restructure** (D6, D7, D9). It starts only once 4d is committed and nothing else is editing Story 10's docs:
   - `story-10-batch-4a-4d-log.md` takes, word for word: the 4a to 4d batch sections, the checkpoint after 4a, 4d's closing Results packet, the whole Review log, the batch doc's Amendments, and 4c's and 4d's Open questions;
   - `story-10-batch-4e.md` to `4h.md` each take their batch's section, plus empty Proof list, Suggested variants, Results, Open questions and Review log sections. A batch file is that scope's plan for the Reconciler's inputs;
   - Drag Automation Deferrals takes 4i and 4j word for word, their Open questions included;
   - `story-10-batches.md` becomes an index: how to read it, the four stops, the standing rules, the batch table with links, the shared looks, the skips, what's outside the story, the standing Open questions, and fresh Amendments;
   - the Story 10 plan is amended: the Goal (closes after 4h, with 4i's and 4j's skips routed), D5 (four stops), D13 (the guide is the later word), a new D14 (one test per case), and Phase 4's list.

## Code map

| File | Batch | Change |
|---|---|---|
| `docs/planning/mvp-deferrals.md` | 1 | New: the catalog (D2) |
| `docs/planning/tech-debt-stories/drag-automation-deferrals.md` | 1, 3 | New placeholder; takes 4i and 4j in batch 3 (D9) |
| Root `AGENTS.md` | 2 | Docs and Process: points at the catalog (D2) |
| `.claude/guides/testing-strategy.md` | 2 | "How many tests a case gets" (D7); two cost signals (D4); the look rule in "What stays manual" (D8) |
| `.claude/agents/test-reviewer.md` | 2 | Confirming passes (D3); unnamed variants aren't gaps (D7); cost verdicts (D4); a Deferred heading (D2) |
| `.claude/agents/test-reconciler.md` | 2 | One run and one follow-up (D3); candidates and quality concerns deferred (D5) |
| `.claude/agents/test-planner-desk.md` | 2 | A row in a ruled-out area (D2) |
| `.claude/personas/qa-engineer.md` | 2 | Confirming briefs (D3); routing options (D1); cost verdicts (D4); one test per case (D7) |
| `.claude/personas/product-owner.md` | 2 | Handoff decisions and deductions (D1) |
| `.claude/personas/coder.md`, `.claude/guides/story-plan-template.md` | 2 | Handoff and Open questions wording (D1) |
| `.claude/personas/test-planner.md` | 2 | Edge cases skip ruled-out areas (D2) |
| Story 10's plan and batch doc; the new log and batch files | 3 | D6, D7, D9 |

## Acceptance

- `npm run check` passes after each batch. Its `check:docs` finds no unmarked transient link, no ID or date in a living doc, and no bad section pointer.
- Every new `docs/planning/` reference in `AGENTS.md` and `.claude/` sits under an ignore marker.
- Batch 3's moves are word for word. A line-by-line comparison shows every line of the old batch doc in exactly one new file, apart from the index's rewritten sections.

## Open questions

- **For Nathan, after batch 4e:** merge Stops 1 and 2, if the Stop 1 proposal drew few overrules (D6).

## Handoff

- **For the Test Planner** (`docs/test-plans/README.md`, "Which tests count, and what's manual"). Applied 2026-11-13:
  - the look rule as the testing guide now states it, beside "one status per case" (D8). This is the README part of Story 10's Phase 5 D13 item;
  - the one-test-per-case rule, with "a variant the Then doesn't name isn't a gap" (D7).

## Amendments

- **2026-11-13 — `Manual` is a recommendation, not a ban (Nathan).** "Never propose `Manual`" was too strong. Like an internal mapping, a `Manual` call is a valid suggestion that goes through Nathan's approval. The Test Reviewer's held-off section and cost verdict, and the QA Engineer's "Weighing a Surface Test" and "Holding Off", now say it may be recommended, Nathan approves it, and a Planner session or the Reconciler applies it. The desk still answers reading questions only.
- **2026-11-13 — Batch 3 applied.** The batch doc's 2,583 lines were split word for word by a script that checked the partition. Every line but the title went to exactly one file, and each part was verified whole on disk. Two placements differ from the plan:
  - **Open questions:** the 4c Stop 5, 4d Stop 2 and 4d Stop 5 blocks went to Drag Automation Deferrals, not the log, because 4j's entries cite them by name. 4c's Stops 1 and 2 and 4d's Stop 1 went to the log.
  - **Links:** the links that the split broke were repointed. One went from the log to 4j's anchor, and the 4b, 4c and 4d proof plans and the Descendants highlight-cue story now point at the log. Links to the archived `e2e-parallel-workers.md` and `testing-roles-refactor.md` were broken before the split, and stay as they were.
- **2026-11-13 — The Planner's handoff applied (Test Planner).** `docs/test-plans/README.md`'s "Which tests count, and what's manual" gained three bullets:
  - **The look rule (D8)** sits after the Planner's-judgment `Manual` bullet, as two: how something looks is `Manual` in one shared case per look, and a case holding a look and behavior becomes two; behavior is never a look, with the guide's relative-placement examples. They point at the guide's "What stays manual" for what counts as a look, and restate none of its list of looks.
  - **One test per case (D7)** is the section's last bullet. It adds one line the handoff didn't spell out: a rule that must hold across variants says so in its _Then_, since a named variant is part of the _Then_ and an unnamed one never is.
  - **Placement:** "One status per case" sits in "Writing a case", not in this section, so the look bullets sit beside the section's `Manual` bullets and cite it by name. No case, test or other doc changed, as the plan's Out of scope has it. `npm run check:docs` and the Prettier check pass.
- **2026-11-13 — For Nathan, noticed in batch 3:** the index's standing entry on DRAG-6.5's response-order evidence ("before 4d's freeze") looks settled by 4d's retirement of that timed test. It's kept word for word until Nathan removes it.
