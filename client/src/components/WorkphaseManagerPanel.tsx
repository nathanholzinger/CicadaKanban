import { useState } from 'react';
import type { WorkPhase } from '../types';
import { BTN_PRIMARY, BTN_CANCEL, INPUT_LG } from './item-detail/pillUtils';

interface WorkphaseManagerPanelProps {
  workphases: WorkPhase[];
  notice: string;
  addingWorkphase: boolean;
  setAddingWorkphase: (v: boolean) => void;
  newWorkphaseName: string;
  setNewWorkphaseName: (v: string) => void;
  onCreate: () => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function WorkphaseManagerPanel({
  workphases, notice, addingWorkphase, setAddingWorkphase,
  newWorkphaseName, setNewWorkphaseName, onCreate, onRename, onDelete,
}: WorkphaseManagerPanelProps) {
  return (
    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-3 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">Workphases</p>
      {notice && <p className="text-[11px] text-amber-400">{notice}</p>}
      <ul className="space-y-1">
        {workphases.map(w => (
          <WorkphaseManagerRow
            key={w.id}
            workphase={w}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </ul>
      {addingWorkphase ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            value={newWorkphaseName}
            onChange={e => setNewWorkphaseName(e.target.value)}
            placeholder="Workphase name..."
            aria-label="Workphase name"
            className={INPUT_LG}
            onKeyDown={e => {
              if (e.key === 'Enter') onCreate();
              if (e.key === 'Escape') { setAddingWorkphase(false); setNewWorkphaseName(''); }
            }}
          />
          <button onClick={onCreate} className={BTN_PRIMARY}>Add workphase</button>
          <button onClick={() => { setAddingWorkphase(false); setNewWorkphaseName(''); }} className={BTN_CANCEL}>Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingWorkphase(true)}
          className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40 border border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
        >
          + Add workphase
        </button>
      )}
    </div>
  );
}

function WorkphaseManagerRow({
  workphase, onRename, onDelete,
}: {
  workphase: WorkPhase;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draft, setDraft] = useState(workphase.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  async function handleBlur() {
    const trimmed = draft.trim();
    setIsRenaming(false);
    if (!trimmed || trimmed === workphase.name) return;
    await onRename(workphase.id, trimmed);
  }

  async function handleDelete() {
    setError('');
    try {
      await onDelete(workphase.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workphase.');
      setConfirmDelete(false);
    }
  }

  return (
    <li className="flex items-center gap-2 text-sm">
      {isRenaming ? (
        <input
          autoFocus
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            if (e.key === 'Escape') setIsRenaming(false);
          }}
          className="flex-1 bg-zinc-800 border border-zinc-600 rounded px-2 py-0.5 text-zinc-100 focus:outline-none focus:border-blue-500/60"
        />
      ) : (
        <span
          onClick={() => { setDraft(workphase.name); setIsRenaming(true); }}
          className="flex-1 text-zinc-300 cursor-text hover:text-zinc-100"
        >
          {workphase.name}
        </span>
      )}

      {confirmDelete ? (
        <>
          <button onClick={handleDelete} className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded bg-red-500/10">Delete</button>
          <button onClick={() => setConfirmDelete(false)} className="text-[10px] text-zinc-500 hover:text-zinc-300">Cancel</button>
        </>
      ) : (
        <button onClick={() => setConfirmDelete(true)} className="text-zinc-600 hover:text-red-400 transition-colors" title="Delete workphase">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
      {error && <p className="text-[10px] text-red-400 basis-full">{error}</p>}
    </li>
  );
}
