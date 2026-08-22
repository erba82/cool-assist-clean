'use strict';

/**
 * EvaporatorSelector
 *
 * Builds a room-side evaporator duty brief.  It may propose process constraints
 * from declared room data, but it never manufactures a model performance point,
 * fan/motor rating, coil surface, refrigerant connection or price.
 */

const finite = (value) => Number.isFinite(Number(value));
const rounded = (value, digits = 2) => finite(value) ? Math.round(Number(value) * (10 ** digits)) / (10 ** digits) : null;

class EvaporatorSelector {
  constructor(engine) {
    this.engine = engine;
  }

  async select(load = {}, project = {}) {
    const room = load.room || {};
    const roomType = this._roomType(room);
    const requiredCapacityKw = Number(load.total);
    const roomTemperatureC = Number(room.temperature);
    const declaredTd = Number(room.dt ?? project?.designBasis?.evaporatorTdK);
    const proposedTd = this._proposeTd(roomType, roomTemperatureC);
    const td = finite(declaredTd) && declaredTd > 0 ? declaredTd : proposedTd.value;
    const assumptions = [];
    if (!(finite(declaredTd) && declaredTd > 0)) assumptions.push({
      field: 'evaporatorTdK', proposedValue: td, unit: 'K', status: 'assumption-proposed', rationale: proposedTd.rationale
    });

    const roomDimensions = this._roomDimensions(room);
    const issues = [];
    if (!finite(requiredCapacityKw) || requiredCapacityKw <= 0) issues.push('A positive calculated room cooling load is required before evaporator duty can be prepared.');
    if (!finite(roomTemperatureC)) issues.push('A declared room temperature is required.');
    if (!roomDimensions.valid) issues.push('Room length, width and height are required before air-distribution and unit-count review.');

    const candidateFamily = this._candidateFamily(roomType, roomTemperatureC);
    return {
      category: 'evaporator',
      selectionStatus: issues.length ? 'inputs-required' : 'manufacturer-map-required',
      finalSelectionAllowed: false,
      roomName: room.name || null,
      roomId: room.id || room.name || null,
      roomType,
      applicationType: roomType,
      model: null,
      manufacturer: null,
      manufacturerModelKey: null,
      candidateFamily,
      designDuty: {
        requiredCoolingLoadKw: rounded(requiredCapacityKw),
        roomTemperatureC: rounded(roomTemperatureC),
        proposedEvaporatingTemperatureC: finite(roomTemperatureC) ? rounded(roomTemperatureC - td) : null,
        tdK: rounded(td),
        tdSource: finite(declaredTd) && declaredTd > 0 ? 'user-declared' : 'assumption-proposed-not-approved'
      },
      layoutReview: {
        roomDimensionsM: roomDimensions.values,
        airDistributionStatus: roomDimensions.valid ? 'manufacturer-air-throw-data-required' : 'room-geometry-required',
        unitCount: null,
        reason: 'Unit count, air throw, fan quantity, fin spacing and fan motor power require the selected manufacturer coil performance/airflow data and room layout review.'
      },
      defrost: {
        recommendedProcess: this._proposeDefrost(roomType, roomTemperatureC),
        finalDefrostSelectionStatus: 'process-and-manufacturer-review-required'
      },
      manufacturerEvidence: {
        mapStatus: 'manufacturer-performance-map-required',
        requiredInputs: ['air-on temperature and humidity', 'refrigerant feed method/overfeed ratio', 'coil TD and frost duty', 'fan selection', 'defrost schedule', 'selected manufacturer performance map revision']
      },
      procurement: {
        priceStatus: 'supplier-quotation-required',
        unitPrice: null,
        totalPrice: null,
        currency: null
      },
      technicalSpecs: {
        finSpacingMm: null,
        airflowM3h: null,
        fanCount: null,
        fanMotorPowerKw: null,
        refrigerantConnections: null,
        dimensionsMm: null,
        status: 'manufacturer-document-required'
      },
      tag: `EVAP-${String(room.name || room.id || 'ROOM').replace(/[^0-9A-Za-z]+/g, '-').toUpperCase()}`,
      assumptions,
      issues,
      blockingReasons: [
        ...(issues.length ? issues : []),
        'Manufacturer evaporator performance map and selected fan/defrost data are required before final equipment issue.'
      ]
    };
  }

  _roomType(room) {
    const text = String(room.processType || room.type || room.applicationType || room.name || '').toLowerCase();
    if (/iqf|spiral|tunnel|blast/.test(text)) return 'tunnel';
    if (/processing|process|pack/.test(text)) return 'processing';
    if (/chilling|chill|precool/.test(text)) return 'chilling';
    if (/storage|store/.test(text)) return 'storage';
    const temperature = Number(room.temperature);
    if (finite(temperature) && temperature <= -25) return 'freezer';
    return 'storage';
  }

  _roomDimensions(room) {
    const length = Number(room.length);
    const width = Number(room.width);
    const height = Number(room.height);
    return {
      valid: [length, width, height].every((value) => finite(value) && value > 0),
      values: { length: rounded(length), width: rounded(width), height: rounded(height), volume: [length, width, height].every((value) => finite(value) && value > 0) ? rounded(length * width * height) : null }
    };
  }

  _proposeTd(roomType, temperatureC) {
    if (roomType === 'tunnel') return { value: 12, rationale: 'A tunnel/blast process requires a separate product pull-down and coil performance review; 12 K is only a proposed initial TD.' };
    if (roomType === 'chilling') return { value: 4, rationale: 'Low TD is proposed to protect humidity; confirm against product and coil map.' };
    if (roomType === 'processing') return { value: 8, rationale: 'An initial process-room TD proposal; confirm against product and required humidity.' };
    if (finite(temperatureC) && temperatureC <= -25) return { value: 10, rationale: 'A low-temperature storage TD proposal; confirm frost/defrost duty with manufacturer data.' };
    return { value: 6, rationale: 'An initial storage TD proposal; confirm product humidity, frost and coil map.' };
  }

  _candidateFamily(roomType, temperatureC) {
    if (roomType === 'tunnel') return 'industrial blast/IQF air-unit bank — manufacturer selection required';
    if (finite(temperatureC) && temperatureC <= -25) return 'industrial low-temperature unit cooler — manufacturer selection required';
    return 'industrial cold-room unit cooler — manufacturer selection required';
  }

  _proposeDefrost(roomType, temperatureC) {
    if (roomType === 'tunnel' || (finite(temperatureC) && temperatureC <= -25)) return 'hot-gas defrost candidate; validate piping, oil management, defrost schedule and manufacturer approval';
    return 'defrost method must be selected from humidity, operating temperature and manufacturer coil data';
  }
}

module.exports = EvaporatorSelector;
