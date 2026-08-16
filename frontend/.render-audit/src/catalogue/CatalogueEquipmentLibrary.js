"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPhaseThreeModel = exports.ALL_PHASE_THREE_MODELS = exports.EVAPORATOR_MODELS = exports.PUMP_MODELS = exports.CONDENSER_MODELS = void 0;
const condensers_catalog_json_1 = __importDefault(require("./condensers_catalog.json"));
const pumps_catalog_json_1 = __importDefault(require("./pumps_catalog.json"));
const evaporators_catalog_json_1 = __importDefault(require("./evaporators_catalog.json"));
const CatalogueEquipmentTypes_1 = require("./CatalogueEquipmentTypes");
const validateCondenser = (model) => {
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.heatRejectionMbh, `${model.id}:heatRejectionMbh`);
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.airflowCfm, `${model.id}:airflowCfm`);
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.operatingWeightKg, `${model.id}:operatingWeightKg`);
    return model;
};
const validatePump = (model) => {
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.minFlowM3h, `${model.id}:minFlowM3h`);
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.maxFlowM3h, `${model.id}:maxFlowM3h`);
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.motorPowerKw, `${model.id}:motorPowerKw`);
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.operatingWeightKg, `${model.id}:operatingWeightKg`);
    return model;
};
const validateEvaporator = (model) => {
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.surfaceAreaM2, `${model.id}:surfaceAreaM2`);
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.airflowCfm, `${model.id}:airflowCfm`);
    (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(model.operatingWeightKg, `${model.id}:operatingWeightKg`);
    return model;
};
const validateEquipmentModel = (model) => {
    if (!model.id || !model.manufacturer || !model.family || !model.model || !model.category) {
        throw new Error('Equipment entry is missing mandatory metadata.');
    }
    if (!model.sourceRefs.length) {
        throw new Error(`${model.id} must have traceable source references.`);
    }
    Object.entries(model.dimensionsMm).forEach(([name, value]) => {
        if (typeof value === 'number')
            (0, CatalogueEquipmentTypes_1.assertEquipmentFiniteNonNegative)(value, `${model.id}:${name}`);
    });
    model.connectionPorts.forEach((port) => {
        if (!port.allowedNominalBoresMm.length) {
            throw new Error(`${model.id}:${port.id} has no nominal bores.`);
        }
        port.allowedNominalBoresMm.forEach((bore) => (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(bore, `${model.id}:${port.id}:bore`));
    });
    if (model.category === 'condenser')
        return validateCondenser(model);
    if (model.category === 'liquid-pump')
        return validatePump(model);
    if (model.category === 'evaporator')
        return validateEvaporator(model);
    throw new Error(`Unknown equipment category: ${model.category}`);
};
const parseCatalogue = (raw) => {
    const parsed = raw;
    if (parsed.schemaVersion !== '1.0.0' || parsed.units !== 'mm') {
        throw new Error('Equipment catalogue schema or units unsupported.');
    }
    return Object.freeze(parsed.models.map(validateEquipmentModel));
};
exports.CONDENSER_MODELS = parseCatalogue(condensers_catalog_json_1.default);
exports.PUMP_MODELS = parseCatalogue(pumps_catalog_json_1.default);
exports.EVAPORATOR_MODELS = parseCatalogue(evaporators_catalog_json_1.default);
exports.ALL_PHASE_THREE_MODELS = Object.freeze([
    ...exports.CONDENSER_MODELS,
    ...exports.PUMP_MODELS,
    ...exports.EVAPORATOR_MODELS,
]);
const getPhaseThreeModel = (id) => {
    const model = exports.ALL_PHASE_THREE_MODELS.find((m) => m.id === id);
    if (!model)
        throw new Error(`Phase-three equipment model not found: ${id}`);
    return model;
};
exports.getPhaseThreeModel = getPhaseThreeModel;
