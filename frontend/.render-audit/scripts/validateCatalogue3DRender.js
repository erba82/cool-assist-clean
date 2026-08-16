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
const THREE = __importStar(require("three"));
const catalogue_1 = require("../src/catalogue");
const ThreeDModelFactory_1 = require("../src/engines/ThreeDModelFactory");
const assert = (condition, message) => {
    if (!condition)
        throw new Error(message);
};
const isFiniteBox = (box) => !box.isEmpty() && [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(Number.isFinite);
const inspectGroup = (id, group, boundingBox, expectedPortCount) => {
    assert(group instanceof THREE.Group, `${id}: expected THREE.Group.`);
    assert(isFiniteBox(boundingBox), `${id}: bounding box is empty or non-finite.`);
    let meshes = 0;
    group.traverse((node) => {
        if (!(node instanceof THREE.Mesh))
            return;
        meshes += 1;
        assert(node.geometry instanceof THREE.BufferGeometry, `${id}: mesh has no BufferGeometry.`);
        assert(node.material instanceof THREE.Material || Array.isArray(node.material), `${id}: mesh has no material.`);
        const position = node.geometry.getAttribute('position');
        assert(position && position.count > 0, `${id}: mesh geometry has no position attribute.`);
    });
    assert(meshes > 0, `${id}: no renderable mesh was created.`);
    const portAnchors = group.children.filter((child) => child.name.startsWith('connection-') || child.name.startsWith('port-'));
    assert(portAnchors.length === expectedPortCount, `${id}: expected ${expectedPortCount} port anchors, got ${portAnchors.length}.`);
    portAnchors.forEach((anchor) => {
        const declared = anchor.userData.direction;
        assert(declared && declared.length === 3, `${id}:${anchor.name} has no declared direction vector.`);
        const nozzle = anchor.children.find((child) => child instanceof THREE.Mesh);
        assert(nozzle, `${id}:${anchor.name} has no visible nozzle mesh.`);
        const actualAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(nozzle.quaternion).normalize();
        const expectedAxis = new THREE.Vector3(declared[0], declared[1], declared[2]).normalize();
        assert(actualAxis.dot(expectedAxis) > 0.999, `${id}:${anchor.name} nozzle does not match its declared direction vector.`);
    });
    return meshes;
};
const scene = new THREE.Scene();
const result = { rendered: 0, factoryRendered: 0, pidSymbols: 0, safetyBlocked: [], meshCount: 0 };
for (const model of catalogue_1.CATALOGUE_COMPRESSOR_MODELS) {
    const assembly = new catalogue_1.CatalogueScrewCompressorFamily(model).createAssembly();
    const verifiedPortCount = model.connections.filter((port) => port.coordinateStatus === 'verified' && port.positionMm && port.direction).length;
    result.meshCount += inspectGroup(model.id, assembly.group, assembly.boundingBox, verifiedPortCount);
    const symbol = (0, catalogue_1.createCatalogueScrewCompressorPidSymbol)(model);
    assert(symbol.lines.length > 0 && symbol.ports.length === 3, `${model.id}: compressor P&ID contract is incomplete.`);
    result.pidSymbols += 1;
    result.rendered += 1;
    scene.add(assembly.group);
}
for (const model of catalogue_1.CATALOGUE_VALVE_MODELS) {
    const symbol = (0, catalogue_1.createCatalogueValvePidSymbol)(model);
    assert(symbol.svg.includes('<svg'), `${model.id}: valve P&ID SVG missing.`);
    result.pidSymbols += 1;
    if (model.geometryReadiness === 'requires-manufacturer-ga') {
        let wasBlocked = false;
        try {
            new catalogue_1.CatalogueParametricValveFamily(model).createAssembly();
        }
        catch {
            wasBlocked = true;
        }
        assert(wasBlocked, `${model.id}: expected safety block when manufacturer GA coordinates are unavailable.`);
        result.safetyBlocked.push(model.id);
        continue;
    }
    const assembly = new catalogue_1.CatalogueParametricValveFamily(model).createAssembly();
    result.meshCount += inspectGroup(model.id, assembly.group, assembly.boundingBox, model.connectionPorts.length);
    assert(assembly.connectionPorts.every((port) => port.coordinateStatus !== 'requires-manufacturer-ga'), `${model.id}: routing-ready valve exposes incomplete port coordinates.`);
    result.rendered += 1;
    scene.add(assembly.group);
}
for (const model of catalogue_1.ALL_PHASE_THREE_MODELS) {
    const assembly = new catalogue_1.CatalogueParametricEquipmentFamily(model).createAssembly();
    result.meshCount += inspectGroup(model.id, assembly.group, assembly.boundingBox, model.connectionPorts.length);
    const symbol = (0, catalogue_1.createCatalogueEquipmentPidSymbol)(model);
    assert(symbol.svg.includes('<svg'), `${model.id}: equipment P&ID SVG missing.`);
    result.pidSymbols += 1;
    result.rendered += 1;
    scene.add(assembly.group);
}
const activeFactory = new ThreeDModelFactory_1.ThreeDModelFactory();
const factoryRenderableIds = [
    ...catalogue_1.CATALOGUE_COMPRESSOR_MODELS.map((model) => model.id),
    ...catalogue_1.CATALOGUE_VALVE_MODELS.filter((model) => model.geometryReadiness !== 'requires-manufacturer-ga').map((model) => model.id),
    ...catalogue_1.ALL_PHASE_THREE_MODELS.map((model) => model.id),
];
for (const id of factoryRenderableIds) {
    const asset = activeFactory.createCatalogueEquipment(id, `audit-${id}`, new THREE.Vector3(), new THREE.Euler());
    assert(isFiniteBox(asset.bbox), `${id}: active factory returned an invalid bounding box.`);
    assert(asset.group.children.length > 0, `${id}: active factory returned an empty group.`);
    result.factoryRendered += 1;
}
activeFactory.dispose();
assert(scene.children.length === result.rendered, `Scene child count ${scene.children.length} does not match rendered model count ${result.rendered}.`);
console.log(JSON.stringify({ ...result, sceneChildren: scene.children.length }, null, 2));
