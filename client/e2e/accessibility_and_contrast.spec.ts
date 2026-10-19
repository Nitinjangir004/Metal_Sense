import { test, expect } from '@playwright/test';

test.describe('WCAG 2.2 AA Accessibility & Scientific Integrity QA', () => {
  test('All primary pages contain unique semantic H1 tags and main landmark', async ({ page }) => {
    const routes = [
      { path: '/', expectedH1: 'Heavy Metal Pollution Intelligence' },
      { path: '/app', expectedH1: 'Aquifer Monitoring Dashboard' },
      { path: '/app/analytics', expectedH1: 'Analytical Comparison & Trends' },
      { path: '/app/map', expectedH1: 'Geospatial Aquifer Map' },
      { path: '/app/reports', expectedH1: 'Auditable Environmental Reports' },
      { path: '/app/methodology', expectedH1: 'Scientific Methodology & Indices' },
    ];

    for (const r of routes) {
      await page.goto(r.path);
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText(r.expectedH1);

      // Verify main semantic tag exists
      const main = page.locator('main');
      await expect(main).toBeVisible();
    }
  });

  test('Form controls possess accessible labels or aria-labels', async ({ page }) => {
    await page.goto('/app/analytics');

    // Check selects have accessible aria-labels
    const selects = page.locator('select');
    const count = await selects.count();
    for (let i = 0; i < count; i++) {
      const select = selects.nth(i);
      const ariaLabel = await select.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('Scientific disclaimers are prominent on reports and calculations', async ({ page }) => {
    await page.goto('/app/reports');

    await expect(page.locator('text=Reproducible Audit Guarantee')).toBeVisible();
    await expect(page.locator('text=Methodological Disclaimers & Assumptions')).toBeVisible();
    await expect(page.locator('text=v1.0.0-deterministic')).toBeVisible();
  });
});
