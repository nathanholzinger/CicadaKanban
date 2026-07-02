import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  outputDir: './tests/output/artifacts',
  reporter: [['html', { outputFolder: './tests/output/report' }]],
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
  webServer: [
    {
      command: 'npm run dev',
      cwd: './server',
      port: 3002,
      env: { ...process.env, PORT: '3002', DB_PATH: './data/test.db', ENABLE_TEST_ROUTES: 'true' },
      reuseExistingServer: false,
    },
    {
      command: 'npm run dev',
      cwd: './client',
      port: 5174,
      env: { ...process.env, VITE_PORT: '5174', VITE_API_TARGET: 'http://localhost:3002' },
      reuseExistingServer: false,
    },
  ],
});
