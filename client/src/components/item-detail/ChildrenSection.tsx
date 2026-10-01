import { useState } from 'react';
import type { Item, ItemDetail, ItemType } from '../../types';
import { createItem, updateItem } from '../../api/items';
import { MINI_DEPTH, depthLabel, typePillClass, typePillStyle, EMPTY_STATE } from './pillUtils';
import { DetailSection } from './DetailSection';
import InlineItemForm from '../InlineItemForm';

interface ChildrenSectionProps {
  item: ItemDetail;
  itemTypes: ItemType[];
  onNavigate: (id: string) => void;
  onChildCreated: (child: Item) => void;
  onChildUpdated: (updated: Item) => void;
}

function attachToggleClass(isAttached: boolean): string {
  const base = 'shrink-0 text-2xs px-1.5 py-0.5 rounded border transition-colors';
  if (isAttached) return `${base} text-blue-300 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20`;
  return `${base} text-zinc-500 border-zinc-700 hover:text-zinc-300`;
}

// Lists this item's children and handles creating new ones plus toggling
// each child's attach state. Editing the current item's *own* parent link
// lives in the sibling ParentSection — a different concern with no shared
// state.
export function ChildrenSection({ item, itemTypes, onNavigate, onChildCreated, onChildUpdated }: ChildrenSectionProps) {
  const [adding, setAdding] = useState(false);
  const [childError, setChildError] = useState('');

  async function handleChildAttachedToggle(child: Item, attached: boolean) {
    setChildError('');
    try {
      const updated = await updateItem(child.id, { isAttached: attached });
      onChildUpdated(updated);
    } catch (err) {
      setChildError(err instanceof Error ? err.message : 'Failed to update attach state');
    }
  }

  async function handleCreate(title: string, type: string | null): Promise<boolean> {
    try {
      // An attached child takes its parent's workphase, and naming another is
      // refused (wiki item-attachment §2a), so the create names none.
      const child = await createItem({ type, title, parentId: item.id, projectId: item.projectId ?? undefined });
      onChildCreated(child);
      return true;
    } catch (err) {
      console.error('Failed to create child:', err);
      return false;
    }
  }

  return (
    <DetailSection
      label={<>Children {item.children.length > 0 && `(${item.children.length})`}</>}
      onAdd={adding ? undefined : () => setAdding(true)}
    >
      {item.children.length > 0 && (
        <div className="mb-2 space-y-1">
          {item.children.map(child => (
            <div
              key={child.id}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800"
            >
              <button onClick={() => onNavigate(child.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <span className={MINI_DEPTH}>{depthLabel(child.depth ?? (item.depth ?? 0) + 1)}</span>
                {child.type && (
                  <span
                    className={typePillClass(child.type, itemTypes, true)}
                    style={typePillStyle(child.type, itemTypes)}
                  >
                    {itemTypes.find(x => x.id === child.type)?.name ?? child.type}
                  </span>
                )}
                <span className="truncate text-xs text-zinc-300">{child.title}</span>
              </button>
              <button
                onClick={() => handleChildAttachedToggle(child, !child.isAttached)}
                className={attachToggleClass(Boolean(child.isAttached))}
                title={
                  child.isAttached
                    ? 'Attached — moves with this item. Click to detach.'
                    : 'Detached — stays put. Click to attach.'
                }
              >
                {child.isAttached ? 'Attached' : 'Detached'}
              </button>
            </div>
          ))}
        </div>
      )}
      {childError && <p className="mb-2 text-xs text-red-400">{childError}</p>}

      {adding && (
        <InlineItemForm
          itemTypes={itemTypes}
          placeholder="Child title..."
          onSubmit={handleCreate}
          onDone={() => setAdding(false)}
          onCancel={() => setAdding(false)}
        />
      )}

      {item.children.length === 0 && !adding && <p className={EMPTY_STATE}>No children yet.</p>}
    </DetailSection>
  );
}
