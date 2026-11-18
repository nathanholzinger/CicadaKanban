import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import {
  seedTemplatedWorkflow,
  pickWorkphases,
  addWorkphases,
  deleteWorkphase,
  seedItem,
  moveItem,
  fetchItem,
  fetchDefaultBoard,
} from '../helpers/seed';
import {
  center,
  pickUp,
  hoverTo,
  release,
  seedDragTuning,
  awaitPoppedOut,
  POP_OUT_ONLY,
  bottomQuarter,
  gapBetween,
  awaitProjection,
} from '../helpers/dragGesture';
import { setSectionExpanded } from '../helpers/boardDragSurface';
import { holdAt } from '../helpers/overflowTree';
import { holdNextWrite, successfulWrite, watchWrites } from '../helpers/requestHarness';
import { article, column, itemPanel, itemRow, titlesIn, dragRegion } from '../helpers/boardLocators';

test.describe('attached children on the board', () => {
  test.beforeAll(async () => {
    await resetAndSeedDb();
  });

  test('ATT-1.15: an older child reorder answer leaves the later parent cascade in its new workphase', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Cascade Answer Order Project');
    const [w1, w2] = pickWorkphases(workflow, 'Todo', 'In Progress');
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: w1.id });
    const c = await seedItem(request, { title: 'C', parentId: p.id });
    const s = await seedItem(request, { title: 'S', parentId: p.id });
    const g = await seedItem(request, { title: 'G', parentId: c.id });
    expect(c.position).toBeLessThan(s.position!);
    expect([p, c, s, g].map(item => item.workphaseId)).toEqual([w1.id, w1.id, w1.id, w1.id]);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(project.name);
    const first = column(page, 'Todo');
    const second = column(page, 'In Progress');
    await expect(article(first, 'P')).toBeVisible();
    await setSectionExpanded(itemRow(page, p.id), true);
    await expect(itemRow(page, c.id)).toBeVisible();
    await expect(itemRow(page, s.id)).toBeVisible();

    const older = await holdNextWrite(page, {
      method: 'PATCH',
      url: '**/api/items/*/move',
      outcome: 'succeed',
    });
    await holdAt(page, c, p, () => bottomQuarter(itemRow(page, s.id)), 0);
    await awaitProjection(page, '1:0:true');
    await release(page);
    expect((await older.arrived()).status).toBe(200);
    await expect.poll(async () => (await fetchItem(request, c.id)).position).toBeGreaterThan(s.position!);
    expect((await fetchItem(request, c.id)).workphaseId).toBe(w1.id);

    const newer = await holdNextWrite(page, {
      method: 'PATCH',
      url: '**/api/items/*/move',
      outcome: 'succeed',
    });
    const writes = watchWrites(page);
    await pickUp(page, article(first, 'P').getByText('P', { exact: true }));
    await hoverTo(page, await gapBetween(first, second));
    await awaitPoppedOut(page, tuning);
    await hoverTo(page, await center(dragRegion(second)));
    await release(page);
    expect(await newer.arrived()).toMatchObject({ status: 200, body: { workphaseId: w2.id } });
    expect(writes).toEqual([
      expect.objectContaining({
        url: expect.stringContaining(`/api/items/${p.id}/move`),
        body: expect.objectContaining({ workphaseId: w2.id }),
      }),
    ]);
    newer.release();
    await expect(article(second, 'P')).toBeVisible();
    const olderAnswered = successfulWrite(page, 'PATCH', `/api/items/${c.id}/move`);
    older.release();
    await olderAnswered;
    await expect(article(second, 'P').getByText('C', { exact: true })).toBeVisible();
    await expect(article(second, 'P').getByText('G', { exact: true })).toBeVisible();
    await expect(article(first, 'P')).toHaveCount(0);
    for (const item of [p, c, s, g]) {
      await expect.poll(async () => (await fetchItem(request, item.id)).workphaseId).toBe(w2.id);
    }
  });

  test('ATT-1.15: child then parent answers reach the same cascaded workphase', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Cascade Answer Order Forward Project');
    const [w1, w2] = pickWorkphases(workflow, 'Todo', 'In Progress');
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: w1.id });
    const c = await seedItem(request, { title: 'C', parentId: p.id });
    const s = await seedItem(request, { title: 'S', parentId: p.id });
    const g = await seedItem(request, { title: 'G', parentId: c.id });
    expect(c.position).toBeLessThan(s.position!);
    expect([p, c, s, g].map(item => item.workphaseId)).toEqual([w1.id, w1.id, w1.id, w1.id]);
    const tuning = await seedDragTuning(page, POP_OUT_ONLY);
    await projectSidebar.openBoard(project.name);
    const first = column(page, 'Todo');
    const second = column(page, 'In Progress');
    await expect(article(first, 'P')).toBeVisible();
    await setSectionExpanded(itemRow(page, p.id), true);

    const older = await holdNextWrite(page, { method: 'PATCH', url: '**/api/items/*/move', outcome: 'succeed' });
    await holdAt(page, c, p, () => bottomQuarter(itemRow(page, s.id)), 0);
    await awaitProjection(page, '1:0:true');
    await release(page);
    expect((await older.arrived()).request.url).toContain(`/api/items/${c.id}/move`);

    const newer = await holdNextWrite(page, { method: 'PATCH', url: '**/api/items/*/move', outcome: 'succeed' });
    await pickUp(page, article(first, 'P').getByText('P', { exact: true }));
    await hoverTo(page, await gapBetween(first, second));
    await awaitPoppedOut(page, tuning);
    await hoverTo(page, await center(dragRegion(second)));
    await release(page);
    expect((await newer.arrived()).request.url).toContain(`/api/items/${p.id}/move`);
    const olderAnswered = successfulWrite(page, 'PATCH', `/api/items/${c.id}/move`);
    older.release();
    await olderAnswered;
    const newerAnswered = successfulWrite(page, 'PATCH', `/api/items/${p.id}/move`);
    newer.release();
    await newerAnswered;
    await expect(article(second, 'P')).toBeVisible();
    await expect(article(second, 'P').getByText('C', { exact: true })).toBeVisible();
    await expect(article(second, 'P').getByText('G', { exact: true })).toBeVisible();
    for (const item of [p, c, s, g]) {
      await expect.poll(async () => (await fetchItem(request, item.id)).workphaseId).toBe(w2.id);
    }
    await older.dispose();
    await newer.dispose();
  });

  test('ATT-1.1, ATT-1.9: shows attached children nested under the parent card, and the toggle collapses them', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Nested Children Project');
    const [todo] = pickWorkphases(workflow, 'Todo');
    const parent = await seedItem(request, { title: 'Parent Card', projectId: project.id, workphaseId: todo.id });
    await seedItem(request, { title: 'Attached Kid', parentId: parent.id });

    await projectSidebar.openBoard('Nested Children Project');

    const card = page.getByRole('article', { name: 'Parent Card' });
    await expect(card).toBeVisible();
    // Attached child renders nested under the parent, not as its own card.
    await expect(card.getByText('Attached Kid')).toBeVisible();
    await expect(page.getByRole('article', { name: 'Attached Kid' })).not.toBeVisible();

    await card.getByRole('button', { name: /child/ }).click();
    await expect(card.getByText('Attached Kid')).not.toBeVisible();
  });

  test('ATT-1.2: a detached child renders as its own top-level card, not nested', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Detached Sibling Project');
    const [todo] = pickWorkphases(workflow, 'Todo');
    const parent = await seedItem(request, {
      title: 'Parent With Detached',
      projectId: project.id,
      workphaseId: todo.id,
    });
    await seedItem(request, { title: 'Detached Kid', parentId: parent.id, isAttached: false, workphaseId: todo.id });

    await projectSidebar.openBoard('Detached Sibling Project');

    await expect(page.getByRole('article', { name: 'Detached Kid' })).toBeVisible();
    // ...and not also as a Stub inside its parent's Card.
    const parentCard = page.getByRole('article', { name: 'Parent With Detached' });
    await expect(parentCard).toBeVisible();
    await expect(parentCard.getByText('Detached Kid')).toHaveCount(0);
  });

  test('BCU-5.5: an attached child whose workphaseId goes invalid still renders only nested, never duplicated in Unknown status', async ({
    page,
    request,
    projectSidebar,
  }) => {
    // The attach cascade only re-syncs a child's workphaseId when its PARENT
    // moves — it never fires just because a workphase disappears out from
    // under the child. Reproduce that: a Free (detached) child sits in a temp
    // workphase with its own attached grandchild; deleting the workphase
    // SET-NULLs both. The Free child legitimately lands in "Unknown status";
    // the attached grandchild — an attached+parented row with an invalid
    // workphase — must render nested inside it and nowhere else.
    //
    // (Real workphase deletion is how a row that had a workphase ends up in
    // this shape: moving an attached child to a different workphase than its
    // parent via PATCH /move is a 400, since an attached item inherits its
    // parent's workphase. Creating a Free child with no workphase and an
    // attached grandchild under it would reach the same shape, but not by the
    // path a user takes.)
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Invalid Workphase Child Project');
    const [todo] = pickWorkphases(workflow, 'Todo');
    const parent = await seedItem(request, { title: 'Diverged Parent', projectId: project.id, workphaseId: todo.id });
    const [temp] = await addWorkphases(request, workflow.id, ['Temp']);
    const child = await seedItem(request, {
      title: 'Diverged Free Kid',
      parentId: parent.id,
      isAttached: false,
      workphaseId: temp.id,
    });
    const grandchild = await seedItem(request, { title: 'Diverged Attached Grandkid', parentId: child.id });
    await deleteWorkphase(request, temp.id);

    const reloaded = await fetchItem(request, grandchild.id);
    expect(reloaded.workphaseId).toBeNull(); // confirms the invalid reference actually landed
    expect(reloaded.isAttached).toBe(1);

    await projectSidebar.openBoard('Invalid Workphase Child Project');

    // The client excludes attached+parented rows from the "Unknown status"
    // list, so the grandchild never doubles up: it shows
    // once, nested under the Free child's Unknown-status card.
    const unsorted = page.getByRole('group', { name: 'Unsorted' });
    await expect(unsorted).toBeVisible();
    await expect(unsorted.getByText('needs attention')).toBeVisible();
    await expect(unsorted.getByText('Unknown status')).toBeVisible();

    const childCard = unsorted.getByRole('article', { name: 'Diverged Free Kid' });
    await expect(childCard).toBeVisible();
    await expect(childCard.getByText('Diverged Attached Grandkid')).toBeVisible();
    await expect(page.getByRole('article', { name: 'Diverged Attached Grandkid' })).not.toBeVisible();

    // The parent is untouched in its own column.
    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Diverged Parent' }),
    ).toBeVisible();
  });

  test('unchecking "Show attached children by default" collapses cards on the next load', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Board Toggle Project');
    const [todo] = pickWorkphases(workflow, 'Todo');
    const parent = await seedItem(request, {
      title: 'Toggle Default Parent',
      projectId: project.id,
      workphaseId: todo.id,
    });
    await seedItem(request, { title: 'Hidden Kid', parentId: parent.id });

    await projectSidebar.openBoard('Board Toggle Project');

    const card = page.getByRole('article', { name: 'Toggle Default Parent' });
    await expect(card.getByText('Hidden Kid')).toBeVisible(); // the setting defaults to on

    // Controlled checkbox — its state flips only after the PUT resolves, so
    // click and then wait for the re-render rather than using uncheck().
    const toggle = page.getByLabel('Show attached children by default');
    await toggle.click();
    await expect(toggle).not.toBeChecked();

    // Persisted server-side...
    await expect.poll(async () => (await fetchDefaultBoard(request, workflow.id)).showAttachedChildren).toBe(0);

    // ...and a fresh load renders children collapsed, expandable via the badge.
    await projectSidebar.openBoard('Board Toggle Project');

    const reloaded = page.getByRole('article', { name: 'Toggle Default Parent' });
    await expect(reloaded).toBeVisible();
    await expect(reloaded.getByText('Hidden Kid')).not.toBeVisible();

    await reloaded.getByRole('button', { name: /child/ }).click();
    await expect(reloaded.getByText('Hidden Kid')).toBeVisible();
  });

  test('ATT-1.9: the child badge counts only attached children and nesting recurses through grandchildren', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Badge Count Project');
    const [todo] = pickWorkphases(workflow, 'Todo');
    const parent = await seedItem(request, {
      title: 'Badge Parent',
      description: 'What the badge parent is for',
      projectId: project.id,
      workphaseId: todo.id,
    });
    const attachedChild = await seedItem(request, { title: 'Attached One', parentId: parent.id });
    await seedItem(request, { title: 'Detached One', parentId: parent.id, isAttached: false, workphaseId: todo.id });
    await seedItem(request, { title: 'Nested Grand', parentId: attachedChild.id });

    await projectSidebar.openBoard('Badge Count Project');

    const card = page.getByRole('article', { name: 'Badge Parent' });
    await expect(card.getByText('Badge Parent', { exact: true })).toBeVisible();
    await expect(card.getByText('What the badge parent is for')).toBeVisible();
    // Only the attached child is counted — the detached one is its own card.
    await expect(card.getByRole('button', { name: /^1 child/ })).toBeVisible();
    await expect(card.getByText('Attached One')).toBeVisible();
    await expect(card.getByText('Nested Grand')).toBeVisible();

    await expect(page.getByRole('article', { name: 'Detached One' })).toBeVisible();
    // Each Stub shows once on the board, inside the Card, and is never a Card itself.
    for (const stub of ['Attached One', 'Nested Grand']) {
      await expect(page.getByRole('article', { name: stub })).toHaveCount(0);
      await expect(page.getByText(stub, { exact: true })).toHaveCount(1);
    }
  });

  test('dragging a parent card across columns cascades its attached child', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Drag Cascade Project');
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    const parent = await seedItem(request, { title: 'Draggable Parent', projectId: project.id, workphaseId: todo.id });
    const child = await seedItem(request, { title: 'Cascading Kid', parentId: parent.id });

    // A cross-column move is a Board-layer band resolution: the card starts
    // locked to Todo, and a release still locked there commits Todo's own
    // reorder, not a foreign column's band — so this needs an actual pop
    // out first, not just a quick hover.
    const tuning = await seedDragTuning(page, { popDelayMs: 150 });
    await projectSidebar.openBoard('Drag Cascade Project');

    const card = page.getByRole('article', { name: 'Draggable Parent' });
    await expect(card).toBeVisible();

    // Real pointer sequence, not Playwright's native-DnD helpers — see
    // tests/helpers/dragGesture.ts.
    const targetColumn = page.getByRole('group', { name: 'In Progress' });
    // The region itself, not the group's own center — In Progress is empty,
    // and an empty region's carve-out is a fixed, small band near the top of the column body, not the whole
    // available column height.
    const targetRegion = dragRegion(targetColumn);
    await pickUp(page, card);
    await hoverTo(page, await center(targetRegion));
    await awaitPoppedOut(page, tuning);
    await release(page);

    // UI: parent lands under "In Progress", child still nested under it.
    const movedCard = page
      .getByRole('group', { name: 'In Progress' })
      .getByRole('article', { name: 'Draggable Parent' });
    await expect(movedCard).toBeVisible();
    await expect(movedCard.getByText('Cascading Kid')).toBeVisible();

    // Server: the cascade actually ran, not just optimistic client state.
    await expect.poll(async () => (await fetchItem(request, child.id)).workphaseId).toBe(inProgress.id);
  });
});

test.describe('reparent and attach/detach controls', () => {
  test.beforeAll(async () => {
    await resetAndSeedDb();
  });

  test('ATT-9.4: detaching a child via the detail panel keeps it in place when the parent moves', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Detach Control Project');
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    const parent = await seedItem(request, { title: 'Movable Parent', projectId: project.id, workphaseId: todo.id });
    const child = await seedItem(request, { title: 'Toggle Child', parentId: parent.id });

    await projectSidebar.openBoard('Detach Control Project');

    await page.getByRole('article', { name: 'Movable Parent' }).click();
    const panel = itemPanel(page);
    await expect(panel.getByText('Toggle Child')).toBeVisible();
    await panel.getByRole('button', { name: 'Attached' }).click();
    await expect(panel.getByRole('button', { name: 'Detached' })).toBeVisible();

    const detached = await fetchItem(request, child.id);
    expect(detached.isAttached).toBe(0);

    // Move the parent — the now-detached child should stay in its workphase.
    await moveItem(request, parent.id, { workphaseId: inProgress.id });
    const afterMove = await fetchItem(request, child.id);
    expect(afterMove.workphaseId).toBe(todo.id);

    // And the board shows it: parent moved on, child stayed put as its own card.
    await projectSidebar.openBoard('Detach Control Project');

    await expect(
      page.getByRole('group', { name: 'In Progress' }).getByRole('article', { name: 'Movable Parent' }),
    ).toBeVisible();
    await expect(
      page.getByRole('group', { name: 'Todo' }).getByRole('article', { name: 'Toggle Child' }),
    ).toBeVisible();
  });

  test('the Parent dropdown excludes descendants, and reparenting nests the item under its new parent', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Reparent Control Project');
    const [todo] = pickWorkphases(workflow, 'Todo');
    const itemA = await seedItem(request, { title: 'Item A', projectId: project.id, workphaseId: todo.id });
    const itemB = await seedItem(request, { title: 'Item B', projectId: project.id, workphaseId: todo.id });
    await seedItem(request, { title: 'A Child', parentId: itemA.id });

    await projectSidebar.openBoard('Reparent Control Project');

    await page.getByRole('article', { name: 'Item A' }).click();
    const parentSelect = itemPanel(page).getByLabel('Parent item');

    // Cycle prevention in the UI: neither the item itself nor its descendant is offered.
    await expect(parentSelect.locator('option', { hasText: 'Item B' })).toHaveCount(1);
    await expect(parentSelect.locator('option', { hasText: 'A Child' })).toHaveCount(0);
    await expect(parentSelect.locator('option', { hasText: 'Item A' })).toHaveCount(0);

    await parentSelect.selectOption({ label: 'Item B' });

    // Item A (with its own child) now renders nested inside Item B's card.
    await expect(page.getByRole('article', { name: 'Item B' }).getByText('Item A')).toBeVisible();
    await expect(page.getByRole('article', { name: 'Item A' })).not.toBeVisible();

    const updated = await fetchItem(request, itemA.id);
    expect(updated.parentId).toBe(itemB.id);
  });

  test("ATT-1.7: unchecking Attached in the item's own panel detaches it onto the board", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Own Panel Project');
    const [todo] = pickWorkphases(workflow, 'Todo');
    const parent = await seedItem(request, { title: 'Own Panel Parent', projectId: project.id, workphaseId: todo.id });
    const child = await seedItem(request, { title: 'Own Panel Child', parentId: parent.id });

    await projectSidebar.openBoard('Own Panel Project');

    // The attached child is only a nested row — open its own panel from there.
    await expect(page.getByRole('article', { name: 'Own Panel Child' })).not.toBeVisible();
    await page
      .getByRole('article', { name: 'Own Panel Parent' })
      .getByRole('button', { name: 'Own Panel Child' })
      .click();

    // Controlled checkbox — state flips after the PUT resolves; avoid uncheck().
    const attachedCheckbox = itemPanel(page).getByLabel('Attached');
    await attachedCheckbox.click();
    await expect(attachedCheckbox).not.toBeChecked();

    // The board updates live: the child becomes its own top-level card.
    await expect(page.getByRole('article', { name: 'Own Panel Child' })).toBeVisible();

    const detached = await fetchItem(request, child.id);
    expect(detached.isAttached).toBe(0);
  });

  test("ATT-1.7: checking Attached in a detached child's own panel makes it a Stub in its nearest Free ancestor's Card", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Attach Control Project');
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    // G is a Free Card and P its Stub. X, P's detached child, is a Card of its own in another column.
    const g = await seedItem(request, { title: 'Ancestor Card', projectId: project.id, workphaseId: todo.id });
    const p = await seedItem(request, { title: 'Stub Parent', parentId: g.id });
    await seedItem(request, { title: 'Loose Child', parentId: p.id, isAttached: false, workphaseId: inProgress.id });

    await projectSidebar.openBoard('Attach Control Project');

    const ancestorCard = page.getByRole('article', { name: 'Ancestor Card' });
    const childCard = page.getByRole('article', { name: 'Loose Child' });
    await expect(childCard).toBeVisible();
    await expect(ancestorCard.getByText('Loose Child')).toHaveCount(0);

    await childCard.click();
    // Controlled checkbox — state flips after the PUT resolves; avoid check().
    const attachedCheckbox = itemPanel(page).getByLabel('Attached');
    await attachedCheckbox.click();
    await expect(attachedCheckbox).toBeChecked();

    // The board updates live: X is a Stub in G's Card, and no Card of its own.
    await expect(ancestorCard.getByText('Loose Child')).toBeVisible();
    await expect(childCard).toHaveCount(0);
  });

  test('ATT-3.9: reparenting a detached child from its own panel keeps it a Card', async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Free Reparent Project');
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    const first = await seedItem(request, { title: 'First Parent', projectId: project.id, workphaseId: todo.id });
    const second = await seedItem(request, { title: 'Second Parent', projectId: project.id, workphaseId: todo.id });
    const kid = await seedItem(request, {
      title: 'Free Kid',
      parentId: first.id,
      isAttached: false,
      workphaseId: inProgress.id,
    });

    await projectSidebar.openBoard('Free Reparent Project');

    // Reparenting a child that already has a parent, the picker sends only the new parent, never
    // the attachment flag. (Only a top-level item's first parent comes with `isAttached: true`.)
    await page.getByRole('article', { name: 'Free Kid' }).click();
    await itemPanel(page).getByLabel('Parent item').selectOption({ label: 'Second Parent' });
    await expect.poll(async () => (await fetchItem(request, kid.id)).parentId).toBe(second.id);
    expect(await fetchItem(request, kid.id)).toMatchObject({
      isAttached: 0,
      workphaseId: inProgress.id,
      positionScope: 'workflow',
    });

    // Reloaded, it's still a Card in its own column, and not a Stub in its new parent's Card.
    await projectSidebar.openBoard('Free Reparent Project');
    await expect(
      page.getByRole('group', { name: 'In Progress' }).getByRole('article', { name: 'Free Kid' }),
    ).toBeVisible();
    await expect(page.getByRole('article', { name: 'Second Parent' }).getByText('Free Kid')).toHaveCount(0);
  });
});

test.describe('deleting a Card', () => {
  test.beforeAll(async () => {
    await resetAndSeedDb();
  });

  test("ATT-11.2: on the board, deleting a Card removes its detached descendants' Cards, wherever they sit", async ({
    page,
    request,
    projectSidebar,
  }) => {
    const { project, workflow } = await seedTemplatedWorkflow(request, 'Delete Subtree Project');
    const [todo, inProgress] = pickWorkphases(workflow, 'Todo', 'In Progress');
    // P in Todo, with an attached child as a Stub and a detached child in In Progress.
    const parent = await seedItem(request, { title: 'Doomed Parent', projectId: project.id, workphaseId: todo.id });
    const stub = await seedItem(request, { title: 'Doomed Stub', parentId: parent.id });
    const detached = await seedItem(request, {
      title: 'Doomed Detached',
      parentId: parent.id,
      isAttached: false,
      workphaseId: inProgress.id,
    });
    await seedItem(request, { title: 'Bystander In Progress', projectId: project.id, workphaseId: inProgress.id });
    await seedItem(request, { title: 'Bystander Todo', projectId: project.id, workphaseId: todo.id });

    await projectSidebar.openBoard('Delete Subtree Project');
    const todoColumn = column(page, 'Todo');
    const inProgressColumn = column(page, 'In Progress');
    await expect(article(todoColumn, 'Doomed Parent').getByText('Doomed Stub')).toBeVisible();
    await expect(article(inProgressColumn, 'Doomed Detached')).toBeVisible();

    // A value on the page itself, which a reload would drop.
    await page.evaluate(() => Object.assign(window, { notReloaded: true }));

    await article(todoColumn, 'Doomed Parent').click();
    const panel = itemPanel(page);
    await panel.getByRole('button', { name: 'Delete item' }).click();
    await panel.getByRole('button', { name: 'Delete', exact: true }).click();

    // The three are gone from the board, and the other Cards are as they were.
    for (const gone of [parent, stub, detached]) await expect(itemRow(page, gone.id)).toHaveCount(0);
    await expect.poll(() => titlesIn(todoColumn)).toEqual(['Bystander Todo']);
    await expect.poll(() => titlesIn(inProgressColumn)).toEqual(['Bystander In Progress']);
    expect(await page.evaluate(() => 'notReloaded' in window)).toBe(true);

    // The server agrees: a fresh load of the board shows the same.
    await projectSidebar.openBoard('Delete Subtree Project');
    await expect.poll(() => titlesIn(column(page, 'Todo'))).toEqual(['Bystander Todo']);
    await expect.poll(() => titlesIn(column(page, 'In Progress'))).toEqual(['Bystander In Progress']);
    await expect(itemRow(page, stub.id)).toHaveCount(0);
  });
});
