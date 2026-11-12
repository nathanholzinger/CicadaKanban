// useEscapeKey: a surface's Escape, on one document listener for as long as the surface is mounted.

import { useEffect, useLayoutEffect, useRef } from 'react';

// Calls the latest `onEscape` for an Escape pressed anywhere in the document. The listener is added
// once and reads the handler through a ref, never added again for a new handler: a listener put on
// the document while a keypress is being delivered to the document's listeners is not called for
// that keypress, and the one it replaced is gone. So an Escape during which an earlier listener
// makes React flush its effects would be lost to a listener that follows the handler by re-adding
// itself. dnd-kit's pointer sensor is such a listener: it keeps a keydown listener on the document
// for a moment after every press on a draggable row, a click included, and its Escape sets state.
//
// The ref is set in a layout effect, as the render commits, so a keypress never finds the handler
// of a render older than the one on screen.
export function useEscapeKey(onEscape: () => void): void {
  const latest = useRef(onEscape);
  useLayoutEffect(() => {
    latest.current = onEscape;
  });
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') latest.current();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
}
