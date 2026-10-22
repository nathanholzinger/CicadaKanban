// Card sizing facts: the shortCard's fixed height and the card lists' gap, the
// Stub tier's row heights and box class, and the Descendants section's indent
// step. A leaf module with no imports of its own, so the render components
// (KanbanCard.tsx, BandGuides.tsx, CardList.tsx) and the drag layer's pure
// modules can each depend on these facts without depending on *each other* for
// them: an import cycle between two of them is a real hazard, not just a lint
// complaint, since the next symbol added to either side could break module
// evaluation order with no type error to say so.

// shortCard's fixed height — the in-list ghost row always renders at
// exactly this height, so the board's carve-out reservation
// (BandGuides.tsx) has one exact fact to reserve, not an approximation of
// whatever a real card's footer happens to add. The DragOverlay copy
// matches it too, except while locked at a Card or Descendants layer, where
// it's a Stub instead — the reservation is unaffected either way, since
// it's the in-list ghost's height that's reserved, never the overlay's.
export const SHORT_CARD_HEIGHT_PX = 96;
// The card lists' own gap (CardList.tsx, the one list every column, sub-row
// and Unsorted group renders) — one constant so the reservation math (net
// height never changes) has one gap value to add in, not two.
export const CARD_LIST_GAP_PX = 8;
export const CARD_LIST_GAP_CLASS = 'gap-2';
// The two numbers the band math reserves from, in the shape
// `dragBands.ts::ShortCardMetrics` reads — the pop machine and the carve-out
// guides (BandGuides.tsx) pass this one value.
export const SHORT_CARD_METRICS = { heightPx: SHORT_CARD_HEIGHT_PX, gapPx: CARD_LIST_GAP_PX };
// The Card's own outer inset (CARD_BASE in KanbanCard.tsx: a 1px border plus
// `p-3`'s 12px padding) — a descendants-section row spans the Card's full
// content width, so this is what turns a measured Card region's own
// (outer) rect into a row's width when the section itself hasn't resolved
// (the carried Stub, locked at the Card layer before any Descendants
// zoom-in).
export const CARD_CONTENT_INSET_PX = 13;
// The Stub tier's two row heights, measured rather than derived from the
// classes. A sortable row in a Descendants
// section (`StubRows.tsx::AttachedChildRow`, the dragged item's own row there
// included) is 24px; the bordered ones (`AttachGhostRow`, `KanbanCard.tsx`'s
// carried Stub) are 26px — the title line (`text-xs`, 16px) plus `py-1`,
// plus the border. A type pill adds 5px to either: it's 21px tall (10px text
// at the inherited 1.5 line height, `py-0.5`, a 1px border), taller than the
// title. The readers use the pill-less heights, so on a typed row they sit
// 2.5px off its true middle: `dragCollision.ts::dropAnchorFor`'s ghost
// middle (`STUB_ROW_HEIGHT_PX`, the Descendants-layer counterpart to
// SHORT_CARD_HEIGHT_PX above) and `dragOverlayGeometry.ts`'s re-anchor
// (`CARRIED_STUB_HEIGHT_PX`). Evening the rows out is a look change, not
// yet decided.
export const STUB_ROW_HEIGHT_PX = 24;
export const CARRIED_STUB_HEIGHT_PX = 26;
// The box all three Stub rows share, so the heights above stay true of each
// — each row adds only its own border, fill and states.
export const STUB_ROW_BOX_CLASS = 'flex items-center gap-1.5 rounded px-1.5 py-1';
// The flat descendants section's own per-row indent step: depth 0 (a Card's
// direct Stub) lands 12px in, and each level deeper adds another 12px. One
// number, read by the render side (`descendantsIndentPx`) and the gesture
// side alike: the projection's pointer travel per level
// (`descendantsProjection.ts`, as `hierarchyPlacement.ts::computeProjection`'s
// `indentPx`), so a tab to the right lands one row indent deeper.
export const DESCENDANTS_INDENT_PX = 12;

// A section row's indent at `depth` (0 = a Card's direct Stub): the one
// spelling every board render of it uses — the rows, the ghost row and the
// carried Stub — so the carried copy's pill lines up with its would-be
// siblings by construction, not by three copies agreeing. Margin vs.
// padding stays each site's own choice. The projection reads the step,
// `DESCENDANTS_INDENT_PX`, not this.
//
// Deliberately separate from the sidebar's
// `projectTreeUtils.ts::projectRowIndentPx` (`12 + depth · 14`): there 12
// is a base inset and the step is 14, here 12 is the step itself. The two
// 12s are equal by coincidence.
export function descendantsIndentPx(depth: number): number {
  return (depth + 1) * DESCENDANTS_INDENT_PX;
}
