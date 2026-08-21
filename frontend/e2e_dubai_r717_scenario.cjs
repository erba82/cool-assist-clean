'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const scenario = {
  name: 'Industrial Cold Storage Dubai',
  prompt: 'Project: Industrial Cold Storage Dubai. Facility type: industrial cold storage warehouse with an IQF tunnel. Product: frozen meat. Location: Dubai, United Arab Emirates (AE). Refrigerant: R717 (Ammonia). Design cooling load: 500 kW. Evaporating temperature: -30°C. Condensing temperature: +35°C. Use two parallel industrial screw compressors, a roof-mounted evaporative condenser, a horizontal high-pressure receiver, pumped-recirculated ammonia liquid feed, an ammonia liquid recirculation pump, a low-pressure suction separator, an oil separator, a thermosiphon oil cooler, and a confirmed Danfoss ICF 25-4 valve station for the DN32 IQF liquid branch. Include an IQF tunnel 30 x 12 x 5 m at -35°C with its own evaporator branch and valve station. Generate the complete thermodynamic calculation book, manufacturer-backed equipment selection, location-aware procurement BOM, 2D P&ID, and 3D BIM layout.',
  generalQuestion: 'تفاوت بین سیستم تبرید مستقیم و غیرمستقیم چیست؟',
};

// Resolve against this script, not the caller's working directory, so artifacts
// are always written to frontend/e2e-artifacts on every supported platform.
const outputDir = path.resolve(__dirname, 'e2e-artifacts');
fs.mkdirSync(outputDir, { recursive: true });

function now() {
  return new Date().toISOString();
}

(async () => {
  const diagnostics = {
    scenario,
    startedAt: now(),
    console: [],
    pageErrors: [],
    failedRequests: [],
    apiResponses: [],
    screenshots: [],
    checks: {},
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1424, height: 865 },
    deviceScaleFactor: 1,
  });
  await page.request.delete('http://localhost:3001/api/chat/session/user-session-1').catch(() => undefined);

  page.on('console', message => diagnostics.console.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', error => diagnostics.pageErrors.push({ message: error.message, stack: error.stack }));
  page.on('requestfailed', request => diagnostics.failedRequests.push({ url: request.url(), failure: request.failure() }));
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      diagnostics.apiResponses.push({ url: response.url(), status: response.status() });
    }
  });

  const take = async fileName => {
    const filePath = path.join(outputDir, fileName);
    await page.screenshot({ path: filePath, fullPage: false });
    diagnostics.screenshots.push(filePath);
  };

  try {
    await page.goto('http://localhost:3001/chat', { waitUntil: 'networkidle', timeout: 60000 });
    const promptInput = page.getByPlaceholder('Ask questions or describe your project...');
    await promptInput.waitFor({ state: 'visible', timeout: 30000 });
    await promptInput.fill(scenario.prompt);
    await promptInput.press('Enter');

    const calculationTab = page.getByRole('tab', { name: 'Calculation Book', exact: true });
    await page.getByText('Smart Recommendations', { exact: true }).waitFor({ state: 'visible', timeout: 60000 });
    const confirmDesign = page.locator('button').filter({ hasText: /Confirm\s*&\s*Calculate/i }).first();
    await confirmDesign.waitFor({ state: 'visible', timeout: 30000 });
    await confirmDesign.click();

    await calculationTab.waitFor({ state: 'visible', timeout: 180000 });
    diagnostics.checks.designResultRendered = true;

    const summaryTab = page.getByRole('tab', { name: 'Summary', exact: true });
    await summaryTab.click();
    await page.waitForTimeout(700);
    await take('00_summary_tab.png');
    diagnostics.checks.summaryRendered = true;

    const loadTab = page.getByRole('tab', { name: 'Load Calculation', exact: true });
    await loadTab.click();
    await page.waitForTimeout(700);
    await take('01_load_calculation_tab.png');
    diagnostics.checks.loadCalculationRendered = true;

    await calculationTab.click();
    await page.waitForTimeout(1500);
    await take('01_calculations_tab.png');

    const procurementHeading = page.getByText('5. Selection Evidence, Vessel / Valve Register and BOM', { exact: true });
    await procurementHeading.scrollIntoViewIfNeeded();
    await procurementHeading.waitFor({ state: 'visible', timeout: 30000 });

    const premium = page.getByRole('button', { name: 'Tier 1 · Premium', exact: true });
    const standard = page.getByRole('button', { name: 'Tier 2 · Standard', exact: true });
    const budget = page.getByRole('button', { name: 'Tier 3 · Budget', exact: true });
    await premium.waitFor({ state: 'visible', timeout: 30000 });
    await premium.click();
    await page.waitForTimeout(300);
    await standard.click();
    await page.waitForTimeout(300);
    await budget.click();
    await page.waitForTimeout(300);
    await premium.click();
    await page.waitForTimeout(700);
    diagnostics.checks.procurementTierSwitching = true;
    await take('02_procurement_bom_tab.png');

    const equipmentTab = page.getByRole('tab', { name: 'Equipment', exact: true });
    await equipmentTab.click();
    await page.waitForTimeout(700);
    await take('02_equipment_tab.png');
    diagnostics.checks.equipmentRendered = true;

    const pidTab = page.getByRole('tab', { name: 'P&ID 2D', exact: true });
    await pidTab.click();
    await page.waitForFunction(() => document.querySelectorAll('svg').length > 4, null, { timeout: 30000 });
    await page.waitForTimeout(1200);
    diagnostics.checks.pid2dRendered = true;
    await take('03_2d_pid_canvas_tab.png');

    const bimTab = page.getByRole('tab', { name: 'P&ID 3D', exact: true });
    await bimTab.click();
    const bimPanel = page.locator('[data-engine="pid-refrigerant-aware-bim"]');
    await bimPanel.waitFor({ state: 'visible', timeout: 60000 });
    await bimPanel.locator('canvas').waitFor({ state: 'visible', timeout: 60000 });
    await page.waitForTimeout(3500);
    await bimPanel.getByRole('button', { name: 'Plant', exact: true }).click();
    await page.waitForTimeout(3000);
    diagnostics.checks.bim3dCanvasRendered = true;
    diagnostics.checks.bimPlantViewSelected = true;
    await take('04_3d_bim_viewer_tab.png');
    const closeupPath = path.join(outputDir, '05_3d_bim_plant_closeup.png');
    // The Three.js canvas continuously updates while OrbitControls damping settles.
    // A page-level clipped capture records the same panel without waiting for the
    // animated canvas element to become locator-stable.
    const panelBox = await bimPanel.boundingBox();
    if (!panelBox) throw new Error('BIM panel has no visible bounding box for screenshot capture.');
    await page.screenshot({ path: closeupPath, clip: panelBox, animations: 'disabled' });
    diagnostics.screenshots.push(closeupPath);

    const energyTab = page.getByRole('tab', { name: 'Energy', exact: true });
    await energyTab.click();
    await page.waitForTimeout(700);
    await take('06_energy_management_tab.png');
    diagnostics.checks.energyManagementRendered = true;

    const complianceTab = page.getByRole('tab', { name: 'Compliance', exact: true });
    await complianceTab.click();
    await page.waitForTimeout(700);
    await take('07_compliance_tab.png');
    diagnostics.checks.complianceRendered = true;

    // A real general-chat smoke test is intentionally performed in its own fresh
    // session. It must use the visible mode toggle so the governed general router
    // is tested rather than the deterministic design-state-machine fallback.
    await page.goto('http://localhost:3001/chat', { waitUntil: 'networkidle', timeout: 60000 });
    const modeToggle = page.getByText('Design & Calculations Mode', { exact: true });
    await modeToggle.waitFor({ state: 'visible', timeout: 30000 });
    await modeToggle.click();
    const generalInput = page.getByPlaceholder('Ask questions or describe your project...');
    await generalInput.fill(scenario.generalQuestion);
    await generalInput.press('Enter');
    await page.getByText('Calculating...', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    await page.getByText('Calculating...', { exact: true }).waitFor({ state: 'hidden', timeout: 180000 });
    await take('08_general_chat_response.png');
    diagnostics.checks.generalChatCompleted = true;

    diagnostics.completedAt = now();
    diagnostics.url = page.url();
    diagnostics.visibleText = (await page.locator('body').innerText()).slice(0, 50000);
    fs.writeFileSync(path.join(outputDir, 'dubai_r717_e2e_result.json'), JSON.stringify(diagnostics, null, 2), 'utf8');
    console.log(JSON.stringify({ status: 'passed', outputDir, checks: diagnostics.checks, screenshots: diagnostics.screenshots }, null, 2));
  } catch (error) {
    diagnostics.completedAt = now();
    diagnostics.failure = { message: error.message, stack: error.stack };
    diagnostics.url = page.url();
    diagnostics.visibleText = (await page.locator('body').innerText().catch(() => '')).slice(0, 50000);
    await page.screenshot({ path: path.join(outputDir, 'e2e_failure_state.png'), fullPage: true }).catch(() => undefined);
    fs.writeFileSync(path.join(outputDir, 'dubai_r717_e2e_result.json'), JSON.stringify(diagnostics, null, 2), 'utf8');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
