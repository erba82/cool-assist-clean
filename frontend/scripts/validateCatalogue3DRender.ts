import * as THREE from 'three';
import {
  CATALOGUE_COMPRESSOR_MODELS,
  CATALOGUE_VALVE_MODELS,
  ALL_PHASE_THREE_MODELS,
  CatalogueScrewCompressorFamily,
  CatalogueParametricValveFamily,
  CatalogueParametricEquipmentFamily,
  createCatalogueScrewCompressorPidSymbol,
  createCatalogueValvePidSymbol,
  createCatalogueEquipmentPidSymbol,
} from '../src/catalogue';
import { ThreeDModelFactory } from '../src/engines/ThreeDModelFactory';

type AuditResult = {
  rendered: number;
  factoryRendered: number;
  pidSymbols: number;
  safetyBlocked: string[];
  meshCount: number;
};

type Assert = (condition: unknown, message: string) => asserts condition;
const assert: Assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const isFiniteBox = (box: THREE.Box3): boolean =>
  !box.isEmpty() && [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z].every(Number.isFinite);

const inspectGroup = (id: string, group: THREE.Group, boundingBox: THREE.Box3, expectedPortCount: number): number => {
  assert(group instanceof THREE.Group, `${id}: expected THREE.Group.`);
  assert(isFiniteBox(boundingBox), `${id}: bounding box is empty or non-finite.`);
  let meshes = 0;
  group.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
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
    const declared = anchor.userData.direction as readonly [number, number, number] | undefined;
    assert(declared && declared.length === 3, `${id}:${anchor.name} has no declared direction vector.`);
    const nozzle = anchor.children.find((child) => child instanceof THREE.Mesh) as THREE.Mesh | undefined;
    assert(nozzle, `${id}:${anchor.name} has no visible nozzle mesh.`);
    const actualAxis = new THREE.Vector3(0, 1, 0).applyQuaternion(nozzle.quaternion).normalize();
    const expectedAxis = new THREE.Vector3(declared[0], declared[1], declared[2]).normalize();
    assert(actualAxis.dot(expectedAxis) > 0.999, `${id}:${anchor.name} nozzle does not match its declared direction vector.`);
  });
  return meshes;
};

const scene = new THREE.Scene();
const result: AuditResult = { rendered: 0, factoryRendered: 0, pidSymbols: 0, safetyBlocked: [], meshCount: 0 };

for (const model of CATALOGUE_COMPRESSOR_MODELS) {
  const assembly = new CatalogueScrewCompressorFamily(model).createAssembly();
  const verifiedPortCount = model.connections.filter((port) => port.coordinateStatus === 'verified' && port.positionMm && port.direction).length;
  result.meshCount += inspectGroup(model.id, assembly.group, assembly.boundingBox, verifiedPortCount);
  const symbol = createCatalogueScrewCompressorPidSymbol(model);
  assert(symbol.lines.length > 0 && symbol.ports.length === 3, `${model.id}: compressor P&ID contract is incomplete.`);
  result.pidSymbols += 1;
  result.rendered += 1;
  scene.add(assembly.group);
}

for (const model of CATALOGUE_VALVE_MODELS) {
  const symbol = createCatalogueValvePidSymbol(model);
  assert(symbol.svg.includes('<svg'), `${model.id}: valve P&ID SVG missing.`);
  result.pidSymbols += 1;
  if (model.geometryReadiness === 'requires-manufacturer-ga') {
    let wasBlocked = false;
    try {
      new CatalogueParametricValveFamily(model).createAssembly();
    } catch {
      wasBlocked = true;
    }
    assert(wasBlocked, `${model.id}: expected safety block when manufacturer GA coordinates are unavailable.`);
    result.safetyBlocked.push(model.id);
    continue;
  }
  const assembly = new CatalogueParametricValveFamily(model).createAssembly();
  result.meshCount += inspectGroup(model.id, assembly.group, assembly.boundingBox, model.connectionPorts.length);
  assert(assembly.connectionPorts.every((port) => port.coordinateStatus !== 'requires-manufacturer-ga'), `${model.id}: routing-ready valve exposes incomplete port coordinates.`);
  result.rendered += 1;
  scene.add(assembly.group);
}

for (const model of ALL_PHASE_THREE_MODELS) {
  const assembly = new CatalogueParametricEquipmentFamily(model).createAssembly();
  result.meshCount += inspectGroup(model.id, assembly.group, assembly.boundingBox, model.connectionPorts.length);
  const symbol = createCatalogueEquipmentPidSymbol(model);
  assert(symbol.svg.includes('<svg'), `${model.id}: equipment P&ID SVG missing.`);
  result.pidSymbols += 1;
  result.rendered += 1;
  scene.add(assembly.group);
}

const activeFactory = new ThreeDModelFactory();
const factoryRenderableIds = [
  ...CATALOGUE_COMPRESSOR_MODELS.map((model) => model.id),
  ...CATALOGUE_VALVE_MODELS.filter((model) => model.geometryReadiness !== 'requires-manufacturer-ga').map((model) => model.id),
  ...ALL_PHASE_THREE_MODELS.map((model) => model.id),
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
