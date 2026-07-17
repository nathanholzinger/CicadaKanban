import { useState } from 'react';
import type { Board, WorkPhase } from '../types';
import { BTN_PRIMARY, BTN_CANCEL } from './item-detail/pillUtils';

interface BoardToolbarProps {
  boards: Board[];
  activeBoardId: string | null;
  setActiveBoardId: (id: string) => void;
  readOnly?: boolean;
  handleCreateBoard: (name: string) => Promise<Board>;
  handleRenameBoard: (id: string, name: string) => Promise<void>;
  handleDeleteBoard: (id: string) => Promise<void>;
  handleToggleShowAttachedChildren: (id: string, show: boolean) => Promise<Board>;
  onAddColumn: () => void;
  onToggleWorkphaseManager: () => void;
  childDefaultWorkphaseId: string | null;
  onChildWorkphaseChange: (workphaseId: string | null) => void;
  workphases: WorkPhase[];
}

// Board switcher + board CRUD, column/workphase-manager entry points, and the
// default-workphase-for-new-child-items setting. Owns its own board
// create/rename form state — callers only need the board list and the
// underlying API handlers.
export default function BoardToolbar({
  boards, activeBoardId, setActiveBoardId, readOnly,
  handleCreateBoard, handleRenameBoard, handleDeleteBoard, handleToggleShowAttachedChildren,
  onAddColumn, onToggleWorkphaseManager,
  childDefaultWorkphaseId, onChildWorkphaseChange, workphases,
}: BoardToolbarProps) {
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [boardActionError, setBoardActionError] = useState('');
  const [renamingBoard, setRenamingBoard] = useState(false);
  const [boardNameDraft, setBoardNameDraft] = useState('');
  const activeBoard = boards.find(b => b.id === activeBoardId);

  async function submitToggleShowAttachedChildren(e: React.ChangeEvent<HTMLInputElement>) {
    if (!activeBoardId) return;
    setBoardActionError('');
    try {
      await handleToggleShowAttachedChildren(activeBoardId, e.target.checked);
    } catch (err) {
      setBoardActionError(err instanceof Error ? err.message : 'Failed to update board setting');
    }
  }

  async function submitCreateBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    setBoardActionError('');
    try {
      await handleCreateBoard(newBoardName.trim());
      setNewBoardName('');
      setCreatingBoard(false);
    } catch (err) {
      setBoardActionError(err instanceof Error ? err.message : 'Failed to create board');
    }
  }

  async function submitRenameBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!activeBoardId || !boardNameDraft.trim()) return;
    setBoardActionError('');
    try {
      await handleRenameBoard(activeBoardId, boardNameDraft.trim());
      setRenamingBoard(false);
    } catch (err) {
      setBoardActionError(err instanceof Error ? err.message : 'Failed to rename board');
    }
  }

  async function submitDeleteBoard(id: string) {
    setBoardActionError('');
    try {
      await handleDeleteBoard(id);
    } catch (err) {
      setBoardActionError(err instanceof Error ? err.message : 'Failed to delete board');
    }
  }

  return (
    <div className="mb-4 shrink-0 space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] text-zinc-500">Board:</span>
        <select
          value={activeBoardId ?? ''}
          onChange={e => setActiveBoardId(e.target.value)}
          aria-label="Active board"
          className="px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-blue-500/50"
        >
          {boards.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        {!readOnly && (
          <>
            <button onClick={() => setCreatingBoard(v => !v)} className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">
              + New board
            </button>
            {activeBoardId && (
              <button
                onClick={() => {
                  setBoardNameDraft(boards.find(b => b.id === activeBoardId)?.name ?? '');
                  setRenamingBoard(v => !v);
                }}
                className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors"
              >
                Rename board
              </button>
            )}
            {boards.length > 1 && activeBoardId && (
              <button
                onClick={() => submitDeleteBoard(activeBoardId)}
                className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors"
              >
                Delete board
              </button>
            )}
            <button onClick={onAddColumn} className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">
              + Add column
            </button>
            <button onClick={onToggleWorkphaseManager} className="text-[11px] text-zinc-500 hover:text-blue-400 transition-colors">
              Manage workphases
            </button>
          </>
        )}

        {activeBoard && (
          <label className="flex items-center gap-1 text-[11px] text-zinc-500 ml-2 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(activeBoard.showAttachedChildren)}
              onChange={submitToggleShowAttachedChildren}
              className="accent-blue-500"
            />
            Show attached children by default
          </label>
        )}

        <span className="text-[11px] text-zinc-500 ml-2">New child items go to:</span>
        <select
          value={childDefaultWorkphaseId ?? ''}
          onChange={e => onChildWorkphaseChange(e.target.value || null)}
          aria-label="Default workphase for new child items"
          className="px-2 py-0.5 rounded text-xs bg-zinc-800 border border-zinc-700 text-zinc-300 focus:outline-none focus:border-blue-500/50"
        >
          <option value="">Same workphase as parent</option>
          {workphases.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {renamingBoard && (
        <form onSubmit={submitRenameBoard} className="flex items-center gap-2">
          <input
            autoFocus
            value={boardNameDraft}
            onChange={e => setBoardNameDraft(e.target.value)}
            aria-label="Board name"
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
            onKeyDown={e => { if (e.key === 'Escape') setRenamingBoard(false); }}
          />
          <button type="submit" className={BTN_PRIMARY}>Save</button>
          <button type="button" onClick={() => setRenamingBoard(false)} className={BTN_CANCEL}>Cancel</button>
        </form>
      )}

      {creatingBoard && (
        <form onSubmit={submitCreateBoard} className="flex items-center gap-2">
          <input
            autoFocus
            value={newBoardName}
            onChange={e => setNewBoardName(e.target.value)}
            placeholder="Board name..."
            aria-label="Board name"
            className="px-3 py-1.5 rounded-lg text-sm bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
            onKeyDown={e => { if (e.key === 'Escape') { setCreatingBoard(false); setNewBoardName(''); } }}
          />
          <button type="submit" className={BTN_PRIMARY}>Create board</button>
          <button type="button" onClick={() => { setCreatingBoard(false); setNewBoardName(''); }} className={BTN_CANCEL}>Cancel</button>
        </form>
      )}

      {boardActionError && <p className="text-xs text-red-400">{boardActionError}</p>}
    </div>
  );
}
