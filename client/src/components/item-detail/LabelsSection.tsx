import { useEffect, useState } from 'react';
import type { Label } from '../../types';
import { fetchLabels, fetchItemLabels, addLabelToItem, removeLabelFromItem, createLabel } from '../../api';
import { SECTION_LABEL, INPUT_BASE, BTN_PRIMARY, BTN_CANCEL, BTN_ADD_TRIGGER, EMPTY_STATE } from './pillUtils';

interface LabelsSectionProps {
  itemId: string;
  projectId: string | null;
}

export function LabelsSection({ itemId, projectId }: LabelsSectionProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [itemLabelIds, setItemLabelIds] = useState<Set<string>>(new Set());
  const [addingLabel, setAddingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#6366f1');

  useEffect(() => {
    if (!projectId) return;
    Promise.all([fetchLabels(), fetchItemLabels(itemId)]).then(([all, mine]) => {
      setLabels(all);
      setItemLabelIds(new Set(mine.map(l => l.id)));
    }).catch(() => {});
  }, [itemId, projectId]);

  async function handleToggle(labelId: string) {
    if (itemLabelIds.has(labelId)) {
      await removeLabelFromItem(itemId, labelId);
      setItemLabelIds(prev => { const s = new Set(prev); s.delete(labelId); return s; });
    } else {
      await addLabelToItem(itemId, labelId);
      setItemLabelIds(prev => new Set([...prev, labelId]));
    }
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    const label = await createLabel({ name: newLabelName.trim(), color: newLabelColor });
    setLabels(prev => [...prev, label]);
    await addLabelToItem(itemId, label.id);
    setItemLabelIds(prev => new Set([...prev, label.id]));
    setNewLabelName('');
    setAddingLabel(false);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className={SECTION_LABEL}>Labels</p>
        {!addingLabel && (
          <button onClick={() => setAddingLabel(true)} className={BTN_ADD_TRIGGER}>
            + New
          </button>
        )}
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {labels.map(label => (
          <button
            key={label.id}
            onClick={() => handleToggle(label.id)}
            className={`border px-2 py-0.5 rounded-full text-[11px] font-medium transition-opacity ${itemLabelIds.has(label.id) ? 'opacity-100' : 'opacity-35 hover:opacity-60'}`}
            style={{ backgroundColor: label.color + '33', borderColor: label.color + '66', color: label.color }}
          >
            {label.name}
          </button>
        ))}
        {labels.length === 0 && !addingLabel && (
          <p className={EMPTY_STATE}>No labels yet.</p>
        )}
      </div>

      {addingLabel && (
        <form onSubmit={handleCreate} className="space-y-2">
          <div className="flex gap-2">
            <input
              autoFocus
              value={newLabelName}
              onChange={e => setNewLabelName(e.target.value)}
              placeholder="Label name..."
              className={`flex-1 ${INPUT_BASE}`}
              onKeyDown={e => { if (e.key === 'Escape') { setAddingLabel(false); setNewLabelName(''); } }}
            />
            <input
              type="color"
              value={newLabelColor}
              onChange={e => setNewLabelColor(e.target.value)}
              className="h-7 w-8 cursor-pointer rounded border border-zinc-700 bg-zinc-800 p-0.5"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className={BTN_PRIMARY}>Create</button>
            <button type="button" onClick={() => { setAddingLabel(false); setNewLabelName(''); }} className={BTN_CANCEL}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
