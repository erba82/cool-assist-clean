'use strict';

/**
 * Deterministic single-phase hydraulic calculations.
 *
 * This module deliberately accepts only explicit SI inputs.  Refrigerant
 * properties are injected by a traceable property provider; it never embeds
 * density, viscosity, roughness, or velocity assumptions for a refrigerant.
 */
class HydraulicCalculationError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'HydraulicCalculationError';
    this.code = code;
    this.context = context;
  }
}

const GRAVITY_M_PER_S2 = 9.80665;
const TURBULENT_REYNOLDS = 2300;

function assertFinitePositive(name, value, context) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new HydraulicCalculationError(
      `${name} must be a finite positive SI value.`,
      'INVALID_HYDRAULIC_INPUT',
      { ...context, name, value }
    );
  }
}

function assertFiniteNonNegative(name, value, context) {
  if (!Number.isFinite(value) || value < 0) {
    throw new HydraulicCalculationError(
      `${name} must be a finite non-negative SI value.`,
      'INVALID_HYDRAULIC_INPUT',
      { ...context, name, value }
    );
  }
}

/**
 * Solves the implicit Colebrook–White equation using fixed-point iteration.
 * Laminar flow is evaluated with the exact Darcy friction factor 64/Re.
 */
function calculateColebrookWhiteFrictionFactor({
  reynoldsNumber,
  relativeRoughness,
  tolerance = 1e-10,
  maxIterations = 80
}) {
  assertFinitePositive('reynoldsNumber', reynoldsNumber, { relativeRoughness });
  assertFiniteNonNegative('relativeRoughness', relativeRoughness, { reynoldsNumber });
  assertFinitePositive('tolerance', tolerance, { reynoldsNumber, relativeRoughness });

  if (!Number.isInteger(maxIterations) || maxIterations < 1) {
    throw new HydraulicCalculationError(
      'maxIterations must be a positive integer.',
      'INVALID_HYDRAULIC_INPUT',
      { maxIterations }
    );
  }

  if (reynoldsNumber < TURBULENT_REYNOLDS) {
    return {
      frictionFactor: 64 / reynoldsNumber,
      regime: 'laminar',
      iterations: 0,
      converged: true,
      governingEquation: 'Darcy friction factor = 64 / Re'
    };
  }

  // Swamee–Jain is used only as a numerical initial condition; the returned
  // value is from the converged implicit Colebrook–White relation.
  let frictionFactor = 0.25 / Math.pow(
    Math.log10((relativeRoughness / 3.7) + (5.74 / Math.pow(reynoldsNumber, 0.9))),
    2
  );

  if (!Number.isFinite(frictionFactor) || frictionFactor <= 0) {
    throw new HydraulicCalculationError(
      'Unable to establish a stable initial friction-factor estimate.',
      'COLEBROOK_INITIALIZATION_FAILED',
      { reynoldsNumber, relativeRoughness }
    );
  }

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const denominator = -2 * Math.log10(
      (relativeRoughness / 3.7) + (2.51 / (reynoldsNumber * Math.sqrt(frictionFactor)))
    );
    const next = 1 / Math.pow(denominator, 2);

    if (!Number.isFinite(next) || next <= 0) {
      throw new HydraulicCalculationError(
        'Colebrook–White iteration produced a non-physical friction factor.',
        'COLEBROOK_NON_PHYSICAL_RESULT',
        { reynoldsNumber, relativeRoughness, iteration, frictionFactor, next }
      );
    }

    if (Math.abs(next - frictionFactor) <= tolerance * Math.max(1, next)) {
      return {
        frictionFactor: next,
        regime: 'turbulent',
        iterations: iteration,
        converged: true,
        governingEquation: 'Implicit Colebrook–White equation solved by fixed-point iteration'
      };
    }

    frictionFactor = next;
  }

  throw new HydraulicCalculationError(
    'Colebrook–White iteration did not converge within the configured limit.',
    'COLEBROOK_NON_CONVERGENCE',
    { reynoldsNumber, relativeRoughness, tolerance, maxIterations }
  );
}

/**
 * Calculates Darcy–Weisbach pressure loss for a single, homogeneous-phase line.
 * Two-phase pressure-drop methods are intentionally not inferred here and must
 * be supplied as a separately identified engineering model.
 */
function calculateDarcyWeisbachPressureDrop({
  massFlowKgPerS,
  densityKgPerM3,
  dynamicViscosityPaS,
  insideDiameterM,
  equivalentLengthM,
  absoluteRoughnessM,
  minorLossCoefficient = 0,
  elevationChangeM = 0,
  calculationContext = {}
}) {
  const context = { ...calculationContext };
  assertFinitePositive('massFlowKgPerS', massFlowKgPerS, context);
  assertFinitePositive('densityKgPerM3', densityKgPerM3, context);
  assertFinitePositive('dynamicViscosityPaS', dynamicViscosityPaS, context);
  assertFinitePositive('insideDiameterM', insideDiameterM, context);
  assertFiniteNonNegative('equivalentLengthM', equivalentLengthM, context);
  assertFiniteNonNegative('absoluteRoughnessM', absoluteRoughnessM, context);
  assertFiniteNonNegative('minorLossCoefficient', minorLossCoefficient, context);

  if (!Number.isFinite(elevationChangeM)) {
    throw new HydraulicCalculationError(
      'elevationChangeM must be a finite SI value.',
      'INVALID_HYDRAULIC_INPUT',
      { ...context, elevationChangeM }
    );
  }

  const crossSectionAreaM2 = Math.PI * Math.pow(insideDiameterM, 2) / 4;
  const volumetricFlowM3PerS = massFlowKgPerS / densityKgPerM3;
  const velocityMPerS = volumetricFlowM3PerS / crossSectionAreaM2;
  const reynoldsNumber = (densityKgPerM3 * velocityMPerS * insideDiameterM) / dynamicViscosityPaS;
  const relativeRoughness = absoluteRoughnessM / insideDiameterM;
  const friction = calculateColebrookWhiteFrictionFactor({
    reynoldsNumber,
    relativeRoughness
  });
  const dynamicPressurePa = densityKgPerM3 * Math.pow(velocityMPerS, 2) / 2;
  const straightPipePressureDropPa = friction.frictionFactor *
    (equivalentLengthM / insideDiameterM) * dynamicPressurePa;
  const minorLossPressureDropPa = minorLossCoefficient * dynamicPressurePa;
  const staticPressureChangePa = densityKgPerM3 * GRAVITY_M_PER_S2 * elevationChangeM;
  const totalPressureChangePa = straightPipePressureDropPa + minorLossPressureDropPa + staticPressureChangePa;

  return {
    model: 'Darcy–Weisbach with Colebrook–White friction factor',
    applicability: 'single-phase homogeneous flow only',
    inputsSI: {
      massFlowKgPerS,
      densityKgPerM3,
      dynamicViscosityPaS,
      insideDiameterM,
      equivalentLengthM,
      absoluteRoughnessM,
      minorLossCoefficient,
      elevationChangeM
    },
    crossSectionAreaM2,
    volumetricFlowM3PerS,
    velocityMPerS,
    reynoldsNumber,
    relativeRoughness,
    friction,
    dynamicPressurePa,
    straightPipePressureDropPa,
    minorLossPressureDropPa,
    staticPressureChangePa,
    totalPressureChangePa
  };
}

module.exports = {
  GRAVITY_M_PER_S2,
  HydraulicCalculationError,
  calculateColebrookWhiteFrictionFactor,
  calculateDarcyWeisbachPressureDrop
};
