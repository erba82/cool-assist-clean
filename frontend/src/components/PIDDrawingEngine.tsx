import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  addEdge, Background, Connection, Controls, Edge, Handle, MarkerType, Node, NodeProps,
  Panel, Position, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  ScrewCompressorSymbol, ReciprocatingCompressorSymbol, HorizontalVesselSymbol,
  VerticalVesselSymbol, EvaporatorSymbol, EvaporativeCondenserSymbol, GlobeValveSymbol,
  CheckValveSymbol, SolenoidValveSymbol, ReliefValveSymbol, PumpSymbol
} from './symbols/PIDSymbols';

export interface PidDraftChange {
  type: 'layout-preview' | 'connection-candidate';
  nodes: Node[];
  edges: Edge[];
  reviewRequired: true;
  issues: string[];
}

interface PIDDrawingEngineProps {
  nodes: Node[];
  edges: Edge[];
  onDraftChange?: (draft: PidDraftChange) => void;
}

const sideToPosition = (side?: string) => {
  if (side === 'top') return Position.Top;
  if (side === 'bottom') return Position.Bottom;
  if (side === 'right') return Position.Right;
  return Position.Left;
};

const defaultPorts = [
  { id: 'inlet', direction: 'in', side: 'left', evidenceStatus: 'review-required' },
  { id: 'outlet', direction: 'out', side: 'right', evidenceStatus: 'review-required' }
];

const IndustrialNode: React.FC<NodeProps> = ({ data, selected }) => {
  const componentType = String(data?.componentType || 'equipment');
  const ports = Array.isArray(data?.details?.connectionPorts) && data.details.connectionPorts.length
    ? data.details.connectionPorts : defaultPorts;
  const tag = data?.tag || data?.label || 'UNSPECIFIED';
  const status = data?.details?.portEvidenceStatus || 'review-required';
  let symbol: React.ReactNode = <rect x="14" y="12" width="72" height="45" fill="#f8fafc" stroke="#334155" strokeWidth="1.5" />;
  let width = 100;
  let height = 90;

  if (/screw/i.test(componentType)) symbol = <foreignObject x="20" y="2" width="60" height="60"><ScrewCompressorSymbol size={60} /></foreignObject>;
  else if (/recip|piston/i.test(componentType)) symbol = <foreignObject x="20" y="2" width="60" height="60"><ReciprocatingCompressorSymbol size={60} /></foreignObject>;
  else if (/condenser|gas_cooler/i.test(componentType)) { width = 110; height = 95; symbol = <foreignObject x="25" y="2" width="60" height="60"><EvaporativeCondenserSymbol width={60} height={60} /></foreignObject>; }
  else if (/evaporator|air_cooler|iqf|tunnel/i.test(componentType)) symbol = <foreignObject x="20" y="4" width="60" height="50"><EvaporatorSymbol width={60} height={50} /></foreignObject>;
  else if (/horizontal|thermosiphon/i.test(componentType)) { width = 120; symbol = <foreignObject x="20" y="7" width="80" height="48"><HorizontalVesselSymbol width={80} height={48} /></foreignObject>; }
  else if (/vessel|receiver|separator|surge|accumulator/i.test(componentType)) symbol = <foreignObject x="30" y="0" width="40" height="60"><VerticalVesselSymbol width={40} height={60} /></foreignObject>;
  else if (/pump|circulator/i.test(componentType)) symbol = <foreignObject x="25" y="4" width="50" height="50"><PumpSymbol size={50} /></foreignObject>;
  else if (/check/i.test(componentType)) symbol = <foreignObject x="32" y="10" width="32" height="32"><CheckValveSymbol size={32} /></foreignObject>;
  else if (/solenoid|tev|evra|expansion/i.test(componentType)) symbol = <foreignObject x="30" y="8" width="36" height="36"><SolenoidValveSymbol size={36} /></foreignObject>;
  else if (/relief|psv|safety/i.test(componentType)) symbol = <foreignObject x="30" y="8" width="36" height="36"><ReliefValveSymbol size={36} /></foreignObject>;
  else if (/valve/i.test(componentType)) symbol = <foreignObject x="32" y="10" width="32" height="32"><GlobeValveSymbol size={32} /></foreignObject>;

  return <div style={{ width, height, position: 'relative', border: selected ? '2px solid #0f6cbd' : '1px solid transparent', borderRadius: 4, background: 'white' }}>
    {ports.map((port: any) => {
      const isInput = port.direction === 'in';
      return <Handle key={`${port.id}-${port.direction}`} id={port.id} type={isInput ? 'target' : 'source'} position={sideToPosition(port.side)}
        title={`${port.id} · ${port.evidenceStatus || status}`} style={{ width: 9, height: 9, background: isInput ? '#0f766e' : '#b91c1c', border: '1px solid white' }} />;
    })}
    <svg width={width} height={height} aria-label={`${tag} ${componentType}`}>{symbol}<text x={width / 2} y={70} textAnchor="middle" fontSize="10" fontFamily="Arial" fontWeight="bold">{tag}</text><text x={width / 2} y={83} textAnchor="middle" fontSize="8" fontFamily="Arial" fill="#475569">{componentType.replace(/_/g, ' ')}</text></svg>
    <span style={{ position: 'absolute', right: 2, top: 2, fontSize: 7, color: status === 'catalogue-or-source-record' ? '#15803d' : '#a16207' }}>{status === 'catalogue-or-source-record' ? 'source' : 'review'}</span>
  </div>;
};

const nodeTypes = { industrial: IndustrialNode };

const normalizeNodes = (nodes: Node[] = []) => nodes.map((node) => ({
  ...node,
  type: 'industrial',
  data: {
    ...node.data,
    details: {
      ...(node.data?.details || {}),
      connectionPorts: node.data?.details?.connectionPorts || defaultPorts,
      portEvidenceStatus: node.data?.details?.portEvidenceStatus || 'review-required'
    }
  }
}));

const normalizeEdges = (edges: Edge[] = []) => edges.map((edge) => ({
  ...edge,
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: edge.style?.stroke || '#475569' },
  data: {
    ...(edge.data || {}),
    sourcePortId: edge.data?.sourcePortId || edge.sourceHandle || 'outlet',
    targetPortId: edge.data?.targetPortId || edge.targetHandle || 'inlet',
    portValidationStatus: edge.data?.portValidationStatus || 'review-required'
  }
}));

const isSafetyOrAuxiliaryNode = (node: Node) => {
  const descriptor = `${node.data?.tag || ''} ${node.data?.componentType || ''} ${node.data?.label || ''}`.toLowerCase();
  return /(^|\s)safe-|gas_detector|ventilation_fan|emergency_shutdown|safety_control|pressure relief|relief_valve/.test(descriptor);
};

/**
 * The complete topology remains available in the Overview preset. For the first
 * viewport we focus on process equipment so tag labels stay readable on a normal
 * screen; isolated safety/control nodes are never removed or hidden from the model.
 */
const PidViewportPresets: React.FC<{ nodes: Node[] }> = ({ nodes }) => {
  const { fitView } = useReactFlow();
  const processNodes = useMemo(() => nodes.filter((node) => !isSafetyOrAuxiliaryNode(node)), [nodes]);
  const topologySignature = useMemo(() => nodes.map((node) => node.id).sort().join('|'), [nodes]);
  const framedTopologySignature = useRef('');

  const frameProcess = useCallback(() => {
    const targetNodes = processNodes.length ? processNodes : nodes;
    fitView({ nodes: targetNodes, padding: 0.18, minZoom: 0.46, maxZoom: 1.3, duration: 180 });
  }, [fitView, nodes, processNodes]);

  const frameOverview = useCallback(() => {
    fitView({ nodes, padding: 0.1, minZoom: 0.3, maxZoom: 1.1, duration: 180 });
  }, [fitView, nodes]);

  useEffect(() => {
    if (!topologySignature || framedTopologySignature.current === topologySignature) return undefined;
    framedTopologySignature.current = topologySignature;
    const frame = window.requestAnimationFrame(frameProcess);
    return () => window.cancelAnimationFrame(frame);
  }, [frameProcess, topologySignature]);

  return <Panel position="top-left">
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: 'rgba(255,255,255,.96)', border: '1px solid #cbd5e1', borderRadius: 4, padding: '6px 8px', fontSize: 11 }}>
      <strong style={{ color: '#0b2942' }}>Viewport</strong>
      <button type="button" onClick={frameProcess} style={{ border: '1px solid #0f6cbd', borderRadius: 3, background: '#eff6ff', color: '#0f4c81', padding: '3px 6px', cursor: 'pointer' }}>Readable cycle</button>
      <button type="button" onClick={frameOverview} style={{ border: '1px solid #64748b', borderRadius: 3, background: '#fff', color: '#334155', padding: '3px 6px', cursor: 'pointer' }}>Full topology</button>
    </div>
  </Panel>;
};

const PIDDrawingEngineInner: React.FC<PIDDrawingEngineProps> = ({ nodes: initialNodes, edges: initialEdges, onDraftChange }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(normalizeNodes(initialNodes));
  const [edges, setEdges, onEdgesChange] = useEdgesState(normalizeEdges(initialEdges));
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => { setNodes(normalizeNodes(initialNodes)); }, [initialNodes, setNodes]);
  useEffect(() => { setEdges(normalizeEdges(initialEdges)); }, [initialEdges, setEdges]);

  const publish = useCallback((type: PidDraftChange['type'], nextNodes: Node[], nextEdges: Edge[], nextIssues: string[]) => {
    onDraftChange?.({ type, nodes: nextNodes, edges: nextEdges, reviewRequired: true, issues: nextIssues });
  }, [onDraftChange]);

  const onNodeDragStop = useCallback((_event: React.MouseEvent, node: Node) => {
    const nextNodes = nodes.map((current) => current.id === node.id ? { ...current, position: node.position, data: { ...current.data, layoutStatus: 'preview-edited' } } : current);
    setNodes(nextNodes);
    const nextIssues = ['Layout change is preview-only. Review equipment clearance, ports and 3D placement before applying to the engineering model.'];
    setIssues(nextIssues);
    publish('layout-preview', nextNodes, edges, nextIssues);
  }, [nodes, edges, publish, setNodes]);

  const onConnect = useCallback((connection: Connection) => {
    const source = nodes.find((node) => node.id === connection.source);
    const target = nodes.find((node) => node.id === connection.target);
    const sourcePort = source?.data?.details?.connectionPorts?.find((port: any) => port.id === connection.sourceHandle);
    const targetPort = target?.data?.details?.connectionPorts?.find((port: any) => port.id === connection.targetHandle);
    const nextIssues: string[] = [];
    if (!source || !target) nextIssues.push('Both endpoints must be declared P&ID equipment.');
    if (!connection.sourceHandle || !connection.targetHandle) nextIssues.push('Select declared source and target ports; equipment-centre connections are not valid.');
    if (sourcePort?.direction && sourcePort.direction !== 'out') nextIssues.push(`Source port ${connection.sourceHandle} is not declared as an outlet.`);
    if (targetPort?.direction && targetPort.direction !== 'in') nextIssues.push(`Target port ${connection.targetHandle} is not declared as an inlet.`);
    const candidate: Edge = {
      id: `draft-${Date.now()}`,
      source: connection.source || '', target: connection.target || '', sourceHandle: connection.sourceHandle, targetHandle: connection.targetHandle,
      type: 'smoothstep', label: 'SERVICE / DN REVIEW', markerEnd: { type: MarkerType.ArrowClosed, color: '#b45309' },
      style: { stroke: '#b45309', strokeWidth: 2 },
      data: { sourcePortId: connection.sourceHandle, targetPortId: connection.targetHandle, service: null, dn: null, jointPolicy: null, portValidationStatus: nextIssues.length ? 'invalid' : 'review-required', sizingStatus: 'review-required' }
    };
    const nextEdges = addEdge(candidate, edges);
    setEdges(nextEdges);
    const resolvedIssues = nextIssues.length ? nextIssues : ['New connection is a review-required candidate. Assign service, DN, joint policy and validate the semantic cycle before applying it.'];
    setIssues(resolvedIssues);
    publish('connection-candidate', nodes, nextEdges, resolvedIssues);
  }, [nodes, edges, publish, setEdges]);

  const summary = useMemo(() => ({ sourcePorts: nodes.reduce((sum, node) => sum + (node.data?.details?.connectionPorts || []).filter((port: any) => port.direction === 'out').length, 0), edges: edges.length }), [nodes, edges]);

  return <div style={{ width: '100%', height: '100%', minHeight: 620, position: 'relative', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeDragStop={onNodeDragStop} fitView fitViewOptions={{ padding: 0.08, minZoom: 0.36, maxZoom: 1.1 }} minZoom={0.25} maxZoom={2} onlyRenderVisibleElements defaultEdgeOptions={{ type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }} attributionPosition="bottom-right">
      <Background color="#cbd5e1" gap={20} size={1} />
      <PidViewportPresets nodes={nodes} />
      <Controls showInteractive={false} />
    </ReactFlow>
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, background: 'rgba(255,255,255,.96)', padding: '8px 10px', borderRadius: 4, fontSize: 12, maxWidth: 330 }}>
      <strong>Editable P&amp;ID preview</strong><br />{nodes.length} equipment · {summary.sourcePorts} declared drawing outlets · {summary.edges} lines<br /><span style={{ color: '#0f4c81' }}>Readable cycle focuses process equipment; Full topology restores safeguards and auxiliaries.</span><br /><span style={{ color: '#a16207' }}>Drag = layout preview; connect handles = review-required candidate.</span>
    </div>
    {issues.length > 0 && <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10, background: '#fffbeb', border: '1px solid #f59e0b', color: '#78350f', padding: '8px 10px', borderRadius: 4, fontSize: 12, maxWidth: 500 }}>{issues[0]}</div>}
  </div>;
};

const PIDDrawingEngine: React.FC<PIDDrawingEngineProps> = (props) => <ReactFlowProvider><PIDDrawingEngineInner {...props} /></ReactFlowProvider>;

export default PIDDrawingEngine;
