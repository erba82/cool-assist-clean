import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Grid, Html, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Box, Button, Stack, Typography } from '@mui/material';
import * as THREE from 'three';
import { buildSceneGraph, LineService, SceneEquipment, SceneGraph, ScenePipe, ScenePort, SceneSupport, Vec3 } from '../../engines/RefrigerationSceneEngine';
import { ThreeDModelFactory } from '../../engines/ThreeDModelFactory';

const vector = (point: Vec3) => new THREE.Vector3(point[0], point[1], point[2]);
const distance = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

type ViewMode = 'overview' | 'plant' | 'roof';

const SERVICE: Record<LineService, { label: string; paint: string; jacket: string; stripe: string }> = {
  suction: { label: 'SUCTION', paint: '#00A6C7', jacket: '#00A6C7', stripe: '#D9F7FB' },
  discharge: { label: 'DISCHARGE', paint: '#D32F2F', jacket: '#D32F2F', stripe: '#FDE1E1' },
  hotGas: { label: 'HOT GAS', paint: '#D32F2F', jacket: '#D32F2F', stripe: '#FDE1E1' },
  liquid: { label: 'LIQUID / SECONDARY', paint: '#2E8B57', jacket: '#2E8B57', stripe: '#DDF3E4' },
  oil: { label: 'OIL', paint: '#c89a18', jacket: '#c89a18', stripe: '#fef3c7' },
  defrost: { label: 'DEFROST', paint: '#7c3f6d', jacket: '#7c3f6d', stripe: '#f3e8ff' },
  water: { label: 'WATER', paint: '#27716a', jacket: '#27716a', stripe: '#ccfbf1' },
  default: { label: 'PROCESS', paint: '#64748b', jacket: '#64748b', stripe: '#e2e8f0' },
};

const PipeMaterial: React.FC<{ color: string; roughness?: number }> = ({ color, roughness = .34 }) => <meshStandardMaterial color={color} metalness={.58} roughness={roughness} envMapIntensity={.9} />;

const FlangedJoint: React.FC<{ point: Vec3; dn: number; direction?: Vec3 }> = ({ point, dn, direction = [0, 1, 0] }) => {
  const radius = Math.max(.06, Math.min(.30, dn / 760));
  const normal = vector(direction).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  const bolts = dn >= 125 ? 10 : dn >= 80 ? 8 : 4;
  return <group position={vector(point)} quaternion={quaternion}>
    <mesh castShadow receiveShadow><cylinderGeometry args={[radius * 1.32, radius * 1.32, .095, 28]} /><meshStandardMaterial color="#9aa8b5" metalness={.90} roughness={.20} /></mesh>
    {Array.from({ length: bolts }).map((_, index) => {
      const angle = index * Math.PI * 2 / bolts;
      return <mesh key={index} position={[Math.cos(angle) * radius * 1.03, .072, Math.sin(angle) * radius * 1.03]} castShadow><cylinderGeometry args={[.016, .016, .12, 8]} /><meshStandardMaterial color="#202b36" metalness={.88} roughness={.26} /></mesh>;
    })}
  </group>;
};

const WeldBead: React.FC<{ point: Vec3; radius: number; direction?: Vec3; color: string }> = ({ point, radius, direction = [0, 1, 0], color }) => {
  const normal = vector(direction).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
  return <group position={vector(point)} quaternion={quaternion}>
    <mesh castShadow><torusGeometry args={[radius * 1.015, Math.max(.006, radius * .08), 8, 20]} /><meshStandardMaterial color={color} metalness={.62} roughness={.33} /></mesh>
  </group>;
};

const RoundedPipe: React.FC<{ pipe: ScenePipe }> = ({ pipe }) => {
  const finish = SERVICE[pipe.service] || SERVICE.default;
  const segments = useMemo(() => pipe.waypoints.slice(0, -1).map((start, index) => {
    const end = pipe.waypoints[index + 1];
    const delta = vector(end).sub(vector(start));
    const length = delta.length();
    const direction = length > .001 ? delta.normalize() : new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    const mid: Vec3 = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2];
    return { start, end, mid, length, direction, quaternion };
  }).filter(segment => segment.length > .012), [pipe]);
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  const mid = pipe.waypoints[Math.floor(pipe.waypoints.length / 2)];
  const hasLabel = totalLength > 6.5;
  return <group name={`process-line-${pipe.id}`}>
    {pipe.insulated && segments.map((segment, index) => <mesh key={`${pipe.id}-jacket-${index}`} position={segment.mid} quaternion={segment.quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[pipe.radius * 1.25, pipe.radius * 1.25, segment.length, 16]} />
      <PipeMaterial color={finish.jacket} roughness={.52} />
    </mesh>)}
    {segments.map((segment, index) => <mesh key={`${pipe.id}-segment-${index}`} position={segment.mid} quaternion={segment.quaternion} castShadow receiveShadow>
      <cylinderGeometry args={[pipe.radius, pipe.radius, segment.length, 16]} />
      <PipeMaterial color={finish.paint} />
    </mesh>)}
    {pipe.waypoints.slice(1, -1).map((point, index) => {
      const incoming = segments[index]?.direction || new THREE.Vector3(0, 1, 0);
      const outgoing = segments[index + 1]?.direction || incoming;
      const isCorner = Math.abs(incoming.dot(outgoing)) < .996;
      const direction: Vec3 = [incoming.x, incoming.y, incoming.z];
      return <React.Fragment key={`${pipe.id}-joint-${index}`}>
        <WeldBead point={point} radius={pipe.radius} direction={direction} color={finish.paint} />
        {isCorner && <mesh position={vector(point)} castShadow receiveShadow>
          <sphereGeometry args={[pipe.radius * 1.035, 18, 12]} />
          <PipeMaterial color={finish.paint} />
        </mesh>}
      </React.Fragment>;
    })}
    {pipe.jointType === 'flanged' ? <>
      <FlangedJoint point={pipe.waypoints[0]} dn={pipe.dn} direction={[0, 1, 0]} />
      <FlangedJoint point={pipe.waypoints[pipe.waypoints.length - 1]} dn={pipe.dn} direction={[0, 1, 0]} />
    </> : <>
      <WeldBead point={pipe.waypoints[0]} radius={pipe.radius} direction={[0, 1, 0]} color={finish.paint} />
      <WeldBead point={pipe.waypoints[pipe.waypoints.length - 1]} radius={pipe.radius} direction={[0, 1, 0]} color={finish.paint} />
    </>}
    {hasLabel && <Html position={[mid[0], mid[1] + .38, mid[2]]} center distanceFactor={8} style={{ pointerEvents: 'none' }}>
      <div style={{ color: '#f8fafc', background: 'rgba(7,16,29,.90)', borderTop: `2px solid ${finish.paint}`, border: '1px solid rgba(148,163,184,.46)', padding: '1px 4px', fontSize: 7, fontWeight: 900, letterSpacing: .2, whiteSpace: 'nowrap' }}>{finish.label} · DN{pipe.dn}</div>
    </Html>}
  </group>;
};const SpringIsolator: React.FC<{ position: [number, number, number] }> = ({ position }) => <group position={position}>
  <mesh castShadow><cylinderGeometry args={[.11, .11, .10, 12]} /><meshStandardMaterial color="#1b2733" metalness={.80} roughness={.24} /></mesh>
  {[-.035, 0, .035].map((y, index) => <mesh key={index} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[.074, .014, 8, 16]} /><meshStandardMaterial color="#d4a72c" metalness={.68} roughness={.30} /></mesh>)}
</group>;

const CompressorAssembly: React.FC<{ family: string }> = ({ family }) => {
  const recip = family === 'BIM_COMP_RECIP';
  const body = recip ? '#d5d9dc' : '#aeb7bf';
  const coverXs = recip ? [-.92, -.30, .32] : [-1.05, -.30];
  return <group>
    <mesh position={[0, .12, 0]} castShadow receiveShadow><boxGeometry args={[5.25, .20, 1.95]} /><meshStandardMaterial color="#263746" metalness={.88} roughness={.26} /></mesh>
    {[-2.18, 2.18].flatMap(x => [-.70, .70].map(z => <SpringIsolator key={`${x}-${z}`} position={[x, -.04, z]} />))}
    <mesh position={[-.55, .84, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.70, .70, 2.35, 36]} /><meshStandardMaterial color={body} metalness={.88} roughness={.20} /></mesh>
    {coverXs.map((x, index) => <group key={index} position={[x, .84, .72]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.62, .62, .10, 32]} /><meshStandardMaterial color="#a9b3bb" metalness={.92} roughness={.18} /></mesh>
      {Array.from({ length: 10 }).map((_, bolt) => <mesh key={bolt} position={[Math.cos(bolt * Math.PI * .2) * .50, Math.sin(bolt * Math.PI * .2) * .50, .08]} castShadow><sphereGeometry args={[.032, 8, 8]} /><meshStandardMaterial color="#263746" metalness={.9} roughness={.24} /></mesh>)}
    </group>)}
    <mesh position={[1.55, .84, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.58, .58, 1.58, 32]} /><meshStandardMaterial color="#4a535b" metalness={.84} roughness={.25} /></mesh>
    {Array.from({ length: 12 }).map((_, index) => <mesh key={index} position={[.78 + index * .13, .84, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[.60, .018, 8, 24]} /><meshStandardMaterial color="#293847" metalness={.84} roughness={.23} /></mesh>)}
    <mesh position={[.55, .84, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.22, .22, .34, 18]} /><meshStandardMaterial color="#d4a72c" metalness={.72} roughness={.28} /></mesh>
    <mesh position={[-1.72, 1.40, -.47]} castShadow><cylinderGeometry args={[.32, .32, 1.90, 24]} /><meshStandardMaterial color="#9ba8b1" metalness={.88} roughness={.20} /></mesh>
    <mesh position={[-1.72, 2.32, -.47]} castShadow><sphereGeometry args={[.32, 24, 18]} /><meshStandardMaterial color="#9ba8b1" metalness={.88} roughness={.20} /></mesh>
    <mesh position={[.12, 1.52, .70]} castShadow><boxGeometry args={[.72, .74, .18]} /><meshStandardMaterial color="#3b4650" metalness={.66} roughness={.30} /></mesh>
    <mesh position={[.12, 1.64, .80]}><boxGeometry args={[.40, .30, .012]} /><meshBasicMaterial color="#94d9ff" /></mesh>
    {recip && [-1.0, -.35, .30].map((x, index) => <group key={index} position={[x, 1.42, -.63]}><mesh castShadow><cylinderGeometry args={[.24, .24, .40, 18]} /><meshStandardMaterial color="#c8d0d5" metalness={.84} roughness={.23} /></mesh><mesh position={[0, .25, 0]} castShadow><boxGeometry args={[.47, .11, .34]} /><meshStandardMaterial color="#73808a" metalness={.75} roughness={.28} /></mesh></group>)}
    <mesh position={[-.92, 1.56, .70]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.12, .12, .05, 20]} /><meshStandardMaterial color="#f3f4f6" metalness={.30} roughness={.40} /></mesh>
    <mesh position={[-.88, 1.56, .735]}><boxGeometry args={[.010, .065, .010]} /><meshBasicMaterial color="#be2f2a" /></mesh>
  </group>;
};

const ReceiverAssembly: React.FC<{ refrigerant: string }> = ({ refrigerant }) => <group>
  <mesh position={[0, 1.30, 0]} rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.82, .82, 4.72, 36]} /><meshStandardMaterial color="#c1c9cf" metalness={.91} roughness={.16} /></mesh>
  {[-2.36, 2.36].map((x, index) => <mesh key={index} position={[x, 1.30, 0]} castShadow><sphereGeometry args={[.82, 32, 24]} /><meshStandardMaterial color="#c1c9cf" metalness={.91} roughness={.16} /></mesh>)}
  {[-1.55, -.45, .65, 1.70].map((x, index) => <mesh key={index} position={[x, 1.30, 0]} rotation={[0, Math.PI / 2, 0]} castShadow><torusGeometry args={[.826, .018, 8, 32]} /><meshStandardMaterial color="#84919b" metalness={.88} roughness={.23} /></mesh>)}
  {[-1.18, 1.18].map((x, index) => <group key={index} position={[x, .38, 0]}><mesh castShadow><boxGeometry args={[.34, .72, 1.35]} /><meshStandardMaterial color="#344556" metalness={.86} roughness={.26} /></mesh><mesh position={[0, -.39, 0]} castShadow><boxGeometry args={[.82, .12, 1.70]} /><meshStandardMaterial color="#22313f" metalness={.84} roughness={.26} /></mesh></group>)}
  <mesh position={[0, 2.12, 0]} castShadow><cylinderGeometry args={[.14, .14, .52, 18]} /><meshStandardMaterial color="#aab4bc" metalness={.88} roughness={.20} /></mesh>
  <mesh position={[.28, 2.08, .58]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.11, .11, .05, 20]} /><meshStandardMaterial color="#f3f4f6" metalness={.30} roughness={.40} /></mesh>
  <mesh position={[.28, 2.08, .62]}><boxGeometry args={[.012, .06, .012]} /><meshBasicMaterial color="#be2f2a" /></mesh>
  <Html position={[0, 1.30, .85]} center distanceFactor={8} style={{ pointerEvents: 'none' }}><div style={{ color: '#f8fafc', background: 'rgba(7,16,29,.82)', border: '1px solid rgba(148,163,184,.46)', padding: '1px 3px', fontSize: 7, fontWeight: 900, whiteSpace: 'pre-line', textAlign: 'center' }}>{`${refrigerant || 'REFRIGERANT'}\nHP RECEIVER`}</div></Html>
</group>;

const RoofCondenserAssembly: React.FC = () => <group>
  <mesh position={[0, -.25, 0]} castShadow receiveShadow><boxGeometry args={[4.75, .20, 3.70]} /><meshStandardMaterial color="#394b5c" metalness={.74} roughness={.32} /></mesh>
  {[-1.58, 1.58].flatMap(x => [-1.15, 1.15].map(z => <mesh key={`${x}-${z}`} position={[x, -.62, z]} castShadow><boxGeometry args={[.18, .80, .18]} /><meshStandardMaterial color="#4c6071" metalness={.84} roughness={.26} /></mesh>))}
  <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[3.60, 3.0, 2.30]} /><meshStandardMaterial color="#d7dde0" metalness={.58} roughness={.34} /></mesh>
  {[-1.08, 0, 1.08].map((x, index) => <group key={index} position={[x, 3.08, 0]}><mesh castShadow><cylinderGeometry args={[.48, .48, .14, 28]} /><meshStandardMaterial color="#202b36" metalness={.78} roughness={.24} /></mesh><mesh position={[0, .10, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[.58, .025, 10, 32]} /><meshStandardMaterial color="#8fa0ad" metalness={.86} roughness={.21} /></mesh></group>)}
  {[-1.05, -.52, 0, .52, 1.05].map((x, index) => <mesh key={index} position={[x, 1.48, 1.19]} rotation={[0, 0, .12]} castShadow><boxGeometry args={[.18, 1.62, .06]} /><meshStandardMaterial color="#8394a1" metalness={.72} roughness={.28} /></mesh>)}
  {[-2.22, 2.22].map((x, index) => <group key={index} position={[x, .22, 0]}><mesh castShadow><boxGeometry args={[.10, .86, 3.25]} /><meshStandardMaterial color="#526575" metalness={.82} roughness={.25} /></mesh></group>)}
  <mesh position={[2.12, .72, -1.48]} castShadow><boxGeometry args={[.10, 1.65, .10]} /><meshStandardMaterial color="#8ea0ae" metalness={.76} roughness={.25} /></mesh>
  {Array.from({ length: 7 }).map((_, index) => <mesh key={index} position={[2.12, .10 + index * .21, -1.48]} castShadow><boxGeometry args={[.45, .028, .06]} /><meshStandardMaterial color="#8ea0ae" metalness={.76} roughness={.25} /></mesh>)}
</group>;

const EquipmentDetail: React.FC<{ item: SceneEquipment; refrigerant: string }> = ({ item, refrigerant }) => {
  const family = item.params.proId;
  if (/BIM_COMP/.test(family)) return <CompressorAssembly family={family} />;
  if (family === 'BIM_VESSEL_HORIZ') return <ReceiverAssembly refrigerant={refrigerant} />;
  if (family === 'BIM_CONDENSER_EVAP') return <RoofCondenserAssembly />;
  return null;
};

const EquipmentInstance: React.FC<{ item: SceneEquipment; factory: ThreeDModelFactory; refrigerant: string }> = ({ item, factory, refrigerant }) => {
  const placed = useMemo(() => {
    const position = vector(item.position);
    const rotation = new THREE.Euler(0, item.rotation || 0, 0);
    if (item.params.catalogueModelId) {
      try {
        return factory.createCatalogueEquipment(item.params.catalogueModelId, item.params.tag, position, rotation);
      } catch (error) {
        // Keep the semantic P&ID/BIM graph visible if a catalogue asset is unavailable;
        // the deterministic family retains the same declared port contract.
        console.warn(`[TopologyIndustrialCanvas] Catalogue asset unavailable for ${item.params.tag}`, error);
      }
    }
    return factory.createEquipment(
      item.params.proId,
      item.params.tag,
      position,
      rotation,
      { connectionStyle: item.params.connectionType },
    );
  }, [factory, item]);
  if (!placed) return null;
  const elevation = /BIM_COMP/.test(item.params.proId) ? 2.45 : item.params.proId === 'BIM_VESSEL_HORIZ' ? 2.80 : item.params.proId === 'BIM_CONDENSER_EVAP' ? 3.85 : 1.65;
  return <group>
    <primitive object={placed.group} />
    <group position={vector(item.position)} rotation={[0, item.rotation || 0, 0]}><EquipmentDetail item={item} refrigerant={refrigerant} /></group>
    {item.params.connectionType === 'flanged' && item.ports.map((port: ScenePort) => <FlangedJoint key={`${item.id}-${port.id}`} point={port.position} dn={port.dn} direction={port.direction} />)}
    <Html position={[item.position[0], item.position[1] + elevation, item.position[2]]} center distanceFactor={8} style={{ pointerEvents: 'none' }}><div style={{ color: '#f8fafc', background: 'rgba(7,16,29,.92)', border: '1px solid rgba(148,163,184,.72)', padding: '2px 4px', fontSize: 8, fontWeight: 900, letterSpacing: .3, whiteSpace: 'nowrap' }}>{item.params.tag}{item.params.catalogueModelId ? ' · Danfoss ICF' : ''}</div></Html>
  </group>;
};

const RackSupport: React.FC<{ support: SceneSupport }> = ({ support }) => {
  const steel = <meshStandardMaterial color="#344556" metalness={.86} roughness={.26} />;
  if (support.kind === 'riser-clamp') return <group position={vector(support.position)}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><torusGeometry args={[.22, .025, 8, 20]} />{steel}</mesh>
    <mesh position={[.33, 0, 0]} castShadow><boxGeometry args={[.46, .07, .07]} />{steel}</mesh>
  </group>;
  const width = support.width || 1.60;
  if (support.kind === 'trapeze' || (support.kind === 'hanger' && support.height >= 3.5)) return <group position={[support.position[0], 0, support.position[2]]}>
    {[-width / 2, width / 2].map((x, index) => <group key={index} position={[x, support.height / 2, 0]}><mesh castShadow><boxGeometry args={[.16, support.height, .16]} />{steel}</mesh><mesh position={[0, .09, 0]} castShadow><boxGeometry args={[.48, .12, .42]} /><meshStandardMaterial color="#1f2937" metalness={.84} roughness={.24} /></mesh><mesh position={[0, support.height / 2 - .18, 0]} castShadow><boxGeometry args={[.28, .18, .28]} /><meshStandardMaterial color="#1f2937" metalness={.84} roughness={.24} /></mesh></group>)}
    <mesh position={[0, support.height, 0]} castShadow><boxGeometry args={[width + .22, .16, .20]} />{steel}</mesh>
  </group>;
  return <group position={[support.position[0], 0, support.position[2]]}><mesh position={[0, support.height / 2, 0]} castShadow><cylinderGeometry args={[.035, .035, support.height, 10]} />{steel}</mesh><mesh position={[0, support.height, 0]} castShadow><boxGeometry args={[width, .10, .12]} />{steel}</mesh></group>;
};

const RoomShell: React.FC<{ room: SceneGraph['rooms'][number] }> = ({ room }) => {
  const roof = room.type === 'roof-plant';
  const floor = roof ? '#26394b' : room.type === 'cold-room' ? '#14263a' : '#0f1d2e';
  return <group position={[room.center[0], room.center[1] || 0, room.center[2]]}>
    <mesh receiveShadow position={[0, -.05, 0]}><boxGeometry args={[room.width, .10, room.depth]} /><meshStandardMaterial color={floor} metalness={.22} roughness={.68} transparent opacity={roof ? .80 : .48} /></mesh>
    {!roof && [-1, 1].map((side, index) => <mesh key={index} position={[side * room.width / 2, room.height / 2, 0]} castShadow><boxGeometry args={[.10, room.height, room.depth]} /><meshStandardMaterial color="#D7E2EB" metalness={.05} roughness={.88} transparent opacity={.18} /></mesh>)}
    <Html position={[0, Math.max(.42, room.height * .52), -room.depth / 2 + .35]} center distanceFactor={12} style={{ pointerEvents: 'none' }}><div style={{ color: '#dce8f3', fontSize: 10, fontWeight: 900, letterSpacing: 1, textShadow: '0 1px 2px #07101d', whiteSpace: 'nowrap' }}>{room.name.toUpperCase()}</div></Html>
  </group>;
};

const CameraTargets: React.FC<{ graph: SceneGraph; mode: ViewMode }> = ({ graph, mode }) => {
  const { camera } = useThree();
  const frame = useMemo(() => {
    // Plant view deliberately frames the generated machine-room assembly, not
    // every long return run that happens to touch it. The lines themselves stay
    // fully rendered and remain port-to-port; only the camera envelope changes.
    const plantCoreItems = graph.equipment.filter((item) =>
      /BIM_COMP|BIM_VESSEL_HORIZ|BIM_OIL_SEPARATOR|BIM_PUMP/.test(item.params.proId),
    );
    const plantItems = plantCoreItems.length
      ? plantCoreItems
      : graph.equipment.filter((item) => item.params.zone !== 'cold-room' && item.params.zone !== 'roof-plant');
    const selectedItems = mode === 'roof'
      ? graph.equipment.filter((item) => item.params.zone === 'roof-plant')
      : mode === 'plant'
        ? plantItems
        : graph.equipment;
    const selectedPipes = mode === 'overview'
      ? graph.pipes
      : graph.pipes.filter((pipe) => selectedItems.some((item) =>
        item.id === pipe.sourceEquipmentId || item.id === pipe.targetEquipmentId,
      ));

    // Long refrigerant mains may lead from the machine room to cold rooms.
    // Including all of their route waypoints causes an unusably distant Plant
    // camera. In Plant mode, derive the framing solely from the physical plant
    // equipment; Overview and Roof views retain complete routing extents.
    const points: Vec3[] = mode === 'plant'
      ? selectedItems.map((item) => item.position)
      : [...selectedItems.map((item) => item.position), ...selectedPipes.flatMap((pipe) => pipe.waypoints)];
    if (!points.length) return { target: new THREE.Vector3(0, 2, 0), span: 18 };

    const xs = points.map((point) => point[0]);
    const ys = points.map((point) => point[1]);
    const zs = points.map((point) => point[2]);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    const minY = Math.min(...ys); const maxY = Math.max(...ys);
    const minZ = Math.min(...zs); const maxZ = Math.max(...zs);
    const plantSpan = Math.max(8.5, maxX - minX, maxZ - minZ, (maxY - minY) * 1.75);

    return {
      target: new THREE.Vector3(
        (minX + maxX) / 2,
        mode === 'plant' ? Math.max(2.15, (minY + maxY) / 2) : Math.max(1.6, (minY + maxY) / 2),
        (minZ + maxZ) / 2,
      ),
      span: mode === 'plant' ? plantSpan : Math.max(12, maxX - minX, maxZ - minZ, (maxY - minY) * 1.75),
    };
  }, [graph, mode]);

  useEffect(() => {
    const horizontal = frame.span * (mode === 'overview' ? .95 : mode === 'plant' ? .72 : .68);
    const vertical = frame.span * (mode === 'overview' ? .70 : mode === 'plant' ? .70 : .42);
    camera.position.set(frame.target.x + horizontal, frame.target.y + vertical, frame.target.z + horizontal);
    camera.lookAt(frame.target);
    camera.updateProjectionMatrix();
  }, [camera, mode, frame]);

  return <OrbitControls makeDefault target={frame.target} enableDamping dampingFactor={.07} screenSpacePanning minDistance={3.5} maxDistance={Math.max(100, frame.span * 5)} />;
};
/**
 * Presentation-only industrial warehouse rig. It adopts the useful visual idea
 * from the reviewed prototype while leaving refrigerant rules, topology,
 * equipment placement and verified port frames untouched.
 */
const IndustrialWarehouseLightRig: React.FC = () => <>
  <ambientLight intensity={.72} />
  <hemisphereLight args={['#d9efff', '#07101d', .72]} />
  <directionalLight position={[24, 31, 18]} intensity={1.46} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-.0002} />
  <directionalLight position={[-20, 15, -16]} intensity={.52} color="#fff1de" />
  <pointLight position={[-7, 7.8, 4]} intensity={8.5} distance={24} decay={2} color="#b9e7ff" />
  <pointLight position={[9, 6.8, -5]} intensity={6.5} distance={22} decay={2} color="#ffe4c0" />
</>;

const ServiceLegend: React.FC = () => <Stack direction="row" spacing={.9} flexWrap="wrap" sx={{ mt: .35, maxWidth: 450 }}>
  {(['suction', 'discharge', 'liquid', 'oil'] as LineService[]).map(service => <Box key={service} sx={{ display: 'flex', alignItems: 'center', gap: .45 }}><Box sx={{ width: 9, height: 9, bgcolor: SERVICE[service].paint, borderRadius: '50%' }} /><Typography variant="caption" sx={{ color: '#dce8f3', fontSize: 9, fontWeight: 800 }}>{SERVICE[service].label}</Typography></Box>)}
</Stack>;

const TopologyIndustrialCanvas: React.FC<any> = ({ data, projectInfo }) => {
  const factory = useMemo(() => new ThreeDModelFactory(), []);
  const graph = useMemo(() => buildSceneGraph(data), [data]);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const isEmpty = graph.equipment.length === 0;
  const visualSupports = useMemo<SceneSupport[]>(() => {
    if (graph.supports.length) return graph.supports;
    return graph.pipes.map(pipe => {
      const spans = pipe.waypoints.slice(0, -1).map((a, index) => ({ a, b: pipe.waypoints[index + 1], length: distance(a, pipe.waypoints[index + 1]) }))
        .filter(span => Math.abs(span.a[1] - span.b[1]) < .06 && span.a[1] >= 3.0)
        .sort((a, b) => b.length - a.length);
      const span = spans[0];
      if (!span) return null;
      return { id: `${pipe.id}-render-rack`, kind: span.a[1] >= 4.1 ? 'trapeze' : 'hanger', position: [(span.a[0] + span.b[0]) / 2, 0, (span.a[2] + span.b[2]) / 2] as Vec3, pipeId: pipe.id, height: span.a[1], width: Math.max(1.50, pipe.radius * 9 + 1.15), span: span.length } as SceneSupport;
    }).filter((support): support is SceneSupport => Boolean(support));
  }, [graph]);
  const gridSize = Math.max(50, graph.room.width + 16, graph.room.depth + 16);
  useEffect(() => () => factory.dispose(), [factory]);

  return <Box sx={{ width: '100%', height: '100%', minHeight: 620, position: 'relative', overflow: 'hidden', bgcolor: '#07101d' }} data-engine="pid-refrigerant-aware-bim">
    <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.24 }}>
      <PerspectiveCamera makeDefault position={[19, 13, 22]} fov={38} />
      <CameraTargets graph={graph} mode={viewMode} />
      <color attach="background" args={['#07101d']} />
      <fog attach="fog" args={['#07101d', 58, 160]} />
      <IndustrialWarehouseLightRig />
      <Suspense fallback={null}><Environment preset="warehouse" /></Suspense>
      <Grid args={[gridSize, gridSize]} sectionSize={5} sectionThickness={.75} sectionColor="#315675" cellColor="#17334d" cellThickness={.32} fadeDistance={110} position={[0, -.07, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.1, 0]} receiveShadow>
        <planeGeometry args={[gridSize * 2, gridSize * 2]} />
        <meshStandardMaterial color="#0b1626" roughness={.82} metalness={.10} />
      </mesh>
      <ContactShadows position={[0, 0, 0]} scale={gridSize} blur={2.6} far={36} opacity={.28} />
      {graph.rooms.map(room => <RoomShell key={room.id} room={room} />)}
      {isEmpty ? <Html center><div style={{ color: '#f8fafc', fontWeight: 800 }}>No generated P&amp;ID topology is available for BIM conversion.</div></Html> : <group>
        {graph.equipment.map(item => <EquipmentInstance key={item.id} item={item} factory={factory} refrigerant={graph.meta.refrigerant} />)}
        {graph.pipes.map(pipe => <RoundedPipe key={pipe.id} pipe={pipe} />)}
      </group>}
      {visualSupports.map(support => <RackSupport key={support.id} support={support} />)}
    </Canvas>
    <Box sx={{ position: 'absolute', top: 14, left: 14, pointerEvents: 'none', bgcolor: 'rgba(7,16,29,.88)', border: '1px solid rgba(100,116,139,.52)', px: 1.0, py: .65, boxShadow: '0 8px 24px rgba(0,0,0,.38)' }}>
      <Typography variant="caption" sx={{ display: 'block', color: '#9fd3ff', fontWeight: 900, letterSpacing: 1.0 }}>{`${graph.meta.refrigerant} P&ID TO BIM ASSEMBLY`}</Typography>
      <Typography variant="body2" noWrap sx={{ color: '#f8fafc', fontWeight: 800, fontSize: 12, maxWidth: 560, overflow: 'hidden', textOverflow: 'ellipsis' }}>{projectInfo?.projectName || data?.project?.name || 'Refrigeration Design'}</Typography>
      <Typography variant="caption" sx={{ color: '#cbd5e1' }}>{graph.meta.refrigerant} · {graph.equipment.length} assets · {graph.pipes.length} process lines · {visualSupports.length} rack/support elements</Typography>
      {graph.meta.cycleTemplate && <Typography variant="caption" sx={{ display: 'block', mt: .22, color: '#8ee7c1', fontWeight: 800, fontSize: 9 }}>{`SEMANTIC PRESET · ${graph.meta.cycleTemplate.id}`}</Typography>}
      <Typography variant="caption" sx={{ display: 'block', mt: .35, color: '#f6c454', fontWeight: 800, fontSize: 9 }}>{graph.meta.jointPolicy}</Typography>
      <ServiceLegend />
    </Box>
    <Stack direction="row" spacing={.6} sx={{ position: 'absolute', right: 12, bottom: 12, bgcolor: 'rgba(8,15,28,.88)', border: '1px solid rgba(136,170,207,.42)', p: .65 }}>
      {([['overview', 'Overview'], ['plant', 'Plant'], ['roof', 'Roof plant']] as [ViewMode, string][]).map(([key, label]) => <Button key={key} size="small" onClick={() => setViewMode(key)} sx={{ minWidth: 0, px: .9, py: .35, textTransform: 'none', color: viewMode === key ? '#06101d' : '#dbeafe', bgcolor: viewMode === key ? '#90d1ff' : 'transparent', fontWeight: 800, fontSize: 11, '&:hover': { bgcolor: viewMode === key ? '#c6edff' : 'rgba(144,209,255,.12)' } }}>{label}</Button>)}
    </Stack>
  </Box>;
};

export default TopologyIndustrialCanvas;
