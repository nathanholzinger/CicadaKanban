import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Item, ItemType } from '../types';

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
  item: Item;
  itemTypes?: ItemType[];
  childCount?: number;
  getAttachedChildren?: (parentId: string) => Item[];
  defaultExpanded?: boolean;
  isOverlay?: boolean;
  onCardClick?: (id: string) => void;
}

export default function KanbanCard({
  item, itemTypes = [], childCount = 0, getAttachedChildren, defaultExpanded = true, isOverlay = false, onCardClick,
}: KanbanCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
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
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
              onPointerDown={e => e.stopPropagation()}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5"
              title={expanded ? 'Hide attached children' : 'Show attached children'}
            >
              {childCount} child{childCount === 1 ? '' : 'ren'} {expanded ? '▾' : '▸'}
            </button>
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

      {/* Attached children, indented — read-only rows, click opens that child */}
      {expanded && childCount > 0 && getAttachedChildren && (
        <div className="mt-2 pl-3 border-l border-zinc-700/50 space-y-1">
          {getAttachedChildren(item.id).map(child => (
            <AttachedChildRow
              key={child.id}
              item={child}
              itemTypes={itemTypes}
              getAttachedChildren={getAttachedChildren}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AttachedChildRowProps {
  item: Item;
  itemTypes: ItemType[];
  getAttachedChildren: (parentId: string) => Item[];
  onCardClick?: (id: string) => void;
}

function AttachedChildRow({ item, itemTypes, getAttachedChildren, onCardClick }: AttachedChildRowProps) {
  const typePill = typePillProps(item.type, itemTypes);
  const grandchildren = getAttachedChildren(item.id);

  return (
    <div>
      <button
        type="button"
        onClick={e => { e.stopPropagation(); onCardClick?.(item.id); }}
        onPointerDown={e => e.stopPropagation()}
        className="w-full flex items-center gap-1.5 text-left px-1.5 py-1 rounded hover:bg-zinc-700/40 transition-colors"
      >
        {typePill && (
          <span className={typePill.className} style={typePill.style}>
            {typePill.label}
          </span>
        )}
        <span className="text-xs text-zinc-300 truncate">{item.title}</span>
      </button>
      {grandchildren.length > 0 && (
        <div className="pl-3 border-l border-zinc-700/50 space-y-1">
          {grandchildren.map(child => (
            <AttachedChildRow
              key={child.id}
              item={child}
              itemTypes={itemTypes}
              getAttachedChildren={getAttachedChildren}
              onCardClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
