'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const outputDir = path.resolve(__dirname, 'e2e-artifacts');
const projectName = `Modal Regression ${Date.now()}`;
const resultPath = path.join(outputDir, 'project_creation_modal_result.json');
const screenshotPath = path.join(outputDir, '09_project_creation_modal.png');

fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const result = {
    startedAt: new Date().toISOString(),
    projectName,
    console: [],
    pageErrors: [],
    checks: {},
  };
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1424, height: 865 } });

  page.on('console', message => result.console.push({ type: message.type(), text: message.text() }));
  page.on('pageerror', error => result.pageErrors.push({ message: error.message, stack: error.stack }));

  try {
    await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle', timeout: 60000 });
    const newProject = page.getByText('New Project', { exact: true }).first();
    await newProject.waitFor({ state: 'visible', timeout: 30000 });
    await newProject.click();

    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 15000 });
    result.checks.dialogOpened = true;

    const projectNameInput = dialog.getByLabel('Project Name');
    await projectNameInput.fill(projectName);
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();

    await page.waitForURL(/\/chat\/proj_/, { timeout: 30000 });
    await dialog.waitFor({ state: 'hidden', timeout: 15000 });
    // The regression was a portal state race: it could pass a first hidden check
    // and reopen in the following task. A stability dwell makes that race visible.
    await page.waitForTimeout(750);
    if (await dialog.isVisible()) {
      throw new Error('Create New Project dialog reopened after project-route navigation.');
    }
    result.checks.dialogClosedAfterCreate = true;
    result.checks.dialogRemainedClosedAfterNavigation = true;
    result.checks.navigatedToProject = /\/chat\/proj_/.test(page.url());

    await page.screenshot({ path: screenshotPath, fullPage: false });
    result.screenshot = screenshotPath;
    result.url = page.url();
    result.completedAt = new Date().toISOString();
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(JSON.stringify({ status: 'passed', checks: result.checks, screenshotPath, url: result.url }, null, 2));
  } catch (error) {
    result.completedAt = new Date().toISOString();
    result.failure = { message: error.message, stack: error.stack };
    result.url = page.url();
    await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => undefined);
    result.screenshot = screenshotPath;
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf8');
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
