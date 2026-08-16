export type EquipmentCategory = 'condenser' | 'liquid-pump' | 'evaporator';

export interface EquipmentSourceRef {
  documentTitle: string;
  publisher: string;
  page: number;
  section?: string;
}

export interface EquipmentConnectionPort {
  id: string;
  label: string;
  role: 'hot-gas-inlet' | 'liquid-outlet' | 'suction' | 'discharge' | 'water-in' | 'water-out' | 'drain' | 'overflow' | 'defrost';
  allowedNominalBoresMm: readonly number[];
  connectionTypes: readonly string[];
  positionMm: readonly [number, number, number] | null;
  direction: readonly [number, number, number] | null;
  coordinateStatus: 'verified' | 'requires-manufacturer-ga';
}

export interface BaseEquipmentModel {
  id: string;
  manufacturer: string;
  family: string;
  model: string;
  category: EquipmentCategory;
  dimensionsMm: Readonly<Record<string, number>>;
  connectionPorts: readonly EquipmentConnectionPort[];
  sourceRefs: readonly EquipmentSourceRef[];
  geometryReadiness: 'parametric-reference' | 'requires-manufacturer-ga';
}

export interface CondenserCatalogueModel extends BaseEquipmentModel {
  category: 'condenser';
  heatRejectionMbh: number;
  nominalTonsAmmonia: number;
  airflowCfm: number;
  fanMotorHp: number;
  sprayPumpHp?: number;
  operatingWeightKg: number;
}

export interface LiquidPumpCatalogueModel extends BaseEquipmentModel {
  category: 'liquid-pump';
  minFlowM3h: number;
  maxFlowM3h: number;
  motorPowerKw: number;
  pnRatingBar: number;
  operatingWeightKg: number;
}

export interface EvaporatorCatalogueModel extends BaseEquipmentModel {
  category: 'evaporator';
  surfaceAreaM2: number;
  airflowCfm: number;
  defrostType: 'air' | 'electric' | 'hot-gas' | 'water';
  operatingWeightKg: number;
}

export type PhaseThreeEquipmentModel = CondenserCatalogueModel | LiquidPumpCatalogueModel | EvaporatorCatalogueModel;

export const assertEquipmentFinitePositive = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite, positive number.`);
  }
  return value;
};

export const assertEquipmentFiniteNonNegative = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite, non-negative number.`);
  }
  return value;
};

export const isFiniteEquipmentVector3 = (value: unknown): value is readonly [number, number, number] =>
  Array.isArray(value) && value.length === 3 && value.every((n) => typeof n === 'number' && Number.isFinite(n));
