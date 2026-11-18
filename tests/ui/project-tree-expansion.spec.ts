import type { APIRequestContext, Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import { holdRequests } from '../helpers/holdRequests';
import { pickUp, release } from '../helpers/dragGesture';
import { aimAtOwnRow, drawnProjectNames, expectSavedProjectTree } from '../helpers/projectTreeDrag';
import { holdNextWrite } from '../helpers/requestHarness';
import { fetchProject, fetchProjects, seedProjects } from '../helpers/seed';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';

// Which projects the sidebar shows open (wiki project-tree §11). A collapse is the user's, by the chevron,
// and lasts until the project is opened again or the app reloads. A create or a parent edit that puts a
// project under a collapsed parent opens it once the write has succeeded, and one that fails or puts no
// project under it leaves it as the user left it. A drop is the other way: it opens its destination before
// the write is sent, and a refusal leaves it open. The writes are held unanswered where a case reads the
// page meanwhile.

test.beforeEach(async () => {
  await resetAndSeedDb();
});

const CREATE_URL = '**/api/projects';
const EDIT_URL = '**/api/projects/*';
const CREATE_FAILED = 'Failed to create project. Please try again.';

// The project's chevron says whether the sidebar shows it open: it offers to collapse one that is.
const open = (sidebar: ProjectSidebarPage, name: string) =>
  expect(sidebar.row(name).getByTitle('Collapse')).toBeVisible();
const collapsed = (sidebar: ProjectSidebarPage, name: string) =>
  expect(sidebar.row(name).getByTitle('Expand')).toBeVisible();

// The rows named `names` that the sidebar shows, in order, and no other of them. It looks only at the names
// it is given, so a row left out of the list is not asserted hidden: `hidden` says so.
const shows = (sidebar: ProjectSidebarPage, ...names: string[]) =>
  expect(sidebar.projectNames(...names)).toHaveText(names);

// No row for any of `names` is in the sidebar.
const hidden = (sidebar: ProjectSidebarPage, ...names: string[]) =>
  Promise.all(names.map(name => expect(sidebar.projectName(name)).toHaveCount(0)));

// The Add subproject dialog, from the subprojects list of the project's page. The sidebar row's
// is `ProjectSidebarPage::createSubproject`.
async function createFromPage(page: Page, sidebar: ProjectSidebarPage, parent: string, name: string) {
  await sidebar.select(parent);
  await page.locator('main').getByTitle('Add subproject').click();
  await submitSubproject(page, name);
}

async function submitSubproject(page: Page, name: string) {
  await page.getByPlaceholder('Subproject name').fill(name);
  await page.getByRole('button', { name: 'Create subproject' }).click();
}

const parentSelect = (page: Page) => page.locator('main').getByRole('combobox');

async function idOf(request: APIRequestContext, name: string): Promise<string> {
  const found = (await fetchProjects(request)).find(project => project.name === name);
  expect(found, `a project named ${name}`).toBeDefined();
  return found!.id;
}

test('TREE-11.1: existing and newly created projects start open', async ({ page, request, projectSidebar }) => {
  await seedProjects(request, [
    ['P', null],
    ['C', 'P'],
    ['G', 'C'],
  ]);
  await page.goto('/');

  // All three rows are shown, with P and C open.
  await shows(projectSidebar, 'P', 'C', 'G');
  await open(projectSidebar, 'P');
  await open(projectSidebar, 'C');

  // A project created after the load, and its first subproject, and that one's first subproject: each shows
  // without the user opening its parent.
  await projectSidebar.newProjectButton.click();
  await page.getByPlaceholder('Project name').fill('N');
  await page.getByRole('button', { name: 'Create project' }).click();
  await shows(projectSidebar, 'P', 'C', 'G', 'N');

  await projectSidebar.createSubproject('N', 'N1');
  await shows(projectSidebar, 'P', 'C', 'G', 'N', 'N1');
  await open(projectSidebar, 'N');

  await projectSidebar.createSubproject('N1', 'N1a');
  await shows(projectSidebar, 'P', 'C', 'G', 'N', 'N1', 'N1a');
  await open(projectSidebar, 'N1');
});

test('TREE-11.2: a chevron collapse hides the subtree until opening or reload', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, [
    ['P', null],
    ['C', 'P'],
    ['G', 'C'],
    ['Q', null],
    ['Q1', 'Q'],
  ]);
  const everyRow = ['P', 'C', 'G', 'Q', 'Q1'];
  const saved = () => Promise.all(everyRow.map(name => fetchProject(request, ids[name])));
  await page.goto('/');
  await shows(projectSidebar, ...everyRow);
  const before = await saved();

  // P collapsed: it stays, C and G are hidden, Q1 stays. The links and positions are the saved ones.
  await projectSidebar.toggle('P');
  await shows(projectSidebar, 'P', 'Q', 'Q1');
  await hidden(projectSidebar, 'C', 'G');
  await collapsed(projectSidebar, 'P');
  expect(await saved()).toEqual(before);

  // P opened again: C and G are back at their places.
  await projectSidebar.toggle('P');
  await shows(projectSidebar, ...everyRow);
  expect(await saved()).toEqual(before);

  // Both collapsed, then a reload: neither collapse survives it.
  await projectSidebar.toggle('P');
  await projectSidebar.toggle('Q');
  await shows(projectSidebar, 'P', 'Q');
  await hidden(projectSidebar, 'C', 'G', 'Q1');
  await page.reload();
  await shows(projectSidebar, ...everyRow);
  await open(projectSidebar, 'P');
  await open(projectSidebar, 'Q');
});

test('TREE-11.3: a successful create opens its collapsed parent from either create entry point', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, [
    ['P', null],
    ['C', 'P'],
    ['Q', null],
    ['Q1', 'Q'],
  ]);
  await page.goto('/');
  await projectSidebar.toggle('P');
  await projectSidebar.toggle('Q');
  await shows(projectSidebar, 'P', 'Q');
  const creates = await holdRequests(page, { method: 'POST', url: CREATE_URL, outcome: 'succeed' });

  await collapsed(projectSidebar, 'P');
  await collapsed(projectSidebar, 'Q');
  await hidden(projectSidebar, 'C', 'Q1');
  // The sidebar's dialog: P stays collapsed while the create is unanswered, and opens on its success, with C
  // then N under it. Q, which the create is not under, stays collapsed.
  await projectSidebar.createSubproject('P', 'N');
  await creates.arrived();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'P', 'Q');
  await hidden(projectSidebar, 'C', 'N', 'Q1');
  creates.release();
  await shows(projectSidebar, 'P', 'C', 'N', 'Q');
  await open(projectSidebar, 'P');
  await collapsed(projectSidebar, 'Q');
  expect((await fetchProject(request, await idOf(request, 'N'))).parentId).toBe(ids.P);

  // The project page's subprojects list, with P collapsed by hand again.
  await projectSidebar.toggle('P');
  await shows(projectSidebar, 'P', 'Q');
  await collapsed(projectSidebar, 'P');
  await hidden(projectSidebar, 'C', 'N', 'Q1');
  await createFromPage(page, projectSidebar, 'P', 'N2');
  await creates.arrived();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'P', 'Q');
  await hidden(projectSidebar, 'C', 'N', 'N2', 'Q1');
  creates.release();
  await shows(projectSidebar, 'P', 'C', 'N', 'N2', 'Q');
  await open(projectSidebar, 'P');
  await collapsed(projectSidebar, 'Q');
  expect((await fetchProject(request, await idOf(request, 'N2'))).parentId).toBe(ids.P);
});

test('TREE-11.4: a failed create leaves its parent collapsed', async ({ page, request, projectSidebar }) => {
  await seedProjects(request, [
    ['P', null],
    ['C', 'P'],
  ]);
  await page.goto('/');
  await projectSidebar.toggle('P');
  await shows(projectSidebar, 'P');
  const creates = await holdRequests(page, { method: 'POST', url: CREATE_URL, outcome: 'refuse' });

  await collapsed(projectSidebar, 'P');
  await hidden(projectSidebar, 'C');
  // Through the sidebar's dialog: P stays collapsed while the request is out, and after it fails.
  await projectSidebar.createSubproject('P', 'N');
  await creates.arrived();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'P');
  await hidden(projectSidebar, 'C', 'N');
  creates.release();
  await expect(page.getByText(CREATE_FAILED)).toBeVisible();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'P');
  await hidden(projectSidebar, 'C', 'N');
  await page.getByRole('button', { name: 'Cancel' }).click();

  // And through the project page's subprojects list.
  await createFromPage(page, projectSidebar, 'P', 'N');
  await creates.arrived();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'P');
  await hidden(projectSidebar, 'C', 'N');
  creates.release();
  await expect(page.getByText(CREATE_FAILED)).toBeVisible();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'P');
  await hidden(projectSidebar, 'C', 'N');

  // Neither request reached the server: no N exists, and C is still the only child.
  const names = (await fetchProjects(request)).map(p => p.name);
  expect(names.sort()).toEqual(['C', 'P']);
});

test('TREE-11.5: a successful parent change opens the collapsed new parent', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, [
    ['X', null],
    ['P', null],
    ['C', 'P'],
    ['Q', null],
    ['Q1', 'Q'],
  ]);
  await page.goto('/');
  await projectSidebar.select('X');
  await projectSidebar.toggle('P');
  await projectSidebar.toggle('Q');
  await shows(projectSidebar, 'X', 'P', 'Q');
  const edits = await holdRequests(page, { method: 'PUT', url: EDIT_URL, outcome: 'succeed' });

  await collapsed(projectSidebar, 'P');
  await collapsed(projectSidebar, 'Q');
  await hidden(projectSidebar, 'C', 'Q1');
  await parentSelect(page).selectOption(ids.P);
  await edits.arrived();
  // P stays collapsed while the edit is unanswered.
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'X', 'P', 'Q');
  await hidden(projectSidebar, 'C', 'Q1');
  edits.release();

  // It opens on the success, with C then X under it. Q, which the edit is not under, stays collapsed.
  await shows(projectSidebar, 'P', 'C', 'X', 'Q');
  await open(projectSidebar, 'P');
  await collapsed(projectSidebar, 'Q');
  expect((await fetchProject(request, ids.X)).parentId).toBe(ids.P);
});

test('TREE-11.6: a failed parent change leaves the new parent collapsed', async ({ page, request, projectSidebar }) => {
  const ids = await seedProjects(request, [
    ['X', null],
    ['P', null],
    ['C', 'P'],
  ]);
  const before = await fetchProject(request, ids.X);
  await page.goto('/');
  await projectSidebar.select('X');
  await projectSidebar.toggle('P');
  await shows(projectSidebar, 'X', 'P');
  const edits = await holdRequests(page, { method: 'PUT', url: EDIT_URL, outcome: 'refuse' });

  await collapsed(projectSidebar, 'P');
  await hidden(projectSidebar, 'C');
  await parentSelect(page).selectOption(ids.P);
  await edits.arrived();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'X', 'P');
  await hidden(projectSidebar, 'C');
  edits.release();

  // P stays collapsed after the failure, X is top-level where it was, and no row for it appears under P.
  await expect(parentSelect(page)).toBeEnabled();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'X', 'P');
  await hidden(projectSidebar, 'C');
  expect(await fetchProject(request, ids.X)).toEqual(before);
  await projectSidebar.toggle('P');
  await shows(projectSidebar, 'X', 'P', 'C');
  expect((await fetchProject(request, ids.X)).parentId).toBeNull();
});

test('TREE-11.7: a rename or an edit keeping the same parent leaves that parent collapsed', async ({
  page,
  request,
  projectSidebar,
}) => {
  test.slow();
  const ids = await seedProjects(request, [
    ['P', null],
    ['X', 'P'],
  ]);
  await expectSavedProjectTree(request, ids, [
    ['P', null],
    ['X', 'P'],
  ]);
  await page.goto('/');
  await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P', 'X']);
  await projectSidebar.select('X');
  await projectSidebar.toggle('P');
  await shows(projectSidebar, 'P');

  // A rename of X: P stays collapsed and X stays hidden.
  await collapsed(projectSidebar, 'P');
  await hidden(projectSidebar, 'X');
  const heading = (name: string) => page.locator('main').getByRole('heading', { level: 1, name, exact: true });
  await heading('X').click();
  await page.locator('main').getByRole('textbox').fill('X renamed');
  await page.locator('main').getByRole('textbox').press('Enter');
  await expect(heading('X renamed')).toBeVisible();
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'P');
  await hidden(projectSidebar, 'X', 'X renamed');

  // An edit that names P, the parent X already has.
  const edit = page.waitForResponse(
    res => res.request().method() === 'PUT' && res.url().endsWith(`/projects/${ids.X}`),
  );
  await parentSelect(page).selectOption(ids.P);
  expect((await edit).status()).toBe(200);
  await collapsed(projectSidebar, 'P');
  await shows(projectSidebar, 'P');
  await hidden(projectSidebar, 'X renamed');
  expect((await fetchProject(request, ids.X)).parentId).toBe(ids.P);

  // A rename of P itself.
  await projectSidebar.select('P');
  await heading('P').click();
  await page.locator('main').getByRole('textbox').fill('P renamed');
  await page.locator('main').getByRole('textbox').press('Enter');
  await expect(heading('P renamed')).toBeVisible();
  await collapsed(projectSidebar, 'P renamed');
  await shows(projectSidebar, 'P renamed');
  await hidden(projectSidebar, 'X renamed');

  for (const action of ['rename', 'same-parent'])
    for (const requestedBeforeMoveAnswer of [true, false]) {
      await resetAndSeedDb();
      const tree = [
        ['P', null],
        ['C', 'P'],
        ['X', null],
      ] as const;
      const queuedIds = await seedProjects(request, tree);
      await expectSavedProjectTree(request, queuedIds, tree);
      await page.goto('/');
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P', 'C', 'X']);
      await projectSidebar.select('X');
      await projectSidebar.toggle('P');
      await collapsed(projectSidebar, 'P');
      await hidden(projectSidebar, 'C');
      await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P', 'X']);
      const move = await holdNextWrite(page, {
        method: 'PATCH',
        url: `**/api/projects/${queuedIds.X}/move`,
        outcome: 'succeed',
      });
      const edit = await holdNextWrite(page, {
        method: 'PUT',
        url: `**/api/projects/${queuedIds.X}`,
        outcome: 'succeed',
      });
      try {
        const from = await pickUp(page, projectSidebar.dragHandle('X'));
        await aimAtOwnRow(page, from, 1);
        await release(page);
        await move.arrived();
        await open(projectSidebar, 'P');
        const requestEdit = async () => {
          if (action === 'rename') {
            await heading('X').click();
            await page.locator('main').getByRole('textbox').fill('X queued');
            await page.locator('main').getByRole('textbox').press('Enter');
          } else await parentSelect(page).selectOption(queuedIds.P);
        };
        if (requestedBeforeMoveAnswer) await requestEdit();
        const moveAnswer = page.waitForResponse(response => response.url().endsWith(`/projects/${queuedIds.X}/move`));
        move.release();
        expect((await moveAnswer).ok()).toBe(true);
        if (!requestedBeforeMoveAnswer) await requestEdit();
        const heldEdit = await edit.arrived();
        expect(heldEdit.status).toBeGreaterThanOrEqual(200);
        expect(heldEdit.status).toBeLessThan(300);
        await projectSidebar.toggle('P');
        await collapsed(projectSidebar, 'P');
        await hidden(projectSidebar, 'C', 'X', 'X queued');
        const editAnswer = page.waitForResponse(
          response => response.request().method() === 'PUT' && response.url().endsWith(`/projects/${queuedIds.X}`),
        );
        edit.release();
        expect((await editAnswer).ok()).toBe(true);
        if (action === 'rename') await expect(heading('X queued')).toBeVisible();
        await collapsed(projectSidebar, 'P');
        await expect.poll(() => drawnProjectNames(projectSidebar)).toEqual(['P']);
        await hidden(projectSidebar, 'C', 'X', 'X queued');
        expect(await fetchProject(request, queuedIds.X)).toMatchObject({
          parentId: queuedIds.P,
          name: action === 'rename' ? 'X queued' : 'X',
        });
        expect((await fetchProject(request, queuedIds.C)).parentId).toBe(queuedIds.P);
      } finally {
        await move.dispose();
        await edit.dispose();
      }
    }
});

test('TREE-11.8: a top-level create or parent change opens no unrelated project', async ({
  page,
  request,
  projectSidebar,
}) => {
  const ids = await seedProjects(request, [
    ['P', null],
    ['X', 'P'],
    // A second child, so P still has one hidden once X has left it, and its chevron still shows.
    ['P2', 'P'],
    ['Q', null],
    ['Q1', 'Q'],
  ]);
  await page.goto('/');
  await projectSidebar.select('X');
  await projectSidebar.toggle('P');
  await projectSidebar.toggle('Q');
  await shows(projectSidebar, 'P', 'Q');

  // A new top-level project has no parent to open: P and Q stay collapsed, and N is shown. That a leaf starts
  // open isn't visible, so TREE-11.1 is where a new project's opening is observed.
  await collapsed(projectSidebar, 'P');
  await collapsed(projectSidebar, 'Q');
  await hidden(projectSidebar, 'X', 'P2', 'Q1');
  await projectSidebar.newProjectButton.click();
  await page.getByPlaceholder('Project name').fill('N');
  await page.getByRole('button', { name: 'Create project' }).click();
  await shows(projectSidebar, 'P', 'Q', 'N');
  await collapsed(projectSidebar, 'P');
  await collapsed(projectSidebar, 'Q');

  // X, a child of the collapsed P, made top-level: no parent is removed into view, and none opens.
  await parentSelect(page).selectOption('');
  await shows(projectSidebar, 'P', 'Q', 'N', 'X');
  await collapsed(projectSidebar, 'P');
  await collapsed(projectSidebar, 'Q');
  expect((await fetchProject(request, ids.X)).parentId).toBeNull();
});
