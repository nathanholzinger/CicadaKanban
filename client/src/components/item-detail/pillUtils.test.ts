import { describe, it, expect } from 'vitest';
import {
  depthLabel,
  typePillStyle,
  typePillClass,
  formatTime,
  PILL,
  PILL_NEUTRAL,
  MINI,
  MINI_NEUTRAL,
} from './pillUtils';
import type { ItemType } from '../../types';

function itemType(overrides: Partial<ItemType> & { id: string }): ItemType {
  return { name: overrides.id, color: null, createdAt: 0, ...overrides };
}

describe('depthLabel', () => {
  it('returns "TOP" for depth 0', () => {
    expect(depthLabel(0)).toBe('TOP');
  });

  it('returns "SUB{n}" for depth above 0', () => {
    expect(depthLabel(1)).toBe('SUB1');
    expect(depthLabel(3)).toBe('SUB3');
  });
});

describe('typePillStyle', () => {
  it('returns undefined when typeId is null', () => {
    expect(typePillStyle(null, [])).toBeUndefined();
  });

  it('returns undefined when typeId does not match any itemType', () => {
    const types = [itemType({ id: 't1', color: '#ff0000' })];
    expect(typePillStyle('missing', types)).toBeUndefined();
  });

  it('returns undefined when the matched type has no color', () => {
    const types = [itemType({ id: 't1', color: null })];
    expect(typePillStyle('t1', types)).toBeUndefined();
  });

  it("derives backgroundColor/borderColor/color from the matched type's color", () => {
    const types = [itemType({ id: 't1', color: '#ff0000' })];
    expect(typePillStyle('t1', types)).toEqual({
      backgroundColor: '#ff000033',
      borderColor: '#ff000066',
      color: '#ff0000',
    });
  });
});

describe('typePillClass', () => {
  it('returns the neutral class when typeId is null or unmatched', () => {
    expect(typePillClass(null, [])).toBe(PILL_NEUTRAL);
    expect(typePillClass('missing', [itemType({ id: 't1', color: '#ff0000' })])).toBe(PILL_NEUTRAL);
  });

  it('returns the base (colored) class when matched with a color', () => {
    const types = [itemType({ id: 't1', color: '#ff0000' })];
    expect(typePillClass('t1', types)).toBe(PILL);
  });

  it('returns the mini variants when mini=true', () => {
    const types = [itemType({ id: 't1', color: '#ff0000' })];
    expect(typePillClass(null, [], true)).toBe(MINI_NEUTRAL);
    expect(typePillClass('t1', types, true)).toBe(MINI);
  });
});

describe('formatTime', () => {
  it('formats a timestamp including day-of-month and an hour:minute component', () => {
    const ts = new Date(2026, 2, 15, 14, 30).getTime(); // Mar 15, 2026, 14:30 local time
    const result = formatTime(ts);
    expect(result).toContain('15');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
    expect(result.length).toBeGreaterThan(0);
  });
});
