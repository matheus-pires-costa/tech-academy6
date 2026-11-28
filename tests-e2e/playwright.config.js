const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './specs',
  timeout: 30000,
  use: {
    baseURL: 'https://cnestetica.local',
    ignoreHTTPSErrors: true,
    headless: true,
    viewport: { width: 1280, height: 800 }
  }
});