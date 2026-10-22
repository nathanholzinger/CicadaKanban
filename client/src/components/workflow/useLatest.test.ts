import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLatest } from './useLatest';

describe('useLatest', () => {
  it('holds the value from the most recent render, in the same ref throughout', () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), { initialProps: { value: 'first' } });
    const ref = result.current;
    expect(ref.current).toBe('first');

    rerender({ value: 'second' });
    expect(result.current).toBe(ref);
    expect(ref.current).toBe('second');
  });
});
