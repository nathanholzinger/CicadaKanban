// The type pill every Card- and Stub-tier render shares — resolves item.type
// against itemTypes internally, rendering nothing for an orphaned/unknown/null
// type.

import type { Item, ItemType } from '../../types';
import { typePillClass, typePillStyle } from './pillUtils';

// Deliberately separate from ItemDetailPanel's header pill, which shows the
// raw type id for an unresolved type rather than hiding it: folding that
// pill in here would change what one of the two shows. The Stub tier
// renders this one through `StubRows.tsx::StubBody`.
//
// `fitsLine` is the Stub tier's variant: the pill drops the line height it
// would inherit (1.5 times its 10px text, which makes it 21px tall), so it is
// 16px (10px text, `py-0.5`, a 1px border), no taller than the 16px title line
// beside it, and a typed Stub row is as tall as an untyped one.
export default function TypePill({
  item,
  itemTypes,
  fitsLine = false,
}: {
  item: Pick<Item, 'type'>;
  itemTypes: ItemType[];
  fitsLine?: boolean;
}) {
  const resolved = item.type ? itemTypes.find(t => t.id === item.type) : null;
  if (!resolved) return null;
  const pillClass = typePillClass(item.type, itemTypes);
  return (
    <span className={fitsLine ? `${pillClass} leading-none` : pillClass} style={typePillStyle(item.type, itemTypes)}>
      {resolved.name}
    </span>
  );
}
