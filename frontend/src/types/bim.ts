export interface BimVector3 {
  x: number;
  y: number;
  z: number;
}

export interface BimPrimitive {
  type: 'box' | 'cylinder' | 'sphere' | 'torus';
  params: number[];
  pos: BimVector3;
  rot: BimVector3;
  mat: string;
}

export interface BimConnection {
  id: string;
  type: string;
  dn: number;
  pos: BimVector3;
  dir: BimVector3;
}

export interface BimEquipmentFamily {
  id: string;
  name: string;
  category: string;
  primitives: BimPrimitive[];
  connections: BimConnection[];
}
