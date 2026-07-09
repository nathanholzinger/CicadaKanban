# Testing Strategy — Cicada Kanban

> Last updated: Epic 1.5 complete (2026-07-08).

---

## Current State

**Frameworks:** Playwright (E2E) + Vitest (unit), both configured and running.

**Playwright — 7 spec files, 50 test cases, all E2E (browser + full stack):**

| File | What it covers |
|---|---|
| `tests/api/projects.spec.ts` | Project CRUD, nested subprojects, cascade delete, parent validation |
| `tests/api/workflows.spec.ts` | Workflow creation, template use, project filtering |
| `tests/api/items.spec.ts` | Item creation, projectId inheritance, derived workflowId |
| `tests/api/workflowTemplates.spec.ts` | Template retrieval (quick: 2 phases, flow: 4 phases) |
| `tests/ui/project-sidebar.spec.ts` | Sidebar zero state, project CRUD, nesting, collapse/expand, persistence |
| `tests/ui/project-page.spec.ts` | Project detail, subproject navigation, breadcrumbs, inline edit, reparenting |
| `tests/ui/boards.spec.ts` | Board loading, workphase/item creation, workflow visibility across projects, inherited read-only, workflow creation modes |

**Test infrastructure:**
- `tests/helpers/db.ts` — `resetAndSeedDb()` hits `POST /api/test/reset`
- `tests/pages/ProjectSidebarPage.ts` — page object for sidebar selectors
- `tests/fixtures.ts` — custom Playwright fixture wrapping sidebar page object
- `tests/global-teardown.ts` — deletes test.db files after suite
- `playwright.config.ts` — Chromium only, no parallel execution, test server on port 3002
- Run: `npm run test:e2e` from project root

**Vitest — 5 server test files (72 tests) + 3 client test files (29 tests):**

| File | What it covers |
|---|---|
| `server/tests/routes/items.test.ts` | Item CRUD, recursive cascade delete |
| `server/tests/routes/projects.test.ts` | Project CRUD, hierarchy |
| `server/tests/routes/workflows.test.ts` | Workflow CRUD |
| `server/tests/routes/workflowTemplates.test.ts` | Template retrieval |
| `client/src/App.test.ts` | App-level logic |
| `client/src/components/item-detail/pillUtils.test.ts` | Item detail pill/label formatting utilities |
| `client/src/components/sidebar/projectTreeUtils.test.ts` | Project sidebar tree flattening/ordering utilities |

**Test infrastructure:**
- `server/src/db/resetTestDb.ts` — in-memory/test DB reset helper for server unit tests
- `server/tests/fixtures.ts` — shared test fixtures
- `client/src/test-setup.ts` — jsdom + testing-library setup
- Run: `npm run test:unit` from project root (or `test:server` / `test:client` individually)

**No CI configured.** Tests run locally only.

---

## Coverage Gaps (as of Epic 1.5)

Features that exist in the API and/or UI but have zero test coverage:

| Area | Type | Gap |
|---|---|---|
| **Item detail panel** | UI | Editing title/description, viewing activity log, viewing children |
| **Drag-and-drop within the board** | UI | Items moved via `PATCH /move` in tests, not via browser drag gesture |
| **Labels** | API + UI | CRUD exists in `routes/labels.ts`, zero tests |
| **Notifications** | API + UI | `notifications` route exists, bell UI exists, zero tests |
| **Attachments** | API | Route exists, zero tests |
| **Agents modal** | UI | Component exists (`AgentsModal.tsx`), zero tests |
| **Item types** | API | Route exists (`/item-types`), zero tests |
| **Drag-and-drop project reorder** | UI | Sidebar drag tested manually, not via E2E |

---

## Recommended Testing Strategy

### Layer 1: Playwright for UI + API flows

Playwright is working well. The API tests (using Playwright's `request` fixture
directly against the running server) are a pragmatic middle ground — they're not unit
tests, but they're fast and they verify the full stack including DB writes. Keep this
pattern for route-level coverage.

**Priority new Playwright tests (tackle before Epic 2):**

1. **Item detail panel** — open an item, edit title, verify saved; view activity log
   after a move
2. **Labels** — create a label, assign to item, verify it shows on the item's card, remove it
3. **Notifications** — move an item to a `triggersNotification` workphase, verify bell badge
   appears within the polling interval (or mock the poll)

**Eventually (not blocking Epic 2):**

4. Browser drag-and-drop for item reorder within a workphase
5. Browser drag-and-drop for project sidebar reorder
6. Agents modal CRUD

### Layer 2: Vitest for unit tests

**Why Vitest:** Vite is already used in the client. Vitest reuses the same config with
zero extra setup, has native TypeScript support, and runs much faster than Playwright
for pure logic tests. Set up for both client and server as of Epic 1.5.

**Server unit tests** (`server/tests/routes/*.test.ts`) currently cover item CRUD +
recursive cascade delete, project hierarchy, workflow CRUD, and template retrieval.

**Client unit tests** (`client/src/**/*.test.ts`) currently cover `App.tsx` logic,
item-detail pill formatting (`pillUtils.ts`), and the sidebar tree flattening algorithm
(`projectTreeUtils.ts`).

**Not yet covered, worth adding as extracted:**
- The position calculation in item create (`max + 1.0`, midpoint for reorder)
- `computeDepth()` in `routes/items.ts` — the recursive depth walker
- The `effectiveWorkflow` inheritance logic in `App.tsx`, if extracted to a utility

**Component tests** (if/when warranted):

`@testing-library/react` is already wired up (`client/src/test-setup.ts`) for
components with non-trivial rendering logic. Not a priority right now — the
Playwright suite covers the critical UI paths. Consider adding component tests when
a component becomes complex enough that E2E is too slow to iterate on.

---

## Coverage Target (pragmatic, not dogmatic)

Rather than a hard % line coverage number, the goal is:

1. Every **API route** has at least a happy-path Playwright API test
2. Every **user-facing UI flow** has a Playwright UI test for the golden path
3. Every **non-trivial pure function** has a Vitest unit test
4. **New business logic added in each epic** gets unit tests before the epic closes
   (enforced via the Epic DoD checklist)

---

## CI (Future)

No CI is configured. When ready, GitHub Actions is the natural choice:

```yaml
# .github/workflows/test.yml (skeleton)
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: cd server && npm ci
      - run: cd client && npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
```

Vitest tests would be added as additional steps once set up.
