import { BIM_LIBRARY, BimConnection } from './GfDdeBimLibrary';

export type Vec3 = [number, number, number];
export type LineService = 'suction' | 'discharge' | 'hotGas' | 'liquid' | 'oil' | 'defrost' | 'water' | 'default';
export type JointType = 'welded' | 'brazed' | 'flanged' | 'grooved';

export interface ScenePort {
  id: string;
  service: LineService;
  dn: number;
  position: Vec3;
  direction: Vec3;
}

export interface SceneEquipment {
  id: string;
  kind: string;
  position: Vec3;
  rotation?: number;
  params: {
    proId: string;
    tag: string;
    label: string;
    componentType: string;
    roomId: string;
    zone: 'compressor-bank' | 'receiver-rack' | 'roof-plant' | 'process-skid' | 'cold-room' | 'machine-room';
    mounting: 'floor' | 'roof' | 'platform';
    connectionType: JointType;
    manufacturer?: string;
    model?: string;
    catalogueModelId?: string;
    details?: any;
    elevationReviewRequired?: boolean;
    elevationHint?: string;
  };
  ports: ScenePort[];
}

export interface SceneValve {
  id: string;
  kind: string;
  position: Vec3;
  rotation: number;
  service: LineService;
  dn: number;
  manufacturer: string;
  tag: string;
  sourceEdgeId?: string;
}

export interface SceneSupport {
  id: string;
  kind: 'floor' | 'trapeze' | 'hanger' | 'riser-clamp' | 'rack-frame';
  position: Vec3;
  pipeId: string;
  height: number;
  width?: number;
  span?: number;
}

export interface SceneRoom {
  id: string;
  name: string;
  center: Vec3;
  width: number;
  depth: number;
  height: number;
  type: 'machine-room' | 'cold-room' | 'service-area' | 'roof-plant' | 'unknown';
}

export interface ScenePipe {
  id: string;
  type: LineService;
  radius: number;
  dn: number;
  service: LineService;
  waypoints: Vec3[];
  sourceEquipmentId: string;
  targetEquipmentId: string;
  sourcePortId: string;
  targetPortId: string;
  flowDirection: 'forward' | 'reverse';
  edgeLabel?: string;
  jointType: JointType;
  insulated: boolean;
  lineClass: string;
  rackTier: number;
}

export interface SceneGraph {
  room: { width: number; depth: number; height: number };
  rooms: SceneRoom[];
  equipment: SceneEquipment[];
  pipes: ScenePipe[];
  valves: SceneValve[];
  supports: SceneSupport[];
  meta: {
    refrigerant: string;
    cycle: string;
    colors: Record<LineService, string>;
    capacity: number;
    source: string;
    manufacturer: string;
    topologyValid: boolean;
    jointPolicy: string;
    cycleTemplate?: { id: string; title: string; expectedEquipment: string[] } | null;
    engineeringReadiness: { state: 'review-ready' | 'inputs-required'; missing: string[] };
    elevationHints?: ElevationHint[];
  };
}

// Reference-oriented industrial paint palette. These colours are visual defaults; facility paint schedules override them.
const COLORS: Record<LineService, string> = {
  // Reference convention: cyan suction, red hot gas/discharge, green secondary/liquid.
  suction: '#00A6C7',
  discharge: '#D32F2F',
  hotGas: '#D32F2F',
  liquid: '#2E8B57',
  oil: '#C59F16',
  defrost: '#7C3F6D',
  water: '#2E8B57',
  default: '#64748B',
};

const TIER_HEIGHT: Record<LineService, number> = {
  discharge: 5.75,
  hotGas: 5.45,
  suction: 4.72,
  liquid: 4.05,
  oil: 3.38,
  defrost: 3.70,
  water: 3.50,
  default: 4.30,
};

const SERVICE_LANE: Record<LineService, number> = {
  discharge: -0.72,
  hotGas: -0.42,
  suction: 0.00,
  liquid: 0.44,
  oil: 0.82,
  defrost: 1.10,
  water: 1.36,
  default: 0.22,
};

const DEFAULT_DN: Record<LineService, number> = {
  discharge: 100, hotGas: 100, suction: 150, liquid: 50, oil: 25, defrost: 32, water: 50, default: 50,
};

const SCALE = 0.075;
const DEFAULT_MANUFACTURER = 'Danfoss Industrial Refrigeration';

const normalizeDiagram = (data: any): any => {
  if (data?.nodes && Array.isArray(data.nodes)) return data;
  if (data?.diagram?.nodes && Array.isArray(data.diagram.nodes)) return data.diagram;
  if (data?.pidData?.nodes && Array.isArray(data.pidData.nodes)) return data.pidData;
  if (data?.pidData?.equipment && Array.isArray(data.pidData.equipment)) {
    return { ...data.pidData, nodes: data.pidData.equipment, edges: Array.isArray(data.pidData.pipes) ? data.pidData.pipes : [] };
  }
  if (data?.pidData2D?.nodes && Array.isArray(data.pidData2D.nodes)) return data.pidData2D;
  if (data?.equipment && Array.isArray(data.equipment)) {
    return { ...data, nodes: data.equipment, edges: Array.isArray(data.pipes) ? data.pipes : [] };
  }
  return null;
};

const words = (...values: any[]) => values.filter(Boolean).join(' ').toLowerCase();
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (v: Vec3, amount: number): Vec3 => [v[0] * amount, v[1] * amount, v[2] * amount];
const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const samePoint = (a: Vec3, b: Vec3) => distance(a, b) < 0.012;
const compactPath = (points: Vec3[]) => points.filter((point, index) => index === 0 || !samePoint(point, points[index - 1]));

const lineService = (edge: any, source?: any, target?: any): LineService => {
  const text = words(
    edge?.service, edge?.lineService, edge?.label, edge?.data?.service, edge?.data?.lineService, edge?.data?.medium,
    edge?.data?.type, source?.params?.componentType, target?.params?.componentType,
  );
  const stroke = edge?.style?.stroke || edge?.data?.style?.stroke || '';
  if (/suction|vapou?r|low.?pressure/.test(text) || stroke === '#1e88e5') return 'suction';
  if (/hot.?gas|defrost/.test(text) || stroke === '#f1c40f') return 'hotGas';
  if (/discharge|high.?pressure/.test(text) || stroke === '#c62828') return 'discharge';
  if (/oil/.test(text)) return 'oil';
  if (/water|glycol|brine/.test(text)) return 'water';
  if (/defrost/.test(text)) return 'defrost';
  if (/liquid|feed|receiver|condensate/.test(text) || ['#16a085', '#43a047', '#66bb6a', '#2e7d32', '#388e3c'].includes(stroke)) return 'liquid';
  return 'default';
};

const familyForNode = (node: any): string | null => {
  const type = words(node?.data?.componentType, node?.data?.subtype, node?.data?.model, node?.data?.label, node?.type);
  if (/scroll/.test(type)) return 'BIM_COMP_SCROLL';
  if (/recip|piston/.test(type)) return 'BIM_COMP_RECIP';
  if (/compressor|screw/.test(type)) return 'BIM_COMP_SCREW';
  if (/gas.?cooler/.test(type)) return 'BIM_GAS_COOLER';
  if (/air.?cooled.?condenser/.test(type)) return 'BIM_CONDENSER_AIR';
  if (/evaporative.?condenser|condenser/.test(type)) return 'BIM_CONDENSER_EVAP';
  if (/iqf|spiral|tunnel|unit.?cooler|air.?cooler|evaporator/.test(type)) return 'BIM_EVAP_UNIT';
  if (/oil.?separator/.test(type)) return 'BIM_OIL_SEPARATOR';
  if (/thermosiphon/.test(type)) return 'BIM_VESSEL_HORIZ';
  // The supplied reference calls for horizontal vessels by default. Vertical families remain available only for explicit future project rules.
  if (/vessel|receiver|accumulator/.test(type)) return 'BIM_VESSEL_HORIZ';
  if (/pump|circulator/.test(type)) return 'BIM_PUMP_CENTRIFUGAL';
  if (/ventilation.?fan/.test(type)) return 'BIM_VENTILATION_FAN';
  if (/gas.?detector|safety.?control|emergency.?shutdown|relief.?valve/.test(type)) return 'BIM_SAFETY_PANEL';
  if (/valve.?station|\bicf\b/.test(type)) return 'BIM_VALVE_STATION_ICF';
  if (/expansion|tev|txv/.test(type)) return 'BIM_VALVE_EXPANSION';
  if (/check.?valve/.test(type)) return 'BIM_VALVE_CHECK';
  if (/valve|solenoid|globe|shut.?off/.test(type)) return 'BIM_VALVE_GLOBE';
  if (/strainer/.test(type)) return 'BIM_STRAINER_Y';
  return null;
};

const resolveJointType = (edge: any, source: any, target: any, refrigerant: string, profileJointType?: string): JointType => {
  const explicit = words(edge?.data?.connectionType, edge?.connectionType, edge?.data?.jointType, source?.params?.details?.connectionType, target?.params?.details?.connectionType);
  if (/flange|flanged|bolted/.test(explicit)) return 'flanged';
  if (/groove|grooved|victaulic/.test(explicit)) return 'grooved';
  if (/braze|brazed/.test(String(profileJointType || ''))) return 'brazed';
  if (/weld|welded/.test(String(profileJointType || ''))) return 'welded';
  if (/717|ammonia|nh3/.test(refrigerant)) return 'welded';
  return 'brazed';
};

const nodeWorldPosition = (node: any, index: number, _family?: string): Vec3 => {
  const x = Number(node?.position?.x ?? node?.data?.x ?? index * 120);
  const z = Number(node?.position?.y ?? node?.data?.y ?? 0);
  const rawElevation = Number(node?.data?.elevation ?? node?.data?.mountingElevation ?? node?.elevation);
  // P&ID reading order and mounting labels are not certified elevations. A
  // missing value remains at the graphic datum and is surfaced as input-required.
  const y = Number.isFinite(rawElevation) ? rawElevation : 0;
  return [x * SCALE, y, z * SCALE];
};

const nodeRotation = (node: any): number => {
  const raw = Number(node?.rotation ?? node?.data?.rotation ?? 0);
  return Math.abs(raw) > Math.PI * 2 ? raw * Math.PI / 180 : raw;
};

/**
 * P&ID coordinates express logical reading order, not a certified construction
 * layout. This renderer-only transform assigns those semantic zones to a compact
 * plant preview while retaining every equipment-to-port and port-to-pipe mapping.
 * It never modifies the source P&ID, BOM, or calculation data.
 */
type PreviewZone = { centerX: number; centerZ: number; width: number; depth: number };

type ElevationHint = {
  equipmentId: string;
  equipmentTag: string;
  relationship: string;
  status: 'review-required';
  source: string;
  referenceUrl: string;
};

const translateEquipment = (item: SceneEquipment, nextPosition: Vec3) => {
  const delta: Vec3 = [
    nextPosition[0] - item.position[0],
    nextPosition[1] - item.position[1],
    nextPosition[2] - item.position[2],
  ];
  item.position = nextPosition;
  item.ports = item.ports.map((port) => ({ ...port, position: add(port.position, delta) }));
};

const previewZoneBounds = (items: SceneEquipment[]) => {
  const xs = items.map((item) => item.position[0]).filter(Number.isFinite);
  const zs = items.map((item) => item.position[2]).filter(Number.isFinite);
  if (!xs.length || !zs.length) return null;
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minZ: Math.min(...zs), maxZ: Math.max(...zs),
  };
};

const placePreviewZone = (items: SceneEquipment[], target: PreviewZone) => {
  if (!items.length) return;
  const source = previewZoneBounds(items);
  if (!source) return;

  const sourceCenterX = (source.minX + source.maxX) / 2;
  const sourceCenterZ = (source.minZ + source.maxZ) / 2;
  const sourceWidth = Math.max(0, source.maxX - source.minX);
  const sourceDepth = Math.max(0, source.maxZ - source.minZ);
  const scaleX = sourceWidth > .001 ? target.width / sourceWidth : 0;
  const scaleZ = sourceDepth > .001 ? target.depth / sourceDepth : 0;
  const scaleFactor = sourceWidth > .001 && sourceDepth > .001
    ? Math.min(scaleX, scaleZ)
    : sourceWidth > .001 ? scaleX : sourceDepth > .001 ? scaleZ : 0;

  items.forEach((item) => {
    const x = scaleFactor > 0 ? target.centerX + (item.position[0] - sourceCenterX) * scaleFactor : target.centerX;
    const z = scaleFactor > 0 ? target.centerZ + (item.position[2] - sourceCenterZ) * scaleFactor : target.centerZ;
    translateEquipment(item, [x, item.position[1], z]);
  });
};

const normalizePreviewPlantLayout = (equipment: SceneEquipment[]) => {
  const compressorBank = equipment.filter((item) => item.params.zone === 'compressor-bank');
  const receiverRack = equipment.filter((item) => item.params.zone === 'receiver-rack');
  const processSkid = equipment.filter((item) => item.params.zone === 'process-skid');
  const machineRoom = equipment.filter((item) => item.params.zone === 'machine-room');
  const coldRooms = equipment.filter((item) => item.params.zone === 'cold-room');
  const roofPlant = equipment.filter((item) => item.params.zone === 'roof-plant');

  // Values below are presentation envelopes in scene metres, not construction
  // set-out dimensions. Each zone retains the source equipment order and all
  // connected ports translate by exactly the same rigid offset as its equipment.
  placePreviewZone(compressorBank, { centerX: -5.6, centerZ: -0.9, width: 3.2, depth: 3.2 });
  placePreviewZone(receiverRack, { centerX: 4.2, centerZ: -0.2, width: 8.2, depth: 6.0 });
  placePreviewZone(processSkid, { centerX: 0, centerZ: 4.6, width: 14.0, depth: 4.0 });
  placePreviewZone(machineRoom, { centerX: -0.6, centerZ: -4.2, width: 13.0, depth: 2.8 });
  placePreviewZone(coldRooms, { centerX: 0, centerZ: 25.0, width: 24.0, depth: 8.0 });
  placePreviewZone(roofPlant, { centerX: 0, centerZ: 0, width: 14.0, depth: 8.0 });
};

const equipmentText = (item: SceneEquipment) => words(
  item.kind, item.params.componentType, item.params.label, item.params.tag,
  item.params.model, item.params.details?.type, item.params.details?.service,
);

/**
 * Validates declared ammonia elevations without moving any equipment. A P&ID is
 * not an elevation drawing and a renderer must never manufacture NPSH head,
 * thermosiphon head or architectural set-out values to make a picture look right.
 */
export const applyAmmoniaElevationHints = (equipment: SceneEquipment[], refrigerant: string, topologyEdges: any[] = []): ElevationHint[] => {
  if (!/717|ammonia|nh3/i.test(refrigerant)) return [];

  const hints: ElevationHint[] = [];
  const compressors = equipment.filter((item) => /compressor|screw|recip|piston/.test(equipmentText(item)));
  const oilCoolers = equipment.filter((item) => /oil.?cooler/.test(equipmentText(item)) && !/thermosiphon/.test(equipmentText(item)));
  const lpSeparators = equipment.filter((item) => /lp.?separator|low.?pressure.*separator|pump.?separator|surge.?drum/.test(equipmentText(item)));
  const pumps = equipment.filter((item) => /pump|circulator/.test(equipmentText(item)) && !/pump.?separator/.test(equipmentText(item)));
  const thermosiphons = equipment.filter((item) => /thermosiphon/.test(equipmentText(item)));
  const condensers = equipment.filter((item) => /condenser/.test(equipmentText(item)));
  const hpReceivers = equipment.filter((item) => /receiver/.test(equipmentText(item)) && !/thermosiphon/.test(equipmentText(item)));
  const hasDeclaredElevation = (item: SceneEquipment) => Number.isFinite(item.position[1]) && item.params.details?.elevationStatus !== 'layout-input-required';

  const review = (item: SceneEquipment, relationship: string, source: string, referenceUrl: string) => {
    item.params.elevationReviewRequired = true;
    item.params.elevationHint = relationship;
    hints.push({ equipmentId: item.id, equipmentTag: item.params.tag, relationship, status: 'review-required', source, referenceUrl });
  };
  const layoutRequired = (items: SceneEquipment[], relationship: string) => items.forEach((item) => review(item, relationship, 'Cool-Assist governed elevation contract', 'https://www.sabroe.com/products-and-solutions/vessels-and-heat-exchangers/psh_ir'));

  if ([...compressors, ...lpSeparators, ...pumps, ...thermosiphons, ...oilCoolers, ...condensers, ...hpReceivers].some((item) => !hasDeclaredElevation(item))) {
    layoutRequired([...lpSeparators, ...pumps, ...thermosiphons, ...oilCoolers], 'Layout input required: declared equipment/nozzle elevations, pump NPSHr and suction-line loss are required. Preview geometry was not altered.');
    return hints;
  }

  const maxCompressorY = compressors.length ? Math.max(...compressors.map((item) => item.position[1])) : null;
  lpSeparators.forEach((item) => review(item,
    maxCompressorY !== null && item.position[1] > maxCompressorY
      ? 'Declared LP separator elevation is above the compressor datum; validate actual suction nozzle elevations, gravity path and NPSHa.'
      : 'Declared LP separator elevation is not above the compressor datum; revise layout before engineering issue.',
    'Pump-recirculation gravity/NPSH relationship', 'https://www.sabroe.com/products-and-solutions/vessels-and-heat-exchangers/psh_ir'));

  const minSeparatorY = lpSeparators.length ? Math.min(...lpSeparators.map((item) => item.position[1])) : null;
  pumps.forEach((item) => {
    const declaredNpshr = Number(item.params.details?.npshRequiredM ?? item.params.details?.npshrM);
    const declaredSuctionLoss = Number(item.params.details?.suctionLineLossPa ?? item.params.details?.suctionLineLossKPa);
    const elevationOk = minSeparatorY !== null && item.position[1] < minSeparatorY;
    const npshInputsPresent = Number.isFinite(declaredNpshr) && declaredNpshr > 0 && Number.isFinite(declaredSuctionLoss) && declaredSuctionLoss >= 0;
    review(item,
      elevationOk
        ? (npshInputsPresent
          ? 'Declared pump centreline is below the LP separator datum. NPSHr and suction-line loss are supplied; calculate NPSHa with actual liquid state, vapour pressure, density, nozzle levels and all losses before issue.'
          : 'Declared pump centreline is below the LP separator datum, but vendor NPSHr and suction-line loss are absent; NPSH screening remains input-required.')
        : 'Declared pump centreline is not below the LP separator datum; revise layout and calculate NPSHa/NPSHr.',
      'Sabroe PSH Pump Vessel functional guidance', 'https://www.sabroe.com/products-and-solutions/vessels-and-heat-exchangers/psh_ir');
  });

  thermosiphons.forEach((item) => {
    if (!oilCoolers.length) {
      review(item, 'No separately tagged oil cooler exists; thermosiphon static-head validation is input-required.', 'Johnson Controls/Frick Form 070.900-E', 'https://docs.johnsoncontrols.com/industrialrefrigeration/api/khub/documents/BH19x4fUCKPFuKaJnbr16A/content');
      return;
    }
    const coolerY = Math.max(...oilCoolers.map((cooler) => cooler.position[1]));
    const actualHead = item.position[1] - coolerY;
    review(item,
      actualHead > 1.8
        ? `Declared thermosiphon source is ${actualHead.toFixed(2)} m above oil-cooler datum; calculate required head from loop pressure loss before issue.`
        : `Declared thermosiphon head is ${actualHead.toFixed(2)} m; validate against loop pressure loss. Do not treat the preview as compliant.`,
      'Johnson Controls/Frick Form 070.900-E', 'https://docs.johnsoncontrols.com/industrialrefrigeration/api/khub/documents/BH19x4fUCKPFuKaJnbr16A/content');
  });

  const edgeExists = (from: SceneEquipment[], to: SceneEquipment[]) => from.some((source) => to.some((target) => topologyEdges.some((edge) => String(edge?.source) === source.id && String(edge?.target) === target.id)));
  thermosiphons.forEach((item) => {
    const hasReceiverSupply = edgeExists(hpReceivers, [item]);
    const hasDowncomer = edgeExists([item], oilCoolers);
    const hasTwoPhaseReturn = edgeExists(oilCoolers, [item]);
    const topology = hasReceiverSupply && hasDowncomer && hasTwoPhaseReturn
      ? 'Receiver supply plus closed thermosiphon oil-cooler loop are represented in the P&ID.'
      : 'Thermosiphon supply/return topology is incomplete in the P&ID.';
    review(item, `${topology} Declared source-to-oil-cooler elevation is screened separately; required circulation head must be calculated from actual loop losses.`, 'Johnson Controls/Frick Form 070.900-E', 'https://docs.johnsoncontrols.com/industrialrefrigeration/api/khub/documents/BH19x4fUCKPFuKaJnbr16A/content');
  });

  return hints;
};

const rotateY = (point: Vec3, yaw: number): Vec3 => {
  const [x, y, z] = point;
  return [x * Math.cos(yaw) - z * Math.sin(yaw), y, x * Math.sin(yaw) + z * Math.cos(yaw)];
};

const portsFor = (familyId: string, position: Vec3, rotation: number): ScenePort[] => {
  const def = BIM_LIBRARY.find(item => item.id === familyId);
  if (!def) return [];
  return def.connections.map((connection: BimConnection) => {
    const local: Vec3 = [connection.pos.x, connection.pos.y, connection.pos.z];
    const localDirection: Vec3 = [connection.dir.x, connection.dir.y, connection.dir.z];
    return {
      id: connection.id,
      service: (connection.type === 'gas' ? 'hotGas' : connection.type) as LineService,
      dn: connection.dn,
      position: add(position, rotateY(local, rotation)),
      direction: rotateY(localDirection, rotation),
    };
  });
};

const portScore = (port: ScenePort, service: LineService, requested: any): number => {
  const request = String(requested || '').toLowerCase();
  let score = 0;
  if (request && (port.id.toLowerCase() === request || port.id.toLowerCase().includes(request))) score += 100;
  if (port.service === service) score += 28;
  if ((service === 'hotGas' || service === 'discharge') && /discharge|hot|gas/.test(port.id)) score += 24;
  if (service === 'suction' && /suction|vapor|return/.test(port.id)) score += 24;
  if (service === 'liquid' && /liquid|inlet|outlet|feed/.test(port.id)) score += 14;
  return score;
};

const selectPort = (equipment: SceneEquipment, service: LineService, requested: any): ScenePort => {
  const candidates = [...equipment.ports].sort((a, b) => portScore(b, service, requested) - portScore(a, service, requested));
  return candidates[0] || { id: 'center', service, dn: DEFAULT_DN[service], position: [equipment.position[0], 1.3, equipment.position[2]], direction: [0, 1, 0] };
};

const pipeRadius = (dn: number): number => Math.max(0.038, Math.min(0.245, dn / 900));
const lineClass = (service: LineService, refrigerant: string) => `${refrigerant}-${service === 'default' ? 'process' : service}`.toUpperCase();

const routePipe = (start: ScenePort, end: ScenePort, service: LineService, lineIndex: number): Vec3[] => {
  const tier = Math.max(TIER_HEIGHT[service], start.position[1] + 0.80, end.position[1] + 0.80);
  const startLead = add(start.position, scale(start.direction, 0.72));
  const endLead = add(end.position, scale(end.direction, 0.72));
  const startTier: Vec3 = [startLead[0], tier, startLead[2]];
  const endTier: Vec3 = [endLead[0], tier, endLead[2]];
  const lane = SERVICE_LANE[service] + ((lineIndex % 2) ? 0.16 : -0.16);
  const dx = Math.abs(endTier[0] - startTier[0]);
  const dz = Math.abs(endTier[2] - startTier[2]);
  const rackPath: Vec3[] = dx >= dz
    ? [startTier, [startTier[0], tier, (startTier[2] + endTier[2]) / 2 + lane], [endTier[0], tier, (startTier[2] + endTier[2]) / 2 + lane], endTier]
    : [startTier, [(startTier[0] + endTier[0]) / 2 + lane, tier, startTier[2]], [(startTier[0] + endTier[0]) / 2 + lane, tier, endTier[2]], endTier];
  return compactPath([start.position, startLead, ...rackPath, endLead, end.position]);
};

const supportsFor = (pipe: ScenePipe): SceneSupport[] => {
  const supports: SceneSupport[] = [];
  const spacing = pipe.dn >= 150 ? 5.8 : pipe.dn >= 100 ? 5.2 : 4.6;
  for (let i = 0; i < pipe.waypoints.length - 1; i += 1) {
    const a = pipe.waypoints[i];
    const b = pipe.waypoints[i + 1];
    const length = distance(a, b);
    const vertical = Math.abs(a[1] - b[1]) > Math.max(Math.abs(a[0] - b[0]), Math.abs(a[2] - b[2]));
    if (vertical && length > 2.5) {
      supports.push({ id: `${pipe.id}-riser-clamp-${i}`, kind: 'riser-clamp', position: [a[0], (a[1] + b[1]) / 2, a[2]], pipeId: pipe.id, height: (a[1] + b[1]) / 2, width: 0.42 });
      continue;
    }
    if (!vertical && Math.max(a[1], b[1]) >= 3.2 && length > 2.6) {
      const count = Math.max(1, Math.floor(length / spacing));
      for (let step = 1; step <= count; step += 1) {
        const t = step / (count + 1);
        const point: Vec3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        supports.push({
          id: `${pipe.id}-rack-${i}-${step}`,
          kind: point[1] >= 4.1 ? 'trapeze' : 'hanger',
          position: [point[0], 0, point[2]],
          pipeId: pipe.id,
          height: point[1],
          width: Math.max(1.50, pipe.radius * 9 + 1.15),
          span: spacing,
        });
      }
    }
  }
  return supports;
};

const zoneFor = (family: string, roomId: string): SceneEquipment['params']['zone'] => {
  if (family === 'BIM_CONDENSER_EVAP') return 'roof-plant';
  if (/BIM_COMP/.test(family)) return 'compressor-bank';
  if (family === 'BIM_VESSEL_HORIZ') return 'receiver-rack';
  if (/BIM_VALVE|BIM_STRAINER|BIM_PUMP/.test(family)) return 'process-skid';
  if (/cold|freez|evap|iqf|tunnel|spiral/i.test(roomId)) return 'cold-room';
  return 'machine-room';
};

const resolveRoomId = (node: any) => String(node?.data?.roomId || node?.data?.zoneId || node?.parentId || node?.data?.area || 'machine-room');

const deriveRooms = (equipment: SceneEquipment[], rawRooms: any[]): SceneRoom[] => {
  const explicit = (rawRooms || []).map((room: any, index: number): SceneRoom => ({
    id: String(room.id || room.name || `room-${index + 1}`),
    name: room.name || room.label || `Room ${index + 1}`,
    center: [Number(room.x ?? room.position?.x ?? 0) * SCALE, 0, Number(room.y ?? room.position?.y ?? 0) * SCALE],
    width: Math.max(10, Number(room.width || room.bounds?.width || 160) * SCALE),
    depth: Math.max(10, Number(room.depth || room.bounds?.height || room.height || 120) * SCALE),
    height: Number(room.ceilingHeight || room.height3D || 6.5),
    type: /roof|outdoor|terrace/i.test(room.type || room.name || '') ? 'roof-plant' : /cold|evap|hall|freez/i.test(room.type || room.name || '') ? 'cold-room' : 'machine-room',
  }));
  if (explicit.length) return explicit;
  const groups = new Map<string, SceneEquipment[]>();
  equipment.filter(item => item.params.zone !== 'roof-plant').forEach(item => groups.set(item.params.roomId, [...(groups.get(item.params.roomId) || []), item]));
  const derived = [...groups.entries()].map(([id, items]): SceneRoom => {
    const xs = items.map(item => item.position[0]);
    const zs = items.map(item => item.position[2]);
    return {
      id,
      name: id === 'machine-room' ? 'Central Machine Room' : id,
      center: [(Math.min(...xs) + Math.max(...xs)) / 2, 0, (Math.min(...zs) + Math.max(...zs)) / 2],
      width: Math.max(14, Math.max(...xs) - Math.min(...xs) + 11),
      depth: Math.max(14, Math.max(...zs) - Math.min(...zs) + 11),
      height: 6.5,
      type: /cold|hall|room|freez/i.test(id) && id !== 'machine-room' ? 'cold-room' : 'machine-room',
    };
  });
  const roof = equipment.filter(item => item.params.zone === 'roof-plant');
  if (roof.length) {
    const xs = roof.map(item => item.position[0]); const zs = roof.map(item => item.position[2]);
    derived.push({ id: 'roof-plant', name: 'Roof Condenser Platform', center: [(Math.min(...xs) + Math.max(...xs)) / 2, 6.5, (Math.min(...zs) + Math.max(...zs)) / 2], width: Math.max(12, Math.max(...xs) - Math.min(...xs) + 10), depth: Math.max(12, Math.max(...zs) - Math.min(...zs) + 10), height: 1.2, type: 'roof-plant' });
  }
  return derived;
};

const valvesFromNodes = (nodes: any[], equipmentById: Map<string, SceneEquipment>, manufacturer: string): SceneValve[] => nodes
  .filter(node => /valve|tev|txv|strainer|check/.test(words(node?.data?.componentType, node?.data?.label)))
  .map((node, index) => {
    const instance = equipmentById.get(String(node.id));
    const service = lineService({ data: node.data });
    return { id: String(node.id || `valve-${index + 1}`), kind: node.data?.componentType || 'globe_valve', position: instance?.position || nodeWorldPosition(node, index), rotation: instance?.rotation || nodeRotation(node), service, dn: Number(node.data?.dn || node.data?.size || DEFAULT_DN[service]), manufacturer: node.data?.manufacturer || manufacturer, tag: node.data?.tag || node.data?.label || `V-${index + 1}` };
  });

export const buildSceneGraph = (data: any): SceneGraph => {
  const diagram = normalizeDiagram(data);
  const semanticCycle = data?.semanticCycle || data?.pidData?.metadata?.semanticCycle || diagram?.metadata?.semanticCycle || null;
  const refrigerant = String(data?.systemParams?.refrigerant || data?.project?.refrigerant || data?.projectInfo?.refrigerant || data?.pidData?.refrigerant || data?.metadata?.refrigerant || diagram?.metadata?.refrigerant || 'R404A').replace('-', '');
  const synchronization = data?.synchronization || null;
  const synchronizedLines = Array.isArray(synchronization?.piping?.lines)
    ? synchronization.piping.lines
    : (Array.isArray(data?.pipingRegister?.lines) ? data.pipingRegister.lines : []);
  const synchronizedEquipment = Array.isArray(synchronization?.equipment)
    ? synchronization.equipment
    : (Array.isArray(data?.equipmentRegister) ? data.equipmentRegister : []);
  const procurementOverrides = Array.isArray(synchronization?.procurement?.equipmentOverrides)
    ? synchronization.procurement.equipmentOverrides
    : [];
  const profileJointType = synchronization?.refrigerant?.piping?.jointType;
  const manufacturer = data?.specification?.valveManufacturer || data?.metadata?.valveManufacturer || DEFAULT_MANUFACTURER;
  const nodes = diagram?.nodes || [];
  const edges = diagram?.edges || [];
  const equipment: SceneEquipment[] = [];
  const equipmentById = new Map<string, SceneEquipment>();

  nodes.forEach((node: any, index: number) => {
    const family = familyForNode(node);
    if (!family) return;
    const roomId = resolveRoomId(node);
    const position = nodeWorldPosition(node, index, family);
    const rotation = nodeRotation(node);
    const synchronizedEquipmentRecord = synchronizedEquipment.find((record: any) =>
      String(record?.id || record?.tag || '') === String(node.id || node.data?.tag || '')
    );
    const procurementOverride = procurementOverrides.find((override: any) =>
      String(override?.equipmentId || '') === String(node.id || node.data?.tag || '')
    );
    const explicitJoint = resolveJointType({ data: node.data }, null, null, refrigerant, profileJointType);
    const item: SceneEquipment = {
      id: String(node.id || `equipment-${index + 1}`),
      kind: String(node.data?.componentType || node.type || 'equipment'),
      position,
      rotation,
      params: { proId: family, tag: String(node.data?.tag || node.id || `EQ-${index + 1}`), label: String(node.data?.label || node.data?.componentType || family), componentType: String(node.data?.componentType || node.type || 'equipment'), roomId, zone: zoneFor(family, roomId), mounting: (family === 'BIM_CONDENSER_EVAP' || family === 'BIM_CONDENSER_AIR') ? 'roof' : /platform|skid/i.test(words(node?.data?.mounting, node?.data?.location)) ? 'platform' : 'floor', connectionType: explicitJoint, manufacturer: procurementOverride?.selectedBrand || synchronizedEquipmentRecord?.manufacturer || node.data?.manufacturer || node.data?.details?.manufacturer, model: procurementOverride?.selectedModel || synchronizedEquipmentRecord?.model || node.data?.model || node.data?.details?.model, catalogueModelId: node.data?.details?.catalogueModelId || null, details: { ...(node.data?.details || {}), elevationStatus: node.data?.elevationStatus || node.data?.details?.elevationStatus || 'layout-input-required', procurementTier: procurementOverride?.selectedTier || null, procurementRenderUpdateStatus: procurementOverride?.renderUpdateStatus || null, procurementEngineeringCompatibility: procurementOverride?.engineeringCompatibility || null } },
      ports: portsFor(family, position, rotation),
    };
    equipment.push(item);
    equipmentById.set(item.id, item);
  });

  normalizePreviewPlantLayout(equipment);
  const elevationHints = applyAmmoniaElevationHints(equipment, refrigerant, edges);

  const pipes: ScenePipe[] = [];
  const supports: SceneSupport[] = [];
  edges.forEach((edge: any, index: number) => {
    const source = equipmentById.get(String(edge.source));
    const target = equipmentById.get(String(edge.target));
    if (!source || !target) return;
    const synchronizedLine = synchronizedLines.find((line: any) =>
      String(line?.id || '') === String(edge?.id || '') ||
      (String(line?.sourceEquipmentId || '') === String(edge?.source || '') && String(line?.targetEquipmentId || '') === String(edge?.target || ''))
    );
    const service = (synchronizedLine?.service || lineService(edge, source, target)) as LineService;
    const sourcePort = selectPort(source, service, edge.sourcePort || edge.data?.sourcePort || edge.data?.fromPort || synchronizedLine?.sourcePortId);
    const targetPort = selectPort(target, service, edge.targetPort || edge.data?.targetPort || edge.data?.toPort || synchronizedLine?.targetPortId);
    const rawDn = synchronizedLine?.dn || edge.data?.dn || edge.data?.nominalDiameter || edge.dn;
    const parsedDn = Number(String(rawDn || '').replace(/[^0-9.]/g, ''));
    const dn = Number.isFinite(parsedDn) && parsedDn > 0 ? parsedDn : Math.max(sourcePort.dn, targetPort.dn, DEFAULT_DN[service]);
    const id = String(edge.id || `line-${index + 1}`);
    const line: ScenePipe = {
      id, type: service, radius: pipeRadius(dn), dn, service,
      waypoints: routePipe(sourcePort, targetPort, service, index),
      sourceEquipmentId: source.id, targetEquipmentId: target.id, sourcePortId: sourcePort.id, targetPortId: targetPort.id,
      flowDirection: 'forward', edgeLabel: edge.label || edge.data?.label,
      jointType: resolveJointType(edge, source, target, refrigerant, synchronizedLine?.jointPolicy || profileJointType),
      insulated: Boolean(edge?.data?.insulated ?? edge?.insulated),
      lineClass: lineClass(service, refrigerant), rackTier: TIER_HEIGHT[service],
    };
    pipes.push(line);
    supports.push(...supportsFor(line));
  });

  const supportedPipeIds = new Set(supports.map(support => support.pipeId));
  pipes.filter(pipe => !supportedPipeIds.has(pipe.id)).forEach(pipe => {
    const candidates = pipe.waypoints.slice(0, -1).map((a, index) => ({ a, b: pipe.waypoints[index + 1] }))
      .filter(segment => Math.abs(segment.a[1] - segment.b[1]) < .05 && segment.a[1] > 3.0)
      .sort((a, b) => distance(b.a, b.b) - distance(a.a, a.b));
    const segment = candidates[0];
    if (!segment) return;
    const point: Vec3 = [(segment.a[0] + segment.b[0]) / 2, segment.a[1], (segment.a[2] + segment.b[2]) / 2];
    supports.push({ id: `${pipe.id}-review-rack`, kind: point[1] >= 4.1 ? 'trapeze' : 'hanger', position: [point[0], 0, point[2]], pipeId: pipe.id, height: point[1], width: Math.max(1.50, pipe.radius * 9 + 1.15), span: 0 });
  });
  const dedupedSupports = new Map<string, SceneSupport>();
  supports.forEach(support => {
    const key = `${support.kind}-${Math.round(support.position[0] / 1.6)}-${Math.round(support.position[2] / 1.6)}-${Math.round(support.height / .5)}`;
    if (!dedupedSupports.has(key)) dedupedSupports.set(key, support);
  });
  const rooms = deriveRooms(equipment, data?.rooms || data?.layout?.rooms || diagram?.rooms || []);
  const explicitDn = edges.length > 0 && edges.every((edge: any) => Number(edge?.data?.dn || edge?.data?.nominalDiameter || edge?.dn) > 0);
  const missing = [
    !explicitDn && 'DN قطعی همه خطوط',
    !(data?.systemParams?.designPressure || data?.specification?.designPressure) && 'فشار طراحی',
    !(data?.specification?.pipeMaterial || data?.specification?.pipeSchedule) && 'متریال و schedule لوله',
    !(data?.mechanical?.supportDesign || data?.specification?.supportStandard || data?.layout?.roofLoad) && 'طراحی و بار ساپورت',
  ].filter(Boolean) as string[];
  if (elevationHints.length) missing.push('تأیید مهندس مسئول برای روابط ارتفاعی تجهیزات آمونیاک و داده‌های NPSH/هد');
  const width = rooms.length ? Math.max(...rooms.map(room => room.width + Math.abs(room.center[0]) * 2)) : 20;
  const depth = rooms.length ? Math.max(...rooms.map(room => room.depth + Math.abs(room.center[2]) * 2)) : 20;

  return {
    room: { width: Math.max(18, width), depth: Math.max(18, depth), height: Math.max(7, ...rooms.map(room => room.height)) },
    rooms, equipment, pipes, valves: valvesFromNodes(nodes, equipmentById, manufacturer), supports: [...dedupedSupports.values()],
    meta: { refrigerant, cycle: data?.systemParams?.cycle || data?.cycle || diagram?.metadata?.cycle || 'DESIGN_SPECIFIC', colors: COLORS, capacity: Number(data?.summary?.totalCoolingLoad || data?.capacity || 0), source: diagram ? 'PID_TO_BIM_GENERATED' : 'NO_PID_DATA', manufacturer, topologyValid: Boolean(diagram && equipment.length && pipes.length), jointPolicy: /717|ammonia|nh3/.test(refrigerant) ? 'R717 PIPE-RUNS DEFAULT TO WELDED; FLANGES REQUIRE EXPLICIT SOURCE DATA' : 'PIPE JOINTS REQUIRE EXPLICIT SOURCE DATA', cycleTemplate: semanticCycle?.template || null, engineeringReadiness: { state: missing.length ? 'inputs-required' : 'review-ready', missing }, elevationHints },
  };
};
