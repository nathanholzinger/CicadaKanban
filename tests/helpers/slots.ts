// The E2E stack pool, spelled once for the config, the API helper, the browser
// fixture and the teardown. A slot is one of Playwright's parallel indexes, 0 to
// N-1, and owns one server, one client and one database. A restarted worker
// keeps its slot's parallel index, so it comes back to the same stack.
//
// The ports and files sit in a block clear of the dev (3001/5173), old E2E
// (3002/5174) and deep (3003/5175) stacks, so those can stay open during a run.

// Five workers by default. `E2E_WORKERS` overrides it, and
// the config starts that many stacks only.
const DEFAULT_WORKERS = 5;
const SERVER_PORT_BASE = 3010;
const CLIENT_PORT_BASE = 5180;

export function workerCount(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.E2E_WORKERS;
  if (raw === undefined || raw === '') return DEFAULT_WORKERS;
  const count = Number(raw);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`E2E_WORKERS must be a whole number, 1 or more. Got "${raw}".`);
  }
  return count;
}

// The slot of the worker this process is, from `TEST_PARALLEL_INDEX`, which
// Playwright sets in every worker's environment. Outside a worker (the runner
// listing tests, say) it is 0.
export function currentSlot(env: NodeJS.ProcessEnv = process.env): number {
  return Number(env.TEST_PARALLEL_INDEX ?? 0);
}

export const serverPort = (slot: number) => SERVER_PORT_BASE + slot;
export const clientPort = (slot: number) => CLIENT_PORT_BASE + slot;
export const apiUrl = (slot: number) => `http://localhost:${serverPort(slot)}/api`;
export const clientUrl = (slot: number) => `http://localhost:${clientPort(slot)}`;

// Relative to `server/`, where the slot's server runs.
export const dbPath = (slot: number) => `./data/test-${slot}.db`;
// The files SQLite leaves for a database, in `server/data/`.
export const dbFiles = (slot: number) => [`test-${slot}.db`, `test-${slot}.db-wal`, `test-${slot}.db-shm`];
