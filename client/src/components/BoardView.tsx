import { useState, useEffect, useCallback } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardWithDetails, ItemType, Column } from '../types';
import { boardCollisionDetection } from './workflow/boardDndUtils';
import { fetchBoard } from '../api/boards';
import { fetchItemTypes } from '../api/itemTypes';
import BoardColumn from './BoardColumn';
import UnsortedBucket from './UnsortedBucket';
import ColumnEditorModal from './ColumnEditorModal';
import KanbanCard from './KanbanCard';
import ItemDetailPanel from './ItemDetailPanel';
import BoardToolbar from './BoardToolbar';
import WorkphaseManagerPanel from './WorkphaseManagerPanel';
import { useBoardManagement } from './workflow/useBoardManagement';
import { useWorkphaseManagement } from './workflow/useWorkphaseManagement';
import { useColumnManagement } from './workflow/useColumnManagement';
import { useItemManagement } from './workflow/useItemManagement';
import { useBoardDnd } from './workflow/useBoardDnd';

interface BoardViewProps {
  workflowId: string;
  projectId?: string; // project context for new items
  filterProjectId?: string; // when set, only show items for this project (inherited view)
  readOnly?: boolean; // when true, hides board/workphase management controls
}

export default function BoardView({ workflowId, projectId, filterProjectId, readOnly }: BoardViewProps) {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [board, setBoard] = useState<BoardWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [childDefaultWorkphaseId, setChildDefaultWorkphaseId] = useState<string | null>(
    () => localStorage.getItem(`kanban_child_col_${workflowId}`) ?? null,
  );
  const [editingColumn, setEditingColumn] = useState<Column | 'new' | null>(null);
  const [showWorkphaseManager, setShowWorkphaseManager] = useState(false);
  const [workphaseNotice, setWorkphaseNotice] = useState('');

  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    handleCreateBoard,
    handleRenameBoard,
    handleDeleteBoard,
    handleToggleShowAttachedChildren,
  } = useBoardManagement(workflowId);

  const showAttachedChildrenDefault = Boolean(boards.find(b => b.id === activeBoardId)?.showAttachedChildren);

  const {
    workphases,
    setWorkphases,
    addingWorkphase,
    setAddingWorkphase,
    newWorkphaseName,
    setNewWorkphaseName,
    handleCreateWorkphase: rawHandleCreateWorkphase,
    handleRenameWorkphase: rawHandleRenameWorkphase,
    handleDeleteWorkphase: rawHandleDeleteWorkphase,
  } = useWorkphaseManagement(workflowId);

  const {
    items,
    setItems,
    childCounts,
    getWorkphaseItems,
    getMergedColumnItems,
    getAttachedChildren,
    findWorkphaseForItem,
    handleCreateItem,
    handleItemUpdated,
    handleItemDeleted,
    handleChildCreated,
  } = useItemManagement(projectId, filterProjectId);

  useEffect(() => {
    fetchItemTypes()
      .then(setItemTypes)
      .catch(() => {});
  }, []);

  const loadBoard = useCallback(async () => {
    if (!activeBoardId) {
      setBoard(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchBoard(activeBoardId);
      setBoard(data);

      // Workphases are workflow-scoped (independent of which board is active) —
      // derived here from the board response instead of a second fetch, since
      // every workphase appears exactly once across columns + unsorted.
      const allWorkphases = [
        ...data.columns.flatMap(c => c.subRows.map(r => r.workphase)),
        ...data.unsorted.uncovered.map(r => r.workphase),
      ].sort((a, b) => a.position - b.position);
      setWorkphases(allWorkphases);

      const allItems = [
        ...data.columns.flatMap(c => c.subRows.flatMap(r => r.items)),
        ...data.unsorted.uncovered.flatMap(r => r.items),
        ...data.unsorted.invalidItems,
      ];
      setItems(allItems);

      const stored = localStorage.getItem(`kanban_child_col_${workflowId}`);
      if (!stored) {
        const backlog = allWorkphases.find(w => w.name.toLowerCase() === 'backlog');
        if (backlog) setChildDefaultWorkphaseId(backlog.id);
      }
    } catch (err) {
      console.error('Failed to load board:', err);
    } finally {
      setLoading(false);
    }
  }, [activeBoardId, workflowId, setWorkphases, setItems]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Workphase changes affect which statuses a board's columns cover (a new
  // workphase may land in Unsorted, a delete may shrink/remove columns) — the
  // hook only updates the local workphases list, so reload the resolved board
  // structure afterward to keep columns/Unsorted in sync.
  async function handleCreateWorkphase() {
    await rawHandleCreateWorkphase();
    await loadBoard();
  }
  async function handleRenameWorkphase(id: string, name: string) {
    await rawHandleRenameWorkphase(id, name);
    await loadBoard();
  }
  async function handleDeleteWorkphase(id: string) {
    const result = await rawHandleDeleteWorkphase(id);
    await loadBoard();
    if (result && (result.shrunkColumns.length > 0 || result.deletedColumns.length > 0)) {
      const parts: string[] = [];
      if (result.shrunkColumns.length > 0)
        parts.push(`${result.shrunkColumns.length} column${result.shrunkColumns.length === 1 ? '' : 's'} resized`);
      if (result.deletedColumns.length > 0)
        parts.push(`${result.deletedColumns.length} column${result.deletedColumns.length === 1 ? '' : 's'} removed`);
      setWorkphaseNotice(parts.join(', '));
    } else {
      setWorkphaseNotice('');
    }
  }

  const {
    error: columnError,
    setError: setColumnError,
    handleCreateColumn,
    handleUpdateColumn,
    handleDeleteColumn,
    handleReorderColumns,
  } = useColumnManagement(activeBoardId, loadBoard);

  const { sensors, activeItem, handleDragStart, handleDragOver, handleDragEnd } = useBoardDnd(
    board,
    setBoard,
    items,
    setItems,
    findWorkphaseForItem,
    handleReorderColumns,
    loadBoard,
  );

  function handleChildWorkphaseChange(workphaseId: string | null) {
    setChildDefaultWorkphaseId(workphaseId);
    if (workphaseId) {
      localStorage.setItem(`kanban_child_col_${workflowId}`, workphaseId);
    } else {
      localStorage.removeItem(`kanban_child_col_${workflowId}`);
    }
  }

  async function submitColumn(data: Parameters<typeof handleCreateColumn>[0]) {
    if (editingColumn === 'new') return handleCreateColumn(data);
    if (editingColumn) return handleUpdateColumn(editingColumn.id, data);
    return false;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-500">Loading board…</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-zinc-400">No board found for this workflow</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-4 shrink-0 space-y-2">
        <BoardToolbar
          boards={boards}
          activeBoardId={activeBoardId}
          setActiveBoardId={setActiveBoardId}
          readOnly={readOnly}
          handleCreateBoard={handleCreateBoard}
          handleRenameBoard={handleRenameBoard}
          handleDeleteBoard={handleDeleteBoard}
          handleToggleShowAttachedChildren={handleToggleShowAttachedChildren}
          onAddColumn={() => setEditingColumn('new')}
          onToggleWorkphaseManager={() => {
            setShowWorkphaseManager(v => !v);
            setWorkphaseNotice('');
          }}
          childDefaultWorkphaseId={childDefaultWorkphaseId}
          onChildWorkphaseChange={handleChildWorkphaseChange}
          workphases={workphases}
        />

        {showWorkphaseManager && !readOnly && (
          <WorkphaseManagerPanel
            workphases={workphases}
            notice={workphaseNotice}
            addingWorkphase={addingWorkphase}
            setAddingWorkphase={setAddingWorkphase}
            newWorkphaseName={newWorkphaseName}
            setNewWorkphaseName={setNewWorkphaseName}
            onCreate={handleCreateWorkphase}
            onRename={handleRenameWorkphase}
            onDelete={handleDeleteWorkphase}
          />
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={boardCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={board.columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
          <div className="flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto pb-4">
            {board.columns.map(column => (
              <BoardColumn
                key={column.id}
                column={column}
                getWorkphaseItems={getWorkphaseItems}
                getMergedColumnItems={getMergedColumnItems}
                childCounts={childCounts}
                getAttachedChildren={getAttachedChildren}
                defaultExpanded={showAttachedChildrenDefault}
                itemTypes={itemTypes}
                isCardBeingDragged={activeItem !== null}
                onCreateItem={handleCreateItem}
                onCardClick={setSelectedItemId}
                onEdit={readOnly ? undefined : setEditingColumn}
                onDelete={readOnly ? undefined : handleDeleteColumn}
              />
            ))}

            <UnsortedBucket
              uncoveredWorkphases={board.unsorted.uncovered.map(r => r.workphase)}
              invalidItems={board.unsorted.invalidItems}
              getWorkphaseItems={getWorkphaseItems}
              needsAttention={board.unsorted.needsAttention}
              itemTypes={itemTypes}
              childCounts={childCounts}
              getAttachedChildren={getAttachedChildren}
              defaultExpanded={Boolean(board.showAttachedChildren)}
              filterProjectId={filterProjectId}
              onCardClick={setSelectedItemId}
            />
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem ? <KanbanCard item={activeItem} itemTypes={itemTypes} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {editingColumn && (
        <ColumnEditorModal
          workphases={workphases}
          column={editingColumn === 'new' ? undefined : editingColumn}
          onSubmit={submitColumn}
          onClose={() => {
            setEditingColumn(null);
            setColumnError('');
          }}
          error={columnError}
        />
      )}

      <ItemDetailPanel
        itemId={selectedItemId}
        items={items}
        childDefaultWorkphaseId={childDefaultWorkphaseId}
        itemTypes={itemTypes}
        onClose={() => setSelectedItemId(null)}
        onUpdate={handleItemUpdated}
        onDelete={handleItemDeleted}
        onNavigate={setSelectedItemId}
        onChildCreated={handleChildCreated}
      />
    </div>
  );
}
