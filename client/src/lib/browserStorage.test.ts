import { afterEach, describe, expect, it } from 'vitest';
import { memoryStorage, refusingStorage } from '../test/storageFixtures';
import { browserStorage, readStored, writeStored } from './browserStorage';

// `localStorage` as the page sees it, put back after a test that replaces it.
const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
afterEach(() => {
  if (original) Object.defineProperty(globalThis, 'localStorage', original);
});

describe('browserStorage', () => {
  it('is the browser’s localStorage', () => {
    expect(browserStorage()).toBe(localStorage);
  });

  it('is null where there is no localStorage', () => {
    Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
    expect(browserStorage()).toBeNull();
  });

  it('is null where reaching localStorage throws', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
      configurable: true,
    });
    expect(browserStorage()).toBeNull();
  });
});

describe('readStored', () => {
  it('is the value stored under the key', () => {
    expect(readStored(memoryStorage({ k: 'v' }), 'k')).toBe('v');
  });

  it('is null when nothing is stored, there is no storage, or the read throws', () => {
    expect(readStored(memoryStorage(), 'k')).toBeNull();
    expect(readStored(null, 'k')).toBeNull();
    expect(readStored(refusingStorage, 'k')).toBeNull();
  });
});

describe('writeStored', () => {
  it('stores the value under the key', () => {
    const storage = memoryStorage();
    writeStored(storage, 'k', 'v');
    expect(storage.data).toEqual({ k: 'v' });
  });

  it('does nothing without storage, and survives a write that throws', () => {
    expect(() => writeStored(null, 'k', 'v')).not.toThrow();
    expect(() => writeStored(refusingStorage, 'k', 'v')).not.toThrow();
  });
});
