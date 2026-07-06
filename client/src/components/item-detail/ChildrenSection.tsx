import { useState } from 'react';
import type { Item, ItemDetail, ItemType } from '../../types';
import { createItem } from '../../api';
import { MINI_DEPTH, depthLabel, typePillClass, typePillStyle } from './pillUtils';

interface ChildrenSectionProps {
  item: ItemDetail;
  childDefaultColumnId: string | null | undefined;
  itemTypes: ItemType[];
  onNavigate: (id: string) => void;
  onChildCreated: (child: Item) => void;
}

export function ChildrenSection({ item, childDefaultColumnId, itemTypes, onNavigate, onChildCreated }: ChildrenSectionProps) {
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
        columnId: childDefaultColumnId ?? item.columnId ?? undefined,
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
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Children {item.children.length > 0 && `(${item.children.length})`}
        </p>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">
            + Add
          </button>
        )}
      </div>

      {item.children.length > 0 && (
        <div className="space-y-1 mb-2">
          {item.children.map(child => (
            <button
              key={child.id}
              onClick={() => onNavigate(child.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-left"
            >
              <span className={MINI_DEPTH}>{depthLabel(child.depth ?? (item.depth ?? 0) + 1)}</span>
              {child.type && (
                <span className={typePillClass(child.type, itemTypes, true)} style={typePillStyle(child.type, itemTypes)}>
                  {itemTypes.find(x => x.id === child.type)?.name ?? child.type}
                </span>
              )}
              <span className="text-xs text-zinc-300 truncate">{child.title}</span>
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
            className="w-full px-3 py-2 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/60"
            onKeyDown={e => { if (e.key === 'Escape') { setAdding(false); setTitle(''); } }}
          />
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="px-2 py-1 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none"
            >
              <option value="">No Type</option>
              {itemTypes.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button type="submit" disabled={saving} className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50">
              Add
            </button>
            <button type="button" onClick={() => { setAdding(false); setTitle(''); }} className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200">
              Cancel
            </button>
          </div>
        </form>
      )}

      {item.children.length === 0 && !adding && (
        <p className="text-xs text-zinc-600">No children yet.</p>
      )}
    </div>
  );
}
