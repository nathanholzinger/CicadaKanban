import type { Item, ItemType, WorkPhase } from '../types';
import { COUNT_BADGE, AttentionBadge } from './boardBadges';
import WorkphaseCardList from './WorkphaseCardList';

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
          <WorkphaseCardList
            key={workphase.id}
            label={workphase.name}
            items={items}
            itemTypes={itemTypes}
            childCounts={childCounts}
            getAttachedChildren={getAttachedChildren}
            defaultExpanded={defaultExpanded}
            onCardClick={onCardClick}
          />
        ))}

        {unknownItems.length > 0 && (
          <WorkphaseCardList
            label="Unknown status"
            labelClassName="text-[11px] font-medium text-amber-400/80"
            labelTitle="These items' workphase no longer belongs to this workflow — reassign a status to file them"
            items={unknownItems}
            itemTypes={itemTypes}
            childCounts={childCounts}
            getAttachedChildren={getAttachedChildren}
            defaultExpanded={defaultExpanded}
            onCardClick={onCardClick}
          />
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
