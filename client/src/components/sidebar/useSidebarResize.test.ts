import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { PointerEvent } from 'react';
import {
  SIDEBAR_DEFAULT_WIDTH_PX,
  SIDEBAR_MAX_WIDTH_PX,
  SIDEBAR_MIN_WIDTH_PX,
  SIDEBAR_WIDTH_STORAGE_KEY,
} from './sidebarWidth';
import { useSidebarResize } from './useSidebarResize';

beforeEach(() => {
  localStorage.clear();
});

// The pointer event the handle's handlers read: where the pointer is, which
// button, and the element they capture the pointer on.
function pointer(clientX: number, button = 0) {
  const setPointerCapture = vi.fn();
  const event = { clientX, button, pointerId: 1, currentTarget: { setPointerCapture } };
  return { event: event as unknown as PointerEvent<HTMLElement>, setPointerCapture };
}

function setup() {
  const { result } = renderHook(() => useSidebarResize());
  return {
    get hook() {
      return result.current;
    },
    down: (x: number, button?: number) => {
      const { event, setPointerCapture } = pointer(x, button);
      act(() => result.current.handleProps.onPointerDown(event));
      return setPointerCapture;
    },
    move: (x: number) => act(() => result.current.handleProps.onPointerMove(pointer(x).event)),
    up: () => act(() => result.current.handleProps.onPointerUp()),
    cancel: () => act(() => result.current.handleProps.onPointerCancel()),
  };
}

const stored = () => localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);

describe('useSidebarResize', () => {
  it('starts at the default width', () => {
    const sidebar = setup();
    expect(sidebar.hook.width).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    expect(sidebar.hook.resizing).toBe(false);
  });

  it('starts at the stored width', () => {
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, '333');
    expect(setup().hook.width).toBe(333);
  });

  it('follows the pointer from where it was grabbed, and captures it', () => {
    const sidebar = setup();
    const setPointerCapture = sidebar.down(240);
    expect(setPointerCapture).toHaveBeenCalledWith(1);
    expect(sidebar.hook.resizing).toBe(true);

    sidebar.move(300);
    expect(sidebar.hook.width).toBe(SIDEBAR_DEFAULT_WIDTH_PX + 60);
    sidebar.move(200);
    expect(sidebar.hook.width).toBe(SIDEBAR_DEFAULT_WIDTH_PX - 40);
  });

  it('keeps the width inside the limits while the pointer goes past them', () => {
    const sidebar = setup();
    sidebar.down(240);
    sidebar.move(5000);
    expect(sidebar.hook.width).toBe(SIDEBAR_MAX_WIDTH_PX);
    sidebar.move(-5000);
    expect(sidebar.hook.width).toBe(SIDEBAR_MIN_WIDTH_PX);
    sidebar.move(240 + 20);
    expect(sidebar.hook.width).toBe(SIDEBAR_DEFAULT_WIDTH_PX + 20);
  });

  it('stores the width on release, not while the pointer moves', () => {
    const sidebar = setup();
    sidebar.down(240);
    sidebar.move(300);
    expect(stored()).toBeNull();

    sidebar.up();
    expect(stored()).toBe('300');
    expect(sidebar.hook.resizing).toBe(false);
    expect(sidebar.hook.width).toBe(300);
  });

  it('stores the clamped width when the release is past a limit', () => {
    const sidebar = setup();
    sidebar.down(240);
    sidebar.move(5000);
    sidebar.up();
    expect(stored()).toBe(String(SIDEBAR_MAX_WIDTH_PX));
  });

  it('ends a cancelled gesture where it stands, stored', () => {
    const sidebar = setup();
    sidebar.down(240);
    sidebar.move(280);
    sidebar.cancel();
    expect(stored()).toBe('280');
    expect(sidebar.hook.resizing).toBe(false);
  });

  it('ignores a pointer that moves when nothing was grabbed', () => {
    const sidebar = setup();
    sidebar.move(400);
    expect(sidebar.hook.width).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
    sidebar.up();
    expect(stored()).toBeNull();
  });

  it('ignores a pointer moving after the release', () => {
    const sidebar = setup();
    sidebar.down(240);
    sidebar.move(300);
    sidebar.up();
    sidebar.move(100);
    expect(sidebar.hook.width).toBe(300);
    expect(stored()).toBe('300');
  });

  it('is not grabbed by a button other than the primary one', () => {
    const sidebar = setup();
    const setPointerCapture = sidebar.down(240, 2);
    expect(setPointerCapture).not.toHaveBeenCalled();
    expect(sidebar.hook.resizing).toBe(false);
    sidebar.move(300);
    expect(sidebar.hook.width).toBe(SIDEBAR_DEFAULT_WIDTH_PX);
  });

  it('measures a second grab from the width the first left', () => {
    const sidebar = setup();
    sidebar.down(240);
    sidebar.move(300);
    sidebar.up();

    sidebar.down(300);
    sidebar.move(280);
    expect(sidebar.hook.width).toBe(280);
  });
});
