'use strict';

/**
 * CondenserSelector
 *
 * Converts a validated cycle heat-rejection duty into a manufacturer selection
 * brief.  It does not infer a condenser model, fan count/motor, water rate,
 * physical connections, equipment quantity or price without a manufacturer map.
 */

const { getRefrigerantProfile } = require('../data/RefrigerantProfiles');

const finite = (value) => Number.isFinite(Number(value));
const rounded = (value, digits = 2) => finite(value) ? Math.round(Number(value) * (10 ** digits)) / (10 ** digits) : null;

class CondenserSelector {
  constructor(engine) {
    this.engine = engine;
  }

  async select(totalHeatRejectionKw, project = {}) {
    const profile = getRefrigerantProfile(project.refrigerant);
    const designBasis = project.designBasis || {};
    const type = profile?.heatRejection?.type || project.condenserType || null;
    const heatRejectionKw = Number(totalHeatRejectionKw);
    const declaredCondensingC = Number(project?.operatingConditions?.condensingTemperatureC ?? designBasis?.condensingTemperatureC);
    const issues = [];
    const assumptions = [];

    if (!finite(heatRejectionKw) || heatRejectionKw <= 0) issues.push('A positive thermophysical cycle heat-rejection duty is required before condenser selection.');
    if (!type) issues.push('A refrigerant-specific heat-rejection configuration is required.');
    if (!finite(declaredCondensingC)) issues.push('A declared condensing/gas-cooler operating condition is required before performance-map selection.');

    const ambient = this._declaredAmbient(project);
    if (!ambient.valid) assumptions.push({
      field: 'ambientDesignData', proposedValue: null, unit: '°C', status: 'input-required', rationale: 'Manufacturer selection requires declared dry-bulb/wet-bulb and altitude design data.'
    });

    return {
      category: 'condenser',
      equipmentRole: type === 'gas_cooler' ? 'CO2 gas cooler' : 'heat rejection unit',
      refrigerantProfile: profile?.id || project.refrigerant || null,
      componentPolicy: profile?.componentPolicy || 'profile-required',
      type: type || 'configuration-required',
      selectionStatus: issues.length ? 'inputs-required' : 'manufacturer-map-required',
      finalSelectionAllowed: false,
      model: null,
      manufacturer: null,
      manufacturerModelKey: null,
      count: null,
      capacityPerUnit: null,
      heatRejection: rounded(heatRejectionKw),
      totalCapacity: null,
      condensingTemp: rounded(declaredCondensingC),
      designConditions: ambient.values,
      candidateFamily: type === 'evaporative' ? 'industrial evaporative condenser bank — manufacturer selection required' : type === 'gas_cooler' ? 'CO₂ gas cooler bank — manufacturer selection required' : 'industrial air-cooled condenser bank — manufacturer selection required',
      performanceMapStatus: 'manufacturer-performance-map-required',
      requiredManufacturerData: ['performance map revision', 'capacity at declared ambient and operating point', 'fan/motor rating', 'water/pump duty when applicable', 'sound data', 'connections', 'dimensions/weight', 'design pressure and compliance evidence'],
      technicalSpecs: {
        fanCount: null,
        fanMotorPowerKw: null,
        pumpMotorPowerKw: null,
        waterConsumption: null,
        dimensionsMm: null,
        connections: null,
        soundLevelDbA: null,
        status: 'manufacturer-document-required'
      },
      electrical: { status: 'manufacturer-motor-data-required', ratedPowerKw: null },
      procurement: { priceStatus: 'supplier-quotation-required', unitPrice: null, totalPrice: null, currency: null },
      price: null,
      currency: null,
      tag: 'COND-01',
      assumptions,
      issues,
      blockingReasons: [
        ...(issues.length ? issues : []),
        'Manufacturer condenser performance map, motor data and operating envelope are required before final equipment issue.'
      ]
    };
  }

  _declaredAmbient(project) {
    const climate = project.climate || {};
    const dryBulbC = Number(climate.summerDB);
    const wetBulbC = Number(climate.summerWB);
    const altitudeM = Number(climate.altitude);
    return {
      valid: finite(dryBulbC) || finite(wetBulbC),
      values: {
        dryBulbC: rounded(dryBulbC),
        wetBulbC: rounded(wetBulbC),
        altitudeM: finite(altitudeM) ? rounded(altitudeM) : null,
        source: climate.source || 'input-required'
      }
    };
  }
}

module.exports = CondenserSelector;
