import * as THREE from 'three';
import {
  CatalogueCompressorModel,
  CataloguePort,
  assertDimensionVector,
  assertFinitePositive,
} from './CatalogueCompressorTypes';

export interface PortFrame {
  id: CataloguePort['id'];
  nominalDiameterMm: number | null;
  positionM: readonly [number, number, number] | null;
  direction: readonly [number, number, number] | null;
  coordinateStatus: CataloguePort['coordinateStatus'];
}

export interface CatalogueCompressorAssembly {
  group: THREE.Group;
  boundingBox: THREE.Box3;
  ports: readonly PortFrame[];
  routingReady: boolean;
}

const MILLIMETRES_PER_METRE = 1000;
const toMetres = (millimetres: number): number => assertFinitePositive(millimetres, 'millimetres') / MILLIMETRES_PER_METRE;

const createMaterial = (color: THREE.ColorRepresentation, metalness: number, roughness: number): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness });

const addMesh = (group: THREE.Group, geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, rotation: THREE.Euler): void => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.rotation.copy(rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
};

/**
 * Parametric construction of a catalog-backed, bare-shaft oil-injected screw
 * compressor. Overall dimensions are taken from the verified catalogue record.
 * Physical ports are intentionally omitted from automatic routing until a
 * manufacturer GA drawing supplies their local coordinate frames.
 */
export class CatalogueScrewCompressorFamily {
  public constructor(private readonly model: CatalogueCompressorModel) {
    assertDimensionVector([
      model.dimensionsMm.length,
      model.dimensionsMm.width,
      model.dimensionsMm.height,
    ]);
  }

  public createAssembly(): CatalogueCompressorAssembly {
    const length = toMetres(this.model.dimensionsMm.length);
    const width = toMetres(this.model.dimensionsMm.width);
    const height = toMetres(this.model.dimensionsMm.height);
    const group = new THREE.Group();
    group.name = `catalogue-compressor-${this.model.id}`;
    group.userData = {
      manufacturer: this.model.manufacturer,
      family: this.model.family,
      model: this.model.model,
      sourceRefs: this.model.sourceRefs,
      coordinateSystem: 'right-handed: x=shaft axis, y=vertical, z=transverse',
    };

    const baseMaterial = createMaterial('#334155', 0.82, 0.30);
    const casingMaterial = createMaterial('#1e40af', 0.44, 0.38);
    const steelMaterial = createMaterial('#94a3b8', 0.90, 0.16);
    const motorMaterial = createMaterial('#475569', 0.78, 0.26);

    const baseHeight = Math.max(0.08, height * 0.08);
    const casingRadius = Math.max(0.11, Math.min(height * 0.27, width * 0.30));
    const casingLength = Math.max(casingRadius * 2.5, length * 0.48);
    const motorLength = Math.max(casingRadius * 1.8, length * 0.27);
    const shaftLength = Math.max(0.08, length * 0.08);

    addMesh(group, new THREE.BoxGeometry(length, baseHeight, width * 0.80), baseMaterial, new THREE.Vector3(0, baseHeight / 2, 0), new THREE.Euler());
    addMesh(group, new THREE.CylinderGeometry(casingRadius, casingRadius, casingLength, 32), casingMaterial, new THREE.Vector3(-length * 0.08, baseHeight + casingRadius, 0), new THREE.Euler(0, 0, Math.PI / 2));
    addMesh(group, new THREE.CylinderGeometry(casingRadius * 1.05, casingRadius * 1.05, casingRadius * 0.18, 32), steelMaterial, new THREE.Vector3(-length * 0.08 - casingLength / 2, baseHeight + casingRadius, 0), new THREE.Euler(0, 0, Math.PI / 2));
    addMesh(group, new THREE.CylinderGeometry(casingRadius * 0.88, casingRadius * 0.88, motorLength, 28), motorMaterial, new THREE.Vector3(length * 0.16 + motorLength / 2, baseHeight + casingRadius, 0), new THREE.Euler(0, 0, Math.PI / 2));
    addMesh(group, new THREE.CylinderGeometry(casingRadius * 0.20, casingRadius * 0.20, shaftLength, 20), steelMaterial, new THREE.Vector3(length * 0.16 + motorLength + shaftLength / 2, baseHeight + casingRadius, 0), new THREE.Euler(0, 0, Math.PI / 2));
    addMesh(group, new THREE.BoxGeometry(length * 0.12, height * 0.23, width * 0.25), baseMaterial, new THREE.Vector3(-length * 0.30, baseHeight + height * 0.115, width * 0.24), new THREE.Euler());

    const ports = this.model.connections.map((connection): PortFrame => ({
      id: connection.id,
      nominalDiameterMm: connection.nominalDiameterMm,
      positionM: connection.positionMm ? [
        connection.positionMm[0] / MILLIMETRES_PER_METRE,
        connection.positionMm[1] / MILLIMETRES_PER_METRE,
        connection.positionMm[2] / MILLIMETRES_PER_METRE,
      ] : null,
      direction: connection.direction,
      coordinateStatus: connection.coordinateStatus,
    }));

    ports.filter((port) => port.positionM && port.direction).forEach((port) => {
      const radius = port.nominalDiameterMm ? toMetres(port.nominalDiameterMm) / 2 : 0.025;
      const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, Math.max(radius, 0.05), 20), steelMaterial);
      const direction = new THREE.Vector3(port.direction![0], port.direction![1], port.direction![2]).normalize();
      nozzle.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      nozzle.position.set(port.positionM![0], port.positionM![1], port.positionM![2]);
      nozzle.userData = { id: port.id, direction: port.direction, coordinateStatus: port.coordinateStatus };
      nozzle.castShadow = true;
      group.add(nozzle);
    });

    const boundingBox = new THREE.Box3().setFromObject(group);
    const routingReady = ports.length > 0 && ports.every((port) => port.coordinateStatus === 'verified' && port.positionM && port.direction);
    group.userData.routingReady = routingReady;
    return { group, boundingBox, ports, routingReady };
  }
}
