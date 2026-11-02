import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ForcedStop } from './forcedStop';
import { useForcedStop } from './useForcedStop';

const stop: ForcedStop = { cause: 'write-failed', itemId: 'x' };

describe('useForcedStop', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('holds a reported stop for the cue’s time, and then lets it go', () => {
    const { result } = renderHook(() => useForcedStop(5000));
    expect(result.current.stop).toBeNull();

    act(() => result.current.report(stop));
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(result.current.stop).toBe(stop);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.stop).toBeNull();
  });

  it('lets it go at the next drag’s start, without waiting out the time', () => {
    const { result } = renderHook(() => useForcedStop(5000));
    act(() => result.current.report(stop));

    act(() => result.current.clear());

    expect(result.current.stop).toBeNull();
  });
});
