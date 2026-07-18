import { useState } from 'react';
import type { WorkPhase, Column, ColumnDisplayMode } from '../types';
import ModalShell from './ModalShell';
import { INPUT_LG } from './item-detail/pillUtils';

interface ColumnEditorModalProps {
  workphases: WorkPhase[]; // ordered by position
  column?: Column; // editing an existing column; omitted = creating a new one
  onSubmit: (data: {
    startWorkphaseId: string;
    endWorkphaseId: string;
    displayMode: ColumnDisplayMode;
    name: string | null;
  }) => Promise<boolean>;
  onClose: () => void;
  error: string;
}

export default function ColumnEditorModal({ workphases, column, onSubmit, onClose, error }: ColumnEditorModalProps) {
  const [startWorkphaseId, setStartWorkphaseId] = useState(column?.startWorkphaseId ?? workphases[0]?.id ?? '');
  const [endWorkphaseId, setEndWorkphaseId] = useState(column?.endWorkphaseId ?? workphases[0]?.id ?? '');
  const [displayMode, setDisplayMode] = useState<ColumnDisplayMode>(column?.displayMode ?? 'merged');
  const [name, setName] = useState(column?.name ?? '');
  const [saving, setSaving] = useState(false);

  const startIndex = workphases.findIndex(w => w.id === startWorkphaseId);
  const endOptions = startIndex === -1 ? workphases : workphases.slice(startIndex);
  const covered = startIndex === -1
    ? []
    : workphases.slice(startIndex, workphases.findIndex(w => w.id === endWorkphaseId) + 1 || startIndex + 1);

  function handleStartChange(id: string) {
    setStartWorkphaseId(id);
    const newStartIndex = workphases.findIndex(w => w.id === id);
    const currentEndIndex = workphases.findIndex(w => w.id === endWorkphaseId);
    if (currentEndIndex < newStartIndex) setEndWorkphaseId(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startWorkphaseId || !endWorkphaseId) return;
    setSaving(true);
    try {
      const ok = await onSubmit({
        startWorkphaseId,
        endWorkphaseId,
        displayMode,
        name: name.trim() || null,
      });
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      onClose={onClose}
      ariaLabel={column ? 'Edit column' : 'Add column'}
      title={column ? 'Edit column' : 'Add column'}
      subtitle="Choose the range of workphases this column covers."
      maxWidth="max-w-sm"
    >
      <form onSubmit={handleSubmit}>
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">From</label>
              <select
                value={startWorkphaseId}
                onChange={e => handleStartChange(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                {workphases.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">To</label>
              <select
                value={endWorkphaseId}
                onChange={e => setEndWorkphaseId(e.target.value)}
                className="w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-zinc-200 focus:outline-none focus:border-blue-500/50"
              >
                {endOptions.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Covers: <span className="text-zinc-300">{covered.map(w => w.name).join(', ') || '—'}</span>
          </p>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">Display mode</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDisplayMode('merged')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  displayMode === 'merged'
                    ? 'border-blue-500/60 bg-blue-500/10 text-blue-300'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                Merged
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('expanded')}
                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  displayMode === 'expanded'
                    ? 'border-blue-500/60 bg-blue-500/10 text-blue-300'
                    : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                Expanded
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">Name (optional)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={covered.length === 1 ? covered[0].name : covered.map(w => w.name).join(' – ')}
              className={`w-full ${INPUT_LG}`}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !startWorkphaseId || !endWorkphaseId}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {column ? 'Save' : 'Add column'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
