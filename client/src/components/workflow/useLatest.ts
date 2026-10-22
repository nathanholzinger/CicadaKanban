// useLatest: the "latest value" ref for a callback that outlives the render that made it.

import { useEffect, useRef, type RefObject } from 'react';

// A ref holding the value from the most recent render, for the pointer, timer and
// dnd-kit callbacks that live across renders and must never close over a stale one.
// Updated in an effect, so it reads the previous render's value until the commit; call
// it first at each site, so the effect keeps its place among the hook's own effects.
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
