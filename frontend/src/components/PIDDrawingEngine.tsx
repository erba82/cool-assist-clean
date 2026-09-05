import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, { addEdge, Background, Connection, Controls, Edge, Handle, MarkerType, Node, NodeProps, Panel, Position, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';
import { ScrewCompressorSymbol, ReciprocatingCompressorSymbol, HorizontalVesselSymbol, VerticalVesselSymbol, EvaporatorSymbol, EvaporativeCondenserSymbol, GlobeValveSymbol, CheckValveSymbol, SolenoidValveSymbol, ReliefValveSymbol, PumpSymbol } from './symbols/PIDSymbols';

export interface PidDraftChange { type: 'layout-preview' | 'connection-candidate'; nodes: Node[]; edges: Edge[]; reviewRequired: true; issues: string[]; }
interface PIDDrawingEngineProps { nodes: Node[]; edges: Edge[]; onDraftChange?: (draft: PidDraftChange) => void; }
// Missing port declarations must not silently become invented inlet/outlet ports.
export const declaredPorts = (node: any): any[] => Array.isArray(node?.data?.details?.connectionPorts) ? node.data.details.connectionPorts : [];
export const resolveEndpoint = (edge: any, side: 'source' | 'target'): string | undefined => {
  const values = side === 'source' ? [edge.sourceHandle, edge.sourcePort, edge.data?.sourcePortId, edge.data?.sourcePort, edge.data?.fromPort] : [edge.targetHandle, edge.targetPort, edge.data?.targetPortId, edge.data?.targetPort, edge.data?.toPort];
  return values.find(value => typeof value === 'string' && value.trim().length > 0);
};
export const connectionIssues = (connection: any, nodes: Node[]): string[] => {
  const issues: string[] = [];
  for (const side of ['source', 'target'] as const) {
    const node = nodes.find(item => item.id === connection[side]);
    const handle = resolveEndpoint(connection, side);
    if (!node) { issues.push(`${side}: equipment is missing.`); continue; }
    const ports = declaredPorts(node).filter(port => port.id === handle);
    if (!handle || ports.length !== 1) { issues.push(`${side}: select one uniquely declared port.`); continue; }
    if (ports[0].direction !== (side === 'source' ? 'out' : 'in') && ports[0].direction !== 'bidirectional') issues.push(`${side}: incompatible or undeclared port direction.`);
  }
  return issues;
};
export const pipeLabel = (edge: any): string => {
  const raw = edge.data?.dn ?? edge.data?.nominalDiameter ?? edge.dn;
  const value = String(raw ?? '').trim();
  const diameter = /^(?:DN\s*)?\d+(?:\.\d+)?$/i.test(value) ? Number(value.replace(/^DN\s*/i, '')) : NaN;
  const dn = Number.isFinite(diameter) && diameter > 0 ? `DN${diameter}` : 'DN REVIEW';
  const label = typeof edge.label === 'string' ? edge.label.trim() : '';
  const service = String(edge.data?.service || edge.service || edge.data?.lineService || '');
  return [label, service && !label.toLowerCase().includes(service.toLowerCase()) ? service : '', !label.split(/\s|\|/).includes(dn) ? dn : ''].filter(Boolean).join(' | ');
};
export const normalizeNodes = (nodes: Node[] = []) => nodes.map(node => ({ ...node, type: 'industrial', data: { ...node.data, details: { ...(node.data?.details || {}), connectionPorts: declaredPorts(node), portEvidenceStatus: node.data?.details?.portEvidenceStatus || 'review-required' } } }));
export const normalizeEdges = (edges: Edge[] = [], nodes: Node[] = []) => edges.map(edge => {
  const issues = connectionIssues(edge, nodes);
  return { ...edge, sourceHandle: resolveEndpoint(edge, 'source'), targetHandle: resolveEndpoint(edge, 'target'), type: 'smoothstep', label: pipeLabel(edge), markerEnd: { type: MarkerType.ArrowClosed, color: issues.length ? '#b91c1c' : edge.style?.stroke || '#334155' }, style: { ...edge.style, ...(issues.length ? { stroke: '#b91c1c', strokeDasharray: '5 4' } : {}) }, labelStyle: { fontSize: 10, fill: '#172b3a' }, data: { ...(edge.data || {}), sourcePortId: resolveEndpoint(edge, 'source'), targetPortId: resolveEndpoint(edge, 'target'), validationIssues: issues, portValidationStatus: issues.length ? 'invalid' : edge.data?.portValidationStatus || 'review-required' } };
});
const positionFor = (side: string) => side === 'top' ? Position.Top : side === 'bottom' ? Position.Bottom : side === 'right' ? Position.Right : Position.Left;
const IndustrialNode: React.FC<NodeProps> = ({ data, selected }) => {
  const type = String(data?.componentType || 'equipment');
  const ports = declaredPorts({ data });
  const tag = data?.tag || data?.label || 'UNSPECIFIED';
  let symbol: React.ReactNode = <rect x="25" y="12" width="70" height="44" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />;
  if (/screw/i.test(type)) symbol = <foreignObject x="30" y="2" width="60" height="60"><ScrewCompressorSymbol size={60} /></foreignObject>;
  else if (/recip|piston/i.test(type)) symbol = <foreignObject x="30" y="2" width="60" height="60"><ReciprocatingCompressorSymbol size={60} /></foreignObject>;
  else if (/evaporative.*condenser/i.test(type)) symbol = <foreignObject x="30" y="2" width="60" height="60"><EvaporativeCondenserSymbol width={60} height={60} /></foreignObject>;
  else if (/evaporator|air_cooler|iqf|tunnel/i.test(type)) symbol = <foreignObject x="30" y="4" width="60" height="50"><EvaporatorSymbol width={60} height={50} /></foreignObject>;
  else if (/horizontal|thermosiphon/i.test(type)) symbol = <foreignObject x="20" y="7" width="80" height="48"><HorizontalVesselSymbol width={80} height={48} /></foreignObject>;
  else if (/vertical/i.test(type)) symbol = <foreignObject x="40" y="0" width="40" height="60"><VerticalVesselSymbol width={40} height={60} /></foreignObject>;
  else if (/pump|circulator/i.test(type)) symbol = <foreignObject x="35" y="4" width="50" height="50"><PumpSymbol size={50} /></foreignObject>;
  else if (/check/i.test(type)) symbol = <foreignObject x="44" y="10" width="32" height="32"><CheckValveSymbol size={32} /></foreignObject>;
  else if (/solenoid|evra/i.test(type)) symbol = <foreignObject x="42" y="8" width="36" height="36"><SolenoidValveSymbol size={36} /></foreignObject>;
  else if (/relief_valve|psv/i.test(type)) symbol = <foreignObject x="42" y="8" width="36" height="36"><ReliefValveSymbol size={36} /></foreignObject>;
  else if (/globe|shut.?off/i.test(type)) symbol = <foreignObject x="44" y="10" width="32" height="32"><GlobeValveSymbol size={32} /></foreignObject>;
  // Unmapped types stay generic, not falsely represented as another device.
  return <div style={{ width: 120, minHeight: 102, position: 'relative', border: selected ? '2px solid #0f6cbd' : '1px solid transparent', background: 'oklch(99% 0.005 210)' }}>
    {ports.map((port: any, index: number) => {
      const side = port.side || 'left';
      const siblings = ports.filter(item => (item.side || 'left') === side);
      const offset = `${100 * (siblings.indexOf(port) + 1) / (siblings.length + 1)}%`;
      const style = { width: 7, height: 7, background: '#526b78', ...(side === 'top' || side === 'bottom' ? { left: offset } : { top: offset }) };
      const types: ('source' | 'target')[] = port.direction === 'bidirectional' ? ['source', 'target'] : port.direction === 'out' ? ['source'] : port.direction === 'in' ? ['target'] : [];
      return types.map(kind => <Handle key={`${index}-${kind}`} id={port.id} type={kind} position={positionFor(side)} title={`${port.id} | ${port.evidenceStatus || 'review-required'}`} style={style} />);
    })}
    <svg width="120" height="67" aria-label={`${tag} ${type}`}>{symbol}</svg>
    <div style={{ font: 'bold 10px Arial', textAlign: 'center', overflowWrap: 'anywhere', padding: '0 5px' }}>{tag}</div>
    <div style={{ font: '9px Arial', textAlign: 'center', color: '#475569', overflowWrap: 'anywhere', padding: '3px 5px' }}>{type.replace(/_/g, ' ')}</div>
    {!ports.length && <div style={{ fontSize: 8, textAlign: 'center', color: '#b91c1c' }}>PORT INPUT REQUIRED</div>}
  </div>;
};
const nodeTypes = { industrial: IndustrialNode };
// Safety/control nodes are never removed or hidden from the model.
const PidViewportPresets: React.FC<{ nodes: Node[] }> = ({ nodes }) => {
  const { fitView } = useReactFlow();
  return <Panel position="top-left"><div style={{ display: 'flex', gap: 6, background: 'oklch(99% 0.005 210)', padding: 6 }}>
    <button type="button" onClick={() => fitView({ nodes: nodes.filter(node => !/gas_detector|ventilation_fan|emergency_shutdown|safety_control|relief_valve/i.test(String(node.data?.componentType || ''))), padding: .18, minZoom: .02, maxZoom: 1.3 })}>Readable cycle</button>
    <button type="button" onClick={() => fitView({ nodes, padding: .12, minZoom: .02, maxZoom: 1 })}>Full topology</button>
  </div></Panel>;
};
const PIDDrawingEngineInner: React.FC<PIDDrawingEngineProps> = ({ nodes: initialNodes, edges: initialEdges, onDraftChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(normalizeNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(normalizeEdges(initialEdges, initialNodes));
  const [issues, setIssues] = useState<string[]>([]);
  useEffect(() => { setNodes(normalizeNodes(initialNodes)); setEdges(normalizeEdges(initialEdges, initialNodes)); setIssues([]); }, [initialNodes, initialEdges, setNodes, setEdges]);
  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    const nextNodes = nodes.map(current => current.id === node.id ? { ...current, position: node.position } : current);
    const nextIssues = ['Layout preview only: review clearance and 3D placement before applying.'];
    setNodes(nextNodes); setIssues(nextIssues);
    onDraftChange?.({ type: 'layout-preview', nodes: nextNodes, edges, reviewRequired: true, issues: nextIssues });
  }, [nodes, edges, onDraftChange, setNodes]);
  const onConnect = useCallback((connection: Connection) => {
    const invalid = connectionIssues(connection, nodes);
    if (invalid.length) { setIssues(invalid); return; }
    const candidate: Edge = { id: `draft-${Date.now()}`, source: connection.source!, target: connection.target!, sourceHandle: connection.sourceHandle, targetHandle: connection.targetHandle, data: { service: null, dn: null, portValidationStatus: 'review-required' } };
    const nextEdges = addEdge(normalizeEdges([candidate], nodes)[0], edges);
    const nextIssues = ['Connection candidate only: service, DN, safety and semantic-cycle review required.'];
    setEdges(nextEdges); setIssues(nextIssues);
    onDraftChange?.({ type: 'connection-candidate', nodes, edges: nextEdges, reviewRequired: true, issues: nextIssues });
  }, [nodes, edges, onDraftChange, setEdges]);
  const invalid = useMemo(() => edges.filter(edge => edge.data?.portValidationStatus === 'invalid'), [edges]);
  return <div data-engine="pid-port-aware-2d" data-equipment-count={nodes.length} data-line-count={edges.length} data-invalid-lines={invalid.length} style={{ width: '100%', height: '100%', minHeight: 620, position: 'relative', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDragStop={onNodeDragStop} fitView fitViewOptions={{ padding: .12, minZoom: .02, maxZoom: 1.1 }} minZoom={.02} maxZoom={4} onlyRenderVisibleElements={false} attributionPosition="bottom-right">
      <Background color="#d8e0e5" gap={20} size={1} /><PidViewportPresets nodes={nodes} /><Controls showInteractive={false} />
    </ReactFlow>
    <div style={{ position: 'absolute', top: 48, right: 10, background: 'oklch(99% 0.005 210)', padding: 8, fontSize: 11, maxWidth: 300 }}><strong>Editable P&amp;ID preview</strong><br />{nodes.length} equipment | {edges.length} lines<br />Engineering review required. No automatic standards certification.
      {invalid.length > 0 && <div role="alert" style={{ color: '#b91c1c' }}>{invalid.length} invalid connections retained in the register. Resolve missing ports; do not guess.</div>}
    </div>
    {issues.length > 0 && <div role="alert" style={{ position: 'absolute', bottom: 10, left: 10, background: '#fff7ed', padding: 10, fontSize: 12, maxWidth: 480 }}>{issues.join(' ')}</div>}
  </div>;
};
const PIDDrawingEngine: React.FC<PIDDrawingEngineProps> = props => <ReactFlowProvider><PIDDrawingEngineInner {...props} /></ReactFlowProvider>;
export default PIDDrawingEngine;
