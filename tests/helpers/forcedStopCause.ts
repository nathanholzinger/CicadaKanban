import { expect, type Page, type Response } from '@playwright/test';
import { boardReload } from './dragGesture';
import { holdNextWrite } from './requestHarness';

// Holds an earlier write so its real resync can interrupt a later live drag.
// The caller makes both gestures; this controls only when the earlier answer lands.
export type ForcedStopCause = 'failed-item-drop' | 'stale-reindex' | 'failed-column-reorder';

export async function holdForcedStopCause(page: Page, cause: ForcedStopCause) {
  const held = await holdNextWrite(page, {
    method: 'PATCH',
    url: cause === 'failed-column-reorder' ? '**/api/columns/reorder' : '**/api/items/*/move',
    outcome: cause === 'stale-reindex' ? 'succeed' : 'refuse',
  });
  const answers: Response[] = [];
  const observe = (response: Response) => {
    if (response.request().method() === 'PATCH' && response.ok()) answers.push(response);
  };
  page.on('response', observe);

  const arrived = async () => {
    const write = await held.arrived();
    if (cause === 'stale-reindex') {
      expect(write.status, 'the held move succeeded on the server').toBe(200);
      const body = write.body as { reindexed?: unknown[] };
      expect(body.reindexed?.length, 'the real server response carries reindex pairs').toBeGreaterThan(0);
    }
    return write;
  };

  const superseded = async () => {
    const write = await arrived();
    await expect
      .poll(() => answers.some(answer => answer.url() === write.request.url), {
        message: 'a later move of the same item has answered while the first answer is held',
      })
      .toBe(true);
  };

  // Everything the earlier writes must have done before the drag to interrupt is picked up.
  const ready = async () => {
    await arrived();
    if (cause === 'stale-reindex') await superseded();
  };

  return {
    arrived,
    // For stale-reindex, make a second move of the same item and await this
    // before picking up the drag to interrupt. The first answer stays held.
    superseded,
    ready,
    // Lets the held answer land and returns at once, so a caller can hold the reload it causes.
    async land() {
      await ready();
      held.release();
    },
    async trigger() {
      await ready();
      const reloaded = boardReload(page);
      held.release();
      await reloaded;
    },
    async dispose() {
      page.off('response', observe);
      await held.dispose();
    },
  };
}

export type HeldCause = Awaited<ReturnType<typeof holdForcedStopCause>>;
