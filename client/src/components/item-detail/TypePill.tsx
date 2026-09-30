// The type pill every Card- and Stub-tier render shares — resolves item.type
// against itemTypes internally, rendering nothing for an orphaned/unknown/null
// type.

import type { Item, ItemType } from '../../types';
import { typePillClass, typePillStyle } from './pillUtils';

// Deliberately separate from ItemDetailPanel's header pill, which shows the
// raw type id for an unresolved type rather than hiding it: folding that
// pill in here would change what one of the two shows. The Stub tier
// renders this one through `StubRows.tsx::StubBody`.
export default function TypePill({ item, itemTypes }: { item: Pick<Item, 'type'>; itemTypes: ItemType[] }) {
  const resolved = item.type ? itemTypes.find(t => t.id === item.type) : null;
  if (!resolved) return null;
  return (
    <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
      {resolved.name}
    </span>
  );
}
