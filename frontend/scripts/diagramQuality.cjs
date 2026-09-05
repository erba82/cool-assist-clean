'use strict';
// Unit checks exercise the actual exported production functions. Browser mode
// uses a real backend and real UI; it never substitutes a mock design response.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'e2e-artifacts', 'diagram-quality');
fs.mkdirSync(out, { recursive: true });
function productionHelpers() {
  const ts = require('typescript');
  const source = fs.readFileSync(path.join(root, 'src/components/PIDDrawingEngine.tsx'), 'utf8');
  const result = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, reportDiagnostics: true });
  const diagnostics = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(diagnostics.length, 0, 'Production TSX must transpile');
  const module = { exports: {} };
  // Only dependency boundaries are stubbed for pure-function unit tests, not
  // the production functions being tested. UI behavior is tested in browser mode.
  const requireStub = id => id === 'reactflow' ? { MarkerType: { ArrowClosed: 'arrowclosed' }, Position: { Left: 'left', Right: 'right', Top: 'top', Bottom: 'bottom' } } : {};
  vm.runInNewContext(result.outputText, { exports: module.exports, module, require: requireStub }, { timeout: 5000 });
  return module.exports;
}
function unit() {
  const h = productionHelpers();
  const results = [];
  function check(name, run) { try { run(); results.push({ name, passed: true }); } catch (e) { results.push({ name, passed: false, error: e.message }); } }
  const n = (id, port, direction) => ({ id, position: { x: 0, y: 0 }, data: { details: { connectionPorts: [{ id: port, direction, side: 'left' }] } } });
  const nodes = [n('C1', 'discharge', 'out'), n('COND1', 'hot-gas-in', 'in')];
  const edge = { id: 'L1', source: 'C1', target: 'COND1', sourcePort: 'discharge', targetPort: 'hot-gas-in', data: { dn: 100, service: 'discharge' } };
  check('declared port-to-port connection accepted', () => assert.equal(h.connectionIssues(edge, nodes).length, 0));
  check('sourcePort and targetPort retained as ReactFlow handles', () => { const e = h.normalizeEdges([edge], nodes)[0]; assert.equal(e.sourceHandle, 'discharge'); assert.equal(e.targetHandle, 'hot-gas-in'); });
  check('nested sourcePortId and targetPortId retained', () => { const e = { source: 'C1', target: 'COND1', data: { sourcePortId: 'discharge', targetPortId: 'hot-gas-in' } }; assert.equal(h.connectionIssues(e, nodes).length, 0); });
  check('explicit handle takes precedence and is not silently replaced', () => { assert.equal(h.resolveEndpoint({ ...edge, sourceHandle: 'unknown' }, 'source'), 'unknown'); assert(h.connectionIssues({ ...edge, sourceHandle: 'unknown' }, nodes).length > 0); });
  check('missing equipment rejected', () => assert(h.connectionIssues({ ...edge, target: 'missing' }, nodes).length > 0));
  check('unknown source port rejected', () => assert(h.connectionIssues({ ...edge, sourcePort: 'invented' }, nodes).length > 0));
  check('unknown target port rejected', () => assert(h.connectionIssues({ ...edge, targetPort: 'invented' }, nodes).length > 0));
  check('reversed port direction rejected', () => assert(h.connectionIssues(edge, [n('C1', 'discharge', 'in'), nodes[1]]).length > 0));
  check('undeclared direction rejected', () => assert(h.connectionIssues(edge, [n('C1', 'discharge', undefined), nodes[1]]).length > 0));
  check('duplicate port identifiers rejected', () => { const x = n('C1', 'discharge', 'out'); x.data.details.connectionPorts.push({ ...x.data.details.connectionPorts[0] }); assert(h.connectionIssues(edge, [x, nodes[1]]).length > 0); });
  check('bidirectional port supported', () => assert.equal(h.connectionIssues(edge, [n('C1', 'discharge', 'bidirectional'), nodes[1]]).length, 0));
  check('missing ports remain empty, no invented fallback', () => assert.equal(h.normalizeNodes([{ id: 'X', data: {}, position: { x: 0, y: 0 } }])[0].data.details.connectionPorts.length, 0));
  check('declared DN and service appear on pipe', () => assert.equal(h.pipeLabel(edge), 'discharge | DN100'));
  check('DN-prefixed source value supported', () => assert.equal(h.pipeLabel({ dn: 'DN 250' }), 'DN250'));
  check('missing diameter stays review-required', () => assert.equal(h.pipeLabel({}), 'DN REVIEW'));
  check('invalid diameter does not become a size', () => { for (const dn of [-1, 0, '125abc', Infinity, null]) assert.equal(h.pipeLabel({ dn }), 'DN REVIEW'); });
  check('existing DN is not duplicated', () => assert.equal(h.pipeLabel({ label: 'SUCTION DN100', dn: 100 }), 'SUCTION DN100'));
  check('normalization preserves all edges including invalid source data', () => { const r = h.normalizeEdges([edge, { ...edge, id: 'bad', targetPort: 'absent' }], nodes); assert.equal(r.length, 2); assert.equal(r[1].data.portValidationStatus, 'invalid'); });
  check('normalization does not mutate source design', () => { const before = JSON.stringify({ nodes, edge }); h.normalizeNodes(nodes); h.normalizeEdges([edge], nodes); assert.equal(JSON.stringify({ nodes, edge }), before); });
  const report = { scope: 'Production P&ID pure-function unit tests, NOT a browser or engineering acceptance test', status: results.every(r => r.passed) ? 'passed' : 'failed', total: results.length, results };
  fs.writeFileSync(path.join(out, 'unit-results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  assert.equal(report.status, 'passed');
}
function imageMetrics(buffer) {
  const { PNG } = require('pngjs');
  const p = PNG.sync.read(buffer); let count = 0, sum = 0, squares = 0;
  const bins = new Map();
  // Central image only: exclude the legend, text overlays and controls.
  for (let y = Math.floor(p.height * .25); y < p.height * .8; y += 3) for (let x = Math.floor(p.width * .2); x < p.width * .8; x += 3) {
    const i = (y * p.width + x) * 4;
    const l = .2126 * p.data[i] + .7152 * p.data[i + 1] + .0722 * p.data[i + 2];
    const key = `${p.data[i] >> 4},${p.data[i + 1] >> 4},${p.data[i + 2] >> 4}`;
    bins.set(key, (bins.get(key) || 0) + 1); count++; sum += l; squares += l * l;
  }
  return { width: p.width, height: p.height, bins: bins.size, stddev: Math.sqrt(Math.max(0, squares / count - (sum / count) ** 2)), dominantFraction: Math.max(0, ...bins.values()) / count };
}
async function browser() {
  const { chromium } = require('playwright');
  const base = 'http://127.0.0.1:3001';
  const report = { scope: 'Live local application smoke test; NOT Romak equivalence or standards certification', status: 'running', startedAt: new Date().toISOString(), checks: [], pageErrors: [], failedRequests: [], api: [] };
  const browser = await chromium.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, recordVideo: { dir: out, size: { width: 1600, height: 1100 } } });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  const sessionId = `diagram-quality-${Date.now()}`;
  // Isolate the test session without deleting or altering an existing project.
  await page.route('**/api/chat/message', async route => {
    const body = route.request().postDataJSON();
    await route.continue({ postData: JSON.stringify({ ...body, sessionId }) });
  });
  page.on('pageerror', e => report.pageErrors.push(e.message));
  page.on('requestfailed', r => report.failedRequests.push({ url: new URL(r.url()).pathname, error: r.failure()?.errorText }));
  page.on('response', r => { if (r.url().includes('/api/')) report.api.push({ path: new URL(r.url()).pathname, status: r.status() }); });
  const check = (name, passed, detail) => report.checks.push({ name, passed: Boolean(passed), detail });
  try {
    await page.goto(`${base}/chat`, { waitUntil: 'domcontentloaded', timeout: 120000 });
    const input = page.getByPlaceholder('Ask questions or describe your project...');
    await input.waitFor({ state: 'visible', timeout: 60000 });
    const prompt = 'Project: Industrial Cold Storage Dubai. Facility type: industrial cold storage warehouse with an IQF tunnel. Product: frozen meat. Location: Dubai, United Arab Emirates (AE). Refrigerant: R717 (Ammonia). Design cooling load: 500 kW. Evaporating temperature: -30 C. Condensing temperature: +35 C. Two parallel industrial screw compressors, roof-mounted evaporative condenser, horizontal high-pressure receiver, pumped-recirculated ammonia feed, ammonia liquid pump, low-pressure suction separator, oil separator, thermosiphon oil cooler. IQF tunnel 30 x 12 x 5 m at -35 C with its own evaporator branch and valve station. Generate 2D P&ID and 3D BIM layout. Any absent engineering inputs must stay review-required.';
    await input.fill(prompt);
    let responsePromise = page.waitForResponse(r => r.url().endsWith('/api/chat/message') && r.request().method() === 'POST', { timeout: 180000 });
    await input.press('Enter');
    let result = await (await responsePromise).json();
    for (let i = 0; i < 3 && ['recommendations', 'design_basis_proposal'].includes(result.type); i++) {
      const button = page.getByRole('button', { name: /Confirm.*Calculate/i }).last();
      await button.waitFor({ state: 'visible', timeout: 30000 });
      responsePromise = page.waitForResponse(r => r.url().endsWith('/api/chat/message') && r.request().method() === 'POST', { timeout: 180000 });
      await button.click(); result = await (await responsePromise).json();
    }
    fs.writeFileSync(path.join(out, 'live-design.json'), JSON.stringify(result, null, 2));
    const pid = result.pidData;
    const nodes = pid?.equipment || pid?.nodes || [];
    const edges = pid?.pipes || pid?.edges || [];
    assert(nodes.length && edges.length, `Live API did not supply topology; response type: ${result.type}`);
    check('API returns equipment and lines', true, { nodes: nodes.length, lines: edges.length });
    const helpers = productionHelpers();
    const invalid = edges.map(e => ({ id: e.id, issues: helpers.connectionIssues(e, nodes) })).filter(e => e.issues.length);
    check('all generated connections resolve to declared ports', invalid.length === 0, invalid);
    await page.getByRole('tab', { name: 'P&ID 2D', exact: true }).click();
    const panel2d = page.locator('[data-engine="pid-port-aware-2d"]');
    await panel2d.waitFor({ state: 'visible', timeout: 60000 });
    await panel2d.getByRole('button', { name: 'Full topology', exact: true }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(out, '02-live-pid.png'), fullPage: false });
    const drawnNodes = await panel2d.locator('.react-flow__node').count();
    const drawnEdges = await panel2d.locator('.react-flow__edge-path').count();
    check('every generated node has a 2D element', drawnNodes === nodes.length, { drawnNodes, expected: nodes.length });
    check('every generated line has a 2D path', drawnEdges === edges.length, { drawnEdges, expected: edges.length });
    await page.getByRole('tab', { name: 'P&ID 3D', exact: true }).click();
    const panel3d = page.locator('[data-engine="pid-refrigerant-aware-bim"]');
    await panel3d.waitFor({ state: 'visible', timeout: 60000 });
    const canvas = panel3d.locator('canvas');
    await canvas.waitFor({ state: 'visible', timeout: 60000 });
    const counts = (await panel3d.innerText()).match(/(\d+) assets.*?(\d+) process lines/);
    check('3D equipment and line coverage equals source topology', counts && Number(counts[1]) === nodes.length && Number(counts[2]) === edges.length, { sourceNodes: nodes.length, sourceLines: edges.length, displayedCounts: counts ? counts.slice(1) : null });
    for (const [name, file] of [['Overview', '03-live-overview'], ['Plant', '04-live-plant'], ['Roof plant', '05-live-roof']]) {
      await panel3d.getByRole('button', { name, exact: true }).click();
      await page.waitForTimeout(3000);
      await canvas.scrollIntoViewIfNeeded();
      const box = await canvas.boundingBox();
      assert(box && box.width > 100 && box.height > 100, '3D canvas has no usable dimensions');
      const buffer = await page.screenshot({ path: path.join(out, `${file}.png`), clip: box });
      const metrics = imageMetrics(buffer);
      check(`${name}: image is not blank or effectively uniform`, metrics.bins > 12 && metrics.stddev > 4 && metrics.dominantFraction < .97, metrics);
    }
    check('no uncaught browser errors', report.pageErrors.length === 0, report.pageErrors);
    check('no failed API responses', report.api.every(r => r.status < 400), report.api);
    report.status = report.checks.every(c => c.passed) ? 'passed' : 'failed';
  } catch (e) {
    report.status = 'failed'; report.failure = e.stack || e.message;
    await page.screenshot({ path: path.join(out, 'failure.png'), fullPage: true }).catch(() => {});
  } finally {
    report.completedAt = new Date().toISOString();
    fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify(report, null, 2));
    await context.tracing.stop({ path: path.join(out, 'trace.zip') }).catch(() => {});
    await context.close(); await browser.close();
  }
  console.log(JSON.stringify(report, null, 2));
  assert.equal(report.status, 'passed', 'Diagram smoke test failed; inspect recorded artifacts.');
}
if (require.main === module) {
  if (process.argv.includes('--browser')) browser().catch(e => { console.error(e); process.exitCode = 1; });
  else { try { unit(); } catch (e) { console.error(e); process.exitCode = 1; } }
}
