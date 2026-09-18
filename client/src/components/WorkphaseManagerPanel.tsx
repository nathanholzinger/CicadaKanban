// Workphase rename/delete/add rows + column-shrink notices.

import { useState } from 'react';
import type { Workphase } from '../types';
import { BTN_PRIMARY, BTN_CANCEL, INPUT_LG } from './item-detail/pillUtils';
import ConfirmDeleteButton from './ConfirmDeleteButton';

interface WorkphaseManagerPanelProps {
  workphases: Workphase[];
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
  workphases,
  notice,
  addingWorkphase,
  setAddingWorkphase,
  newWorkphaseName,
  setNewWorkphaseName,
  onCreate,
  onRename,
  onDelete,
}: WorkphaseManagerPanelProps) {
  return (
    <div className="space-y-2 rounded-xl border border-zinc-700 bg-zinc-800/50 p-3">
      <p className="text-[11px] font-semibold tracking-widest text-zinc-500 uppercase">Workphases</p>
      {notice && <p className="text-[11px] text-amber-400">{notice}</p>}
      <ul className="space-y-1">
        {workphases.map(w => (
          <WorkphaseManagerRow key={w.id} workphase={w} onRename={onRename} onDelete={onDelete} />
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
              if (e.key === 'Escape') {
                setAddingWorkphase(false);
                setNewWorkphaseName('');
              }
            }}
          />
          <button onClick={onCreate} className={BTN_PRIMARY}>
            Add workphase
          </button>
          <button
            onClick={() => {
              setAddingWorkphase(false);
              setNewWorkphaseName('');
            }}
            className={BTN_CANCEL}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingWorkphase(true)}
          className="w-full rounded-lg border border-dashed border-zinc-700 py-2 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:bg-zinc-800/40 hover:text-zinc-300"
        >
          + Add workphase
        </button>
      )}
    </div>
  );
}

function WorkphaseManagerRow({
  workphase,
  onRename,
  onDelete,
}: {
  workphase: Workphase;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [draft, setDraft] = useState(workphase.name);

  async function handleBlur() {
    const trimmed = draft.trim();
    setIsRenaming(false);
    if (!trimmed || trimmed === workphase.name) return;
    await onRename(workphase.id, trimmed);
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
          className="flex-1 rounded border border-zinc-600 bg-zinc-800 px-2 py-0.5 text-zinc-100 focus:border-blue-500/60 focus:outline-none"
        />
      ) : (
        <span
          onClick={() => {
            setDraft(workphase.name);
            setIsRenaming(true);
          }}
          className="flex-1 cursor-text text-zinc-300 hover:text-zinc-100"
        >
          {workphase.name}
        </span>
      )}

      <ConfirmDeleteButton
        onDelete={() => onDelete(workphase.id)}
        title="Delete workphase"
        errorFallback="Failed to delete workphase."
      />
    </li>
  );
}
