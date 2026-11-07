import { expect, type Page, type Route } from '@playwright/test';

// Holds the answer to every request of one method and URL until the spec lets it go, for a spec that
// reads the page while a write is unanswered. `outcome` says how the held answer ends:
// - 'succeed': the request reaches the server at once, as `requestHarness.ts::delayMoveResponses`'s does, so
//   the server's order of operations is the real one and only the client's view of it is delayed.
// - 'refuse': the request never reaches the server, and its answer is a 400 once released, so a refused
//   write leaves nothing behind.
// `release` lets every answer held so far through; a request made after it is held again, to be released
// in its turn.
export interface HeldRequests {
  /** Resolves once a request has been made and is being held. */
  arrived(): Promise<void>;
  /** Lets every held answer through. */
  release(): void;
}

export async function holdRequests(
  page: Page,
  { method, url, outcome }: { method: string; url: string; outcome: 'succeed' | 'refuse' },
): Promise<HeldRequests> {
  const gate = () => {
    let open!: () => void;
    const opened = new Promise<void>(resolve => (open = resolve));
    return { opened, open };
  };
  let current = gate();
  let held = 0;

  await page.route(url, async (route: Route) => {
    if (route.request().method() !== method) return route.fallback();
    const mine = current;
    held++;
    const response = outcome === 'succeed' ? await route.fetch() : null;
    await mine.opened;
    if (response) await route.fulfill({ response });
    else
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'refused' }) });
  });

  return {
    arrived: () => expect.poll(() => held, { message: `a ${method} ${url} is held` }).toBeGreaterThan(0),
    release() {
      current.open();
      current = gate();
      held = 0;
    },
  };
}
