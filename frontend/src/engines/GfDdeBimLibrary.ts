import { BimEquipmentFamily, BimConnection } from '../types/bim';
export type { BimEquipmentFamily as BimEquipmentDef, BimConnection };
export * from '../catalogue';

/**
 * GFDDE Industrial BIM Library v4.1
 * Professional Ammonia/R717 Component Models & Materials
 */

export const BIM_MATERIALS = {
  CARBON_STEEL: { color: '#334155', metalness: 0.8, roughness: 0.3 },
  STAINLESS_STEEL: { color: '#94a3b8', metalness: 0.9, roughness: 0.1 },
  PAINTED_BLUE: { color: '#1e40af', metalness: 0.4, roughness: 0.4 },
  PAINTED_WHITE: { color: '#f8fafc', metalness: 0.2, roughness: 0.6 },
  PAINTED_RED: { color: '#b91c1c', metalness: 0.4, roughness: 0.4 },
  BRASS: { color: '#b45309', metalness: 0.9, roughness: 0.2 },
  INSULATION: { color: '#1e293b', metalness: 0.0, roughness: 0.9 }
};

export const BIM_LIBRARY: BimEquipmentFamily[] = [
  {
    id: 'BIM_COMP_SCREW',
    name: 'Industrial Screw Compressor Skid',
    category: 'Compressors',
    primitives: [
      { type: 'box', params: [2.8, 0.2, 1.4], pos: { x: 0, y: 0.1, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.45, 0.45, 2.2, 32], pos: { x: 0.2, y: 0.65, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'PAINTED_BLUE' },
      { type: 'cylinder', params: [0.38, 0.38, 1.2, 24], pos: { x: -1.2, y: 0.65, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.35, 0.35, 0.8, 16], pos: { x: 0.5, y: 1.4, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' },
      { type: 'box', params: [0.6, 0.8, 0.2], pos: { x: 0.8, y: 0.6, z: 0.7 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' }
    ],
    connections: [
      { id: 'suction', type: 'suction', dn: 150, pos: { x: -1.8, y: 0.65, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'discharge', type: 'discharge', dn: 100, pos: { x: 0.5, y: 1.8, z: 0 }, dir: { x: 0, y: 1, z: 0 } }
    ]
  },
  {
    id: 'BIM_COMP_RECIP',
    name: 'Reciprocating Piston Compressor',
    category: 'Compressors',
    primitives: [
      { type: 'box', params: [1.8, 0.15, 1.0], pos: { x: 0, y: 0.08, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'box', params: [1.2, 1.0, 0.8], pos: { x: -0.2, y: 0.65, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' },
      { type: 'cylinder', params: [0.18, 0.18, 0.58, 16], pos: { x: -0.48, y: 1.26, z: 0.29 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' },
      { type: 'cylinder', params: [0.18, 0.18, 0.58, 16], pos: { x: 0.17, y: 1.26, z: 0.29 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' }
    ],
    connections: [
      { id: 'suction', type: 'suction', dn: 125, pos: { x: -1.72, y: 0.82, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'discharge', type: 'discharge', dn: 80, pos: { x: -0.35, y: 1.72, z: 0 }, dir: { x: 0, y: 1, z: 0 } }
    ]
  },
  {
    id: 'BIM_VESSEL_HORIZ',
    name: 'Horizontal Ammonia Receiver',
    category: 'Vessels',
    primitives: [
      { type: 'cylinder', params: [0.6, 0.6, 3.2, 32], pos: { x: 0, y: 0.8, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'STAINLESS_STEEL' },
      { type: 'sphere', params: [0.6, 24, 16], pos: { x: 1.6, y: 0.8, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' },
      { type: 'sphere', params: [0.6, 24, 16], pos: { x: -1.6, y: 0.8, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' },
      { type: 'box', params: [0.2, 0.4, 0.8], pos: { x: 1.0, y: 0.2, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'box', params: [0.2, 0.4, 0.8], pos: { x: -1.0, y: 0.2, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'liquid', dn: 100, pos: { x: 0, y: 1.4, z: 0 }, dir: { x: 0, y: 1, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 80, pos: { x: 1.2, y: 0.3, z: 0 }, dir: { x: 0, y: -1, z: 0 } }
    ]
  },
  {
    id: 'BIM_VESSEL_VERTICAL',
    name: 'Vertical Ammonia Accumulator',
    category: 'Vessels',
    primitives: [
      { type: 'cylinder', params: [0.75, 0.75, 3.9, 32], pos: { x: 0, y: 2.15, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' },
      { type: 'sphere', params: [0.75, 28, 20], pos: { x: 0, y: 4.1, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' },
      { type: 'sphere', params: [0.75, 28, 20], pos: { x: 0, y: 0.2, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' }
    ],
    connections: [
      { id: 'vapor-inlet', type: 'suction', dn: 125, pos: { x: -0.75, y: 3.1, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'liquid-outlet', type: 'liquid', dn: 80, pos: { x: 0, y: 0.3, z: 0 }, dir: { x: 0, y: -1, z: 0 } }
    ]
  },
  {
    id: 'BIM_CONDENSER_EVAP',
    name: 'Evaporative Condenser Unit',
    category: 'Condensers',
    primitives: [
      { type: 'box', params: [4.2, 3.5, 2.4], pos: { x: 0, y: 1.8, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' },
      { type: 'cylinder', params: [0.8, 0.8, 0.4, 32], pos: { x: 1.0, y: 3.7, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.8, 0.8, 0.4, 32], pos: { x: -1.0, y: 3.7, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'discharge', dn: 125, pos: { x: -2.1, y: 2.8, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 100, pos: { x: 0, y: 0.1, z: 0 }, dir: { x: 0, y: -1, z: 0 } }
    ]
  },
  {
    id: 'BIM_EVAP_UNIT',
    name: 'Industrial Unit Cooler',
    category: 'Evaporators',
    primitives: [
      { type: 'box', params: [3.2, 1.2, 1.4], pos: { x: 0, y: 0.6, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_WHITE' },
      { type: 'cylinder', params: [0.45, 0.45, 0.2, 32], pos: { x: 0.8, y: 0.6, z: 0.75 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.45, 0.45, 0.2, 32], pos: { x: -0.8, y: 0.6, z: 0.75 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'CARBON_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'liquid', dn: 40, pos: { x: -1.6, y: 0.4, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'suction', dn: 80, pos: { x: 1.6, y: 0.4, z: 0 }, dir: { x: 1, y: 0, z: 0 } }
    ]
  },
  {
    id: 'BIM_VALVE_GLOBE',
    name: 'Industrial Globe Isolation Valve',
    category: 'Valves',
    primitives: [
      { type: 'cylinder', params: [0.23, 0.23, 0.85, 20], pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'STAINLESS_STEEL' },
      { type: 'sphere', params: [0.32, 20, 16], pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' },
      { type: 'cylinder', params: [0.07, 0.07, 0.48, 12], pos: { x: 0, y: 0.45, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'torus', params: [0.24, 0.045, 10, 24], pos: { x: 0, y: 0.72, z: 0 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'PAINTED_RED' }
    ],
    connections: [
      { id: 'inlet', type: 'liquid', dn: 50, pos: { x: -0.46, y: 0, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 50, pos: { x: 0.46, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }
    ]
  },
  {
    id: 'BIM_VALVE_EXPANSION',
    name: 'Thermostatic Expansion Valve',
    category: 'Valves',
    primitives: [
      { type: 'cylinder', params: [0.18, 0.18, 0.72, 20], pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'BRASS' },
      { type: 'box', params: [0.42, 0.38, 0.42], pos: { x: 0, y: 0.16, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' },
      { type: 'cylinder', params: [0.08, 0.08, 0.42, 12], pos: { x: 0, y: 0.52, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'liquid', dn: 32, pos: { x: -0.38, y: 0, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 25, pos: { x: 0.38, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }
    ]
  },
  {
    id: 'BIM_VALVE_CHECK',
    name: 'Swing Check Valve',
    category: 'Valves',
    primitives: [
      { type: 'cylinder', params: [0.22, 0.22, 0.75, 20], pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'STAINLESS_STEEL' },
      { type: 'sphere', params: [0.28, 20, 16], pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'liquid', dn: 50, pos: { x: -0.40, y: 0, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 50, pos: { x: 0.40, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }
    ]
  },
  {
    id: 'BIM_STRAINER_Y',
    name: 'Y Strainer',
    category: 'Valves',
    primitives: [
      { type: 'cylinder', params: [0.19, 0.19, 0.72, 20], pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'STAINLESS_STEEL' },
      { type: 'cylinder', params: [0.17, 0.17, 0.58, 20], pos: { x: 0.06, y: -0.26, z: 0 }, rot: { x: 0, y: 0, z: -0.65 }, mat: 'STAINLESS_STEEL' },
      { type: 'torus', params: [0.16, 0.035, 10, 22], pos: { x: 0.20, y: -0.48, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' }
    ],
    connections: [
      { id: 'inlet', type: 'liquid', dn: 50, pos: { x: -0.39, y: 0, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 50, pos: { x: 0.39, y: 0, z: 0 }, dir: { x: 1, y: 0, z: 0 } }
    ]
  },
  {
    id: 'BIM_OIL_SEPARATOR',
    name: 'Industrial Oil Separator',
    category: 'Vessels',
    primitives: [
      { type: 'cylinder', params: [0.45, 0.45, 2.8, 24], pos: { x: 0, y: 1.6, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' },
      { type: 'sphere', params: [0.45, 20, 16], pos: { x: 0, y: 3.0, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' },
      { type: 'sphere', params: [0.45, 20, 16], pos: { x: 0, y: 0.2, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' },
      { type: 'cylinder', params: [0.08, 0.08, 0.45, 12], pos: { x: 0, y: 3.4, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'discharge', dn: 100, pos: { x: -0.45, y: 2.5, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'discharge', dn: 100, pos: { x: 0, y: 3.4, z: 0 }, dir: { x: 0, y: 1, z: 0 } },
      { id: 'oil-return', type: 'oil', dn: 25, pos: { x: 0, y: 0.2, z: 0 }, dir: { x: 0, y: -1, z: 0 } }
    ]
  },
  {
    id: 'BIM_PUMP_CENTRIFUGAL',
    name: 'Ammonia Liquid Pump',
    category: 'Pumps',
    primitives: [
      { type: 'box', params: [1.2, 0.15, 0.6], pos: { x: 0, y: 0.08, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.28, 0.28, 0.72, 20], pos: { x: -0.28, y: 0.42, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'PAINTED_BLUE' },
      { type: 'cylinder', params: [0.22, 0.22, 0.58, 16], pos: { x: 0.35, y: 0.42, z: 0 }, rot: { x: 0, y: 0, z: Math.PI / 2 }, mat: 'STAINLESS_STEEL' },
      { type: 'cylinder', params: [0.08, 0.08, 0.35, 12], pos: { x: -0.28, y: 0.82, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'liquid', dn: 80, pos: { x: -0.68, y: 0.42, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 80, pos: { x: -0.28, y: 0.82, z: 0 }, dir: { x: 0, y: 1, z: 0 } }
    ]
  },
  {
    id: 'BIM_COMP_SCROLL', name: 'Profile-Specific Scroll Compressor', category: 'Compressors',
    primitives: [
      { type: 'box', params: [1.5, 0.18, 0.9], pos: { x: 0, y: 0.09, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.43, 0.43, 0.92, 28], pos: { x: -0.22, y: 0.55, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' },
      { type: 'box', params: [0.46, 0.58, 0.56], pos: { x: 0.48, y: 0.46, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.06, 0.06, 0.35, 12], pos: { x: -0.22, y: 1.15, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'STAINLESS_STEEL' }
    ],
    connections: [
      { id: 'suction', type: 'suction', dn: 50, pos: { x: -0.8, y: 0.5, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'discharge', type: 'discharge', dn: 40, pos: { x: -0.22, y: 1.32, z: 0 }, dir: { x: 0, y: 1, z: 0 } }
    ]
  },
  {
    id: 'BIM_CONDENSER_AIR', name: 'Air-Cooled Condenser', category: 'Condensers',
    primitives: [
      { type: 'box', params: [4.4, 1.5, 1.2], pos: { x: 0, y: 0.75, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_WHITE' },
      { type: 'cylinder', params: [0.46, 0.46, 0.18, 28], pos: { x: -1.15, y: 1.55, z: 0 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.46, 0.46, 0.18, 28], pos: { x: 0, y: 1.55, z: 0 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.46, 0.46, 0.18, 28], pos: { x: 1.15, y: 1.55, z: 0 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'CARBON_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'discharge', dn: 50, pos: { x: -2.2, y: 1.1, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 32, pos: { x: 2.2, y: 0.35, z: 0 }, dir: { x: 1, y: 0, z: 0 } }
    ]
  },
  {
    id: 'BIM_GAS_COOLER', name: 'CO2 Gas Cooler', category: 'Condensers',
    primitives: [
      { type: 'box', params: [4.8, 1.15, 1.05], pos: { x: -1.08, y: 0.78, z: 0 }, rot: { x: 0, y: 0, z: -0.34 }, mat: 'PAINTED_WHITE' },
      { type: 'box', params: [4.8, 1.15, 1.05], pos: { x: 1.08, y: 0.78, z: 0 }, rot: { x: 0, y: 0, z: 0.34 }, mat: 'PAINTED_WHITE' },
      { type: 'cylinder', params: [0.42, 0.42, 0.18, 28], pos: { x: -1.08, y: 1.44, z: 0 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.42, 0.42, 0.18, 28], pos: { x: 1.08, y: 1.44, z: 0 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'CARBON_STEEL' }
    ],
    connections: [
      { id: 'inlet', type: 'discharge', dn: 50, pos: { x: -2.5, y: 1.1, z: 0 }, dir: { x: -1, y: 0, z: 0 } },
      { id: 'outlet', type: 'liquid', dn: 32, pos: { x: 2.5, y: 0.4, z: 0 }, dir: { x: 1, y: 0, z: 0 } }
    ]
  },
  {
    id: 'BIM_SAFETY_PANEL', name: 'Refrigerant Safety Control Panel', category: 'Safety',
    primitives: [
      { type: 'box', params: [0.82, 1.1, 0.16], pos: { x: 0, y: 0.55, z: 0 }, rot: { x: 0, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'sphere', params: [0.09, 16, 12], pos: { x: -0.2, y: 0.74, z: 0.1 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_RED' },
      { type: 'sphere', params: [0.07, 16, 12], pos: { x: 0.18, y: 0.74, z: 0.1 }, rot: { x: 0, y: 0, z: 0 }, mat: 'PAINTED_BLUE' }
    ],
    connections: []
  },
  {
    id: 'BIM_VENTILATION_FAN', name: 'Emergency Ventilation Fan', category: 'Safety',
    primitives: [
      { type: 'cylinder', params: [0.62, 0.62, 0.22, 28], pos: { x: 0, y: 0.65, z: 0 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'CARBON_STEEL' },
      { type: 'cylinder', params: [0.1, 0.1, 0.28, 16], pos: { x: 0, y: 0.65, z: 0.14 }, rot: { x: Math.PI / 2, y: 0, z: 0 }, mat: 'PAINTED_RED' }
    ],
    connections: []
  }
];
