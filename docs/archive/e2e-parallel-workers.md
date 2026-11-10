# Parallel E2E Workers

**Type:** tech-debt story. It changes how the Playwright suite runs, not what the app does, so it closes by the gate and its own acceptance, with no audit · **Written:** 2026-11-09 by the Architect, from the [E2E run time round table](../round-tables/e2e-run-time-and-smoke-suite.md) (Proposal 2a and the responses to it) · **Sequenced:** after Epic 3.5 Story 10's batch 4b closes and the [Testing Roles Refactor](testing-roles-refactor.md)'s batch 2 lands, since its QA Engineer validates batch 3, and before 4c's Stop 1. Story 10 waits for it · **Status:** batch 3 accepted by Nathan with the recorded flaky failures deferred to Story 10. Five workers are adopted as the default after the extended trial. Batch 4's docs are written, for Nathan's review (Batch 4 Results). The catalog owner's DRAG-3.16 handoff remains.

## Goal

Run the Playwright suite on several workers at once, each against its own server, client and database, so a full run takes a fraction of today's time. Which tests run, and what they assert, don't change. A one-worker mode stays.

**Why now:**
- The last full run took 11.3 minutes for 402 tests, one test at a time. Three days earlier it was 4.1 minutes for 264 tests, and batches 4c–4h are still to come. The round table's "Why now" has the breakdown.
- Story 10 runs the suite many times per batch, and its D2 bar adds twenty repeats of every drag test a batch adds or changes. Batch 4a's repeat runs took 14.0 and 34.2 minutes. Parallel workers speed those up too, which a smoke suite wouldn't.
- The ceiling is good. In the Coder's measurement the summed test time was 671 seconds against 678 seconds of wall time, so nearly all the cost is in the tests. The largest spec file is 105 seconds, well under a third of the total, so files should balance across three workers. The Coder's best-case estimate is about 4 minutes.

**Out of scope:**
- The smoke suite, area tags and tiers. They're the [E2E Smoke Suite](e2e-smoke-suite.md) story, after Story 10.
- A shorter test-only timer profile (round table 2b). It's a separate experiment, groomed with the smoke suite.
- Serving the client as a built bundle.
- `fullyParallel`. Tests within a file keep running in order on one worker.
- The trace setting and the retry count, which stay as they are.
- Two E2E runs at the same time on one machine.

## Decisions

Proposed, for Nathan's approval. They're numbered 1–9 so they don't read as Story 10's D-numbers; Story 10's decisions are always named as "Story 10's D2".

**1. One stack per worker slot.** A slot is Playwright's parallel index, 0 to N−1 (`testInfo.parallelIndex`, or `TEST_PARALLEL_INDEX` in a worker's environment). When a worker restarts after a failure, the new process keeps the same parallel index, so it reconnects to the same stack. The worker index, which changes on a restart, isn't used. The browser, the API helpers and the reset all take their address from the slot.

**2. Ports and files come from a block clear of the existing stacks.** Dev uses 3001/5173, today's E2E stack 3002/5174, and the deep stack 3003/5175, so slot+1 numbering from 3002 would collide with the deep stack. Proposed: server `3010 + slot`, client `5180 + slot`, database `server/data/test-<slot>.db`. The Coder may choose other numbers if these are taken; the rule is that the block stays clear of all three stacks, so dev and deep sessions can stay open during an E2E run.

**3. The worker count comes from one environment variable.** `E2E_WORKERS` sets `workers` and starts that many stacks only; a one-worker diagnosis doesn't pay for three. Its default is set by the trial (batch 3), starting from 3. `fullyParallel` stays `false`, so whole files are spread across workers. A script such as `test:e2e:serial` runs one worker.

**Adopted default (Nathan, 2026-11-10): five workers.** Five replaces the initial three-worker default after the extended trial: a 3m 25.1s full-suite median, 38.2s (15.7%) faster than four, with no newly observed failing test identity or mode. Six is dropped because it saves only another 2.7s. Re-evaluate when the smoke suite is available: E2E runs should take a smaller share of work outside Story 10, and capacity for simultaneous work may matter more. Revisit sooner if failures or contention change. The recorded DRAG-7.10 and DRAG-3.16 failures are accepted for runner adoption so Story 10 can use the faster suite. DRAG-7.10 remains active and is fixed in batch 4c. Both parameterized DRAG-3.16 tests are temporarily skipped and return in batch 4h alongside the six legacy skips. This is a bounded exception to runner stability/contention acceptance, not a claim that the measured trial was green or a waiver of Story 10's D2 bar.

**4. A stack is never reused or moved.** The pool sets `reuseExistingServer: false`, and each client fails on a taken port instead of picking another (Vite's `--strictPort`). Otherwise a leftover server on the wrong database, or a client on a port nobody routes to, could quietly break the isolation. One consequence: two E2E runs can't share the pool at once, and the testing guide says so.

**5. The E2E server runs without watch, landed first at one worker.** Today's server command is `tsx watch src/index.ts`. Under N workers that's N watchers, each restarting its server if a file under `server/src` changes mid-run. The Coder also saw an unexplained pair of failures in a run while editing files. This lands as its own step, at one worker, before the parallel change, so each change is measured on its own. The client stays on Vite's dev server.

**6. Everything else holds still during the trial:** test bodies, assertions, timer profiles, retries (0), the trace setting, the test list and the skips. With one change at a time, a failure can be attributed.

**7. Every run leaves a JSON report beside the HTML one.** That gives per-test durations from every run, for this trial and for the smoke suite's budget later. The JSON file can be named per run, so a targeted re-run doesn't overwrite a full run's evidence.

**8. Runner acceptance is kept separate from Story 10's case certification.** The two answer different questions: does the new runner isolate tests and run them reliably, and does each case still prove its whole Then. For Story 10's D2, approved by Nathan. D2 is Story 10's bar for its flaky drag specs, not a process for other stories:
- the twenty-repeat evidence earned on one worker stands for the tests and snapshots it was earned on, and isn't re-earned;
- this story's contention check (Acceptance 5) is what carries that evidence onto the new runner;
- from 4c on, D2's twenty repeats and each batch's final full run use the adopted worker count, so the repeats also run under load, which a one-worker repeat never did;
- if no worker count passes acceptance, the suite stays on one worker, D2 is unchanged, and the smoke suite is brought forward.

It's recorded in Story 10's D2.

**9. The Coder builds the runner, including its plumbing in `tests/`, and the QA Engineer validates it in a session of its own.** The runner's routing chain runs from the config through `tests/helpers/api.ts` and `tests/fixtures.ts` to the teardown. If it were split across two sessions by file, neither session could test it alone. The `tests/` changes are an address and a cleanup, not test content: no expected value changes. The Playwright config and `tests/` support are the QA Engineer's, so this needs Nathan's grant.

## Work, in batches

Each batch ends with the gate and a stop for Nathan's review.

**Batch 1 — the server without watch, and the JSON report (Coder).** Still one worker, on today's ports.
- The E2E server command runs `src/index.ts` without `watch`.
- The pool doesn't reuse a running server, and the client takes `--strictPort` (decision 4).
- Add the JSON reporter (decision 7).
- **Check:** the gate; then `--list` matches batch 4b's close, and one full run at one worker passes with the same skips.

**Batch 2 — the slot pool (Coder).**
- `playwright.config.ts` builds one server and client pair per slot from `E2E_WORKERS`, each with its own port and database (decisions 1–3).
- `tests/helpers/api.ts` builds `API` from the slot. Every helper and API spec already builds its URLs from it. The ten `tests/api/` specs import `test` from Playwright directly rather than from `tests/fixtures.ts`, so the slot reaches them through `API`, not through a fixture.
- `tests/fixtures.ts` overrides `baseURL` per slot, so a browser opens its own slot's client. All 35 UI specs import `test` from it.
- `tests/global-teardown.ts` removes every slot's database and its WAL and SHM files. Its Windows behavior is checked: the server may still hold the file when teardown runs.
- Root `AGENTS.md`'s "Running the App" line for the E2E stack is updated in the same change.
- **Check:** the gate; `--list` is unchanged; one full run at one worker and one at three both pass.

**Batch 3 — validation (QA Engineer, its own session).** Runs against a frozen snapshot, with retries at 0 and no edits during a run. Every failed attempt is reported, not just the final result.
- **Isolation probe.** A small spec, kept in the suite as an uncatalogued infrastructure check: a descriptive title, no case ID. Each slot seeds data named for its slot, waits across another slot's reset, and reads its data back through the API and in the browser. Run with repeats so the slots overlap.
- **Replacement worker.** A deliberately failing test, run once and then removed, shows the restarted worker's next test still reaches its own stack.
- **Separation from dev data.** The dev and deep databases are untouched by a run.
- **Teardown.** After a run, no slot's database files are left, and nothing is still listening on the port block.
- **Preservation.** The test list and the skips match batch 4b's close.
- **Stability and speed.** Three full runs at one worker and three at the candidate count, on the same snapshot. Then the drag specs at the candidate count with `--repeat-each=5`. If three workers bring timing failures, try two, once, before anything else changes.
- **Stop:** the QA Engineer's report goes to Nathan, who picks the default count, or keeps one worker.

**Batch 4 — docs (Architect).** `.claude/guides/testing-strategy.md`'s "Running the tests", for Nathan's approval: the slot pool and its ports, `E2E_WORKERS` and the serial script, the no-reuse rule, and the one-run-at-a-time limit.

## Code map

| File | Batch | Change |
|---|---|---|
| `server/package.json` | 1 | An E2E server script without watch, if the command needs one |
| `playwright.config.ts` | 1, 2 | The JSON reporter, no reuse, strict client ports; then the slot pool and `workers` from `E2E_WORKERS` |
| `package.json` (root) | 2 | The serial script |
| `tests/helpers/api.ts` | 2 | `API` from the slot |
| `tests/fixtures.ts` | 2 | `baseURL` from the slot |
| `tests/global-teardown.ts` | 2 | Every slot's database files |
| `AGENTS.md` (root) | 2 | The E2E stack line |
| `tests/ui/` (an isolation probe spec, named by the QA Engineer) | 3 | New |
| `.claude/guides/testing-strategy.md` | 4 | Running the tests |

## Acceptance

1. **Isolation.** Every browser, API request, reset and seed reaches its own slot's stack, including after a worker restarts. The probe passes under overlap.
2. **Separation.** No run touches `kanban.db` or `deep.db`, and a run works with the dev and deep stacks running.
3. **Preservation.** The same test list and the same skips as batch 4b's close, with every test accounted for. No saving comes from a test that silently stopped running.
4. **Stability.** Across three full runs at the adopted count, no failure that isn't explained and fixed. The one-worker runs on the same snapshot are the comparison.
5. **Contention.** The drag specs pass five repeats each at the adopted count.
6. **Speed.** The median full-run wall time, stack start-up included, is at least 40% below the one-worker median on the same snapshot. The target is a proposal (Open questions).
7. **Lifecycle.** Teardown leaves no database files and no process listening on the block, on Windows.
8. **One worker still works,** through the serial script.
9. The gate passes.

## Open questions

No runner-default decision remains open. Nathan adopts five after the extended trial, retaining the recorded failure deferrals. Their causes remain unresolved and their fixes are assigned to Story 10's 4c and 4h below; no new case-certification claim follows from runner adoption.

## Handoff

- **The E2E Smoke Suite story** builds its tiers on this runner and measures its budget at the adopted worker count. Re-evaluate the five-worker default there, weighing shorter feedback against capacity for simultaneous work and the lower frequency of full E2E runs outside Story 10.
- **The shorter timer profile** (round table 2b) is a later, separate experiment, groomed with the smoke suite. The Coder's and Automator's cautions are in the round table.
- **Docs that name the old stack** (client 5174, server 3002, `test.db`): root `AGENTS.md` changes in batch 2 and the testing guide in batch 4. The Architect updates the agents' memory notes that name it. Done in batch 4; no memory note named it.
- **Architect, batch 4:** document the adopted default of five in the testing guide and correct root `AGENTS.md`'s Running the App line from “1 by default” to “5 by default.” The slot ports, no-reuse rule and serial override stay as implemented. The QA Engineer leaves these living-doc edits to their owner. Done (Batch 4 Results).
- **Story 10's plan:** decision 8 is recorded in its D2. Batch 4c owns DRAG-7.10's two observed failure modes; 4h owns DRAG-3.16's setup reset and restoration of both skipped variants alongside the six legacy skips. Evidence and full reproduction details remain below.
- **Catalog owner:** the temporary skip suspends DRAG-3.16's automated proof. Reconcile its existing Automated status/pointer with this deferral and restore whole-case certification in 4h. The QA Engineer does not edit the catalog; the skip does not establish Manual coverage or erase the prior 4a evidence.

## Batch 3 Results

**Session:** QA Engineer, 2026-11-10. Nathan accepts the completed validation matrix with its two flaky failures deferred, and adopts three workers to reduce Story 10's execution time. Raw stability/contention results remain failed below; the acceptance exception and destinations are explicit. The runner's isolation checks pass. Two remains diagnostic evidence only.

**Authorization and scope:** Nathan authorized three workers first, with a one-worker comparison for failures or unexpected results, and writes to story files anywhere under `docs/planning/`. This session adds `tests/ui/worker-isolation.spec.ts`, removes its deliberately failing temporary replacement-worker spec after the probe, and updates this plan. The temporary source is retained as `worker-replacement.temporary.spec.ts.txt` in the evidence directory. The accepted follow-up changes `tests/helpers/slots.ts`'s default from one to three, skips the two DRAG-3.16 variants in `tests/ui/drag-band-contracts.spec.ts`, and records their destinations in both Story 10 plans. Test bodies/assertions, app source, tuning and retry/trace settings stay unchanged. No catalog case/status, mapping or Coder Vitest edit is made.

**Trial tree:** `91744fa0c535d3da807d274e6bd174f3703a79a8`, on HEAD `2a2655e4`. A second temporary-index capture after all trial E2E runs and the root gate produced the identical tree. The real index was untouched. All measured runs below use retries 0, with no source/test edits during execution. The adopted-default/skip changes happen afterward and do not retroactively change the trial's inventory or results. Adoption checks and their tree/report paths are recorded below.

**Evidence root:** `tests/output/parallel-workers-batch3/`. `validation-summary.json` independently reconstructs inventories, results, repeat multiplicity, retry counts, slots, barrier signals and replacement-worker evidence from the completed reports; it finds no accounting discrepancy. `ledger-*.json` hold the command arguments, process wall times, protected-file snapshots and lifecycle checks. Wall time below includes launch, stack startup, tests and cleanup.

| Run | Workers | Passed | Existing skips | Failed | Wall time | JSON report |
|---|---:|---:|---:|---:|---|---|
| Full 1 | 3 | 395 | 21 | 0 | 4m 41.3s | `full-3w-1.json` |
| Full 2 | 3 | 394 | 21 | 1 | 4m 50.1s | `full-3w-2.json` |
| Two-worker fallback, before further runs | 2 | 395 | 21 | 0 | 6m 37.7s | `full-2w-diagnostic.json` |
| One-worker comparison, through `test:e2e:serial` | 1 | 395 | 21 | 0 | 12m 40.5s | `full-1w-diagnostic.json` |
| Full 3 | 3 | 394 | 21 | 1 | 4m 51.6s | `full-3w-3.json` |
| Drag specs, five repeats | 3 | 1,438 | 105 | 2 | 21m 33.4s | `drag-3w-repeat5.json` |
| Clipped-top setup-failure comparison, five repeats | 1 | 5 | 0 | 0 | 18.1s | `setup-reset-1w-repeat5.json` |

The contention selection is all **24 specs importing the shared drag helper**, listed in `drag-selection.json`: 309 expanded variants per repeat, including 21 existing skips. All 309 occur exactly five times, with no additional or missing variants: 1,545 scheduled results, 1,440 runnable and 105 skipped. Failed repetitions remain failures; none were retried or replaced by later passing evidence. The two-worker fallback ran once before any further full run, as the plan requires.

### Acceptance

| Acceptance | Result and evidence |
|---|---|
| 1. Isolation and replacement | Pass. `isolation-overlap-attempt2.json` has three passing copies on slots 0/1/2. File barriers establish all three arrivals, six peer resets and three completed verifications; each slot reads its retained card through its API and a freshly opened browser board after both peers reset. `replacement-attempt2.json` has the deliberate failure followed by a passing successor: worker index 0 becomes 1, parallel slot stays 0, API stays on 3010, and browser 5180 reads the original card. |
| 2. Separation and coexistence | Pass. SHA-256, byte size and modification time of all six dev/deep DB, WAL and SHM files match from before the first full run through the final root gate. Every run's protected-file check passes. `coexistence.json` records all four dev/deep listeners beside all six E2E listeners, with dev/deep HTTP 200 responses. The existing dev stack was used; the trial's support deep stack was started for coexistence and stopped afterward. |
| 3. Preservation | Pass for the trial. Batch 4b's actual close has 415 tests: 394 passed plus 21 skips. The trial inventory has those same 415 and the one new infrastructure probe, with no removal or changed skip. Every full trial report matches that 416-test inventory and the exact original skip identities. See `preservation.json` and `validation-summary.json`. Post-trial adoption adds exactly the two authorized DRAG-3.16 skips; it removes no test. |
| 4. Stability | **Measured fail at three; accepted exception.** DRAG-7.10 fails in full runs 2 and 3. Nathan defers the fix to 4c and accepts runner adoption. The one- and two-worker full comparisons pass, but do not establish causation or qualify two. |
| 5. Contention | **Measured fail at three; accepted exception.** DRAG-7.10's attachment assertion and DRAG-3.16's setup request fail in the completed five-repeat sweep. Nathan routes them to 4c/4h and accepts runner adoption; the raw failures remain evidence. |
| 6. Speed | Descriptive comparison only. Three-worker median is 4m 50.1s, 61.9% below the single one-worker comparison of 12m 40.5s. Nathan's bounded protocol did not run three one-worker baselines; the original three-baseline median acceptance remains unverified. Nathan accepts the observed runtime benefit with the bounded failure deferrals. |
| 7. Lifecycle on Windows | Pass in the combined final check and all corrected collectors. `final-lifecycle.json` has no slot DB/WAL/SHM files and no IPv4/IPv6 pool listeners, with dev/deep still running and protected files unchanged. The first two full-run collectors queried IPv4 only; the later collectors and saved positive listener snapshots cover IPv6 too. The early empty listener arrays alone are not cleanup proof. `support-cleanup.json` records stopping only the trial's support host/children, with the pre-existing dev listeners preserved. |
| 8. Serial mode | Pass. The complete comparison above ran through `npm.cmd run test:e2e:serial`; `serial-listeners.json` shows only slot 0's pair alongside dev/deep. |
| 9. Root gate | Pass. `gate.json` and `gate.log`: `npm.cmd run check`, exit 0, 92.4s; type checks, lint/docs, formatting and all unit suites pass. |

### Failure handoff

**DRAG-7.10 — modal pop and detach.** The case requires the drag to enter the containing column/sub-row on modal exit and, on release, make the attached item Free while retaining its original parent. In `tests/ui/drag-7-hierarchy-modal.spec.ts`'s “a pop out of the modal, past the Card’s box…” test:
- Full runs 2 and 3 stop at line 395: the expected `column:<id>` context never appears within the existing 2,300ms wait. The board reports `data-drag-state="popped-out"` with no context; release and detach assertions are not reached.
- The failed sweep repetition reaches the later assertion at line 405. Expected `[isAttached, parentId, workphaseId]` is `[0, original parent, original phase]`; observed is `[1, original parent, original phase]` through the item API after the existing 5s poll. The item remains attached.
- The full one- and two-worker comparisons pass this test. All five sweep copies are accounted for: one fails and four pass. These samples show an intermittent failure under the three-worker workload; they do not settle whether its cause is application behavior or test aim/synchronization.

**DRAG-3.16 — setup connection reset.** In `tests/ui/drag-band-contracts.spec.ts`'s “a clipped visible top remains middle…” test, one sweep copy fails in `seedProject` before the Given is established or a drag begins. Expected is a successful project-creation response; observed is `apiRequestContext.post: read ECONNRESET` on `POST http://localhost:3011/api/projects`, slot 1, worker index 14. The other four copies pass. The complete one-/two-worker comparisons and all five focused one-worker copies pass. No server error was captured in the run log; the connection reset's cause remains unresolved. This is setup/transport evidence, not a failed clipped-top placement assertion.

**Reproduction:** use the frozen tree, retries 0 and the same workload. Full three-worker reproduction is `$env:E2E_WORKERS='3'`, a fresh `PLAYWRIGHT_JSON_OUTPUT_NAME`, then `npm.cmd run test:e2e -- --retries=0` (modal failure in two of three observed full runs). The contention reproducer is the exact 24-file argument list in `ledger-drag.json` with `--repeat-each=5 --retries=0`; `drag-selection.json` preserves the file selection. Give a replay fresh report and output paths. The completed reports retain each error location, start time, slot/worker index and error-context artifact; no trace is expected with the unchanged first-retry trace setting and zero retries.

### Earlier attempts and authoring corrections

Every failed E2E attempt is retained separately from the measured matrix:
- `replacement.json`: sandboxed web-server startup fails, no tests execute. The subsequent unrestricted launch succeeds; its planned deliberate test failure and passing successor are in `replacement-attempt2.json`.
- `isolation-overlap.json`: all three copies fail at an authoring setup guard, before seeding/reset overlap. The guard reads `info.project.repeatEach` as 1 despite the runner report's CLI repeat count of 3. That guard was removed before freezing; actual arrivals, all six peer resets, API reads and browser assertions remain required and all pass in `isolation-overlap-attempt2.json`.
- `inventory.json` / the captured listing error: the archived temporary source still had a discoverable `.spec.ts` extension under `tests/output/`, so collection tried its relative imports and failed. Renaming the evidence copy to `.spec.ts.txt` removes it from collection. `inventory-final.json` then accounts for exactly 416 maintained tests.
- The listener collector changed from `netstat -ano -p tcp` to `netstat -ano` after the IPv6 gap was found. This changes evidence collection only. Positive coexistence/serial snapshots and final cleanup use both address families. No runner, existing test or timing assertion was changed to obtain a green result.

### Initial three-worker adoption checks

Nathan's default/failure-routing decision is applied: three workers by default, DRAG-7.10 active for 4c, both DRAG-3.16 variants skipped for 4h. The two new skips are an explicit coverage deferral; they do not count as passing proof. The original trial's JSON reports and failures are retained. No repeat of the already accepted full trial is scheduled.

**Adoption check tree:** `12f9e199fa541f65ab5cd70e01fcc943c66e2457`; only planning report updates follow that capture. Evidence is under `tests/output/parallel-workers-adoption/`:
- `default-inventory.json` confirms three workers with `E2E_WORKERS` empty. `serial-inventory.json` confirms one worker through the serial script even when its parent environment requests three.
- `inventory-verification.json` confirms all 416 test identities remain, all 21 previous skips remain, and exactly the two DRAG-3.16 variants change to skipped: 23 skips and 393 runnable variants. DRAG-7.10's modal-detach test remains active. The source comparison confirms the DRAG-3.16 test bodies/assertions are byte-equivalent after normalizing line endings and removing only the added skip declaration/comment.
- The first source-normalization check mishandled a backtick in the shell command and falsely reported a body difference. Its output is preserved as `inventory-verification-initial-parser.json`; the corrected literal normalizer passes in `inventory-verification.json`. No test body was edited in response.
- `gate.json` and `gate.log` record `npm.cmd run check`, exit 0, 85.0s: types, lint/docs, formatting and all unit suites pass. The final planning report receives a separate docs check.
- **Shared-helper review, medium self-review:** changing the default feeds the config's pool size and cleanup's slot count through the existing shared `workerCount`; explicit overrides still win, and the serial script forces one. The skip changes only the two generated DRAG-3.16 declarations and preserves their titles and bodies. No correctness finding or cleanup suggestion. The named `/code-review` command is unavailable in this environment, so this is a manual self-review, not an independent reviewer verdict.

**Next owner:** Architect for batch 4's testing-guide/default documentation and catalog owner for the DRAG-3.16 status/pointer handoff. Story 10's 4c/4h sections carry the failure details and evidence paths. D2 stays unchanged and now uses five workers following the extended trial. No app fix, catalog edit, audit or commit is made here; no 4c implementation is started.

### Extended worker-count trial

**Requested by Nathan, 2026-11-10:** run the full suite three times each at four, five and six workers, then compare runtime savings against any newly observed failures. Run in three rounds of 4 → 5 → 6 to spread the counts across the trial. The default stays three pending evaluation.

**Protocol:** one frozen source/test snapshot, retries 0, no edits during runs, no assertion/tuning/skip changes and no simultaneous E2E runs. Each run retains its own JSON, log and artifacts, including every failed attempt. The matrix continues after test failures; source drift, protected-database changes or leftover slot resources stop it for investigation. Check the full six-slot port block on IPv4 and IPv6. Evidence is `tests/output/parallel-workers-scaling-20261110/`; `ledger.json` is the live execution/resume packet, with frozen tree and runtime-input fingerprints beside it.

**Comparison:** all nine runs use the adopted 416-test inventory with 23 skips and 393 runnable variants. The earlier three-worker median of 4m 50.1s is a historical reference with two more runnable DRAG-3.16 variants and 21 skips, so it is not an identical-inventory control. Four/five/six workers are compared directly on the same current inventory. The already accepted active failure is the specific DRAG-7.10 modal-pop/detach test; newly observed failing test identities are listed separately, without claiming worker count caused them.

**Current state:** all nine requested full runs are complete. No default, source, assertion, tuning or skip change was made during this experiment. Nathan subsequently selected five as the default; the application and checks are recorded below. The measured trial and its frozen tree remain unchanged.

**Frozen tree:** `3f7b77de1f7ee34d3f5fe1222ad33965bc596e20`. The ending temporary-index capture is identical. Before/after fingerprints of every run's tracked and untracked runtime inputs also match the initial manifest (`runtime-inputs.json`). The real Git index was untouched. The machine has 8 logical CPUs and approximately 31.5 GiB of RAM; Node is v24.11.1. All three counts ran on this same machine, interleaved as requested above, with no concurrent gate or other E2E command.

**Timing and failure comparison:** wall times include process launch, stack startup, test execution and cleanup. Medians use all three completed full-suite commands per count, including failed commands; no passing-only selection or retry replacement is used. Sample numbers correspond to each count's `full-<count>w-1.json` through `-3.json` in the evidence root.

| Workers | Sample 1 | Sample 2 | Sample 3 | Median | Green full runs | Known DRAG-7.10 failures | New failures |
|---|---|---|---|---|---|---:|---:|
| 4 | 3m 53.5s | 4m 03.3s | 4m 03.6s | **4m 03.3s** | 0 / 3 | 3 | 0 |
| 5 | 3m 25.1s | 3m 29.9s | 3m 24.7s | **3m 25.1s** | 1 / 3 | 2 | 0 |
| 6 | 3m 20.9s | 3m 23.3s | 3m 22.5s | **3m 22.5s** | 2 / 3 | 1 | 0 |

- **Four → five:** median saves **38.2s (15.7%)**, with no newly observed failure.
- **Five → six:** median saves another **2.7s (1.3%)**, with no newly observed failure. Six is fastest in this sample, but most of the observed gain beyond four arrives by five workers.
- The fewer known modal failures at six are an observation from three samples, not proof that six is more stable. These samples include their actual failure waits and worker restarts. They measure full-suite commands, not Story 10's twenty-repeat batches, whose throughput was not measured at these counts.
- The earlier three-worker median remains **4m 50.1s**, but its 21-skip inventory differs from this trial's 23 skips. It is an indicative historical reference, not a matched three-worker control on this snapshot. No additional three-worker baseline was run in this request.

**Failures, with every attempt retained:** all six are the same accepted active DRAG-7.10 modal-pop/detach test; neither a new failing test identity nor a new failure mode appears.
- Four workers: `full-4w-1.json`, `full-4w-2.json`, `full-4w-3.json` all fail at the existing column-context wait (`dragGesture.ts`, line 253, called from the modal test at line 395): expected `column:<id>`, observed popped-out with no context.
- Five workers: `full-5w-1.json` and `full-5w-2.json` fail at the existing attachment assertion (modal test line 405): expected Free (`isAttached = 0`), observed attached (`1`), with parent and phase retained. `full-5w-3.json` passes.
- Six workers: only `full-6w-2.json` fails, with the known missing-column-context symptom. `full-6w-1.json` and `full-6w-3.json` pass.

Both symptoms remain assigned to Story 10's 4c. DRAG-3.16 stays skipped for 4h and was not exercised, so this experiment makes no claim that its setup connection reset is fixed. Assertions and case-certification requirements are unchanged.

**Accounting and controls:** `comparison.json` independently reconstructs all nine raw JSON reports and finds zero discrepancies. Every report has exactly the frozen 416 identities and 23 skips, one result per identity, retries 0, sequential tests within each file, and all requested parallel slots used. Across the nine runs: **3,531 passed, 207 skipped, 6 known failures**; all 3,744 scheduled results and 3,537 runnable results are accounted for. There are no global runner/startup errors. Per count, totals are 1,176 / 69 / 3 at four, 1,177 / 69 / 2 at five, and 1,178 / 69 / 1 at six (passed / skipped / failed).

**Separation and lifecycle:** every run preserves the SHA-256, size and modification time of the dev/deep DB, WAL and SHM files. The same protected files still match after the final gate. All six-slot database-file and IPv4/IPv6 port-block checks are clear after every run. `final-lifecycle.json` confirms no slot DB/WAL/SHM files and no listeners on 3010–3015 or 5180–5185. The pre-existing dev stack remains running; no support stack was started for this experiment.

**Gate and evidence:** `gate.json` / `gate.log` record `npm.cmd run check`, exit 0, 91.0s, after the matrix finished. `ledger.json` retains exact CLI arguments, each process wall time and exit, report paths, source fingerprints, protected-file hashes, slots, errors and cleanup state. Each `full-<count>w-<sample>.json` has its matching log and artifact directory. `comparison.json` / `summary-verification.log` hold the independent inventory, failure-mode and timing reconstruction. This final planning update receives a separate docs check. No app/test/catalog edit, further skip, new default or commit is made by this experiment.

### Five-worker adoption checks

**Decision applied:** `tests/helpers/slots.ts` now defaults to five, and both Story 10 plans use five for future D2 repeats and batch-final runs. Nathan prioritizes the observed speed gain during Story 10; the smoke-suite handoff records re-evaluation of E2E frequency and capacity for simultaneous work, with an earlier review if failures or contention change. The known failures retain their 4c/4h destinations. Historical trial snapshots, skips and raw red results remain evidence.

**Check tree:** `768eceb4e957d3a2849fb7e5eb00bb89e0193335`, captured with a separate temporary Git index, including untracked source. Only this planning results packet follows the capture; the real index is untouched. Evidence is `tests/output/parallel-workers-five-adoption/`:
- `default-inventory.json` confirms five workers with `E2E_WORKERS` empty; `serial-inventory.json` confirms one through the serial script despite a parent override of five. `inventory-verification.json` confirms the exact same 416 identities and 23 skip identities as the extended trial, with no discrepancies.
- `gate-command.json` and `gate.log` record `npm.cmd run check`, exit 0, 86.8s: type checks, lint/docs, formatting and all unit suites pass. The final results packet receives a separate docs check.
- **Shared-helper review, medium self-review:** the default and its comment change from three to five; `workerCount` continues to feed both pool creation and database cleanup. Explicit environment overrides and the serial script retain their precedence. No test body, assertion or skip changes from the extended trial. No correctness finding or cleanup suggestion. The named `/code-review` command is unavailable here; this is a manual self-review, not an independent verdict.

The three completed five-worker full runs remain the execution evidence; selecting that already-measured count schedules no additional performance trial. Their two known DRAG-7.10 failures remain failures. Batch 4's Architect documentation and the catalog-owner handoff remain the next actions; this selection does not start Story 10's 4c.

## Batch 4 Results

**Session:** Architect, 2026-11-10. Docs only, for Nathan's review.

- **`.claude/guides/testing-strategy.md`, "Running the tests":** the slot pool and its ports, the default of five, `E2E_WORKERS` and the serial script, the no-reuse rule and its one-run-at-a-time limit, and the reports. The guide also says that a `--reporter` on the command line replaces the configured reporters, so that run leaves no JSON report and no database cleanup (`tests/helpers/removeDatabasesReporter.ts`'s header). "Who writes which" drops the global teardown, which batch 2 replaced with that reporter.
- **Root `AGENTS.md`:** "1 by default" becomes "5 by default".
- **`.claude/personas/qa-engineer.md`:** "What's Yours" drops `tests/global-teardown.ts`, which no longer exists. Its reporter sits in `tests/helpers/`, already listed. "Running the tests" names the per-slot databases in place of `test.db`. A long run's named JSON report now comes from `PLAYWRIGHT_JSON_OUTPUT_NAME` alone: the persona's `--reporter=json` would have dropped the database cleanup.
- **Memory notes:** none named the old stack.
- **Left as they are, outside these docs:** four code and settings lines still name the old stack. Each is harmless today, and their owners can change them:
  - `server/vitest.config.ts`'s `DB_PATH` comment names Playwright's `test.db`;
  - `server/src/db/reset-test.ts`, an older CLI no script calls, defaults to `./data/test.db`;
  - the refused-paths list in `server/tests/lib/deepSeed.test.ts` includes `./data/test.db`;
  - the header of `tests/helpers/slots.ts` keeps the block clear of an "old E2E (3002/5174)" stack that no longer exists.
- **Check:** `npm run check:docs`.

## Amendments

- **2026-11-10 — Batch 3 trial bounded to three workers first (Nathan).** Run the three-worker validation first. Run a one-worker comparison only if failures or unexpected results require it. Without that comparison, report the observed timings and leave the 40% median-saving target unverified. The final default count remains Nathan's decision. Anyone may update story files under `docs/planning/`; this session's test changes are the permanent isolation probe and a temporary replacement-worker probe, removed after its run. Evidence lives under `tests/output/`.

- **2026-11-09 — The QA Engineer validates (Nathan).** The [Testing Roles Refactor](testing-roles-refactor.md) now lands before this story, and retires the Test Automator. Decision 9's validator, batch 3 and its probe spec are the QA Engineer's, which takes over everything this plan gave the Automator. One session builds and another validates, as before. The Playwright config and `tests/` support are now the QA Engineer's files, so decision 9's grant to the Coder is still needed.
- **2026-11-09 — Decision 8 approved (Nathan).** Both parts: the one-worker repeat evidence stands, and from 4c on Story 10's repeats and final runs use the adopted worker count. D2 is Story 10's bar for its flaky drag specs, not a process for other stories, and decision 8 now says so. Recorded in Story 10's D2.

- **2026-11-10 — Adopt three workers with bounded flake deferrals (Nathan).** Move forward with the two recorded flaky failures to reduce suite runtime during Story 10. DRAG-7.10 stays active and is fixed in 4c. Temporarily skip DRAG-3.16's two variants and restore their proof in 4h alongside the six legacy skips. The default becomes three; serial mode stays one. The trial's red results and limited speed baseline stay disclosed. Story 10's D2 bar is unchanged. The Architect's batch 4 applies the remaining living-documentation handoff.

- **2026-11-10 — Four/five/six-worker experiment (Nathan).** Run three full suites per count to evaluate further runtime savings against newly observed failures. Keep three as the adopted default during the experiment and retain all attempts. No test fix, assertion change or further skip is authorized by this request.

- **2026-11-10 — Adopt five workers (Nathan).** Five replaces three for its measured full-suite saving with no newly observed failure identity or mode. Drop six for its small incremental saving. Re-evaluate with the smoke suite, weighing lower E2E frequency outside Story 10 and capacity for simultaneous work; revisit sooner if failures or contention change. This selection retains the known-failure deferrals and D2's requirements. The full-suite measurements do not establish five-worker twenty-repeat throughput or eliminate the known flakes.
