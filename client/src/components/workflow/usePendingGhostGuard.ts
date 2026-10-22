// The active drag's ghost against pending writes
// (wiki board-drag-interaction §10): `setGhost` is the one place the ghost
// is set; the reassert effect puts it back the instant a response landing
// mid-drag clears it (a re-drag of an item whose earlier write is still
// outstanding); `restorePriorPlacement` brings back the item's pre-drag
// pending marker on a cancel or a release that writes nothing.

import { useEffect, useRef, type RefObject } from 'react';
import type { Placement, Placements } from './itemListOps';
import type { ItemWriteTracker } from './useItemManagement';
import type { DragSession } from './DragSessionContext';
import { useLatest } from './useLatest';

export interface PendingGhostDeps {
  placements: Placements;
  previewPlacement: (itemId: string, placement: Placement | null) => void;
  writes: ItemWriteTracker;
}

// `wantedPlacementRef` is compared by reference, not mere presence:
// `previewPlacement` stores exactly the object it's given, so an unmolested
// placement reads back `===` this. `latest` is the usual "read fresh props
// from a callback that outlives the render that made it" ref, so the
// reassert effect doesn't retrigger on every prop change.
export function usePendingGhostGuard(sessionRef: RefObject<DragSession | null>, deps: PendingGhostDeps) {
  const wantedPlacementRef = useRef<Placement | null>(null);
  const latest = useLatest(deps);

  function setGhost(itemId: string, placement: Placement | null) {
    wantedPlacementRef.current = placement;
    latest.current.previewPlacement(itemId, placement);
  }

  function restorePriorPlacement(ended: DragSession) {
    const restore = latest.current.writes.isPending(ended.activeItem.id) ? ended.priorPlacement : null;
    latest.current.previewPlacement(ended.activeItem.id, restore);
  }

  useEffect(() => {
    const current = sessionRef.current;
    if (!current) return;
    const wanted = wantedPlacementRef.current;
    if ((latest.current.placements.get(current.activeItem.id) ?? null) === wanted) return;
    latest.current.previewPlacement(current.activeItem.id, wanted);
    // `sessionRef` and `latest` are stable refs — listing them costs nothing and
    // satisfies exhaustive-deps, which can't trace a ref's stability across a
    // function boundary.
  }, [deps.placements, sessionRef, latest]);

  return { setGhost, restorePriorPlacement };
}
