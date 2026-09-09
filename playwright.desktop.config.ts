import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './desktop-tests',
  outputDir: 'desktop-test-results',
  workers: 1,
  retries: 0,
  forbidOnly: true,
  timeout: 60_000,
  reporter: 'list',
})
