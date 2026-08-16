import rawCatalogue from './catalogueCompressorModels.json';
import { CatalogueCompressorModel, CataloguePort, assertFinitePositive } from './CatalogueCompressorTypes';

export * from './CatalogueCompressorTypes';
export * from './CatalogueScrewCompressorFamily';
export * from './CatalogueScrewCompressorPidSymbol';
export * from './CatalogueValveTypes';
export * from './CatalogueValveLibrary';
export * from './CatalogueParametricValveFamily';
export * from './CatalogueValvePidSymbol';
export * from './CatalogueEquipmentTypes';
export * from './CatalogueEquipmentLibrary';
export * from './CatalogueParametricEquipmentFamily';
export * from './CatalogueEquipmentPidSymbol';
export * from './CatalogueRenderDispatcher';

const isPortId = (value: unknown): value is CataloguePort['id'] => value === 'suction' || value === 'discharge' || value === 'oil-injection';

const validatePort = (port: CataloguePort, modelId: string): CataloguePort => {
  if (!isPortId(port.id)) {
    throw new Error(`Catalogue compressor ${modelId} has an invalid port id.`);
  }
  if (port.nominalDiameterMm !== null) {
    assertFinitePositive(port.nominalDiameterMm, `${modelId}:${port.id}:nominalDiameterMm`);
  }
  if ((port.positionMm === null) !== (port.direction === null)) {
    throw new Error(`Catalogue compressor ${modelId}:${port.id} must define both a position and direction, or neither.`);
  }
  if (port.coordinateStatus === 'verified' && (!port.positionMm || !port.direction)) {
    throw new Error(`Catalogue compressor ${modelId}:${port.id} cannot be verified without a local position and direction.`);
  }
  return port;
};

const validateModel = (model: CatalogueCompressorModel): CatalogueCompressorModel => {
  if (!model.id || !model.manufacturer || !model.family || !model.model) {
    throw new Error('Catalogue compressor is missing mandatory identity metadata.');
  }
  assertFinitePositive(model.dimensionsMm.length, `${model.id}:length`);
  assertFinitePositive(model.dimensionsMm.width, `${model.id}:width`);
  assertFinitePositive(model.dimensionsMm.height, `${model.id}:height`);
  if (model.weightKg !== null) assertFinitePositive(model.weightKg, `${model.id}:weightKg`);
  if (model.ratedSpeedRpm !== null) assertFinitePositive(model.ratedSpeedRpm, `${model.id}:ratedSpeedRpm`);
  if (model.sweptVolumeM3h !== null) assertFinitePositive(model.sweptVolumeM3h, `${model.id}:sweptVolumeM3h`);
  if (model.connections.length !== 3 || new Set(model.connections.map((connection) => connection.id)).size !== 3) {
    throw new Error(`Catalogue compressor ${model.id} must define exactly one suction, discharge, and oil-injection record.`);
  }
  model.connections.forEach((port) => validatePort(port, model.id));
  return model;
};

const parsedCatalogue = rawCatalogue as { schemaVersion: string; units: string; models: CatalogueCompressorModel[] };

if (parsedCatalogue.units !== 'mm') {
  throw new Error(`Unsupported catalogue unit system: ${parsedCatalogue.units}`);
}

export const CATALOGUE_COMPRESSOR_MODELS: readonly CatalogueCompressorModel[] = Object.freeze(
  parsedCatalogue.models.map(validateModel),
);

export const getCatalogueCompressorModel = (id: string): CatalogueCompressorModel => {
  const model = CATALOGUE_COMPRESSOR_MODELS.find((candidate) => candidate.id === id);
  if (!model) throw new Error(`Catalogue compressor model not found: ${id}`);
  return model;
};

export const isAutomaticRoutingReady = (model: CatalogueCompressorModel): boolean =>
  model.connections.every((connection) => connection.coordinateStatus === 'verified' && connection.positionMm !== null && connection.direction !== null);
