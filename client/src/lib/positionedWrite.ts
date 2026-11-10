// Folding a position write's response into a list of positioned rows, for items
// and projects alike (wiki positioning §8), and the record that says which rows an older answer must
// leave alone: which write last set a row's value (`setLater`, `recordSet`), and the position's own
// (`positionRecord`).

import type { PositionedWriteResponse, ReindexedPosition } from '../api/shared';

const NONE: ReadonlySet<string> = new Set();

// Order is the rule: apply every `reindexed` pair the list holds first (an
// unknown id means "not in this view," never missing data), then upsert the
// written row — it is authoritative for itself and is also in the pairs, so
// applying it first and a stale pair over it would be the silent-wrong order.
// `reindexed` is stripped so it never lands in a row.
// `newer` names rows whose position a later write has already set, when this response is the older: its
// pair for such a row is skipped, and the written row keeps the position it has (its other fields are
// the response's). A caller that answers in order passes nothing.
export function applyWriteResponse<Row extends { id: string; position: number | null }>(
  rows: readonly Row[],
  response: PositionedWriteResponse<Row>,
  newer: ReadonlySet<string> = NONE,
): Row[] {
  const { reindexed, ...rest } = response;
  const written = rest as unknown as Row;
  if (!reindexed && !newer.has(written.id)) return upsert(rows, response);
  const positionById = new Map((reindexed ?? []).filter(r => !newer.has(r.id)).map(r => [r.id, r.position]));
  const renumbered = rows.map(row => {
    const position = positionById.get(row.id);
    return position === undefined || row.position === position ? row : { ...row, position };
  });
  const current = newer.has(written.id) ? rows.find(r => r.id === written.id) : undefined;
  return upsert(renumbered, current ? { ...written, position: current.position } : written);
}

function upsert<Row extends { id: string }>(rows: readonly Row[], written: Row): Row[] {
  return rows.some(r => r.id === written.id) ? rows.map(r => (r.id === written.id ? written : r)) : [...rows, written];
}

// Which write last set each row's value of one field, as the number of the latest-sent write that set it.
// Writes of different rows aren't ordered, so an answer can land after a later-sent write's, and a value it
// carries would undo that write's. `setLater` names the rows an answer must leave, and `recordSet` records
// the rest as the answer's. A row keeps the number of the latest-sent write that set it, so a still older
// answer doesn't lower it. A field's record is a map the caller keeps: `positionRecord` below keeps the
// position's, and an item list keeps the workphase's in its state (`itemWriteReconciliation.ts`).
export function setLater(setBy: ReadonlyMap<string, number>, number: number, rows: Iterable<string>): Set<string> {
  return new Set([...rows].filter(id => (setBy.get(id) ?? 0) > number));
}

export function recordSet(setBy: Map<string, number>, number: number, rows: Iterable<string>): void {
  for (const id of rows) if ((setBy.get(id) ?? 0) <= number) setBy.set(id, number);
}

// Which write last set each row's position. The caller numbers each write as it is sent (`send`) and, when
// the answer lands, asks which rows a later-sent write has set (`answer`): that is the `newer` that
// `applyWriteResponse` takes. A position it carries, its own or a disclosed pair, is what such a write's
// would lose.
export function positionRecord() {
  let sent = 0;
  const setBy = new Map<string, number>();
  return {
    send(): number {
      return ++sent;
    },
    answer(number: number, response: { id: string; reindexed?: readonly ReindexedPosition[] }): Set<string> {
      const touched = [response.id, ...(response.reindexed ?? []).map(pair => pair.id)];
      const newer = setLater(setBy, number, touched);
      recordSet(setBy, number, touched);
      return newer;
    },
  };
}
