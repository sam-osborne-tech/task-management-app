import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests against production.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially to avoid race conditions on shared data
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker to ensure test isolation
  reporter: [['html'], ['list']],
  timeout: 30000,
  
  use: {
    baseURL: 'https://task-management-app-production-e866.up.railway.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
