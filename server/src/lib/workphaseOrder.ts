// Workphase rank/order helpers shared by columnRanges.ts and the boards, columns and
// workflows routes.

import { db } from '../db/index.js';
import { workphases } from '../db/schema.js';
import { eq } from 'drizzle-orm';

type Workphase = typeof workphases.$inferSelect;

// ============================================================
// A workflow's workphases, ordered by position, plus the ordinal rank map
// derived from that order. Column-range math (columnRanges.ts) is the
// heaviest consumer, but ordering workphases isn't itself a column concern —
// workflows.ts GET /:id needs the same ordered list with no interest in
// columns at all — so it lives apart from columnRanges.ts.
// ============================================================

// Maps workphase id -> ordinal rank among workphases sorted by position.
// Ranks (not raw float positions) sidestep float-precision edge cases.
export function buildRankMap(orderedWorkphases: Workphase[]): Map<string, number> {
  const map = new Map<string, number>();
  orderedWorkphases.forEach((w, i) => map.set(w.id, i));
  return map;
}

// Fetches a workflow's workphases ordered by position plus the rank map
// derived from them — the query + buildRankMap pairing every route needing
// column-range math repeats (though not every caller needs the rank map;
// workflows.ts GET /:id, for one, only uses `workphases`).
export function getOrderedWorkphases(workflowId: string): { workphases: Workphase[]; rankMap: Map<string, number> } {
  const ordered = db
    .select()
    .from(workphases)
    .where(eq(workphases.workflowId, workflowId))
    .orderBy(workphases.position)
    .all();
  return { workphases: ordered, rankMap: buildRankMap(ordered) };
}
