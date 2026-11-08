import { test, expect } from '../fixtures';
import { resetAndSeedDb } from '../helpers/db';
import {
  addWorkphases,
  deleteWorkphase,
  fetchBoard,
  fetchDefaultBoard,
  fetchItem,
  pickWorkphases,
  seedItem,
  seedTemplatedWorkflow,
} from '../helpers/seed';
import { article, column, dragRegion, itemRow } from '../helpers/boardLocators';
import {
  awaitDragContext,
  awaitDragState,
  center,
  hoverTo,
  pickUp,
  release,
  seedDragTuning,
  NO_POP,
} from '../helpers/dragGesture';
import { holdNextWrite, settledWrites, watchBoardLoads, watchWrites } from '../helpers/requestHarness';

test.use({ viewport: { width: 1900, height: 1000 } });

for (const detached of [false, true]) {
  test(`${detached ? 'BCU-5.7' : 'BCU-5.6'}: filing an Unknown parent reconciles exactly its attached branch without reloading`, async ({
    page,
    request,
    projectSidebar,
  }) => {
    await resetAndSeedDb();
    const name = detached ? 'Detached Unknown Boundary' : 'Attached Unknown Branch';
    const { project, workflow } = await seedTemplatedWorkflow(request, name);
    const [w1] = pickWorkphases(workflow, 'Todo');
    const [obsolete] = await addWorkphases(request, workflow.id, ['Obsolete']);
    const p = await seedItem(request, { title: 'P', projectId: project.id, workphaseId: obsolete.id });
    const a = await seedItem(request, { title: 'A', parentId: p.id });
    const g = detached ? null : await seedItem(request, { title: 'G', parentId: a.id });
    const d = detached
      ? await seedItem(request, { title: 'D', parentId: p.id, isAttached: false, workphaseId: obsolete.id })
      : null;
    const d1 = d ? await seedItem(request, { title: 'D1', parentId: d.id }) : null;
    await deleteWorkphase(request, obsolete.id);
    const board = await fetchDefaultBoard(request, workflow.id);
    const ids = [p, a, g, d, d1].filter((item): item is NonNullable<typeof item> => item !== null).map(item => item.id);
    expect(board.unsorted.invalidItems.map(item => item.id).sort()).toEqual([...ids].sort());
    expect(board.unsorted.uncovered).toEqual([]);
    expect(board.unsorted.needsAttention).toBe(true);
    await seedDragTuning(page, { ...NO_POP, sectionLevels: 3, popSnapMs: 0 });
    await projectSidebar.openBoard(name);
    const unsorted = column(page, 'Unsorted');
    await expect(article(unsorted, 'P')).toBeVisible();
    const pToggle = article(unsorted, 'P').getByTitle('Show attached children', { exact: true });
    if (await pToggle.count()) await pToggle.click();
    await expect(itemRow(article(unsorted, 'P'), a.id)).toBeVisible();
    if (g) await expect(itemRow(article(unsorted, 'P'), g.id)).toBeVisible();
    if (d && d1) {
      const dToggle = article(unsorted, 'D').getByTitle('Show attached children', { exact: true });
      if (await dToggle.count()) await dToggle.click();
      await expect(itemRow(article(unsorted, 'D'), d1.id)).toBeVisible();
    }
    await expect(unsorted.getByText('needs attention', { exact: true })).toBeVisible();
    const loads = watchBoardLoads(page);
    const navigations: string[] = [];
    page.on('framenavigated', frame => {
      if (frame === page.mainFrame()) navigations.push(frame.url());
    });
    const writes = watchWrites(page);
    const held = await holdNextWrite(page, { method: 'PATCH', url: `**/api/items/${p.id}/move`, outcome: 'succeed' });
    await pickUp(page, article(unsorted, 'P'));
    await awaitDragState(page, 'popped-out');
    await awaitDragContext(page, null);
    await hoverTo(page, await center(dragRegion(column(page, 'Todo'))));
    await release(page);
    expect((await held.arrived()).status).toBe(200);
    held.release();
    const filed = article(column(page, 'Todo'), 'P');
    await expect(filed).not.toHaveAttribute('data-pending', 'true');
    await expect(filed).toBeVisible();
    await expect(itemRow(filed, a.id)).toBeVisible();
    if (g) await expect(itemRow(filed, g.id)).toBeVisible();
    const saved = await Promise.all(
      [p, a, g]
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .map(item => fetchItem(request, item.id)),
    );
    expect(saved.map(item => item.workphaseId)).toEqual(saved.map(() => w1.id));
    expect(saved.find(item => item.id === a.id)).toMatchObject({ parentId: p.id, isAttached: 1 });
    if (g) expect(saved.find(item => item.id === g.id)).toMatchObject({ parentId: a.id, isAttached: 1 });
    const fresh = await fetchBoard(request, board.id);
    expect(fresh.unsorted.uncovered).toEqual([]);
    expect(fresh.unsorted.needsAttention).toBe(detached);
    expect(fresh.unsorted.invalidItems.map(item => item.id).sort()).toEqual(d && d1 ? [d.id, d1.id].sort() : []);
    if (d && d1) {
      await expect(article(unsorted, 'D')).toBeVisible();
      await expect(itemRow(article(unsorted, 'D'), d1.id)).toBeVisible();
      await expect(unsorted.getByText('needs attention', { exact: true })).toBeVisible();
      expect(await fetchItem(request, d.id)).toMatchObject({ parentId: p.id, isAttached: 0, workphaseId: null });
      expect(await fetchItem(request, d1.id)).toMatchObject({ parentId: d.id, isAttached: 1, workphaseId: null });
    } else {
      await expect(page.getByText('needs attention', { exact: true })).toHaveCount(0);
    }
    expect(await settledWrites(page, writes)).toEqual([
      {
        method: 'PATCH',
        url: expect.stringMatching(new RegExp(`/api/items/${p.id}/move$`)),
        body: { workphaseId: w1.id },
      },
    ]);
    expect(loads).toEqual([]);
    expect(navigations).toEqual([]);
    await held.dispose();
  });
}
