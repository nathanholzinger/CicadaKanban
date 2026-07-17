// Fractional ordering math shared by every reorder surface (project sidebar,
// board cards). Positions are REAL values sorted ascending; a new entry slots
// between its neighbors via the midpoint so a single write suffices.
//
// `null` for a neighbor means "no neighbor on that side" — including a
// neighbor whose own position is unset and therefore unusable as a bound.
export function positionBetween(
  prevPos: number | null,
  nextPos: number | null,
  whenEmpty: () => number,
): number {
  if (prevPos !== null && nextPos !== null) return (prevPos + nextPos) / 2;
  if (prevPos !== null) return prevPos + 1.0;
  if (nextPos !== null) return nextPos / 2;
  return whenEmpty();
}
