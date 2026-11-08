import { expect, type APIResponse, type Page, type Request, type Route } from '@playwright/test';

// Observation and response controls for page writes. Request bodies are captured
// at send time, independently of whether an answer is delayed, refused or held.
export interface RecordedWrite {
  method: string;
  url: string;
  body: unknown;
}

function record(request: Request): RecordedWrite {
  let body: unknown;
  try {
    body = request.postDataJSON();
  } catch {
    body = request.postData();
  }
  return { method: request.method(), url: request.url(), body };
}

// Watches until this page closes; APIRequestContext setup is outside the observation.
export function watchWrites(page: Page): RecordedWrite[] {
  const writes: RecordedWrite[] = [];
  page.on('request', request => {
    if (request.method() !== 'GET') writes.push(record(request));
  });
  return writes;
}

// APIRequestContext reads are outside this observation, so a fresh saved-state
// assertion does not masquerade as a reload made by the open board.
export function watchBoardLoads(page: Page): string[] {
  const loads: string[] = [];
  page.on('request', request => {
    if (request.method() === 'GET' && /^\/api\/boards\/[^/]+$/.test(new URL(request.url()).pathname)) {
      loads.push(request.url());
    }
  });
  return loads;
}

export function successfulWrite(page: Page, method: string, pathname: string) {
  return page
    .waitForResponse(
      response => response.request().method() === method && new URL(response.url()).pathname === pathname,
    )
    .then(response => {
      expect(response.ok(), `${method} ${pathname} succeeds (${response.status()})`).toBe(true);
      return response;
    });
}

const WRITE_GRACE_MS = 300;

// A no-write assertion needs a quiet interval after the gesture settles: no page
// state promises that a deferred request handler has already had its turn.
export async function settledWrites(page: Page, writes: readonly RecordedWrite[]): Promise<readonly RecordedWrite[]> {
  await page.waitForTimeout(WRITE_GRACE_MS);
  return writes;
}

// The server saves each move immediately; only its answer to the page is delayed.
export async function delayMoveResponses(page: Page, ms: (n: number) => number) {
  let n = 0;
  await page.route('**/api/items/*/move', async (route: Route) => {
    const wait = ms(n++);
    const response = await route.fetch();
    await new Promise(resolve => setTimeout(resolve, wait));
    await route.fulfill({ response });
  });
}

// Refused moves never reach the server. An optional delay lets a later drag
// start before the refusal causes the board to reload.
export async function refuseMoves(page: Page, { afterMs = 0 }: { afterMs?: number } = {}) {
  await page.route('**/api/items/*/move', async (route: Route) => {
    if (afterMs > 0) await new Promise(resolve => setTimeout(resolve, afterMs));
    await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'refused' }) });
  });
}

export interface HeldWrite {
  request: RecordedWrite;
  status: number;
  body: unknown;
}

// Holds one matching answer; subsequent requests pass through. Successful writes
// reach the server before arrived() resolves, and their real response is retained.
export async function holdNextWrite(
  page: Page,
  { method, url, outcome }: { method: string; url: string; outcome: 'succeed' | 'refuse' },
) {
  let captured = false;
  let held: HeldWrite | undefined;
  let release!: () => void;
  const gate = new Promise<void>(resolve => (release = resolve));
  const handler = async (route: Route) => {
    if (captured || route.request().method() !== method) return route.fallback();
    captured = true;
    const request = record(route.request());
    const response: APIResponse | null = outcome === 'succeed' ? await route.fetch() : null;
    let body: unknown = { error: 'refused' };
    if (response) {
      const text = await response.text();
      try {
        body = text ? JSON.parse(text) : null;
      } catch {
        body = text;
      }
    }
    held = { request, status: response?.status() ?? 400, body };
    await gate;
    if (response) await route.fulfill({ response });
    else await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify(held.body) });
  };
  await page.route(url, handler);
  return {
    async arrived(): Promise<HeldWrite> {
      await expect.poll(() => held, { message: `one ${method} ${url} answer is held` }).toBeDefined();
      return held!;
    },
    release,
    async dispose() {
      release();
      await page.unroute(url, handler);
    },
  };
}
