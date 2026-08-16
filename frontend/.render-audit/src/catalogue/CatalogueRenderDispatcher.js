"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantiateCatalogueRenderAsset = void 0;
const catalogueCompressorModels_json_1 = __importDefault(require("./catalogueCompressorModels.json"));
const CatalogueValveLibrary_1 = require("./CatalogueValveLibrary");
const CatalogueEquipmentLibrary_1 = require("./CatalogueEquipmentLibrary");
// The compressor source is independently validated by the catalogue index and audit script.
const CATALOGUE_COMPRESSOR_MODELS = catalogueCompressorModels_json_1.default.models;
const CatalogueScrewCompressorFamily_1 = require("./CatalogueScrewCompressorFamily");
const CatalogueParametricValveFamily_1 = require("./CatalogueParametricValveFamily");
const CatalogueParametricEquipmentFamily_1 = require("./CatalogueParametricEquipmentFamily");
/**
 * Active scene-engine bridge. Callers provide a catalogue ID and receive a
 * renderable Three.js group with a finite bounding box and semantic port frames.
 */
const instantiateCatalogueRenderAsset = (id) => {
    const compressor = CATALOGUE_COMPRESSOR_MODELS.find((model) => model.id === id);
    if (compressor) {
        const assembly = new CatalogueScrewCompressorFamily_1.CatalogueScrewCompressorFamily(compressor).createAssembly();
        return {
            id,
            group: assembly.group,
            boundingBox: assembly.boundingBox,
            ports: assembly.ports.map((port) => ({ id: port.id, positionM: port.positionM, direction: port.direction, coordinateStatus: port.coordinateStatus })),
            routingReady: assembly.routingReady,
        };
    }
    const valve = CatalogueValveLibrary_1.CATALOGUE_VALVE_MODELS.find((model) => model.id === id);
    if (valve) {
        const assembly = new CatalogueParametricValveFamily_1.CatalogueParametricValveFamily(valve).createAssembly();
        return {
            id,
            group: assembly.group,
            boundingBox: assembly.boundingBox,
            ports: assembly.connectionPorts.map((port) => ({ id: port.id, positionM: port.positionM, direction: port.direction, coordinateStatus: port.coordinateStatus })),
            routingReady: assembly.isRoutingReady,
        };
    }
    const equipment = CatalogueEquipmentLibrary_1.ALL_PHASE_THREE_MODELS.find((model) => model.id === id);
    if (equipment) {
        const assembly = new CatalogueParametricEquipmentFamily_1.CatalogueParametricEquipmentFamily(equipment).createAssembly();
        return {
            id,
            group: assembly.group,
            boundingBox: assembly.boundingBox,
            ports: assembly.connectionPorts.map((port) => ({ id: port.id, positionM: port.positionM, direction: port.direction, coordinateStatus: port.coordinateStatus })),
            routingReady: assembly.isRoutingReady,
        };
    }
    throw new Error(`No catalogue-backed render asset found for: ${id}`);
};
exports.instantiateCatalogueRenderAsset = instantiateCatalogueRenderAsset;
