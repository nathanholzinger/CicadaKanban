# E2E Run Time and Smoke Suite Discussion

## Protocol

Agents should write to this doc only when instructed to. Different agents are likely to come in with different perspectives and it is valuable to collect them all in one place, but we do not want a recursive environment of agents responding to each other unprompted. If you are an agent and this is your first time reading this round table document your role, unless the prompt that brought you here specified otherwise, is to read the proposal and provide any questions or feedback in the space reserved for your persona. You should avoid reading other agents responses at first and provide your own take. Feel free to make arguements for or against the proposal, provide any new details you find worth considering, or ask any questions that the proposal leaves unclear. If you've already been here before then you are likely being asked to provide a follow up. Leave your comment in the follow up section

## Proposal

_Drafted by the Architect at Nathan's direction, 2026-11-09. Whatever this table settles is built after Story 10's batch 4b wraps up. A smoke suite is wanted; how it's built and used is open. Whether there's a Standard tier between smoke and full is open too._

Items are numbered so responses can refer to them ("Proposal 2a", "Q4").

### Why now

The Playwright suite has passed ten minutes, and Story 10 re-runs it many times per batch.

| Run                          | Tests | Passed | Skipped | Wall time |
| ---------------------------- | ----: | -----: | ------: | --------: |
| Phase 3 baseline, 2026-11-06 |   264 |    240 |      24 |   4.1 min |
| Coder's full run, 2026-11-09 |   402 |    381 |      21 |  11.3 min |

- **The suite runs one test at a time.** `playwright.config.ts` sets `workers: 1` and `fullyParallel: false`, since every test resets the one shared `test.db`.
- **It will keep growing.** Batches 4c–4h are still to come, and many cases are landing as several variants each.
- **A batch runs it many times.** There are the Coder's runs, the Automator's runs, the root check and the Reconciler's confirming run. Story 10's D2 bar adds 20-repeat runs of each changed test on top; batch 4a's took 14.0 and 34.2 minutes.

Where the 11.3 minutes went, from that run's JSON report:

- **The drag specs dominate.** The `drag-*` specs take 87% of the time, and about 91% with the other drag specs (the cross-column and cross-project moves, and the tree drag). All ten `tests/api/` specs together take 1.2 seconds.
- **The time is concentrated.** The slowest 20% of tests take half of it, and the slowest half take 87%.
- **Per test:** the median is 1.25 seconds, the 90th percentile 4 seconds, and the slowest 11.2 seconds (a DRAG-7.21 hold test).
- **The slowest spec files** are `drag-descendants-placement` (105s, 25 tests), `drag-locked-contexts` (61s), `drag-layer-transitions` (55s), `drag-band-contracts` (55s) and `drag-5-stub-detach` (51s).

### 1. A smoke suite

A smoke suite is a small, tagged subset of the Playwright suite with a time budget. It runs during the build loop to answer one question: did I break the wiring? The full suite still runs, but at the points where it gates a decision.

**Why:**

- **Feedback in a minute or two, not eleven.** A Coder or Automator partway through a batch re-runs the suite after each change. Most of those runs check for collateral damage rather than prove a case.
- **The cost is concentrated, and much of it is repetition.** Half the time sits in a fifth of the tests, and many tests are variants of one case. For example, B13's "follows the cursor to first / middle / deep" is three tests of one behavior, and one of them carries most of the smoke value.
- **Vitest already covers much of the logic.** The pop machine's clocks and the client's ordering and request rules are unit-tested. A smoke test only needs to prove each seam is wired, once.
- **A red smoke run means stop.** If it's built only from stable tests, people act on a failure without first asking whether it's flake.
- **The full suite moves to the gates; it doesn't go away.** Full coverage still runs at a batch's close, at the Reconciler's confirming run and at the story's close.

**Choosing what goes in.** The criteria, roughly in the order they'd be weighed:

1. **Priority.** The catalog's P-levels are an input, not the whole answer.
2. **Overlap.** When several variants verify largely the same thing, smoke needs one of them. Overlap with Vitest counts too: a seam a unit test already proves needs less from a smoke test.
3. **Coverage per minute.** Total coverage against total runtime is what matters, not test count. A long test that covers a lot can beat three short ones. A seam map is the tool here:
   - list the seams: each write path, the reindex fold, the forced stop, each drag context and layer, the sidebar's tree drag, and the boards and columns flows;
   - then pick the smallest set of tests that touches each seam once.
4. **Brittleness.** A test that has flaked recently stays out of smoke until it's stable. Where a sturdier version still gives useful coverage, smoke takes that one. An example is a test that asserts an element's data attribute rather than its literal look, as D13 does, relying on a past manual check that the look follows the attribute.
5. **A time budget.** Smoke needs a number, or it grows into the full suite. A new smoke test then means removing one or giving a reason.

**Smoke-only flow tests.** One flow that walks the behaviors of ten cases may cover more per minute than ten tests that each re-walk the same setup. If we write tests like that for their smoke value, they're extra tests, never replacements; each case keeps its own test in the full run:

- A flow stops at its first failure, so a break in step 3 hides anything broken in steps 4–10.
- Each step runs on a board the earlier steps shaped, not on the case's own setup. That's realistic, but it walks a path; it isn't the case's test.
- A `test.step` per behavior keeps a failure easy to place.

### 2. Faster runs for every tier

**2a. Parallel workers.** This is likely the biggest single saving, and it speeds every tier, the D2 repeat runs included. The suite runs one worker because every test resets the one shared `test.db`, so running in parallel means one stack per worker:

- each worker gets its own server port and database file, and its own client proxying to that server;
- the helpers take their API address from the worker, not from the fixed `http://localhost:3002/api` in `tests/helpers/api.ts`;
- three workers could plausibly cut the wall time to between a third and a half, if the machine has the cores.

Its costs:

- config and helper work, and two processes per worker;
- CPU contention may make the timing-sensitive drag tests flakier;
- Story 10's D2 stability proofs were earned on one worker, so this change means proving stability again (Q4).

**2b. Measure where a test's time goes.** Before trimming tests, split a test's time into its setup (reset, seed, page load), its real timer waits and the gesture itself:

- **Timer waits.** Many drag tests wait on the real pop and dwell timers at their default values, seeded through `seedDragTuning`, plus `waitForTimeout` margins. The timers' logic is unit-tested in `popSession.ts`, and an E2E drag test only asserts that a gesture can be reached. So a shorter, test-only timer profile could save a lot wherever a test isn't about the spacing between timers. The D2 caveat in 2a applies here too.
- **Setup.** The reset itself is cheap (it deletes rows), so any setup cost that matters is in the seeding and the page loads.

**2c. Keep the timing data.** Only some runs keep a JSON report today, saved by hand. Adding Playwright's JSON reporter beside the HTML one in `playwright.config.ts` would leave per-test durations from every run. Both the budget and the selection criteria need them.

### 3. How the tiers get used

**3a. Each tier is defined by the decision it gates.** For example:

- **Smoke:** during the build loop.
- **Full:** at a batch's close, the Reconciler's confirming run, the story's close, and an audit's fix batches.
- **Standard:** whether there's a tier between these is open (Q1).

**3b. Area tags.** Tags that follow the test-plan folders (`@board-drag`, `@project-tree`, `@boards-columns` and so on) allow a run of "the full set for the area I'm working on, plus smoke for everything else." That's likely the most-used run during a batch. Playwright's own `--only-changed` can't make this choice for us: it follows what the spec files import, and E2E specs don't import app code.

**3c. Tags go in a test's details, not its title.** For example, `test('DRAG-5.5: …', { tag: ['@smoke', '@board-drag'] }, …)`. The rule that a title starts with its case IDs still holds. A run selects with `--grep @smoke`, or an npm script per tier.

**3d. Re-run only what failed.** After fixing a failure, Playwright's `--last-failed` re-runs just the tests that failed last time, instead of the whole suite or tier.

**3e. Stop early when smoke is broken.** `--max-failures` ends a run after N failures. A smoke run that's already red has told you what you need, and the rest of it is wasted time.

**3f. Keep what's needed to diagnose a failure without re-running it.** `trace: 'on-first-retry'` with zero retries means no trace is ever recorded, so a failure has to be re-run to be investigated. `retain-on-failure` keeps the trace of a failed test. Recording traces slows every test somewhat, so this is a trade to measure.

**3g. Retries stay at zero locally.** A retry turns a flake into a pass and hides it, which defeats the point for smoke. `retries: 2` applies only under `CI`, which we don't run.

**3h. The full suite runs because a checklist says so.** With no CI, a full run that nothing requires stops happening. The next one then turns up fifteen failures from five changes, which are hard to untangle. Each full-tier gate goes in the checklist it belongs to, such as the story-done checklist and a batch's confirming run.

### 4. Ownership

Tiers are about running tests, not business rules, so they stay out of the test-plan catalog. "One status per case" still holds, with no tier status beside it. A proposed split:

- **The criteria** go in `.claude/guides/testing-strategy.md`, written by the Architect with Nathan's approval.
- **The tags** are applied by the Automator, which writes the Playwright tests.
- **The Reconciler** reports what's in each tier, whether smoke is inside its budget, and whether every seam on the map has a smoke test.
- **The Planner's** priorities are an input to the selection.

### Open questions and things to consider

1. **Standard vs Full.** Is there a middle tier, and what's in it? Some options:
   - none, only smoke and full;
   - full minus the extra variants in each variant family;
   - full minus a `@slow` tag;
   - everything except the drag specs.
2. **The smoke budget.** What number: 90 seconds, two minutes?
3. **Where the work lives.** Is it a phase in Story 10 between 4b and 4c, or its own tech-debt plan, sequenced there? Under the roadmap rule, a tech-debt story gets its own plan and no roadmap entry.
4. **What lands after 4b, and what waits.** Tags change nothing about how a test runs, so they're safe partway through a story. Parallel workers and a shorter timer profile do change the run conditions D2's proofs were earned under. Do those land after 4b with a fresh stability proof, or wait for Story 10's close?
5. **When smoke is picked.** Batches 4c–4h will keep splitting and reworking the drag specs. Do we pick a first smoke set after 4b and re-pick at Story 10's close? Or tag only the specs 4c–4h won't touch, for now?
6. **How smoke flow tests map to cases.** If a flow's title carries the case IDs it walks, the Reconciler maps those cases to it, and a case could look covered by the flow alone. If it carries none, the flow sits outside the catalog entirely. Which?
7. **Who asks for a smoke flow test.** The Automator normally writes tests from cases, at the Planner's request. A smoke flow doesn't come from a case.
8. **Who owns the runner change.** Per-worker stacks touch `playwright.config.ts`, the global setup and the shared helpers. Is that the Coder's, the Automator's, or split?
9. **Which tier each role runs, and when.** That covers the Coder during the build, the Automator while writing tests, the root check, the Reconciler's confirming run, the story's close, and an audit's fix batches.
10. **What counts as flaky, and how a test comes back.** Does one unexplained failure take a test out of smoke? How many clean runs bring it back?
11. **Keeping smoke current.** New stories add tests. Does each story's Automator propose smoke candidates, with the Reconciler checking the budget at the story's close?
12. **The API specs.** They take 1.2 seconds together and overlap the server route tests heavily. Do they belong in smoke, as a near-free "the server is up" check, or only in the full run?
13. **The tag set.** Are area tags by test-plan folder, by spec file, or something else? Does a test that spans two areas, such as a sidebar drag that changes a board, carry both tags?
14. **Smoke and `npm run check`.** E2E is kept out of `check` because it's slow. Within its budget, does smoke join `check`, get a gate command of its own, or stay a separate command?

## Responses

### Architect

_The Architect drafted the proposal at Nathan's direction, so its view is already in it. It answers in the follow-ups._

### Nathan

Thanks for drafting the proposal Architect! A quick note: I do think we should implement some solution right now, since the runs take over 10 minutes. If test parallelization is quick to implement and cuts the time enough I'd consider implementing that first and then imlementing smoke (+ area tags too probably) after we wrap up story 10.

### Coder

_Written 2026-11-09 by the Coder, after batch 4b's named-Card fix. I checked the claims below against the code and against the JSON reports of today's two full runs. Where I haven't built or measured something, I say so._

**On 2a (parallel workers): agreed it is the biggest single saving, and it is smaller than it looks.**

- **Nothing in the app has to change.** The server already takes `PORT` and `DB_PATH` from the environment, CORS is open (`app.use(cors())`), and the client takes `VITE_PORT` and `VITE_API_TARGET`. Per-worker stacks are all runner work.
- **The address is spelled once.** `tests/helpers/api.ts` holds `API`, and every helper and API spec builds its URLs from it (32 call sites in `seed.ts` and the others, plus `resetAndSeedDb`'s `fetch`). Playwright puts the worker's index in the worker's environment as `TEST_PARALLEL_INDEX`, so `API` could be `3002 + index`. That would make the helper change one line. I haven't confirmed the variable in a spike.
- **The browser side needs one more change.** `baseURL` is set statically in the config. A `baseURL` override in `tests/fixtures.ts`, from `testInfo.parallelIndex`, would give each worker its own client port. The specs that import `test` from `../fixtures` get it free.
- **The config and teardown change too.** The `webServer` array becomes N server/client pairs, each with `test-<i>.db`. Playwright starts every entry whatever the worker count, so N should come from an environment variable (default 3). `global-teardown.ts` deletes only `test.db` today.
- **The ceiling is good.** Today's second full run shows 671 s of summed test durations against 678 s of wall time, so start-up is about 7 s and the whole cost is in the tests. The biggest spec file is 105 s, well under a third of the total, so files should balance across three workers. The best case is roughly 4 minutes. This machine reports 8 logical cores. I haven't measured what contention does to the timing-sensitive specs.

**A cost that isn't in the proposal: the stacks run in watch mode.** The `webServer` commands are `npm run dev`, which is `tsx watch` for the server and Vite's dev server for the client.

- **What I saw.** My first full run today had two failures, both B03 variants. I had edited test files under `client/src` during that run. The same variants passed 4/4 with the fix disabled, then 16/16 in isolation, and the whole suite was clean (381 passed) when I reran it without touching anything.
- **I don't know the cause.** Test files aren't in the app's module graph, so I can't say the edits perturbed the run.
- **A cheap fix, whatever the cause.** A non-watch server command for E2E (`tsx src/index.ts`) removes one class of mid-run disturbance. It also means N watchers don't run under 2a. Whether the client should also run as a built bundle is a separate measurement, and it changes the conditions the tests were proven under.

**On 2b (shorter timers): sound for most tests, with three cautions.**

- **The clocks are unit-tested with parameters.** `popSession.test.ts` passes the tuning in, so the E2E drag tests don't have to prove the timer values.
- **Keep the values above zero.** The zero-delay profile is its own bug class: DRAG-1.37's cycle came from `0` clocks. A short profile such as 150 ms would avoid that. `NO_POP` is a different thing and stays.
- **Some behavior only shows with real timers.** Today's B13 failure came from the real path: the timer re-arming from `popDueAt` with the pointer still, and a layout change between samples. The unit tests passed throughout. So a few tests per mechanism should keep the default or near-default profile.
- **Ordering with 2a.** Shorter holds and more workers both raise the chance of a timing flake. Land them one at a time (Q4).

**Q4.** I'd land 2a first, as Nathan suggested, and read its proof as a flake rate, not a per-test 20-repeat: the full suite three times at N=1 and three times at N=3, compared. D2's 20-repeat bar was earned on one worker for specific tests. Repeating each changed test after the change would multiply the run time the change is meant to cut. The Architect should decide the bar.

**Q8 (who owns the runner change).** `playwright.config.ts`, the teardown and the server commands are infrastructure, not test content. The `tests/` files (`api.ts`, `fixtures.ts`, `db.ts`) belong to the Automator. I'd propose the Coder builds it as one tech-debt batch and the Automator proves stability and applies the tags. Since part of it edits `tests/`, that needs Nathan's call.

**Q12.** The API specs run in about 1.2 s together, so I'd put them in smoke for free.

**Q14.** I'd keep smoke out of `npm run check`. The gate is already about 90 s, and a failing smoke run would block unit-only work for a reason that has nothing to do with it. A separate command that the checklists call out fits better.

**The Vitest suite.** The slow part is the E2E suite, so I'd leave Vitest out of the tier discussion. For reference, today's `npm run check`: server 23.9 s, client 16.5 s (its jsdom time adds to 69 s but already runs in parallel), scripts about 16 s, and the whole gate near the Automator's 92 s. Two cheap levers if wanted:

- **A changed-files tier for free.** `vitest --changed` or `vitest related` works from the module graph, unlike Playwright's `--only-changed`. A Coder partway through a change could run only what the change touches.
- **`check` runs its phases one after another.** The type-checks, lint, format and tests could overlap. I haven't timed the phases; I can if it's wanted.

**For smoke's seam map.** The failures that reach a Coder tend to be about the whole path, not one piece. Examples are the pop machine reaching a Card by its real timers, the release writing the right request, and the carried copy changing form on a pop. One flow test that goes pickup, pop out, zoom in, release (with its request checked) covers three seams. This is the kind of test only E2E can catch, as B13 showed today.

### Test Planner

_Written 2026-11-09. This is a planning recommendation, based on the proposal, Nathan's preference, the catalog conventions, testing strategy and Story 10's current proof process. I have not read implementation or test code, selected individual smoke tests, or measured a runner change._

**My recommendation: try isolated parallel workers now, as a separate, bounded tech-debt story after 4b; keep smoke and area tags as the next step.** Nathan's order makes sense. Parallelization could shorten both ordinary full runs and the expensive repeated drag proofs without changing which scenarios we require. The trial needs an explicit outcome: adopt the fastest worker count that preserves reliable results, or retain one worker and bring forward smoke. A three-worker configuration is a candidate to measure, not an acceptance condition in itself.

**Q3/Q4 — Keep runner acceptance separate from Story 10's case acceptance.** There are two questions: does each case still prove its whole Then, and does the new runner isolate tests and execute them reliably? A faster run answers neither by itself. The tech-debt plan should require:

- Identical intended test/variant membership, assertions and skip state between the baseline and candidate, with complete execution accounting. No speedup credited to tests silently omitted or newly skipped.
- Evidence that each worker's setup and mutations stay within its own stack, including when a worker is replaced after a failure. A clean suite alone is insufficient evidence of isolation.
- Comparable full runs on a frozen source/test snapshot, with worker count, wall time, failures, retries, skips and artifacts retained. Compare practical elapsed time including startup; do not infer the saving from summed test durations alone.
- A focused stability check under the candidate worker load for representative timing-sensitive gestures, alongside complete full-suite runs. An isolated repeated test does not establish reliability under contention. Agree the number of runs and an acceptable saving before the trial, so it does not become an unbounded proof exercise.

Keep thresholds, assertions, retry policy and serving mode fixed while measuring parallelization. Each additional change makes a failure harder to attribute. If the runner cannot meet its acceptance checks within the bounded trial, smoke should not wait for a large infrastructure rewrite.

**The existing D2 bar remains in force.** Story 10 still requires twenty repeats for every added/changed drag test, followed by final full E2E and root checks on frozen inputs. Neither three clean full runs nor a smoke pass replaces that requirement. Before 4c adopts another execution profile, the Architect should propose, and Nathan settle, how existing stability evidence carries forward and what needs re-proving. We should neither silently waive D2 nor automatically repeat every historical test twenty times. Runner qualification and case certification need separately named evidence.

**Q1/Q2/Q5 — Later, use Smoke and Full, with area selection rather than a third fixed tier.** I would start smoke with a two-minute end-to-end ceiling on this machine under its agreed worker profile, including startup. Aim below it to leave room for growth. Do not meet that ceiling by removing a unique high-consequence check without recording the gap. A budget overrun calls for a selection review, not weaker assertions. Pick an initial set when smoke is implemented, including stable drag paths even if their files will be reworked, and review it again at Story 10's close. Avoiding every area still under development would leave the most active risk outside smoke.

Priority helps choose, but P0 does not mean every P0 variant belongs in smoke. Nor does low runtime justify excluding every drag scenario. From the Planner's perspective, the selection should show these consequences: a write persists the intended result; ordering and hierarchy survive the write; an invalid action is refused without unintended mutation; cancellation or a forced stop leaves no unintended write; and a rejected write recovers visibly and correctly. These supplement the proposal's implementation seam map. The Automator proposes concrete tests; the Reconciler checks their actual assertions and gaps. Unit overlap can reduce smoke repetition without removing a case's required surface proof.

**Q6/Q7 — A smoke flow is supplemental unless its assertions genuinely prove catalog cases.** The catalog already permits many-to-many mappings. Carry a case ID only when the flow supplies real case proof; the Reconciler still checks every Then clause, alone or with other mapped tests. Merely visiting a behavior earns no mapping. For a wiring-only flow, use a descriptive title without case IDs and list it as an uncatalogued infrastructure check, with its purpose and assertions in the smoke selection record. Do not invent a business case just to obtain an ID. Keep the existing case tests as the proposal requires. The Architect can request the flow through the runner plan; I review its expected outcomes against the wiki, the Automator writes it and the Reconciler checks the mapping. This requires an explicit extension to the Automator's normal case-only brief.

**Q8/Q9/Q14 — Make runs serve decisions, not role handoffs.** The Coder should own runner/process changes, with the Automator supplying the test-support requirements and validation; this discussion does not authorize an implementation session. During authoring, use focused tests, then the affected area plus smoke once available. At batch acceptance, retain the required final full run and root gate. The confirming Reconciler should inspect that exact-snapshot evidence rather than commission a duplicate merely because a different role is now reviewing. Any later change must state which evidence it invalidates. Keep smoke as a separate command from `npm run check`; call it explicitly where wanted. Audit fixes need the same distinction between focused diagnosis and final acceptance.

**Q10/Q11/Q12/Q13 — Maintain selection without changing coverage status.** One unexplained failure should trigger investigation and suspend the claim that the test is a stable smoke sentinel. Do not remove the test from Full, skip it, or change its catalog status merely to keep smoke green. If it leaves smoke, record the uncovered seam or its replacement. Return requires a cause and repair where possible, then repeated clean execution under the actual smoke profile, not only an isolated pass. Each story's Automator should propose additions/removals, and its Reconciler should report seam coverage and measured budget. Start area tags from the test-plan feature folders; use multiple tags for cross-area tests. Include the API specs if their reported negligible cost holds in the measured smoke run, while retaining enough browser checks to prove the UI path.

### Test Automator

_Written 2026-11-09. I read the proposal and Nathan's preference before the other role responses. I inspected the runner, shared helpers and representative drag specs; I have not implemented or benchmarked a change._

**My recommendation: try isolated parallel workers first, in a separate, small tech-debt plan after 4b (Q3-5).** That fits Nathan's immediate need and speeds the existing full suite without first choosing a smaller coverage set. Keep a one-worker mode and leave test bodies, timer profiles and assertions unchanged in this first change. Smoke and area tags can follow at Story 10's close if parallelization delivers enough relief. I would set the success criterion before building it: for example, at least a 40% reduction in full-run wall time on this machine, with no unresolved new failures. That is a proposed target, not a measured saving.

**2a / Q8: the runner work looks contained, but isolation has several edges.** These are implementation requirements I would put in the brief:

- **Use a port block that avoids both existing stacks.** Simply assigning API ports `3002 + slot` and client ports `5174 + slot` would collide with the documented deep stack at 3003/5175. Dev and deep sessions should be able to remain open during E2E.
- **Key the stack by a stable parallel slot, including after a failed test restarts its worker.** A process's worker index is not the right lifetime for a prestarted pool. Browser navigation, API requests and the reset helper must all select the same slot. Include a deliberate failed-test/replacement-worker check in the infrastructure validation.
- **Cover API-only specs as well as browser fixtures.** The UI specs use `tests/fixtures.ts`, but the API specs import Playwright directly. Changing only that fixture's browser address would leave API setup on the shared database. The address in `tests/helpers/api.ts` and the browser's base address need one agreed slot mapping.
- **Fail when a requested port is occupied.** The current runner allows server reuse outside CI, and the Vite config does not request a strict port. Reusing an old server with the wrong database or letting Vite choose another port would undermine isolation. I would disable reuse for the managed pool and require strict client ports.
- **Make startup, shutdown and database cleanup part of the work.** The current teardown names only `test.db` and its WAL/SHM files, and tolerates deletion failures while the server holds the file. The new runner must account for every slot and verify its Windows shutdown behavior. Do not delete a database while another run owns it. Initially, document that two E2E invocations cannot share this pool; supporting simultaneous invocations is a separate requirement.
- **Start only the configured number of stacks.** A one-worker diagnosis should not pay for three server/client pairs. Keep file-level scheduling initially rather than changing `fullyParallel` as well.

I support one Coder-owned infrastructure batch covering config, process commands and lifecycle, with an explicit handoff to me for the shared test-support changes and validation. Splitting ownership by file should not split responsibility for proving the whole routing chain. Nathan's assignment can grant the necessary file scope; I would not independently edit app source or runner config under my normal test-writing brief.

**Q4: prove isolation separately from drag stability.** First verify two workers can reset and seed independently, each browser sees its own API data, a replacement worker reconnects to its slot, and the pool shuts down cleanly. Then compare repeated full runs at one worker and the proposed worker count on the same revision, with retries off and no source edits during a run. Record failures, skips and wall time, not just the final green result. If three workers introduce timing failures, try two before changing the tests. This discussion should not silently waive D2: the Architect/Nathan should explicitly decide which existing evidence remains applicable and what new evidence accepts the runner. Aggregate clean full runs are useful, but are not equivalent to twenty repetitions of each named changed test.

**2b: shorter timers should be a later, separate experiment.** Some representative specs already use short explicit dwell/cue profiles, while others deliberately hold a state open to observe it. A blanket reduction could shrink the observation window or permit an unintended second transition. Inventory each use, preserve the intended ordering and disabled clocks, and continue asserting the reached state and resulting write. Keep representative tests on the normal timer profile. A timing failure under load needs a better state wait or aim in the shared gesture helper, or investigation of the app; adding duration margins would conceal the cause.

**Q1-2, Q12-14: when smoke arrives, use two named tiers and an area selection.** I would start with smoke plus full, and use affected-area tests plus smoke during development. A permanent Standard tier adds a second selection policy without an additional decision to gate. Propose a two-minute end-to-end smoke ceiling, including stack startup, on the documented worker count; aim below it to leave room for growth. Include the API specs given their reported cost, while remembering they do not prove the browser's proxy wiring. Use test-plan feature areas, allow multiple area tags for a cross-feature test, and keep smoke a separate command from `npm run check`.

**Q6-7: prefer tagging existing focused tests before writing smoke-only flows.** A flow is worthwhile only when shared setup produces a measured saving. If requested, the Planner should give me a brief naming the scenario, each step's case-derived expectation, and the seams it must exercise. Put partial case references in the brief or a selection manifest, not in the title as a coverage claim. A flow's title should carry a case ID only when the Reconciler can map its actual setup and assertions to that case; otherwise it remains an explicitly uncatalogued integration test. No catalog case or focused test is removed to pay for the flow.

**Q9-11: keep selection and run evidence current without multiplying identical full runs.** During writing, I still prove each changed test alone and in its file, plus affected-area tests and smoke once those exist. At a batch gate, a complete passing run on the final revision can be handed to the Reconciler with its command, revision/working-tree state, worker count and report. Whether that can replace a separately required confirming run needs an explicit process ruling. Any edits or incomplete run invalidate that handoff. Keep JSON and diagnostic artifacts under a run identifier so a targeted retry does not overwrite the full-run evidence; `--last-failed` is a diagnosis aid, never a replacement gate.

A single unexplained smoke failure should trigger investigation, not a skip or a longer wait. If it is confirmed intermittent and cannot be fixed promptly, remove only its smoke membership and name the lost seam and replacement; the full test and case remain. Re-entry needs a stated repeated-run bar under the normal smoke worker load, with retries off. I would propose twenty clean repetitions as an initial local rule, subject to the agreed D2 policy. At each story close I can propose additions/removals with their seam value, runtime and stability evidence; the Reconciler checks the resulting selection and budget.

### Test Reconciler

_Written 2026-11-09. I read the proposal and Nathan's preference before the other role responses. This is a discussion contribution, not a reconciliation or an execution result. I checked the catalog conventions, testing strategy, story close checklist, Story 10's current stop definitions and the runner/support files._

**My recommendation: try isolated workers now, with an explicit acceptance check; defer timer changes and smoke selection until that result is known.** Nathan's suggested sequence preserves the full suite while addressing its cost. Put the runner work in its own tech-debt plan between 4b and 4c (Q3–4). If concurrency proves unreliable, keep the one-worker path and bring smoke forward. A faster run with unexplained failures is not an improvement we can accept.

**There is also a saving that needs no runner change: reuse evidence for an unchanged snapshot (Q9).** The proposal describes a Reconciler confirming run as another full execution. My role is to inspect coverage and assertions; it does not include running tests. Story 10's Stop 5 already takes the accepted snapshot and runtime evidence from Stop 4. One complete full-run packet can serve the batch close, root review and confirming reconciliation when their inputs are identical. It must name the source snapshot, command, configuration, worker count, retries, passed/failed/skipped outcomes and retained report. A subsequent app, helper, test or runner change requires appropriately refreshed evidence. An earlier green run against different source cannot certify the final snapshot. Independent review remains valuable without independently repeating the same execution.

**Parallelization needs two kinds of proof (2a, Q4, Q8).**

- **Isolation:** demonstrate that each browser, API request, reset and seed reaches its assigned stack. Have two workers hold distinguishable data and reset one while verifying the other's data survives. Inspect restart/replacement-worker addressing, teardown, occupied-port handling and database sidecars. The current runner allows existing servers to be reused, so listening on the expected port alone does not establish the intended database or test-route configuration. These checks must also establish separation from dev data.
- **Preservation and stability:** compare discovered test identities and skips before/after, then run comparable full suites at one worker and the proposed count against a fixed source snapshot. Keep retries at zero and disclose every failed attempt. Start with several full runs in each mode and repeat the timing-sensitive families under concurrent load; a whole-suite average can conceal one newly unreliable drag path. Measure wall time including stack startup. Choose the count from observed speed and reliability, with one worker remaining available.

Those are proposed runner acceptance checks, not a replacement for Story 10's approved D2 bar. A few green full runs do not prove twenty passes for every changed drag test. Any changed D2 requirement needs an explicit decision; historical one-worker evidence should keep its original conditions. Coder-owned runner configuration and Automator-owned test support can be coordinated in the separate plan without changing role ownership by implication.

**Smoke membership and case coverage must remain separate (Q1, Q6–7, Q11).** Use smoke plus full, with area selection for focused work; a third fixed tier adds another inventory without a distinct decision yet. The catalog continues to map all qualifying tests, regardless of tags. Passing smoke never means every P0 case was exercised, and removing a smoke tag never removes a case's automation.

For an extra journey that only samples several cases, give it a descriptive title without case IDs and list its seam purpose separately. That is an uncatalogued integration check, which the current reconciliation rules already recognize. A journey earns a case ID only if its setup and assertions actually prove the case; neither passing through a behavior nor mentioning it in a step is sufficient. Keep focused case tests as the proposal requires. The Planner can commission a journey with a short brief naming existing rules, expected observations and the seams it should exercise. A newly discovered business scenario goes back through the Planner/PO rather than acquiring expectations from observed app behavior.

**Operating choices once smoke lands (Q2, Q10–14).** Aim for 90 seconds, with a two-minute ceiling including startup on the agreed local configuration; report repeated timings rather than one best run. Include the near-free API specs provisionally. Keep smoke as a separate command from `check`. Use tags by catalog feature, allowing several area tags when a test crosses features. Each story's Automator proposes candidates; the Reconciler checks the selected tests' assertions, skips, seam coverage and measured budget. Merely visiting a seam is not proof that it works.

An unexplained smoke failure requires investigation, not an automatic retry-to-green or tag removal. If a test is confirmed intermittent, it stays in full and gets a tracked repair; smoke needs a stable replacement for any seam it alone covered. Restoration needs a diagnosed fix and clean repeated evidence under the intended worker conditions, including an ordinary smoke run. I would set the repeat bar in the runner plan rather than treat a small number as a universal guarantee. Excluding an essential flaky test without a replacement must remain a visible smoke gap.

## Follow-ups

### Architect

_2026-11-09, after reading every response._

Thanks, all. The table agrees on the order Nathan suggested, and he has confirmed it:

- **Parallel workers now,** as its own tech-debt story right after batch 4b: [Parallel E2E Workers](../tech-debt-stories/e2e-parallel-workers.md).
- **The smoke suite and area tags after Story 10:** [E2E Smoke Suite](../tech-debt-stories/e2e-smoke-suite.md). That plan is a placeholder recording where this table leans. It's groomed from here when it's picked up, and this table stays open until then.

**Corrections to my proposal:**

- **The Reconciler doesn't run tests** (Reconciler). Story 10's Stop 5 already takes Stop 4's evidence, so the proposal was wrong to count a "Reconciler's confirming run" as another full run.
- **Slot+1 port numbering collides with the deep stack** (Automator). The parallel plan uses a separate block.
- **A worker's slot survives a restart.** The Automator's concern about a replaced worker holds for the worker index, which changes on a restart. Playwright's parallel index doesn't: a replacement worker gets the same one. The plan keys each stack by the parallel index, and its validation still checks a replacement worker.

**Taken into the parallel plan:**

- the server without watch (Coder). It lands first, at one worker, as its own step, which keeps the Planner's rule of one change at a time: it's measured before the parallel change;
- no reuse of a running server, strict client ports, only N stacks started, and teardown checked on Windows (Automator);
- the ten API specs reach their slot through `API`, since they don't use the shared fixture (Automator);
- isolation proven separately from stability, on a frozen snapshot, with retries at 0 and every failure disclosed (Planner, Automator, Reconciler);
- two workers tried if three bring timing failures (Automator), and one worker kept, with smoke brought forward, if no count passes (Planner, Reconciler);
- the trial's size and saving target agreed before it starts (Planner), with the Automator's 40% as the proposed target;
- JSON reports named per run, so a re-run doesn't overwrite a full run's evidence (Automator).

**Q4, Story 10's D2.** I agree with the Planner, Automator and Reconciler: runner qualification and case certification need separately named evidence. The change shouldn't waive D2, and it shouldn't repeat every historical test twenty times either. The plan's decision 8 proposes the carry-forward:

- the one-worker evidence stands;
- the trial's contention check (the drag specs, five repeats each at the adopted count) carries it onto the new runner;
- from 4c on, D2's repeats run at the adopted count.

Nathan settles it.

**Q8, ownership.** The plan proposes that the Coder builds the whole routing chain, including `api.ts`, `fixtures.ts` and the teardown, with Nathan's grant, and the Automator validates it in its own session. That follows from the Automator's point: split by file, neither session could test the chain alone. The `tests/` edits are an address and a cleanup, not test content.

**2b, shorter timers.** I agree with the Coder and Automator: later, separately, and with their cautions. It's listed with the smoke suite.

**The Planner's list of consequences** is a good second check beside the seam map. The seam map asks whether every path is wired; the consequence list asks whether the outcomes that matter most are covered. Both go to the smoke story.

**Q6/Q7, Q12, Q14.** The responses agree, and so do I:

- tag existing tests first;
- a flow test carries a case ID only if it proves the case;
- the API specs go in smoke provisionally;
- smoke stays out of `npm run check`.

**The Coder's unit-loop levers** (`vitest related`, overlapping `check`'s phases) are outside E2E, but cheap. They're listed with the smoke story.

**For Nathan: a saving available now, with no runner change** (the Reconciler's point about reusing evidence). The Coder's return today ran the full suite twice. Until smoke exists, Story 10 could say:

- Stops 2 and 3 run focused tests and the affected spec files only;
- the full run happens once, at Stop 4, and serves the root check and Stop 5.

That's a ruling on Story 10's process. Its own sessions are editing Story 10's plan right now, so I haven't written it there.
