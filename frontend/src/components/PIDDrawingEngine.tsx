import React, { useEffect } from 'react';
import ReactFlow, {
    Background, NodeProps, Handle, Position, useNodesState, useEdgesState, MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    ScrewCompressorSymbol,
    ReciprocatingCompressorSymbol,
    HorizontalVesselSymbol,
    VerticalVesselSymbol,
    EvaporatorSymbol,
    EvaporativeCondenserSymbol,
    GlobeValveSymbol,
    CheckValveSymbol,
    SolenoidValveSymbol,
    ReliefValveSymbol,
    PumpSymbol,
    TemperatureIndicatorSymbol,
    PressureIndicatorSymbol,
    LiquidLevelIndicatorSymbol
} from './symbols/PIDSymbols';

// Custom Node Component with ISO Standard Symbols
const IndustrialNode: React.FC<NodeProps> = ({ data }) => {
    const { label, componentType, subType, tag } = data;
    const textStyle = { fontSize: '11px', fontFamily: 'Arial', fontWeight: 'bold', fill: '#000' };

    console.log('🔧 Rendering Industrial Node:', { label, componentType, tag });

    let component = null;
    let w = 80, h = 80;

    switch (componentType) {
        case 'screw_compressor':
            w = 90; h = 90;
            component = (
                <g>
                    <foreignObject x="15" y="0" width="60" height="60">
                        <ScrewCompressorSymbol size={60} />
                    </foreignObject>
                    <text x="45" y="75" textAnchor="middle" {...textStyle}>{tag || label}</text>
                    <text x="45" y="87" textAnchor="middle" style={{ fontSize: '9px', fill: '#666' }}>{label}</text>
                </g>
            );
            break;

        case 'reciprocating_compressor':
            w = 90; h = 90;
            component = (
                <g>
                    <foreignObject x="15" y="0" width="60" height="60">
                        <ReciprocatingCompressorSymbol size={60} />
                    </foreignObject>
                    <text x="45" y="75" textAnchor="middle" {...textStyle}>{tag || label}</text>
                    <text x="45" y="87" textAnchor="middle" style={{ fontSize: '9px', fill: '#666' }}>{label}</text>
                </g>
            );
            break;

        case 'evaporative_condenser':
            w = 100; h = 100;
            component = (
                <g>
                    <foreignObject x="20" y="0" width="60" height="60">
                        <EvaporativeCondenserSymbol width={60} height={60} />
                    </foreignObject>
                    <text x="50" y="75" textAnchor="middle" {...textStyle}>{tag || label}</text>
                    <text x="50" y="87" textAnchor="middle" style={{ fontSize: '9px', fill: '#666' }}>{label}</text>
                </g>
            );
            break;

        case 'evaporator':
            w = 90; h = 80;
            component = (
                <g>
                    <foreignObject x="15" y="0" width="60" height="50">
                        <EvaporatorSymbol width={60} height={50} />
                    </foreignObject>
                    <text x="45" y="65" textAnchor="middle" {...textStyle}>{tag || label}</text>
                    <text x="45" y="77" textAnchor="middle" style={{ fontSize: '9px', fill: '#666' }}>{label}</text>
                </g>
            );
            break;

        // === VALVE SYMBOLS ===
        case 'globe_valve':
        case 'GlobeValve':
        case 'SCV':
            w = 40; h = 50;
            component = (
                <g>
                    <foreignObject x="5" y="5" width="30" height="30">
                        <GlobeValveSymbol size={30} />
                    </foreignObject>
                    <text x="20" y="45" textAnchor="middle" style={{ fontSize: '8px', fill: '#333' }}>{tag || 'SV'}</text>
                </g>
            );
            break;

        case 'check_valve':
        case 'CheckValve':
        case 'CHECK':
            w = 40; h = 50;
            component = (
                <g>
                    <foreignObject x="5" y="5" width="30" height="30">
                        <CheckValveSymbol size={30} />
                    </foreignObject>
                    <text x="20" y="45" textAnchor="middle" style={{ fontSize: '8px', fill: '#333' }}>{tag || 'CV'}</text>
                </g>
            );
            break;

        case 'solenoid_valve':
        case 'SolenoidValve':
        case 'SOLENOID':
        case 'SOV':
            w = 45; h = 55;
            component = (
                <g>
                    <foreignObject x="5" y="5" width="35" height="35">
                        <SolenoidValveSymbol size={35} />
                    </foreignObject>
                    <text x="22" y="50" textAnchor="middle" style={{ fontSize: '8px', fill: '#333' }}>{tag || 'SOV'}</text>
                </g>
            );
            break;

        case 'expansion_valve':
        case 'ExpansionValve':
        case 'EVRA':
        case 'TEV':
            w = 45; h = 55;
            component = (
                <g>
                    <foreignObject x="5" y="5" width="35" height="35">
                        <SolenoidValveSymbol size={35} />
                    </foreignObject>
                    <text x="22" y="50" textAnchor="middle" style={{ fontSize: '8px', fill: '#333' }}>{tag || 'EV'}</text>
                </g>
            );
            break;

        case 'relief_valve':
        case 'SafetyValve':
        case 'SAFETY':
        case 'PSV':
            w = 45; h = 55;
            component = (
                <g>
                    <foreignObject x="5" y="5" width="35" height="35">
                        <ReliefValveSymbol size={35} />
                    </foreignObject>
                    <text x="22" y="50" textAnchor="middle" style={{ fontSize: '8px', fill: '#333' }}>{tag || 'PSV'}</text>
                </g>
            );
            break;

        case 'pump':
        case 'Pump':
            w = 60; h = 70;
            component = (
                <g>
                    <foreignObject x="5" y="5" width="50" height="50">
                        <PumpSymbol size={50} />
                    </foreignObject>
                    <text x="30" y="65" textAnchor="middle" {...textStyle}>{tag || 'P'}</text>
                </g>
            );
            break;

        default:
            // Generic box for undefined types
            w = 80; h = 60;
            component = (
                <g>
                    <rect x="10" y="10" width="60" height="40" fill="#f0f0f0" stroke="#333" strokeWidth="1.5" />
                    <text x="40" y="35" textAnchor="middle" {...textStyle}>{label || componentType}</text>
                </g>
            );
    }

    return (
        <div style={{ width: w, height: h, position: 'relative' }}>
            <Handle type="target" position={Position.Left} style={{ background: '#555', width: 8, height: 8 }} />
            <Handle type="target" position={Position.Top} style={{ background: '#555', width: 8, height: 8 }} />
            <svg width={w} height={h}>
                {component}
            </svg>
            <Handle type="source" position={Position.Right} style={{ background: '#555', width: 8, height: 8 }} />
            <Handle type="source" position={Position.Bottom} style={{ background: '#555', width: 8, height: 8 }} />
        </div>
    );
};

const nodeTypes = { industrial: IndustrialNode };

const PIDDrawingEngine: React.FC<{ nodes: any[], edges: any[] }> = ({ nodes: initialNodes, edges: initialEdges }) => {
    // 🔍 DEBUG: Log incoming props
    console.log('⚙️ PIDDrawingEngine Received:', {
        initialNodesCount: initialNodes?.length || 0,
        initialEdgesCount: initialEdges?.length || 0,
        firstNode: initialNodes?.[0],
        allNodeTypes: initialNodes?.map(n => n.type).join(', ')
    });

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);

    useEffect(() => {
        console.log('🔄 PIDDrawingEngine Setting Nodes:', {
            count: initialNodes?.length || 0,
            nodeIds: initialNodes?.map(n => n.id).join(', ')
        });

        if (initialNodes && initialNodes.length > 0) {
            setNodes(initialNodes);
        }

        if (initialEdges && initialEdges.length > 0) {
            setEdges(initialEdges);
        }
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    console.log('🎨 ReactFlow Will Render:', {
        nodesInState: nodes.length,
        edgesInState: edges.length,
        nodeTypesAvailable: Object.keys(nodeTypes)
    });

    return (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#fafafa', border: '1px solid #ddd' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
                minZoom={0.3}
                maxZoom={2}
            >
                <Background color="#e0e0e0" gap={20} size={1} />
            </ReactFlow>
            <div style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 12px',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                fontSize: '12px',
                color: '#333',
                zIndex: 10
            }}>
                ✨ GFDDE P&ID ({nodes.length} nodes, {edges.length} edges)
            </div>
        </div>
    );
};

export default PIDDrawingEngine;