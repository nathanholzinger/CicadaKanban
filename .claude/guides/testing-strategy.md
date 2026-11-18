# Testing Strategy

What each test layer is for, where tests live, how coverage is gated, and what stays manual by design. The test-plan catalog, which maps business cases to these tests, keeps its own conventions in `docs/test-plans/README.md`.

## Running the tests

- **`npm run check`** runs type-check, lint, format check, and the three unit suites: the server's and the client's on Vitest, and `scripts/`' on Node's `node:test`. It's the gate every phase runs.
- **`npm run test:e2e`** runs Playwright on several workers at once, five by default (`tests/helpers/slots.ts`). Each worker has a slot, numbered from 0, and each slot starts its own stack, never touching the dev database:
  - slot N's server on port `3010 + N`, against `server/data/test-N.db`, with the test routes enabled;
  - slot N's client on port `5180 + N`, proxying to it.

  The block stays clear of the dev stack (3001/5173) and the deep stack (3003/5175), so both can stay open during a run. A worker restarted after a failure keeps its slot, so it comes back to the same stack. Whole files are spread across the workers, and a file's tests run in order on one worker.
- **`E2E_WORKERS`** sets the worker count, and a run starts that many stacks only. **`npm run test:e2e:serial`** runs one worker whatever `E2E_WORKERS` says, such as to tell whether a failure comes from load.
  - Never set the count with Playwright's `--workers`. The stacks are started from `E2E_WORKERS`, so a higher `--workers` sends tests to slots with no stack, and a lower one leaves stacks unused.
- **A run never reuses a stack.** A server or client whose port is taken fails the run, rather than joining a leftover server on the wrong database or moving to a port nobody routes to. So two E2E runs can't share the machine at once: start one only after the last has finished.
- **Each run leaves an HTML report in `tests/output/report/` and a JSON one with per-test durations,** in `tests/output/results.json` unless `PLAYWRIGHT_JSON_OUTPUT_NAME` names another path. Name it for a run whose evidence is kept, so a later run doesn't overwrite it. Once the servers stop, a reporter removes each slot's database files.
  - A `--reporter` on the command line replaces all three reporters: that run leaves no JSON report, and its database files stay until the next run resets them. Leave it off a run whose evidence is kept.
- **`npm run test:coverage`** runs the server suite with its coverage gate.

There's no CI; everything runs locally.

## The layers

| Layer | Where | What it's for |
|---|---|---|
| Playwright UI | `tests/ui/` | User-facing flows through the browser. Drags go through `tests/helpers/dragGesture.ts`, and setup through the `tests/helpers/seed.ts` helpers, never by hand. |
| Playwright API | `tests/api/` | The REST API, through the running server. |
| Server routes | `server/tests/routes/` | Vitest and supertest against the exported app, with a real database. Runs one file at a time, since every file shares one SQLite database. Setup comes from `server/tests/fixtures.ts`, such as `workflowWithPhases` for a project, its workflow, board and workphases, and `move`, `put` and `getRow` for an item's writes and its stored row. Its `create*` helpers assert their status, so a refused setup step fails at its own line; a test of a refusal sends the request itself. `server/tests/itemHierarchyFixtures.ts` adds what only the hierarchy tests share. |
| Server lib | `server/tests/lib/` | Shared domain logic in `server/src/lib/`, and the deep seed in `server/src/db/`. |
| Client units | Next to the code, as `*.test.ts(x)` | Pure modules and hooks, in jsdom with Testing Library. Items come from `itemFixture.ts::makeItem` and projects from `projectFixture.ts::makeProject`, never a hand-written literal. |
| Scripts | Next to the code in `scripts/`, as `*.test.mts` | Repo tooling, such as the docs checker, on `node:test`. |

**Who writes which:**
- **The Coder writes the Vitest suites** as part of the build, server routes included. The QA Engineer may edit a Vitest test too, whoever Nathan asks first. It writes a new one only for a case held off at the surface, once Nathan approves.
- **The QA Engineer writes the Playwright suites** from the test-plan cases, and owns their helpers, fixtures, pages, config and global setup (`.claude/personas/qa-engineer.md`).
- **Neither edits a test to make it pass.**
- **The Test Reviewer** (`.claude/agents/test-reviewer.md`) judges whether tests prove their cases, while they're written and in the coverage review at a close. **The Test Reconciler** (`.claude/agents/test-reconciler.md`) writes the catalog's statuses and Automation lines from what it settles. Which check each kind of test change needs is in `.claude/guides/test-coverage-workflow.md`, "Which check a test change needs".

**Which layer a test belongs in:**
- A rule a user or an API caller can see gets a test through that surface: Playwright, or a server route test.
- Logic whose correctness doesn't depend on the surface gets a unit test next to it.
- A shape-only check (a required field, an enum) is cheapest as a route test.

**How many tests a case gets.** One, by default.
- **A variant the case's *Then* names is part of the *Then*,** such as each cause or each layer it lists. The test covers each one, usually as a loop over one setup.
- **A variant the *Then* doesn't name gets no test,** such as another origin, position or form the rule would also hold for. The plan lists it as a suggested variant, and it goes where the MVP's deferrals catalog says:
  <!-- check-docs-ignore-next-line transient-link -- names where open work is tracked -->
  `docs/planning/mvp-deferrals.md`.
- **A missing unnamed variant is never a gap.** A case is covered once its tests assert the whole *Then*.

**When a surface test costs more than it proves.** The surface is the default layer, not a verdict on every clause. These are signals to weigh a test, not limits:
- it runs for more than about 4 seconds on one worker, or waits out more than two of the app's clocks in a row;
- it needs a complicated setup, a very precise action, or a very precise expectation;
- it has needed two corrections to its aim or its timing;
- it repeats one gesture across a matrix of variants;
- its failure needs a precision only a robot has, such as a cursor held perfectly still;
- it races a held response or one of the app's clocks, where a slow run can change which side wins;
- it asserts how something looks (What stays manual), not what the user can do with it.

A test that shows one gets three questions:
1. Which clause of the case's *Then* does each wait, and each precise step, buy?
2. Would its failure tell you something a cheaper test wouldn't?
3. Is the precision in the *Then*, or only in the test?

When the answers go against the test as written, the options are:
- **Simplify it.** Drop the steps and waits that buy no clause, and seed a state instead of reaching it by gesture.
- **One gesture, and the matrix inside.** One surface test shows that the gesture reaches the rule and makes the right write. The variants that change the outcome and not the gesture are tested in the module that decides them. Whether those tests count toward a case is the catalog's rule (`docs/test-plans/README.md`, "Which tests count, and what's manual").
- **Split the case.** The part a test can pin stays automated, and the part that needs a person's eye or hand is checked manually (What stays manual).
- **Keep it.** A failure only a robot can produce can still happen. That's worth a test while the test is cheap and steady, and worth less as it gets slower or flakier.

The QA Engineer flags the signal and recommends an option before it writes the test, and Nathan decides (`.claude/personas/qa-engineer.md`, "Weighing a Surface Test"). Once a test is written, the Test Reviewer gives each one that shows a signal a cost verdict (`.claude/agents/test-reviewer.md`). A change to a case is the Test Planner's. An option changes which test proves a clause, never what the clause says: none of this lets a test drop part of its *Then*.

**Two writing rules make a test cheap to review:**
- **A test asserts its Given before its When,** so it can't pass from the wrong starting state.
- **Each observation helper's header says** whether it reads the screen or an attribute the app provides. A reviewer can then tell a test that observes the app from one that reads back what it set.

## Setting up a state the API refuses

Some tests need a state no request can produce, such as an exact position or a parentless row that holds the attachment flag. The API refuses those writes on purpose, so the test writes the state itself:
- **Server tests** write the database directly, through `server/tests/fixtures.ts`: `setItemPosition` and `setProjectPosition` pin a position; `setItemParent` and `setProjectParent` a parent, with the item's attachment flag when one is given; `setItemWorkphase` an item's workphase, including one in another workflow, or none; and `setColumnEnds` a column's start or end, including one that names no workphase.
- **E2E tests** can't reach the database, so they go through a test route under `/api/test`, which is mounted only with `ENABLE_TEST_ROUTES`. `tests/helpers/seed.ts` wraps each: `pinItemPosition` and `pinProjectPosition` pin a position, `pinProjectCreatedAt` a project's creation time, and `pinProjectParent` its parent.

A new kind of setup gets its own test route. Never loosen a rule in the real API to make a test's setup possible.

## A snapshot of the tree

A frozen run's evidence, and a session's return, name the tree they ran on by a tree id. It's written through a temporary index, so it counts untracked files, skips ignored ones, and leaves the real index untouched:

```bash
idx=$(mktemp -u); GIT_INDEX_FILE="$idx" git -c core.safecrlf=false add -A && GIT_INDEX_FILE="$idx" git write-tree; rm -f "$idx"
```

`git diff <old> <new>` between two tree ids isolates what changed, even in an uncommitted tree that holds other sessions' edits.

## Coverage

- **Server: a hard gate on chosen files, not a global bar.** `server/vitest.config.ts` lists the core files of the work in flight, each held to 80% statements, branches, functions and lines. Every other file is measured but can't fail the run. New work adds its core files to that list; nobody raises a global percentage.
- **Client:** measured and reported, not gated.
- **At epic close,** 80% overall is attempted as a sanity check (`.claude/guides/epic-done-checklist.md`), and a shortfall needs a reason.

## What stays manual

- **Drag feel and timing.** The drag thresholds (pop delays, bands) are tuned by feel through the drag tuning panel, so they change.
  - An automated drag test asserts that a gesture is *reachable*, and that the write it makes is correct.
  - It never asserts a duration.
  - **A clock's logic is automated in the pop state machine** (`popSession.ts`): what counts toward a clock, what resets it, and which band fires. The test passes the threshold in as a parameter, so its pass doesn't depend on the tuned value. This is an approved category of internal test (`docs/test-plans/README.md`).
  - A case whose pass depends on the tuned values themselves is manual, and may stay manual once the values settle, since whether they feel right is a judgment.
- **How something looks.** A test can read the attribute the client sets for a look, such as `data-drop-tier`, `data-pending` or `data-stop-flash`. It can't tell whether the result looks right.
  - **Manual:** how something is painted (opacity, colour, a pulse, a fade, a tilt, a shadow), and a measurement that only says how it's drawn, such as an exact height, width, offset or alignment.
  - **Never manual:** what's saved; which row is affected; which tier, form or state a row has; and where something sits relative to the rows around it, which tells the user what a drop will do. The highlight under A rather than above B, the ghost between A and B, and a banner at the top of the window are behavior. They stay automated through `dragGesture.ts::boxOf` and `dragGesture.ts::paintedBoxOf`, and so does any measurement the drag's own logic reads.
  - **A case that holds both becomes two:** the part a test can pin, and the look, in a shared `Manual` case. There's one shared case per look, since a look checked once holds wherever it's drawn.
  - **An automated geometry assertion that already exists stays** until it's weighed like any other test, on its cost and its stability (When a surface test costs more than it proves).
- **Anything else manual** is decided case by case in the test-plan catalog (`docs/test-plans/README.md`).

## What isn't tested

- **The drag tuning panel.** It's a temporary developer tool, retired once the values lock and become constants. So no test-plan case and no test covers the panel: its fields, what it persists, or how it reads a typed value. A spec may still seed the panel's values to set its own thresholds (`seedDragTuning`). That's setup, not a test of the panel.
