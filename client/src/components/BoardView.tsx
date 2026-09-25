// Board orchestration: loads the active board, composes the workflow/ hooks,
// renders the DnD board. See client/src/components/workflow/CLAUDE.md.

import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { BoardWithDetails, ItemType, Column } from '../types';
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
import { DragSessionContext, PlacementsContext } from './workflow/DragSessionContext';
import { loadDragTuning, saveDragTuning, type DragTuning } from './workflow/dragTuning';
import { DragTuningContext } from './workflow/DragTuningContext';
import { popState } from './workflow/popSession';
import DragTuningPanel from './DragTuningPanel';

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
  // Epic 3.5 Story 3: the drag gesture's tunable parameters, persisted so a
  // change survives a reload (docs/wiki/board-drag-interaction §3.1).
  const [dragTuning, setDragTuningState] = useState(loadDragTuning);
  const [showDragTuning, setShowDragTuning] = useState(false);
  const boardRootRef = useRef<HTMLDivElement>(null);

  function setDragTuning(next: DragTuning) {
    setDragTuningState(next);
    saveDragTuning(next);
  }

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
    placements,
    inversions,
    replaceItems,
    previewPlacement,
    writes,
    childCounts,
    getWorkphaseItems,
    getMergedColumnItems,
    getAttachedChildren,
    handleCreateItem,
    handleItemUpdated,
    handleItemDeleted,
    handleChildCreated,
  } = useItemManagement(projectId, filterProjectId);

  useEffect(() => {
    fetchItemTypes()
      .then(setItemTypes)
      .catch(err => console.error('Failed to load item types:', err));
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
      replaceItems(allItems);

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
  }, [activeBoardId, workflowId, setWorkphases, replaceItems]);

  useEffect(() => {
    // loadBoard's synchronous setBoard(null)/setLoading(true) at the top is
    // intentional and shared: it's also called imperatively (not from an
    // effect, so unflagged) from handleCreateWorkphase/RenameWorkphase/
    // DeleteWorkphase below, and by useColumnManagement/useBoardDnd, all of
    // which rely on the same immediate loading flash. Deriving `loading`
    // from state instead would silently drop that flash from those other
    // call sites — a real behavior change, not a lint-only fix.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const {
    sensors,
    session,
    collisionDetection,
    dragModifiers,
    overlayForm,
    overlayWidthPx,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  } = useBoardDnd({
    board,
    setBoard,
    items,
    tuning: dragTuning,
    placements,
    previewPlacement,
    writes,
    getWorkphaseItems,
    getMergedColumnItems,
    getAttachedChildren,
    handleReorderColumns,
    loadBoard,
    rootRef: boardRootRef,
  });

  // §4's overlay colors (plus the active-context outline) reach KanbanCard
  // and BandGuides as CSS custom properties, so the dev/test panel can
  // change them without a rebuild.
  const overlayVars = {
    '--drag-overlay-free': dragTuning.overlayFreeDescendantColor,
    '--drag-overlay-capped-opacity': dragTuning.overlayDepthCappedOpacity,
    '--active-context-outline': dragTuning.activeContextOutlineColor,
  } as CSSProperties;

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
          onToggleDragTuning={() => setShowDragTuning(v => !v)}
          childDefaultWorkphaseId={childDefaultWorkphaseId}
          onChildWorkphaseChange={handleChildWorkphaseChange}
          workphases={workphases}
        />

        {showDragTuning && (
          <DragTuningPanel
            tuning={dragTuning}
            onChange={setDragTuning}
            session={session}
            inversions={inversions}
            onClose={() => setShowDragTuning(false)}
          />
        )}

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
        collisionDetection={collisionDetection}
        modifiers={dragModifiers}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <DragSessionContext value={session}>
          <PlacementsContext value={placements}>
            <DragTuningContext value={dragTuning}>
              <SortableContext items={board.columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                {/* data-drag-state / data-drag-context / data-drag-band: the pop
                    machine's state, for tests (wiki §1–§3, §5).
                    data-drag-zoom-candidate / data-drag-zoom-phase: Story 6,
                    hands-on finding 3 — the card the blue line currently
                    names as a zoom-in candidate, and which stage of the
                    hold it's in, for Story 10's E2E. `hover.phase` is only
                    ever set by this candidate kind (a Board-layer band
                    hover never sets it), so gating on it also tells the two
                    `hover` shapes apart.
                    data-drag-projection: Story 6 Phase D, decision 7 — the
                    Descendants layer's own live tab state
                    ("<gap>:<depth>:<valid>"), for Story 10's E2E. Undefined
                    whenever the drag isn't currently locked at a
                    `descendants:` context (decision 4's "cleared on
                    pop-out" — `session.projection` is null then too). */}
                <div
                  ref={boardRootRef}
                  style={overlayVars}
                  data-drag-state={session ? popState(session.pop) : undefined}
                  data-drag-context={session?.pop.contextKey ?? undefined}
                  data-drag-band={session?.pop.hover?.band ?? undefined}
                  data-drag-zoom-candidate={session?.pop.hover?.phase ? session.pop.hover.regionKey : undefined}
                  data-drag-zoom-phase={session?.pop.hover?.phase}
                  data-drag-projection={
                    session?.projection
                      ? `${session.projection.gap}:${session.projection.depth}:${session.projection.valid}`
                      : undefined
                  }
                  className="flex min-h-0 flex-1 items-stretch gap-4 overflow-x-auto pb-4"
                >
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
            </DragTuningContext>
          </PlacementsContext>
        </DragSessionContext>

        <DragOverlay modifiers={dragModifiers}>
          {session ? (
            // Story 6 Phase C (Story 5 decision 6, reopened): `overlayForm`/
            // `overlayWidthPx` decide the *shape this same instance* draws,
            // not which component renders — see KanbanCard.tsx's file
            // header for why a component-type swap here would break
            // dnd-kit's own measurement of the overlay.
            <KanbanCard
              item={session.activeItem}
              itemTypes={itemTypes}
              isOverlay
              overlayForm={overlayForm}
              overlayWidthPx={overlayWidthPx}
              overlayProjection={session.projection}
            />
          ) : null}
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
