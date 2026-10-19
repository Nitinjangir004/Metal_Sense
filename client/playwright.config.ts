import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop 1440px',
      use: {
        viewport: { width: 1440, height: 900 },
        userAgent: 'MetalSense E2E QA Test Runner (Desktop 1440px)',
      },
    },
    {
      name: 'Tablet 768px',
      use: {
        viewport: { width: 768, height: 1024 },
        userAgent: 'MetalSense E2E QA Test Runner (Tablet 768px)',
      },
    },
    {
      name: 'Mobile 390px',
      use: {
        viewport: { width: 390, height: 844 },
        userAgent: 'MetalSense E2E QA Test Runner (Mobile 390px)',
      },
    },
    {
      name: 'Mobile 360px',
      use: {
        viewport: { width: 360, height: 740 },
        userAgent: 'MetalSense E2E QA Test Runner (Mobile 360px)',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
