import { useState } from 'react';
import type { Item, ItemDetail, ItemType } from '../../types';
import { createItem } from '../../api';
import { MINI_DEPTH, depthLabel, typePillClass, typePillStyle, SECTION_LABEL, SELECT_BASE, BTN_PRIMARY, BTN_CANCEL, BTN_ADD_TRIGGER, EMPTY_STATE } from './pillUtils';

interface ChildrenSectionProps {
  item: ItemDetail;
  childDefaultWorkphaseId: string | null | undefined;
  itemTypes: ItemType[];
  onNavigate: (id: string) => void;
  onChildCreated: (child: Item) => void;
}

export function ChildrenSection({ item, childDefaultWorkphaseId, itemTypes, onNavigate, onChildCreated }: ChildrenSectionProps) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [saving, setSaving] = useState(false);

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

  return (
    <div>
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
            <button
              key={child.id}
              onClick={() => onNavigate(child.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-zinc-800"
            >
              <span className={MINI_DEPTH}>{depthLabel(child.depth ?? (item.depth ?? 0) + 1)}</span>
              {child.type && (
                <span className={typePillClass(child.type, itemTypes, true)} style={typePillStyle(child.type, itemTypes)}>
                  {itemTypes.find(x => x.id === child.type)?.name ?? child.type}
                </span>
              )}
              <span className="truncate text-xs text-zinc-300">{child.title}</span>
            </button>
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
