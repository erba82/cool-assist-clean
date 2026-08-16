"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAutomaticRoutingReady = exports.getCatalogueCompressorModel = exports.CATALOGUE_COMPRESSOR_MODELS = void 0;
const catalogueCompressorModels_json_1 = __importDefault(require("./catalogueCompressorModels.json"));
const CatalogueCompressorTypes_1 = require("./CatalogueCompressorTypes");
__exportStar(require("./CatalogueCompressorTypes"), exports);
__exportStar(require("./CatalogueScrewCompressorFamily"), exports);
__exportStar(require("./CatalogueScrewCompressorPidSymbol"), exports);
__exportStar(require("./CatalogueValveTypes"), exports);
__exportStar(require("./CatalogueValveLibrary"), exports);
__exportStar(require("./CatalogueParametricValveFamily"), exports);
__exportStar(require("./CatalogueValvePidSymbol"), exports);
__exportStar(require("./CatalogueEquipmentTypes"), exports);
__exportStar(require("./CatalogueEquipmentLibrary"), exports);
__exportStar(require("./CatalogueParametricEquipmentFamily"), exports);
__exportStar(require("./CatalogueEquipmentPidSymbol"), exports);
__exportStar(require("./CatalogueRenderDispatcher"), exports);
const isPortId = (value) => value === 'suction' || value === 'discharge' || value === 'oil-injection';
const validatePort = (port, modelId) => {
    if (!isPortId(port.id)) {
        throw new Error(`Catalogue compressor ${modelId} has an invalid port id.`);
    }
    if (port.nominalDiameterMm !== null) {
        (0, CatalogueCompressorTypes_1.assertFinitePositive)(port.nominalDiameterMm, `${modelId}:${port.id}:nominalDiameterMm`);
    }
    if ((port.positionMm === null) !== (port.direction === null)) {
        throw new Error(`Catalogue compressor ${modelId}:${port.id} must define both a position and direction, or neither.`);
    }
    if (port.coordinateStatus === 'verified' && (!port.positionMm || !port.direction)) {
        throw new Error(`Catalogue compressor ${modelId}:${port.id} cannot be verified without a local position and direction.`);
    }
    return port;
};
const validateModel = (model) => {
    if (!model.id || !model.manufacturer || !model.family || !model.model) {
        throw new Error('Catalogue compressor is missing mandatory identity metadata.');
    }
    (0, CatalogueCompressorTypes_1.assertFinitePositive)(model.dimensionsMm.length, `${model.id}:length`);
    (0, CatalogueCompressorTypes_1.assertFinitePositive)(model.dimensionsMm.width, `${model.id}:width`);
    (0, CatalogueCompressorTypes_1.assertFinitePositive)(model.dimensionsMm.height, `${model.id}:height`);
    if (model.weightKg !== null)
        (0, CatalogueCompressorTypes_1.assertFinitePositive)(model.weightKg, `${model.id}:weightKg`);
    if (model.ratedSpeedRpm !== null)
        (0, CatalogueCompressorTypes_1.assertFinitePositive)(model.ratedSpeedRpm, `${model.id}:ratedSpeedRpm`);
    if (model.sweptVolumeM3h !== null)
        (0, CatalogueCompressorTypes_1.assertFinitePositive)(model.sweptVolumeM3h, `${model.id}:sweptVolumeM3h`);
    if (model.connections.length !== 3 || new Set(model.connections.map((connection) => connection.id)).size !== 3) {
        throw new Error(`Catalogue compressor ${model.id} must define exactly one suction, discharge, and oil-injection record.`);
    }
    model.connections.forEach((port) => validatePort(port, model.id));
    return model;
};
const parsedCatalogue = catalogueCompressorModels_json_1.default;
if (parsedCatalogue.units !== 'mm') {
    throw new Error(`Unsupported catalogue unit system: ${parsedCatalogue.units}`);
}
exports.CATALOGUE_COMPRESSOR_MODELS = Object.freeze(parsedCatalogue.models.map(validateModel));
const getCatalogueCompressorModel = (id) => {
    const model = exports.CATALOGUE_COMPRESSOR_MODELS.find((candidate) => candidate.id === id);
    if (!model)
        throw new Error(`Catalogue compressor model not found: ${id}`);
    return model;
};
exports.getCatalogueCompressorModel = getCatalogueCompressorModel;
const isAutomaticRoutingReady = (model) => model.connections.every((connection) => connection.coordinateStatus === 'verified' && connection.positionMm !== null && connection.direction !== null);
exports.isAutomaticRoutingReady = isAutomaticRoutingReady;
