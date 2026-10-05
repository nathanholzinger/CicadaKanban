// The placement rule, gap and depth (wiki hierarchy-placement §1) — shared
// by the board's Card sections (the Descendants layer) and the project
// sidebar. Pure, table-generic: never imports Item or
// Project, only `{ id, parentId, depth }` rows and a `childrenOf` callback,
// the same posture as the server's positionResolver. Lives beside
// `hierarchy.ts` (the one shared tree-math layer) but is its own module —
// `hierarchy.ts`'s `getDepth`/`getDescendantIds`/`getSubtreeHeight` are
// what a caller's own `isValid` predicate is built from, not something this
// file calls itself (the resolved parent is a real item/project id from the
// caller's own dataset; only the caller knows how to look its absolute
// depth up).

// depth 0 = the root's direct children — the root itself is never a row.
// `parentId` mirrors `rootId`'s own type: null at depth 0 when the caller's
// root is the sidebar's virtual top (real top-level projects already carry
// `parentId: null`); a real id at depth 0 when the root is a board Card
// (Stubs' direct parent is always a real item).
export interface Row {
  id: string;
  parentId: string | null;
  depth: number;
}

// Which side of a row an item lands on.
export type DropSide = 'before' | 'after';

// "Before/after this row" — the relation a drop names, a ghost is drawn at,
// and a move request carries. The one spelling for the board and the sidebar.
export interface AnchorRelation {
  anchorId: string;
  side: DropSide;
}

export interface ResolvedPlacement {
  parentId: string | null;
  anchor: AnchorRelation | null;
}

// A walked row carrying the caller's own record (an Item, a Project).
export type HierarchyNode<T> = Row & { item: T };

// The one tree walk: DFS over `childrenOf`, parents before children — the
// render order both surfaces draw in. What a caller wants left out of the
// walk (a collapsed project's children, an attach ghost's) it leaves out of
// `childrenOf`. `seen` stops a corrupted parentId cycle in the data from
// recursing forever, as `hierarchy.ts`'s walks do: an id already walked
// (the root included) is skipped.
export function flattenHierarchyOf<T extends { id: string }>(
  rootId: string | null,
  childrenOf: (parentId: string | null) => readonly T[],
): HierarchyNode<T>[] {
  const nodes: HierarchyNode<T>[] = [];
  const seen = new Set<string | null>([rootId]);
  function walk(parentId: string | null, depth: number) {
    for (const item of childrenOf(parentId)) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      nodes.push({ id: item.id, parentId, depth, item });
      walk(item.id, depth + 1);
    }
  }
  walk(rootId, 0);
  return nodes;
}

// Plain rows, minus `exclude` and everything beneath it — the dragged item
// carries its whole subtree, so none of it is ever a Top or Bottom
// candidate (wiki hierarchy-placement §4). The walk puts a parent
// before its children, so a row is dropped exactly when it's excluded or
// its parent was. Whether `exclude` is really the active item's own subtree
// is the caller's call.
export function toRows(nodes: readonly Row[], exclude: ReadonlySet<string> = new Set()): Row[] {
  const dropped = new Set<string>();
  const rows: Row[] = [];
  for (const { id, parentId, depth } of nodes) {
    if (exclude.has(id) || (parentId !== null && dropped.has(parentId))) {
      dropped.add(id);
      continue;
    }
    rows.push({ id, parentId, depth });
  }
  return rows;
}

// The walk over ids alone, as rows.
export function flattenHierarchy(
  rootId: string | null,
  childrenOf: (parentId: string | null) => readonly string[],
  exclude: ReadonlySet<string> = new Set(),
): Row[] {
  const nodes = flattenHierarchyOf(rootId, parentId => childrenOf(parentId).map(id => ({ id })));
  return toRows(nodes, exclude);
}

// The gap is `over` row + side (n + 1 gaps, never just "above
// `over`") — gap 0 sits above `rows[0]`, gap `rows.length` below the last
// row. `overId` not found in `rows` (nothing recognized — dnd-kit found no
// collision, or `over` is the active row itself) falls back to "below
// everything," the more conservative of the two boundary states.
export function gapIndexFor(rows: readonly Row[], overId: string, side: DropSide): number {
  const idx = rows.findIndex(r => r.id === overId);
  if (idx === -1) return rows.length;
  return side === 'before' ? idx : idx + 1;
}

// Where a row already sits, as a gap and a depth: what a drag of that row
// starts from, so a release before any movement resolves to its own slot,
// and a release at that gap and depth writes nothing
// (wiki hierarchy-placement §5). `rows` is the section *with* the dragged
// subtree.
// That subtree is one contiguous block starting at `id` (a DFS), so every
// row above `id` survives the exclusion, and `id`'s index here is its gap
// among the rows that remain. Null when `id` isn't a row.
export function ownSlotOf(rows: readonly Row[], id: string): { gap: number; depth: number } | null {
  const idx = rows.findIndex(r => r.id === id);
  return idx === -1 ? null : { gap: idx, depth: rows[idx].depth };
}

// The gap's depth range = [Bottom's depth … Top's depth + 1]. Top is the
// row just above the gap (what the item will sit directly under), Bottom
// the row just below (what it will sit directly above) — either may be
// absent at the hierarchy's own ends, which is exactly where the range's
// boundaries come from: no Top -> hi = 0 (the root's own depth); no Bottom
// -> lo = 0 (nothing shallower than the root either).
export function depthRangeFor(rows: readonly Row[], gap: number): { lo: number; hi: number } {
  const top = rows[gap - 1];
  const bottom = rows[gap];
  return { lo: bottom?.depth ?? 0, hi: (top?.depth ?? -1) + 1 };
}

// The row at exactly `depth`, walking up `node`'s own ancestor chain within
// `rows`. Always terminates inside `rows` for a `depth` inside
// `depthRangeFor`'s own range: the chain only ever climbs past a row at
// depth 0 (whose `parentId` is `rootId`, never another row) once `depth`
// would be negative, which `depthRangeFor` never offers.
function ancestorAt(rows: readonly Row[], node: Row, depth: number): Row {
  const byId = new Map(rows.map(r => [r.id, r]));
  let current = node;
  while (current.depth > depth) {
    const parent = current.parentId !== null ? byId.get(current.parentId) : undefined;
    if (!parent) break;
    current = parent;
  }
  return current;
}

// The gap-and-depth rule, state by state. No Top -> the root's first child
// (the only state `depthRangeFor` offers there). `depth === top.depth + 1`
// -> Top's first child, looked up in the **full** tree via `childrenOf`
// (minus `exclude`), not the next row in `rows`: a Top whose children
// aren't all in `rows` — a collapsed Top in the sidebar — would
// otherwise read as childless the moment its real first child isn't the
// very next rendered row, sending no anchor and landing last instead of
// first. Any shallower depth -> the ancestor `A` of Top at that depth (Top
// itself when depth === top.depth) -> `{ A.parentId, after A }`, which is
// already "before Bottom" at the shallowest level (`A.parentId` reads as
// `rootId` for free once `A` is a depth-0 row, since `flattenHierarchy`
// assigned it that `parentId` already — no separate "?? root" fallback
// needed). This branch stays row-based (never needs `childrenOf`): an
// ancestor's own *next sibling* placement only cares about its position
// among rendered rows, not about children hidden from them.
export function resolvePlacement(
  rows: readonly Row[],
  gap: number,
  depth: number,
  rootId: string | null,
  childrenOf: (parentId: string | null) => readonly string[],
  exclude: ReadonlySet<string> = new Set(),
): ResolvedPlacement {
  const top = rows[gap - 1];
  const bottom = rows[gap];
  if (!top) return { parentId: rootId, anchor: bottom ? { anchorId: bottom.id, side: 'before' } : null };
  if (depth === top.depth + 1) {
    const firstChildId = childrenOf(top.id).find(id => !exclude.has(id)) ?? null;
    return { parentId: top.id, anchor: firstChildId ? { anchorId: firstChildId, side: 'before' } : null };
  }
  const ancestor = ancestorAt(rows, top, depth);
  return { parentId: ancestor.parentId, anchor: { anchorId: ancestor.id, side: 'after' } };
}

export interface Projection {
  depth: number;
  placement: ResolvedPlacement;
}

// The depth step, one formula for both surfaces: they differ only in the
// one axis-specific number (`indentPx` — the sidebar's row indent, the
// board's `DESCENDANTS_INDENT_PX`) and the root (`null` for the sidebar's
// virtual top, a real Card id on the board). Depth never resets between
// samples — `seedDepth` is the drag's own seed (at pickup, or at a zoom-in
// transition), `deltaX` the pointer's travel from wherever that seed was
// taken, so a caller re-derives the same absolute depth every sample
// regardless of how many times the gap itself has changed underneath it.
export function computeProjection(
  rows: readonly Row[],
  gap: number,
  seedDepth: number,
  deltaX: number,
  indentPx: number,
  rootId: string | null,
  childrenOf: (parentId: string | null) => readonly string[],
  exclude: ReadonlySet<string> = new Set(),
): Projection {
  const { lo, hi } = depthRangeFor(rows, gap);
  const raw = seedDepth + Math.round(deltaX / indentPx);
  const depth = Math.max(lo, Math.min(hi, raw));
  return { depth, placement: resolvePlacement(rows, gap, depth, rootId, childrenOf, exclude) };
}
