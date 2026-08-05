// "Append at end" position math — max(existing positions) + 1.0, with an
// empty-list base case of 1.0. `position` may be null (items.position is
// nullable); a null counts as 0 for the max, matching what every call site
// already did ad hoc. Was hand-written identically in 4 POST handlers plus
// MCP's move_item tool (audit finding #25).
export function nextPosition(rows: { position: number | null }[]): number {
  if (rows.length === 0) return 1.0;
  return Math.max(...rows.map(r => r.position ?? 0)) + 1.0;
}
