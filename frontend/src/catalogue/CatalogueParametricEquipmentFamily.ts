import * as THREE from 'three';
import { PhaseThreeEquipmentModel, EquipmentConnectionPort, assertEquipmentFinitePositive } from './CatalogueEquipmentTypes';

export interface ParametricEquipmentPortFrame {
  id: EquipmentConnectionPort['id'];
  positionM: readonly [number, number, number];
  direction: readonly [number, number, number];
  nominalBoresMm: readonly number[];
  connectionTypes: readonly string[];
  coordinateStatus: EquipmentConnectionPort['coordinateStatus'];
}

export interface ParametricEquipmentAssembly {
  group: THREE.Group;
  boundingBox: THREE.Box3;
  connectionPorts: readonly ParametricEquipmentPortFrame[];
  isRoutingReady: boolean;
}

const MILLIMETRES_PER_METRE = 1000;
const toMetres = (value: number, label: string): number => assertEquipmentFinitePositive(value, label) / MILLIMETRES_PER_METRE;

const condenserMaterial = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.3 });
const pumpMaterial = new THREE.MeshStandardMaterial({ color: '#047857', metalness: 0.6, roughness: 0.25 });
const evaporatorMaterial = new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.5, roughness: 0.4 });
const nozzleMaterial = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.85, roughness: 0.15 });

export class CatalogueParametricEquipmentFamily {
  public constructor(private readonly model: PhaseThreeEquipmentModel) {}

  public createAssembly(): ParametricEquipmentAssembly {
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
    if (this.model.category === 'liquid-pump') material = pumpMaterial;
    if (this.model.category === 'evaporator') material = evaporatorMaterial;

    const body = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), material);
    body.position.set(0, height / 2, 0);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const connectionPorts = this.model.connectionPorts.map((port): ParametricEquipmentPortFrame => {
      const pos = port.positionMm ?? [0, height / 2, 0];
      const dir = port.direction ?? [0, 1, 0];
      const positionM: readonly [number, number, number] = [
        pos[0] / MILLIMETRES_PER_METRE,
        pos[1] / MILLIMETRES_PER_METRE,
        pos[2] / MILLIMETRES_PER_METRE,
      ];
      const direction: readonly [number, number, number] = [dir[0], dir[1], dir[2]];

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
