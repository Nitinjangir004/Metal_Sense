const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, '../verification_screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: '1440px', width: 1440, height: 900 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '390px', width: 390, height: 844 },
];

const CONTRAST_EVAL_FN = () => {
  function parseColor(str) {
    if (!str || str === 'transparent' || str === 'inherit') return null;
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return null;
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1.0,
    };
  }

  function getLuminance(r, g, b) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  function getContrast(rgb1, rgb2) {
    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function getEffectiveBg(el) {
    let curr = el;
    while (curr && curr !== document.documentElement) {
      const style = window.getComputedStyle(curr);
      const bg = parseColor(style.backgroundColor);
      if (bg && bg.a > 0.05) {
        return bg;
      }
      curr = curr.parentElement;
    }
    return { r: 233, g: 244, b: 234, a: 1 }; // Default app page #E9F4EA
  }

  const issues = [];
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_ELEMENT,
    null,
    false
  );

  while (walker.nextNode()) {
    const el = walker.currentNode;
    if (!el || ['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT'].includes(el.tagName)) continue;

    let hasDirectText = false;
    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0) {
        hasDirectText = true;
        break;
      }
    }

    if (!hasDirectText) continue;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) {
      continue;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;

    const fg = parseColor(style.color);
    if (!fg) continue;

    const bg = getEffectiveBg(el);
    const contrast = getContrast(fg, bg);

    const fontSizePx = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
    const minRatio = isLarge ? 3.0 : 4.5;

    if (contrast < minRatio) {
      const textSample = el.textContent.trim().substring(0, 40).replace(/\s+/g, ' ');
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;

      issues.push({
        tag: el.tagName.toLowerCase(),
        text: textSample,
        contrast: Math.round(contrast * 100) / 100,
        minRequired: minRatio,
        fg: `rgb(${fg.r},${fg.g},${fg.b})`,
        bg: `rgb(${bg.r},${bg.g},${bg.b})`,
        fontSize: `${fontSizePx}px`,
        fontWeight,
      });
    }
  }

  return issues;
};

async function takeScreenshotWithRetry(page, filePath, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.screenshot({ path: filePath, fullPage: true });
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, 600));
    }
  }
}

async function main() {
  console.log('[Verification] Starting Playwright with Microsoft Edge...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  // 1. Create a dedicated test account via API
  const testEmail = `lead.hydrologist_${Date.now()}@metalsense.test`;
  const testPassword = 'SecureLaboratoryPassword2026!';
  const workspaceName = 'National Water Quality Monitoring Station';

  console.log(`[Verification] Creating user ${testEmail}...`);
  const signupRes = await fetch('http://localhost:5000/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Dr. Maya Sen',
      email: testEmail,
      password: testPassword,
      workspaceName,
    }),
  });

  const signupData = await signupRes.json();
  if (!signupData.data || !signupData.data.token) {
    throw new Error('Failed to sign up test user: ' + JSON.stringify(signupData));
  }

  const userToken = signupData.data.token;
  const workspaceId = signupData.data.workspaces[0].id;
  console.log(`[Verification] Created user ID: ${signupData.data.user.id}, Workspace: ${workspaceId}`);

  // 2. Ingest 5 benchmark water samples into the workspace
  console.log('[Verification] Ingesting benchmark water quality dataset...');
  const csvData = `SampleCode,CollectionDate,LocationName,Latitude,Longitude,As_mg_L,Pb_mg_L,Cd_mg_L,Cr_mg_L,Cu_mg_L,Fe_mg_L,Mn_mg_L,Ni_mg_L,Zn_mg_L
MS-DELHI-01,2026-03-21T09:00:00Z,Okhla Industrial Area GW-01,28.5355,77.2612,0.045,0.025,0.008,0.080,0.120,0.850,0.420,0.060,2.400
MS-DELHI-02,2026-03-21T10:30:00Z,Najafgarh Basin Borewell-4,28.6139,77.2090,0.012,0.008,<0.001,0.020,0.045,0.220,0.090,0.015,0.850
MS-DELHI-03,2026-03-21T11:45:00Z,Mayapuri CETP Outfall Wells,28.6366,77.1126,0.068,0.042,0.012,0.110,0.180,1.240,0.610,0.085,3.150
MS-DELHI-04,2026-03-21T13:15:00Z,Wazirabad Treatment Intake,28.7128,77.2289,0.004,0.003,<0.001,0.008,0.015,0.110,0.040,0.005,0.320
MS-DELHI-05,2026-03-21T14:30:00Z,Yamuna Floodplain Point-B,28.5833,77.3000,0.022,0.014,0.002,0.035,0.060,0.450,0.180,0.028,1.100`;

  const importRes = await fetch(`http://localhost:5000/api/v1/imports/${workspaceId}/csv`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({ csvText: csvData, fileName: 'delhi_groundwater_monitoring_2026.csv' }),
  });

  const importData = await importRes.json();
  const createdSamples = importData.data?.createdSamples || [];
  console.log(`[Verification] Ingested ${createdSamples.length} samples successfully!`);
  const firstSampleId = createdSamples[0]?.sample?.id || '';

  const context = await browser.newContext();
  await context.addCookies([
    {
      name: 'metalsense_session',
      value: userToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();

  // Test and set localStorage if needed
  await page.goto('http://localhost:5173/app', { waitUntil: 'networkidle' });

  const publicRoutes = [
    { name: '01_landing', path: '/' },
    { name: '02_methodology', path: '/methodology' },
    { name: '03_login', path: '/login' },
    { name: '04_signup', path: '/signup' },
    { name: '05_forgot_password', path: '/forgot-password' },
  ];

  const appRoutes = [
    { name: '06_dashboard', path: '/app' },
    { name: '07_samples_list', path: '/app/samples' },
    { name: '08_new_sample_wizard', path: '/app/samples/new' },
    { name: '09_sample_detail', path: firstSampleId ? `/app/samples/${firstSampleId}` : '/app/samples' },
    { name: '10_analytics', path: '/app/analytics' },
    { name: '11_spatial_map', path: '/app/map' },
    { name: '12_standards_registry', path: '/app/standards' },
    { name: '13_reports_dossier', path: '/app/reports' },
    { name: '14_workspace_settings', path: '/app/settings' },
  ];

  const allRoutes = [...publicRoutes, ...appRoutes];
  const contrastSummary = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n========================================`);
    console.log(`[Verification] Testing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`========================================`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of allRoutes) {
      const url = `http://localhost:5173${route.path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      } catch (err) {
        await page.waitForTimeout(1000);
      }

      await page.waitForTimeout(600); // Allow render animations to settle

      const screenshotFile = `${vp.name}_${route.name}.png`;
      const screenshotPath = path.join(SCREENSHOT_DIR, screenshotFile);
      await takeScreenshotWithRetry(page, screenshotPath);

      const issues = await page.evaluate(CONTRAST_EVAL_FN);
      console.log(`  ✓ ${route.name.padEnd(25)} [${vp.name}] - Screenshot: ${screenshotFile} | Contrast issues: ${issues.length}`);

      if (issues.length > 0) {
        contrastSummary.push({
          viewport: vp.name,
          route: route.name,
          path: route.path,
          issues,
        });
        issues.forEach((iss) => {
          console.log(`    ⚠️  [${iss.contrast}:1 < ${iss.minRequired}:1] "${iss.text}" | fg: ${iss.fg} on bg: ${iss.bg}`);
        });
      }
    }
  }

  await browser.close();

  const reportPath = path.join(SCREENSHOT_DIR, 'contrast_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(contrastSummary, null, 2));
  console.log(`\n[Verification] Complete! Report saved to ${reportPath}`);
  console.log(`[Verification] Total pages tested: ${allRoutes.length * VIEWPORTS.length}`);
  console.log(`[Verification] Total viewport passes: ${VIEWPORTS.length}`);
  console.log(`[Verification] Total contrast issues across all screens: ${contrastSummary.reduce((acc, c) => acc + c.issues.length, 0)}`);
}

main().catch((err) => {
  console.error('[Verification] Error running tests:', err);
  process.exit(1);
});
