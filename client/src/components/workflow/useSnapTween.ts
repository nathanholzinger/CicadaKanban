// The snap of §3 (docs/wiki/board-drag-interaction): when a pop moves the
// carried copy's clamp target, the copy eases there over `popSnapMs` from
// wherever it was last drawn, instead of jumping. `start` begins a tween (a
// pop), `draw` is the clamp modifier's last step — the drawn point for a
// target — and `cancel` stops it. Each frame re-renders, since the cursor
// may be perfectly still while a tween runs.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Point } from './dragRegions';

interface SnapTween {
  from: Point;
  startedAt: number;
}

export function useSnapTween(durationMs: number) {
  const duration = useRef(durationMs);
  useEffect(() => {
    duration.current = durationMs;
  });
  const drawnAt = useRef<Point>({ x: 0, y: 0 });
  const tween = useRef<SnapTween | null>(null);
  const frame = useRef<number | null>(null);
  const [, setTick] = useState(0);

  const cancel = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    tween.current = null;
  }, []);

  const start = useCallback(() => {
    cancel();
    if (duration.current <= 0) return;
    tween.current = { from: { ...drawnAt.current }, startedAt: performance.now() };
    const step = () => {
      const active = tween.current;
      if (!active) return;
      if (performance.now() - active.startedAt >= duration.current) {
        tween.current = null;
        frame.current = null;
      } else {
        frame.current = requestAnimationFrame(step);
      }
      setTick(t => t + 1);
    };
    frame.current = requestAnimationFrame(step);
  }, [cancel]);

  const draw = useCallback(<T extends Point>(target: T): T => {
    const active = tween.current;
    let drawn = target;
    if (active) {
      const progress = Math.min(1, (performance.now() - active.startedAt) / duration.current);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic: fast start, settles
      drawn = {
        ...target,
        x: active.from.x + (target.x - active.from.x) * eased,
        y: active.from.y + (target.y - active.from.y) * eased,
      };
    }
    drawnAt.current = { x: drawn.x, y: drawn.y };
    return drawn;
  }, []);

  return { start, cancel, draw };
}
