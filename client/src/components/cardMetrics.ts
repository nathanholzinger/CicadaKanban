// Card sizing facts (Story 4.1 Phase 1) — a leaf module with no imports of
// its own, so KanbanCard.tsx and BandGuides.tsx can each depend on these
// facts without depending on *each other* for them (audit
// epic-3-5-story-4 #4: they used to live in KanbanCard.tsx, which
// BandGuides.tsx imported them from while KanbanCard.tsx imported
// ACTIVE_CONTEXT_OUTLINE back the other way — a real cycle, not just a
// lint complaint, since the next symbol added to either side could break
// module evaluation order with no type error to say so).

// shortCard's fixed height (decision 3) — both drag copies (the DragOverlay
// and the in-list ghost row) render at exactly this height, so the board's
// carve-out reservation (BandGuides.tsx) has one exact fact to reserve, not
// an approximation of whatever a real card's footer happens to add.
export const SHORT_CARD_HEIGHT_PX = 96;
// The card lists' own gap (CardList.tsx, the one list every column, sub-row
// and Unsorted group renders) — one constant so the reservation math (net
// height never changes, wiki §5) has one gap value to add in, not two.
export const CARD_LIST_GAP_PX = 8;
export const CARD_LIST_GAP_CLASS = 'gap-2';
