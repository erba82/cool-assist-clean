/*
 * ElectricalSymbols.tsx
 * Industry standard electrical symbols based on IEC standards
 * Date: 2025-04-27 19:30:00
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Box, Tooltip, Typography } from '@mui/material';

// Node data interface
export interface ElectricalNodeData {
  label: string;
  type: string;
  voltage?: string;
  current?: string;
  description?: string;
}

// Base node component
const BaseNodeStyles = { 
  background: '#ffffff',
  borderRadius: '5px',
  border: '1px solid #ddd',
  padding: '5px',
  width: '120px',
  height: '80px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: 'column' as const,
  position: 'relative' as const
};

// Text label node
const TextLabelNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data }) => {
  return (
    <div style={{ position: 'relative' }}>
      <Typography 
        variant="caption" 
        sx={{ 
          padding: '3px 8px',
          background: 'rgba(255, 255, 255, 0.85)',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontWeight: '500',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
          maxWidth: '150px',
          fontSize: '0.75rem'
        }}
      >
        {data.label}
      </Typography>
    </div>
  );
};

// Contactor Node
const ContactorNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ 
      ...BaseNodeStyles, 
      border: selected ? '2px solid #1976d2' : '1px solid #ddd',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3px'
    }}>
      <Tooltip title={`Contactor - ${data.voltage || "Unknown voltage"}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* SVG Contactor Symbol */}
          <svg width="40" height="40" viewBox="0 0 40 40">
            <rect x="10" y="5" width="20" height="30" fill="none" stroke="black" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="7" fill="none" stroke="black" strokeWidth="1.5" />
            <line x1="20" y1="13" x2="20" y2="27" stroke="black" strokeWidth="1.5" />
          </svg>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
            {data.label}
          </Typography>
          {data.voltage && (
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.5 }}>
              {data.voltage}
            </Typography>
          )}
        </div>
      </Tooltip>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      {/* Additional control connection */}
      <Handle
        type="target"
        position={Position.Top}
        id="control"
        style={{ background: '#3498db', width: '8px', height: '8px' }}
      />
    </div>
  );
};

// Circuit Breaker Node
const CircuitBreakerNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ 
      ...BaseNodeStyles, 
      border: selected ? '2px solid #1976d2' : '1px solid #ddd',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3px'
    }}>
      <Tooltip title={`Circuit Breaker - ${data.current || "Unknown current"}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* SVG Circuit Breaker Symbol */}
          <svg width="40" height="40" viewBox="0 0 40 40">
            <line x1="10" y1="20" x2="15" y2="20" stroke="black" strokeWidth="1.5" />
            <line x1="25" y1="20" x2="30" y2="20" stroke="black" strokeWidth="1.5" />
            <line x1="15" y1="20" x2="25" y2="10" stroke="black" strokeWidth="1.5" />
            <path d="M 17 15 L 21 10" stroke="black" strokeWidth="0.8" fill="none" />
          </svg>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
            {data.label}
          </Typography>
          {data.current && (
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.5 }}>
              {data.current}
            </Typography>
          )}
        </div>
      </Tooltip>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
    </div>
  );
};

// Motor Node
const MotorNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ 
      ...BaseNodeStyles, 
      border: selected ? '2px solid #1976d2' : '1px solid #ddd',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3px',
      width: '100px',
      height: '100px'
    }}>
      <Tooltip title={`Motor - ${data.voltage || "Unknown voltage"}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* SVG Motor Symbol */}
          <svg width="50" height="50" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="20" fill="none" stroke="black" strokeWidth="1.5" />
            <text x="25" y="25" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontFamily="Arial">M</text>
            <line x1="5" y1="25" x2="0" y2="25" stroke="black" strokeWidth="1.5" />
            <line x1="45" y1="25" x2="50" y2="25" stroke="black" strokeWidth="1.5" />
          </svg>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
            {data.label}
          </Typography>
          {data.voltage && (
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.5 }}>
              {data.voltage}
            </Typography>
          )}
        </div>
      </Tooltip>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in-l1"
        style={{ background: '#e74c3c', width: '8px', height: '8px', top: '25%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in-l2"
        style={{ background: '#e74c3c', width: '8px', height: '8px', top: '50%' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in-l3"
        style={{ background: '#e74c3c', width: '8px', height: '8px', top: '75%' }}
      />
    </div>
  );
};

// PLC Node
const PLCNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ 
      ...BaseNodeStyles, 
      border: selected ? '2px solid #1976d2' : '1px solid #ddd',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3px',
      width: '160px',
      height: '120px'
    }}>
      <Tooltip title={`PLC Controller - ${data.description || "Programmable Logic Controller"}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          {/* PLC Symbol */}
          <svg width="80" height="60" viewBox="0 0 80 60">
            <rect x="5" y="5" width="70" height="50" fill="none" stroke="black" strokeWidth="1.5" />
            <text x="40" y="30" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontFamily="Arial">PLC</text>
            
            {/* Input side */}
            <line x1="0" y1="15" x2="5" y2="15" stroke="black" strokeWidth="1.5" />
            <line x1="0" y1="25" x2="5" y2="25" stroke="black" strokeWidth="1.5" />
            <line x1="0" y1="35" x2="5" y2="35" stroke="black" strokeWidth="1.5" />
            <line x1="0" y1="45" x2="5" y2="45" stroke="black" strokeWidth="1.5" />
            
            {/* Output side */}
            <line x1="75" y1="15" x2="80" y2="15" stroke="black" strokeWidth="1.5" />
            <line x1="75" y1="25" x2="80" y2="25" stroke="black" strokeWidth="1.5" />
            <line x1="75" y1="35" x2="80" y2="35" stroke="black" strokeWidth="1.5" />
            <line x1="75" y1="45" x2="80" y2="45" stroke="black" strokeWidth="1.5" />
          </svg>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
            {data.label}
          </Typography>
        </div>
      </Tooltip>
      
      {/* Connection handles - Inputs */}
      <Handle
        type="target"
        position={Position.Left}
        id="in-1"
        style={{ background: '#3498db', width: '6px', height: '6px', top: '15px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in-2"
        style={{ background: '#3498db', width: '6px', height: '6px', top: '25px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in-3"
        style={{ background: '#3498db', width: '6px', height: '6px', top: '35px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="in-4"
        style={{ background: '#3498db', width: '6px', height: '6px', top: '45px' }}
      />
      
      {/* Connection handles - Outputs */}
      <Handle
        type="source"
        position={Position.Right}
        id="out-1"
        style={{ background: '#e74c3c', width: '6px', height: '6px', top: '15px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out-2"
        style={{ background: '#e74c3c', width: '6px', height: '6px', top: '25px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out-3"
        style={{ background: '#e74c3c', width: '6px', height: '6px', top: '35px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out-4"
        style={{ background: '#e74c3c', width: '6px', height: '6px', top: '45px' }}
      />
    </div>
  );
};

// Switch Node
const SwitchNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ 
      ...BaseNodeStyles, 
      border: selected ? '2px solid #1976d2' : '1px solid #ddd',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3px',
      width: '80px',
      height: '60px'
    }}>
      <Tooltip title={`Switch - ${data.description || "Switch"}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Switch Symbol */}
          <svg width="40" height="30" viewBox="0 0 40 30">
            <circle cx="10" cy="20" r="3" fill="black" />
            <circle cx="30" cy="20" r="3" fill="black" />
            <line x1="10" y1="20" x2="28" y2="10" stroke="black" strokeWidth="1.5" />
          </svg>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
            {data.label}
          </Typography>
        </div>
      </Tooltip>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
    </div>
  );
};

// Transformer Node
const TransformerNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ 
      ...BaseNodeStyles, 
      border: selected ? '2px solid #1976d2' : '1px solid #ddd',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3px',
      width: '100px',
      height: '80px'
    }}>
      <Tooltip title={`Transformer - ${data.voltage || "Unknown voltage"}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Transformer Symbol */}
          <svg width="60" height="40" viewBox="0 0 60 40">
            <circle cx="15" cy="15" r="10" fill="none" stroke="black" strokeWidth="1.5" />
            <circle cx="45" cy="15" r="10" fill="none" stroke="black" strokeWidth="1.5" />
            <line x1="0" y1="15" x2="5" y2="15" stroke="black" strokeWidth="1.5" />
            <line x1="55" y1="15" x2="60" y2="15" stroke="black" strokeWidth="1.5" />
          </svg>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
            {data.label}
          </Typography>
          {data.voltage && (
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', mt: 0.5 }}>
              {data.voltage}
            </Typography>
          )}
        </div>
      </Tooltip>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
    </div>
  );
};

// Relay Node
const RelayNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ 
      ...BaseNodeStyles, 
      border: selected ? '2px solid #1976d2' : '1px solid #ddd',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3px'
    }}>
      <Tooltip title={`Relay - ${data.description || "Relay"}`}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Relay Symbol */}
          <svg width="50" height="40" viewBox="0 0 50 40">
            <rect x="15" y="5" width="20" height="30" fill="none" stroke="black" strokeWidth="1.5" />
            <line x1="25" y1="5" x2="25" y2="35" stroke="black" strokeWidth="1.5" stroke-dasharray="2,2" />
            <line x1="0" y1="20" x2="15" y2="20" stroke="black" strokeWidth="1.5" />
            <line x1="35" y1="20" x2="50" y2="20" stroke="black" strokeWidth="1.5" />
          </svg>
          <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center', mt: 0.5 }}>
            {data.label}
          </Typography>
        </div>
      </Tooltip>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      {/* Coil connection */}
      <Handle
        type="target"
        position={Position.Top}
        id="coil"
        style={{ background: '#3498db', width: '8px', height: '8px' }}
      />
    </div>
  );
};

// Default Node for any other electrical component
const DefaultNode: React.FC<NodeProps<ElectricalNodeData>> = ({ data, selected }) => {
  return (
    <div style={{ 
      ...BaseNodeStyles, 
      border: selected ? '2px solid #1976d2' : '1px solid #ddd',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3px'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 40 40">
          <rect x="10" y="10" width="20" height="20" fill="none" stroke="black" strokeWidth="1.5" />
        </svg>
        <Typography variant="caption" sx={{ fontSize: '0.75rem', textAlign: 'center', mt: 0.5 }}>
          {data.label}
        </Typography>
      </div>
      
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
    </div>
  );
};

// Define all electrical node types
export const electricalNodeTypes = {
  default: DefaultNode,
  contactor: ContactorNode,
  'circuit-breaker': CircuitBreakerNode,
  motor: MotorNode,
  plc: PLCNode,
  switch: SwitchNode,
  transformer: TransformerNode,
  relay: RelayNode,
  textLabel: TextLabelNode,
};

export default electricalNodeTypes;