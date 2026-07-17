import { describe, it, expect } from 'vitest';
import { positionBetween } from './positions';

describe('positionBetween', () => {
  it('returns the midpoint when both neighbors exist', () => {
    expect(positionBetween(2.0, 3.0, () => 99)).toBe(2.5);
  });

  it('stays strictly between adjacent fractional neighbors', () => {
    const result = positionBetween(1.5, 1.75, () => 99);
    expect(result).toBeGreaterThan(1.5);
    expect(result).toBeLessThan(1.75);
  });

  it('appends after the previous neighbor when there is no next', () => {
    expect(positionBetween(4.0, null, () => 99)).toBe(5.0);
  });

  it('prepends before the next neighbor when there is no previous', () => {
    expect(positionBetween(null, 4.0, () => 99)).toBe(2.0);
  });

  it('falls back to whenEmpty when there are no neighbors at all', () => {
    expect(positionBetween(null, null, () => 42)).toBe(42);
  });
});
