import { useState } from 'react';
import type { Item, ItemDetail, ItemType } from '../../types';
import { createItem, updateItem } from '../../api';
import { buildParentOptions as buildTreeParentOptions } from '../../lib/hierarchy';
import { MINI_DEPTH, depthLabel, typePillClass, typePillStyle, SECTION_LABEL, SELECT_BASE, BTN_PRIMARY, BTN_CANCEL, BTN_ADD_TRIGGER, EMPTY_STATE } from './pillUtils';

interface ChildrenSectionProps {
  item: ItemDetail;
  allItems: Item[];
  childDefaultWorkphaseId: string | null | undefined;
  itemTypes: ItemType[];
  onNavigate: (id: string) => void;
  onChildCreated: (child: Item) => void;
  onSelfUpdated: (updated: Item) => void;
  onChildUpdated: (updated: Item) => void;
}

// Candidate reparent targets: items in the same project, excluding the item
// itself and any of its own descendants — shared cycle-prevention math with
// the project hierarchy via lib/hierarchy.
function buildParentOptions(allItems: Item[], currentId: string, projectId: string | null): Array<{ value: string; label: string }> {
  const scoped = allItems.filter(i => i.projectId === projectId);
  return buildTreeParentOptions(scoped, currentId, i => i.title, '(none — top level)');
}

export function ChildrenSection({
  item, allItems, childDefaultWorkphaseId, itemTypes, onNavigate, onChildCreated, onSelfUpdated, onChildUpdated,
}: ChildrenSectionProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [saving, setSaving] = useState(false);
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

  async function handleChildAttachedToggle(child: Item, attached: boolean) {
    try {
      const updated = await updateItem(child.id, { isAttached: attached });
      onChildUpdated(updated);
    } catch (err) {
      console.error('Failed to update child attach state:', err);
    }
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const child = await createItem({
        type: type || null,
        title: title.trim(),
        parentId: item.id,
        projectId: item.projectId ?? undefined,
        workphaseId: childDefaultWorkphaseId ?? item.workphaseId ?? undefined,
      });
      onChildCreated(child);
      setTitle('');
      setAdding(false);
    } catch (err) {
      console.error('Failed to create child:', err);
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = buildParentOptions(allItems, item.id, item.projectId);

  return (
    <div>
      <div className="mb-3">
        <p className={`${SECTION_LABEL} mb-1.5`}>Parent</p>
        <div className="flex items-center gap-2">
          <select
            value={item.parentId ?? ''}
            onChange={handleParentChange}
            disabled={savingParent}
            aria-label="Parent item"
            className={`${SELECT_BASE} flex-1`}
          >
            {parentOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {item.parentId && (
            <label className="flex items-center gap-1 text-xs text-zinc-400 cursor-pointer shrink-0">
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
      </div>

      <div className="mb-1.5 flex items-center justify-between">
        <p className={SECTION_LABEL}>
          Children {item.children.length > 0 && `(${item.children.length})`}
        </p>
        {!adding && (
          <button onClick={() => setAdding(true)} className={BTN_ADD_TRIGGER}>
            + Add
          </button>
        )}
      </div>

      {item.children.length > 0 && (
        <div className="mb-2 space-y-1">
          {item.children.map(child => (
            <div
              key={child.id}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-800"
            >
              <button
                onClick={() => onNavigate(child.id)}
                className="flex flex-1 min-w-0 items-center gap-2 text-left"
              >
                <span className={MINI_DEPTH}>{depthLabel(child.depth ?? (item.depth ?? 0) + 1)}</span>
                {child.type && (
                  <span className={typePillClass(child.type, itemTypes, true)} style={typePillStyle(child.type, itemTypes)}>
                    {itemTypes.find(x => x.id === child.type)?.name ?? child.type}
                  </span>
                )}
                <span className="truncate text-xs text-zinc-300">{child.title}</span>
              </button>
              <button
                onClick={() => handleChildAttachedToggle(child, !child.isAttached)}
                className={`shrink-0 text-2xs px-1.5 py-0.5 rounded border transition-colors ${
                  child.isAttached
                    ? 'text-blue-300 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20'
                    : 'text-zinc-500 border-zinc-700 hover:text-zinc-300'
                }`}
                title={child.isAttached ? 'Attached — moves with this item. Click to detach.' : 'Detached — stays put. Click to attach.'}
              >
                {child.isAttached ? 'Attached' : 'Detached'}
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <form onSubmit={handleCreate} className="space-y-2">
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Child title..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
            onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setTitle(''); } }}
          />
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className={SELECT_BASE}
            >
              <option value="">No Type</option>
              {itemTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button type="submit" disabled={saving} className={`${BTN_PRIMARY} disabled:opacity-50`}>
              Add
            </button>
            <button type="button" onClick={() => { setAdding(false); setTitle(''); }} className={BTN_CANCEL}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {item.children.length === 0 && !adding && (
        <p className={EMPTY_STATE}>No children yet.</p>
      )}
    </div>
  );
}
