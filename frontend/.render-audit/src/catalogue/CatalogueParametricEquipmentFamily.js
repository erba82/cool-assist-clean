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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogueParametricEquipmentFamily = void 0;
const THREE = __importStar(require("three"));
const CatalogueEquipmentTypes_1 = require("./CatalogueEquipmentTypes");
const MILLIMETRES_PER_METRE = 1000;
const toMetres = (value, label) => (0, CatalogueEquipmentTypes_1.assertEquipmentFinitePositive)(value, label) / MILLIMETRES_PER_METRE;
const condenserMaterial = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.3 });
const pumpMaterial = new THREE.MeshStandardMaterial({ color: '#047857', metalness: 0.6, roughness: 0.25 });
const evaporatorMaterial = new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.5, roughness: 0.4 });
const nozzleMaterial = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.15 });
class CatalogueParametricEquipmentFamily {
    constructor(model) {
        this.model = model;
    }
    createAssembly() {
        if (this.model.geometryReadiness !== 'parametric-reference') {
            throw new Error(`${this.model.id} requires manufacturer confirmation before 3D generation.`);
        }
        const lengthMm = this.model.dimensionsMm.length ?? this.model.dimensionsMm.faceToFace ?? 1000;
        const heightMm = this.model.dimensionsMm.height ?? 1000;
        const widthMm = this.model.dimensionsMm.width ?? 1000;
        const length = toMetres(lengthMm, `${this.model.id}:length`);
        const height = toMetres(heightMm, `${this.model.id}:height`);
        const width = toMetres(widthMm, `${this.model.id}:width`);
        const group = new THREE.Group();
        group.name = `catalogue-equipment-${this.model.id}`;
        group.userData = {
            manufacturer: this.model.manufacturer,
            family: this.model.family,
            model: this.model.model,
            category: this.model.category,
            sourceRefs: this.model.sourceRefs,
        };
        let material = condenserMaterial;
        if (this.model.category === 'liquid-pump')
            material = pumpMaterial;
        if (this.model.category === 'evaporator')
            material = evaporatorMaterial;
        const body = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), material);
        body.position.set(0, height / 2, 0);
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);
        const connectionPorts = this.model.connectionPorts.map((port) => {
            const pos = port.positionMm ?? [0, height / 2, 0];
            const dir = port.direction ?? [0, 1, 0];
            const positionM = [
                pos[0] / MILLIMETRES_PER_METRE,
                pos[1] / MILLIMETRES_PER_METRE,
                pos[2] / MILLIMETRES_PER_METRE,
            ];
            const direction = [dir[0], dir[1], dir[2]];
            const portAnchor = new THREE.Group();
            portAnchor.name = `port-${port.id}`;
            portAnchor.position.set(positionM[0], positionM[1], positionM[2]);
            portAnchor.userData = { id: port.id, direction, coordinateStatus: port.coordinateStatus, nominalBoresMm: port.allowedNominalBoresMm, connectionTypes: port.connectionTypes };
            const nominalBoreMm = Math.min(...port.allowedNominalBoresMm);
            const nozzleRadius = toMetres(nominalBoreMm, `${this.model.id}:${port.id}:bore`) / 2;
            const nozzleLength = Math.max(nozzleRadius * 0.8, 0.015);
            const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(nozzleRadius, nozzleRadius, nozzleLength, 16), nozzleMaterial);
            nozzle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(direction[0], direction[1], direction[2]).normalize());
            nozzle.castShadow = true;
            portAnchor.add(nozzle);
            group.add(portAnchor);
            return {
                id: port.id,
                positionM,
                direction,
                nominalBoresMm: port.allowedNominalBoresMm,
                connectionTypes: port.connectionTypes,
                coordinateStatus: port.coordinateStatus,
            };
        });
        const boundingBox = new THREE.Box3().setFromObject(group);
        const routingReady = connectionPorts.every((port) => port.coordinateStatus !== 'requires-manufacturer-ga');
        group.userData.routingReady = routingReady;
        return { group, boundingBox, connectionPorts, isRoutingReady: routingReady };
    }
}
exports.CatalogueParametricEquipmentFamily = CatalogueParametricEquipmentFamily;
