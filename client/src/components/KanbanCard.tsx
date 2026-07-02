import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ItemType, WorkItem } from '../types';

const PILL_BASE = 'inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border';

function depthLabel(depth: number): string {
  return depth === 0 ? 'TOP' : `SUB${depth}`;
}

function typePillProps(typeId: string | null, itemTypes: ItemType[]): { className: string; style?: React.CSSProperties; label: string } | null {
  if (!typeId) return null;
  const t = itemTypes.find(x => x.id === typeId);
  if (!t) return null;
  if (t.color) {
    return {
      className: PILL_BASE,
      style: { backgroundColor: t.color + '33', borderColor: t.color + '66', color: t.color },
      label: t.name,
    };
  }
  return {
    className: `${PILL_BASE} bg-zinc-500/20 text-zinc-300 border-zinc-500/30`,
    label: t.name,
  };
}

interface KanbanCardProps {
  item: WorkItem;
  itemTypes?: ItemType[];
  childCount?: number;
  isOverlay?: boolean;
  onCardClick?: (id: string) => void;
}

export default function KanbanCard({ item, itemTypes = [], childCount = 0, isOverlay = false, onCardClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { type: 'card' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const depth = item.depth ?? 0;
  const typePill = typePillProps(item.type, itemTypes);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="article"
      aria-label={item.title}
      onClick={() => !isDragging && onCardClick?.(item.id)}
      className={`
        rounded-lg border border-zinc-700/50 bg-zinc-800 p-3
        cursor-grab active:cursor-grabbing
        hover:border-zinc-600 hover:bg-zinc-750
        transition-colors duration-150
        ${isDragging ? 'opacity-30' : ''}
        ${isOverlay ? 'shadow-2xl shadow-black/50 rotate-2' : ''}
      `}
    >
      {/* Depth + type pills */}
      <div className="flex items-center gap-1 mb-2">
        <span className={`${PILL_BASE} bg-zinc-500/20 text-zinc-400 border-zinc-500/30`}>
          {depthLabel(depth)}
        </span>
        {typePill && (
          <span className={typePill.className} style={typePill.style}>
            {typePill.label}
          </span>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-zinc-100 leading-snug">
        {item.title}
      </p>

      {/* Description preview */}
      {item.description && (
        <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
          {item.description}
        </p>
      )}

      {/* Footer */}
      {(item.assigneeType || childCount > 0) && (
        <div className="mt-2 flex items-center gap-2">
          {childCount > 0 && (
            <span className="text-[11px] text-zinc-500 flex items-center gap-0.5">
              ↳ {childCount}
            </span>
          )}
          {item.assigneeType && (
            <div className="flex items-center gap-1">
              <span className={`
                w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${item.assigneeType === 'agent'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-cyan-500/20 text-cyan-300'
                }
              `}>
                {item.assigneeType === 'agent' ? 'A' : 'H'}
              </span>
              <span className="text-[11px] text-zinc-500">
                {item.assigneeType === 'agent' ? 'Agent' : 'Human'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
