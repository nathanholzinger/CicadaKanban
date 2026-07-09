import { afterEach, beforeEach, vi } from 'vitest';
import { resetTestDb } from '../src/db/resetTestDb.js';

beforeEach(() => {
  resetTestDb();
});

afterEach(() => {
  vi.restoreAllMocks();
});
