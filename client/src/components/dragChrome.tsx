// The drag-time chrome a Card, a Stub and an overflow row share: a row's
// registration and drop-target chrome (`useItemRow`), the live side indicator,
// and the zoom-in cue, with the looks they draw (the active-context outline, the
// invalid-placement outline) and the drop line's shape, which the project
// sidebar draws too. The Card tier's own render is KanbanCard.tsx, the Stub
// tier's StubRows.tsx.

import { useDndContext } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DropSide } from '../lib/hierarchyPlacement';
import { isItemData, itemRowData, namedAnchorFor, type ItemRowRole } from './workflow/dragCollision';
import { useDragSession, useDropTargetState, useIsPending, type DropTargetView } from './workflow/DragSessionContext';
import type { OverlayForm } from './workflow/placement';
import { DRAG_OVERLAY_ATTR } from './workflow/dragRegions';

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
// the ghost's named neighbor is. Only the line's look (`DROP_LINE_SHAPE` and
// `DROP_INDICATOR_LINE`) is shared.
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

// The drop line, less its color and its vertical offset: the board's rows
// draw it in blue, and the project sidebar's (`SortableProjectRow.tsx`) draw it
// in blue and, past the project cap, in red, swapping one for the other on the
// same element. The shape is spelled once, so a change to it moves both alike
// and the line never jumps.
export const DROP_LINE_SHAPE = 'pointer-events-none absolute right-0 left-0 z-10 h-0.5 rounded-full';
// The blue drop line, less its vertical offset.
export const DROP_INDICATOR_LINE = `${DROP_LINE_SHAPE} bg-blue-500`;
const DROP_INDICATOR_BEFORE = `${DROP_INDICATOR_LINE} -top-1`;
const DROP_INDICATOR_AFTER = `${DROP_INDICATOR_LINE} -bottom-1`;

// The invalid-tab-state cue (wiki board-drag-interaction §7.2): a dashed
// red outline on the active row's own preview while its current depth
// choice would exceed the cap. A placeholder look.
export const INVALID_PLACEMENT_CLASS = 'outline-2 outline-dashed outline-red-500/70';

// Whichever region — column, sub-row, or Card — is the pop machine's current
// `contextKey` gets this ring, so the locked layer is legible without reading
// the dev panel (wiki board-drag-interaction §1.1). A Card applies it to its own
// element (`KanbanCard.tsx`); a column or sub-row draws it on an overlay div
// (`BandGuides.tsx::DragCarveFrame`).
export const ACTIVE_CONTEXT_OUTLINE = 'ring-2 ring-(--active-context-outline)';

interface ItemRowOptions {
  /** A Stub row's own parent, or the row an overflow row stands under, carried on its registration. */
  parentId?: string | null;
  /** A section row's Card, carried on its registration (`dragCollision.ts::ItemRowData`). */
  sectionCardId?: string;
  /** The DragOverlay copy: the carried item itself — never a target, never pending — so it gets none of the chrome. */
  isOverlay?: boolean;
  /** isOverlay only — which form the carried copy draws as. */
  overlayForm?: OverlayForm;
}

// One row's dnd-kit registration and drag chrome, for a Card row, a Stub row
// and an overflow row alike (`role`): the sortable registration
// (`itemRowData` — every row registers `type: 'item'`) and its transform, the
// drop-target attributes and overlay, the pending marker, and the dimming
// while this row is the one being dragged. The row draws `DropSideIndicator`
// for `dropSide` itself. The one export that is neither a component nor a
// constant: it belongs next to the indicator.
// eslint-disable-next-line react-refresh/only-export-components -- Fast Refresh reloads this file in full instead of hot-swapping it, a dev convenience only
export function useItemRow(itemId: string, role: ItemRowRole, options: ItemRowOptions = {}) {
  const { parentId, sectionCardId, isOverlay = false, overlayForm = 'short-card' } = options;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: itemId,
    data: itemRowData(role, parentId, sectionCardId),
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
      [DRAG_OVERLAY_ATTR]: isOverlay ? 'true' : undefined,
      // A test surface: which form this same carried copy is drawing as
      // right now (placement.ts::overlayFormFor).
      'data-drag-overlay-form': isOverlay ? overlayForm : undefined,
      'data-drop-state': dropTarget?.state,
      'data-pending': pending ? 'true' : undefined,
    },
    chromeClassName: `${dropTargetClass(dropTarget)} ${pending ? PENDING : ''} ${isDragging ? 'opacity-30' : ''}`,
  };
}

// `data-drop-side` is a test surface: which row the line is drawn on, and on which side.
export function DropSideIndicator({ side }: { side: DropSide | null }) {
  if (side === 'before') return <div className={DROP_INDICATOR_BEFORE} data-drop-side="before" />;
  if (side === 'after') return <div className={DROP_INDICATOR_AFTER} data-drop-side="after" />;
  return null;
}

// The cue of a hold that ends in a layer change, shown only once the hold's
// dwell has elapsed (the dwell itself shows nothing new beyond the blue
// line). Two holds draw it, each with its own clock, phase and reset:
//   - a Card's zoom-in (wiki board-drag-interaction §6.1): `cardPopInDelayMs`,
//     `useZoomCandidatePhase`, restarted at `'dwell'` by any change to the
//     named relation (`popSession.ts::namedCardCandidate`);
//   - the hold on an overflow row that opens the hierarchy modal
//     (wiki board-drag-interaction §7.3): `modalHoldCueMs`, `useModalHoldPhase`,
//     restarted by a change to the gap, depth or side the ghost holds
//     (`popSession.ts::nextModalHold`).
// Absolutely positioned and `pointer-events-none`, the same way the
// locked-layer outline and the blue line already are, so it can never feed
// back into layout or collision. The fill bar's `animation-duration` is the
// caller's cue clock (`cueMs`, read live so the dev panel's tuning takes
// effect without a rebuild) — a static `@keyframes` (index.css) driven by
// inline style, since a Tailwind utility class can't parameterize a
// runtime duration. No explicit `key`/reset is needed: this element only
// exists while the caller's phase is `'cue'`, so a reset unmounts it and the
// *next* cue mounts a fresh instance, which is what restarts the CSS
// animation from empty.
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
