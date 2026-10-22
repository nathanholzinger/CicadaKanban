// Folding a position write's response into a list of positioned rows, for items
// and projects alike (wiki positioning §8).

import type { PositionedWriteResponse } from '../api/shared';

// Order is the rule: apply every `reindexed` pair the list holds first (an
// unknown id means "not in this view," never missing data), then upsert the
// written row — it is authoritative for itself and is also in the pairs, so
// applying it first and a stale pair over it would be the silent-wrong order.
// `reindexed` is stripped so it never lands in a row.
export function applyWriteResponse<Row extends { id: string; position: number | null }>(
  rows: readonly Row[],
  response: PositionedWriteResponse<Row>,
): Row[] {
  if (!response.reindexed) return upsert(rows, response);
  const { reindexed, ...rest } = response;
  const written = rest as unknown as Row;
  const positionById = new Map(reindexed.map(r => [r.id, r.position]));
  const renumbered = rows.map(row => {
    const position = positionById.get(row.id);
    return position === undefined || row.position === position ? row : { ...row, position };
  });
  return upsert(renumbered, written);
}

function upsert<Row extends { id: string }>(rows: readonly Row[], written: Row): Row[] {
  return rows.some(r => r.id === written.id) ? rows.map(r => (r.id === written.id ? written : r)) : [...rows, written];
}
