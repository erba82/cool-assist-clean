const fs = require('fs');
const baseUrl = 'http://127.0.0.1:5000/api/chat/message';
const sessionId = `technical-report-${Date.now()}`;
const designText = 'Design an R717 ammonia refrigeration system for frozen chicken storage in Tehran, Iran. The project has two cold rooms: a 500 m2 chilled room at +2 C and a 300 m2 freezer at -20 C, each 6 m high. The central machine room is 20 m x 12 m x 5 m. Use two parallel screw compressors, a rooftop evaporative condenser, horizontal high-pressure receiver, liquid pump, oil separator, globe valves, check valves, Y-strainers and expansion valves. Generate the calculations, equipment schedule, P&ID 2D, P&ID 3D, energy analysis and compliance report.';
async function request(message) {
  const response = await fetch(baseUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId })
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
function findFields(value, prefix = '', found = {}) {
  if (!value || typeof value !== 'object') return found;
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (/calculation|equipment|energy|compliance|load|schedule|design|result/i.test(key)) found[path] = child;
    if (typeof child === 'object' && child !== null && prefix.split('.').length < 4) findFields(child, path, found);
  }
  return found;
}
(async () => {
  await request(designText);
  const confirmed = await request('confirm');
  const report = { topLevelKeys: Object.keys(confirmed || {}), fields: findFields(confirmed), full: confirmed };
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => { console.error(error.stack || String(error)); process.exitCode = 1; });
