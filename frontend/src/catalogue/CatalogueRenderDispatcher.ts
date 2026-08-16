import * as THREE from 'three';
import rawCompressorCatalogue from './catalogueCompressorModels.json';
import { CatalogueCompressorModel } from './CatalogueCompressorTypes';
import { CATALOGUE_VALVE_MODELS } from './CatalogueValveLibrary';
import { ALL_PHASE_THREE_MODELS } from './CatalogueEquipmentLibrary';

// The compressor source is independently validated by the catalogue index and audit script.
const CATALOGUE_COMPRESSOR_MODELS = (rawCompressorCatalogue as unknown as { models: CatalogueCompressorModel[] }).models;
import { CatalogueScrewCompressorFamily } from './CatalogueScrewCompressorFamily';
import { CatalogueParametricValveFamily } from './CatalogueParametricValveFamily';
import { CatalogueParametricEquipmentFamily } from './CatalogueParametricEquipmentFamily';

export interface CatalogueRenderAsset {
  id: string;
  group: THREE.Group;
  boundingBox: THREE.Box3;
  ports: readonly { id: string; positionM: readonly [number, number, number] | null; direction: readonly [number, number, number] | null; coordinateStatus: string }[];
  routingReady: boolean;
}

/**
 * Active scene-engine bridge. Callers provide a catalogue ID and receive a
 * renderable Three.js group with a finite bounding box and semantic port frames.
 */
export const instantiateCatalogueRenderAsset = (id: string): CatalogueRenderAsset => {
  const compressor = CATALOGUE_COMPRESSOR_MODELS.find((model) => model.id === id);
  if (compressor) {
    const assembly = new CatalogueScrewCompressorFamily(compressor).createAssembly();
    return {
      id,
      group: assembly.group,
      boundingBox: assembly.boundingBox,
      ports: assembly.ports.map((port) => ({ id: port.id, positionM: port.positionM, direction: port.direction, coordinateStatus: port.coordinateStatus })),
      routingReady: assembly.routingReady,
    };
  }

  const valve = CATALOGUE_VALVE_MODELS.find((model) => model.id === id);
  if (valve) {
    const assembly = new CatalogueParametricValveFamily(valve).createAssembly();
    return {
      id,
      group: assembly.group,
      boundingBox: assembly.boundingBox,
      ports: assembly.connectionPorts.map((port) => ({ id: port.id, positionM: port.positionM, direction: port.direction, coordinateStatus: port.coordinateStatus })),
      routingReady: assembly.isRoutingReady,
    };
  }

  const equipment = ALL_PHASE_THREE_MODELS.find((model) => model.id === id);
  if (equipment) {
    const assembly = new CatalogueParametricEquipmentFamily(equipment).createAssembly();
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
