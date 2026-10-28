// The Stub tier's own rows — StubBody (the shared type-pill + title), AttachGhostRow
// (a preview of an item about to attach), AttachedChildRow (a real, draggable Stub),
// OverflowRow (the count standing in for a row's hidden children, which opens the
// hierarchy modal), their static drawings, and SectionRows, the one list of them that
// a Card's section and the hierarchy modal both draw.
// The Card tier's own render is KanbanCard.tsx; this is everything a
// Descendants-section row renders as.

import type { Item, ItemType } from '../types';
import TypePill from './item-detail/TypePill';
import { STUB_ROW_BOX_CLASS, descendantsIndentPx } from './cardMetrics';
import { DropSideIndicator, INVALID_PLACEMENT_CLASS, ZoomCue, useItemRow } from './dragChrome';
import { useModalHoldPhase, type DescendantsProjection } from './workflow/DragSessionContext';
import { useDragTuning } from './workflow/DragTuningContext';
import type { OverflowRowData, SectionEntry } from './workflow/itemListOps';

// The type pill + one-line title every Stub-tier render
// shares — AttachGhostRow, AttachedChildRow and StaticStubRow below, and
// KanbanCard's own overlay-Stub branch. Extracted so they can't drift apart
// from each other; each still owns its own outer box (dashed ghost, sortable
// row, static row, carried shadow) on `STUB_ROW_BOX_CLASS`. The pill is the
// Card tier's own `TypePill`, hidden for an unknown type the same way.
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
  /** The Card whose section this row is in. */
  cardId: string;
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
// Card's single flat list carries every shown depth (`KanbanCard.tsx`'s own
// `entries` cut the subtree's walk at the last shown level).
export function AttachedChildRow({
  item,
  itemTypes,
  depth,
  cardId,
  onCardClick,
  invalid = false,
}: AttachedChildRowProps) {
  // Draggable within the section's one shared `SortableContext`, through
  // the same pop machine as a Card, not a separate board-level path. `type`
  // stays `'item'`, the same as a Card row, so this id's registration
  // never *looks* like a different drag type to dnd-kit once it pops out
  // and remounts as one. `parentId` is this row's own real parent; it
  // doesn't scope collisions (the whole section's rect does,
  // `dragCollision.ts::CollisionSession`), and is carried the way every
  // row's data carries it. `sectionCardId` names the Card whose section the
  // row is in, which a row drawn in the hierarchy modal, away from the Card,
  // would not otherwise say; an overflow row registers the same way.
  //
  // Stubs are classified individually during a Card drag
  // (wiki board-drag-interaction §4) — same attributes and overlay as a
  // Card, so a test reads them alike.
  // The live drop side shows for either kind of active drag: a sibling
  // Stub reorder, or a foreign Card popped into this row's own parent,
  // anchoring beside it.
  const { setNodeRef, attributes, listeners, isDragging, dropSide, sortableStyle, dataAttrs, chromeClassName } =
    useItemRow(item.id, 'stub', { parentId: item.parentId, sectionCardId: cardId });
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

const overflowLabel = (count: number) => `${count} ${count === 1 ? 'child' : 'children'}`;
const OVERFLOW_TEXT_CLASS = `${STUB_ROW_BOX_CLASS} text-xs text-zinc-500`;

// The row that stands in for the children of the last shown level's row `row.ownerId`, which
// the section doesn't draw: how many there are, one level under their parent, where they
// would be. It takes part in the shuffle as any row does, so the ghost slides above or below
// it and the live line can be drawn on it. It is no item: it carries no `data-item-id`, and
// nothing drags from it. A press on its count goes no further, so it neither starts the Card's
// drag nor opens the Sheet; a press on its indent is the Card's, as beside a Stub row
// (wiki board-drag-interaction §9). A click on the count opens the hierarchy modal, and so does
// a hold during a drag: the cue of that hold shows on the row (`ZoomCue`, as a Card's zoom-in
// cue does).
export function OverflowRow({ row, cardId, onOpen }: { row: OverflowRowData; cardId: string; onOpen: () => void }) {
  const { setNodeRef, dropSide, sortableStyle, dataAttrs } = useItemRow(row.id, 'overflow', {
    parentId: row.ownerId,
    sectionCardId: cardId,
  });
  // While the hold that opens the modal is on this row, its cue shows once the dwell is over.
  const holdPhase = useModalHoldPhase(row.ownerId);
  const { modalHoldCueMs } = useDragTuning();
  return (
    <div
      ref={setNodeRef}
      style={{ ...sortableStyle, paddingLeft: descendantsIndentPx(row.depth) }}
      {...dataAttrs}
      data-item-id={undefined}
      data-overflow-row={row.ownerId}
      className="relative rounded"
    >
      <DropSideIndicator side={dropSide} />
      <div className="relative">
        {holdPhase === 'cue' && <ZoomCue cueMs={modalHoldCueMs} />}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onOpen();
          }}
          onPointerDown={e => e.stopPropagation()}
          title="Show the whole hierarchy"
          className={`${OVERFLOW_TEXT_CLASS} w-full cursor-pointer text-left transition-colors hover:bg-zinc-700/40 hover:text-zinc-300`}
        >
          {overflowLabel(row.count)}
        </button>
      </div>
    </div>
  );
}

// A Stub's row drawn with no drag registration: what a Card's section shows while the hierarchy
// modal holds the Card's rows, so the section keeps its shape under the backdrop and no item is
// registered twice (the shuffle reads one row per item).
function StaticStubRow({ item, itemTypes, depth }: { item: Item; itemTypes: ItemType[]; depth: number }) {
  return (
    <div style={{ paddingLeft: descendantsIndentPx(depth) }}>
      <div className={STUB_ROW_BOX_CLASS}>
        <StubBody item={item} itemTypes={itemTypes} />
      </div>
    </div>
  );
}

interface SectionRowsProps {
  entries: readonly SectionEntry[];
  /** The Card whose section these rows are. */
  cardId: string;
  itemTypes: ItemType[];
  /** The active drag's attach-preview ghost at the Card layer, drawn as an inert row. */
  attachGhostId?: string;
  /** The Descendants layer's live projection for this Card, null outside that layer. */
  projection: DescendantsProjection | null;
  /** The item being dragged, if any. */
  activeId?: string;
  onCardClick?: (id: string) => void;
  /** Opens the hierarchy modal from an overflow row. */
  onOpenOverflow?: () => void;
  /** Draws the rows with no drag registration (`StaticStubRow`). */
  isStatic?: boolean;
}

// The rows of a Card's section: Stubs, with an overflow row where the section cuts a level off.
// A section and the hierarchy modal draw the same list, so the two can't differ in how a row
// is drawn: the active drag's own row takes the projected depth, and carries the invalid cue
// while that state is over the cap.
export function SectionRows({
  entries,
  cardId,
  itemTypes,
  attachGhostId,
  projection,
  activeId,
  onCardClick,
  onOpenOverflow,
  isStatic = false,
}: SectionRowsProps) {
  return entries.map(entry => {
    if (entry.kind === 'overflow') {
      return isStatic ? (
        <div key={entry.row.id} style={{ paddingLeft: descendantsIndentPx(entry.row.depth) }}>
          <div className={OVERFLOW_TEXT_CLASS}>{overflowLabel(entry.row.count)}</div>
        </div>
      ) : (
        <OverflowRow key={entry.row.id} row={entry.row} cardId={cardId} onOpen={() => onOpenOverflow?.()} />
      );
    }
    const { item: child, depth } = entry.row;
    if (isStatic) return <StaticStubRow key={child.id} item={child} itemTypes={itemTypes} depth={depth} />;
    const isActiveRow = child.id === activeId;
    // The active drag's own row previews the projected depth, not its stored one.
    const rowDepth = projection && isActiveRow ? projection.depth : depth;
    // This row is the active drag's own ghost (previewed attaching here, not a real Stub yet):
    // an inert preview, not a row (`AttachGhostRow` says why).
    return child.id === attachGhostId ? (
      <AttachGhostRow key={child.id} item={child} itemTypes={itemTypes} depth={rowDepth} />
    ) : (
      <AttachedChildRow
        key={child.id}
        item={child}
        itemTypes={itemTypes}
        depth={rowDepth}
        cardId={cardId}
        onCardClick={onCardClick}
        invalid={Boolean(projection && isActiveRow && !projection.valid)}
      />
    );
  });
}
