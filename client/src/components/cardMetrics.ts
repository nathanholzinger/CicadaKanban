// Card sizing facts (Story 4.1 Phase 1) — a leaf module with no imports of
// its own, so KanbanCard.tsx and BandGuides.tsx can each depend on these
// facts without depending on *each other* for them (audit
// epic-3-5-story-4 #4: they used to live in KanbanCard.tsx, which
// BandGuides.tsx imported them from while KanbanCard.tsx imported
// ACTIVE_CONTEXT_OUTLINE back the other way — a real cycle, not just a
// lint complaint, since the next symbol added to either side could break
// module evaluation order with no type error to say so).

// shortCard's fixed height (decision 3) — the in-list ghost row always
// renders at exactly this height, so the board's carve-out reservation
// (BandGuides.tsx) has one exact fact to reserve, not an approximation of
// whatever a real card's footer happens to add. The DragOverlay copy
// matches it too, except while locked at a Card or Descendants layer, where
// it's a Stub instead (Story 6 Phase C, reopening Story 5 decision 6) — the
// reservation is unaffected either way, since it's the in-list ghost's
// height that's reserved, never the overlay's.
export const SHORT_CARD_HEIGHT_PX = 96;
// The card lists' own gap (CardList.tsx, the one list every column, sub-row
// and Unsorted group renders) — one constant so the reservation math (net
// height never changes, wiki §5) has one gap value to add in, not two.
export const CARD_LIST_GAP_PX = 8;
export const CARD_LIST_GAP_CLASS = 'gap-2';
// The Card's own outer inset (CARD_BASE in KanbanCard.tsx: a 1px border plus
// `p-3`'s 12px padding) — a descendants-section row spans the Card's full
// content width, so this is what turns a measured Card region's own
// (outer) rect into a row's width when the section itself hasn't resolved
// yet (Story 6 Phase C's carried Stub, locked at Card layer without ever
// having reached a Descendants zoom-in).
export const CARD_CONTENT_INSET_PX = 13;
// A Stub row's rendered height (Story 6 Phase C: `useBoardDnd.ts`'s overlay
// re-anchor; Phase D: `dragCollision.ts::dropAnchorFor`'s own ghost-height
// choice for a Stub row's slot, the Descendants-layer counterpart to
// SHORT_CARD_HEIGHT_PX above) — one line, `py-1` (4px top/bottom) inside
// `KanbanCard.tsx`'s `OVERLAY_STUB_CLASS`/`StubRows.tsx`'s `AttachedChildRow` — a fixed fact
// about the component, not a value read off any measurement.
export const STUB_ROW_HEIGHT_PX = 26;
// Epic 3.5 Story 6 Phase B (decision 1) — the flat descendants section's own
// per-row indent: depth 0 (a Card's direct Stub) lands 12px in, matching the
// single `pl-3` its old recursive wrapper carried alone; each level deeper
// adds another 12px. Shared with Phase D's projection math
// (`useBoardDnd.ts`'s `deltaX / DESCENDANTS_INDENT_PX`, decision 3's
// horizontal-offset-picks-a-depth rule) — one number, read by the render
// side (`StubRows.tsx`'s rows, `KanbanCard.tsx`'s carried Stub) and the
// gesture side alike.
export const DESCENDANTS_INDENT_PX = 12;
