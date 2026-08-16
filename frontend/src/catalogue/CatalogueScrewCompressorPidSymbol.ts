import { CatalogueCompressorModel } from './CatalogueCompressorTypes';

export interface PidPoint {
  x: number;
  y: number;
}

export interface PidLine {
  from: PidPoint;
  to: PidPoint;
  role: 'outline' | 'rotor' | 'shaft' | 'port';
}

export interface PidPortAnchor {
  id: 'suction' | 'discharge' | 'oil-injection';
  service: 'suction' | 'discharge' | 'oil';
  position: PidPoint;
  direction: PidPoint;
  nominalDiameterMm: number | null;
  coordinateStatus: 'schematic-only' | 'verified';
}

export interface CompressorPidSymbol {
  id: string;
  equipmentClass: 'oil-injected-screw-compressor';
  label: string;
  viewBox: { width: number; height: number };
  lines: readonly PidLine[];
  ports: readonly PidPortAnchor[];
  sourceModelId: string;
}

/**
 * Produces an equipment-class P&ID symbol. P&ID anchors are intentionally
 * schematic, while the 3D model remains blocked from automatic routing until
 * manufacturer local port coordinates are verified.
 */
export const createCatalogueScrewCompressorPidSymbol = (model: CatalogueCompressorModel): CompressorPidSymbol => {
  const suction = model.connections.find((connection) => connection.id === 'suction');
  const discharge = model.connections.find((connection) => connection.id === 'discharge');
  const oilInjection = model.connections.find((connection) => connection.id === 'oil-injection');

  return {
    id: `PID_${model.id}`,
    equipmentClass: 'oil-injected-screw-compressor',
    label: `${model.manufacturer} ${model.model}`,
    viewBox: { width: 120, height: 72 },
    lines: [
      { from: { x: 26, y: 18 }, to: { x: 94, y: 18 }, role: 'outline' },
      { from: { x: 94, y: 18 }, to: { x: 102, y: 36 }, role: 'outline' },
      { from: { x: 102, y: 36 }, to: { x: 94, y: 54 }, role: 'outline' },
      { from: { x: 94, y: 54 }, to: { x: 26, y: 54 }, role: 'outline' },
      { from: { x: 26, y: 54 }, to: { x: 18, y: 36 }, role: 'outline' },
      { from: { x: 18, y: 36 }, to: { x: 26, y: 18 }, role: 'outline' },
      { from: { x: 34, y: 28 }, to: { x: 72, y: 44 }, role: 'rotor' },
      { from: { x: 34, y: 44 }, to: { x: 72, y: 28 }, role: 'rotor' },
      { from: { x: 72, y: 36 }, to: { x: 112, y: 36 }, role: 'shaft' },
      { from: { x: 0, y: 36 }, to: { x: 18, y: 36 }, role: 'port' },
      { from: { x: 60, y: 0 }, to: { x: 60, y: 18 }, role: 'port' },
      { from: { x: 60, y: 54 }, to: { x: 60, y: 72 }, role: 'port' },
    ],
    ports: [
      { id: 'suction', service: 'suction', position: { x: 0, y: 36 }, direction: { x: -1, y: 0 }, nominalDiameterMm: suction ? suction.nominalDiameterMm : null, coordinateStatus: suction && suction.coordinateStatus === 'verified' ? 'verified' : 'schematic-only' },
      { id: 'discharge', service: 'discharge', position: { x: 60, y: 0 }, direction: { x: 0, y: -1 }, nominalDiameterMm: discharge ? discharge.nominalDiameterMm : null, coordinateStatus: discharge && discharge.coordinateStatus === 'verified' ? 'verified' : 'schematic-only' },
      { id: 'oil-injection', service: 'oil', position: { x: 60, y: 72 }, direction: { x: 0, y: 1 }, nominalDiameterMm: oilInjection ? oilInjection.nominalDiameterMm : null, coordinateStatus: oilInjection && oilInjection.coordinateStatus === 'verified' ? 'verified' : 'schematic-only' },
    ],
    sourceModelId: model.id,
  };
};
