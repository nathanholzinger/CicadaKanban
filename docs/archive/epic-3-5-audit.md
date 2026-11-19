# Epic 3.5 — the epic-wide audit

**Type:** audit story: the epic close's code quality audit, in a plan of its own so Story 10 can close without it · **Written:** 2026-11-18 by the Architect, from a conversation with Nathan · **Sequenced:** finish grooming this plan, then close Story 10, then start this audit; before Epic 3.5 closes and before main and the API contract branch merge · **Status:** audit review complete at frozen commit `6962415c`; the fix batch for the 15 required comment corrections is planned, and the optional findings aren't taken (Nathan); Coder session next, after the audit tag

## Goal

The epic-wide audit of Epic 3.5's two features: drag and drop on the board, and the project sidebar's drag work that came with it (Stories 8.7, 8.11 and 8.12). Every story from 1 to 10 had its own audit over its own increment, so this one doesn't re-trace lines. It reads the finished code for what no story's audit could see:
- each file's shape, after about twenty stories added to it;
- duplication between the board and the sidebar, which mirrored the board's features, and within the board, between stories;
- comments, module headers and code-governing instructions that drifted as stories added to them, the drag layer's `AGENTS.md` above all.

**Out of scope:** most of the 602 files the epic touched (D2), Story 10's fix batches (D7), and the rest of the epic-done checklist (Open questions).

The [Epic 3.5 roadmap](epic-3-5-roadmap.md) stays open until this audit closes. It doesn't list this audit, since roadmaps track features (Nathan).

## Decisions

Settled with Nathan on 2026-11-18, including the Auditor's scope adjustments and Nathan's follow-up rulings. The Auditor follows them unless it has a strong objection, which goes to Nathan in Open questions before any instance runs. The Planned split below can be adjusted within D4; the horizontal seam itself is settled.

- **D1. Files, not the range.** At planning, the range from `epic-3-2-complete`, the epic's start, holds 301 commits and 602 files: nearly the whole repo, since tech-debt stories and refactors touched it everywhere. So the audit takes the files of its two features: 57 code files and about 11,000 lines, plus two code-governing instruction files for Drift only. Each is read whole at the frozen end SHA taken after Story 10 closes:

  | Area | Files |
  |---|---|
  | The board's drag layer | The drag files in `client/src/components/workflow/`, and the board components beside it: `BandGuides`, `BoardColumn`, `BoardView`, `CardList`, `HierarchyModal`, `KanbanCard`, `ModalShell`, `StubRows`, `UnsortedBucket`, `cardMetrics` and `dragChrome` |
  | The project sidebar | `client/src/components/sidebar/` |
  | The layer both share, client side | `hierarchy`, `hierarchyPlacement`, `positionedWrite`, `dragTargets` and `isStub` in `client/src/lib/` |
  | The layer both share, server side | `positionResolver`, `itemTree`, `itemHierarchy`, `itemPositionScope` and `attachedCascade` in `server/src/lib/`, and the `items` and `projects` routes |
  | Code-governing instructions, for Drift only | `client/src/components/workflow/AGENTS.md` and root `AGENTS.md`, both outside `docs/` |

  The scope script still builds the scope from `epic-3-2-complete`, so each file comes with the lines the epic wrote and its moved code set aside in those annotations. The config marks all 57 code files and both instruction files read whole; those annotations don't narrow the whole-file reading. Record the actual range and counts when execution starts.
- **D2. What's left out, and why.**
  - **Everything under `docs/`.** Plans, wiki pages, test catalogs, audit reports and scope artifacts are outside a code quality audit's review scope. The orchestrator reads the inputs D9 names to interpret and route code findings; it does not audit those documents. The two instruction files in D1 are outside `docs/` and are the standard Drift scope for code-governing instructions.
  - **Every test file, unit and E2E.** Story 10's checkpoint and closing audits read the drag specs and their helpers in full this month, and unit tests follow their modules.
  - **`scripts/`,** tooling from tech-debt stories.
  - **The files in those directories that aren't drag work:** `DragTuningPanel`, a temporary tool retired once the drag values lock; the board, column and workphase management hooks; and `useBoardLoad`.
  - **Everything else the epic touched.**
- **D3. Three lenses: Duplication & Abstraction, File Responsibility, and Consistency & Drift.** Correctness & Security doesn't run (Nathan). The story audits gave it pass after pass, and it doesn't change meaning at the epic's scale: a bug is the same bug in a story's range as in the epic's. Duplication, a file's shape and drift do change, since they show only with the whole in view.
- **D4. Duplication & Abstraction runs on horizontal seams** (Nathan). This is settled. The story audits split the pass vertically, by feature or area, which puts the board's copy and the sidebar's copy of one job in different readers, where neither can see the duplication. Here each instance takes one job across both features: card movement beside project movement on the client, and items beside projects on the server. The shared client layer goes in every client job instance as well, so a one-off sits beside the shared helper it could call. `projectTreeUtils.ts` goes in gesture as well as writes: its tree, gap and release adapters need to sit beside the board's placement adapters. The script allows one group in several instances; the merge folds any finding on a shared file that more than one instance reports. The jobs in the Planned split can change; the horizontal seam can't.
- **D5. Drift and File Responsibility can be split any way.** Drift's checks are local: a comment against the code under it, and an `AGENTS.md` claim against the file it names. File Responsibility judges each file on its own, with the modules a split would move code into nearby. Their seams are the Auditor's, at the usual instance size.
- **D6. A map instance, for duplication across jobs.** One more Duplication instance first reads each client file's module header, imports, exported and private helper signatures, and skims its main responsibility blocks. It nominates comparisons across the jobs' lines, including logic inside hooks and private functions. The orchestrator adds comparison files to the relevant job scopes before those instances start; a pair no job covers gets a targeted follow-up that reads both files in full. A nomination alone is not a finding. The script doesn't build the map's scope, so the Auditor writes it by hand, listing the 50 client code files. All instances still run cold, without this plan or another instance's findings.
- **D7. Story 10's fix batches wait for the post-merge audit** (Nathan). Their 18 test files are outside D2, so this audit doesn't read them. The current directory `AGENTS.md`, including its instruction correction, is already in D1's Drift scope. The post-merge audit (Handoff) reads the test fixes with this audit's fixes and what the merge changed, so all the code written after an audit is read together. Its explicit base preserves this carry-forward even though this audit's tag will be newer.
- **D8. Names and the tag.** The report is `docs/audits/code-quality-audit-epic-3-5.md`, and the scope folder `docs/audits/epic-3-5-scopes/`. Nathan tags `epic-3-5-audited` on the commit that closes the audit's review, before the fix batches, as for every audit. The post-merge audit names its own base (Handoff).
- **D9. Where findings go.** The Architect writes the fix batches into this plan, and Coder sessions work them, as in Story 10's close. A batch that changes the drag layer's code runs `npm run test:e2e` as well as the gate (audit-workflow §8). PO rulings, and items for other roles, go in this plan's Open questions. Deferrals go to [MVP Deferrals](../mvp-deferrals.md), or to the Inbound deferrals of the plan they're routed to. The merge step reads this plan, MVP Deferrals and the Epic 3.5 roadmap, and a story plan from the archive only where a finding turns on that story's ruling.
- **D10. Groom, close Story 10, then audit** (Nathan). Story 10 officially closes once this plan is fully groomed and planned. No audit instance starts before that sign-off. This audit adds no end-of-epic coverage review: Story 10 already owns the large end-of-epic test-plan, reconciliation and code-coverage effort. Its recorded results and routed shortfall stand; this audit doesn't re-certify them. Other epic-done work stays separate (Open questions).

## Planned split

The config is `docs/audits/epic-3-5-scopes/config.json`, with `projectTreeUtils.ts` shared between Duplication's gesture and writes instances. Sizes below count whole files approximately on the planning tree, including comments and blanks; refresh them against the frozen end SHA before execution. Each pass also has an `out` instance holding every other file in the range, since the script needs every file to have a reader. It's never spawned, and it's the only Correctness instance. Because those placeholders satisfy the script's assignment check, the Auditor separately checks the selected manifest against the instances that will actually run: every one of the 57 code files has a reader in each of the three lenses, and both instruction files have a whole-file Drift reader. Nothing under `docs/` is assigned to a running instance.

| Pass | Instance | Holds | Files | Whole lines, approx. |
|---|---|---|---:|---:|
| Duplication | gesture | `useBoardDnd`, `descendantsProjection`, `descendantsSection`, `placement`, `modalPlacement` · `useProjectDragReorder`, `projectTreeUtils` · the shared layer | 12 | 2,830 |
| Duplication | writes | `useItemManagement`, `itemWriteReconciliation`, `dragRequest`, `itemListOps` · `useProjectCollection`, `projectTreeUtils` · the shared layer | 11 | 1,910 |
| Duplication | rows | `StubRows`, `KanbanCard`, `dragChrome`, `CardList`, `BandGuides`, `cardMetrics` · `SortableProjectRow` · the shared layer | 12 | 2,300 |
| Duplication | targeting | `popSession`, `dragBands`, `dragCollision`, `dragRegions`, `dragStructure`, `dragClassification`, `dragOverlayGeometry`, `dragTuning` · the shared layer | 13 | 2,490 |
| Duplication | shells | `BoardView`, `BoardColumn`, `HierarchyModal`, `ModalShell`, `UnsortedBucket`, the contexts, `forcedStop`, `useForcedStop`, `useSnapTween`, `usePendingGhostGuard`, `useLatest` · the sidebar's width, resize and collapse hooks · the shared layer | 23 | 2,480 |
| Duplication | server | The five server lib files, and the `items` and `projects` routes | 7 | 1,920 |
| Duplication | map (D6) | The client files' headers, imports, signatures and responsibility blocks | 50 | — |
| File Responsibility | gesture-targeting | Gesture's and targeting's files | 14 | 3,810 |
| File Responsibility | writes-shared | Writes' files and the shared layer, including `projectTreeUtils` | 11 | 1,910 |
| File Responsibility | rows-shells | Rows' and shells' files | 25 | 3,410 |
| File Responsibility | server | As for Duplication | 7 | 1,920 |
| Drift | targeting, gesture, writes, rows, shells, server | One job each, with `projectTreeUtils` and the shared layer in writes | 6 to 18 each | 1,610 to 2,000 each |
| Drift | instructions | The two `AGENTS.md` files, both outside `docs/` | 2 | 660 |

That's 18 initial instances: 7 Duplication, 4 File Responsibility and 7 Drift, plus any justified full-pair follow-ups from the map. Keep the four File Responsibility instances: the largest reads about 3,800 lines structurally, and rows-shells about 3,400. Split one only if its actual reading load calls for it.

The session has four concurrency slots including the orchestrator, so at most three subagents run at once. Nathan expects several usage windows if needed. Run the map first, using other slots for independent Drift or File Responsibility instances, then keep filling free slots from the queue. Give periodic progress notes naming completed instances, active instances and newly started ones. Record the frozen SHA, final scopes, task identities, status, result paths and resume points in `execution.json` in the scope folder. Preserve completed results across a usage limit and resume interrupted instances from their recorded stopping points; don't restart completed work or widen the frozen scope on a continuation.

## Work

1. **After Story 10 signs off, freeze and build the scope (the Auditor).** Record the explicit end SHA, `epic-3-2-complete..<end-sha>`, its commit count and any uncommitted work left out. Build with `npm run audit:scope -- --base epic-3-2-complete --end <end-sha> --out docs/audits/epic-3-5-scopes --config docs/audits/epic-3-5-scopes/config.json`. Change the config within D4 if another split serves better, and save it in place: the script replaces only the `scope-*.md` files. Write the map instance's scope by hand, and verify the selected manifest against actual readers as above.
2. **Run the instances (the Auditor),** at most three at a time, every instance but the `out` ones. Run the map before the horizontal job instances, update their comparison scopes, then read any remaining nominated pairs in full through targeted follow-ups. Track results and interruptions in the resume record and keep reporting progress as slots turn over.
3. **Merge and report (the Auditor),** by audit-workflow §5 to §7. Nathan reviews the report, and tags `epic-3-5-audited`.
4. **Plan the fix batches (the Architect),** in this plan.
5. **Work them (Coder sessions),** each with `/code-review`, the gate, `npm run test:e2e` where it changes the drag layer's code, and a stop for review and commit.
6. **Close.** Every required finding has a disposition (audit-workflow §9), and this plan and the report move to `docs/archive/` at the epic's close.

## Audit results

All 18 cold instances completed on `epic-3-2-complete..6962415c15df41434b557934ce4cbd106c1ab4a9` (302 commits). All 57 code files received the three lenses and both instruction files received Drift. All eight map nominations received full comparisons in the existing job instances. A usage limit interrupted three Duplication instances; the same tasks resumed, preserving completed work.

The [report](../../audits/code-quality-audit-epic-3-5.md) holds **15 required comment corrections (#1–#15)** and **five optional structural findings (#16–#20)**. No required consolidation or file split was established. The orchestrator retraced every required claim; the comment corrections preserve existing behavior, including the frozen workphase reconciliation and forced-stop cue. No new PO decision, coverage review or deferral destination is needed.

The Architect owns the next step: plan fix batches here, choose whether any optional work is worthwhile, and follow the existing review, gate, E2E and review/commit stops. The Auditor has not authored batches or changed source/tests. Required dispositions stay open until implemented, routed or rejected. Nathan has not yet applied the audit tag in this session. The [scope packet](../../audits/epic-3-5-scopes/README.md) retains the verified manifest, scopes, raw results and resume record.

## Audit fix batch

The Architect writes the batch (`.claude/guides/audit-workflow.md`, "Working Fix Now"), and a Coder session works it. Nathan took none of the optional findings, #16 to #20, and the informational #21 and #22 ask for nothing (2026-11-18). So there's one batch, of drift only, and it changes no code: every fix corrects a comment to describe the code as it is. It runs after Nathan commits the report and tags `epic-3-5-audited` (D8).

**Batch 1 — a Coder session: #1 to #15.** 16 files, 3 server and 13 client, comment lines only. Each finding's fix is in the [report](../../audits/code-quality-audit-epic-3-5.md#fix-now), with the code it's checked against.
- **Server:** #1 and #4 in `positionResolver.ts`, #2 in `itemPositionScope.ts`, #3 in `routes/projects.ts`. #2 describes the terminal flag as the code still reads it, though the Quick Items epic removes it.
- **Board drag layer:** #5 and #6 in `dragCollision.ts`, #7 in `dragStructure.ts`, #12 in `CardList.tsx`, #13 in `KanbanCard.tsx`, #14 in `useLatest.ts`. #6 keeps the reason the neighbor and gap readers are separate, and corrects only the sentence about Free descendants. #7 keeps the clipping, and keeps a reason only if it's the real one. #14 describes the passive effect, and doesn't switch it to a layout effect.
- **Writes:** #8 at all six of its locations together, in `useProjectCollection.ts`, `hierarchy.ts`, `projectTreeUtils.ts` and `useProjectDragReorder.ts`; #9 in `itemWriteReconciliation.ts`; #10 in `useProjectCollection.ts`; #11 in `useItemManagement.ts`.
- **Frozen areas:** #9 sits in the out-of-order write reconciliation and #15 in the forced-stop cue (`ForcedStopContext.ts`, `useForcedStop.ts`), both Built and frozen in [MVP Deferrals](../mvp-deferrals.md#built-and-frozen). Correct the words only: no value-equality filter for #9, and no new rule, test or variant for either.
- **If a comment can't be made true without changing code,** or a finding doesn't hold when you retrace it, leave that comment, change no code, and report it to Nathan.
- **Check:** `/code-review`, then `npm run check`. Then confirm that only comment lines changed: `git diff -U0 -- '*.ts' '*.tsx' | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' | grep -vE '^[+-]\s*(//|/?\*|\{/\*|$)'` prints nothing, and anything it does print gets a look by hand. No E2E run: nothing changes behavior (audit-workflow §8 runs `npm run test:e2e` where a batch touches behavior). No test file changes, so there's no Test Reviewer pass, no Reconciler write and no catalog effect.
- **Stop** for Nathan's review and commit.
- **Done** when all 15 findings are fixed or carry Nathan's disposition; then this plan and the report move to `docs/archive/` at the epic's close (Work step 6).

## Acceptance

- Story 10 signed off before any audit instance started, and the report records the frozen end SHA.
- The report covers all 57 code files with the three lenses and the two instruction files with Drift only; no file under `docs/` is audited. Its Duplication job instances ran on horizontal seams, including `projectTreeUtils` in gesture and writes. Any map nomination reported as a finding received a full comparison read.
- Every required finding has a disposition, and every route has landed where it's named.
- After the last fix batch, the gate passes. A full `npm run test:e2e` runs too if any batch changes behavior; the planned batch changes comments only (Audit fix batch).

## Open questions

- **Resolved, Nathan, 2026-11-18 — no additional epic-end coverage review.** Story 10 already owns the end-of-epic test effort, so this audit adds no coverage review or fresh certification. The 80% attempt, its shortfall and the routed skipped tests keep their existing dispositions.
- **Resolved, Nathan, 2026-11-18 — sequence.** Finish grooming and planning this audit, then close Story 10, then begin the audit. Grooming this plan does not launch any instance or sign off Story 10.
- **For Nathan: the rest of the epic-done checklist.** This plan covers the audit only. The checklist's other items, and where each stands:
  - `npm audit fix` in `server/` and `client/`, the MCP tools and the Bruno collection for changed endpoints, and the epic's TODO comments;
  - the `epic-3-5-complete` tag, and the ✅ in the MVP roadmap.

  Which of these run, and which does the MVP waive? These are epic-close decisions outside this audit; they don't add audit passes or repeat Story 10's test effort.

## Handoff

**The post-merge audit (proposed).** After Story 10 and the epic close, main and the API contract branch (`api-contract-migration`) merge, in one direction or the other. Nathan wants one audit after that, over the code written after audits on main and over what the merge itself changed. This is a proposed scope, for its own plan once the merge's direction is chosen.

- **Its base is `epic-3-5-story-10-audited`, named explicitly.** The newest `*-audited` tag will be this audit's, and a base there would skip Story 10's fixes.
- **The fixes on main:** every code change from that base to main's last commit before the merge. That's Story 10's batches A to C (18 test files) and this audit's fix batches, in the usual changed-lines scope.
- **The merge, in four parts:**
  1. **Its resolution:** `git show --remerge-diff <merge commit>`, each hunk where the committed merge differs from the merge git would have made on its own. That's every conflict resolution, and every edit made during the merge. It's read in full.
  2. **The files both sides changed since they split,** even where they merged cleanly, read whole in the merged result. On 2026-11-18 those are `server/src/lib/itemHierarchy.ts`, the `items`, `projects` and `workflows` routes, and `server/package.json`.
  3. **The contract seams,** where one side depends on what the other changed with no file in common. The branch's schemas, contract tests and client API wrappers (`server/src/schemas/`, `server/tests/contracts/`, `client/src/api/` and `client/src/types.ts`) describe the routes as they stood when it split, on 2026-10-29. Main has changed eight route files since. Each route main changed is checked against its schema and contract, and each client call main changed or added against the branch's wrappers. The gates catch a mismatched type; the audit looks for what type-checks and still disagrees, such as a field a schema accepts that the route now refuses.
  4. **The commits after the merge that fix it,** up to the audit's start.
- **Its lenses return to the standard audit rules** (Nathan): all four passes run over the selected fixes and merge scope. Correctness & Security reads the carried-forward fixes and tests as well as merge integration. Drift reads code-governing instructions and comment/import-only changes too. Duplication & Abstraction compares the fixes and merged code with existing helpers and counterparts. File Responsibility reads files marked whole under the standard rules, including files whose fix batches changed their shape even when only one side touched them. Files both sides changed are read whole as above. This epic's three-lens exception doesn't carry forward. Horizontal Duplication scopes may be useful again, but aren't required for the post-merge audit; its planner chooses the split. No general workflow change is decided here.
- **Out of its scope:** the branch's own code beyond those seams. It has its own audit trail (`m1-foundation-audited`), and its epic's audit covers the rest.
- **The direction doesn't change the scope.** Main into the branch or the branch into main, it's one merge commit with two parents. The direction changes which side git shows as the first parent, not what's read.

## Amendments

- **2026-11-18 — Scope grooming approved (Nathan, applied by the Auditor).** Keep 18 initial instances. Add `projectTreeUtils.ts` to Duplication's gesture comparison while retaining it in writes; broaden the map to imports, private signatures and responsibility blocks, run it first, and require full reads before reporting its nominations. Count whole-file workloads, distinguish 57 code files from two instruction files outside `docs/`, and check actual readers separately from unspawned `out` placeholders.
- **2026-11-18 — Execution and sequence clarified (Nathan, applied by the Auditor).** Everything under `docs/` stays outside code quality review. Freeze an explicit end SHA after Story 10 signs off; use up to three subagents, periodic completion/start updates and a persistent resume record across as many usage windows as needed. Grooming precedes Story 10's close and does not begin the audit. No additional epic-end coverage review is run.
- **2026-11-18 — Post-merge audit returns to the standard four passes (Nathan).** Keep the explicit Story 10 audited base so its fixes carry forward. Apply the ordinary pass-selection and whole-file rules to the fixes and merge scope; horizontal Duplication seams remain a planning option, with no standing workflow change decided now.
- **2026-11-18 — Audit started after Story 10 closed (Auditor).** Nathan confirmed the close and authorized execution. The working tree was clean at `6962415c15df41434b557934ce4cbd106c1ab4a9`; the exclusive range from `epic-3-2-complete` holds 302 commits. Generated scopes have verified actual readers for all 57 code files and the two instruction files. The map and independent File Responsibility/Drift instances start first; `docs/audits/epic-3-5-scopes/execution.json` records tasks, results and continuations. No source or test change.
- **2026-11-18 — Review complete (Auditor).** All 18 cold instances and all eight full map comparisons completed at frozen `6962415c`. The report records 15 required comment corrections and five optional structural findings, with no required consolidation or split. Source/tests, wiki and test catalog are unchanged; no new coverage review or behavior ruling was made. The Architect owns fix planning, and required dispositions remain open.
- **2026-11-18 — Fix batch planned (Architect).** Nathan took none of the optional or informational findings, so batch 1 holds the 15 comment corrections. With no behavior change, Acceptance runs a full E2E only if a batch changes behavior (audit-workflow §8), where it had run one after the last batch regardless.
