export type ValveProductClass =
  | 'manual-stop'
  | 'manual-regulating'
  | 'solenoid'
  | 'check'
  | 'pilot-main'
  | 'control-station'
  | 'strainer';

export type ValveConnectionType =
  | 'butt-weld-din'
  | 'butt-weld-ansi'
  | 'socket-weld-ansi'
  | 'solder-din'
  | 'solder-ansi'
  | 'female-pipe-thread'
  | 'flange-set'
  | 'multiple';

export type ValveFlowDirection = 'unidirectional' | 'bidirectional' | 'application-defined';
export type ValveCoordinateStatus = 'verified' | 'derived-from-verified-dimension' | 'requires-manufacturer-ga';

export interface ValveCatalogueSourceRef {
  document: string;
  page: number | null;
  locator: string;
  verification: 'manufacturer-catalogue' | 'manufacturer-drawing' | 'unverified';
}

export interface ValveNamedDimensionsMm {
  faceToFace?: number;
  overallLength?: number;
  overallHeight?: number;
  centrelineToTop?: number;
  bodyDiameter?: number;
  [manufacturerDimension: string]: number | undefined;
}

export interface ValveConnectionPort {
  id: 'inlet' | 'outlet';
  processService: 'refrigerant';
  allowedNominalBoresMm: readonly number[];
  connectionTypes: readonly ValveConnectionType[];
  positionMm: readonly [number, number, number] | null;
  direction: readonly [number, number, number] | null;
  coordinateStatus: ValveCoordinateStatus;
}

export interface ValveCatalogueModel {
  id: string;
  manufacturer: 'Danfoss';
  family: string;
  model: string;
  productClass: ValveProductClass;
  topology: 'inline' | 'station' | 'reference-envelope';
  flowDirection: ValveFlowDirection;
  flowDirectionVector: readonly [number, number, number] | null;
  geometryReadiness: 'parametric-reference' | 'requires-manufacturer-ga';
  dimensionsMm: ValveNamedDimensionsMm;
  connectionPorts: readonly ValveConnectionPort[];
  sourceRefs: readonly ValveCatalogueSourceRef[];
}

export const assertValveFiniteNonNegative = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite, non-negative number.`);
  }
  return value;
};

export const assertValveFinitePositive = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite, positive number.`);
  }
  return value;
};

export const isFiniteVector3 = (value: readonly [number, number, number] | null): value is readonly [number, number, number] =>
  value !== null && value.every((component) => Number.isFinite(component));
