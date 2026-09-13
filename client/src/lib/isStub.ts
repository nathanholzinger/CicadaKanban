import type { Item } from '../types';

// The one definition of "this item renders as a Stub" — an attached child
// nested inside its parent's Card, positioned only against its siblings
// (docs/planning/epic-3-5-decisions.md vocabulary). `positionScope` is the
// server-computed field (Epic 3.2 §2); never re-derive it from
// `isAttached && parentId` inline (audit epic-3-5-story-2 #12).
export function isStub(item: Pick<Item, 'positionScope'>): boolean {
  return item.positionScope === 'attached-siblings';
}
