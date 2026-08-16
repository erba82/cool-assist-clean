export type CompressorPortService = 'suction' | 'discharge' | 'oil-injection';

export interface CatalogueSourceRef {
  document: string;
  page: number | null;
  locator: string;
  verification: 'manufacturer-catalogue' | 'corroborating-catalogue' | 'unverified';
}

export interface CatalogueDimensionsMm {
  length: number;
  width: number;
  height: number;
}

export interface CataloguePort {
  id: CompressorPortService;
  nominalDiameterMm: number | null;
  positionMm: readonly [number, number, number] | null;
  direction: readonly [number, number, number] | null;
  coordinateStatus: 'verified' | 'requires-manufacturer-ga';
  sourceRefs: readonly CatalogueSourceRef[];
}

export interface CatalogueCompressorModel {
  id: string;
  manufacturer: 'Howden' | 'Mayekawa';
  family: string;
  model: string;
  compressorType: 'oil-injected-screw';
  refrigerants: readonly string[];
  dimensionsMm: CatalogueDimensionsMm;
  weightKg: number | null;
  ratedSpeedRpm: number | null;
  sweptVolumeM3h: number | null;
  connections: readonly CataloguePort[];
  sourceRefs: readonly CatalogueSourceRef[];
}

export const assertFinitePositive = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite, positive number.`);
  }
  return value;
};

export const assertDimensionVector = (value: readonly [number, number, number]): readonly [number, number, number] => {
  value.forEach((component, index) => assertFinitePositive(component, `dimension[${index}]`));
  return value;
};
