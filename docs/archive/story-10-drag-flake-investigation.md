# Story 10 — drag flake investigation

**Date:** 2026-11-11 · **Asked by:** Nathan · **Status:** findings and proposals for Nathan to route. Nothing here is decided, and no code, test, case or living doc was changed.

**Scope:** every Playwright JSON report saved under `tests/output/`, the Story 10 plans and results, the drag harness (`tests/helpers/`), and the parts of the app's drag layer that time a drag. **No test was run for the first pass:** a batch 4c session was using the E2E ports. Later the same day, with 4c paused, DRAG-7.17 and DRAG-7.28 were reproduced with a temporary spec ("DRAG-7.17 and DRAG-7.28, reproduced" below). A cause below is marked *confirmed* only where the saved evidence shows it. *Probable* and *possible* causes each name the run that would settle them.

## What was found

1. **Most recorded failures are not flakes.** The 161 saved reports hold 17,960 executed attempts and 144 failures. About 115 of those are discovery: tests red while they were written, and product defects the tests found. About 30 are flakes: a test that passed and failed on the same tree.
2. **The 30 flakes come from five causes,** and two of them have nothing to do with dragging: a connection reset between tests, and the machine suspending in the middle of a run.
3. **The twenty repeats on one worker could not have caught most of them.** 24 of the 30 happened at three to six workers. Batches 4a and 4b certified 3,180 passes on one worker with one failure.
4. **Each flake so far was fixed in its own test.** D2's other two remedies, an internal test in place of the surface half and Manual, have not been used for a flake in 4a, 4b or 4c. The rules make the first remedy the default and put three roles in front of the others.
5. **The extra tests are a matrix, not smaller tests.** 60 cases became 159 runnable variants in 4a and 4b. A variant repeats the same gesture on another fixture, so it adds flake exposure without removing precision.

## The evidence

| Workers | Reports | Passed | Failed |
| --- | ---: | ---: | ---: |
| 1 | 124 | 7,010 | 90 |
| 2 | 1 | 395 | 0 |
| 3 | 14 | 3,811 | 9 |
| 4 | 4 | 1,176 | 3 |
| 5 | 15 | 4,246 | 41 |
| 6 | 3 | 1,178 | 1 |

A failure counts as a flake here when the same test also passed in the same report, or failed in a full or contention run of a suite that passes otherwise. The one-worker failures are nearly all discovery runs from 4b and 4c. Twenty-six of the five-worker failures are one deterministic defect, DRAG-7.10's carried copy 175 px outside its column, which batch 4c has already recorded for a Coder.

### The flakes, by cause

| Cause | Attempts | Tests | Confidence |
| --- | ---: | --- | --- |
| A. A real-time clock fires during a slow approach | 8 | DRAG-7.10's committed test, the mode that ends at Board | Probable |
| B. The cursor rests, and the drag's state settles one step off and stays there | 1 to 7 | A drop line that never drew (1); possibly DRAG-7.10's mode that stays attached (4) and DRAG-5.4's B03 (2) | Probable for the first, possible for the rest |
| DRAG-7.17's gap: the modal opens with the ghost's spot out of the cursor's reach (reproduced, below) | 2 | DRAG-7.17, above and below the overflow row | Confirmed for the gap above; the gap below was not reproduced |
| C. A press or a measurement lands while an element is still arriving | 5 | DRAG-7.32's first Escape (4), DRAG-7.28's Sheet box (1) | Confirmed for the Escape, probable for the box |
| D. A connection reset on the first request of a test | 2 | DRAG-3.16, DRAG-5.3 | Probable, with a clear signature |
| E. The machine suspended during the run | 4 | Four tests on four slots at once in `batch4c-files-full2.json` | Confirmed |
| Unexplained | 1 | DRAG-5.3's B18 merged locked-after-A, one 30 s timeout at five workers | — |

The first pass counted DRAG-7.28's projection failure under cause B. The reproduction shows it was a wrong aim on a new test's first run, so it isn't a flake, and the count is about 29.

## Cause A — a real-time clock and a slow approach

**What happens.** The pop machine reads `performance.now()` and arms a `setTimeout` (`client/src/components/workflow/useBoardDnd.ts`, `evaluatePop`). A spec seeds its thresholds short enough to wait for, 150 ms in the `POP_OUT_ONLY` and `SUSTAINED` presets. `hoverTo` then sends 17 pointer moves, each awaited. On a loaded machine the approach itself can outlast a 150 ms clock, so a pop fires partway along the path instead of at the resting point.

**Evidence.**
- DRAG-7.10's committed test fails this way in eight attempts at three, four, five and six workers, and never at one. Its failure log shows the drag already at Board, with no context, on the first of 22 polls. Both of its 150 ms clocks had run out before the approach returned.
- Batch 4c found the same class while writing: a Free Card carried slowly across another Card zooms into it. Its correction 4 raised a zoom hold from 650 + 350 ms to 1500 + 800 ms, so that a slow aim can't complete it.
- The `NO_POP` preset and `NEVER_MS` exist for the same reason.

**To settle it:** run the committed DRAG-7.10 test on one worker with a wait added between pointer steps. If cause A is right, it fails every time.

**Proposals.**
- **A1. Run the drag clocks on Playwright's clock (QA Engineer, a spike first).** `page.clock` controls `setTimeout`, `performance.now()` and `requestAnimationFrame` in the page. With time paused, no clock can run during an approach. The spec then advances time by the seeded threshold, and a case one short of a delay becomes exact. `tests/ui/board-read-order.spec.ts` already does this for the stop flash. The spike is three tests, a pop, a zoom hold and a modal hold. It has to show that dnd-kit's activation, the sortable shuffle and `useSnapTween` behave with time paused. This doesn't assert a tuned duration: the spec still passes its own seeded value.
- **A2. Until then, one rule for seeded thresholds (QA Engineer):** a clock the test doesn't wait on is seeded to never fire. A clock it does wait on is long against the approach that precedes it.

## Cause B — the cursor rests, and the state stays one step off

**What is seen.** A spec moves the cursor to its aim and stops. The drag's reported state settles one step from what the Then names, and stays there for the whole wait.

**What is and isn't known about why.** The machine reads the board again in four ways: on a `pointermove`, on its own pop timer, when dnd-kit reports a new `over` (`useBoardDnd.ts::handleDragOver`, which exists for "a layout change under" a still pointer), and when a render names a different anchor (`syncNamedAnchor`). So a still cursor is not left unread in general. Two things do pin a reading while the cursor is still:
- **By design:** a foreign entry's placement and the hierarchy modal's reading are held until the pointer moves (`descendantsProjection.ts::holdsReading`, wiki board-drag-interaction §6.1 and §7.3). If the one reading the modal takes as it opens is a gap off, nothing corrects it until the next move. DRAG-7.17's failure has this shape, and the reproduction below shows why the reading comes out a gap off.
- **A change none of the four paths announces.** `evaluatePop`'s comment describes one such hazard, a transition stranded because "no further pointermove ever arrives to self-correct it", and guards against it.

For the drop line and the two possible failures, which of these applies is not established.

**Evidence.**
- DRAG-7.17: the ghost one gap above the aim, `23:3` for `24:3` and `25:3` for `26:3`, unchanged for the whole wait. Reproduced below.
- DRAG-7.28's new test: `5:3` for `4:3`, unchanged for five seconds. Not a flake, below.
- A drop line that never drew while the cursor rested (`batch4c-files-full.json`).
- The harness already works around it in one place. `boardDragScenario.ts::settleOnBand` nudges the cursor until the machine agrees. Batch 4c's corrections 3, 10 and 13 each added a re-aiming poll to one test.

**A still hand would see the same thing.** If a reading can be a gap off and is held until the pointer moves, a release without moving writes that gap. So each of these is a possible small product defect, not only a test artifact.

- **B1. Reproduce before deciding anything. Done on 2026-11-11,** in "DRAG-7.17 and DRAG-7.28, reproduced" below. Neither turned out to be a held reading the app got wrong.
- **Not proposed: a general re-read on a timer or each frame.** An earlier draft of this report proposed one. It would take new readings in exactly the window where `holdsReading` exists to refuse them, so it would either do nothing or undo a rule the wiki states.
- **B2. For tests whose Then doesn't depend on a still cursor (QA Engineer):** one `rest` primitive in `dragGesture.ts` holds the cursor at a point with a one-pixel move each way until the machine's reported state stops changing. It replaces a poll written per test. A case whose Then is about a cursor that doesn't move, such as TREE-1.19 in batch 4g, can't use it.

**To tell B from A:** the slow-pointer run above exposes A. A run with the CPU throttled (`Emulation.setCPUThrottlingRate` over a CDP session) and the pointer at normal speed exposes B.

## DRAG-7.17 and DRAG-7.28, reproduced

**How.** A temporary spec, removed afterwards, ran on one worker with the page's CPU throttled through CDP (`Emulation.setCPUThrottlingRate`) at 1×, 4×, 8× and 16×. It held the committed sequence of both DRAG-7.17 tests, batch 4c's re-aiming version of the first, and DRAG-7.28's carried row with two aims. The page logged its own pointer samples, each change to the board root's drag attributes, every scroll, and the modal's arrival. Nothing in the app, the tests or the helpers was changed. At 16× most runs timed out for slowness, so those aren't counted.

### DRAG-7.17, the gap above R's overflow row: reproduced

| Throttle | Wrong reading |
| --- | --- |
| 1× | 1 of 13 |
| 4× | 2 of 10 |
| 8× | 5 of 10 |

What happens, in order:

1. **The column scrolls at pickup, by a varying amount.** `X` is picked up at the bottom of `P`'s section, about 630 px down a 720 px window. That is inside the strip where dnd-kit auto-scrolls the column body. The column scrolls for as long as the cursor is in the strip: 92 to 128 px unthrottled, and up to its limit of 178 px when throttled.
2. **The section reads the right gap every time.** The test measures its aim again after the scroll, so the cursor rests in the gap above the overflow row and the projection is `24:3` in every run. Where that is in the window depends on the scroll: the cursor rested anywhere from y 448 down to y 398.
3. **The modal can't always bring the spot up to the cursor.** To put the ghost's spot under the cursor it has two moves: the dialog's position, and its list's scroll. Here the dialog is already against the window's top margin, and the list is at the end of its scroll (371 of 371). The spot's row can come no higher than y 407 to 431.
4. **A cursor above that row reads the row before it.** Across the runs where the pointer didn't move after the modal opened, the cursor read `24:3` wherever it rested at y 410 or further down the window, and `23:3` at y 404, 400 and 398. One 16× run with the column at its scroll limit rested at y 372 and read `22:3`, two gaps up.
5. **The reading is then held,** by design, until the pointer moves.

So the reading is taken once, as the modal opens, and it is what wiki board-drag-interaction §7.3 says for a modal the window shifts: the ghost goes where the cursor is over the modal's rows. That is DRAG-7.16's behaviour. The test's tree puts the spot at the very limit of the modal's reach, and the auto-scroll decides which side of the limit a run lands on. It isn't specific to load: it failed unthrottled. Load lengthens the time in the scroll strip, which raises the rate.

**A second route appears at 8×.** All five 8× failures had a right reading as the modal opened. The hold's 500 ms ran out while the helper's second approach was still under way, so five to eight pointer samples arrived after the modal opened. They ended the hold on the reading and carried the ghost up a gap over the modal's rows. This is cause A.

**Batch 4c's correction 13 leaves the cause in place.** It re-aims until the section reads the gap, on the reasoning that a slow run leaves the ghost a gap short. The section was never short. At 4× the re-aiming version failed 5 of 10 against the committed sequence's 2 of 10, each time inside its poll, which was still moving the pointer when the modal opened: three read `23:3`, one timed out, and one aimed at a section row the open modal had replaced.

### DRAG-7.17, the gap below R's overflow row: not reproduced

No wrong reading in 28 runs at 1×, 4× and 8×, nor in the ten at 16×. The geometry is the same as above: the list is at the end of its scroll in every run (343 of 343), so the spot can't follow the cursor up. The cursor rested at least 8 px inside the limit each time, because this test picks `X` up at the edge of the scroll strip and the column moves 14 px at most. The recorded failure, one gap above at five workers, fits a longer scroll, but no run here shows it.

### DRAG-7.28's carried row: not a flake

The version that failed isn't saved. It ran once (`batch4c-files-full2.json`), failed with `5:3` for `4:3`, and was replaced; its successor's comment says an aim at the row after the gap reads the gap after that row. Both aims were run at 1×, 4× and 8×, six times each:

| Aim, with `R1` carried down | Reading | Runs |
| --- | --- | --- |
| The row after the gap, `T` | `5:3` | 18 of 18 |
| The row before the gap, `R2` | `4:3` | 18 of 18 |

The projection took the same path in every run of each. Carried down over a row, the ghost takes that row's slot, which is dnd-kit's shuffle as the drag layer's notes describe it. So this was a wrong aim on a new test's first run. Load plays no part, and the current test's aim is the right one.

### What this leaves, for its owners

No fix was made. Three things follow from the above:

- **Nothing here is a reading the app gets wrong.** A hand dragging from the bottom of a tall Card would see the same as DRAG-7.17's failing run, and the wiki describes it.
- **DRAG-7.17's two varying inputs are in the test's setup:** how far the column scrolls at pickup, and whether the hold completes during an approach. A run in which the column can't scroll, and the hold can't complete before the cursor rests, has neither.
- **A question for the Planner:** DRAG-7.17's Given doesn't say the spot has to be within the modal's reach, and DRAG-7.16 covers the case where it isn't. The two meet where this test sits.

## Cause C — acting on an element that is still arriving

- **DRAG-7.32, confirmed by batch 4c's own diagnostic:** Escape pressed as soon as the Sheet's heading shows is lost 4 times in 40, and never after a 150 ms wait. Whether a Sheet still sliding in counts as open is already a Planner question. Why the first 150 ms ignores Escape is a Coder question, and a small one.
- **DRAG-7.28, probable:** the Sheet's box read at 1,312 px against a bound of 928, once, later in the run that had suspended.
- **C1 (QA Engineer):** "the Sheet is open" becomes one page-object helper that waits for the slide to end. Each spec stops deciding when the Sheet is ready.

## Cause D — a connection reset between tests

**The signature.** Both resets are the first request of a test, 0.1 s in. In both, the same worker's previous test ran for 6.0 s:

| Report | Failed request | Previous test on that worker |
| --- | --- | --- |
| `parallel-workers-batch3/drag-3w-repeat5.json` | `POST /api/projects`, DRAG-3.16 | DRAG-3.17 and 3.20, 6.0 s |
| `batch2e-followup-drag53.json` | `GET /api/items/:id`, DRAG-5.3 | DRAG-5.3's locked-after-A, 6.0 s |

**The probable mechanism.** Node's HTTP server closes a keep-alive connection that has been idle for 5 seconds, and `server/src/index.ts` leaves that default. Playwright 1.61's API client keeps one keep-alive pool for the whole worker process, so the next test reuses the last test's connection. A drag test makes its API calls at its start and its end, with four to six seconds of gesture between. When the gap comes to about five seconds, the request goes out on a connection the server is closing.

**To settle it:** one spec that makes a request, waits between 4.9 and 5.1 s and makes another, repeated a few hundred times on one worker.

**Proposals.**
- **D1 (Coder, one line):** give the listening server a keep-alive timeout well past any test's quiet stretch.
- **DRAG-3.16's skip:** the test was skipped for this reset and is due back in batch 4h. If the run above reproduces the reset, the skip was never about that test, and it can come back when D1 lands.

## Cause E — the machine suspended

`batch4c-files-full2.json`, 2026-11-11: four tests on four slots started 24 to 27 s into the run and ended about 867 s in. Three timed out, and the fourth reported `net::ERR_NETWORK_IO_SUSPENDED`, which Chromium raises when the system suspends. The run lost 14 minutes and reported four failures no test caused. Batch 4a's retrospective recorded 310 minutes of stalls it attributed to suspension.

- **E1 (Nathan, today):** stop the machine sleeping while it's plugged in, or for the length of a run.
- **E2 (QA Engineer):** the run holds the machine awake itself, from global setup to teardown.
- **E3 (QA Engineer):** a result that ran far past its own timeout is reported as an interrupted run, not as a failed test.

## What the twenty repeats buy

A test that fails one run in *n* still passes twenty repeats this often:

| Fails | Passes all twenty |
| --- | ---: |
| 1 run in 100 | 82% |
| 1 in 50 | 67% |
| 1 in 20 | 36% |
| 1 in 10 | 12% |

So the bar catches a test that fails often, and usually passes one that fails once in fifty runs. The flakes above sit at or below that rate on a quiet machine. On one worker the bar could not reach causes A and B at all, since both need load. From 4c on it runs at five workers, which helps, but it is still a lottery.

**Decided (Nathan, 2026-11-11):** D2 is ten repeats from 4c on. Ten still catch a test that fails one run in five (89%) and usually one that fails one in ten (65%), at half the cost. Story 10's plan records it in D2.

**Proposal F (Nathan decides; it changes D2).** Find timing dependence by disturbing the run, not by repeating it:
- each added or changed drag test passes on one worker in three modes: as written, with a slowed pointer, and with the CPU throttled;
- a small number of repeats in each mode, then the file's five-worker run as now.

**Try the detector before adopting it.** The committed DRAG-7.10 test and DRAG-7.17 are known flakes. Both should fail in a disturbed mode on one worker. If they don't, the proposal is wrong, and the trial costs a few minutes.

**Half of that trial is done.** The reproduction above throttled DRAG-7.17's gap-above test: its failures rose from 1 of 13 unthrottled to 2 of 10 at 4× and 5 of 10 at 8×. So throttling does expose it, though ten runs at 4× could still have passed, and 8× added a failure of its own kind. It never tipped the gap-below test. DRAG-7.10 and the slowed pointer weren't tried.

## Why the tests stay at the surface

Nathan's stated intent is that a brittle drag test is simplified to its stable part, and the rest goes to an internal test or to a check by hand. The rules as written lean the other way:

- **D2 orders its remedies:** a harness fix first, an internal test second, Manual third. Every flake so far stopped at the first.
- **`docs/test-plans/README.md`:** a surface test is preferred; an internal test counts only with Nathan's approval outside two approved categories; no internal test is mapped beside a surface test that covers the whole case.
- **A case is held off only when the QA Engineer records that it can't be reached.** The Test Reviewer then weighs internal coverage, and Nathan decides. The QA Engineer may not propose Manual.
- **The Test Reviewer checks the whole Then at the surface,** so a review adds precision to a drag test. Its first 4c pass asked DRAG-7.9's test for a second offset and DRAG-7.17's for one more assertion on the hold.

The result, across 75 cases in 4a, 4b and 4c: no case held off, no internal mapping outside the approved clock category, no Manual call beyond the D13 looks. Nobody broke a rule. No role is asked to route a case away from the surface, and only the role that may not propose it sees the cost.

**The variants.** Batch 4a's 34 cases became 31 authored tests and 89 variants, and 4b's 26 cases became 70. DRAG-1.16 alone runs fifteen origin and place variants. Each is a full gesture with its own aim, its own clocks, and its own repeats.

**Proposal G (Nathan decides; the Test Planner and the Architect own the docs it would change).**
- **G1. A layer table at Stop 1.** For each clause of each case, the proof plan names what proves it: a surface gesture, a surface test with no gesture, an internal test, or a look by hand. Nathan approves the table with the plan. The Test Reviewer then judges each test against its row.
- **G2. A third approved category of internal test: a variant matrix.** One surface test reaches the gesture and checks its write. The other rows of the matrix, the origins, places and forms that change the outcome and not the gesture, are tested in the pure module that decides them (`placement.ts`, `dragRequest.ts`, `descendantsProjection.ts`). It matches what `testing-strategy.md` already says a drag test is for: the gesture is reachable and its write is correct.
- **G3. The QA Engineer may recommend a layer** in the proof plan, with its reason. The decision stays where it is.

**Decided (Nathan, 2026-11-11):** G1 and G3 are standing rules, with a test's length and its second correction as signals: `.claude/guides/testing-strategy.md` ("When a surface test costs more than it proves"), the QA Engineer persona and the Test Reviewer's definition. Story 10's Stops 1 and 2 point at them. G2 waits for a Planner session, in the Living-docs handoff of Story 10's plan.

One thing to weigh: an internal test is written from the code's own modules, and the surface tests are valued for being written from the case alone. The two approved categories handle this by requiring the test to come from the Then. G2 would carry the same condition.

## Suggested order

| # | Step | Owner | Size |
| --- | --- | --- | --- |
| 1 | E1: stop the machine sleeping during runs | Nathan | Minutes |
| 2 | D1 and its reproducing spec | Coder, QA Engineer | One line and one spec |
| 3 | The detector trial of proposal F, on the two known flakes | QA Engineer | Minutes of run time |
| 4 | A1's clock spike, on three tests | QA Engineer | One session |
| 5 | B1: reproduce DRAG-7.17's and DRAG-7.28's wrong readings. Done; no Coder work came of it | — | — |
| 6 | Proposal G, before batch 4d's Stop 1 | Nathan, then the Test Planner and the Architect | A ruling and two doc edits |

Steps 3 to 6 are worth more before batch 4d than after it. 4d's flash window and forced stops are about clocks, and 4g holds TREE-1.19.

## Limits

- **Only the reproduction was run.** Causes A, B and D rest on error text, run timelines and reading the code. Each names the run that would settle it.
- **The reproduction's one unthrottled failure has no saved log.** A second 1× run overwrote the first run's report and page logs. Its numbers here (the cursor at y 404, the list at 371 of 371, `23:3`) are as read at the time. The 4× and 8× failures are saved.
- **DRAG-7.28's failing version is inferred,** from its one failed run, its replacement and that replacement's comment.
- **DRAG-7.10's two modes are not fully explained.** The mode that ends at Board has cause A's signature. The mode that reaches its column and stays attached after the release (4 attempts) is unexplained. Cause B is one candidate.
- **DRAG-5.4's B03 failures** (2, one worker, 2026-11-09) and DRAG-5.3's one 30 s timeout have no cause here.
- **Batch 4c's tests were still changing** while this was written. Its three latest file runs are counted as they stood.
- **Runs whose reports weren't saved as JSON** aren't counted: the Phase 3 logs, and anything before 2026-11-07.

## Reports cited

All under `tests/output/`.

| Flake | Reports |
| --- | --- |
| DRAG-7.10, ends at Board | `parallel-workers-batch3/full-3w-2.json`, `full-3w-3.json`; `parallel-workers-scaling-20261110/full-4w-1.json`, `full-4w-2.json`, `full-4w-3.json`, `full-6w-2.json`; `batch4c-trace-contention.json` |
| DRAG-7.10, stays attached | `parallel-workers-batch3/drag-3w-repeat5.json`; `batch2e-followup-full-e2e-3w.json`; `parallel-workers-scaling-20261110/full-5w-1.json`, `full-5w-2.json` |
| DRAG-7.17 | `batch4c-trace-contention.json`; `batch2e-followup-full-e2e.json` |
| DRAG-7.28, both | `batch4c-files-full2.json` |
| The drop line that never drew | `batch4c-files-full.json` |
| DRAG-7.32 | `batch4c-trace-alone.json`; `batch4c-trace-t3-diag.json` |
| The connection resets | `parallel-workers-batch3/drag-3w-repeat5.json`; `batch2e-followup-drag53.json` |
| The suspend | `batch4c-files-full2.json` |
| DRAG-5.4's B03 | `coder-named-anchor-full-e2e.json` |
| The reproduction | `a1-rate1.json`, `a1-rate4.json`, `a1-rate8.json`, `a1-rate16.json`; `a1-728-rate1.json`, `a1-728-rate4.json`, `a1-728-rate8.json`; each run's page log in `a1/` |
| DRAG-5.3's timeout | `batch2e-followup-full-e2e.json` |
