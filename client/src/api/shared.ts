// What every module in this directory builds on (it mirrors server/src/routes/*.ts,
// no barrel index): the one fetch/error path (`apiRequest`, `apiJson`, `apiVoid`),
// so whether a failure surfaces the server's specific `{ error }` message or a
// generic string never depends on which module wrote the call, and the envelope a
// position write answers with (`PositionedWriteResponse`, `ReindexedPosition`).

export const API = '/api';

// One row a server-side reindex renumbered: `{id, position}` and nothing more
// (wiki positioning §7).
export interface ReindexedPosition {
  id: string;
  position: number;
}

// A position write's answer: the fresh row and, only when a reindex fired, the
// `reindexed` pairs covering every row it renumbered (the written one included).
// Fold it in with `lib/positionedWrite.ts::applyWriteResponse`, never the row
// alone. The field is optional, so a callback that takes a bare row still
// type-checks and silently drops the pairs: anything that hands a write's
// response on is typed with this.
export type PositionedWriteResponse<Row> = Row & { reindexed?: ReindexedPosition[] };

export interface ApiRequestInit {
  method?: string;
  /** A plain object to JSON-stringify as the request body — not a pre-serialized string. */
  body?: unknown;
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
}

// The shared fetch + error path, returning the raw Response for callers that
// need to branch on status (e.g. deleteWorkphase's 204-vs-200 report). Most
// call sites want apiJson/apiVoid below instead.
export async function apiRequest(
  path: string,
  init: ApiRequestInit | undefined,
  fallbackMessage: string,
): Promise<Response> {
  const hasBody = init?.body !== undefined;
  const res = await fetch(`${API}${path}`, {
    method: init?.method,
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) throw new Error(await parseErrorMessage(res, fallbackMessage));
  return res;
}

// GET/POST/PUT/PATCH that return a JSON body on success.
export async function apiJson<T>(path: string, init: ApiRequestInit | undefined, fallbackMessage: string): Promise<T> {
  const res = await apiRequest(path, init, fallbackMessage);
  return res.json();
}

// POST/PUT/PATCH/DELETE where the caller doesn't need the response body.
export async function apiVoid(path: string, init: ApiRequestInit | undefined, fallbackMessage: string): Promise<void> {
  await apiRequest(path, init, fallbackMessage);
}
