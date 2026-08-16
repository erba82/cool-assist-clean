import rawCondensers from './condensers_catalog.json';
import rawPumps from './pumps_catalog.json';
import rawEvaporators from './evaporators_catalog.json';
import {
  PhaseThreeEquipmentModel,
  CondenserCatalogueModel,
  LiquidPumpCatalogueModel,
  EvaporatorCatalogueModel,
  assertEquipmentFinitePositive,
  assertEquipmentFiniteNonNegative,
} from './CatalogueEquipmentTypes';

const validateCondenser = (model: CondenserCatalogueModel): CondenserCatalogueModel => {
  assertEquipmentFinitePositive(model.heatRejectionMbh, `${model.id}:heatRejectionMbh`);
  assertEquipmentFinitePositive(model.airflowCfm, `${model.id}:airflowCfm`);
  assertEquipmentFinitePositive(model.operatingWeightKg, `${model.id}:operatingWeightKg`);
  return model;
};

const validatePump = (model: LiquidPumpCatalogueModel): LiquidPumpCatalogueModel => {
  assertEquipmentFinitePositive(model.minFlowM3h, `${model.id}:minFlowM3h`);
  assertEquipmentFinitePositive(model.maxFlowM3h, `${model.id}:maxFlowM3h`);
  assertEquipmentFinitePositive(model.motorPowerKw, `${model.id}:motorPowerKw`);
  assertEquipmentFinitePositive(model.operatingWeightKg, `${model.id}:operatingWeightKg`);
  return model;
};

const validateEvaporator = (model: EvaporatorCatalogueModel): EvaporatorCatalogueModel => {
  assertEquipmentFinitePositive(model.surfaceAreaM2, `${model.id}:surfaceAreaM2`);
  assertEquipmentFinitePositive(model.airflowCfm, `${model.id}:airflowCfm`);
  assertEquipmentFinitePositive(model.operatingWeightKg, `${model.id}:operatingWeightKg`);
  return model;
};

const validateEquipmentModel = (model: PhaseThreeEquipmentModel): PhaseThreeEquipmentModel => {
  if (!model.id || !model.manufacturer || !model.family || !model.model || !model.category) {
    throw new Error('Equipment entry is missing mandatory metadata.');
  }
  if (!model.sourceRefs.length) {
    throw new Error(`${model.id} must have traceable source references.`);
  }
  Object.entries(model.dimensionsMm).forEach(([name, value]) => {
    if (typeof value === 'number') assertEquipmentFiniteNonNegative(value, `${model.id}:${name}`);
  });
  model.connectionPorts.forEach((port) => {
    if (!port.allowedNominalBoresMm.length) {
      throw new Error(`${model.id}:${port.id} has no nominal bores.`);
    }
    port.allowedNominalBoresMm.forEach((bore) => assertEquipmentFinitePositive(bore, `${model.id}:${port.id}:bore`));
  });

  if (model.category === 'condenser') return validateCondenser(model as CondenserCatalogueModel);
  if (model.category === 'liquid-pump') return validatePump(model as LiquidPumpCatalogueModel);
  if (model.category === 'evaporator') return validateEvaporator(model as EvaporatorCatalogueModel);
  throw new Error(`Unknown equipment category: ${(model as PhaseThreeEquipmentModel).category}`);
};

const parseCatalogue = (raw: unknown): readonly PhaseThreeEquipmentModel[] => {
  const parsed = raw as { schemaVersion: string; units: string; models: PhaseThreeEquipmentModel[] };
  if (parsed.schemaVersion !== '1.0.0' || parsed.units !== 'mm') {
    throw new Error('Equipment catalogue schema or units unsupported.');
  }
  return Object.freeze(parsed.models.map(validateEquipmentModel));
};

export const CONDENSER_MODELS = parseCatalogue(rawCondensers);
export const PUMP_MODELS = parseCatalogue(rawPumps);
export const EVAPORATOR_MODELS = parseCatalogue(rawEvaporators);

export const ALL_PHASE_THREE_MODELS: readonly PhaseThreeEquipmentModel[] = Object.freeze([
  ...CONDENSER_MODELS,
  ...PUMP_MODELS,
  ...EVAPORATOR_MODELS,
]);

export const getPhaseThreeModel = (id: string): PhaseThreeEquipmentModel => {
  const model = ALL_PHASE_THREE_MODELS.find((m) => m.id === id);
  if (!model) throw new Error(`Phase-three equipment model not found: ${id}`);
  return model;
};
