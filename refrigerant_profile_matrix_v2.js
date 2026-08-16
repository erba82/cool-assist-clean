const fs = require('fs');

const expected = {
  R717: { family: 'ammonia-industrial', topology: 'pumped-ammonia-industrial', joint: 'welded', compressor: /HSK|HSN|screw/i, heat: 'evaporative_condenser', safety: ['gas_detector', 'ventilation_fan', 'emergency_shutdown'] },
  R744: { family: 'co2-transcritical', topology: 'co2-transcritical-gas-cooler', joint: 'welded', compressor: /TE-/i, heat: 'gas_cooler', safety: ['safety_control', 'relief_valve'] },
  R290: { family: 'propane-a3', topology: 'direct-expansion-propane', joint: 'brazed', compressor: /R290/i, heat: 'air_cooled_condenser', safety: ['gas_detector', 'ventilation_fan', 'emergency_shutdown'] },
  R32: { family: 'a2l-dx', topology: 'direct-expansion-a2l', joint: 'brazed', compressor: /R32/i, heat: 'air_cooled_condenser', safety: ['gas_detector', 'ventilation_fan', 'emergency_shutdown'] },
  R404A: { family: 'hfc-dx', topology: 'direct-expansion-refrigeration', joint: 'brazed', compressor: /6G|8G/i, heat: 'air_cooled_condenser', safety: [] },
  R410A: { family: 'hfc-dx', topology: 'direct-expansion-refrigeration', joint: 'brazed', compressor: /R410A/i, heat: 'air_cooled_condenser', safety: [] },
  R134a: { family: 'hfc-dx', topology: 'direct-expansion-refrigeration', joint: 'brazed', compressor: /R134a|4G|6G/i, heat: 'air_cooled_condenser', safety: [] },
  R22: { family: 'hcfc-legacy-dx', topology: 'direct-expansion-refrigeration', joint: 'brazed', compressor: /R22|4G|6G/i, heat: 'air_cooled_condenser', safety: [] }
};

async function design(refrigerant) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch('http://localhost:5000/api/chat/design', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
      body: JSON.stringify({
        message: `Design a 64 kW frozen beef cold store in Tehran at -18 C using ${refrigerant}.`,
        refrigerant, location: { city: 'Tehran', country: 'Iran' }
      })
    });
    const data = await response.json();
    const pid = data?.pidData || {};
    const nodes = pid.equipment || pid.nodes || [];
    const pipes = pid.pipes || pid.edges || [];
    const componentTypes = nodes.map(n => n?.data?.componentType || n?.componentType || '');
    const labels = nodes.map(n => n?.data?.label || n?.label || '');
    const compressor = data?.equipment?.compressors?.[0] || {};
    const condenser = data?.equipment?.condensers?.[0] || {};
    const rule = expected[refrigerant];
    const allPipesSized = pipes.length > 0 && pipes.every(p => Number(p?.data?.dn ?? p?.dn) > 0);
    const allJointsCorrect = pipes.length > 0 && pipes.every(p => (p?.data?.jointType || p?.jointType) === rule.joint);
    const noAmmoniaOnlyElements = refrigerant === 'R717' || !labels.some(l => /Evaporative Condenser|HP Receiver|Liquid Pump|Low-Pressure Suction Separator|Hand Expansion Valve/i.test(l));
    const safetyPresent = rule.safety.every(kind => componentTypes.includes(kind));
    const profile = pid.metadata?.profile || {};
    const pass = data?.success === true && data?.project?.refrigerant === refrigerant &&
      profile.family === rule.family && pid.metadata?.topology === rule.topology &&
      rule.compressor.test(String(compressor.model || '')) &&
      condenser.type === rule.heat && componentTypes.includes(rule.heat) &&
      allPipesSized && allJointsCorrect && noAmmoniaOnlyElements && safetyPresent;
    return { refrigerant, pass, status: response.status, returned: data?.project?.refrigerant, profile, topology: pid.metadata?.topology, compressor: compressor.model, compressorType: compressor.type, condenser: { model: condenser.model, type: condenser.type }, nodes: componentTypes, safetyPresent, allPipesSized, allJointsCorrect, noAmmoniaOnlyElements, pipeCount: pipes.length, nodeCount: nodes.length };
  } catch (error) {
    return { refrigerant, pass: false, error: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally { clearTimeout(timer); }
}

(async () => {
  const results = [];
  for (const refrigerant of Object.keys(expected)) {
    console.log(`Testing ${refrigerant}...`);
    results.push(await design(refrigerant));
  }
  const report = { generatedAt: new Date().toISOString(), results, totals: { tested: results.length, passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).map(r => r.refrigerant) } };
  fs.writeFileSync('refrigerant_profile_matrix_v2_report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.totals, null, 2));
  results.forEach(r => console.log(`${r.refrigerant}: ${r.pass ? 'PASS' : 'FAIL'} | ${r.compressor || r.error} | ${r.condenser?.type || ''} | nodes=${r.nodeCount || 0} pipes=${r.pipeCount || 0}`));
  if (report.totals.failed.length) process.exit(1);
})();
