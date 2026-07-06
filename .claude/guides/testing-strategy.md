# Testing Strategy — Cicada Kanban

> Last updated: Epic 1 complete (2026-07-05).

---

## Current State

**Framework:** Playwright only. No unit or component test framework configured.

**7 test files, ~45 test cases — all E2E (browser + full stack):**

| File | What it covers |
|---|---|
| `tests/api/projects.spec.ts` | Project CRUD, nested subprojects, cascade delete, parent validation |
| `tests/api/workflows.spec.ts` | Workflow creation, template use, project filtering |
| `tests/api/items.spec.ts` | Item creation, projectId inheritance, derived workflowId |
| `tests/api/workflowTemplates.spec.ts` | Template retrieval (quick: 2 cols, flow: 4 cols) |
| `tests/ui/project-sidebar.spec.ts` | Sidebar zero state, project CRUD, nesting, collapse/expand, persistence |
| `tests/ui/project-page.spec.ts` | Project detail, subproject navigation, breadcrumbs, inline edit, reparenting |
| `tests/ui/boards.spec.ts` | Board loading, column/item creation, workflow visibility across projects, inherited read-only, workflow creation modes |

**Test infrastructure:**
- `tests/helpers/db.ts` — `resetAndSeedDb()` hits `POST /api/test/reset`
- `tests/pages/ProjectSidebarPage.ts` — page object for sidebar selectors
- `tests/fixtures.ts` — custom Playwright fixture wrapping sidebar page object
- `tests/global-teardown.ts` — deletes test.db files after suite
- `playwright.config.ts` — Chromium only, no parallel execution, test server on port 3002

**No CI configured.** Tests run locally only.

---

## Coverage Gaps (Epic 1 scope)

Features that exist in the API and/or UI but have zero test coverage:

| Area | Type | Gap |
|---|---|---|
| **Card detail panel** | UI | Editing title/description, viewing activity log, viewing children |
| **Drag-and-drop within the board** | UI | Items moved via `PATCH /move` in tests, not via browser drag gesture |
| **Labels** | API + UI | CRUD exists in `routes/labels.ts`, zero tests |
| **Notifications** | API + UI | `notifications` route exists, bell UI exists, zero tests |
| **Attachments** | API | Route exists, zero tests |
| **Agents modal** | UI | Component exists (`AgentsModal.tsx`), zero tests |
| **Item types** | API | Route exists (`/item-types`), zero tests |
| **Drag-and-drop project reorder** | UI | Sidebar drag tested manually, not via E2E |

---

## Recommended Testing Strategy

### Layer 1: Keep Playwright for UI + API flows

Playwright is working well. The API tests (using Playwright's `request` fixture
directly against the running server) are a pragmatic middle ground — they're not unit
tests, but they're fast and they verify the full stack including DB writes. Keep this
pattern for route-level coverage.

**Priority new Playwright tests (tackle before Epic 2):**

1. **Card detail panel** — open a card, edit title, verify saved; view activity log
   after a move
2. **Labels** — create a label, assign to item, verify it shows on card, remove it
3. **Notifications** — move an item to a `triggersNotification` column, verify bell badge
   appears within the polling interval (or mock the poll)

**Eventually (not blocking Epic 2):**

4. Browser drag-and-drop for item reorder within a column
5. Browser drag-and-drop for project sidebar reorder
6. Agents modal CRUD

### Layer 2: Add Vitest for unit and integration tests

**Why Vitest:** Vite is already used in the client. Vitest reuses the same config with
zero extra setup, has native TypeScript support, and runs much faster than Playwright
for pure logic tests. It's the lowest-friction choice for both client and server.

**Server unit tests** (`server/src/**/*.test.ts`):

Focus on logic that's easy to test in isolation:
- The position calculation in item create (`max + 1.0`, midpoint for reorder)
- `computeDepth()` in `routes/items.ts` — the recursive depth walker
- The recursive delete fix (once implemented — see quality audit finding #2)
- Any utility extracted from `App.tsx`'s inheritance traversal if it moves server-side

**Client unit tests** (`client/src/**/*.test.ts`):

Focus on pure functions and isolated logic:
- `getAncestors()` in `App.tsx` (pure function, easy to unit test)
- `flattenTree()` in `ProjectSidebar.tsx` (the dnd-kit tree flattening algorithm)
- The `effectiveWorkflow` inheritance logic if extracted to a utility

**Component tests** (if/when warranted):

Use `@testing-library/react` + `vitest` for components with non-trivial rendering logic.
Not a priority right now — the Playwright suite covers the critical UI paths. Consider
adding component tests when a component becomes complex enough that E2E is too slow
to iterate on.

### Vitest Setup (when ready)

**Server:**
```jsonc
// server/package.json — add to devDependencies
"vitest": "^3.x"
```
```typescript
// server/vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { environment: 'node' } });
```

**Client:**
```jsonc
// client/package.json — add to devDependencies
"vitest": "^3.x",
"@testing-library/react": "^16.x",
"@testing-library/user-event": "^14.x",
"jsdom": "^26.x"
```
```typescript
// client/vite.config.ts — add to existing config
test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'] }
```

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
