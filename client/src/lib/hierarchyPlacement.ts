// The Descendants-layer placement rule (docs/wiki/board-drag-interaction §7) —
// shared by the board's Card sections and the project sidebar (Epic 3.5
// Story 6, decision 8). Pure, table-generic: never imports Item or Project,
// only `{ id, parentId, depth }` rows and a `childrenOf` callback, the same
// posture as the server's positionResolver. Lives beside `hierarchy.ts` (the
// one shared tree-math layer) but is its own module — `hierarchy.ts`'s
// `getDepth`/`getDescendantIds`/`getSubtreeHeight` are what a caller's own
// `isValid` predicate is built from, not something this file calls itself
// (the resolved parent is a real item/project id from the caller's own
// dataset; only the caller knows how to look its absolute depth up).

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

export interface Anchor {
  id: string;
  side: 'before' | 'after';
}

export interface ResolvedPlacement {
  parentId: string | null;
  anchor: Anchor | null;
}

// DFS over `childrenOf`, parents before children — the render order both
// surfaces already draw in. `exclude` is §7.2's "the dragged item carries
// its whole subtree": the active row is never removed from `childrenOf`
// itself (that's each caller's own affair — the board's Phase B already
// omits it before calling this; the sidebar's decision 5 wants it dimmed and
// drawn, but never a Top/Bottom candidate), so this file removes exactly the
// excluded ids without walking into their children, and never checks that
// they're really the active id's own descendants — the caller decides what
// "the dragged subtree" means for its own data.
export function flattenHierarchy(
  rootId: string | null,
  childrenOf: (parentId: string | null) => readonly string[],
  exclude: ReadonlySet<string> = new Set(),
): Row[] {
  const rows: Row[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const id of childrenOf(parentId)) {
      if (exclude.has(id)) continue;
      rows.push({ id, parentId, depth });
      walk(id, depth + 1);
    }
  }
  walk(rootId, 0);
  return rows;
}

// Decision 2: the gap is `over` row + side (n + 1 gaps, never just "above
// `over`") — gap 0 sits above `rows[0]`, gap `rows.length` below the last
// row. `overId` not found in `rows` (nothing recognized — dnd-kit found no
// collision, or `over` is the active row itself) falls back to "below
// everything," the more conservative of the two boundary states.
export function gapIndexFor(rows: readonly Row[], overId: string, side: 'before' | 'after'): number {
  const idx = rows.findIndex(r => r.id === overId);
  if (idx === -1) return rows.length;
  return side === 'before' ? idx : idx + 1;
}

// §7.1's range = [Bottom's depth … Top's depth + 1]. Top is the row just
// above the gap (what the item will sit directly under), Bottom the row
// just below (what it will sit directly above) — either may be absent at
// the hierarchy's own ends, which is exactly where the boundaries in §7.1
// come from: no Top -> hi = 0 (the root's own depth); no Bottom -> lo = 0
// (nothing shallower than the root either).
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

// §7.1 verbatim. No Top -> the root's first child (the only state
// `depthRangeFor` offers there). `depth === top.depth + 1` -> Top's first
// child, looked up in the **full** tree via `childrenOf` (minus `exclude`),
// not the next row in `rows`: a Top whose children aren't all in `rows` —
// the sidebar's difference 6, a collapsed Top, found 2026-09-23 — would
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
  if (!top) return { parentId: rootId, anchor: bottom ? { id: bottom.id, side: 'before' } : null };
  if (depth === top.depth + 1) {
    const firstChildId = childrenOf(top.id).find(id => !exclude.has(id)) ?? null;
    return { parentId: top.id, anchor: firstChildId ? { id: firstChildId, side: 'before' } : null };
  }
  const ancestor = ancestorAt(rows, top, depth);
  return { parentId: ancestor.parentId, anchor: { id: ancestor.id, side: 'after' } };
}
