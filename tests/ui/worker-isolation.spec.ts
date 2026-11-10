import fs from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '../fixtures';
import { API } from '../helpers/api';
import { resetAndSeedDb } from '../helpers/db';
import { fetchItem, seedItem, seedTemplatedWorkflow } from '../helpers/seed';
import { apiUrl, clientUrl, workerCount } from '../helpers/slots';

// The ordinary suite checks its own browser/API routing. A dedicated overlapping
// run also holds each slot's data across resets in all peer slots:
// E2E_ISOLATION_OVERLAP=1 E2E_WORKERS=3 playwright test worker-isolation --repeat-each=3
test('a worker keeps its own API and browser data across peer resets', async ({
  request,
  page,
  projectSidebar,
}, info) => {
  test.setTimeout(120_000);
  const slot = info.parallelIndex;
  const count = workerCount();
  const overlap = process.env.E2E_ISOLATION_OVERLAP === '1';
  expect(API).toBe(apiUrl(slot));
  if (overlap) {
    expect(count).toBeGreaterThan(1);
  }

  const cohort = Math.floor(info.repeatEachIndex / count);
  const barrier = path.join(info.project.outputDir, 'worker-isolation', String(cohort));
  async function signal(name: string) {
    await fs.mkdir(barrier, { recursive: true });
    await fs.writeFile(path.join(barrier, name), String(slot));
  }
  async function wait(name: string) {
    await expect
      .poll(
        async () =>
          fs.access(path.join(barrier, name)).then(
            () => true,
            () => false,
          ),
        {
          message: `slot ${slot} waiting for ${name}`,
          timeout: 90_000,
        },
      )
      .toBe(true);
  }

  if (overlap) {
    await signal(`arrived-${slot}`);
    for (let peer = 0; peer < count; peer++) await wait(`arrived-${peer}`);
  }
  const rounds = overlap ? count : 1;
  for (let turn = 0; turn < rounds; turn++) {
    const protectedSlot = overlap ? turn : slot;
    if (slot === protectedSlot) {
      await resetAndSeedDb();
      const name = `Isolation slot ${slot} repeat ${info.repeatEachIndex}`;
      const { project, workflow } = await seedTemplatedWorkflow(request, name, 'quick');
      const item = await seedItem(request, {
        title: `${name} card`,
        projectId: project.id,
        workphaseId: workflow.workphases[0].id,
      });
      await projectSidebar.openBoard(name);
      await expect(page).toHaveURL(`${clientUrl(slot)}/`);
      await expect(page.getByText(item.title, { exact: true })).toBeVisible();
      expect(await fetchItem(request, item.id)).toMatchObject({
        id: item.id,
        title: item.title,
        projectId: project.id,
      });
      if (overlap) {
        await signal(`ready-${turn}`);
        for (let peer = 0; peer < count; peer++) if (peer !== slot) await wait(`reset-${turn}-${peer}`);
      }
      expect(await fetchItem(request, item.id)).toMatchObject({
        id: item.id,
        title: item.title,
        projectId: project.id,
      });
      await projectSidebar.openBoard(name);
      await expect(page.getByText(item.title, { exact: true })).toBeVisible();
      if (overlap) await signal(`verified-${turn}`);
      await info.attach(`slot-${slot}-survived`, {
        body: JSON.stringify({ slot, repeat: info.repeatEachIndex, api: API, browser: page.url(), project, item }),
        contentType: 'application/json',
      });
    } else {
      await wait(`ready-${turn}`);
      await resetAndSeedDb();
      await signal(`reset-${turn}-${slot}`);
      await wait(`verified-${turn}`);
    }
  }
});
