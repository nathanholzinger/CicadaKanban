import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { pickWorkphases, seedItem, seedTemplatedWorkflow } from '../helpers/seed';
import { article } from '../helpers/boardLocators';

test.beforeEach(async () => {
  await resetAndSeedDb();
});

// A browser that blocks site data throws as `localStorage` is reached. What the app keeps there, the
// active project and each workflow's active board, is a convenience: with none, it opens on the
// first of each and carries on (`client/src/lib/browserStorage.ts`).
test('the app mounts and opens a board where the browser blocks its site data', async ({
  page,
  request,
  projectSidebar,
}) => {
  const name = 'Blocked Site Data Project';
  const { project, workflow } = await seedTemplatedWorkflow(request, name);
  const [todo] = pickWorkphases(workflow, 'Todo');
  await seedItem(request, { title: 'Kept On Board', projectId: project.id, workphaseId: todo.id });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
      configurable: true,
    });
  });

  // Selecting the project writes the active project, which the blocked storage refuses.
  await projectSidebar.openBoard(name);

  await expect(article(page, 'Kept On Board')).toBeVisible();
});
