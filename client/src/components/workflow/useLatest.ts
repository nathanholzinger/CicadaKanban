// useLatest: the "latest value" ref for a callback that outlives the render that made it.

import { useEffect, useRef, type RefObject } from 'react';

// A ref holding the value from the most recent render, for the pointer, timer and
// dnd-kit callbacks that live across renders and must never close over a stale one.
// Updated in a passive effect, so it reads the previous render's value until this hook's effect
// runs after the commit, later than that commit's layout effects. Call it first at each site,
// so its effect runs ahead of the component's other passive effects that read the ref.
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}
