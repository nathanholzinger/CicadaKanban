import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    setupFiles: ['./tests/setup.ts'],

    // App code (runMigrations' seed logging, etc.) writes console output on
    // every resetTestDb() call — i.e. every test. 'passed-only' keeps that
    // out of green runs but still shows it for a failing test, where it might
    // be useful context.
    silent: 'passed-only',

    // All tests share one SQLite file (DB_PATH below). Parallel workers would
    // let two processes touch it at once (SQLITE_BUSY / WAL lock contention).
    // This forces maxWorkers to 1 so files run sequentially — fine at this
    // suite's size, and avoids restructuring around per-file temp DBs.
    fileParallelism: false,

    env: {
      // Distinct from Playwright's server/data/test.db to avoid collisions.
      DB_PATH: './data/vitest-test.db',
    },

    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        ...coverageConfigDefaults.exclude,
        'src/mcp.ts',
        'src/db/migrate.ts',
        'src/db/reset-test.ts',
        'src/db/schema.ts',
      ],
      thresholds: {
        // Epic 1 files: hard floor — test:coverage exits non-zero if any of
        // these four metrics drop below 80% for these three files. No global
        // threshold keys are set, so every other file is measured/reported
        // but cannot fail the run.
        'src/routes/projects.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/routes/workflows.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/routes/workflowTemplates.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/routes/boards.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
        'src/routes/columns.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
        // Epic 3.2: general position-resolution contract.
        'src/lib/positionResolver.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
});
