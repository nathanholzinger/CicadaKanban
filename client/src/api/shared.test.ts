import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiJson, apiRequest, apiVoid } from './shared';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function emptyResponse(status: number): Response {
  return new Response(null, { status });
}

describe('apiJson/apiVoid/apiRequest', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('apiJson resolves with the parsed body on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { id: '1', name: 'X' })));
    const result = await apiJson('/items/1', undefined, 'fallback');
    expect(result).toEqual({ id: '1', name: 'X' });
  });

  it('apiJson throws the server\'s real `{ error }` message on failure, not the fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(400, { error: 'title is required' })));
    await expect(apiJson('/items', { method: 'POST', body: {} }, 'Failed to create item')).rejects.toThrow('title is required');
  });

  it('apiJson falls back to the given message when the error body is missing the `error` field', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, {})));
    await expect(apiJson('/items/1', undefined, 'Failed to fetch item')).rejects.toThrow('Failed to fetch item');
  });

  it('apiJson falls back to the given message when the error body is not valid JSON at all', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>500</html>', { status: 500 })));
    await expect(apiJson('/items/1', undefined, 'Failed to fetch item')).rejects.toThrow('Failed to fetch item');
  });

  it('apiVoid resolves without attempting to parse a body (e.g. a 204 with none)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(emptyResponse(204)));
    await expect(apiVoid('/items/1', { method: 'DELETE' }, 'Failed to delete item')).resolves.toBeUndefined();
  });

  it('apiVoid still surfaces the real error message on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(409, { error: "Cannot delete a workflow's last remaining board" })));
    await expect(apiVoid('/boards/1', { method: 'DELETE' }, 'Failed to delete board'))
      .rejects.toThrow("Cannot delete a workflow's last remaining board");
  });

  it('apiRequest returns the raw Response so a caller can branch on status (e.g. deleteWorkphase)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(emptyResponse(204));
    vi.stubGlobal('fetch', fetchMock);
    const res = await apiRequest('/workphases/1', { method: 'DELETE' }, 'fallback');
    expect(res.status).toBe(204);
  });

  it('sends no body/Content-Type header for a request with no body (a GET)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, []));
    vi.stubGlobal('fetch', fetchMock);
    await apiJson('/items', undefined, 'fallback');

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBeUndefined();
    expect(init.headers).toBeUndefined();
  });

  it('JSON-stringifies a plain object body and sets Content-Type when one is given', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { id: '1' }));
    vi.stubGlobal('fetch', fetchMock);
    await apiJson('/items', { method: 'POST', body: { title: 'Test' } }, 'fallback');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/items');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ title: 'Test' }));
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });
});
