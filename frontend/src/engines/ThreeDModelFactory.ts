import * as THREE from 'three';
import { BIM_LIBRARY, BIM_MATERIALS, BimConnection } from './GfDdeBimLibrary';
import { instantiateCatalogueRenderAsset } from '../catalogue/CatalogueRenderDispatcher';

export interface PlacedEquipment {
  tag: string;
  group: THREE.Group;
  connections: BimConnection[];
  bbox: THREE.Box3;
}

export class ThreeDModelFactory {
  private materials: Record<string, THREE.MeshStandardMaterial> = {};

  constructor() {
    this._initMaterials();
    console.log("[ThreeDModelFactory] Industrial BIM Engine Initialized.");
  }

  private _initMaterials() {
    for (const [key, rawDef] of Object.entries(BIM_MATERIALS)) {
      const def = rawDef as any;
      this.materials[key] = new THREE.MeshStandardMaterial({
        color: def.color,
        metalness: def.metalness ?? 0.5,
        roughness: def.roughness ?? 0.5,
        transparent: def.transparent ?? false,
        opacity: def.opacity ?? 1.0,
        envMapIntensity: def.envMapIntensity ?? 1.0
      });
    }
  }

  createEquipment(id: string, tag: string, position: THREE.Vector3, rotation: THREE.Euler): PlacedEquipment | null {
    const equipDef = BIM_LIBRARY.find(e => e.id === id);
    if (!equipDef) {
      console.error(`[ThreeDModelFactory] Equipment definition not found: ${id}`);
      return null;
    }

    const group = new THREE.Group();
    group.name = tag;

    equipDef.primitives.forEach(prim => {
      let geo: THREE.BufferGeometry;
      switch (prim.type) {
        case 'box': geo = new THREE.BoxGeometry(...prim.params); break;
        case 'cylinder': geo = new THREE.CylinderGeometry(...prim.params); break;
        case 'sphere': geo = new THREE.SphereGeometry(...prim.params); break;
        case 'torus': geo = new THREE.TorusGeometry(...prim.params); break;
        default: geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      }
      const material = this.materials[prim.mat] || new THREE.MeshStandardMaterial({ color: 0x888888 });
      const mesh = new THREE.Mesh(geo, material);
      mesh.position.set(prim.pos.x, prim.pos.y, prim.pos.z);
      mesh.rotation.set(prim.rot.x, prim.rot.y, prim.rot.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    equipDef.connections.forEach(conn => {
      const flange = this.buildFlange(conn.dn, 'STAINLESS_STEEL');
      flange.position.set(conn.pos.x, conn.pos.y, conn.pos.z);
      const dir = new THREE.Vector3(conn.dir.x, conn.dir.y, conn.dir.z);
      const lookAtTarget = new THREE.Vector3().addVectors(new THREE.Vector3(conn.pos.x, conn.pos.y, conn.pos.z), dir);
      flange.lookAt(lookAtTarget);
      group.add(flange);
    });

    group.position.copy(position);
    group.rotation.copy(rotation);
    const bbox = new THREE.Box3().setFromObject(group);
    return { tag, group, connections: equipDef.connections, bbox };
  }

  /** Build a catalogue-backed parametric asset through the active scene factory. */
  createCatalogueEquipment(catalogueModelId: string, tag: string, position: THREE.Vector3, rotation: THREE.Euler): PlacedEquipment & { routingReady: boolean } {
    const asset = instantiateCatalogueRenderAsset(catalogueModelId);
    asset.group.name = tag;
    asset.group.position.copy(position);
    asset.group.rotation.copy(rotation);
    // Geometry may render from catalogue envelopes even where manufacturer GA data
    // does not yet permit safe automatic routing. Never synthesize a port frame.
    const connections: BimConnection[] = asset.ports
      .filter((port) => port.positionM !== null && port.direction !== null && port.coordinateStatus === 'verified')
      .map((port) => ({
        id: port.id,
        type: 'catalogue',
        dn: 0,
        pos: { x: port.positionM![0], y: port.positionM![1], z: port.positionM![2] },
        dir: { x: port.direction![0], y: port.direction![1], z: port.direction![2] },
      }));
    return { tag, group: asset.group, connections, bbox: new THREE.Box3().setFromObject(asset.group), routingReady: asset.routingReady };
  }

  public buildFlange(nominalDN: number, matKey: string): THREE.Group {
    const group = new THREE.Group();
    const dn = nominalDN || 50;
    const outerRadius = Math.max(0.02, (dn / 1000) * 1.5);
    const innerRadius = (dn / 1000) * 0.5;
    const thickness = 0.03;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const holePath = new THREE.Path();
    holePath.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(holePath);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
    const mat = this.materials[matKey] || new THREE.MeshStandardMaterial({ color: 0x95a5a6, metalness: 0.9 });
    const flangeDisc = new THREE.Mesh(geo, mat);
    flangeDisc.castShadow = true;
    flangeDisc.receiveShadow = true;
    group.add(flangeDisc);
    const boltCount = dn > 150 ? 12 : 8;
    const boltCircleRadius = (outerRadius + innerRadius) / 2 + (outerRadius - innerRadius) * 0.25;
    const boltGeo = new THREE.CylinderGeometry(0.012, 0.012, thickness * 1.5, 8);
    const boltMat = this.materials['MOTOR_BLACK'] || new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
    for (let i = 0; i < boltCount; i++) {
      const angle = (i / boltCount) * Math.PI * 2;
      const bolt = new THREE.Mesh(boltGeo, boltMat);
      bolt.position.set(Math.cos(angle) * boltCircleRadius, Math.sin(angle) * boltCircleRadius, thickness / 2);
      bolt.rotation.x = Math.PI / 2;
      group.add(bolt);
    }
    return group;
  }

  dispose() {
    Object.values(this.materials).forEach(m => m.dispose());
  }
}

export const buildPipeMesh = (radius: number, length: number, color: string, isInsulated: boolean = false) => {
  const group = new THREE.Group();
  const pipeGeo = new THREE.CylinderGeometry(radius, radius, length, 24);
  const pipeMat = new THREE.MeshStandardMaterial({ color, metalness: 0.9, roughness: 0.1, envMapIntensity: 1.5 });
  const pipe = new THREE.Mesh(pipeGeo, pipeMat);
  pipe.castShadow = true;
  pipe.receiveShadow = true;
  group.add(pipe);
  if (isInsulated) {
    const jacketRadius = radius * 2.2;
    const jacketGeo = new THREE.CylinderGeometry(jacketRadius, jacketRadius, length - 0.05, 24);
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.8, metalness: 0.0, transparent: true, opacity: 0.9 });
    const jacket = new THREE.Mesh(jacketGeo, jacketMat);
    jacket.receiveShadow = true;
    group.add(jacket);
  }
  return group;
};

export const buildFlangePair = (nominalDN: number, color: string) => {
  const factory = new ThreeDModelFactory();
  return factory.buildFlange(nominalDN, 'STAINLESS_STEEL');
};
