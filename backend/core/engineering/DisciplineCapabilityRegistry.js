'use strict';

/**
 * Canonical capability registry for all engineering disciplines.
 *
 * It exposes product truth without activating an unimplemented engine.  The
 * frontend, chat and future integrations should use this service rather than
 * infer a discipline's availability from tab names or a generic AI response.
 */
const DISCIPLINES = Object.freeze({
  refrigeration: Object.freeze({
    code: 'refrigeration',
    displayName: 'Industrial Refrigeration',
    availability: 'governed-beta',
    designExecution: 'available-review-required',
    semanticGraph: 'available',
    calculation: 'provider-gated',
    equipmentSelection: 'manufacturer-evidence-gated',
    pidBim: 'semantic-preview-available',
    finalIssueAllowed: false,
    requirements: Object.freeze([
      'Refrigerant profile, operating conditions and project inputs',
      'Validated thermophysical provider and finite result for property-based calculations',
      'Manufacturer performance map, operating envelope and revision for final selection',
      'Engineering and safety review before construction, procurement or compliance issue'
    ]),
    blockers: Object.freeze([
      'Manufacturer-compatible catalogue evidence is incomplete for several refrigerant/category combinations',
      'CAD construction deliverables and independent PHA/compliance approval are not automated'
    ])
  }),
  hvac: Object.freeze({
    code: 'hvac',
    displayName: 'HVAC',
    availability: 'planned',
    designExecution: 'blocked',
    semanticGraph: 'contract-planned',
    calculation: 'not-implemented',
    equipmentSelection: 'not-implemented',
    pidBim: 'not-implemented',
    finalIssueAllowed: false,
    requirements: Object.freeze([
      'Psychrometric/property provider and climate design-condition source',
      'Validated load, air-side, hydronic and duct network engines',
      'Manufacturer equipment performance maps, BIM families and operating envelopes',
      'Discipline-specific code pack and independent engineering review'
    ]),
    blockers: Object.freeze([
      'No production HVAC calculation or selection engine is registered',
      'No source-backed HVAC catalogue, duct graph or delivery package is registered'
    ])
  }),
  electrical: Object.freeze({
    code: 'electrical',
    displayName: 'Electrical',
    availability: 'planned',
    designExecution: 'blocked',
    semanticGraph: 'contract-planned',
    calculation: 'not-implemented',
    equipmentSelection: 'not-implemented',
    pidBim: 'not-implemented',
    finalIssueAllowed: false,
    requirements: Object.freeze([
      'Utility, voltage, frequency, earthing and applicable-code inputs',
      'Validated demand, voltage-drop, short-circuit and protection-coordination engines',
      'Source-backed nameplate, protection curve, cable and panel catalogue data',
      'Licensed electrical-engineer review before construction issue'
    ]),
    blockers: Object.freeze([
      'No production electrical calculation or selection engine is registered',
      'No source-backed protection-coordination or cable/panel evidence is registered'
    ])
  })
});

function normalizeDiscipline(value) {
  const key = String(value || '').trim().toLowerCase();
  const aliases = {
    refrigeration: 'refrigeration',
    refrigerant: 'refrigeration',
    cold_storage: 'refrigeration',
    hvac: 'hvac',
    mechanical: 'hvac',
    electrical: 'electrical',
    power: 'electrical'
  };
  return aliases[key] || null;
}

function toPublicRecord(record) {
  return {
    ...record,
    requirements: [...record.requirements],
    blockers: [...record.blockers]
  };
}

function disciplineFor(code) {
  const normalized = normalizeDiscipline(code);
  return normalized ? toPublicRecord(DISCIPLINES[normalized]) : null;
}

function listDisciplines() {
  return Object.values(DISCIPLINES).map(toPublicRecord);
}

module.exports = {
  DISCIPLINES,
  normalizeDiscipline,
  disciplineFor,
  listDisciplines
};
