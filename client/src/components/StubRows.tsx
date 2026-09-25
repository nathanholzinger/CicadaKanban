// The Stub tier's own rows — StubBody (the shared type-pill + title), AttachGhostRow
// (a preview of an item about to attach), AttachedChildRow (a real, draggable Stub).
// Split out of KanbanCard.tsx (Story 6.1 Phase 1, C-5): the Card tier's own render
// stays there; this is everything a Descendants-section row renders as.

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Item, ItemType } from '../types';
import { typePillClass, typePillStyle } from './item-detail/pillUtils';
import { itemRowData } from './workflow/dragCollision';
import { DESCENDANTS_INDENT_PX } from './cardMetrics';
import { DropSideIndicator, INVALID_PLACEMENT_CLASS, useDropTargetProps } from './dragChrome';

// A card's type pill only renders when `item.type` resolves to a known
// ItemType — an orphaned/unknown type reference hides the pill rather than
// showing a raw id (unlike the item-detail sections, which fall back to the
// raw id as label text). Still used directly by the Stub-tier rows below
// (AttachGhostRow, AttachedChildRow) — TypePill (item-detail/TypePill.tsx)
// only replaces the Card-tier's own two copies (audit epic-3-5-story-4 #10).
function resolveType(typeId: string | null, itemTypes: ItemType[]): ItemType | null {
  return typeId ? (itemTypes.find(t => t.id === typeId) ?? null) : null;
}

// Story 6 Phase C: the type pill + one-line title every Stub-tier render
// shares — AttachGhostRow and AttachedChildRow below, and KanbanCard's own
// overlay-Stub branch. Extracted so the three can't drift apart from each
// other; each still owns its own outer box (dashed ghost, sortable row,
// carried shadow), since that's the one thing that's genuinely different
// between them.
export function StubBody({ item, itemTypes }: { item: Item; itemTypes: ItemType[] }) {
  const resolvedType = resolveType(item.type, itemTypes);
  return (
    <>
      {resolvedType && (
        <span className={typePillClass(item.type, itemTypes)} style={typePillStyle(item.type, itemTypes)}>
          {resolvedType.name}
        </span>
      )}
      <span className="truncate text-xs text-zinc-300">{item.title}</span>
    </>
  );
}

// Story 4, `depth` added Story 6 Phase B: a purely visual stand-in for the
// active drag's own item once it's previewed attaching here — same slot,
// same small pill treatment as a real AttachedChildRow, but no
// `useSortable`/`useDroppable` registration of its own (see the call
// site's comment for why that matters — decision 4's uniform `role` field
// narrowed the original hazard but never removed the deeper one: dnd-kit
// doesn't support two simultaneous sortable registrations for one id, and
// this row's real registration is still wherever it's actually being
// dragged from). Rendering `AttachedChildRow` itself for this row was the
// more obvious choice; this is the one deliberate departure from "reuse
// the existing sibling-reorder row" and exists only to sidestep that risk.
export function AttachGhostRow({ item, itemTypes, depth }: { item: Item; itemTypes: ItemType[]; depth: number }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded border border-dashed border-blue-500/50 bg-blue-500/10 px-1.5 py-1"
      style={{ marginLeft: (depth + 1) * DESCENDANTS_INDENT_PX }}
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
   * Story 6 Phase D, decision 7 (provisional look, Story 8 restyles): true
   * only for the active drag's own row, and only while its current tab
   * state (§7.2) would exceed the depth cap — a dashed red outline plus
   * `data-placement-valid="false"`, the one exception to §3.2 ("a state
   * that would exceed the cap is still reachable... a release in it
   * commits nothing").
   */
  invalid?: boolean;
}

// Story 6 Phase B: one row in the flat section, indented by `depth` — no
// longer recursive (its own grandchildren used to nest here via a second
// `SortableContext`; the parent's single flat list now carries every depth,
// `KanbanCard.tsx`'s own `rows` already having walked the whole subtree).
export function AttachedChildRow({ item, itemTypes, depth, onCardClick, invalid = false }: AttachedChildRowProps) {
  // Epic 3.2 Part 3, extended by Story 5: draggable among siblings under
  // the same parent (the within-action until Story 6 Phase D's real
  // gap+depth rule) — one shared `SortableContext` spanning the whole
  // section now (decision 1), reached through the same pop machine as a
  // Card (Step 1), not a separate board-level path. Decision 4: `type`
  // stays `'item'`, the same as a Card row, so this id's registration
  // never *looks* like a different drag type to dnd-kit once it pops out
  // and remounts as one. `parentId` is this row's own real parent — no
  // longer what scopes collisions (Phase B widened that to the whole
  // section's rect, `resolveBoardCollisions`' `descendantsSectionRect`);
  // kept for the same diagnostic/future-facing reasons every row's data
  // carries it.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: itemRowData('stub', item.parentId),
  });
  // Stubs are classified individually during a Card drag (wiki §4, DRAG-2.8)
  // — same attributes and overlay as a Card, so a test reads them alike.
  // The live drop side shows for either kind of active drag: a sibling
  // Stub reorder, or a foreign Card popped into this row's own parent,
  // anchoring beside it (Story 6.1 Phase 3, L1-13 — no role filter left to
  // narrow it either way).
  const { dropSide, dataAttrs, className: dropTargetClassName } = useDropTargetProps(item.id);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: (depth + 1) * DESCENDANTS_INDENT_PX,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dataAttrs}
      data-placement-valid={invalid ? 'false' : undefined}
      className={`relative rounded ${isDragging ? 'opacity-30' : ''} ${invalid ? INVALID_PLACEMENT_CLASS : ''} ${dropTargetClassName}`}
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
        className="flex w-full cursor-grab items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors hover:bg-zinc-700/40 active:cursor-grabbing"
      >
        <StubBody item={item} itemTypes={itemTypes} />
      </button>
    </div>
  );
}
