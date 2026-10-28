// Storage fakes for the tests of what persists in the browser (`lib/browserStorage.ts`): a
// storage held in memory, and one that refuses every read and write, as blocked site data or a
// full quota does.

import type { KeyValueStorage } from '../lib/browserStorage';

export function memoryStorage(
  initial: Record<string, string> = {},
): KeyValueStorage & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: key => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

export const refusingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
};
