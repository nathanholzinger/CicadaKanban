# Testing Strategy

What each test layer is for, where tests live, how coverage is gated, and what stays manual by design. The test-plan catalog, which maps business cases to these tests, keeps its own conventions in `docs/test-plans/README.md`.

## Running the tests

- **`npm run check`** runs type-check, lint, format check, and the three unit suites: the server's and the client's on Vitest, and `scripts/`' on Node's `node:test`. It's the gate every phase runs.
- **`npm run test:e2e`** runs Playwright. It starts its own stack and never touches the dev database:
  - the server on port 3002, against `server/data/test.db`, with the test routes enabled;
  - the client on port 5174, proxying to it.

  The dev servers use 3001 and 5173, so the two don't collide.
- **`npm run test:coverage`** runs the server suite with its coverage gate.

There's no CI; everything runs locally.

## The layers

| Layer | Where | What it's for |
|---|---|---|
| Playwright UI | `tests/ui/` | User-facing flows through the browser. Drags go through `tests/helpers/dragGesture.ts`, and setup through the `tests/helpers/seed.ts` helpers, never by hand. |
| Playwright API | `tests/api/` | The REST API, through the running server. |
| Server routes | `server/tests/routes/` | Vitest and supertest against the exported app, with a real database. Runs one file at a time, since every file shares one SQLite database. Setup comes from `server/tests/fixtures.ts`, such as `workflowWithPhases` for a project, its workflow, board and workphases, and `move`, `put` and `getRow` for an item's writes and its stored row. Its `create*` helpers assert their status, so a refused setup step fails at its own line; a test of a refusal sends the request itself. `server/tests/itemHierarchyFixtures.ts` adds what only the hierarchy tests share. |
| Server lib | `server/tests/lib/` | Shared domain logic in `server/src/lib/`. |
| Client units | Next to the code, as `*.test.ts(x)` | Pure modules and hooks, in jsdom with Testing Library. Items come from `itemFixture.ts::makeItem` and projects from `projectFixture.ts::makeProject`, never a hand-written literal. |
| Scripts | Next to the code in `scripts/`, as `*.test.mts` | Repo tooling, such as the docs checker, on `node:test`. |

**Which layer a test belongs in:**
- A rule a user or an API caller can see gets a test through that surface: Playwright, or a server route test.
- Logic whose correctness doesn't depend on the surface gets a unit test next to it.
- A shape-only check (a required field, an enum) is cheapest as a route test.

## Setting up a state the API refuses

Some tests need a state no request can produce, such as an exact position or a parentless row that holds the attachment flag. The API refuses those writes on purpose, so the test writes the state itself:
- **Server tests** write the database directly, through `server/tests/fixtures.ts`: `setItemPosition` and `setProjectPosition` pin a position; `setItemParent` and `setProjectParent` a parent, with the item's attachment flag when one is given; `setItemWorkphase` an item's workphase, including one in another workflow, or none; and `setColumnEnds` a column's start or end, including one that names no workphase.
- **E2E tests** can't reach the database, so they go through a test route under `/api/test`, which is mounted only with `ENABLE_TEST_ROUTES`. `tests/helpers/seed.ts` wraps each: `pinItemPosition` and `pinProjectPosition` pin a position, `pinProjectCreatedAt` a project's creation time, and `pinProjectParent` its parent.

A new kind of setup gets its own test route. Never loosen a rule in the real API to make a test's setup possible.

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
- **Anything else manual** is decided case by case in the test-plan catalog (`docs/test-plans/README.md`).
