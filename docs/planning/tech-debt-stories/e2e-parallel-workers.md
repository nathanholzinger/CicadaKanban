# Parallel E2E Workers

**Type:** tech-debt story. It changes how the Playwright suite runs, not what the app does, so it closes by the gate and its own acceptance, with no audit · **Written:** 2026-11-09 by the Architect, from the [E2E run time round table](../round-tables/e2e-run-time-and-smoke-suite.md) (Proposal 2a and the responses to it) · **Sequenced:** right after Epic 3.5 Story 10's batch 4b closes (its Stop 5 and commit), before 4c's Stop 1. Story 10 waits for it · **Status:** planning, for Nathan's approval

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

**4. A stack is never reused or moved.** The pool sets `reuseExistingServer: false`, and each client fails on a taken port instead of picking another (Vite's `--strictPort`). Otherwise a leftover server on the wrong database, or a client on a port nobody routes to, could quietly break the isolation. One consequence: two E2E runs can't share the pool at once, and the testing guide says so.

**5. The E2E server runs without watch, landed first at one worker.** Today's server command is `tsx watch src/index.ts`. Under N workers that's N watchers, each restarting its server if a file under `server/src` changes mid-run. The Coder also saw an unexplained pair of failures in a run while editing files. This lands as its own step, at one worker, before the parallel change, so each change is measured on its own. The client stays on Vite's dev server.

**6. Everything else holds still during the trial:** test bodies, assertions, timer profiles, retries (0), the trace setting, the test list and the skips. With one change at a time, a failure can be attributed.

**7. Every run leaves a JSON report beside the HTML one.** That gives per-test durations from every run, for this trial and for the smoke suite's budget later. The JSON file can be named per run, so a targeted re-run doesn't overwrite a full run's evidence.

**8. Runner acceptance is kept separate from Story 10's case certification.** The two answer different questions: does the new runner isolate tests and run them reliably, and does each case still prove its whole Then. Proposed carry-forward for Story 10's D2:
- the twenty-repeat evidence earned on one worker stands for the tests and snapshots it was earned on, and isn't re-earned;
- this story's contention check (Acceptance 5) is what carries that evidence onto the new runner;
- from 4c on, D2's twenty repeats and each batch's final full run use the adopted worker count, so the repeats also run under load, which a one-worker repeat never did;
- if no worker count passes acceptance, the suite stays on one worker, D2 is unchanged, and the smoke suite is brought forward.

If Nathan approves, the carry-forward is recorded as an amendment in Story 10's plan.

**9. The Coder builds the runner, including its plumbing in `tests/`, and the Automator validates it in a session of its own.** The runner's routing chain runs from the config through `tests/helpers/api.ts` and `tests/fixtures.ts` to the teardown. If it were split across two sessions by file, neither session could test it alone. The `tests/` changes are an address and a cleanup, not test content: no expected value changes. Story 10's boundary keeps the Coder out of `tests/` by default, so this needs Nathan's grant.

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

**Batch 3 — validation (Automator, its own session).** Runs against a frozen snapshot, with retries at 0 and no edits during a run. Every failed attempt is reported, not just the final result.
- **Isolation probe.** A small spec, kept in the suite as an uncatalogued infrastructure check: a descriptive title, no case ID. Each slot seeds data named for its slot, waits across another slot's reset, and reads its data back through the API and in the browser. Run with repeats so the slots overlap.
- **Replacement worker.** A deliberately failing test, run once and then removed, shows the restarted worker's next test still reaches its own stack.
- **Separation from dev data.** The dev and deep databases are untouched by a run.
- **Teardown.** After a run, no slot's database files are left, and nothing is still listening on the port block.
- **Preservation.** The test list and the skips match batch 4b's close.
- **Stability and speed.** Three full runs at one worker and three at the candidate count, on the same snapshot. Then the drag specs at the candidate count with `--repeat-each=5`. If three workers bring timing failures, try two, once, before anything else changes.
- **Stop:** the Automator's report goes to Nathan, who picks the default count, or keeps one worker.

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
| `tests/ui/` (an isolation probe spec, named by the Automator) | 3 | New |
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

- **For Nathan:** decision 8, the carry-forward for Story 10's D2.
- **For Nathan:** decision 9, the Coder editing `tests/helpers/api.ts`, `tests/fixtures.ts` and `tests/global-teardown.ts`.
- **For Nathan:** the trial's size and target: three full runs per mode, five repeats of the drag specs, and a 40% saving. The Planner asked that these be agreed before the trial starts, so it doesn't become an open-ended proof.

## Handoff

- **The E2E Smoke Suite story** builds its tiers on this runner and measures its budget at the adopted worker count.
- **The shorter timer profile** (round table 2b) is a later, separate experiment, groomed with the smoke suite. The Coder's and Automator's cautions are in the round table.
- **Docs that name the old stack** (client 5174, server 3002, `test.db`): root `AGENTS.md` changes in batch 2 and the testing guide in batch 4. The Architect updates the agents' memory notes that name it.
- **Story 10's plan** gets decision 8 as an amendment, once Nathan approves it.

## Amendments
