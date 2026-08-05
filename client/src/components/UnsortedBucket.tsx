import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Item, ItemType, WorkPhase } from '../types';
import KanbanCard from './KanbanCard';
import { COUNT_BADGE, AttentionBadge } from './boardBadges';

interface UnsortedBucketProps {
  uncoveredWorkphases: WorkPhase[];
  invalidItems: Item[];
  getWorkphaseItems: (workphaseId: string) => Item[];
  needsAttention: boolean;
  itemTypes: ItemType[];
  childCounts: Record<string, number>;
  getAttachedChildren: (parentId: string) => Item[];
  defaultExpanded: boolean;
  filterProjectId?: string;
  onCardClick: (id: string) => void;
}

export default function UnsortedBucket({
  uncoveredWorkphases, invalidItems, getWorkphaseItems, needsAttention, itemTypes, childCounts,
  getAttachedChildren, defaultExpanded, filterProjectId, onCardClick,
}: UnsortedBucketProps) {
  const groups = uncoveredWorkphases.map(w => ({ workphase: w, items: getWorkphaseItems(w.id) }));
  // Items whose workphase is null or outside this workflow. Attached children
  // nest under their (also-Unknown) parent rather than showing top-level.
  const unknownItems = invalidItems.filter(
    i => !(i.isAttached && i.parentId) && (!filterProjectId || i.projectId === filterProjectId),
  );
  const totalItems = groups.reduce((n, g) => n + g.items.length, 0) + unknownItems.length;

  if (totalItems === 0 && !needsAttention) return null;

  return (
    <div role="group" aria-label="Unsorted" className="flex flex-col w-72 shrink-0 border-2 border-dashed border-zinc-700/60 rounded-xl">
      <div className="flex items-center gap-1.5 px-2 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-zinc-400 tracking-wide">Unsorted</h3>
        <span className={COUNT_BADGE}>{totalItems}</span>
        {needsAttention && (
          <AttentionBadge title="Some workphases in this workflow aren't covered by any column on this board yet">
            needs attention
          </AttentionBadge>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-2 p-2 min-h-[120px] overflow-y-auto">
        {groups.map(({ workphase, items }) => (
          <div key={workphase.id}>
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <span className="text-[11px] font-medium text-zinc-500 truncate">{workphase.name}</span>
              <span className="text-[10px] text-zinc-600">{items.length}</span>
            </div>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1.5">
                {items.map(item => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    itemTypes={itemTypes}
                    childCount={childCounts[item.id] ?? 0}
                    getAttachedChildren={getAttachedChildren}
                    defaultExpanded={defaultExpanded}
                    onCardClick={onCardClick}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        ))}

        {unknownItems.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <span
                className="text-[11px] font-medium text-amber-400/80"
                title="These items' workphase no longer belongs to this workflow — reassign a status to file them"
              >
                Unknown status
              </span>
              <span className="text-[10px] text-zinc-600">{unknownItems.length}</span>
            </div>
            <SortableContext items={unknownItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1.5">
                {unknownItems.map(item => (
                  <KanbanCard
                    key={item.id}
                    item={item}
                    itemTypes={itemTypes}
                    childCount={childCounts[item.id] ?? 0}
                    getAttachedChildren={getAttachedChildren}
                    defaultExpanded={defaultExpanded}
                    onCardClick={onCardClick}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        )}

        {totalItems === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-zinc-600">No uncovered items</p>
          </div>
        )}
      </div>
    </div>
  );
}
