# Testing Strategy

What each test layer is for, where tests live, how coverage is gated, and what stays manual by design. The test-plan catalog, which maps business cases to these tests, keeps its own conventions in `docs/test-plans/README.md`.

## Running the tests

- **`npm run check`** runs type-check, lint, format check, and both Vitest suites. It's the gate every phase runs.
- **`npm run test:e2e`** runs Playwright. It starts its own stack and never touches the dev database:
  - the server on port 3002, against `server/data/test.db`, with the test routes enabled;
  - the client on port 5174, proxying to it.

  The dev servers use 3001 and 5173, so the two don't collide.
- **`npm run test:coverage`** runs the server suite with its coverage gate.

There's no CI; everything runs locally.

## The layers

| Layer | Where | What it's for |
|---|---|---|
| Playwright UI | `tests/ui/` | User-facing flows through the browser. Drags go through `tests/helpers/dragGesture.ts`, never by hand. |
| Playwright API | `tests/api/` | The REST API, through the running server. |
| Server routes | `server/tests/routes/` | Vitest and supertest against the exported app, with a real database. Runs one file at a time, since every file shares one SQLite database. |
| Server lib | `server/tests/lib/` | Shared domain logic in `server/src/lib/`. |
| Client units | Next to the code, as `*.test.ts(x)` | Pure modules and hooks, in jsdom with Testing Library. Items come from `itemFixture.ts::makeItem`, never a hand-written literal. |

**Which layer a test belongs in:**
- A rule a user or an API caller can see gets a test through that surface: Playwright, or a server route test.
- Logic whose correctness doesn't depend on the surface gets a unit test next to it.
- A shape-only check (a required field, an enum) is cheapest as a route test.

## Setting up a state the API refuses

Some tests need a state no request can produce, such as an exact position or a parentless row that holds the attachment flag. The API refuses those writes on purpose, so the test writes the state itself:
- **Server tests** write the database directly. `server/tests/fixtures.ts::setItemPosition` pins a position.
- **E2E tests** can't reach the database, so they go through a test route under `/api/test`, which is mounted only with `ENABLE_TEST_ROUTES`. `PATCH /api/test/items/:id/position` pins a position, through `tests/helpers/seed.ts::pinItemPosition`.

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
