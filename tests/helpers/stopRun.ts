import { expect, type Page } from '@playwright/test';
import { STOP_FLASH_MS } from '../../client/src/components/workflow/forcedStop';
import { dragMachine } from './dragGesture';
import { dragOverlay, loadingBoard, stopBanner } from './boardLocators';
import type { ForcedStopCause, HeldCause } from './forcedStopCause';
import { holdNextRead } from './requestHarness';

// The forced-stop cases' shared observations (DRAG-6.15 to DRAG-6.28). Each says whether it reads the
// screen or an attribute the app provides.

// The banner's two sentences, spelled from DRAG-6.16 with its typographic apostrophe, never imported
// from the client. A failed drop and a failed column reorder say the first; a stale response's
// refresh says the second.
export const WRITE_FAILED_SENTENCE = 'Your last move didn’t save, so the board reloaded. Nothing moved.';
export const REFRESH_SENTENCE = 'The board refreshed, which stopped your drag. Nothing moved.';

export function sentenceFor(cause: ForcedStopCause): string {
  return cause === 'stale-reindex' ? REFRESH_SENTENCE : WRITE_FAILED_SENTENCE;
}

// The flash window's length, `F` in the cases. It is the client's constant, which BCU-1.10 imports too.
export const FLASH_MS = STOP_FLASH_MS;

// The page's clock, which the test moves. `freezeClock` stops it where it is, and only `advance` moves
// it from then on, as BCU-1.10 does for the flash window. Freeze before the stop lands, so the timers
// the stop sets (the banner's and the flash's) are the frozen clock's and a boundary is exact.
// Nothing here reads the app.
export const freezeClock = (page: Page) => page.clock.pauseAt(new Date());
export const advance = (page: Page, ms: number) => page.clock.runFor(ms);

// The drag is over: no pop machine is reporting (`data-drag-state`), no carried copy is drawn
// (`data-drag-overlay`) and no row is classified for a drag or holds a drop tier, which is what a
// ghost row is drawn from (`data-drop-state`, `data-drop-tier`). Reads the app's attributes.
export async function expectDragOver(page: Page) {
  await expect(dragMachine(page)).toHaveCount(0);
  await expect(dragOverlay(page)).toHaveCount(0);
  await expect(page.locator('[data-drop-state], [data-drop-tier]')).toHaveCount(0);
}

// The banner is visible, once, with `cause`'s sentence. Reads the screen.
export async function expectBannerSays(page: Page, cause: ForcedStopCause) {
  await expect(stopBanner(page)).toBeVisible();
  await expect(stopBanner(page)).toHaveText(sentenceFor(cause));
}

// A page-side record of the banner's elements, which the reload that swaps the board out from under
// them must neither remove nor draw again nor change in place, and of every row that was given the
// flash. Install it before the page loads. It reads the app's `data-forced-stop` and `data-stop-flash`
// attributes and the banner's text from a MutationObserver on the document, so it sees what a test
// that polls between two points would miss.
interface StopCueLog {
  added: string[];
  removed: number;
  changed: string[];
  flashed: string[];
}

export type StopCueRecord = Awaited<ReturnType<typeof recordStopCue>>;

export async function recordStopCue(page: Page) {
  await page.addInitScript(() => {
    const log: StopCueLog = { added: [], removed: 0, changed: [], flashed: [] };
    (window as unknown as { __stopCueLog: StopCueLog }).__stopCueLog = log;
    const within = (node: Node, selector: string) =>
      node instanceof Element ? [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)] : [];
    const name = (el: Element) => el.getAttribute('data-item-id') ?? el.getAttribute('aria-label') ?? el.tagName;
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') {
          if (!(record.target instanceof Element)) continue;
          if (record.attributeName === 'data-forced-stop') {
            log.changed.push(`cause: ${record.target.getAttribute('data-forced-stop')}`);
          } else if (record.target.hasAttribute('data-stop-flash')) {
            log.flashed.push(name(record.target));
          }
          continue;
        }
        if (record.type === 'characterData') {
          const banner = record.target.parentElement?.closest('[data-forced-stop]');
          if (banner) log.changed.push(banner.textContent ?? '');
          continue;
        }
        const inside = record.target instanceof Element ? record.target.closest('[data-forced-stop]') : null;
        if (inside) log.changed.push(inside.textContent ?? '');
        for (const node of record.addedNodes) {
          for (const banner of within(node, '[data-forced-stop]')) log.added.push(banner.textContent ?? '');
          for (const row of within(node, '[data-stop-flash]')) log.flashed.push(name(row));
        }
        for (const node of record.removedNodes) log.removed += within(node, '[data-forced-stop]').length;
      }
    }).observe(document, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-stop-flash', 'data-forced-stop'],
    });
  });
  const read = () => page.evaluate(() => (window as unknown as { __stopCueLog: StopCueLog }).__stopCueLog);
  return {
    // The text of every banner drawn since the page loaded, in order.
    added: async () => (await read()).added,
    // How many banner elements have been taken out of the page since it loaded.
    removed: async () => (await read()).removed,
    // Every change made to a banner already drawn: its cause attribute or its text, in place.
    changed: async () => (await read()).changed,
    // Every row given the flash since the page loaded, each time it was given.
    flashed: async () => (await read()).flashed,
  };
}

// The stop run: the cause's earlier write(s) are held, `pickUpX` starts the drag that is live when
// the stop lands, the clock is frozen, and the board read the stop causes is held. Returns with
// "Loading board…" on screen, the drag over and that read held. `read.release()` lets the reloaded
// board draw. Reads the screen and the network.
export async function landStop(page: Page, cause: HeldCause, boardId: string, pickUpX: () => Promise<unknown>) {
  await cause.ready();
  await pickUpX();
  await freezeClock(page);
  const read = await holdNextRead(page, `**/api/boards/${boardId}`);
  await cause.land();
  await read.arrived();
  await expect(loadingBoard(page)).toBeVisible();
  return read;
}

// Every scroll offset on the page that is not zero, the document's included, as one comparable
// string: a stop must not scroll the board or a list to reveal a hidden item. Reads the screen.
export function scrollState(page: Page): Promise<string> {
  return page.evaluate(() => {
    const scrolled = [document.documentElement, ...document.querySelectorAll('*')].filter(
      el => el.scrollTop !== 0 || el.scrollLeft !== 0,
    );
    return scrolled.map(el => `${el.tagName}.${el.className}:${el.scrollTop},${el.scrollLeft}`).join('|');
  });
}
