import { describe, it, expect } from 'vitest';
import { urlPart } from '../../src/lib/urlPart.js';

// An id containing `/`, `?`, or `#`, interpolated unescaped into a request
// path or query value, would silently retarget the request to a different
// endpoint. Lives in its own test file (rather than a mcp.ts test) because
// mcp.ts opens a stdio transport as a side effect of being imported.
describe('urlPart', () => {
  it('escapes a path separator', () => {
    expect(urlPart('abc/def')).toBe('abc%2Fdef');
  });

  it('escapes a query-string delimiter', () => {
    expect(urlPart('abc?def=1')).toBe('abc%3Fdef%3D1');
  });

  it('escapes a fragment delimiter', () => {
    expect(urlPart('abc#def')).toBe('abc%23def');
  });

  it('coerces a non-string value before escaping', () => {
    expect(urlPart(123)).toBe('123');
  });

  it('leaves an ordinary id unchanged', () => {
    expect(urlPart('a1b2c3-d4e5f6')).toBe('a1b2c3-d4e5f6');
  });
});
