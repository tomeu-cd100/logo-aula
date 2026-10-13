import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:8123', acceptDownloads: true },
  webServer: {
    command: 'node tests/serve.mjs 8123',
    url: 'http://localhost:8123',
    reuseExistingServer: true,
  },
});
