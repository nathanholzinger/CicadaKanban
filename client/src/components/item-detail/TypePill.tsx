// The type pill every Card- and Stub-tier render shares — resolves item.type
// against itemTypes internally, rendering nothing for an orphaned/unknown/null
// type.

import type { Item, ItemType } from '../../types';
import { typePillClass, typePillStyle } from './pillUtils';

// Was hand-rolled identically at both Card-tier renders — ShortCard and
// KanbanCard's own full body (audit epic-3-5-story-4 #10). Deliberately
// stricter than ItemDetailPanel's header pill, which falls back to showing
// the raw type id for an unresolved type rather than hiding it — a Card
// never had that fallback, so this doesn't add one. The Stub tier renders
// it too, through `StubRows.tsx::StubBody`.
export default function TypePill({ item, itemTypes }: { item: Pick<Item, 'type'>; itemTypes: ItemType[] }) {
  const resolved = item.type ? itemTypes.find(t => t.id === item.type) : null;
  if (!resolved) return null;
  return (
    <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
      {resolved.name}
    </span>
  );
}
