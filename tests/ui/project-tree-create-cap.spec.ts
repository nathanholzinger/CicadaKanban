import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';
import { API } from '../helpers/api';
import { resetAndSeedDb } from '../helpers/db';
import { holdRequests } from '../helpers/holdRequests';
import { settledWrites, watchWrites } from '../helpers/projectTreeDrag';
import { fetchProjectDepthCap, pinProjectParent, seedProject, seedProjects } from '../helpers/seed';
import type { ProjectSidebarPage } from '../pages/ProjectSidebarPage';
import { SIDEBAR_MAX_WIDTH_PX, SIDEBAR_WIDTH_STORAGE_KEY } from '../../client/src/components/sidebar/sidebarWidth';

// Creating a project: the two Add subproject controls, a sidebar row's and the Overview tab's, stop at the
// project cap, and New project at the sidebar's top never does. Depths are absolute, a top-level project
// at 1. A chain `D1`…`Dn` puts `Dn` at depth n, so with the cap read from the server `D(cap - 1)` takes a
// child and `D(cap)` doesn't.

test.beforeEach(async ({ page }) => {
  await resetAndSeedDb();
  // At the default width the deepest names have no room left after their indents, so they draw at no
  // width and can't be reached. The widest sidebar leaves each name room.
  await page.addInitScript(([key, value]) => localStorage.setItem(key, value), [
    SIDEBAR_WIDTH_STORAGE_KEY,
    String(SIDEBAR_MAX_WIDTH_PX),
  ] as const);
});

const chain = (length: number) => Array.from({ length }, (_, i) => [`D${i + 1}`, i === 0 ? null : `D${i}`] as const);

const DEPTH_CAP_URL = '**/api/projects/depth-cap';
const reasonAt = (cap: number) => `At the depth cap (${cap} levels)`;

// The Add subproject control on a project's sidebar row (its hover actions show it) and on its Overview
// tab, which is open for the selected project.
async function sidebarAdd(projectSidebar: ProjectSidebarPage, name: string): Promise<Locator> {
  const row = projectSidebar.row(name);
  await row.hover();
  return row.getByRole('button', { name: 'Add subproject' });
}
const overviewAdd = (page: Page) => page.locator('main').getByRole('button', { name: 'Add subproject' });

// The projects the server holds, by name, with each one's depth counted from the top level as 1.
async function storedProjects(request: APIRequestContext) {
  const rows: Array<{ id: string; name: string; parentId: string | null }> = await (
    await request.get(`${API}/projects`)
  ).json();
  const byId = new Map(rows.map(row => [row.id, row]));
  const depthOf = (id: string): number => {
    const parentId = byId.get(id)?.parentId;
    return parentId ? depthOf(parentId) + 1 : 1;
  };
  return new Map(rows.map(row => [row.name, { ...row, depth: depthOf(row.id) }]));
}

// A project's own parent, by the name it is stored under.
const parentNameOf = async (request: APIRequestContext, name: string) => {
  const stored = await storedProjects(request);
  const parentId = stored.get(name)?.parentId;
  return [...stored.values()].find(row => row.id === parentId)?.name ?? null;
};

test('TREE-5.2: both Add subproject controls allow a child that reaches exactly the cap', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  // The deepest project that takes a child, and a twin of it, so each control creates under its own.
  await seedProjects(request, [...chain(cap - 1), ['Twin', `D${cap - 2}`]]);
  const parent = `D${cap - 1}`;
  await page.goto('/');

  // The sidebar row's hover actions offer it, and it opens the dialog for that row's project.
  await projectSidebar.select(parent);
  const sidebar = await sidebarAdd(projectSidebar, parent);
  await expect(sidebar).toBeEnabled();
  await sidebar.click();
  await expect(page.getByRole('heading', { name: 'New subproject' })).toBeVisible();
  await expect(page.getByText(`Under ${parent}`)).toBeVisible();
  await page.getByPlaceholder('Subproject name').fill('From the sidebar');
  await page.getByRole('button', { name: 'Create subproject' }).click();
  await expect(projectSidebar.projectName('From the sidebar')).toBeVisible();

  // The Overview tab's does the same for the project it shows.
  await projectSidebar.select('Twin');
  await expect(overviewAdd(page)).toBeEnabled();
  await overviewAdd(page).click();
  await expect(page.getByText('Under Twin')).toBeVisible();
  await page.getByPlaceholder('Subproject name').fill('From the Overview');
  await page.getByRole('button', { name: 'Create subproject' }).click();
  await expect(projectSidebar.projectName('From the Overview')).toBeVisible();

  // Each child is stored under its own parent, at exactly the cap.
  const stored = await storedProjects(request);
  expect(stored.get('From the sidebar')?.depth).toBe(cap);
  expect(await parentNameOf(request, 'From the sidebar')).toBe(parent);
  expect(stored.get('From the Overview')?.depth).toBe(cap);
  expect(await parentNameOf(request, 'From the Overview')).toBe('Twin');
});

test('TREE-5.2, TREE-5.3: both controls follow the project cap the server answers, not a limit of their own', async ({
  page,
  request,
  projectSidebar,
}) => {
  // The server says 3, where it enforces more, so only a client that reads the answer disables D3.
  await page.route(DEPTH_CAP_URL, route => route.fulfill({ json: { projectDepthCap: 3 } }));
  await seedProjects(request, chain(3));
  await page.goto('/');

  await projectSidebar.select('D2');
  await expect(await sidebarAdd(projectSidebar, 'D2')).toBeEnabled();
  await expect(overviewAdd(page)).toBeEnabled();
  await projectSidebar.select('D3');
  const sidebar = await sidebarAdd(projectSidebar, 'D3');
  await expect(sidebar).toBeDisabled();
  await expect(sidebar).toHaveAttribute('title', reasonAt(3));
  await expect(overviewAdd(page)).toBeDisabled();
  await expect(overviewAdd(page)).toHaveAttribute('title', reasonAt(3));
});

test('TREE-5.3: both Add subproject controls stay drawn but disabled at the cap and past it, and start nothing', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  const ids = await seedProjects(request, chain(cap));
  // Past the cap, in data no project write builds.
  const past = await seedProject(request, { name: `D${cap + 1}` });
  await pinProjectParent(request, past.id, ids[`D${cap}`]);
  await page.goto('/');
  const writes = watchWrites(page);

  for (const name of [`D${cap}`, `D${cap + 1}`]) {
    await projectSidebar.select(name);
    // The project stays visible and readable.
    await expect(projectSidebar.projectName(name)).toBeVisible();
    await expect(page.locator('main').getByText(name, { exact: true }).first()).toBeVisible();

    for (const add of [await sidebarAdd(projectSidebar, name), overviewAdd(page)]) {
      // Present, disabled, saying why with the server's cap, and out of the tab order.
      await expect(add).toBeVisible();
      await expect(add).toBeDisabled();
      await expect(add).toHaveAttribute('title', reasonAt(cap));
      await add.focus();
      await expect(add).not.toBeFocused();
      // A forced click and a keypress start no dialog and send nothing.
      await add.click({ force: true });
      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: 'New subproject' })).toHaveCount(0);
    }
  }
  expect(await settledWrites(page, writes)).toEqual([]);
});

test('TREE-5.4: Add subproject stays offered until the cap is read, then follows it', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  await seedProjects(request, chain(cap));
  const answer = await holdRequests(page, { method: 'GET', url: DEPTH_CAP_URL, outcome: 'succeed' });
  await page.goto('/');
  await answer.arrived();

  // Unanswered, both controls at the cap are offered, and the sidebar's opens the dialog.
  const atCap = `D${cap}`;
  await projectSidebar.select(atCap);
  const sidebar = await sidebarAdd(projectSidebar, atCap);
  await expect(sidebar).toBeEnabled();
  await expect(overviewAdd(page)).toBeEnabled();
  await sidebar.click();
  await expect(page.getByRole('heading', { name: 'New subproject' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();

  // A create past the cap is still the API's to refuse: the dialog says it failed, and nothing is stored.
  await overviewAdd(page).click();
  await page.getByPlaceholder('Subproject name').fill('Too deep');
  await page.getByRole('button', { name: 'Create subproject' }).click();
  await expect(page.getByText('Failed to create project. Please try again.')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  expect((await storedProjects(request)).has('Too deep')).toBe(false);

  // The answer lands, with the cap at the project's depth: both controls are disabled for it.
  answer.release();
  await expect(overviewAdd(page)).toBeDisabled();
  await expect(overviewAdd(page)).toHaveAttribute('title', reasonAt(cap));
  const settled = await sidebarAdd(projectSidebar, atCap);
  await expect(settled).toBeDisabled();
  await expect(settled).toHaveAttribute('title', reasonAt(cap));

  // A parent one level short of the cap keeps both enabled.
  const short = `D${cap - 1}`;
  await projectSidebar.select(short);
  await expect(await sidebarAdd(projectSidebar, short)).toBeEnabled();
  await expect(overviewAdd(page)).toBeEnabled();
});

test('TREE-5.5: New project stays offered, and makes a top-level project, whatever the depth of the selected project and whether the cap is read', async ({
  page,
  request,
  projectSidebar,
}) => {
  const cap = await fetchProjectDepthCap(request);
  const ids = await seedProjects(request, chain(cap));
  const past = await seedProject(request, { name: `D${cap + 1}` });
  await pinProjectParent(request, past.id, ids[`D${cap}`]);
  const answer = await holdRequests(page, { method: 'GET', url: DEPTH_CAP_URL, outcome: 'succeed' });
  await page.goto('/');
  await answer.arrived();

  const createRoot = async (name: string) => {
    await expect(projectSidebar.newProjectButton).toBeEnabled();
    await projectSidebar.newProjectButton.click();
    // A top-level create: no "Under …", whichever project is selected.
    await expect(page.getByRole('heading', { name: 'New project' })).toBeVisible();
    await expect(page.getByText(/^Under /)).toHaveCount(0);
    await page.getByPlaceholder('Project name').fill(name);
    await page.getByRole('button', { name: 'Create project' }).click();
    await expect(projectSidebar.projectName(name)).toBeVisible();
    const stored = (await storedProjects(request)).get(name);
    expect([stored?.parentId, stored?.depth]).toEqual([null, 1]);
  };

  // With the cap unanswered, then answered, with a project past the cap selected and Add subproject
  // disabled for it.
  await projectSidebar.select(`D${cap + 1}`);
  await createRoot('Root while unread');
  answer.release();
  await projectSidebar.select(`D${cap + 1}`);
  await expect(overviewAdd(page)).toBeDisabled();
  await createRoot('Root once read');
});
