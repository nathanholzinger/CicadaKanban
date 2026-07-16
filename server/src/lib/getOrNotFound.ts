import type { Response } from 'express';

// Fetches a row already looked up via `.get()`; if it's undefined, sends a
// 404 with `{ error }` and returns undefined so the caller can bail out with
// a single `if (!row) return;` instead of repeating the same
// select-then-check-then-respond block at every route.
export function getOrNotFound<T>(row: T | undefined, res: Response, error: string): T | undefined {
  if (!row) {
    res.status(404).json({ error });
    return undefined;
  }
  return row;
}
