'use strict';

const assert = require('assert');
const RefrigerationEngine = require('./RefrigerationEngine');
const AdvancedPIDGenerator = require('../services/generative/AdvancedPIDGenerator');
const ReportGenerator = require('./reporting/ReportGenerator');

(async () => {
  const project = {
    name: 'Paris frozen beef — Design Basis regression',
    location: { city: 'Paris', country: 'France' },
    refrigerant: 'R717',
    applicationType: 'cold_storage_frozen',
    product: { type: 'beef' },
    climate: { summerDB: 33, summerWB: 25, groundTemperatureC: 12 },
    operatingConditions: { evaporatingTemperatureC: -26, condensingTemperatureC: 35 },
    semanticCycle: {
      compressorFamily: 'screw',
      condenserType: 'evaporative_condenser',
      feedMethod: 'pumped_recirculated',
      equipmentPolicy: {
        includeHighPressureReceiver: true,
        includeLowPressureSeparator: true,
        includeOilSeparator: true,
        includeThermosiphon: true,
        includeAmmoniaValveStation: true
      },
      source: 'test-approved-design-basis'
    },
    designBasis: {
      status: 'user-confirmed',
      proposalMode: 'component-load-calculation',
      assumptions: [{ id: 'test-basis', status: 'user-confirmed', value: 'explicit regression inputs', source: 'test' }],
      gates: {
        manufacturerSelection: 'manufacturer-performance-map-required',
        BIMLayout: 'declared-elevation-and-NPSH-required'
      }
    },
    plantLayout: { datumElevationM: null, equipment: {}, status: 'layout-input-required' },
    rooms: [{
      id: 'R-01',
      name: 'Frozen Beef Room',
      type: 'cold_storage_frozen',
      length: 60,
      width: 40,
      height: 9,
      temperature: -18,
      insulation: { type: 'polyurethane_40', thickness: 150 },
      floorUFactor: 1,
      door: { width: 2.5, height: 3, openingsPerDay: 20, openDuration: 2 },
      doorProtection: 0.15,
      occupancy: 2,
      occupancyHours: 8,
      lightingPower: 10,
      lightingHours: 12,
      equipmentPower: 2,
      equipmentHours: 8,
      product: { type: 'beef', dailyThroughput: 0, entryTemp: -18 },
      designLoadBasis: 'approved-design-basis-component-calculation'
    }]
  };

  const engine = new RefrigerationEngine();
  const results = await engine.calculate(project);
  const load = results.calculations.loads[0];

  assert.strictEqual(load.calculationStatus, 'input-required');
  assert.strictEqual(load.product.status, 'input-required');
  assert(Number.isFinite(load.transmission.total));
  assert(Number.isFinite(load.infiltration.total));
  assert(Number.isFinite(load.internal.total));
  assert(['inputs-required', 'manufacturer-map-required'].includes(results.calculations.compressors[0].selectionStatus));
  assert.strictEqual(results.calculations.compressors[0].capacityPerUnit, null);
  assert.strictEqual(results.calculations.compressors[0].motorPower, null);
  if (Array.isArray(results.calculations.condensers) && results.calculations.condensers.length) {
    assert(['inputs-required', 'manufacturer-map-required'].includes(results.calculations.condensers[0].selectionStatus));
  }
  if (Array.isArray(results.calculations.evaporators) && results.calculations.evaporators.length) {
    assert(['inputs-required', 'manufacturer-map-required'].includes(results.calculations.evaporators[0].selectionStatus));
  }

  const pid = await new AdvancedPIDGenerator().generate(results, project);
  const byTag = new Map(pid.nodes.map((node) => [node.data.tag, node.id]));
  const sourceTarget = new Set(pid.edges.map((edge) => `${edge.source}->${edge.target}`));
  const thermosiphon = byTag.get('TS-OC-01');
  const receiver = byTag.get('REC-HP-01');
  const oilCooler = byTag.get('OC-01');
  const oilSeparator = byTag.get('SEP-OIL-01');

  assert(thermosiphon && receiver && oilCooler);
  assert(sourceTarget.has(`${receiver}->${thermosiphon}`));
  assert(sourceTarget.has(`${thermosiphon}->${oilCooler}`));
  assert(sourceTarget.has(`${oilCooler}->${thermosiphon}`));
  assert(!sourceTarget.has(`${oilSeparator}->${thermosiphon}`));
  assert(pid.edges.every((edge) => /^L-\d{3}$/.test(edge.data.lineId)));
  assert(pid.edges.every((edge) => edge.data.dn === null ? edge.data.sizingStatus === 'hydraulic-sizing-required' : true));
  assert(pid.nodes.filter((node) => ['SEP-LP-01', 'PMP-LIQ-01', 'TS-OC-01'].includes(node.data.tag)).every((node) => node.data.elevationStatus === 'layout-input-required'));

  const synchronization = engine.synchronizeFullSystem(results, { equipment: pid.nodes, pipes: pid.edges, valves: [] });
  assert(synchronization.equipment.every((item) => item.selectionStatus !== 'verified-selection' ? item.quantity === null : true));
  assert(synchronization.bom.procurementRequest.rows.every((row) => row.selectionStatus !== 'verified-selection' ? row.quantity === null : true));
  assert(synchronization.bim.readiness === 'review-required');

  const report = new ReportGenerator().generate({ ...results, synchronization }, project);
  const designBasisSection = report.calculations.find((section) => section.title.startsWith('0. Approved Design Basis'));
  const compressorDossier = report.calculations.find((section) => section.title.startsWith('2. Equipment Candidate'))
    .subsections.find((section) => section.title === '2.2 Compressors').items[0];
  assert.strictEqual(designBasisSection.status, 'user-confirmed');
  assert.strictEqual(compressorDossier.model, null);
  assert.strictEqual(compressorDossier.quantity, null);
  assert.strictEqual(compressorDossier.procurementAuthorised, false);

  console.log(JSON.stringify({
    status: 'passed',
    checks: [
      'approved-design-basis-runs-component-calculation-with-missing-product-throughput-explicit',
      'mapless-equipment-has-no-capacity-motor-model-or-quantity-claim',
      'r717-thermosiphon-loop-is-represented-as-receiver-supply-downcomer-and-two-phase-return',
      'pid-dn-and-elevation-remain-review-gated',
      'bom-bim-and-report-do-not-upgrade-candidates-to-procurement-selections'
    ]
  }, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
