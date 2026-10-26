import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { API } from '../helpers/api';
import { seedProject, seedTemplatedWorkflow } from '../helpers/seed';
import { column } from '../helpers/boardLocators';

// Setting up a workflow for a project that has none: from scratch, from a
// template, or by copying another project's.

// ─────────────────────────────────────────────────────────────────
// Workflow creation modes: Scratch, Template, Copy
// ─────────────────────────────────────────────────────────────────

test.describe('workflow creation', () => {
  test.beforeAll(async ({ request }) => {
    await resetAndSeedDb();

    // Source project whose workflow can be copied
    await seedTemplatedWorkflow(request, 'Source Project');
  });

  test('creates a workflow from scratch (custom)', async ({ page, projectSidebar, request }) => {
    await seedProject(request, { name: 'Scratch Project' });

    await projectSidebar.openBoard('Scratch Project');

    await page.getByRole('button', { name: /Set up a Workflow/ }).click();
    await page.getByRole('button', { name: 'Custom' }).click();

    // Empty workflow — no workphases yet, board is editable but has no columns
    await expect(page.getByRole('button', { name: 'Manage workphases' })).toBeVisible();
    await expect(column(page, 'Todo')).not.toBeVisible();
  });

  test('creates a workflow from a template', async ({ page, projectSidebar, request }) => {
    await seedProject(request, { name: 'Template Project' });

    await projectSidebar.openBoard('Template Project');

    await page.getByRole('button', { name: /Set up a Workflow/ }).click();
    // /^flow/i anchors to the start of the accessible name, avoiding the "Set up a Workflow" button
    await page.getByRole('button', { name: /^flow/i }).click();

    await expect(column(page, 'Todo')).toBeVisible();
    await expect(column(page, 'In Progress')).toBeVisible();
    await expect(column(page, 'Review')).toBeVisible();
    await expect(column(page, 'Done')).toBeVisible();
  });

  test('creates a workflow by copying from another project', async ({ page, projectSidebar, request }) => {
    await seedProject(request, { name: 'Copy Project' });

    await projectSidebar.openBoard('Copy Project');

    await page.getByRole('button', { name: /Set up a Workflow/ }).click();
    // The copy section shows "Source Project" as a copyable workflow
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Source Project/ })
      .click();

    // Should get the same workphases as Source Project's flow workflow
    await expect(column(page, 'Todo')).toBeVisible();
    await expect(column(page, 'Done')).toBeVisible();
  });

  // App.tsx loads `workflows` and `projects` once, at mount, and learns of a
  // change after that only from its own writes. So a project deleted elsewhere
  // in the same session is still offered as a "copy from" source here. The
  // server refuses the copy with a 400, since the source workflow no longer
  // exists, and the dialog must say so: a silent failure would leave the user
  // believing the workflow was created.
  test('copying from a project deleted after the page loaded surfaces an error, not a silent no-op', async ({
    page,
    projectSidebar,
    request,
  }) => {
    const { project: source } = await seedTemplatedWorkflow(request, 'Stale Copy Source');
    await seedProject(request, { name: 'Stale Copy Target' });

    // Mount the app while "Stale Copy Source" and its workflow still exist —
    // App.tsx fetches `workflows` and `projects` here, and nothing fetches them
    // again when the server's data changes elsewhere. `page.goto` only waits
    // for the page load event, not for that fetch to resolve, so wait for the
    // sidebar to actually show it before deleting anything — otherwise the
    // delete below could race ahead of the app's own initial fetch and this
    // wouldn't reproduce staleness at all.
    await page.goto('/');
    await expect(projectSidebar.projectName('Stale Copy Source')).toBeVisible();

    // Delete the source project via a raw API call rather than the UI, so the
    // already-loaded page's in-memory state is left untouched by it —
    // reproducing a project being deleted elsewhere (another tab, another
    // user) mid-visit.
    await request.delete(`${API}/projects/${source.id}`);

    await projectSidebar.showBoard('Stale Copy Target');
    await page.getByRole('button', { name: /Set up a Workflow/ }).click();

    // The now-deleted "Stale Copy Source" still shows up as a copy option —
    // the client never learned it (or its workflow) was gone.
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Stale Copy Source/ })
      .click();

    // Expected: the failure surfaces visibly in the dialog instead of vanishing.
    await expect(page.getByRole('dialog').getByText(/failed|does not reference/i)).toBeVisible();

    // And no workflow should have actually been created for the target project.
    await expect(column(page, 'Todo')).not.toBeVisible();
  });
});
