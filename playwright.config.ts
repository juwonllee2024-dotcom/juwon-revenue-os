import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results/playwright',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:10640',
    channel: 'chrome',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm.cmd run dev',
    url: 'http://127.0.0.1:10640',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NEXT_DIST_DIR: '.next-e2e',
      REVENUE_OS_DATA_DIR: './test-results/playwright/data',
      REVENUE_OS_ARTIFACT_DIR: './test-results/playwright/artifacts',
    },
  },
});
