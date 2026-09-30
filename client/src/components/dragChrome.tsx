// The drag-time chrome a Card and a Stub share: an item row's registration
// and drop-target chrome (`useItemRow`), the live side indicator, and the
// zoom-in cue. The Card tier's own render is KanbanCard.tsx, the Stub tier's
// StubRows.tsx.

import { useDndContext } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DropSide } from '../lib/hierarchyPlacement';
import { isItemData, itemRowData, namedAnchorFor, type ItemRowRole } from './workflow/dragCollision';
import { useDragSession, useDropTargetState, useIsPending, type DropTargetView } from './workflow/DragSessionContext';
import type { OverlayForm } from './workflow/placement';

// The live drop-side indicator. Reads dnd-kit's live active/over state
// directly via useDndContext — no prop drilling through
// BoardColumn/BoardView — and names the anchor the way useBoardDnd's
// handleDragEnd does (`namedAnchorFor`), so the line shown here always
// matches what gets sent, at every row dropAnchorFor could ever name: a
// Card row or a Stub row, whichever the active drag happens to be. It's
// never narrowed to a subset of roles, which would hide the line for a
// Stub leaving its Card into a column, exactly the case it most needs to
// show. In a column the anchor is a neighbor of the ghost, not necessarily
// the card dnd-kit says is `over`, so every row asks whether it's the one
// named.
//
// Deliberately separate from the sidebar's indicator
// (`useProjectDragReorder.ts::dropLine`): the sidebar draws no ghost, so it
// draws one line at the projected gap; the board draws on whichever row
// the ghost's named neighbor is. Only the line's look, `DROP_INDICATOR_LINE`,
// is shared.
function useLiveDropSide(itemId: string): DropSide | null {
  const { active, over } = useDndContext();
  const session = useDragSession();
  if (!active || active.id === itemId || !isItemData(active.data.current)) return null;
  const anchor = namedAnchorFor(active, over, session);
  return anchor?.anchorId === itemId ? anchor.side : null;
}

// The drag-target overlays (wiki board-drag-interaction §4). The
// *classification* is settled and exposed as `data-drop-state` for tests;
// the look — palette, weight, animation — is a placeholder, not yet tuned
// against real gestures. Green: a Free descendant of the carried item
// ("these are yours"). Dimmed: a real target this item can't use
// (depth-capped). Valid draws nothing. The color and the dim level are CSS
// custom properties BoardView sets from the dev/test panel.
const OVERLAY_FREE_DESCENDANT = 'ring-2 ring-(--drag-overlay-free)';
const OVERLAY_DEPTH_CAPPED = 'opacity-(--drag-overlay-capped-opacity)';
// A write is in flight for this item — it's drawn at the slot it was
// dropped in, and its position is the server's to confirm. Test surface:
// `data-pending`.
const PENDING = 'animate-pulse';

function dropTargetClass(view: DropTargetView | null): string {
  if (!view) return '';
  if (view.isFreeDescendant) return OVERLAY_FREE_DESCENDANT;
  if (view.state === 'depth-capped') return OVERLAY_DEPTH_CAPPED;
  return '';
}

// The blue drop line, less its vertical offset — the board's rows and the
// project sidebar's (`SortableProjectRow.tsx`) draw the same line.
export const DROP_INDICATOR_LINE = 'pointer-events-none absolute right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500';
const DROP_INDICATOR_BEFORE = `${DROP_INDICATOR_LINE} -top-1`;
const DROP_INDICATOR_AFTER = `${DROP_INDICATOR_LINE} -bottom-1`;

// The invalid-tab-state cue (wiki board-drag-interaction §7.2): a dashed
// red outline on the active row's own preview while its current depth
// choice would exceed the cap. A placeholder look.
export const INVALID_PLACEMENT_CLASS = 'outline-2 outline-dashed outline-red-500/70';

interface ItemRowOptions {
  /** A Stub row's own parent, carried on its registration. */
  parentId?: string | null;
  /** The DragOverlay copy: the carried item itself — never a target, never pending — so it gets none of the chrome. */
  isOverlay?: boolean;
  /** isOverlay only — which form the carried copy draws as. */
  overlayForm?: OverlayForm;
}

// One item row's dnd-kit registration and drag chrome, for a Card row and a
// Stub row alike: the sortable registration (`itemRowData` — every item row
// registers `type: 'item'`) and its transform, the drop-target
// attributes and overlay, the pending marker, and the dimming while this row
// is the one being dragged. The row draws `DropSideIndicator` for
// `dropSide` itself. The one non-component export beside the components: it
// belongs next to the indicator. Fast Refresh reloads this file in full
// instead of hot-swapping it, a dev convenience only, so the rule is
// suppressed rather than the file split.
// eslint-disable-next-line react-refresh/only-export-components
export function useItemRow(itemId: string, role: ItemRowRole, options: ItemRowOptions = {}) {
  const { parentId, isOverlay = false, overlayForm = 'short-card' } = options;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
    data: itemRowData(role, parentId),
  });
  const dropSide = useLiveDropSide(itemId);
  const dropTarget = useDropTargetState(isOverlay ? '' : itemId);
  const pending = useIsPending(isOverlay ? '' : itemId);
  return {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    dropSide,
    sortableStyle: { transform: CSS.Transform.toString(transform), transition },
    dataAttrs: {
      'data-item-id': isOverlay ? undefined : itemId,
      // The carried copy, for the E2E helper's "drag finished" wait — it
      // outlives the drag by dnd-kit's drop animation.
      'data-drag-overlay': isOverlay ? 'true' : undefined,
      // A test surface: which form this same carried copy is drawing as
      // right now (placement.ts::overlayFormFor).
      'data-drag-overlay-form': isOverlay ? overlayForm : undefined,
      'data-drop-state': dropTarget?.state,
      'data-pending': pending ? 'true' : undefined,
    },
    chromeClassName: `${dropTargetClass(dropTarget)} ${pending ? PENDING : ''} ${isDragging ? 'opacity-30' : ''}`,
  };
}

export function DropSideIndicator({ side }: { side: DropSide | null }) {
  if (side === 'before') return <div className={DROP_INDICATOR_BEFORE} />;
  if (side === 'after') return <div className={DROP_INDICATOR_AFTER} />;
  return null;
}

// The zoom-in cue (wiki board-drag-interaction §6.1) — shown only once the
// dwell has elapsed (`useZoomCandidatePhase` returns `'cue'`; the dwell
// itself shows nothing new beyond the blue line). Absolutely
// positioned and `pointer-events-none`, the same way the locked-layer
// outline and the blue line already are, so it can never feed back into
// layout or collision. The fill bar's `animation-duration` is the cue's
// own clock (`cardPopInDelayMs`, read live so the dev panel's tuning takes
// effect without a rebuild) — a static `@keyframes` (index.css) driven by
// inline style, since a Tailwind utility class can't parameterize a
// runtime duration. No explicit `key`/reset is needed: this element only
// exists while `phase === 'cue'`, so a reset (any change to the named
// relation restarts at `'dwell'`, per `popSession.ts::namedCardCandidate`)
// unmounts it and the *next* cue mounts a fresh instance, which is what
// restarts the CSS animation from empty.
const ZOOM_CUE_OUTLINE = 'pointer-events-none absolute inset-0 rounded-lg border-2 border-dashed border-blue-500/70';
const ZOOM_CUE_TRACK =
  'pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-lg bg-blue-500/20';

export function ZoomCue({ cueMs }: { cueMs: number }) {
  return (
    <>
      <div className={ZOOM_CUE_OUTLINE} />
      <div className={ZOOM_CUE_TRACK}>
        <div
          className="h-full bg-blue-500"
          style={{
            animationName: 'cue-fill',
            animationDuration: `${cueMs}ms`,
            animationTimingFunction: 'linear',
            animationFillMode: 'forwards',
          }}
        />
      </div>
    </>
  );
}
