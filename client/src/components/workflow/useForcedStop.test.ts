import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { STOP_FLASH_MS, type ForcedStop } from './forcedStop';
import { useForcedStop } from './useForcedStop';

const stop: ForcedStop = { cause: 'write-failed', itemId: 'x' };

describe('useForcedStop', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('DRAG-6.19: holds a reported stop for the cue’s time, and then lets it go', () => {
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

  it('DRAG-6.18: lets it go at the next drag’s start, without waiting out the time', () => {
    const { result } = renderHook(() => useForcedStop(5000));
    act(() => result.current.report(stop));

    act(() => result.current.clear());

    expect(result.current.stop).toBeNull();
  });

  it('gives each stop its own key, so one that replaces a live stop is told apart from it', () => {
    const { result } = renderHook(() => useForcedStop(5000));
    expect(result.current.stopKey).toBeUndefined();

    act(() => result.current.report(stop));
    const first = result.current.stopKey;
    act(() => result.current.report({ cause: 'refresh', itemId: 'y' }));

    expect(result.current.stopKey).not.toBe(first);
    expect(result.current.stop?.itemId).toBe('y');
  });

  // The flash's own lifetime, apart from the banner's: named by the stop, waiting for the reload the
  // stop caused to draw the board, then playing for its own time, and let go by another reload.
  describe('the flash', () => {
    const advance = (ms: number) =>
      act(() => {
        vi.advanceTimersByTime(ms);
      });

    it('names the stopped item from the stop on, and has none before it', () => {
      const { result } = renderHook(() => useForcedStop(5000));
      expect(result.current.flashItemId).toBeNull();

      act(() => result.current.report(stop));
      expect(result.current.flashItemId).toBe('x');
    });

    it('is held across the stop’s own reload, however long it takes: the clock starts when the board is drawn', () => {
      const { result } = renderHook(() => useForcedStop(10_000));
      act(() => result.current.report(stop));
      // The stop's reload starts right after it is reported.
      act(() => result.current.reloadStarted());

      advance(STOP_FLASH_MS * 3);
      expect(result.current.flashItemId).toBe('x');

      act(() => result.current.boardDrawn());
      advance(STOP_FLASH_MS - 1);
      expect(result.current.flashItemId).toBe('x');
      advance(1);
      expect(result.current.flashItemId).toBeNull();
    });

    it('is let go once it has played, while the banner stays for its own time', () => {
      const { result } = renderHook(() => useForcedStop(5000));
      act(() => result.current.report(stop));
      act(() => result.current.reloadStarted());
      act(() => result.current.boardDrawn());

      advance(STOP_FLASH_MS);
      expect(result.current.flashItemId).toBeNull();
      expect(result.current.stop).toBe(stop);

      advance(5000 - STOP_FLASH_MS);
      expect(result.current.stop).toBeNull();
    });

    it('is let go when another reload starts after it has been drawn, so its rows don’t flash again', () => {
      const { result } = renderHook(() => useForcedStop(5000));
      act(() => result.current.report(stop));
      act(() => result.current.reloadStarted());
      act(() => result.current.boardDrawn());
      advance(STOP_FLASH_MS / 2);
      expect(result.current.flashItemId).toBe('x');

      // A stale response's refresh, with no drag running, so no stop is reported for it.
      act(() => result.current.reloadStarted());
      expect(result.current.flashItemId).toBeNull();
      act(() => result.current.boardDrawn());
      expect(result.current.flashItemId).toBeNull();
      // The banner is the stop's, and no reload takes it away.
      expect(result.current.stop).toBe(stop);
    });

    it('is not drawn at all by a reload that finishes with no stop behind it', () => {
      const { result } = renderHook(() => useForcedStop(5000));
      act(() => result.current.reloadStarted());
      act(() => result.current.boardDrawn());
      expect(result.current.flashItemId).toBeNull();
    });

    it('is let go at the next drag’s start, with the banner', () => {
      const { result } = renderHook(() => useForcedStop(5000));
      act(() => result.current.report(stop));

      act(() => result.current.clear());

      expect(result.current.flashItemId).toBeNull();
      expect(result.current.stop).toBeNull();
    });

    it('goes to a second stop’s item, which waits for its own reload', () => {
      const { result } = renderHook(() => useForcedStop(5000));
      act(() => result.current.report(stop));
      act(() => result.current.reloadStarted());
      act(() => result.current.boardDrawn());

      act(() => result.current.report({ cause: 'refresh', itemId: 'y' }));
      act(() => result.current.reloadStarted());
      expect(result.current.flashItemId).toBe('y');

      advance(STOP_FLASH_MS * 2);
      expect(result.current.flashItemId).toBe('y');
      act(() => result.current.boardDrawn());
      advance(STOP_FLASH_MS);
      expect(result.current.flashItemId).toBeNull();
    });
  });
});
