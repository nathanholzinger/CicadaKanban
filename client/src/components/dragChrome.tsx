// The drag-time chrome a Card and a Stub share (audit epic-3-5-story-2 #13):
// the live side indicator, the drag-target attributes/overlay, the pending
// marker, and the zoom-in cue. Split out of KanbanCard.tsx (Story 6.1 Phase
// 1, C-5) — the Card tier's own render stays there.

import { useDndContext } from '@dnd-kit/core';
import { dropAnchorFor, travelingRowsFor, type ItemRowRole } from './workflow/dragCollision';
import { useDragSession, useDropTargetState, useIsPending, type DropTargetView } from './workflow/DragSessionContext';
import type { OverlayForm } from './workflow/placement';

// Diagnostic-grade live drop-side indicator (Epic 3.2 addendum — not the
// full polished Epic 3.5 hover cue, just enough to see what handleDragEnd
// is about to compute). Reads dnd-kit's live active/over state directly via
// useDndContext — no prop drilling through BoardColumn/BoardView — and
// calls the exact same dropAnchorFor function useBoardDnd's handleDragEnd
// uses, so the line shown here is guaranteed to match what gets sent. In a
// column (Option A + lean, 2026-09-24) the anchor is a neighbor of the ghost,
// not necessarily the card dnd-kit says is `over`, so every row asks
// whether it's the one named.
// Diagnostic-only, so reading `active.data.current?.role` here is fine even
// though it's never load-bearing for a real collision/write decision
// (decision 4) — a stale read during a mid-drag remount briefly mis-draws
// this line at worst, never anything written.
function useLiveDropSide(itemId: string, expectedActiveRoles: readonly ItemRowRole[]): 'before' | 'after' | null {
  const { active, over } = useDndContext();
  const session = useDragSession();
  if (!active || !over || active.id === itemId) return null;
  if (active.data.current?.type !== 'item') return null;
  if (!expectedActiveRoles.includes(active.data.current?.role)) return null;
  const anchor = dropAnchorFor(active, over, travelingRowsFor(session));
  return anchor?.anchorId === itemId ? anchor.side : null;
}

// Epic 3.5 Story 2: provisional drag-target overlays (docs/wiki/board-drag-
// interaction §4). The *classification* is settled and exposed as
// `data-drop-state` for tests; the look — palette, weight, animation — is
// deliberately rough until Story 8 tunes it against real gestures. Green:
// a Free descendant of the carried item ("these are yours"). Dimmed: a real
// target this item can't use (depth-capped). Valid and Inert draw nothing.
// The color and the dim level are CSS custom properties BoardView sets from
// the dev/test panel (Story 3).
const OVERLAY_FREE_DESCENDANT = 'ring-2 ring-(--drag-overlay-free)';
const OVERLAY_DEPTH_CAPPED = 'opacity-(--drag-overlay-capped-opacity)';
// Epic 3.5 Story 3: a write is in flight for this item — it's drawn at the
// slot it was dropped in, and its position is the server's to confirm
// (wiki §10). Test surface: `data-pending`.
const PENDING = 'animate-pulse';

function dropTargetClass(view: DropTargetView | null): string {
  if (!view) return '';
  if (view.isFreeDescendant) return OVERLAY_FREE_DESCENDANT;
  if (view.state === 'depth-capped') return OVERLAY_DEPTH_CAPPED;
  return '';
}

const DROP_INDICATOR_BEFORE = 'pointer-events-none absolute -top-1 right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500';
const DROP_INDICATOR_AFTER =
  'pointer-events-none absolute -bottom-1 right-0 left-0 z-10 h-0.5 rounded-full bg-blue-500';

// Story 6 Phase D, decision 7 — the provisional invalid-tab-state cue
// (§7.2): a dashed red outline on the active row's own preview while its
// current depth choice would exceed the cap. Story 8 restyles.
export const INVALID_PLACEMENT_CLASS = 'outline-2 outline-dashed outline-red-500/70';

// The drag-time chrome a Card and a Stub share (audit epic-3-5-story-2
// #13): the live side indicator, the drag-target attributes/overlay, the
// pending marker. The DragOverlay copy is the carried item itself — never a
// target, never pending — so it gets none of it.
// The one non-component export beside DropSideIndicator/ZoomCue (Story 6.1
// Phase 1, C-5): it belongs next to the indicator that draws its `dropSide`.
// Fast Refresh reloads this file in full instead of hot-swapping it, a dev
// convenience only, so the rule is suppressed rather than the file split.
// eslint-disable-next-line react-refresh/only-export-components
export function useDropTargetProps(
  itemId: string,
  activeRoles: readonly ItemRowRole[],
  isOverlay = false,
  overlayForm: OverlayForm = 'short-card',
) {
  const dropSide = useLiveDropSide(itemId, activeRoles);
  const dropTarget = useDropTargetState(isOverlay ? '' : itemId);
  const pending = useIsPending(isOverlay ? '' : itemId);
  return {
    dropSide,
    dataAttrs: {
      'data-item-id': isOverlay ? undefined : itemId,
      // The carried copy, for the E2E helper's "drag finished" wait — it
      // outlives the drag by dnd-kit's drop animation.
      'data-drag-overlay': isOverlay ? 'true' : undefined,
      // Story 6 Phase C, for Story 10's E2E — which form this same carried
      // copy is drawing as right now (placement.ts::overlayFormFor).
      'data-drag-overlay-form': isOverlay ? overlayForm : undefined,
      'data-drop-state': dropTarget?.state,
      'data-pending': pending ? 'true' : undefined,
    },
    className: `${dropTargetClass(dropTarget)} ${pending ? PENDING : ''}`,
  };
}

export function DropSideIndicator({ side }: { side: 'before' | 'after' | null }) {
  if (side === 'before') return <div className={DROP_INDICATOR_BEFORE} />;
  if (side === 'after') return <div className={DROP_INDICATOR_AFTER} />;
  return null;
}

// Story 6, hands-on finding 3 (2026-09-24): the zoom-in cue — shown only
// once the dwell has elapsed (`useZoomCandidatePhase` returns `'cue'`; the
// dwell itself shows nothing new beyond the blue line, wiki §6). Absolutely
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
