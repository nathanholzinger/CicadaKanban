import { test, expect } from '../fixtures';
import type { Page } from '@playwright/test';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { resetAndSeedDb } from '../helpers/db';
import { dragTo, pastColumnEnd, setBackDownLeaning } from '../helpers/dragGesture';
import { article, column } from '../helpers/boardLocators';
import { fetchItem, seedColumn } from '../helpers/seed';
import {
  seedCrossProjectRepositioningScenario,
  projectOrder,
  fullOrder,
  type CrossProjectRepositioningScenario,
} from '../helpers/itemRepositioningScenario';
const ROOT_NAME = 'Cross Project DnD';

// Real drag gestures over tests/api/itemRepositioningCrossProject.spec.ts's
// shared scenario: a root project owning one workflow/workphase, two child
// sub-projects (1a, 1b)
// inheriting it, A/C/E in 1a and B/D in 1b, all rendered in ONE shared
// column (single workphase, unlike the cross-column suite's two-column
// split — this suite isolates project scoping as the only variable).
//
// Because there's only one shared column, the full item list on the root's
// (unfiltered) board is a single flat stack sorted by position: A,B,C,D,E.
//   - "after E"-shaped gestures (1.b, 4.a) target the empty space past the
//     true last card in the relevant board's list, which really is E in
//     both cases — the same mechanism as the cross-column suite's 1.b.
//   - 3.a and 3.b set C back down in its own slot, leaning up or down, as
//     in the cross-column suite.
//
// 1.b/3.a/3.b act on project1a's own (inherited, read-only) board — dragging
// there IS still possible: readOnly only hides the column and workphase
// management controls, never the drag. 4.a acts on the root's board,
// the only place both project1a's and project1b's items are visible
// together to anchor against.

let scenario: CrossProjectRepositioningScenario;

test.beforeEach(async ({ request, page }) => {
  await resetAndSeedDb();
  scenario = await seedCrossProjectRepositioningScenario(request, ROOT_NAME);

  // The root's auto-bootstrapped default board has zero columns (the shared
  // workphase post-dates workflow creation, same "bare workflow" pattern as
  // tests/ui/boards-layer.spec.ts) — add one column covering it explicitly.
  await seedColumn(request, scenario.workflow.id, scenario.sharedPhase.id);

  await page.goto('/');
});

async function goToBoard(page: Page, projectSidebar: ProjectSidebarPage, projectName: string) {
  await projectSidebar.showBoard(projectName);
  await expect(column(page, 'Shared Phase')).toBeVisible();
}

// Drag gesture recipe: tests/helpers/dragGesture.ts.

test.describe('1: extreme boundary moves within project 1a', () => {
  test("1.b — drag C past the end of project 1a's board", async ({ page, request, projectSidebar }) => {
    await goToBoard(page, projectSidebar, scenario.project1a.name);
    const sharedColumn = column(page, 'Shared Phase');
    await dragTo(page, article(page, 'Item C'), () => pastColumnEnd(sharedColumn));

    await expect.poll(async () => (await fetchItem(request, scenario.items.C.id)).position).toBe(6.0);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('AEC');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDEC');
  });
});

test.describe('3: interior moves that stay in project 1a (collapse with group 2)', () => {
  test('DRAG-1.24: 3.a — set C back down in its own slot, leaning up: "after A"', async ({
    page,
    request,
    projectSidebar,
  }) => {
    await goToBoard(page, projectSidebar, scenario.project1a.name);
    await setBackDownLeaning(page, article(page, 'Item C'), 'up');

    // Project 1a's board shows A, C, E; B and D (project 1b) sit between
    // them in the workflow-wide order. "After A" lands C between A and B —
    // see item-repositioning-cross-column-dnd.spec.ts's header.
    await expect.poll(async () => (await fetchItem(request, scenario.items.C.id)).position).toBe(1.5);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACBDE');
  });

  test('DRAG-1.24: 3.b — set C back down in its own slot, leaning down: "before E"', async ({
    page,
    request,
    projectSidebar,
  }) => {
    await goToBoard(page, projectSidebar, scenario.project1a.name);
    await setBackDownLeaning(page, article(page, 'Item C'), 'down');

    // "Before E" lands C between D and E, the API suite's 3.b.
    await expect.poll(async () => (await fetchItem(request, scenario.items.C.id)).position).toBe(4.5);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE');
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ABDCE');
  });
});

test.describe('4: reverse direction — moving a project 1b item against a project 1a anchor', () => {
  test('4.a — from the root board, drag B past the end (after E)', async ({ page, request, projectSidebar }) => {
    await goToBoard(page, projectSidebar, scenario.rootProject.name);
    const sharedColumn = column(page, 'Shared Phase');
    await dragTo(page, article(page, 'Item B'), () => pastColumnEnd(sharedColumn));

    await expect.poll(async () => (await fetchItem(request, scenario.items.B.id)).position).toBe(6.0);
    await expect
      .poll(async () => (await fetchItem(request, scenario.items.B.id)).projectId)
      .toBe(scenario.project1b.id);
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1a.id)).toBe('ACE'); // unaffected
    expect(await fullOrder(request, scenario.workflow.id)).toBe('ACDEB');

    // The real point of this group: project1b's own board genuinely
    // reorders (B was first, now last) even though the drag happened on
    // the root's board, anchored past an item (E) belonging to project1a.
    await goToBoard(page, projectSidebar, scenario.project1b.name);
    await expect(article(page, 'Item D')).toBeVisible();
    expect(await projectOrder(request, scenario.workflow.id, scenario.project1b.id)).toBe('DB');
  });
});
