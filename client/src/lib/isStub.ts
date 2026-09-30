// The one "renders as a Stub" predicate: positionScope === 'attached-siblings'.

import type { Item } from '../types';

// The one definition of "this item renders as a Stub" — an attached child
// nested inside its parent's Card, positioned only against its siblings
// (wiki item-attachment §12). `positionScope` is the server-computed field;
// never re-derive it from `isAttached && parentId` inline.
export function isStub(item: Pick<Item, 'positionScope'>): boolean {
  return item.positionScope === 'attached-siblings';
}
