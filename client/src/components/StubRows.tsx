// The Stub tier's own rows — StubBody (the shared type-pill + title), AttachGhostRow
// (a preview of an item about to attach), AttachedChildRow (a real, draggable Stub).
// The Card tier's own render is KanbanCard.tsx; this is everything a
// Descendants-section row renders as.

import type { Item, ItemType } from '../types';
import TypePill from './item-detail/TypePill';
import { STUB_ROW_BOX_CLASS, descendantsIndentPx } from './cardMetrics';
import { DropSideIndicator, INVALID_PLACEMENT_CLASS, useItemRow } from './dragChrome';

// The type pill + one-line title every Stub-tier render
// shares — AttachGhostRow and AttachedChildRow below, and KanbanCard's own
// overlay-Stub branch. Extracted so the three can't drift apart from each
// other; each still owns its own outer box (dashed ghost, sortable row,
// carried shadow) on `STUB_ROW_BOX_CLASS`. The pill is the Card tier's own
// `TypePill`, hidden for an unknown type the same way.
export function StubBody({ item, itemTypes }: { item: Item; itemTypes: ItemType[] }) {
  return (
    <>
      <TypePill item={item} itemTypes={itemTypes} />
      <span className="truncate text-xs text-zinc-300">{item.title}</span>
    </>
  );
}

// A purely visual stand-in for the active drag's own item once it's
// previewed attaching here — same slot, same small pill treatment as a real
// AttachedChildRow, indented by `depth`. Deliberately separate from
// `AttachedChildRow`, with which it shares `StubBody`, the box class and the
// indent: that row is a live participant in the drag (a sortable
// registration, a drag handle, a click target, `data-item-id`, the drop
// chrome, and the dimmed look a dragged item's own row gets), and this one
// must be none of them. The dragged item's own row is unmounted while it
// previews, and nothing at this layer sorts or takes a drop against it; the
// preview is drawn dashed blue instead.
export function AttachGhostRow({ item, itemTypes, depth }: { item: Item; itemTypes: ItemType[]; depth: number }) {
  return (
    <div
      className={`${STUB_ROW_BOX_CLASS} border border-dashed border-blue-500/50 bg-blue-500/10`}
      style={{ marginLeft: descendantsIndentPx(depth) }}
    >
      <StubBody item={item} itemTypes={itemTypes} />
    </div>
  );
}

interface AttachedChildRowProps {
  item: Item;
  itemTypes: ItemType[];
  depth: number;
  onCardClick?: (id: string) => void;
  /**
   * True only for the active drag's own row, and only while its current
   * tab state would exceed the depth cap — a dashed red outline (a
   * placeholder look) plus `data-placement-valid="false"`. The state is
   * still reachable; a release in it commits nothing.
   */
  invalid?: boolean;
}

// One row in the flat section, indented by `depth` — not recursive: the
// Card's single flat list carries every depth (`KanbanCard.tsx`'s own
// `rows` walk the whole subtree).
export function AttachedChildRow({ item, itemTypes, depth, onCardClick, invalid = false }: AttachedChildRowProps) {
  // Draggable within the section's one shared `SortableContext`, through
  // the same pop machine as a Card, not a separate board-level path. `type`
  // stays `'item'`, the same as a Card row, so this id's registration
  // never *looks* like a different drag type to dnd-kit once it pops out
  // and remounts as one. `parentId` is this row's own real parent; it
  // doesn't scope collisions (the whole section's rect does,
  // `dragCollision.ts::CollisionSession`), and is carried the way every
  // row's data carries it.
  //
  // Stubs are classified individually during a Card drag
  // (wiki board-drag-interaction §4) — same attributes and overlay as a
  // Card, so a test reads them alike.
  // The live drop side shows for either kind of active drag: a sibling
  // Stub reorder, or a foreign Card popped into this row's own parent,
  // anchoring beside it.
  const { setNodeRef, attributes, listeners, isDragging, dropSide, sortableStyle, dataAttrs, chromeClassName } =
    useItemRow(item.id, 'stub', { parentId: item.parentId });
  const style = { ...sortableStyle, paddingLeft: descendantsIndentPx(depth) };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dataAttrs}
      data-placement-valid={invalid ? 'false' : undefined}
      className={`relative rounded ${invalid ? INVALID_PLACEMENT_CLASS : ''} ${chromeClassName}`}
    >
      {/* Live drop-side indicator — see dragChrome.tsx::useLiveDropSide */}
      <DropSideIndicator side={dropSide} />

      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={e => {
          e.stopPropagation();
          if (!isDragging) onCardClick?.(item.id);
        }}
        className={`${STUB_ROW_BOX_CLASS} w-full cursor-grab text-left transition-colors hover:bg-zinc-700/40 active:cursor-grabbing`}
      >
        <StubBody item={item} itemTypes={itemTypes} />
      </button>
    </div>
  );
}
