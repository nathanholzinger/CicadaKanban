import { defineConfig, devices } from '@playwright/test';
import { clientPort, clientUrl, dbPath, serverPort, workerCount } from './tests/helpers/slots';

// One server and client pair per worker slot, each with its own database
// (`tests/helpers/slots.ts`). `E2E_WORKERS` sets the worker count and starts
// that many stacks only.
const WORKERS = workerCount();
const slots = Array.from({ length: WORKERS }, (_, slot) => slot);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: WORKERS,
  outputDir: './tests/output/artifacts',
  // The JSON report keeps per-test durations from every run. Name it per run with
  // PLAYWRIGHT_JSON_OUTPUT_NAME so a targeted re-run doesn't overwrite a full run's.
  reporter: [
    ['html', { outputFolder: './tests/output/report' }],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ?? './tests/output/results.json' }],
    // Removes the databases once the servers are stopped. See its header.
    ['./tests/helpers/removeDatabasesReporter.ts'],
  ],
  use: {
    // Slot 0's client; tests/fixtures.ts gives each worker its own slot's.
    baseURL: clientUrl(0),
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './tests/global-setup.ts',
  // A stack is started for the run and never reused or moved: a leftover server
  // on the wrong database, or a client that picked another port, would quietly
  // break the isolation. The server runs without watch, so an edit under
  // server/src mid-run can't restart it; the client fails on a taken port.
  webServer: slots.flatMap(slot => [
    {
      name: `server ${slot}`,
      command: 'npm run start:e2e',
      cwd: './server',
      port: serverPort(slot),
      env: {
        ...process.env,
        PORT: String(serverPort(slot)),
        DB_PATH: dbPath(slot),
        ENABLE_TEST_ROUTES: 'true',
      },
      reuseExistingServer: false,
    },
    {
      name: `client ${slot}`,
      command: 'npm run dev -- --strictPort',
      cwd: './client',
      port: clientPort(slot),
      env: {
        ...process.env,
        VITE_PORT: String(clientPort(slot)),
        VITE_API_TARGET: `http://localhost:${serverPort(slot)}`,
      },
      reuseExistingServer: false,
    },
  ]),
});
