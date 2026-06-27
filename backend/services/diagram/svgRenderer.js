// SVG Renderer for AutoCAD-style refrigeration P&ID, Equipment Layout, Valve Stations
// Produces self-contained SVG strings with ISO-like symbols, color-coded lines, title block, legend, and annotations.

const WIDTH = 1600; // px
const HEIGHT = 1200; // px

function svgHeader(title = 'P&ID') {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">\n` +
    `<defs><style>
      .suction-line { stroke: #FF0000; stroke-width: 3; fill: none; stroke-dasharray: 6 6; }
      .discharge-line { stroke: #0047FF; stroke-width: 3; fill: none; stroke-dasharray: 10 5; }
      .liquid-line { stroke: #00AA00; stroke-width: 2.5; fill: none; }
      .oil-line { stroke: #FF9900; stroke-width: 2; fill: none; }
      .hotgas-line { stroke: #7D3C98; stroke-width: 2.5; fill: none; stroke-dasharray: 4 3; }
      .water-line { stroke: #00B5E2; stroke-width: 2; fill: none; }
      .cond-water-line { stroke: #E5C100; stroke-width: 2; fill: none; }
      .eq { stroke: #000; stroke-width: 1; fill: #fff; }
      .label { font-family: Arial, sans-serif; font-size: 12px; fill: #000; }
      .title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; }
      .small { font-size: 10px; fill: #333; }
      .legend-box { stroke: #000; stroke-width: 1; fill: #f8f8f8; }
      .title-block { stroke: #000; stroke-width: 1; fill: #fff; }
    </style></defs>\n`;
}

function svgFooter() { return `</svg>`; }

function drawTitleBlock(meta) {
  const m = meta || {};
  return `
  <g id="title-block">
    <rect x="20" y="1020" width="1560" height="160" class="title-block" />
    <text x="40" y="1050" class="title">${m.dwgTitle || 'FLOW PIPING DIAGRAM'}</text>
    <text x="40" y="1075" class="label">Client: ${m.client || '-'}</text>
    <text x="360" y="1075" class="label">File No.: ${m.fileNo || '-'}</text>
    <text x="680" y="1075" class="label">DWG No.: ${m.dwgNo || '-'}</text>
    <text x="1000" y="1075" class="label">Rev: ${m.rev || 'A0'}</text>
    <text x="40" y="1100" class="label">Designer: ${m.designer || '-'}</text>
    <text x="360" y="1100" class="label">Checked: ${m.checked || '-'}</text>
    <text x="680" y="1100" class="label">Drawer: ${m.drawer || '-'}</text>
    <text x="1000" y="1100" class="label">Approved: ${m.approved || '-'}</text>
    <text x="40" y="1125" class="label">Date: ${m.date || new Date().toISOString().slice(0,10)}</text>
    <text x="360" y="1125" class="label">Scale: ${m.scale || '-'}</text>
    <text x="680" y="1125" class="label">Size: ${m.size || 'A0'}</text>
  </g>`;
}

function drawLegend() {
  return `
  <g id="legend">
    <rect x="20" y="20" width="360" height="180" class="legend-box" />
    <text x="30" y="40" class="label">Legend</text>
    <line x1="30" y1="60" x2="120" y2="60" class="suction-line" />
    <text x="130" y="65" class="small">Suction Line</text>
    <line x1="30" y1="80" x2="120" y2="80" class="discharge-line" />
    <text x="130" y="85" class="small">Discharge/Hot Gas</text>
    <line x1="30" y1="100" x2="120" y2="100" class="liquid-line" />
    <text x="130" y="105" class="small">Liquid Line</text>
    <line x1="30" y1="120" x2="120" y2="120" class="oil-line" />
    <text x="130" y="125" class="small">Oil/Drain</text>
    <line x1="30" y1="140" x2="120" y2="140" class="water-line" />
    <text x="130" y="145" class="small">Water</text>
    <line x1="30" y1="160" x2="120" y2="160" class="cond-water-line" />
    <text x="130" y="165" class="small">Condenser Water</text>
  </g>`;
}

function node(x, y, w, h, id, title, subtitle) {
  return `
  <g id="${id}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" class="eq" />
    <text x="${x + w/2}" y="${y + 14}" text-anchor="middle" class="label">${title || ''}</text>
    ${subtitle ? `<text x="${x + w/2}" y="${y + 30}" text-anchor="middle" class="small">${subtitle}</text>` : ''}
  </g>`;
}

function line(x1, y1, x2, y2, klass, label) {
  const midx = (x1 + x2) / 2;
  const midy = (y1 + y2) / 2;
  return `
  <g>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${klass}" />
    ${label ? `<text x="${midx + 6}" y="${midy - 6}" class="small">${label}</text>` : ''}
  </g>`;
}

function renderMainPid(diagram) {
  // diagram: { meta, headers, equipment, stations }
  const parts = [];
  parts.push(svgHeader('Main P&ID'));
  parts.push(drawLegend());
  parts.push(node(420, 20, 300, 60, 'hdr-suction-10', 'SUCTION LINE (-10°C)', `DN${diagram?.headers?.suction10 || '250'}`));
  parts.push(node(740, 20, 300, 60, 'hdr-suction-30', 'SUCTION LINE (-30°C)', `DN${diagram?.headers?.suction30 || '250'}`));
  parts.push(node(1060, 20, 300, 60, 'hdr-suction-40', 'SUCTION LINE (-40°C)', `DN${diagram?.headers?.suction40 || '250'}`));
  parts.push(node(20, 300, 260, 80, 'evap-cond-1', 'EVAPORATIVE CONDENSER', diagram?.equipment?.condenser?.model || 'TXC-180-3 DE'));
  parts.push(node(320, 300, 200, 70, 'receiver-1', 'AMMONIA RECEIVER', diagram?.equipment?.receiver?.label || '200L'));
  parts.push(node(560, 300, 220, 70, 'separator-10', '-10°C SEPARATOR', diagram?.equipment?.separator10?.model || 'TLPS-180-600'));
  parts.push(node(820, 300, 220, 70, 'separator-30', '-30°C SEPARATOR', diagram?.equipment?.separator30?.model || 'TLPS-120-450'));
  parts.push(node(1080, 300, 220, 70, 'separator-40', '-40°C SEPARATOR', diagram?.equipment?.separator40?.model || 'TLPS-120-450'));
  parts.push(node(320, 420, 220, 60, 'thermosyphon', 'THERMOSYPHONE', diagram?.equipment?.thermosyphon?.model || 'TTS-120-400'));
  parts.push(node(560, 420, 220, 60, 'oil-drain', 'OIL DRAIN TANK', diagram?.equipment?.oilDrain?.model || 'TODT-30-70'));
  parts.push(node(820, 420, 220, 60, 'economizer', 'ECONOMIZER', diagram?.equipment?.economizer?.model || 'TLVS-60-250'));

  // Compressors block
  const comps = diagram?.equipment?.compressors || [];
  let cx = 100; let cy = 520;
  comps.slice(0,6).forEach((c, idx) => {
    parts.push(node(cx, cy, 220, 70, `comp-${idx+1}`, c?.title || `COMP NO.${idx+1}`, c?.subtitle || `${c?.model || ''} ${c?.capacityKW ? c.capacityKW+' kW' : ''}`));
    // suction to header
    parts.push(line(cx+110, cy, cx+110, 80, 'suction-line', `DN${c?.suctionDN || diagram?.headers?.[`suction${c?.systemTemp || '10'}`] || '150'}`));
    // discharge to condenser
    parts.push(line(cx+220, cy+35, 150, 340, 'discharge-line', `DN${c?.dischargeDN || '65'}`));
    cx += 260;
    if ((idx+1) % 3 === 0) { cx = 100; cy += 100; }
  });

  // Liquid distribution header
  parts.push(line(420, 335, 560, 335, 'liquid-line', `DN${diagram?.headers?.liquid || '100'}`));
  parts.push(line(560, 335, 820, 335, 'liquid-line'));
  parts.push(line(820, 335, 1080, 335, 'liquid-line'));

  // Title block
  parts.push(drawTitleBlock(diagram?.meta || {}));
  parts.push(svgFooter());
  return parts.join('\n');
}

function renderLayout(diagram) {
  const parts = [];
  parts.push(svgHeader('Equipment Layout'));
  parts.push(node(120, 120, 200, 80, 'cond-1', 'EVAP COND 1', diagram?.equipment?.condenser?.model || 'TXC-180-3 DE'));
  parts.push(node(380, 120, 200, 80, 'cond-2', 'EVAP COND 2', diagram?.equipment?.condenser2?.model || 'TXC-180-3 DE'));
  parts.push(node(120, 280, 200, 80, 'receiver', 'RECEIVER', diagram?.equipment?.receiver?.label || '200L'));
  parts.push(node(380, 280, 200, 80, 'thermosy', 'THERMOSYPHONE', diagram?.equipment?.thermosyphon?.model || 'TTS-120-400'));
  parts.push(node(640, 280, 220, 80, 'oil', 'OIL DRAIN', diagram?.equipment?.oilDrain?.model || 'TODT-30-70'));
  parts.push(node(900, 280, 220, 80, 'econ', 'ECONOMIZER', diagram?.equipment?.economizer?.model || 'TLVS-60-250'));
  (diagram?.equipment?.compressors || []).slice(0,8).forEach((c, i) => {
    const row = Math.floor(i / 4); const col = i % 4;
    const x = 120 + col * 260; const y = 420 + row * 120;
    parts.push(node(x, y, 220, 80, `compL-${i+1}`, c?.title || `COMP ${i+1}`, c?.model || 'BITZER/ HOWDEN'));
  });
  parts.push(drawTitleBlock(diagram?.meta || {}));
  parts.push(svgFooter());
  return parts.join('\n');
}

function renderValveStations(diagram) {
  const parts = [];
  parts.push(svgHeader('Valve Stations'));
  // Example station for -40C branch
  parts.push(node(80, 100, 260, 60, 'vs-40', 'VALVE STATION (-40°C)', diagram?.stations?.m40?.label || 'EVRA/NRVA/SVA/REG'));
  parts.push(line(80, 170, 340, 170, 'liquid-line', `DN${diagram?.stations?.m40?.liquidDN || '25'}`));
  parts.push(line(80, 200, 340, 200, 'suction-line', `DN${diagram?.stations?.m40?.suctionDN || '40'}`));
  parts.push(line(80, 230, 340, 230, 'hotgas-line', `DN${diagram?.stations?.m40?.hotgasDN || '25'}`));
  // Annotations
  parts.push(`<text x="360" y="175" class="small">EVRA25 + SVA + FIA + NRVA + REG (Set: 6K SH)</text>`);
  parts.push(`<text x="360" y="205" class="small">Return with NRVA, slope 0.3%</text>`);
  parts.push(`<text x="360" y="235" class="small">Hot Gas Bypass/Defrost (as required)</text>`);

  // Duplicate for -30C/-10C
  parts.push(node(80, 320, 260, 60, 'vs-30', 'VALVE STATION (-30°C)', diagram?.stations?.m30?.label || 'EVRA/NRVA/SVA/REG'));
  parts.push(line(80, 390, 340, 390, 'liquid-line', `DN${diagram?.stations?.m30?.liquidDN || '25'}`));
  parts.push(line(80, 420, 340, 420, 'suction-line', `DN${diagram?.stations?.m30?.suctionDN || '50'}`));

  parts.push(node(80, 540, 260, 60, 'vs-10', 'VALVE STATION (-10°C)', diagram?.stations?.m10?.label || 'EVRA/NRVA/SVA/REG'));
  parts.push(line(80, 610, 340, 610, 'liquid-line', `DN${diagram?.stations?.m10?.liquidDN || '32'}`));
  parts.push(line(80, 640, 340, 640, 'suction-line', `DN${diagram?.stations?.m10?.suctionDN || '65'}`));

  parts.push(drawTitleBlock(diagram?.meta || {}));
  parts.push(svgFooter());
  return parts.join('\n');
}

function buildFromCalculation(calc) {
  // calc: output from /api/hvac/calculate + equipment selection; map to diagram struct
  const headers = {
    suction10: calc?.headers?.suction10 || 250,
    suction30: calc?.headers?.suction30 || 250,
    suction40: calc?.headers?.suction40 || 250,
    liquid: calc?.headers?.liquid || 100,
  };
  const equipment = calc?.equipment || {};
  const diagram = {
    meta: calc?.meta || {},
    headers,
    equipment,
    stations: calc?.stations || {},
  };
  return {
    mainPidSVG: renderMainPid(diagram),
    layoutPlanSVG: renderLayout(diagram),
    valveStationSVG: renderValveStations(diagram),
  };
}

module.exports = { buildFromCalculation };
