'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const scenario = {
  prompt: 'design a 5000 ton cold storage with 12 rooms, for beef at -18C, in Paris',
  dimensions: 'each room is 60m x 40m x 9m',
};
const outputDir = path.resolve(__dirname, 'e2e-artifacts');
const resultPath = path.join(outputDir, 'paris_5000t_intake_e2e_result.json');
const firstScreenshot = path.join(outputDir, '10_paris_intake_missing_dimensions.png');
const secondScreenshot = path.join(outputDir, '11_paris_nvidia_recommendation.png');
const thirdScreenshot = path.join(outputDir, '12_paris_per_room_load_required.png');
const fourthScreenshot = path.join(outputDir, '13_paris_design_generated.png');

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const result = {
    scenario,
    startedAt: new Date().toISOString(),
    console: [],
    pageErrors: [],
    failedRequests: [],
    apiResponses: [],
    checks: {},
  };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1424, height: 865 }, deviceScaleFactor: 1 });
  page.on('console', (message) => result.console.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', (error) => result.pageErrors.push({ message: error.message, stack: error.stack }));
  page.on('requestfailed', (request) => result.failedRequests.push({ url: request.url(), failure: request.failure() }));
  page.on('response', (response) => {
    if (response.url().includes('/api/')) result.apiResponses.push({ url: response.url(), status: response.status() });
  });

  try {
    await page.request.delete('http://localhost:3001/api/chat/session/anonymous-chat').catch(() => undefined);
    await page.goto('http://localhost:3001/chat', { waitUntil: 'networkidle', timeout: 60000 });
    const promptInput = page.getByPlaceholder('Ask questions or describe your project...');
    await promptInput.waitFor({ state: 'visible', timeout: 30000 });
    await promptInput.fill(scenario.prompt);
    await promptInput.press('Enter');

    await page.getByText('More Information Needed', { exact: true }).waitFor({ state: 'visible', timeout: 150000 });
    await page.getByText('80% complete', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    await page.getByText(/What are the dimensions of the cold room\(s\)\?/, { exact: false }).waitFor({ state: 'visible', timeout: 30000 });
    result.checks.missingDimensionsOnly = true;
    result.checks.initialCompleteness80 = true;
    await page.screenshot({ path: firstScreenshot, fullPage: false });

    const intakeAnswer = page.getByPlaceholder('Type your answers here...').last();
    await intakeAnswer.fill(scenario.dimensions);
    await page.getByRole('button', { name: 'Submit', exact: true }).last().click();

    await page.getByText('Smart Recommendations', { exact: true }).waitFor({ state: 'visible', timeout: 60000 });
    await page.getByText(/AI intake: nvidia · nvidia\/nemotron-3-(?:ultra-550b-a55b|super-120b-a12b)/i).waitFor({ state: 'visible', timeout: 30000 });
    await page.getByText('-18°C', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    await page.getByText('France', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
    result.checks.nvidiaProvenanceVisible = true;
    result.checks.negativeTemperatureVisible = true;
    result.checks.parisLocationVisible = true;
    await page.screenshot({ path: secondScreenshot, fullPage: false });

    const initialConfirm = page.locator('button').filter({ hasText: /Confirm\s*&\s*Calculate/i }).last();
    await initialConfirm.click();
    await page.getByText(/provide the design cooling load for each room in kW/i).waitFor({ state: 'visible', timeout: 30000 });
    result.checks.zeroLoadDesignBlocked = true;
    await page.screenshot({ path: thirdScreenshot, fullPage: false });

    const loadAnswer = page.getByPlaceholder('Type your answers here...').last();
    await loadAnswer.fill('150 kW per room');
    await page.getByRole('button', { name: 'Submit', exact: true }).last().click();
    const confirmedRecommendation = page.getByText('Smart Recommendations', { exact: true }).last();
    await confirmedRecommendation.waitFor({ state: 'visible', timeout: 60000 });
    const finalConfirm = page.locator('button').filter({ hasText: /Confirm\s*&\s*Calculate/i }).last();
    await finalConfirm.click();
    const calculationTab = page.getByRole('tab', { name: 'Calculation Book', exact: true });
    await calculationTab.waitFor({ state: 'visible', timeout: 180000 });
    await calculationTab.click();
    await page.waitForTimeout(1200);
    await page.getByText(/1800\s*kW/i).first().waitFor({ state: 'visible', timeout: 60000 });
    result.checks.designGeneratedAfterDeclaredPerRoomLoad = true;
    result.checks.totalDeclaredDesignLoadVisible = true;
    await page.screenshot({ path: fourthScreenshot, fullPage: false });

    result.completedAt = new Date().toISOString();
    result.url = page.url();
    result.visibleText = (await page.locator('body').innerText()).slice(0, 50000);
    result.screenshots = [firstScreenshot, secondScreenshot, thirdScreenshot, fourthScreenshot];
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(JSON.stringify({ status: 'passed', checks: result.checks, screenshots: result.screenshots }, null, 2));
  } catch (error) {
    result.completedAt = new Date().toISOString();
    result.failure = { message: error.message, stack: error.stack };
    result.url = page.url();
    result.visibleText = (await page.locator('body').innerText().catch(() => '')).slice(0, 50000);
    await page.screenshot({ path: path.join(outputDir, 'paris_5000t_intake_e2e_failure.png'), fullPage: true }).catch(() => undefined);
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf8');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
