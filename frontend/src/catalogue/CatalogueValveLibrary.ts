import rawValveCatalogue from './valves_catalog.json';
import { ValveCatalogueModel, assertValveFiniteNonNegative, assertValveFinitePositive, isFiniteVector3 } from './CatalogueValveTypes';

const isModelIdUnique = (models: readonly ValveCatalogueModel[]): boolean => new Set(models.map((model) => model.id)).size === models.length;

const validateValveModel = (model: ValveCatalogueModel): ValveCatalogueModel => {
  if (!model.id || !model.family || !model.model || !model.productClass) {
    throw new Error('Valve catalogue entry is missing mandatory identity metadata.');
  }
  if (model.connectionPorts.length !== 2 || new Set(model.connectionPorts.map((port) => port.id)).size !== 2) {
    throw new Error(`${model.id} must define exactly one inlet and one outlet port.`);
  }
  if (!model.sourceRefs.length) throw new Error(`${model.id} must include traceable source references.`);
  Object.entries(model.dimensionsMm).forEach(([name, value]) => {
    if (typeof value === 'number') assertValveFiniteNonNegative(value, `${model.id}:${name}`);
  });
  model.connectionPorts.forEach((port) => {
    if (!port.allowedNominalBoresMm.length) throw new Error(`${model.id}:${port.id} has no nominal-bore data.`);
    port.allowedNominalBoresMm.forEach((bore) => assertValveFinitePositive(bore, `${model.id}:${port.id}:nominalBoreMm`));
    if ((port.positionMm === null) !== (port.direction === null)) {
      throw new Error(`${model.id}:${port.id} must provide both position and direction or neither.`);
    }
    if (port.coordinateStatus !== 'requires-manufacturer-ga' && (!isFiniteVector3(port.positionMm) || !isFiniteVector3(port.direction))) {
      throw new Error(`${model.id}:${port.id} is marked as routing data but does not have a finite local frame.`);
    }
  });
  if (model.flowDirection === 'unidirectional' && !isFiniteVector3(model.flowDirectionVector)) {
    throw new Error(`${model.id} is unidirectional and requires a finite flow vector.`);
  }
  if (model.geometryReadiness === 'parametric-reference') {
    const length = model.dimensionsMm.faceToFace ?? model.dimensionsMm.overallLength;
    if (typeof length !== 'number') throw new Error(`${model.id} needs a verified face-to-face or overall length for parametric geometry.`);
    assertValveFinitePositive(length, `${model.id}:geometryLength`);
  }
  return model;
};

// JSON imports are untyped at the module boundary; validate every model below before exposing it as typed data.
const parsedCatalogue = rawValveCatalogue as unknown as { schemaVersion: string; units: string; models: ValveCatalogueModel[] };
if (parsedCatalogue.schemaVersion !== '1.0.0' || parsedCatalogue.units !== 'mm') {
  throw new Error('Valve catalogue schema or unit system is unsupported.');
}
if (!isModelIdUnique(parsedCatalogue.models)) throw new Error('Valve catalogue contains duplicate model IDs.');

export const CATALOGUE_VALVE_MODELS: readonly ValveCatalogueModel[] = Object.freeze(parsedCatalogue.models.map(validateValveModel));

export const getValveCatalogueModel = (id: string): ValveCatalogueModel => {
  const model = CATALOGUE_VALVE_MODELS.find((candidate) => candidate.id === id);
  if (!model) throw new Error(`Catalogue valve model not found: ${id}`);
  return model;
};

export const isValveRoutingReady = (model: ValveCatalogueModel): boolean =>
  model.geometryReadiness === 'parametric-reference' && model.connectionPorts.every((port) => port.coordinateStatus !== 'requires-manufacturer-ga' && isFiniteVector3(port.positionMm) && isFiniteVector3(port.direction));
