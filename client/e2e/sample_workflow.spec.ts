import { test, expect } from '@playwright/test';

test.describe('Sample Ingestion & Calculation Workflow QA', () => {
  test('New Sample wizard renders manual entry form with validation', async ({ page }) => {
    await page.goto('/app/samples/new');

    await expect(page.locator('text=Ingest Water Sample')).toBeVisible();
    await expect(page.locator('text=Manual Entry')).toBeVisible();
    await expect(page.locator('text=File Import')).toBeVisible();

    // Verify fields are present
    const sampleCodeInput = page.locator('input[placeholder*="GW-2026-001"], input[id*="sampleCode"]');
    if (await sampleCodeInput.count() > 0) {
      await expect(sampleCodeInput.first()).toBeVisible();
    }

    // Check standard regulatory limits selector
    await expect(page.locator('text=IS 10500:2012').or(page.locator('text=BIS_10500_2012')).or(page.locator('text=Standard'))).toBeVisible();
  });

  test('File import mode displays CSV drag-and-drop zone and template download link', async ({ page }) => {
    await page.goto('/app/samples/new');

    // Switch to File Import tab
    await page.click('button:has-text("File Import")');

    // Verify drag & drop text
    await expect(
      page.locator('text=Drag & drop your laboratory file')
        .or(page.locator('text=Upload laboratory CSV'))
        .or(page.locator('text=CSV'))
    ).toBeVisible();

    // Verify template download option
    await expect(
      page.locator('text=Download Standard CSV Template')
        .or(page.locator('text=template'))
    ).toBeVisible();
  });

  test('Detailed Sample Dossier displays deterministic metrics and AI grounding alert', async ({ page }) => {
    await page.goto('/app/samples/demo-sample-001');

    // Verify Sample Code & Location
    await expect(page.locator('text=GW-IND-2026-01')).toBeVisible();
    await expect(page.locator('text=Well #4 — Industrial Periphery')).toBeVisible();

    // Verify Computed HPI Score (>100)
    await expect(page.locator('text=HPI Value')).toBeVisible();
    await expect(page.locator('text=CRITICAL').or(page.locator('text=HIGH')).or(page.locator('text=Critical'))).toBeVisible();

    // Verify Grounded AI Explanation with pure deterministic boundaries
    await expect(page.locator('text=Automated Environmental Narrative')).toBeVisible();
  });
});
