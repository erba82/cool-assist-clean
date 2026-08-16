'use strict';

const {
  HydraulicCalculationError,
  calculateDarcyWeisbachPressureDrop
} = require('../engineering/HydraulicCalculator');

/**
 * Refrigerant pipe sizing and hydraulic assessment.
 *
 * The module sizes a single-phase line only when the project supplies a
 * traceable property state and project-specific hydraulic criteria.  It does
 * not substitute refrigerant densities, viscosities, pipe roughnesses, route
 * lengths, fitting loss coefficients, or pressure-drop limits.
 */
class PipingCalculator {
  constructor(engine) {
    this.engine = engine;
    // Existing configured nominal dimensions are retained as the project pipe
    // schedule.  The wall schedule / material must be identified in design input
    // before an issued-for-construction calculation is accepted.
    this.pipeSchedule = {
      DN15: { od: 21.3, id: 15.8 }, DN20: { od: 26.7, id: 20.9 },
      DN25: { od: 33.4, id: 26.6 }, DN32: { od: 42.2, id: 35.1 },
      DN40: { od: 48.3, id: 40.9 }, DN50: { od: 60.3, id: 52.5 },
      DN65: { od: 73.0, id: 62.7 }, DN80: { od: 88.9, id: 77.9 },
      DN100: { od: 114.3, id: 102.3 }, DN125: { od: 139.7, id: 128.2 },
      DN150: { od: 168.3, id: 154.1 }, DN200: { od: 219.1, id: 202.7 },
      DN250: { od: 273.0, id: 254.5 }, DN300: { od: 323.9, id: 303.2 }
    };
  }

  async size(calculations, project) {
    const refrigerant = project?.refrigerant;
    const piping = { suction: [], discharge: [], liquid: [], summary: {}, status: 'review-required', issues: [] };
    const groups = calculations?.temperatureLevels || {};

    for (const [level, group] of Object.entries(groups)) {
      const evapTemp = Number(group.evaporatingTemp);
      const compressor = (calculations?.compressors || []).find(item =>
        Number.isFinite(Number(item?.evaporatingTemp)) && Math.abs(Number(item.evaporatingTemp) - evapTemp) < 0.25
      );
      const massFlowKgPerS = this._readMassFlow(compressor);
      const line = this._sizeLine({
        id: `SUC-${level}`,
        service: 'suction',
        stateTemperatureC: evapTemp,
        massFlowKgPerS,
        loadKw: Number(group.totalLoad),
        project,
        refrigerant,
        routeKey: level
      });
      piping.suction.push({ temperatureLevel: level, evapTemp, load: Number(group.totalLoad), ...line });
      if (line.status !== 'calculated') piping.issues.push(...line.issues);
    }

    const combinedMassFlowKgPerS = (calculations?.compressors || [])
      .map(item => this._readMassFlow(item))
      .filter(Number.isFinite)
      .reduce((sum, value) => sum + value, 0);
    const hasCombinedMassFlow = combinedMassFlowKgPerS > 0;
    const dischargeTemp = this._operatingTemperature(calculations?.compressors, 'condensingTemp');
    const dischargeLine = this._sizeLine({
      id: 'DIS-MAIN', service: 'discharge', stateTemperatureC: dischargeTemp,
      massFlowKgPerS: hasCombinedMassFlow ? combinedMassFlowKgPerS : null,
      loadKw: this._sum(calculations?.compressors, 'heatRejection'), project, refrigerant, routeKey: 'main'
    });
    piping.discharge.push(dischargeLine);
    if (dischargeLine.status !== 'calculated') piping.issues.push(...dischargeLine.issues);

    const liquidTemp = this._operatingTemperature(calculations?.compressors, 'condensingTemp');
    const liquidLine = this._sizeLine({
      id: 'LIQ-MAIN', service: 'liquid', stateTemperatureC: liquidTemp,
      massFlowKgPerS: hasCombinedMassFlow ? combinedMassFlowKgPerS : null,
      loadKw: this._sum(calculations?.loads, 'total'), project, refrigerant, routeKey: 'main'
    });
    piping.liquid.push(liquidLine);
    if (liquidLine.status !== 'calculated') piping.issues.push(...liquidLine.issues);

    piping.summary = {
      largestSuction: this._getLargestPipe(piping.suction),
      dischargeMain: piping.discharge[0]?.size || 'INPUT_REQUIRED',
      liquidMain: piping.liquid[0]?.size || 'INPUT_REQUIRED',
      calculationModel: 'Darcy–Weisbach with Colebrook–White friction factor for traceable single-phase input states only',
      status: piping.issues.length ? 'input-required' : 'calculated'
    };
    piping.status = piping.summary.status;
    return piping;
  }

  _sizeLine({ id, service, stateTemperatureC, massFlowKgPerS, loadKw, project, refrigerant, routeKey }) {
    const issues = [];
    const hydraulic = project?.engineeringData?.hydraulic;
    if (!Number.isFinite(massFlowKgPerS) || massFlowKgPerS <= 0) {
      return this._inputRequired({ id, service, stateTemperatureC, loadKw, refrigerant, issues }, 'MASS_FLOW_REQUIRED', 'A mass flow rate from a traceable thermodynamic state calculation is required before pipe sizing.');
    }
    if (!hydraulic) {
      return this._inputRequired({ id, service, stateTemperatureC, massFlowKgPerS, loadKw, refrigerant, issues }, 'HYDRAULIC_INPUTS_REQUIRED', 'Provide project.engineeringData.hydraulic with traceable fluid states, pipe criteria, roughness, route length and fitting losses.');
    }

    const criteria = hydraulic.sizingCriteria?.[service];
    const state = this._stateFor(hydraulic, service, stateTemperatureC);
    const stateIssue = this._validateState(state, service, stateTemperatureC);
    if (!criteria || !this._validCriteria(criteria) || stateIssue) {
      if (!criteria || !this._validCriteria(criteria)) issues.push(this._issue('HYDRAULIC_CRITERIA_REQUIRED', 'Provide finite minVelocityMPerS, maxVelocityMPerS and recommendedVelocityMPerS for this service.', { service }));
      if (stateIssue) issues.push(stateIssue);
      return this._inputRequired({ id, service, stateTemperatureC, massFlowKgPerS, loadKw, refrigerant, issues }, 'HYDRAULIC_INPUTS_REQUIRED');
    }

    const selected = this._selectSize(massFlowKgPerS, state.densityKgPerM3, criteria);
    if (!selected) {
      return this._inputRequired({ id, service, stateTemperatureC, massFlowKgPerS, loadKw, refrigerant, issues }, 'PIPE_SCHEDULE_EXCEEDED', 'No configured pipe size satisfies the maximum design velocity.', { maxVelocityMPerS: criteria.maxVelocityMPerS });
    }

    const route = this._routeFor(hydraulic, service, routeKey);
    const base = {
      id, service, stateTemperatureC, refrigerant, load: Number.isFinite(loadKw) ? loadKw : null,
      massFlow: massFlowKgPerS, method: 'traceable-mass-flow-input',
      size: selected.size, actualID: selected.actualIDmm, requiredDiameter: selected.requiredDiameterMm,
      velocity: selected.velocityMPerS, velocityOK: selected.velocityMPerS >= criteria.minVelocityMPerS && selected.velocityMPerS <= criteria.maxVelocityMPerS,
      stateSource: state.source, stateSourceStatus: 'traceable-input'
    };

    if (!route || !Number.isFinite(Number(hydraulic.absoluteRoughnessM))) {
      const missing = [];
      if (!route) missing.push('route length / fitting loss data');
      if (!Number.isFinite(Number(hydraulic.absoluteRoughnessM))) missing.push('absolute pipe roughness');
      return {
        ...base,
        status: 'sized-hydraulic-review-required',
        pressureDrop: null,
        pressureDropOK: null,
        issues: [this._issue('PRESSURE_DROP_INPUTS_REQUIRED', `DN selection is available, but Darcy–Weisbach pressure drop requires ${missing.join(' and ')}.`, { id, service })]
      };
    }

    try {
      const calculation = calculateDarcyWeisbachPressureDrop({
        massFlowKgPerS,
        densityKgPerM3: Number(state.densityKgPerM3),
        dynamicViscosityPaS: Number(state.dynamicViscosityPaS),
        insideDiameterM: selected.actualIDmm / 1000,
        equivalentLengthM: Number(route.equivalentLengthM),
        absoluteRoughnessM: Number(hydraulic.absoluteRoughnessM),
        minorLossCoefficient: Number(route.minorLossCoefficient || 0),
        elevationChangeM: Number(route.elevationChangeM || 0),
        calculationContext: { refrigerant, service, source: state.source }
      });
      const maximumPressureDropPa = Number(criteria.maxPressureDropPaPer100m) > 0
        ? Number(criteria.maxPressureDropPaPer100m) * (Number(route.equivalentLengthM) / 100)
        : null;
      return {
        ...base,
        status: 'calculated',
        hydraulic: calculation,
        pressureDrop: calculation.totalPressureChangePa / 1000,
        pressureDropUnit: 'kPa over equivalent route length',
        pressureDropOK: maximumPressureDropPa === null ? null : calculation.totalPressureChangePa <= maximumPressureDropPa,
        maximumPressureDropPa,
        issues: []
      };
    } catch (error) {
      const message = error instanceof HydraulicCalculationError ? error.message : `Hydraulic calculation failed: ${error.message}`;
      return { ...base, status: 'hydraulic-calculation-failed', pressureDrop: null, pressureDropOK: null, issues: [this._issue('HYDRAULIC_CALCULATION_FAILED', message, { id, service })] };
    }
  }

  _readMassFlow(compressor) {
    const value = Number(compressor?.massFlowRate);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  _operatingTemperature(items, property) {
    const values = (items || []).map(item => Number(item?.[property])).filter(Number.isFinite);
    return values.length ? values[0] : null;
  }

  _sum(items, property) {
    return (items || []).reduce((sum, item) => sum + (Number(item?.[property]) || 0), 0);
  }

  _stateFor(hydraulic, service, temperatureC) {
    const raw = hydraulic.states?.[service];
    const states = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    return states.find(state => Number.isFinite(Number(state.temperatureC)) && Number.isFinite(Number(temperatureC)) && Math.abs(Number(state.temperatureC) - Number(temperatureC)) < 0.25) || null;
  }

  _routeFor(hydraulic, service, routeKey) {
    const routes = hydraulic.routes?.[service];
    if (Array.isArray(routes)) return routes.find(route => String(route.key || 'main') === String(routeKey)) || routes.find(route => String(route.key || 'main') === 'main') || null;
    if (routes && typeof routes === 'object') return routes[routeKey] || routes.main || null;
    return null;
  }

  _validateState(state, service, temperatureC) {
    if (!state) return this._issue('TRACEABLE_STATE_REQUIRED', 'No traceable fluid property state is registered at the requested operating temperature.', { service, temperatureC });
    if (!Number.isFinite(Number(state.densityKgPerM3)) || Number(state.densityKgPerM3) <= 0 || !Number.isFinite(Number(state.dynamicViscosityPaS)) || Number(state.dynamicViscosityPaS) <= 0) {
      return this._issue('INVALID_TRACEABLE_STATE', 'Fluid state must include positive densityKgPerM3 and dynamicViscosityPaS in SI units.', { service, temperatureC });
    }
    if (!state.source || !state.source.publisher || !state.source.document || !state.source.locator) {
      return this._issue('PROPERTY_SOURCE_REQUIRED', 'Fluid state must identify publisher, document / data source, and locator before results can be accepted.', { service, temperatureC });
    }
    return null;
  }

  _validCriteria(criteria) {
    const min = Number(criteria.minVelocityMPerS);
    const max = Number(criteria.maxVelocityMPerS);
    const recommended = Number(criteria.recommendedVelocityMPerS);
    return Number.isFinite(min) && Number.isFinite(max) && Number.isFinite(recommended) && min > 0 && max >= min && recommended >= min && recommended <= max;
  }

  _selectSize(massFlowKgPerS, densityKgPerM3, criteria) {
    const volumeFlowM3PerS = massFlowKgPerS / densityKgPerM3;
    const requiredAreaM2 = volumeFlowM3PerS / Number(criteria.recommendedVelocityMPerS);
    const requiredDiameterMm = Math.sqrt((4 * requiredAreaM2) / Math.PI) * 1000;
    for (const [size, dimensions] of Object.entries(this.pipeSchedule)) {
      const actualIDmm = Number(dimensions.id);
      const areaM2 = Math.PI * Math.pow(actualIDmm / 1000, 2) / 4;
      const velocityMPerS = volumeFlowM3PerS / areaM2;
      if (actualIDmm >= requiredDiameterMm && velocityMPerS <= Number(criteria.maxVelocityMPerS)) {
        return { size, actualIDmm, requiredDiameterMm, velocityMPerS };
      }
    }
    return null;
  }

  _inputRequired(base, code, message = null, context = {}) {
    const issues = base.issues || [];
    issues.push(this._issue(code, message || 'Engineering input is required before this line can be sized.', { id: base.id, service: base.service, ...context }));
    return { ...base, status: 'input-required', size: null, actualID: null, requiredDiameter: null, velocity: null, velocityOK: null, pressureDrop: null, pressureDropOK: null, issues };
  }

  _issue(code, message, context) { return { code, message, context }; }

  _getLargestPipe(lines) {
    let largest = null;
    let largestID = 0;
    (lines || []).forEach(line => {
      const id = this.pipeSchedule[line?.size]?.id || 0;
      if (id > largestID) { largest = line.size; largestID = id; }
    });
    return largest || 'INPUT_REQUIRED';
  }
}

module.exports = PipingCalculator;
