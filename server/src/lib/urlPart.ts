// Escapes a value before it's interpolated into a URL path segment or query
// value — pulled out of mcp.ts (audit Finding #19) so the escaping logic can
// be unit-tested without importing mcp.ts itself, which opens a stdio
// transport as a side effect of module load. Every id/value interpolated
// into a request path is untrusted tool input; without this, an id
// containing `/`, `?`, or `#` would silently retarget the request to a
// different endpoint. Not a SQL-injection vector (Drizzle parameterizes
// everywhere) — a URL-shape one.
export function urlPart(value: unknown): string {
  return encodeURIComponent(String(value));
}
