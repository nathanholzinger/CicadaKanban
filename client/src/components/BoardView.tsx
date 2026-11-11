// Board orchestration: composes the workflow/ hooks (the board's load among them, `useBoardLoad.ts`),
// renders the DnD board.

import { useState, useEffect, useCallback, useMemo, useRef, type CSSProperties } from 'react';
import { DndContext, DragOverlay, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { ItemType, Column } from '../types';
import { fetchItemTypes } from '../api/itemTypes';
import BoardColumn from './BoardColumn';
import UnsortedBucket from './UnsortedBucket';
import ColumnEditorModal from './ColumnEditorModal';
import KanbanCard from './KanbanCard';
import HierarchyModal from './HierarchyModal';
import ItemDetailPanel from './ItemDetailPanel';
import BoardToolbar from './BoardToolbar';
import WorkphaseManagerPanel from './WorkphaseManagerPanel';
import { useBoardManagement } from './workflow/useBoardManagement';
import { useBoardLoad } from './workflow/useBoardLoad';
import { useWorkphaseManagement } from './workflow/useWorkphaseManagement';
import { useColumnManagement } from './workflow/useColumnManagement';
import { hasUnknownStatusItem } from './workflow/itemListOps';
import { useItemManagement } from './workflow/useItemManagement';
import { useBoardDnd } from './workflow/useBoardDnd';
import { DragSessionContext, PlacementsContext } from './workflow/DragSessionContext';
import { loadDragTuning, saveDragTuning, type DragTuning } from './workflow/dragTuning';
import { DragTuningContext } from './workflow/DragTuningContext';
import { ForcedStopFlashContext } from './workflow/ForcedStopContext';
import type { ArmedStop } from './workflow/forcedStop';
import { useForcedStop } from './workflow/useForcedStop';
import ForcedStopCue from './ForcedStopCue';
import { HierarchyModalContext } from './workflow/HierarchyModalContext';
import { popState } from './workflow/popSession';
import type { Point } from './workflow/dragRegions';
import DragTuningPanel from './DragTuningPanel';
import { NamedAnchorSync, tierVars } from './dragChrome';

interface BoardViewProps {
  workflowId: string;
  projectId?: string; // project context for new items
  filterProjectId?: string; // when set, only show items for this project (inherited view)
  readOnly?: boolean; // when true, hides board/workphase management controls
}

export default function BoardView({ workflowId, projectId, filterProjectId, readOnly }: BoardViewProps) {
  const [itemTypes, setItemTypes] = useState<ItemType[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<Column | 'new' | null>(null);
  const [showWorkphaseManager, setShowWorkphaseManager] = useState(false);
  const [workphaseNotice, setWorkphaseNotice] = useState('');
  // The drag gesture's tunable parameters, persisted so a change survives a
  // reload.
  const [dragTuning, setDragTuningState] = useState(loadDragTuning);
  const [showDragTuning, setShowDragTuning] = useState(false);
  // The cue for a drag the board stopped lives here, above the reload that stops it: the reload
  // swaps the board for "Loading board…" and unmounts everything the DndContext holds. The stop the
  // dev/test panel has armed for the next drag is kept here for the same reason. The cue's flash
  // follows the board's reloads (`loadBoard` tells it when one starts and when it has drawn).
  const forcedStop = useForcedStop(dragTuning.forcedStopCueMs);
  const { reloadStarted, boardDrawn } = forcedStop;
  const [armedStop, setArmedStop] = useState<ArmedStop | null>(null);
  // The Card whose whole hierarchy the modal shows, when it's open, and where the cursor was if a
  // hold during a drag opened it (a click opens it centered, with no anchor).
  const [hierarchyModalOpen, setHierarchyModalOpen] = useState<{ cardId: string; anchor: Point | null } | null>(null);
  const hierarchyModalCardId = hierarchyModalOpen?.cardId ?? null;
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
    answersApplied,
    previewPlacement,
    writes,
    childCounts,
    getWorkphaseItems,
    getMergedColumnItems,
    getUnknownStatusItems,
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

  const closeHierarchyModal = useCallback(() => setHierarchyModalOpen(null), []);
  const openHierarchyModal = useCallback((cardId: string) => setHierarchyModalOpen({ cardId, anchor: null }), []);
  const openHierarchyModalAt = useCallback(
    (cardId: string, anchor: Point) => setHierarchyModalOpen({ cardId, anchor }),
    [],
  );
  const hierarchyModal = useMemo(
    () => ({ openCardId: hierarchyModalCardId, open: openHierarchyModal, close: closeHierarchyModal }),
    [hierarchyModalCardId, openHierarchyModal, closeHierarchyModal],
  );
  // The modal shows a Card that has attached descendants. A Card that is gone, or has none left,
  // has nothing to show, so it closes.
  const hierarchyModalCard = items.find(i => i.id === hierarchyModalCardId);
  const hierarchyModalHasRows = hierarchyModalCardId !== null && getAttachedChildren(hierarchyModalCardId).length > 0;
  useEffect(() => {
    if (hierarchyModalCardId !== null && !(hierarchyModalCard && hierarchyModalHasRows)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- a reaction to the items, which this component doesn't own
      setHierarchyModalOpen(null);
    }
  }, [hierarchyModalCardId, hierarchyModalCard, hierarchyModalHasRows]);

  const { board, setBoard, loading, loadBoard } = useBoardLoad({
    activeBoardId,
    setWorkphases,
    replaceItems,
    answersApplied,
    reloadStarted,
    boardDrawn,
  });

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
    onColumnDrop,
  } = useColumnManagement(activeBoardId, board, setBoard, loadBoard);

  const {
    sensors,
    session,
    collisionDetection,
    dragModifiers,
    overlayForm,
    overlayWidthPx,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    syncNamedAnchor,
    handleDragEnd,
    handleDragCancel,
    readModalPlacement,
  } = useBoardDnd({
    board,
    items,
    tuning: dragTuning,
    placements,
    previewPlacement,
    writes,
    getWorkphaseItems,
    getMergedColumnItems,
    getAttachedChildren,
    onColumnDrop,
    loadBoard,
    onDragStopped: forcedStop.report,
    armedStop,
    disarmStop: () => setArmedStop(null),
    rootRef: boardRootRef,
    hierarchyModalCardId,
    openHierarchyModalAt,
    closeHierarchyModal,
  });

  // The next drag, of any kind, takes the cue away.
  function startDrag(event: DragStartEvent) {
    forcedStop.clear();
    handleDragStart(event);
  }

  // The tiers' opacities and the active-context outline reach the drag chrome
  // (`dragChrome.tsx`, which every Card and Stub row draws) as CSS custom
  // properties, so the dev/test panel can change them without a rebuild.
  const overlayVars = {
    ...tierVars({
      anchor: dragTuning.overlayAnchorOpacity,
      neither: dragTuning.overlayNeitherOpacity,
      ghost: dragTuning.overlayGhostOpacity,
    }),
    '--active-context-outline': dragTuning.activeContextOutlineColor,
  } as CSSProperties;

  async function submitColumn(data: Parameters<typeof handleCreateColumn>[0]) {
    if (editingColumn === 'new') return handleCreateColumn(data);
    if (editingColumn) return handleUpdateColumn(editingColumn.id, data);
    return false;
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // The same element in every branch below, so it stays mounted across the reload.
  const cue = <ForcedStopCue stop={forcedStop.stop} stopKey={forcedStop.stopKey} cueMs={dragTuning.forcedStopCueMs} />;

  if (loading) {
    return (
      <>
        {cue}
        <div className="flex h-64 items-center justify-center">
          <p className="text-zinc-500">Loading board…</p>
        </div>
      </>
    );
  }

  if (!board) {
    // This state draws no toolbar, so a failed switch shows nothing of which board is selected: the id is
    // here for a test to read (absent when the workflow has no board to select).
    return (
      <>
        {cue}
        <div className="flex h-64 items-center justify-center" data-selected-board-id={activeBoardId ?? undefined}>
          <p className="text-zinc-400">No board found for this workflow</p>
        </div>
      </>
    );
  }

  return (
    <>
      {cue}
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
          />

          {showDragTuning && (
            <DragTuningPanel
              tuning={dragTuning}
              onChange={setDragTuning}
              session={session}
              inversions={inversions}
              armedStop={armedStop}
              onArmStop={setArmedStop}
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
          onDragStart={startDrag}
          onDragMove={handleDragMove}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <NamedAnchorSync onSync={syncNamedAnchor} />
          <DragSessionContext value={session}>
            <PlacementsContext value={placements}>
              <DragTuningContext value={dragTuning}>
                <ForcedStopFlashContext value={dragTuning.forcedStopFlash ? forcedStop.flashItemId : null}>
                  <HierarchyModalContext value={hierarchyModal}>
                    <SortableContext items={board.columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                      {/* data-drag-state / data-drag-context / data-drag-band: the pop
                    machine's state, for tests.
                    data-drag-zoom-candidate / data-drag-zoom-phase: the card
                    the blue line currently names as a zoom-in candidate,
                    and which stage of the hold it's in — a test surface.
                    `hover.phase` is only ever set by this candidate kind (a
                    Board-layer band hover never sets it), so gating on it
                    also tells the two `hover` shapes apart.
                    data-drag-projection: the Descendants layer's own live
                    tab state ("<gap>:<depth>:<valid>") — a test surface.
                    Undefined whenever the drag isn't currently locked at a
                    `descendants:` context (`session.projection` is null
                    then too).
                    data-drag-modal-hold: the hold that opens the hierarchy
                    modal ("<overflow row owner id>:<dwell|cue>") — a test
                    surface, undefined while none runs. */}
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
                        data-drag-modal-hold={
                          session?.pop.modalHold
                            ? `${session.pop.modalHold.ownerId}:${session.pop.modalHold.phase}`
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
                          unknownStatusItems={getUnknownStatusItems(workphases.map(w => w.id))}
                          getWorkphaseItems={getWorkphaseItems}
                          needsAttention={
                            board.unsorted.uncovered.length > 0 ||
                            hasUnknownStatusItem(
                              items,
                              workphases.map(w => w.id),
                            )
                          }
                          itemTypes={itemTypes}
                          childCounts={childCounts}
                          getAttachedChildren={getAttachedChildren}
                          defaultExpanded={Boolean(board.showAttachedChildren)}
                          onCardClick={setSelectedItemId}
                        />

                        {/* Inside the board root, so the drag's regions are read under one element and
                      the overlay colors reach its rows. Its backdrop is `fixed`, so it takes no
                      part in the board's own layout. */}
                        {hierarchyModalOpen && hierarchyModalCard && hierarchyModalHasRows && (
                          <HierarchyModal
                            key={hierarchyModalCard.id}
                            card={hierarchyModalCard}
                            itemTypes={itemTypes}
                            getAttachedChildren={getAttachedChildren}
                            anchor={hierarchyModalOpen.anchor}
                            onPlaced={readModalPlacement}
                            onCardClick={setSelectedItemId}
                            sheetOpen={selectedItemId !== null}
                            onClose={closeHierarchyModal}
                          />
                        )}
                      </div>
                    </SortableContext>
                  </HierarchyModalContext>
                </ForcedStopFlashContext>
              </DragTuningContext>
            </PlacementsContext>
          </DragSessionContext>

          <DragOverlay modifiers={dragModifiers}>
            {session ? (
              // `overlayForm`/`overlayWidthPx` decide the *shape this same
              // instance* draws, not which component renders — see
              // KanbanCard.tsx's file header for why a component-type swap
              // here would break dnd-kit's own measurement of the overlay.
              <KanbanCard
                item={session.activeItem}
                itemTypes={itemTypes}
                isOverlay
                overlayForm={overlayForm}
                overlayWidthPx={overlayWidthPx}
                overlayProjection={session.projection}
                overlayBranch={session.branch}
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
          itemTypes={itemTypes}
          itemDepthCap={board.itemDepthCap}
          onClose={() => setSelectedItemId(null)}
          onUpdate={handleItemUpdated}
          onDelete={handleItemDeleted}
          onNavigate={setSelectedItemId}
          onChildCreated={handleChildCreated}
        />
      </div>
    </>
  );
}
