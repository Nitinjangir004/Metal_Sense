import { test, expect } from '@playwright/test';

test.describe('Landing Page & Core Navigation QA', () => {
  test('Landing page renders hero, scientific integrity statements, and CTAs', async ({ page }) => {
    await page.goto('/');

    // Check title and brand
    await expect(page).toHaveTitle(/MetalSense/);
    await expect(page.locator('text=MetalSense')).toBeVisible();

    // Check CTAs
    const analyzeBtn = page.locator('text=Analyze a Sample').first();
    const demoBtn = page.locator('text=Explore Demo').first();
    await expect(analyzeBtn).toBeVisible();
    await expect(demoBtn).toBeVisible();

    // Check Scientific Integrity Alert
    await expect(page.locator('text=Scientific Integrity Guarantee')).toBeVisible();

    // Verify mathematical formula documentation
    await expect(page.locator('text=Deterministic Environmental Indices')).toBeVisible();
    await expect(page.locator('text=Heavy Metal Pollution Index (HPI)')).toBeVisible();
  });

  test('Navigates into authenticated dashboard via Explore Demo', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Explore Demo');

    await expect(page).toHaveURL(/.*\/app/);
    await expect(page.locator('text=Aquifer Monitoring Dashboard')).toBeVisible();
    await expect(page.locator('text=BENCHMARK DATASET')).toBeVisible();
  });

  test('Responsive layout test: No horizontal viewport overflow across devices', async ({ page }) => {
    await page.goto('/app');

    // Verify that body scrollWidth equals clientWidth (no overflow blowout)
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    expect(isOverflowing).toBe(false);
  });

  test('Navigation tabs route to Analytics, Map, Reports, and Methodology', async ({ page }) => {
    await page.goto('/app');

    // Analytics
    await page.click('a[href="/app/analytics"]');
    await expect(page).toHaveURL(/.*\/app\/analytics/);
    await expect(page.locator('text=Analytical Comparison & Trends')).toBeVisible();

    // Geospatial Map
    await page.click('a[href="/app/map"]');
    await expect(page).toHaveURL(/.*\/app\/map/);
    await expect(page.locator('text=Geospatial Aquifer Map')).toBeVisible();

    // Reports
    await page.click('a[href="/app/reports"]');
    await expect(page).toHaveURL(/.*\/app\/reports/);
    await expect(page.locator('text=Auditable Environmental Reports')).toBeVisible();

    // Methodology
    await page.click('a[href="/app/methodology"]');
    await expect(page).toHaveURL(/.*\/app\/methodology/);
    await expect(page.locator('text=Scientific Methodology & Indices')).toBeVisible();
  });
});
