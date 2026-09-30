import { useState } from 'react';
import type { Item, ItemDetail } from '../../types';
import { updateItem } from '../../api/items';
import { buildParentOptions as buildTreeParentOptions } from '../../lib/hierarchy';
import type { SelectOption } from '../../lib/hierarchy';
import { SELECT_BASE } from './pillUtils';
import { DetailSection } from './DetailSection';

interface ParentSectionProps {
  item: ItemDetail;
  allItems: Item[];
  onSelfUpdated: (updated: Item) => void;
}

// Candidate reparent targets: items in the same project, excluding the item
// itself and any of its own descendants — shared cycle-prevention math with
// the project hierarchy via lib/hierarchy.
function buildParentOptions(allItems: Item[], currentId: string, projectId: string | null): SelectOption[] {
  const scoped = allItems.filter(i => i.projectId === projectId);
  return buildTreeParentOptions(scoped, currentId, i => i.title, '(none — top level)');
}

// Editing surface for the current item's own parent link — which item is its
// parent, and whether it's attached (moves with the parent) or detached
// (independent position). Separate from ChildrenSection, which lists/creates
// this item's children — a different concern with no shared state.
export function ParentSection({ item, allItems, onSelfUpdated }: ParentSectionProps) {
  const [savingParent, setSavingParent] = useState(false);
  const [parentError, setParentError] = useState('');

  async function handleParentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const parentId = e.target.value || null;
    setSavingParent(true);
    setParentError('');
    try {
      const updated = await updateItem(item.id, { parentId });
      onSelfUpdated(updated);
    } catch (err) {
      setParentError(err instanceof Error ? err.message : 'Failed to reparent item');
    } finally {
      setSavingParent(false);
    }
  }

  async function handleAttachedToggle(e: React.ChangeEvent<HTMLInputElement>) {
    setSavingParent(true);
    setParentError('');
    try {
      const updated = await updateItem(item.id, { isAttached: e.target.checked });
      onSelfUpdated(updated);
    } catch (err) {
      setParentError(err instanceof Error ? err.message : 'Failed to update attach state');
    } finally {
      setSavingParent(false);
    }
  }

  const parentOptions = buildParentOptions(allItems, item.id, item.projectId);

  return (
    <DetailSection label="Parent">
      <div className="flex items-center gap-2">
        <select
          value={item.parentId ?? ''}
          onChange={handleParentChange}
          disabled={savingParent}
          aria-label="Parent item"
          className={`${SELECT_BASE} flex-1`}
        >
          {parentOptions.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {item.parentId && (
          <label className="flex shrink-0 cursor-pointer items-center gap-1 text-xs text-zinc-400">
            <input
              type="checkbox"
              checked={Boolean(item.isAttached)}
              onChange={handleAttachedToggle}
              disabled={savingParent}
              className="accent-blue-500"
            />
            Attached
          </label>
        )}
      </div>
      {parentError && <p className="mt-1 text-xs text-red-400">{parentError}</p>}
    </DetailSection>
  );
}
