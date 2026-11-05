import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCollapsedProjects } from './useCollapsedProjects';

describe('useCollapsedProjects', () => {
  it('starts with no project collapsed, so every project is open, a new one included', () => {
    const { result } = renderHook(() => useCollapsedProjects());
    expect(result.current.collapsedIds.size).toBe(0);
  });

  it('toggles a project closed and open again', () => {
    const { result } = renderHook(() => useCollapsedProjects());

    act(() => result.current.toggle('P'));
    expect(result.current.collapsedIds).toEqual(new Set(['P']));

    act(() => result.current.toggle('P'));
    expect(result.current.collapsedIds.size).toBe(0);
  });

  it('keeps each project’s own collapse apart', () => {
    const { result } = renderHook(() => useCollapsedProjects());

    act(() => {
      result.current.toggle('P');
      result.current.toggle('Q');
    });
    act(() => result.current.toggle('P'));

    expect(result.current.collapsedIds).toEqual(new Set(['Q']));
  });

  it('opens a collapsed project when a write puts a project under it, which wins over a collapse set by hand', () => {
    const { result } = renderHook(() => useCollapsedProjects());
    act(() => {
      result.current.toggle('P');
      result.current.toggle('Q');
    });

    act(() => result.current.expand('P'));

    expect(result.current.collapsedIds).toEqual(new Set(['Q']));
  });

  it('leaves an open project, and the set itself, as it is', () => {
    const { result } = renderHook(() => useCollapsedProjects());
    act(() => result.current.toggle('Q'));
    const before = result.current.collapsedIds;

    act(() => result.current.expand('P'));

    expect(result.current.collapsedIds).toBe(before);
  });
});
