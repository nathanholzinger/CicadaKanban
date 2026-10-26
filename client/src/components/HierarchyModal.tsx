// The hierarchy modal: a Card's whole hierarchy, its attached descendants at every level with
// no overflow row. While it's open it is the Card's Descendants layer for a drag, drawn whole:
// its list carries the Descendants region key, so the cursor and the carried copy are read
// against its rows, and the Card's own section draws static under the backdrop
// (`KanbanCard.tsx`, `StubRows.tsx::SectionRows`). A drag in it is placed by gap and depth as in
// the section; leaving its box pops out of the layer and closes it (`useBoardDnd.ts`).

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item, ItemType } from '../types';
import ModalShell from './ModalShell';
import { SectionRows } from './StubRows';
import { useCardContextLayer, useDragSession } from './workflow/DragSessionContext';
import { cardRegionKey, descendantsRegionKey, dragRegionProps } from './workflow/dragRegions';
import { hierarchyRows, sectionEntries } from './workflow/itemListOps';

interface HierarchyModalProps {
  card: Item;
  itemTypes: ItemType[];
  getAttachedChildren: (parentId: string) => readonly Item[];
  onClose: () => void;
}

export default function HierarchyModal({ card, itemTypes, getAttachedChildren, onClose }: HierarchyModalProps) {
  const session = useDragSession();
  const contextLayer = useCardContextLayer(card.id);
  // Computed once per render: `getAttachedChildren` returns a fresh array every call, and the
  // list and its `SortableContext` must read one.
  const entries = sectionEntries(hierarchyRows(card.id, getAttachedChildren), Infinity);

  return (
    <ModalShell
      // Escape, the X and a click outside close it only with no drag running: Escape during a
      // drag cancels the drag and leaves the modal open.
      onClose={() => {
        if (!session) onClose();
      }}
      ariaLabel={`Hierarchy of ${card.title}`}
      title={card.title}
      subtitle="Hierarchy"
      maxWidth="max-w-xl"
      maxHeight="max-h-[80vh]"
      showCloseButton
    >
      <div
        {...dragRegionProps(descendantsRegionKey(card.id), cardRegionKey(card.id))}
        className="min-h-0 flex-1 space-y-1 overflow-y-auto py-3"
      >
        <SortableContext items={entries.map(e => e.row.id)} strategy={verticalListSortingStrategy}>
          <SectionRows
            entries={entries}
            cardId={card.id}
            itemTypes={itemTypes}
            projection={session && contextLayer === 'descendants' ? session.projection : null}
            activeId={session?.activeItem.id}
          />
        </SortableContext>
      </div>
    </ModalShell>
  );
}
