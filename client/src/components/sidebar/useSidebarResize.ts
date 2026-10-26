// The sidebar's width, and the pointer handlers for the handle on its right
// edge. Plain pointer events with pointer capture, not a dnd-kit draggable, so
// the handle can't interfere with the sidebar's own DndContext.

import { useRef, useState, type PointerEvent } from 'react';
import { clampSidebarWidth, loadSidebarWidth, saveSidebarWidth } from './sidebarWidth';

interface Grab {
  startX: number;
  startWidth: number;
  /** The width the last move gave, which the release stores. */
  width: number;
}

export function useSidebarResize() {
  const [width, setWidth] = useState(() => loadSidebarWidth());
  const [resizing, setResizing] = useState(false);
  const grab = useRef<Grab | null>(null);

  function handlePointerDown(e: PointerEvent<HTMLElement>) {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    grab.current = { startX: e.clientX, startWidth: width, width };
    setResizing(true);
  }

  function handlePointerMove(e: PointerEvent<HTMLElement>) {
    if (!grab.current) return;
    const next = clampSidebarWidth(grab.current.startWidth + e.clientX - grab.current.startX);
    grab.current.width = next;
    setWidth(next);
  }

  // A release and a cancelled gesture both end the resize where it stands.
  function handlePointerEnd() {
    if (!grab.current) return;
    saveSidebarWidth(grab.current.width);
    grab.current = null;
    setResizing(false);
  }

  return {
    width,
    resizing,
    handleProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerEnd,
      onPointerCancel: handlePointerEnd,
    },
  };
}
