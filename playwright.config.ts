import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  outputDir: './tests/output/artifacts',
  // The JSON report keeps per-test durations from every run. Name it per run with
  // PLAYWRIGHT_JSON_OUTPUT_NAME so a targeted re-run doesn't overwrite a full run's.
  reporter: [
    ['html', { outputFolder: './tests/output/report' }],
    ['json', { outputFile: process.env.PLAYWRIGHT_JSON_OUTPUT_NAME ?? './tests/output/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
  // A stack is started for the run and never reused or moved: a leftover server
  // on the wrong database, or a client that picked another port, would quietly
  // break the isolation. The server runs without watch, so an edit under
  // server/src mid-run can't restart it; the client fails on a taken port.
  webServer: [
    {
      command: 'npm run start:e2e',
      cwd: './server',
      port: 3002,
      env: { ...process.env, PORT: '3002', DB_PATH: './data/test.db', ENABLE_TEST_ROUTES: 'true' },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev -- --strictPort',
      cwd: './client',
      port: 5174,
      env: { ...process.env, VITE_PORT: '5174', VITE_API_TARGET: 'http://localhost:3002' },
      reuseExistingServer: false,
    },
  ],
});
