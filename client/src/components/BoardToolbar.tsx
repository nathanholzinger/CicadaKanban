// Board switcher + board create/rename/delete, add-column/manage-workphases/
// drag-tuning entry points.

import { useState } from 'react';
import type { Board } from '../types';
import { BTN_PRIMARY, BTN_CANCEL, BTN_ADD_TRIGGER, INPUT_LG, SELECT_SM } from './item-detail/pillUtils';

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
  onToggleDragTuning: () => void;
}

// Board switcher + board CRUD, and the column/workphase-manager entry points.
// Owns its own board create/rename form state — callers only need the board
// list and the underlying API handlers.
export default function BoardToolbar({
  boards,
  activeBoardId,
  setActiveBoardId,
  readOnly,
  handleCreateBoard,
  handleRenameBoard,
  handleDeleteBoard,
  handleToggleShowAttachedChildren,
  onAddColumn,
  onToggleWorkphaseManager,
  onToggleDragTuning,
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
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-zinc-500">Board:</span>
        <select
          value={activeBoardId ?? ''}
          onChange={e => setActiveBoardId(e.target.value)}
          aria-label="Active board"
          className={SELECT_SM}
        >
          {boards.map(b => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {!readOnly && (
          <>
            <button onClick={() => setCreatingBoard(v => !v)} className={BTN_ADD_TRIGGER}>
              + New board
            </button>
            {activeBoardId && (
              <button
                onClick={() => {
                  setBoardNameDraft(boards.find(b => b.id === activeBoardId)?.name ?? '');
                  setRenamingBoard(v => !v);
                }}
                className={BTN_ADD_TRIGGER}
              >
                Rename board
              </button>
            )}
            {boards.length > 1 && activeBoardId && (
              <button
                onClick={() => submitDeleteBoard(activeBoardId)}
                className="text-[11px] text-zinc-500 transition-colors hover:text-red-400"
              >
                Delete board
              </button>
            )}
            <button onClick={onAddColumn} className={BTN_ADD_TRIGGER}>
              + Add column
            </button>
            <button onClick={onToggleWorkphaseManager} className={BTN_ADD_TRIGGER}>
              Manage workphases
            </button>
          </>
        )}

        {activeBoard && (
          <label className="ml-2 flex cursor-pointer items-center gap-1 text-[11px] text-zinc-500">
            <input
              type="checkbox"
              checked={Boolean(activeBoard.showAttachedChildren)}
              onChange={submitToggleShowAttachedChildren}
              className="accent-blue-500"
            />
            Show attached children by default
          </label>
        )}

        {/* Always available, read-only boards included: the drag gesture works
            everywhere and its tuning is a per-browser setting, not board data. */}
        <button
          onClick={onToggleDragTuning}
          className={BTN_ADD_TRIGGER}
          title="Drag gesture thresholds, bands, overlays"
        >
          Drag tuning
        </button>
      </div>

      {renamingBoard && (
        <form onSubmit={submitRenameBoard} className="flex items-center gap-2">
          <input
            autoFocus
            value={boardNameDraft}
            onChange={e => setBoardNameDraft(e.target.value)}
            aria-label="Board name"
            className={INPUT_LG}
            onKeyDown={e => {
              if (e.key === 'Escape') setRenamingBoard(false);
            }}
          />
          <button type="submit" className={BTN_PRIMARY}>
            Save
          </button>
          <button type="button" onClick={() => setRenamingBoard(false)} className={BTN_CANCEL}>
            Cancel
          </button>
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
            className={INPUT_LG}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                setCreatingBoard(false);
                setNewBoardName('');
              }
            }}
          />
          <button type="submit" className={BTN_PRIMARY}>
            Create board
          </button>
          <button
            type="button"
            onClick={() => {
              setCreatingBoard(false);
              setNewBoardName('');
            }}
            className={BTN_CANCEL}
          >
            Cancel
          </button>
        </form>
      )}

      {boardActionError && <p className="text-xs text-red-400">{boardActionError}</p>}
    </div>
  );
}
