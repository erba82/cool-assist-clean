import * as THREE from 'three';
import { ValveCatalogueModel, ValveConnectionPort, assertValveFinitePositive, isFiniteVector3 } from './CatalogueValveTypes';

export interface ParametricValvePortFrame {
  id: ValveConnectionPort['id'];
  positionM: readonly [number, number, number];
  direction: readonly [number, number, number];
  nominalBoresMm: readonly number[];
  connectionTypes: readonly string[];
  coordinateStatus: ValveConnectionPort['coordinateStatus'];
}

export interface ParametricValveAssembly {
  group: THREE.Group;
  boundingBox: THREE.Box3;
  connectionPorts: readonly ParametricValvePortFrame[];
  flowDirectionVector: readonly [number, number, number] | null;
  isRoutingReady: boolean;
}

const MILLIMETRES_PER_METRE = 1000;
const toMetres = (value: number, label: string): number => assertValveFinitePositive(value, label) / MILLIMETRES_PER_METRE;

const getDimension = (dimensions: ValveCatalogueModel['dimensionsMm'], keys: readonly string[], label: string): number => {
  for (const key of keys) {
    const value = dimensions[key];
    if (typeof value === 'number') return assertValveFinitePositive(value, `${label}:${key}`);
  }
  throw new Error(`${label} has no verified dimension for ${keys.join(', ')}.`);
};

const valveMaterial = new THREE.MeshStandardMaterial({ color: '#1e40af', metalness: 0.5, roughness: 0.35 });
const flangeMaterial = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.18 });

/**
 * A compact, source-traceable 3D envelope family for catalogued industrial valves.
 * It renders only records with a verified overall envelope and never invents a
 * body profile or routing connection where the manufacturer documents do not
 * provide enough geometry.
 */
export class CatalogueParametricValveFamily {
  public constructor(private readonly model: ValveCatalogueModel) {}

  public createAssembly(): ParametricValveAssembly {
    if (this.model.geometryReadiness !== 'parametric-reference') {
      throw new Error(`${this.model.id} requires a manufacturer GA drawing before a physical 3D envelope can be created.`);
    }

    const lengthMm = getDimension(this.model.dimensionsMm, ['faceToFace', 'overallLength'], this.model.id);
    const heightMm = getDimension(this.model.dimensionsMm, ['overallHeight', 'H2', 'bodyDiameter', 'B2', 'B1'], this.model.id);
    const widthMm = getDimension(this.model.dimensionsMm, ['planWidth', 'bodyDiameter', 'B2', 'B1', 'H3'], this.model.id);
    const length = toMetres(lengthMm, `${this.model.id}:length`);
    const height = toMetres(heightMm, `${this.model.id}:height`);
    const width = toMetres(widthMm, `${this.model.id}:width`);

    const group = new THREE.Group();
    group.name = `catalogue-valve-${this.model.id}`;
    group.userData = {
      manufacturer: this.model.manufacturer,
      family: this.model.family,
      model: this.model.model,
      productClass: this.model.productClass,
      flowDirection: this.model.flowDirection,
      flowDirectionVector: this.model.flowDirectionVector,
      sourceRefs: this.model.sourceRefs,
      coordinateSystem: 'right-handed: x=primary process-flow axis, y=vertical, z=transverse',
      geometryLevel: 'verified-envelope',
    };

    const body = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), valveMaterial);
    body.position.set(0, height / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const connectionPorts = this.model.connectionPorts.map((port): ParametricValvePortFrame => {
      if (!isFiniteVector3(port.positionMm) || !isFiniteVector3(port.direction)) {
        throw new Error(`${this.model.id}:${port.id} lacks a verified primary connection frame.`);
      }
      const positionM: readonly [number, number, number] = [
        port.positionMm[0] / MILLIMETRES_PER_METRE,
        port.positionMm[1] / MILLIMETRES_PER_METRE,
        port.positionMm[2] / MILLIMETRES_PER_METRE,
      ];
      const direction: readonly [number, number, number] = [port.direction[0], port.direction[1], port.direction[2]];
      const portAnchor = new THREE.Group();
      portAnchor.name = `connection-${port.id}`;
      portAnchor.position.set(positionM[0], positionM[1], positionM[2]);
      portAnchor.userData = { id: port.id, direction, coordinateStatus: port.coordinateStatus, nominalBoresMm: port.allowedNominalBoresMm, connectionTypes: port.connectionTypes };
      const nominalBoreMm = Math.min(...port.allowedNominalBoresMm);
      const nozzleRadius = toMetres(nominalBoreMm, `${this.model.id}:${port.id}:nominalBoreMm`) / 2;
      const nozzleLength = Math.max(nozzleRadius * 0.75, 0.012);
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(nozzleRadius, nozzleRadius, nozzleLength, 20), flangeMaterial);
      nozzle.rotation.z = Math.PI / 2;
      nozzle.position.set(positionM[0], positionM[1], positionM[2]);
      nozzle.userData = { id: port.id, direction, coordinateStatus: port.coordinateStatus, nominalBoresMm: port.allowedNominalBoresMm };
      nozzle.castShadow = true;
      portAnchor.add(nozzle);
      group.add(portAnchor);
      return { id: port.id, positionM, direction, nominalBoresMm: port.allowedNominalBoresMm, connectionTypes: port.connectionTypes, coordinateStatus: port.coordinateStatus };
    });

    const boundingBox = new THREE.Box3().setFromObject(group);
    const routingReady = connectionPorts.length === 2 && connectionPorts.every((port) => port.coordinateStatus !== 'requires-manufacturer-ga');
    group.userData.routingReady = routingReady;
    return { group, boundingBox, connectionPorts, flowDirectionVector: this.model.flowDirectionVector, isRoutingReady: routingReady };
  }

  public dispose(): void {
    valveMaterial.dispose();
    flangeMaterial.dispose();
  }
}
