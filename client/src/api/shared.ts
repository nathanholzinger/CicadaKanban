// apiJson/apiVoid/apiRequest — shared fetch helpers; always parse the server's real
// { error } message with a fallback. Mirrors server/src/routes/*.ts, no barrel index.

export const API = '/api';

// These three helpers are the one fetch/error path every module function
// in this directory builds on, so whether a failure surfaces the server's
// specific `{ error }` message or a generic string never depends on which
// module wrote the call.

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
