/**
 * Professional Industrial Refrigeration 3D Visualization
 * 
 * SUPPORTED REFRIGERANTS:
 * - R717 (Ammonia) - IIAR Standards
 * - R744 (CO2) - Transcritical/Subcritical
 * - R134a, R404A, R507 (HFC) - ASHRAE Standards
 * - R290, R600a (Hydrocarbons) - EN 378
 * 
 * Standards Compliance:
 * - ASHRAE 15 (Safety Code for Mechanical Refrigeration)
 * - IIAR Bulletin 114 (Piping Identification - Ammonia)
 * - ASME B31.5 (Refrigeration Piping)
 * - ISO 14617 (Graphical Symbols)
 * - EN 378 (Refrigeration Safety)
 * 
 * @version 4.0.0 - Multi-Refrigerant Professional Grade
 */

import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Html, ContactShadows, Environment, useTexture } from '@react-three/drei';
import { Box, Typography, Paper, Chip } from '@mui/material';
import * as THREE from 'three';
import {
    getCycleConfiguration,
    getEquipmentRequirements,
    getPipingRequirements,
    needsSeparator,
    usesGasCooler,
    needsRefrigerantPumps,
    type RefrigerationCycleConfig
} from './RefrigerationCycleTypes';

// ============================================================
// REFRIGERANT-SPECIFIC CONFIGURATIONS
// ============================================================

interface RefrigerantConfig {
    name: string;
    type: 'ammonia' | 'co2' | 'hfc' | 'hc' | 'hfo';
    pipeColors: {
        discharge: string;
        suction: string;
        liquid: string;
        hotGas: string;
    };
    cycleType: 'standard' | 'transcritical' | 'cascade' | 'flooded' | 'dx';
    hasOilSeparator: boolean;
    hasReceiver: boolean;
    hasIntercooler: boolean;  // For CO2 transcritical
    hasGasCooler: boolean;    // For CO2 instead of condenser
}

const REFRIGERANT_CONFIGS: Record<string, RefrigerantConfig> = {
    'R717': {
        name: 'Ammonia',
        type: 'ammonia',
        pipeColors: {
            discharge: '#CC2222',  // Red (IIAR 114)
            suction: '#2255AA',    // Blue
            liquid: '#DDAA22',     // Yellow/Orange
            hotGas: '#CC2222'
        },
        cycleType: 'flooded',
        hasOilSeparator: true,
        hasReceiver: true,
        hasIntercooler: false,
        hasGasCooler: false
    },
    'R744': {
        name: 'CO2',
        type: 'co2',
        pipeColors: {
            discharge: '#8B0000',  // Dark Red (high pressure)
            suction: '#4169E1',    // Royal Blue
            liquid: '#FFD700',     // Gold
            hotGas: '#FF4500'
        },
        cycleType: 'transcritical',
        hasOilSeparator: true,
        hasReceiver: true,
        hasIntercooler: true,
        hasGasCooler: true  // Uses gas cooler instead of condenser
    },
    'R404A': {
        name: 'R404A',
        type: 'hfc',
        pipeColors: {
            discharge: '#DC143C',
            suction: '#1E90FF',
            liquid: '#FFA500',
            hotGas: '#DC143C'
        },
        cycleType: 'dx',
        hasOilSeparator: false,
        hasReceiver: true,
        hasIntercooler: false,
        hasGasCooler: false
    },
    'R134a': {
        name: 'R134a',
        type: 'hfc',
        pipeColors: {
            discharge: '#DC143C',
            suction: '#1E90FF',
            liquid: '#FFA500',
            hotGas: '#DC143C'
        },
        cycleType: 'dx',
        hasOilSeparator: false,
        hasReceiver: true,
        hasIntercooler: false,
        hasGasCooler: false
    },
    'R507': {
        name: 'R507',
        type: 'hfc',
        pipeColors: {
            discharge: '#DC143C',
            suction: '#1E90FF',
            liquid: '#FFA500',
            hotGas: '#DC143C'
        },
        cycleType: 'dx',
        hasOilSeparator: false,
        hasReceiver: true,
        hasIntercooler: false,
        hasGasCooler: false
    },
    'R290': {
        name: 'Propane',
        type: 'hc',
        pipeColors: {
            discharge: '#FF6347',
            suction: '#4682B4',
            liquid: '#DAA520',
            hotGas: '#FF6347'
        },
        cycleType: 'dx',
        hasOilSeparator: false,
        hasReceiver: true,
        hasIntercooler: false,
        hasGasCooler: false
    }
};

// Get config for refrigerant (default to R717 if unknown)
const getRefrigerantConfig = (refrigerant: string): RefrigerantConfig => {
    return REFRIGERANT_CONFIGS[refrigerant] || REFRIGERANT_CONFIGS['R717'];
};

// ============================================================
// PROFESSIONAL INDUSTRIAL MATERIALS - ASHRAE/IIAR Compliant
// Enhanced PBR Materials for Photorealistic Rendering
// ============================================================

// IIAR Bulletin 114 Color Coding for Ammonia Piping
const PIPE_COLORS = {
    discharge: '#CC2222',      // Red - High pressure hot gas
    suction: '#2255AA',        // Blue - Low pressure vapor  
    liquid: '#DDAA22',         // Yellow/Orange - High pressure liquid
    defrostHotGas: '#CC2222',  // Red - Hot gas defrost
    oilDrain: '#8B4513',       // Brown - Oil return
    vent: '#FFFFFF',           // White - Pressure relief vent
    condensateDrain: '#00AA00' // Green - Water/condensate
};

const MATERIALS = {
    // === COMPRESSOR EQUIPMENT (Enhanced PBR) ===
    compressorBody: new THREE.MeshStandardMaterial({
        color: '#E8E8E8',
        roughness: 0.25,
        metalness: 0.6,
        envMapIntensity: 1.5
    }),
    compressorMotor: new THREE.MeshStandardMaterial({
        color: '#1C2833',
        roughness: 0.15,
        metalness: 0.8,
        envMapIntensity: 1.2
    }),
    compressorMotorFins: new THREE.MeshStandardMaterial({
        color: '#2C3E50',
        roughness: 0.35,
        metalness: 0.7,
        envMapIntensity: 1.0
    }),
    oilSeparator: new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 0.2,
        metalness: 0.7,
        envMapIntensity: 1.3
    }),
    controlPanel: new THREE.MeshStandardMaterial({
        color: '#34495E',
        roughness: 0.4,
        metalness: 0.4,
        envMapIntensity: 0.8
    }),
    skidBase: new THREE.MeshStandardMaterial({
        color: '#27AE60',
        roughness: 0.4,
        metalness: 0.5,
        envMapIntensity: 1.0
    }),

    // === PRESSURE VESSELS (ASME Coded - Enhanced) ===
    receiverTan: new THREE.MeshStandardMaterial({
        color: '#D4A574',
        roughness: 0.3,
        metalness: 0.5,
        envMapIntensity: 1.2
    }),
    separatorBlack: new THREE.MeshStandardMaterial({
        color: '#1a1a1a',
        roughness: 0.2,
        metalness: 0.6,
        envMapIntensity: 1.4
    }),
    separatorGray: new THREE.MeshStandardMaterial({
        color: '#555555',
        roughness: 0.35,
        metalness: 0.5,
        envMapIntensity: 1.0
    }),
    thermosiphonGreen: new THREE.MeshStandardMaterial({
        color: '#27AE60',
        roughness: 0.3,
        metalness: 0.5,
        envMapIntensity: 1.2
    }),
    vesselInsulation: new THREE.MeshStandardMaterial({
        color: '#AAAAAA',
        roughness: 0.8,
        metalness: 0.1,
        envMapIntensity: 0.5
    }),

    // === PUMPS (Enhanced) ===
    pumpBody: new THREE.MeshStandardMaterial({
        color: '#2980B9',
        roughness: 0.25,
        metalness: 0.6,
        envMapIntensity: 1.3
    }),
    pumpMotor: new THREE.MeshStandardMaterial({
        color: '#34495E',
        roughness: 0.2,
        metalness: 0.7,
        envMapIntensity: 1.2
    }),
    pumpCoupling: new THREE.MeshStandardMaterial({
        color: '#FF6B00',
        roughness: 0.35,
        metalness: 0.4,
        envMapIntensity: 0.9
    }),

    // === PIPING - IIAR BULLETIN 114 COLORS (Enhanced Metallic) ===
    pipeDischarge: new THREE.MeshStandardMaterial({
        color: PIPE_COLORS.discharge,
        roughness: 0.2,
        metalness: 0.7,
        envMapIntensity: 1.5
    }),
    pipeSuction: new THREE.MeshStandardMaterial({
        color: PIPE_COLORS.suction,
        roughness: 0.2,
        metalness: 0.7,
        envMapIntensity: 1.5
    }),
    pipeLiquid: new THREE.MeshStandardMaterial({
        color: PIPE_COLORS.liquid,
        roughness: 0.2,
        metalness: 0.7,
        envMapIntensity: 1.5
    }),
    pipeOil: new THREE.MeshStandardMaterial({
        color: PIPE_COLORS.oilDrain,
        roughness: 0.3,
        metalness: 0.5,
        envMapIntensity: 1.0
    }),
    pipeVent: new THREE.MeshStandardMaterial({
        color: PIPE_COLORS.vent,
        roughness: 0.25,
        metalness: 0.4,
        envMapIntensity: 1.0
    }),

    // === STRUCTURAL STEEL (Enhanced) ===
    steelFrameBlue: new THREE.MeshStandardMaterial({
        color: '#1A5276',
        roughness: 0.4,
        metalness: 0.6,
        envMapIntensity: 1.0
    }),
    steelFrameGray: new THREE.MeshStandardMaterial({
        color: '#5D6D7E',
        roughness: 0.4,
        metalness: 0.6,
        envMapIntensity: 1.0
    }),
    steelGrating: new THREE.MeshStandardMaterial({
        color: '#7B7D7D',
        roughness: 0.5,
        metalness: 0.5,
        envMapIntensity: 0.8
    }),
    handrail: new THREE.MeshStandardMaterial({
        color: '#F4D03F',
        roughness: 0.3,
        metalness: 0.4,
        envMapIntensity: 1.2
    }),
    ladder: new THREE.MeshStandardMaterial({
        color: '#F4D03F',
        roughness: 0.35,
        metalness: 0.5,
        envMapIntensity: 1.1
    }),

    // === INFRASTRUCTURE (Enhanced) ===
    foundation: new THREE.MeshStandardMaterial({
        color: '#566573',
        roughness: 0.9,
        metalness: 0.05
    }),
    floor: new THREE.MeshStandardMaterial({
        color: '#BDC3C7',
        roughness: 0.8,
        metalness: 0.1
    }),
    floorEpoxy: new THREE.MeshStandardMaterial({
        color: '#85929E',
        roughness: 0.35,
        metalness: 0.15,
        envMapIntensity: 0.8
    }),
    wall: new THREE.MeshStandardMaterial({
        color: '#ECF0F1',
        roughness: 0.75,
        metalness: 0.05
    }),
    wallPanel: new THREE.MeshStandardMaterial({
        color: '#D5D8DC',
        roughness: 0.5,
        metalness: 0.3,
        envMapIntensity: 0.7
    }),
    roofDeck: new THREE.MeshStandardMaterial({
        color: '#7F8C8D',
        roughness: 0.6,
        metalness: 0.4,
        envMapIntensity: 0.8
    }),

    // === VALVES & FITTINGS (Enhanced Metallic) ===
    flange: new THREE.MeshStandardMaterial({
        color: '#95A5A6',
        roughness: 0.15,
        metalness: 0.9,
        envMapIntensity: 1.5
    }),
    valveBody: new THREE.MeshStandardMaterial({
        color: '#AAAAAA',
        roughness: 0.2,
        metalness: 0.7,
        envMapIntensity: 1.3
    }),
    valveHandleRed: new THREE.MeshStandardMaterial({
        color: '#E74C3C',
        roughness: 0.4,
        metalness: 0.3,
        envMapIntensity: 1.0
    }),
    valveHandleBlue: new THREE.MeshStandardMaterial({
        color: '#3498DB',
        roughness: 0.4,
        metalness: 0.3,
        envMapIntensity: 1.0
    }),
    valveHandleYellow: new THREE.MeshStandardMaterial({
        color: '#F1C40F',
        roughness: 0.4,
        metalness: 0.3,
        envMapIntensity: 1.0
    }),

    // === HEAT EXCHANGERS (Enhanced) ===
    coilCopper: new THREE.MeshStandardMaterial({
        color: '#B87333',
        roughness: 0.2,
        metalness: 0.85,
        envMapIntensity: 1.6
    }),
    finAluminum: new THREE.MeshStandardMaterial({
        color: '#C0C0C0',
        roughness: 0.3,
        metalness: 0.7,
        envMapIntensity: 1.3
    }),
    condenserCasing: new THREE.MeshStandardMaterial({
        color: '#DCDCDC',
        roughness: 0.4,
        metalness: 0.4,
        envMapIntensity: 1.0
    }),

    // === COLD ROOM (Enhanced) ===
    panelWhite: new THREE.MeshStandardMaterial({
        color: '#FAFAFA',
        roughness: 0.5,
        metalness: 0.15,
        envMapIntensity: 0.8
    }),
    panelStainless: new THREE.MeshStandardMaterial({
        color: '#C0C0C0',
        roughness: 0.15,
        metalness: 0.9,
        envMapIntensity: 1.5
    }),
    doorSeal: new THREE.MeshStandardMaterial({
        color: '#2C2C2C',
        roughness: 0.75,
        metalness: 0.0
    }),

    // === BACKWARD COMPATIBILITY ALIASES ===
    get steelFrame() { return this.steelFrameGray; },
    get receiverPink() { return this.receiverTan; },
    get valveHandle() { return this.valveHandleRed; },
    get coil() { return this.coilCopper; },
};

// ============================================================
// HELPER COMPONENTS
// ============================================================
const Cyl = ({ args, position = [0, 0, 0], rotation = [0, 0, 0], material }: any) => (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
        <cylinderGeometry args={args} />
        <primitive object={material} attach="material" />
    </mesh>
);

const Bx = ({ args, position = [0, 0, 0], rotation = [0, 0, 0], material }: any) => (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
        <boxGeometry args={args} />
        <primitive object={material} attach="material" />
    </mesh>
);

// Flange component - only for non-ammonia systems
const Flange = ({ radius, position = [0, 0, 0], rotation = [0, 0, 0], isAmmonia = false }: any) => {
    // Ammonia systems use welded connections only - no flanges on valves per IIAR standards
    if (isAmmonia) {
        return (
            <group position={position} rotation={rotation}>
                {/* Welded connection - simple butt weld ring */}
                <mesh>
                    <torusGeometry args={[radius * 1.05, radius * 0.08, 8, 24]} />
                    <meshStandardMaterial color="#666666" roughness={0.4} metalness={0.6} />
                </mesh>
            </group>
        );
    }

    return (
        <group position={position} rotation={rotation}>
            <Cyl args={[radius * 1.5, radius * 1.5, radius * 0.3, 16]} material={MATERIALS.flange} />
            {/* Bolt holes (visual representation) */}
            {[...Array(4)].map((_, i) => (
                <Cyl key={i} args={[radius * 0.1, radius * 0.1, radius * 0.35, 8]}
                    position={[Math.cos(i * Math.PI / 2) * radius * 1.2, 0, Math.sin(i * Math.PI / 2) * radius * 1.2]}
                    material={MATERIALS.steelFrame} />
            ))}
        </group>
    );
};

// Welded Connection for Ammonia Systems (IIAR compliant - no flanges)
const WeldedConnection = ({ radius, position = [0, 0, 0], rotation = [0, 0, 0] }: any) => (
    <group position={position} rotation={rotation}>
        {/* Butt weld - visible weld bead */}
        <mesh>
            <torusGeometry args={[radius * 1.02, radius * 0.06, 8, 24]} />
            <meshStandardMaterial color="#555555" roughness={0.5} metalness={0.5} />
        </mesh>
    </group>
);

// ============================================================
// INFRASTRUCTURE COMPONENTS
// ============================================================

// Concrete Foundation Pad - ASHRAE 15 Compliant
const Foundation = ({ width, depth, height = 0.2, position }: { width: number; depth: number; height?: number; position: [number, number, number] }) => (
    <group position={position}>
        {/* Main concrete pad */}
        <Bx args={[width, height, depth]} position={[0, height / 2, 0]} material={MATERIALS.foundation} />
        {/* Chamfered edges (visual detail) */}
        <Bx args={[width * 0.98, 0.02, depth * 0.98]} position={[0, height + 0.01, 0]} material={MATERIALS.foundation} />
    </group>
);

// Steel I-Beam Structure for elevated vessels
const SteelStructure = ({ width, depth, height, position }: any) => {
    const beamSize = 0.08;
    return (
        <group position={position}>
            {/* Vertical Columns */}
            <Bx args={[beamSize, height, beamSize]} position={[-width / 2, height / 2, -depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, height, beamSize]} position={[width / 2, height / 2, -depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, height, beamSize]} position={[-width / 2, height / 2, depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, height, beamSize]} position={[width / 2, height / 2, depth / 2]} material={MATERIALS.steelFrameBlue} />
            {/* Top Beams */}
            <Bx args={[width, beamSize, beamSize]} position={[0, height, -depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[width, beamSize, beamSize]} position={[0, height, depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, beamSize, depth]} position={[-width / 2, height, 0]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, beamSize, depth]} position={[width / 2, height, 0]} material={MATERIALS.steelFrameBlue} />
            {/* Deck */}
            <Bx args={[width, 0.05, depth]} position={[0, height + 0.025, 0]} material={MATERIALS.steelGrating} />
        </group>
    );
};

// Professional Steel Structure with walkway, ladder, and cross-bracing
const ProfessionalSteelStructure = ({
    width,
    depth,
    height,
    position,
    withWalkway = false,
    withLadder = false
}: any) => {
    const beamSize = 0.1;
    const handrailHeight = 1.0;

    return (
        <group position={position}>
            {/* FOUNDATION PADS for columns */}
            <Foundation width={0.4} depth={0.4} height={0.15} position={[-width / 2, 0, -depth / 2]} />
            <Foundation width={0.4} depth={0.4} height={0.15} position={[width / 2, 0, -depth / 2]} />
            <Foundation width={0.4} depth={0.4} height={0.15} position={[-width / 2, 0, depth / 2]} />
            <Foundation width={0.4} depth={0.4} height={0.15} position={[width / 2, 0, depth / 2]} />

            {/* VERTICAL COLUMNS - H-beam profile */}
            <Bx args={[beamSize, height, beamSize]} position={[-width / 2, height / 2 + 0.15, -depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, height, beamSize]} position={[width / 2, height / 2 + 0.15, -depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, height, beamSize]} position={[-width / 2, height / 2 + 0.15, depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, height, beamSize]} position={[width / 2, height / 2 + 0.15, depth / 2]} material={MATERIALS.steelFrameBlue} />

            {/* HORIZONTAL BEAMS - Top frame */}
            <Bx args={[width + beamSize, beamSize, beamSize]} position={[0, height + 0.15, -depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[width + beamSize, beamSize, beamSize]} position={[0, height + 0.15, depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, beamSize, depth + beamSize]} position={[-width / 2, height + 0.15, 0]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[beamSize, beamSize, depth + beamSize]} position={[width / 2, height + 0.15, 0]} material={MATERIALS.steelFrameBlue} />

            {/* MID-HEIGHT BRACING BEAMS */}
            <Bx args={[width, beamSize * 0.7, beamSize * 0.7]} position={[0, height / 2 + 0.15, -depth / 2]} material={MATERIALS.steelFrameBlue} />
            <Bx args={[width, beamSize * 0.7, beamSize * 0.7]} position={[0, height / 2 + 0.15, depth / 2]} material={MATERIALS.steelFrameBlue} />

            {/* DIAGONAL CROSS-BRACING */}
            {/* Front face X-brace */}
            <Bx args={[0.03, Math.sqrt(width * width + height * height), 0.03]}
                position={[0, height / 2 + 0.15, depth / 2]}
                rotation={[0, 0, Math.atan2(height, width)]}
                material={MATERIALS.steelFrameGray} />
            <Bx args={[0.03, Math.sqrt(width * width + height * height), 0.03]}
                position={[0, height / 2 + 0.15, depth / 2]}
                rotation={[0, 0, -Math.atan2(height, width)]}
                material={MATERIALS.steelFrameGray} />

            {/* GRATING DECK */}
            <Bx args={[width + 0.4, 0.03, depth + 0.4]} position={[0, height + 0.18, 0]} material={MATERIALS.steelGrating} />

            {/* WALKWAY with handrails */}
            {withWalkway && (
                <group position={[0, height + 0.2, 0]}>
                    {/* Handrail posts */}
                    <Cyl args={[0.025, 0.025, handrailHeight, 8]} position={[-width / 2 - 0.15, handrailHeight / 2, -depth / 2 - 0.15]} material={MATERIALS.handrail} />
                    <Cyl args={[0.025, 0.025, handrailHeight, 8]} position={[width / 2 + 0.15, handrailHeight / 2, -depth / 2 - 0.15]} material={MATERIALS.handrail} />
                    <Cyl args={[0.025, 0.025, handrailHeight, 8]} position={[-width / 2 - 0.15, handrailHeight / 2, depth / 2 + 0.15]} material={MATERIALS.handrail} />
                    <Cyl args={[0.025, 0.025, handrailHeight, 8]} position={[width / 2 + 0.15, handrailHeight / 2, depth / 2 + 0.15]} material={MATERIALS.handrail} />

                    {/* Top rail */}
                    <Cyl args={[0.02, 0.02, width + 0.3, 8]} position={[0, handrailHeight, -depth / 2 - 0.15]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.handrail} />
                    <Cyl args={[0.02, 0.02, width + 0.3, 8]} position={[0, handrailHeight, depth / 2 + 0.15]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.handrail} />

                    {/* Mid rail */}
                    <Cyl args={[0.015, 0.015, width + 0.3, 8]} position={[0, handrailHeight / 2, -depth / 2 - 0.15]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.handrail} />
                    <Cyl args={[0.015, 0.015, width + 0.3, 8]} position={[0, handrailHeight / 2, depth / 2 + 0.15]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.handrail} />

                    {/* Toe board */}
                    <Bx args={[width + 0.3, 0.1, 0.02]} position={[0, 0.05, -depth / 2 - 0.2]} material={MATERIALS.handrail} />
                    <Bx args={[width + 0.3, 0.1, 0.02]} position={[0, 0.05, depth / 2 + 0.2]} material={MATERIALS.handrail} />
                </group>
            )}

            {/* LADDER */}
            {withLadder && (
                <group position={[width / 2 + 0.3, 0, 0]}>
                    {/* Side rails */}
                    <Bx args={[0.05, height + 0.5, 0.03]} position={[0, height / 2, -0.15]} material={MATERIALS.ladder} />
                    <Bx args={[0.05, height + 0.5, 0.03]} position={[0, height / 2, 0.15]} material={MATERIALS.ladder} />

                    {/* Rungs */}
                    {[...Array(Math.floor(height / 0.3))].map((_, i) => (
                        <Cyl key={i} args={[0.015, 0.015, 0.28, 8]}
                            position={[0, 0.3 + i * 0.3, 0]}
                            rotation={[Math.PI / 2, 0, 0]}
                            material={MATERIALS.ladder} />
                    ))}

                    {/* Safety cage (if tall enough) */}
                    {height > 2.5 && (
                        <group position={[0.15, height / 2 + 0.5, 0]}>
                            {[...Array(Math.floor(height / 0.6))].map((_, i) => (
                                <mesh key={i} position={[0, -height / 3 + i * 0.6, 0]}>
                                    <torusGeometry args={[0.3, 0.015, 8, 16, Math.PI]} />
                                    <primitive object={MATERIALS.ladder} attach="material" />
                                </mesh>
                            ))}
                        </group>
                    )}
                </group>
            )}
        </group>
    );
};

// Machine Room Enclosure
const MachineRoom = ({ width, depth, height }: { width: number; depth: number; height: number }) => (
    <group>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <primitive object={MATERIALS.floor} attach="material" />
        </mesh>
        {/* Back Wall */}
        <Bx args={[width, height, 0.2]} position={[0, height / 2, -depth / 2]} material={MATERIALS.wall} />
        {/* Side Walls */}
        <Bx args={[0.2, height, depth]} position={[-width / 2, height / 2, 0]} material={MATERIALS.wall} />
        <Bx args={[0.2, height, depth]} position={[width / 2, height / 2, 0]} material={MATERIALS.wall} />
        {/* Front Wall with Door Cutout */}
        <group position={[0, height / 2, depth / 2]}>
            <Bx args={[width / 2 - 1, height, 0.2]} position={[-width / 4 - 0.5, 0, 0]} material={MATERIALS.wall} />
            <Bx args={[width / 2 - 1, height, 0.2]} position={[width / 4 + 0.5, 0, 0]} material={MATERIALS.wall} />
            <Bx args={[2, 1, 0.2]} position={[0, height / 2 - 0.5, 0]} material={MATERIALS.wall} />
            {/* Door */}
            <Bx args={[2, 4, 0.1]} position={[0, -0.5, 0]} material={MATERIALS.steelFrame} />
        </group>
    </group>
);

// ============================================================
// EQUIPMENT COMPONENTS (CAD-Level Detail)
// ============================================================

// Professional Screw Compressor Package - REALISTIC INDUSTRIAL DESIGN
// Based on Mycom/GEA/Bitzer industrial screw compressor packages
const ScrewCompressorPackage = ({ position, tag, rotation = 0, capacity = 200 }: any) => {
    // Scale based on capacity (kW)
    const scale = Math.max(0.8, Math.min(1.5, capacity / 200));

    return (
        <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
            {/* CONCRETE FOUNDATION PAD */}
            <Foundation width={4.0} depth={2.0} height={0.25} position={[0, 0, 0]} />

            {/* GREEN PAINTED STEEL SKID BASE */}
            <group position={[0, 0.35, 0]}>
                {/* Main skid frame - channel steel */}
                <Bx args={[3.6, 0.12, 0.15]} position={[-0.1, 0, -0.7]} material={MATERIALS.skidBase} />
                <Bx args={[3.6, 0.12, 0.15]} position={[-0.1, 0, 0.7]} material={MATERIALS.skidBase} />
                <Bx args={[0.15, 0.12, 1.4]} position={[-1.8, 0, 0]} material={MATERIALS.skidBase} />
                <Bx args={[0.15, 0.12, 1.4]} position={[1.5, 0, 0]} material={MATERIALS.skidBase} />
                {/* Cross members */}
                <Bx args={[0.08, 0.08, 1.4]} position={[-0.5, 0, 0]} material={MATERIALS.skidBase} />
                <Bx args={[0.08, 0.08, 1.4]} position={[0.5, 0, 0]} material={MATERIALS.skidBase} />
            </group>

            {/* ELECTRIC MOTOR - Large TEFC motor with cooling fins */}
            <group position={[-1.3, 0.75, 0]}>
                {/* Motor main body */}
                <Cyl args={[0.32, 0.32, 0.9, 32]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.compressorMotor} />

                {/* Motor cooling fins (cast ribs) */}
                {[...Array(12)].map((_, i) => (
                    <Bx key={i} args={[0.8, 0.025, 0.66]}
                        position={[0, 0, 0]}
                        rotation={[i * Math.PI / 6, 0, 0]}
                        material={MATERIALS.compressorMotorFins} />
                ))}

                {/* Motor end bells */}
                <Cyl args={[0.35, 0.32, 0.08, 32]} position={[-0.48, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.compressorMotor} />
                <Cyl args={[0.35, 0.32, 0.08, 32]} position={[0.48, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.compressorMotor} />

                {/* Fan cover (drive end) */}
                <Cyl args={[0.28, 0.28, 0.12, 24]} position={[0.56, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.steelFrameGray} />

                {/* Terminal box */}
                <Bx args={[0.2, 0.12, 0.15]} position={[0, 0.36, 0]} material={MATERIALS.controlPanel} />

                {/* Motor mounting feet */}
                <Bx args={[0.12, 0.1, 0.4]} position={[-0.3, -0.37, 0]} material={MATERIALS.steelFrameGray} />
                <Bx args={[0.12, 0.1, 0.4]} position={[0.3, -0.37, 0]} material={MATERIALS.steelFrameGray} />
            </group>

            {/* COUPLING GUARD - Safety orange */}
            <group position={[-0.55, 0.75, 0]}>
                <Cyl args={[0.18, 0.18, 0.25, 16]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.pumpCoupling} />
                {/* Guard supports */}
                <Bx args={[0.02, 0.35, 0.02]} position={[0, -0.05, 0.15]} material={MATERIALS.pumpCoupling} />
                <Bx args={[0.02, 0.35, 0.02]} position={[0, -0.05, -0.15]} material={MATERIALS.pumpCoupling} />
            </group>

            {/* SCREW COMPRESSOR BLOCK - Cast iron body */}
            <group position={[0.2, 0.8, 0]}>
                {/* Main compressor housing */}
                <Cyl args={[0.28, 0.28, 0.85, 32]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.compressorBody} />

                {/* Gear housing (larger diameter section) */}
                <Cyl args={[0.35, 0.35, 0.25, 32]} position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.compressorBody} />

                {/* Discharge end housing */}
                <Cyl args={[0.32, 0.28, 0.15, 32]} position={[0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.compressorBody} />

                {/* SUCTION INLET - Side connection (Blue pipe) */}
                <group position={[-0.1, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
                    <Cyl args={[0.1, 0.1, 0.2, 16]} material={MATERIALS.pipeSuction} />
                    <Flange radius={0.1} position={[0, 0.1, 0]} />
                </group>

                {/* DISCHARGE OUTLET - Top connection (Red pipe) */}
                <group position={[0.3, 0.35, 0]}>
                    <Cyl args={[0.08, 0.08, 0.18, 16]} material={MATERIALS.pipeDischarge} />
                    <Flange radius={0.08} position={[0, 0.09, 0]} />
                </group>

                {/* Oil drain connection */}
                <group position={[0, -0.28, 0.15]} rotation={[Math.PI / 4, 0, 0]}>
                    <Cyl args={[0.03, 0.03, 0.1, 8]} material={MATERIALS.pipeOil} />
                </group>

                {/* Compressor mounting feet */}
                <Bx args={[0.15, 0.15, 0.5]} position={[-0.25, -0.35, 0]} material={MATERIALS.steelFrameGray} />
                <Bx args={[0.15, 0.15, 0.5]} position={[0.3, -0.35, 0]} material={MATERIALS.steelFrameGray} />
            </group>

            {/* INTEGRATED OIL SEPARATOR - Vertical cylinder */}
            <group position={[1.1, 0.9, 0]}>
                <Cyl args={[0.2, 0.2, 0.7, 24]} material={MATERIALS.oilSeparator} />

                {/* Dished heads */}
                <mesh position={[0, 0.35, 0]}>
                    <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <primitive object={MATERIALS.oilSeparator} attach="material" />
                </mesh>
                <mesh position={[0, -0.35, 0]} rotation={[Math.PI, 0, 0]}>
                    <sphereGeometry args={[0.2, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <primitive object={MATERIALS.oilSeparator} attach="material" />
                </mesh>

                {/* Sight glass */}
                <Cyl args={[0.03, 0.03, 0.15, 8]} position={[0.21, 0, 0]} rotation={[0, 0, Math.PI / 2]}
                    material={new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.4 })} />

                {/* Support bracket */}
                <Bx args={[0.08, 0.5, 0.08]} position={[0, -0.6, 0]} material={MATERIALS.steelFrameGray} />
            </group>

            {/* OIL COOLER - Shell & tube or plate type */}
            <group position={[1.15, 0.5, 0.45]}>
                <Bx args={[0.3, 0.35, 0.25]} material={MATERIALS.steelFrameGray} />
                {/* Water connections */}
                <Cyl args={[0.025, 0.025, 0.1, 8]} position={[0, 0.1, 0.15]} rotation={[Math.PI / 2, 0, 0]}
                    material={new THREE.MeshStandardMaterial({ color: '#00AA00' })} />
                <Cyl args={[0.025, 0.025, 0.1, 8]} position={[0, -0.1, 0.15]} rotation={[Math.PI / 2, 0, 0]}
                    material={new THREE.MeshStandardMaterial({ color: '#00AA00' })} />
            </group>

            {/* CONTROL PANEL - With digital display */}
            <group position={[1.6, 0.8, -0.5]}>
                <Bx args={[0.1, 0.65, 0.45]} material={MATERIALS.controlPanel} />
                {/* Display window */}
                <Bx args={[0.02, 0.2, 0.25]} position={[0.06, 0.15, 0]}
                    material={new THREE.MeshStandardMaterial({ color: '#111111' })} />

                {/* Status display */}
                <Html position={[0.08, 0.15, 0]} transform scale={0.12} rotation={[0, Math.PI / 2, 0]}>
                    <div style={{
                        background: '#111',
                        color: '#00FF00',
                        padding: '4px 8px',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        border: '1px solid #333',
                        borderRadius: '2px'
                    }}>
                        <div>100%</div>
                        <div style={{ color: '#0f0' }}>●OK</div>
                    </div>
                </Html>

                {/* Indicator lights */}
                <Cyl args={[0.015, 0.015, 0.02, 8]} position={[0.06, -0.1, 0.12]} rotation={[0, 0, Math.PI / 2]}
                    material={new THREE.MeshStandardMaterial({ color: '#00FF00', emissive: '#00FF00', emissiveIntensity: 0.5 })} />
                <Cyl args={[0.015, 0.015, 0.02, 8]} position={[0.06, -0.1, 0.06]} rotation={[0, 0, Math.PI / 2]}
                    material={new THREE.MeshStandardMaterial({ color: '#00FF00', emissive: '#00FF00', emissiveIntensity: 0.5 })} />
                <Cyl args={[0.015, 0.015, 0.02, 8]} position={[0.06, -0.1, 0]} rotation={[0, 0, Math.PI / 2]}
                    material={new THREE.MeshStandardMaterial({ color: '#333333' })} />
            </group>

            {/* VIBRATION ISOLATORS (rubber mounts) */}
            {[[-1.6, 0.3, -0.55], [-1.6, 0.3, 0.55], [1.3, 0.3, -0.55], [1.3, 0.3, 0.55]].map((pos, i) => (
                <group key={i} position={pos as [number, number, number]}>
                    <Cyl args={[0.06, 0.08, 0.08, 12]} material={new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.9 })} />
                </group>
            ))}

            {/* EQUIPMENT TAG LABEL - Smaller, semi-transparent */}
            <Html position={[0, 1.6, 0]} distanceFactor={8}>
                <div style={{
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '2px',
                    fontSize: '9px',
                    fontWeight: '500',
                    opacity: 0.8
                }}>
                    {tag}
                </div>
            </Html>
        </group>
    );
};

// ============================================================
// INDUSTRIAL RECIPROCATING COMPRESSOR - Matching Reference Images
// White/Cream body, V-belt motor, visible V-cylinders
// Based on Mycom/Sabroe/Grasso/Bitzer industrial compressors
// ============================================================
const IndustrialReciprocatingCompressor = ({ position, tag, rotation = 0, cylinders = 6, capacity = 100 }: any) => {
    const scale = Math.max(0.8, Math.min(1.4, capacity / 100));

    // Materials matching reference images
    const whiteBodyMat = new THREE.MeshStandardMaterial({ color: '#F5F5F0', roughness: 0.4, metalness: 0.2 });
    const grayMotorMat = new THREE.MeshStandardMaterial({ color: '#4A4A4A', roughness: 0.3, metalness: 0.5 });
    const blackBaseMat = new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.8 });
    const redPipeMat = new THREE.MeshStandardMaterial({ color: '#CC2222', roughness: 0.3, metalness: 0.5 });
    const bluePipeMat = new THREE.MeshStandardMaterial({ color: '#2255AA', roughness: 0.3, metalness: 0.5 });

    return (
        <group position={position} rotation={[0, rotation, 0]} scale={[scale, scale, scale]}>
            {/* BLACK FOUNDATION PAD (like reference) */}
            <Bx args={[3.8, 0.15, 2.2]} position={[0, 0.075, 0]} material={blackBaseMat} />

            {/* GRAY STEEL BASE FRAME */}
            <group position={[0, 0.25, 0]}>
                <Bx args={[3.5, 0.1, 0.12]} position={[0, 0, -0.9]} material={MATERIALS.steelFrameGray} />
                <Bx args={[3.5, 0.1, 0.12]} position={[0, 0, 0.9]} material={MATERIALS.steelFrameGray} />
                <Bx args={[0.12, 0.1, 1.8]} position={[-1.6, 0, 0]} material={MATERIALS.steelFrameGray} />
                <Bx args={[0.12, 0.1, 1.8]} position={[1.6, 0, 0]} material={MATERIALS.steelFrameGray} />
            </group>

            {/* ELECTRIC MOTOR (Gray, with V-belt pulley) */}
            <group position={[-1.1, 0.7, 0]}>
                {/* Motor body */}
                <Cyl args={[0.3, 0.3, 0.8, 32]} rotation={[0, 0, Math.PI / 2]} material={grayMotorMat} />
                {/* Motor end bells */}
                <Cyl args={[0.32, 0.3, 0.06, 32]} position={[-0.43, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={grayMotorMat} />
                <Cyl args={[0.32, 0.3, 0.06, 32]} position={[0.43, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={grayMotorMat} />
                {/* Cooling fins */}
                {[...Array(8)].map((_, i) => (
                    <Bx key={i} args={[0.7, 0.02, 0.62]} rotation={[i * Math.PI / 4, 0, 0]} material={grayMotorMat} />
                ))}
                {/* Motor feet */}
                <Bx args={[0.08, 0.15, 0.35]} position={[-0.25, -0.37, 0]} material={grayMotorMat} />
                <Bx args={[0.08, 0.15, 0.35]} position={[0.25, -0.37, 0]} material={grayMotorMat} />

                {/* V-BELT PULLEY (Motor side - smaller) */}
                <Cyl args={[0.12, 0.12, 0.08, 24]} position={[0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={blackBaseMat} />
            </group>

            {/* V-BELTS (connecting motor to flywheel) */}
            <group position={[0.15, 0.75, 0]}>
                {[-0.02, 0.02].map((z, i) => (
                    <mesh key={i} position={[0, 0, z]}>
                        <torusGeometry args={[0.55, 0.015, 8, 32]} />
                        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
                    </mesh>
                ))}
            </group>

            {/* COMPRESSOR CRANKCASE (White/Cream - like reference) */}
            <group position={[0.5, 0.65, 0]}>
                {/* Main crankcase block */}
                <Bx args={[0.9, 0.55, 0.65]} material={whiteBodyMat} />

                {/* Crankcase side covers (round) */}
                <Cyl args={[0.25, 0.25, 0.04, 24]} position={[0, 0, 0.35]} rotation={[Math.PI / 2, 0, 0]} material={whiteBodyMat} />
                <Cyl args={[0.25, 0.25, 0.04, 24]} position={[0, 0, -0.35]} rotation={[Math.PI / 2, 0, 0]} material={whiteBodyMat} />

                {/* Oil sump */}
                <Bx args={[0.8, 0.18, 0.6]} position={[0, -0.36, 0]} material={whiteBodyMat} />

                {/* Oil sight glass */}
                <Cyl args={[0.04, 0.04, 0.03, 12]} position={[0.4, -0.3, 0.32]} rotation={[Math.PI / 2, 0, 0]}
                    material={new THREE.MeshStandardMaterial({ color: '#FFFF00', transparent: true, opacity: 0.7 })} />
            </group>

            {/* FLYWHEEL (large, on drive end) */}
            <group position={[-0.05, 0.75, 0]}>
                <Cyl args={[0.4, 0.4, 0.1, 32]} rotation={[0, 0, Math.PI / 2]} material={grayMotorMat} />
                {/* Spokes */}
                {[...Array(6)].map((_, i) => (
                    <Bx key={i} args={[0.06, 0.3, 0.06]} rotation={[0, 0, i * Math.PI / 3]} position={[-0.02, 0, 0]} material={grayMotorMat} />
                ))}
                {/* Hub */}
                <Cyl args={[0.1, 0.1, 0.12, 16]} rotation={[0, 0, Math.PI / 2]} material={blackBaseMat} />
            </group>

            {/* V-CYLINDER HEADS (White, arranged in V-pattern) */}
            {[...Array(cylinders)].map((_, i) => {
                const side = i % 2 === 0 ? 1 : -1;
                const xOffset = 0.25 + Math.floor(i / 2) * 0.22;
                return (
                    <group key={i} position={[0.5 + xOffset, 0.95, side * 0.25]} rotation={[side * 0.4, 0, 0]}>
                        {/* Cylinder barrel */}
                        <Cyl args={[0.08, 0.08, 0.22, 16]} material={whiteBodyMat} />
                        {/* Cylinder head */}
                        <group position={[0, 0.13, 0]}>
                            <Cyl args={[0.1, 0.1, 0.06, 16]} material={whiteBodyMat} />
                            {/* Head bolts */}
                            {[...Array(6)].map((_, b) => (
                                <Cyl key={b} args={[0.012, 0.012, 0.02, 6]}
                                    position={[Math.cos(b * Math.PI / 3) * 0.07, 0.04, Math.sin(b * Math.PI / 3) * 0.07]}
                                    material={blackBaseMat} />
                            ))}
                        </group>
                        {/* Valve cover (top) */}
                        <Cyl args={[0.05, 0.05, 0.03, 12]} position={[0, 0.18, 0]} material={grayMotorMat} />
                    </group>
                );
            })}

            {/* SUCTION HEADER (Blue - top of compressor) */}
            <group position={[0.7, 1.25, 0]}>
                <Cyl args={[0.07, 0.07, 0.8, 16]} rotation={[Math.PI / 2, 0, 0]} material={bluePipeMat} />
                <Flange radius={0.07} position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]} />
                {/* Branch connections to cylinders */}
                {[...Array(Math.floor(cylinders / 2))].map((_, i) => (
                    <Cyl key={i} args={[0.04, 0.04, 0.15, 8]} position={[0.05 + i * 0.22, -0.1, 0]} material={bluePipeMat} />
                ))}
            </group>

            {/* DISCHARGE HEADER (Red - side of compressor) */}
            <group position={[0.9, 1.0, -0.45]}>
                <Cyl args={[0.06, 0.06, 0.6, 16]} rotation={[0, 0, Math.PI / 2]} material={redPipeMat} />
                <Flange radius={0.06} position={[0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
            </group>

            {/* EQUIPMENT TAG - Smaller, semi-transparent */}
            <Html position={[0.3, 1.6, 0]} distanceFactor={8}>
                <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '2px', fontSize: '9px', fontWeight: '500', opacity: 0.8 }}>
                    {tag}
                </div>
            </Html>
        </group>
    );
};

// ============================================================
// ENHANCED VALVE COMPONENTS - Per IIAR Standards
// ============================================================

// Solenoid Valve (for liquid line control)
const SolenoidValve3D = ({ position, size = 0.08, type = 'liquid', rotation = [0, 0, 0] }: any) => {
    const pipeMat = type === 'liquid' ? MATERIALS.pipeLiquid : type === 'suction' ? MATERIALS.pipeSuction : MATERIALS.pipeDischarge;

    return (
        <group position={position} rotation={rotation}>
            {/* Pipe connections */}
            <Cyl args={[size, size, size * 2, 12]} rotation={[Math.PI / 2, 0, 0]} material={pipeMat} />
            <Flange radius={size} position={[0, 0, -size]} rotation={[Math.PI / 2, 0, 0]} />
            <Flange radius={size} position={[0, 0, size]} rotation={[Math.PI / 2, 0, 0]} />

            {/* Valve body */}
            <Bx args={[size * 2, size * 2, size * 1.5]} position={[0, size * 0.5, 0]} material={MATERIALS.valveBody} />

            {/* Solenoid coil */}
            <Cyl args={[size * 0.8, size * 0.8, size * 2.5, 16]} position={[0, size * 2.2, 0]} material={MATERIALS.controlPanel} />

            {/* Electrical conduit */}
            <Cyl args={[size * 0.15, size * 0.15, size * 1.5, 8]} position={[size * 0.5, size * 3, 0]} rotation={[0, 0, Math.PI / 4]} material={MATERIALS.steelFrameGray} />

            {/* Manual override */}
            <Cyl args={[size * 0.2, size * 0.2, size * 0.4, 8]} position={[0, size * 3.6, 0]} material={MATERIALS.valveHandleYellow} />
        </group>
    );
};

// Expansion Valve (Thermostatic - TXV)
const ExpansionValve3D = ({ position, size = 0.06, rotation = [0, 0, 0] }: any) => (
    <group position={position} rotation={rotation}>
        {/* Inlet (liquid) */}
        <Cyl args={[size, size, size * 1.5, 12]} position={[-size, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.pipeLiquid} />
        <Flange radius={size} position={[-size * 1.8, 0, 0]} rotation={[0, 0, Math.PI / 2]} />

        {/* Outlet (vapor) */}
        <Cyl args={[size * 1.2, size * 1.2, size * 1.5, 12]} position={[size * 1.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.pipeSuction} />
        <Flange radius={size * 1.2} position={[size * 2.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />

        {/* Valve body */}
        <Bx args={[size * 2.5, size * 2, size * 1.8]} material={MATERIALS.valveBody} />

        {/* Thermostatic element (power head) */}
        <Cyl args={[size * 0.7, size * 0.7, size * 1.2, 16]} position={[0, size * 1.5, 0]} material={new THREE.MeshStandardMaterial({ color: '#8B4513', metalness: 0.4 })} />

        {/* Capillary tube */}
        <Cyl args={[size * 0.05, size * 0.05, size * 3, 6]} position={[size * 0.8, size * 1.8, 0]} rotation={[0, 0, Math.PI / 3]} material={new THREE.MeshStandardMaterial({ color: '#B87333', metalness: 0.6 })} />

        {/* Sensing bulb */}
        <Cyl args={[size * 0.15, size * 0.15, size * 0.8, 8]} position={[size * 2.5, size * 2.5, 0]} rotation={[0, 0, Math.PI / 2]} material={new THREE.MeshStandardMaterial({ color: '#B87333', metalness: 0.6 })} />

        {/* Superheat adjustment */}
        <Cyl args={[size * 0.25, size * 0.25, size * 0.3, 12]} position={[0, size * 2.3, 0]} material={MATERIALS.valveHandleBlue} />
    </group>
);

// Hand Expansion Valve (Manual regulating valve)
const HandExpansionValve3D = ({ position, size = 0.06, rotation = [0, 0, 0] }: any) => (
    <group position={position} rotation={rotation}>
        {/* Valve body - angle pattern */}
        <Cyl args={[size, size, size * 2, 12]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.pipeLiquid} />
        <Bx args={[size * 1.8, size * 1.5, size * 1.5]} position={[0, size * 0.3, 0]} material={MATERIALS.valveBody} />

        {/* Stem and packing gland */}
        <Cyl args={[size * 0.3, size * 0.3, size * 1.5, 12]} position={[0, size * 1.5, 0]} material={MATERIALS.steelFrameGray} />

        {/* Handwheel */}
        <group position={[0, size * 2.5, 0]}>
            <Cyl args={[size * 1.2, size * 1.2, size * 0.15, 24]} material={MATERIALS.valveHandleBlue} />
            {/* Spokes */}
            {[...Array(4)].map((_, i) => (
                <Bx key={i} args={[size * 2.2, size * 0.1, size * 0.1]} rotation={[0, i * Math.PI / 4, 0]} material={MATERIALS.valveHandleBlue} />
            ))}
        </group>

        {/* Position indicator */}
        <Bx args={[size * 0.3, size * 0.5, size * 0.1]} position={[0, size * 1.2, size * 0.4]} material={new THREE.MeshStandardMaterial({ color: '#FFFFFF' })} />
    </group>
);

// ============================================================
// PIPE SUPPORTS AND HANGERS - ASHRAE/ASME B31.5 Compliant
// ============================================================

// Pipe Support Stand (Floor-mounted)
const PipeStand = ({ position, height = 1.0, pipeRadius = 0.08 }: any) => (
    <group position={position}>
        {/* Base plate */}
        <Bx args={[0.25, 0.02, 0.25]} material={MATERIALS.steelFrameGray} />
        {/* Vertical post */}
        <Bx args={[0.06, height, 0.06]} position={[0, height / 2, 0]} material={MATERIALS.steelFrameGray} />
        {/* U-bolt saddle */}
        <mesh position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[pipeRadius * 1.2, 0.012, 6, 16, Math.PI]} />
            <primitive object={MATERIALS.steelFrameGray} attach="material" />
        </mesh>
        {/* Cross piece */}
        <Bx args={[pipeRadius * 3, 0.03, 0.05]} position={[0, height - 0.02, 0]} material={MATERIALS.steelFrameGray} />
    </group>
);

// Ceiling Hanger with Rod
const PipeCeilingHanger = ({ position, dropLength = 0.5, pipeRadius = 0.08 }: any) => (
    <group position={position}>
        {/* Ceiling attachment plate */}
        <Bx args={[0.1, 0.015, 0.06]} position={[0, dropLength, 0]} material={MATERIALS.steelFrameGray} />
        {/* Threaded rod */}
        <Cyl args={[0.01, 0.01, dropLength, 8]} position={[0, dropLength / 2, 0]} material={MATERIALS.steelFrameGray} />
        {/* Clevis */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[pipeRadius * 1.15, 0.012, 6, 16, Math.PI]} />
            <primitive object={MATERIALS.steelFrameGray} attach="material" />
        </mesh>
        {/* Rubber insulator */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[pipeRadius * 1.05, 0.008, 6, 16, Math.PI]} />
            <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
    </group>
);

// Pipe Roller Support (for thermal expansion)
const PipeRollerSupport = ({ position, height = 0.8, pipeRadius = 0.1 }: any) => (
    <group position={position}>
        {/* Base */}
        <Bx args={[0.3, 0.03, 0.2]} material={MATERIALS.steelFrameGray} />
        {/* Vertical supports */}
        <Bx args={[0.04, height, 0.04]} position={[-0.1, height / 2, 0]} material={MATERIALS.steelFrameGray} />
        <Bx args={[0.04, height, 0.04]} position={[0.1, height / 2, 0]} material={MATERIALS.steelFrameGray} />
        {/* Roller */}
        <Cyl args={[pipeRadius * 0.8, pipeRadius * 0.8, 0.15, 16]} position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]}
            material={new THREE.MeshStandardMaterial({ color: '#444444', metalness: 0.5 })} />
        {/* Roller axle */}
        <Cyl args={[0.015, 0.015, 0.25, 8]} position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.steelFrameGray} />
    </group>
);

// Horizontal Vessel (Receiver/Separator/Thermosyphon) - CAD LEVEL PROFESSIONAL
const HorizontalVessel = ({ position, length = 2.5, diameter = 0.6, type = 'receiver', tag, elevated = false, structureHeight = 1.5 }: any) => {
    const material = type === 'receiver' ? MATERIALS.receiverTan :
        type === 'separator' ? MATERIALS.separatorBlack :
            MATERIALS.thermosiphonGreen;
    const radius = diameter / 2;

    return (
        <group position={position}>
            {/* Steel Structure if elevated */}
            {elevated && <SteelStructure width={length + 0.4} depth={diameter + 0.4} height={structureHeight} position={[0, 0, 0]} />}

            {/* Foundation (only if not elevated) */}
            {!elevated && <Foundation width={length + 0.4} depth={diameter + 0.6} position={[0, 0, 0]} />}

            {/* Vessel Body */}
            <group position={[0, elevated ? structureHeight + radius + 0.15 : radius + 0.35, 0]}>
                <Cyl args={[radius, radius, length, 32]} rotation={[0, 0, Math.PI / 2]} material={material} />

                {/* Hemispherical Ends */}
                <mesh position={[-length / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                    <sphereGeometry args={[radius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <primitive object={material} attach="material" />
                </mesh>
                <mesh position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <sphereGeometry args={[radius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <primitive object={material} attach="material" />
                </mesh>

                {/* REALISTIC U-SHAPED SADDLE SUPPORTS (if not elevated) */}
                {!elevated && (
                    <>
                        {/* Saddle 1 */}
                        <group position={[-length / 3, -radius * 0.7, 0]}>
                            {/* Vertical support */}
                            <Bx args={[0.15, radius * 0.7, 0.15]} position={[-diameter / 2, -radius * 0.35, 0]} material={MATERIALS.steelFrame} />
                            <Bx args={[0.15, radius * 0.7, 0.15]} position={[diameter / 2, -radius * 0.35, 0]} material={MATERIALS.steelFrame} />
                            {/* U-shaped cradle */}
                            <mesh rotation={[0, 0, Math.PI / 2]}>
                                <torusGeometry args={[radius, 0.08, 8, 16, Math.PI]} />
                                <primitive object={MATERIALS.steelFrame} attach="material" />
                            </mesh>
                            {/* Base plate */}
                            <Bx args={[diameter + 0.3, 0.05, 0.3]} position={[0, -radius * 0.7, 0]} material={MATERIALS.steelFrame} />
                        </group>

                        {/* Saddle 2 */}
                        <group position={[length / 3, -radius * 0.7, 0]}>
                            <Bx args={[0.15, radius * 0.7, 0.15]} position={[-diameter / 2, -radius * 0.35, 0]} material={MATERIALS.steelFrame} />
                            <Bx args={[0.15, radius * 0.7, 0.15]} position={[diameter / 2, -radius * 0.35, 0]} material={MATERIALS.steelFrame} />
                            <mesh rotation={[0, 0, Math.PI / 2]}>
                                <torusGeometry args={[radius, 0.08, 8, 16, Math.PI]} />
                                <primitive object={MATERIALS.steelFrame} attach="material" />
                            </mesh>
                            <Bx args={[diameter + 0.3, 0.05, 0.3]} position={[0, -radius * 0.7, 0]} material={MATERIALS.steelFrame} />
                        </group>
                    </>
                )}

                {/* Nozzles with Flanges */}
                <group position={[-length / 4, radius, 0]}>
                    <Cyl args={[0.06, 0.06, 0.12, 16]} material={MATERIALS.pipeSuction} />
                    <Flange radius={0.06} position={[0, 0.06, 0]} />
                </group>
                <group position={[length / 4, -radius, 0]} rotation={[Math.PI, 0, 0]}>
                    <Cyl args={[0.06, 0.06, 0.12, 16]} material={MATERIALS.pipeLiquid} />
                    <Flange radius={0.06} position={[0, 0.06, 0]} />
                </group>

                {/* Sight Glass (Receiver only) */}
                {type === 'receiver' && (
                    <group position={[0, 0, radius + 0.05]}>
                        <Cyl args={[0.03, 0.03, 0.4, 16]} rotation={[Math.PI / 2, 0, 0]} material={new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.3, metalness: 0.1 })} />
                        {/* End flanges */}
                        <Bx args={[0.08, 0.08, 0.02]} position={[0, 0.2, 0]} material={MATERIALS.flange} />
                        <Bx args={[0.08, 0.08, 0.02]} position={[0, -0.2, 0]} material={MATERIALS.flange} />
                    </group>
                )}

                {/* Level Gauge (Separator only) */}
                {type === 'separator' && (
                    <group position={[0, 0, radius + 0.1]}>
                        <Bx args={[0.15, 0.4, 0.06]} material={MATERIALS.controlPanel} />
                        <Html position={[0, 0, 0.05]} transform scale={0.1}>
                            <div style={{ background: '#111', color: '#0ff', padding: '2px', fontSize: '14px', fontFamily: 'monospace', textAlign: 'center' }}>
                                65%
                            </div>
                        </Html>
                    </group>
                )}

                {/* Safety Relief Valve (Top) */}
                <group position={[length / 3, radius + 0.1, 0]}>
                    <Cyl args={[0.04, 0.04, 0.15, 16]} material={MATERIALS.pipeDischarge} />
                    <Cyl args={[0.05, 0.07, 0.12, 16]} position={[0, 0.1, 0]} material={new THREE.MeshStandardMaterial({ color: '#E74C3C', roughness: 0.4 })} />
                    {/* Spring cap */}
                    <Cyl args={[0.035, 0.035, 0.08, 8]} position={[0, 0.2, 0]} material={MATERIALS.steelFrame} />
                </group>

                {/* Drain Valve (Bottom) */}
                <group position={[-length / 3, -radius, 0]} rotation={[Math.PI, 0, 0]}>
                    <Cyl args={[0.03, 0.03, 0.1, 16]} material={MATERIALS.pipeLiquid} />
                    <Valve3D position={[0, 0.1, 0]} type="ball" size={0.05} rotation={[Math.PI, 0, 0]} />
                </group>
            </group>

            {/* Tag - Smaller, semi-transparent */}
            <Html position={[0, elevated ? structureHeight + diameter + 0.8 : diameter + 0.8, 0]} distanceFactor={8}>
                <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '2px', fontSize: '9px', fontWeight: '500', opacity: 0.8 }}>
                    {tag}
                </div>
            </Html>
        </group>
    );
};


// Ammonia Pump - PROFESSIONAL INDUSTRIAL HERMETIC PUMP
const AmmoniaPump = ({ position, tag }: any) => (
    <group position={position}>
        {/* Foundation Pad */}
        <Foundation width={1.2} depth={0.8} position={[0, 0, 0]} />

        {/* Base Plate / Skid */}
        <Bx args={[1.0, 0.08, 0.7]} position={[0, 0.19, 0]} material={MATERIALS.steelFrame} />

        {/* Pump Body (Hermetic Centrifugal) */}
        <group position={[0.15, 0.45, 0]}>
            {/* Volute Casing */}
            <Cyl args={[0.18, 0.18, 0.25, 24]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.pumpBody} />
            {/* Impeller Cover */}
            <Cyl args={[0.2, 0.12, 0.08, 24]} position={[0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.pumpBody} />

            {/* Suction Inlet (Side) */}
            <group position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                <Cyl args={[0.06, 0.06, 0.15, 16]} material={MATERIALS.pipeSuction} />
                <Flange radius={0.06} position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} />
            </group>

            {/* Discharge Outlet (Top) */}
            <group position={[0, 0.2, 0]}>
                <Cyl args={[0.05, 0.05, 0.12, 16]} material={MATERIALS.pipeDischarge} />
                <Flange radius={0.05} position={[0, 0.06, 0]} />
                {/* Check Valve */}
                <group position={[0, 0.15, 0]}>
                    <Cyl args={[0.07, 0.07, 0.1, 16]} material={MATERIALS.flange} />
                    {/* Flow arrow */}
                    <mesh position={[0, 0.06, 0]}>
                        <coneGeometry args={[0.03, 0.06, 8]} />
                        <meshStandardMaterial color="#27AE60" />
                    </mesh>
                </group>
            </group>
        </group>

        {/* Coupling Guard */}
        <Cyl args={[0.1, 0.1, 0.12, 16]} position={[-0.12, 0.45, 0]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.steelFrame} />

        {/* Electric Motor */}
        <group position={[-0.35, 0.45, 0]}>
            {/* Motor Body */}
            <Cyl args={[0.14, 0.14, 0.35, 24]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.pumpMotor} />
            {/* Motor Fins (Cooling) */}
            {[...Array(8)].map((_, i) => (
                <Bx key={i} args={[0.3, 0.015, 0.29]} position={[0, 0, 0]} rotation={[i * Math.PI / 8, 0, 0]} material={MATERIALS.pumpMotor} />
            ))}
            {/* Motor Terminal Box */}
            <Bx args={[0.1, 0.06, 0.08]} position={[0, 0.15, 0]} material={MATERIALS.controlPanel} />
            {/* Motor Feet */}
            <Bx args={[0.08, 0.06, 0.24]} position={[-0.1, -0.17, 0]} material={MATERIALS.steelFrame} />
            <Bx args={[0.08, 0.06, 0.24]} position={[0.1, -0.17, 0]} material={MATERIALS.steelFrame} />
        </group>

        {/* Suction Strainer */}
        <group position={[0.15, 0.45, 0.4]}>
            <Cyl args={[0.05, 0.05, 0.12, 16]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.steelFrame} />
            <Bx args={[0.08, 0.08, 0.08]} position={[0, 0, 0.08]} material={MATERIALS.controlPanel} />
        </group>

        {/* Pressure Gauges */}
        <group position={[0.3, 0.6, 0.1]}>
            <Cyl args={[0.035, 0.035, 0.02, 16]} rotation={[0, Math.PI / 4, 0]} material={new THREE.MeshStandardMaterial({ color: '#FFFFFF', metalness: 0.1 })} />
            <Cyl args={[0.015, 0.015, 0.05, 8]} position={[0, -0.04, 0]} material={MATERIALS.steelFrame} />
        </group>
        <group position={[0.3, 0.6, -0.1]}>
            <Cyl args={[0.035, 0.035, 0.02, 16]} rotation={[0, -Math.PI / 4, 0]} material={new THREE.MeshStandardMaterial({ color: '#FFFFFF', metalness: 0.1 })} />
            <Cyl args={[0.015, 0.015, 0.05, 8]} position={[0, -0.04, 0]} material={MATERIALS.steelFrame} />
        </group>

        {/* Tag Label - Smaller, semi-transparent */}
        <Html position={[0, 0.9, 0]} distanceFactor={8}>
            <div style={{ background: 'rgba(0,0,0,0.5)', color: '#00BCD4', padding: '2px 5px', borderRadius: '2px', fontSize: '8px', fontWeight: '500', whiteSpace: 'nowrap', opacity: 0.8 }}>
                {tag}
            </div>
        </Html>
    </group>
);

// ============================================================
// ANIMATED ROTATING FAN COMPONENT
// ============================================================
const RotatingFan = ({ position, bladeCount = 5, radius = 0.25, speed = 3 }: any) => {
    const fanRef = useRef<THREE.Group>(null!);

    // Animate the fan rotation
    useFrame((state, delta) => {
        if (fanRef.current) {
            fanRef.current.rotation.z += delta * speed;
        }
    });

    const fanHousingMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.3, metalness: 0.6 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: '#DDDDDD', roughness: 0.4, metalness: 0.4 });

    return (
        <group position={position}>
            {/* Fan Housing Ring */}
            <mesh rotation={[0, 0, 0]}>
                <torusGeometry args={[radius + 0.02, 0.015, 12, 32]} />
                <primitive object={fanHousingMat} attach="material" />
            </mesh>

            {/* Motor Hub */}
            <Cyl args={[radius * 0.22, radius * 0.22, 0.06, 16]}
                rotation={[0, 0, 0]}
                material={fanHousingMat} />

            {/* Rotating Fan Blades */}
            <group ref={fanRef}>
                {[...Array(bladeCount)].map((_, i) => (
                    <mesh key={i} rotation={[0, 0, i * (Math.PI * 2 / bladeCount)]}>
                        <boxGeometry args={[radius * 0.25, radius * 0.9, 0.012]} />
                        <primitive object={bladeMat} attach="material" />
                    </mesh>
                ))}
            </group>

            {/* Wire Guard - outer ring */}
            <mesh rotation={[0, 0, 0]}>
                <ringGeometry args={[radius * 0.85, radius, 32]} />
                <meshStandardMaterial color="#555" metalness={0.5} side={THREE.DoubleSide} transparent opacity={0.5} />
            </mesh>
        </group>
    );
};

// ============================================================
// INDUSTRIAL UNIT COOLER with Proper Axial Fans
// Large visible fans facing DOWNWARD for cold room air circulation
// ============================================================
const IndustrialUnitCooler = ({ position, fans = 3, tag }: any) => {
    const fanRefs = useRef<THREE.Group[]>([]);
    const fanSpacing = 0.7;  // Increased spacing
    const width = fans * fanSpacing + 0.4;
    const height = 0.6;
    const depth = 0.65;
    const fanRadius = 0.28;  // Larger fans for visibility

    // Animate all fans - faster rotation for visual effect
    useFrame((state, delta) => {
        fanRefs.current.forEach(ref => {
            if (ref) ref.rotation.y += delta * 12;  // Rotate around Y axis (facing down)
        });
    });

    const casingMat = new THREE.MeshStandardMaterial({ color: '#E8E8E8', roughness: 0.35, metalness: 0.25 });
    const fanHousingMat = new THREE.MeshStandardMaterial({ color: '#222222', roughness: 0.25, metalness: 0.6 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: '#DDDDDD', roughness: 0.35, metalness: 0.4 });
    const guardMat = new THREE.MeshStandardMaterial({ color: '#444444', roughness: 0.4, metalness: 0.5, wireframe: false });

    return (
        <group position={position}>
            {/* MAIN HOUSING - White/Gray industrial casing */}
            <Bx args={[width, height, depth]} position={[0, 0, 0]} material={casingMat} />

            {/* Bottom drip tray - visible aluminum */}
            <Bx args={[width + 0.12, 0.04, depth + 0.18]} position={[0, -height / 2 - 0.02, 0.05]} material={MATERIALS.finAluminum} />

            {/* Mounting brackets (ceiling) - stronger brackets */}
            <Bx args={[0.08, 0.3, 0.08]} position={[-width / 2 + 0.18, height / 2 + 0.15, 0]} material={MATERIALS.steelFrameGray} />
            <Bx args={[0.08, 0.3, 0.08]} position={[width / 2 - 0.18, height / 2 + 0.15, 0]} material={MATERIALS.steelFrameGray} />

            {/* AXIAL FANS - Facing DOWNWARD (toward room floor) for visibility */}
            {[...Array(fans)].map((_, i) => {
                const fanX = -width / 2 + fanSpacing / 2 + 0.2 + i * fanSpacing;
                return (
                    <group key={i} position={[fanX, -height / 2 - 0.06, 0]}>
                        {/* Fan housing ring - circular opening */}
                        <mesh rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[fanRadius + 0.03, 0.035, 12, 32]} />
                            <primitive object={fanHousingMat} attach="material" />
                        </mesh>

                        {/* Fan motor hub - center */}
                        <Cyl args={[0.07, 0.07, 0.1, 20]} position={[0, -0.03, 0]} material={fanHousingMat} />

                        {/* Rotating fan blades - visible axial fan */}
                        <group ref={(el: any) => fanRefs.current[i] = el} position={[0, -0.02, 0]}>
                            {[...Array(6)].map((_, b) => (
                                <mesh key={b} rotation={[0, b * (Math.PI / 3), Math.PI / 12]} position={[0, 0, 0]}>
                                    {/* Angled blade for axial flow effect */}
                                    <boxGeometry args={[fanRadius * 0.3, 0.02, fanRadius * 0.85]} />
                                    <primitive object={bladeMat} attach="material" />
                                </mesh>
                            ))}
                        </group>

                        {/* Wire guard - protective grid (visible from below) */}
                        <group position={[0, -0.08, 0]}>
                            {/* Concentric rings */}
                            <mesh rotation={[Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[fanRadius * 0.4, fanRadius * 0.45, 24]} />
                                <primitive object={guardMat} attach="material" />
                            </mesh>
                            <mesh rotation={[Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[fanRadius * 0.7, fanRadius * 0.75, 24]} />
                                <primitive object={guardMat} attach="material" />
                            </mesh>
                            <mesh rotation={[Math.PI / 2, 0, 0]}>
                                <ringGeometry args={[fanRadius * 0.95, fanRadius, 24]} />
                                <primitive object={guardMat} attach="material" />
                            </mesh>
                            {/* Cross bars */}
                            {[...Array(4)].map((_, c) => (
                                <Bx key={c} args={[fanRadius * 2, 0.015, 0.02]}
                                    rotation={[0, c * Math.PI / 4, 0]}
                                    material={guardMat} />
                            ))}
                        </group>
                    </group>
                );
            })}

            {/* Coil visible through air inlet (back side - staggered tubes) */}
            <group position={[0, 0, -depth / 2 + 0.1]}>
                {[...Array(6)].map((_, row) => (
                    <Cyl key={row} args={[0.015, 0.015, width - 0.2, 12]}
                        position={[0, -0.18 + row * 0.07, row % 2 * 0.02]}
                        rotation={[0, 0, Math.PI / 2]}
                        material={MATERIALS.coilCopper} />
                ))}
                {/* Fins visible */}
                {[...Array(8)].map((_, f) => (
                    <Bx key={f} args={[width - 0.25, 0.4, 0.003]}
                        position={[0, -0.02, -0.06 + f * 0.015]}
                        material={MATERIALS.finAluminum} />
                ))}
            </group>

            {/* Refrigerant connections (left side) - with welded joints for ammonia */}
            <group position={[-width / 2 - 0.1, 0, 0]}>
                {/* Suction (Blue - larger) */}
                <Cyl args={[0.045, 0.045, 0.18, 14]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.12, 0]} material={MATERIALS.pipeSuction} />
                {/* Liquid (Yellow - smaller) */}
                <Cyl args={[0.028, 0.028, 0.18, 14]} rotation={[0, 0, Math.PI / 2]} position={[0, -0.12, 0]} material={MATERIALS.pipeLiquid} />
            </group>

            {/* Tag - positioned above unit */}
            <Html position={[0, height / 2 + 0.4, 0]} distanceFactor={12}>
                <div style={{ background: 'rgba(0,0,0,0.7)', color: '#8ED6FF', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>
                    {tag}
                </div>
            </Html>
        </group>
    );
};

// Legacy evaporator (for backwards compatibility)
const EvaporatorUnit = ({ position, fans = 2, tag }: any) => {
    const width = fans * 0.9 + 0.4;
    const coilDepth = 0.5;
    const coilHeight = 0.45;

    return (
        <group position={position}>
            {/* Main Housing / Casing */}
            <Bx args={[width, coilHeight + 0.15, coilDepth + 0.2]} position={[0, 0, 0]} material={MATERIALS.compressorBody} />

            {/* Fin-and-Tube Coil (visible through air inlet side) */}
            <group position={[0, -0.05, -coilDepth / 2 + 0.05]}>
                {/* Coil tubes (horizontal rows) */}
                {[...Array(6)].map((_, row) => (
                    <group key={`row-${row}`} position={[0, -coilHeight / 2 + 0.05 + row * 0.07, 0]}>
                        {[...Array(Math.floor(width / 0.15))].map((_, col) => (
                            <Cyl key={`tube-${row}-${col}`}
                                args={[0.015, 0.015, coilDepth * 0.8, 8]}
                                position={[-width / 2 + 0.1 + col * 0.15, 0, 0]}
                                rotation={[Math.PI / 2, 0, 0]}
                                material={MATERIALS.coil} />
                        ))}
                    </group>
                ))}
                {/* Fins (vertical aluminum sheets) */}
                {[...Array(Math.floor(coilDepth * 10))].map((_, i) => (
                    <Bx key={`fin-${i}`}
                        args={[width * 0.9, coilHeight * 0.85, 0.003]}
                        position={[0, 0, -coilDepth * 0.4 + i * 0.04]}
                        material={new THREE.MeshStandardMaterial({ color: '#AAB7B8', metalness: 0.6, roughness: 0.4 })} />
                ))}
            </group>

            {/* Rotating Fan Motors - Facing FRONT (Z+ direction) */}
            {[...Array(fans)].map((_, i) => (
                <group key={i} position={[-width / 2 + 0.45 + i * 0.9, 0, coilDepth / 2 + 0.12]} rotation={[Math.PI / 2, 0, 0]}>
                    <RotatingFan position={[0, 0, 0]} bladeCount={4} radius={0.25} speed={3} />
                </group>
            ))}

            {/* Defrost Elements (Electric heaters - visible rods) */}
            <group position={[0, -coilHeight / 2 + 0.08, 0]}>
                {[...Array(3)].map((_, i) => (
                    <Cyl key={`defrost-${i}`}
                        args={[0.01, 0.01, width * 0.85, 8]}
                        position={[0, i * 0.05, -coilDepth / 4]}
                        rotation={[0, 0, Math.PI / 2]}
                        material={new THREE.MeshStandardMaterial({ color: '#E74C3C', emissive: '#330000', roughness: 0.5 })} />
                ))}
            </group>

            {/* Drip Tray with Heater */}
            <group position={[0, -coilHeight / 2 - 0.12, 0]}>
                <Bx args={[width + 0.15, 0.04, coilDepth + 0.25]} material={MATERIALS.steelFrame} />
                {/* Drain */}
                <Cyl args={[0.025, 0.025, 0.08, 8]} position={[width / 3, -0.05, 0]} material={MATERIALS.pipeLiquid} />
            </group>

            {/* Refrigerant Connections */}
            <group position={[-width / 2 - 0.15, 0, 0]}>
                {/* Suction outlet (Blue) */}
                <Cyl args={[0.05, 0.05, 0.25, 16]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.pipeSuction} />
                <Flange radius={0.05} position={[-0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]} />

                {/* Liquid inlet (Yellow) - with Expansion Valve */}
                <group position={[0, -0.15, 0]}>
                    <Cyl args={[0.035, 0.035, 0.2, 16]} rotation={[0, 0, Math.PI / 2]} material={MATERIALS.pipeLiquid} />
                    {/* Expansion Valve Body */}
                    <Bx args={[0.08, 0.1, 0.06]} position={[-0.05, 0, 0]} material={MATERIALS.controlPanel} />
                    {/* TXV Sensing Bulb (on suction line) */}
                    <Cyl args={[0.015, 0.015, 0.06, 8]} position={[0.05, 0.08, 0]} rotation={[0, 0, Math.PI / 2]} material={new THREE.MeshStandardMaterial({ color: '#8E44AD' })} />
                </group>
            </group>

            {/* Mounting Brackets */}
            <Bx args={[0.08, 0.15, 0.04]} position={[-width / 2 + 0.1, coilHeight / 2 + 0.1, 0]} material={MATERIALS.steelFrame} />
            <Bx args={[0.08, 0.15, 0.04]} position={[width / 2 - 0.1, coilHeight / 2 + 0.1, 0]} material={MATERIALS.steelFrame} />

            {/* Tag Label - Smaller, semi-transparent */}
            <Html position={[0, coilHeight / 2 + 0.35, 0]} distanceFactor={8}>
                <div style={{ background: 'rgba(0,0,0,0.5)', color: '#7FB3D5', padding: '2px 5px', borderRadius: '2px', fontSize: '8px', fontWeight: '500', whiteSpace: 'nowrap', opacity: 0.8 }}>
                    {tag}
                </div>
            </Html>
        </group>
    );
};

// Evaporative Condenser (Standard Industrial)
const EvaporativeCondenser = ({ position, tag, fans = 2 }: any) => {
    const width = 3.6;
    const depth = 1.8;
    const height = 3.2;

    return (
        <group position={position}>
            {/* Main Tower Body */}
            <Bx args={[width, height, depth]} position={[0, height / 2, 0]} material={MATERIALS.compressorBody} />

            {/* Air Inlets (Lower part) */}
            <Bx args={[width + 0.05, 1.2, depth + 0.05]} position={[0, 0.6, 0]} material={MATERIALS.steelFrame} />

            {/* Fans (Top part) */}
            <group position={[0, height, 0]}>
                {[...Array(fans)].map((_, i) => (
                    <group key={i} position={[(i - (fans - 1) / 2) * 1.5, 0.2, 0]}>
                        <Cyl args={[0.6, 0.6, 0.4, 32]} material={MATERIALS.oilSeparator} />
                        <Cyl args={[0.55, 0.55, 0.05, 16]} position={[0, 0.25, 0]} material={MATERIALS.steelFrame} />
                    </group>
                ))}
            </group>

            {/* Basin (Bottom) */}
            <Bx args={[width + 0.4, 0.3, depth + 0.4]} position={[0, 0.15, 0]} material={MATERIALS.steelFrame} />

            {/* Connections */}
            <group position={[0, 2.8, depth / 2]}>
                <Cyl args={[0.08, 0.08, 0.3, 16]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.pipeDischarge} />
                <Flange radius={0.08} position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} />
            </group>
            <group position={[0, 0.4, -depth / 2]}>
                <Cyl args={[0.06, 0.06, 0.3, 16]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.pipeLiquid} />
                <Flange radius={0.06} position={[0, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]} />
            </group>

            {/* Tag - Smaller, semi-transparent */}
            <Html position={[0, height + 1.5, 0]} distanceFactor={8}>
                <div style={{ background: 'rgba(0,0,0,0.5)', color: 'white', padding: '2px 6px', borderRadius: '2px', fontSize: '9px', fontWeight: '500', opacity: 0.8 }}>
                    {tag}
                </div>
            </Html>
        </group>
    );
};

// ============================================================
// PIPING COMPONENTS - SMOOTH CONTINUOUS TUBES
// ============================================================

// Smooth Pipe Route - Creates continuous tube with integrated bends
// Uses CatmullRomCurve3 for smooth industrial pipe routing
// No floating flanges - pipes connect directly to equipment nozzles
const SmoothPipeRoute = ({ waypoints, type = 'suction', radius = 0.05, showEndCaps = false }: {
    waypoints: [number, number, number][],
    type: string,
    radius: number,
    showEndCaps?: boolean
}) => {
    const material = type === 'discharge' ? MATERIALS.pipeDischarge :
        type === 'liquid' ? MATERIALS.pipeLiquid : MATERIALS.pipeSuction;

    const curve = useMemo(() => {
        const vectors = waypoints.map(p => new THREE.Vector3(...p));
        // Use lower tension for sharper industrial-looking bends
        return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.15);
    }, [waypoints]);

    return (
        <group>
            <mesh castShadow>
                <tubeGeometry args={[curve, Math.max(48, waypoints.length * 16), radius, 16, false]} />
                <primitive object={material} attach="material" />
            </mesh>
            {/* End caps - pipe ends sealed, no floating flanges */}
            {showEndCaps && (
                <>
                    <mesh position={waypoints[0]}>
                        <sphereGeometry args={[radius, 12, 12]} />
                        <primitive object={material} attach="material" />
                    </mesh>
                    <mesh position={waypoints[waypoints.length - 1]}>
                        <sphereGeometry args={[radius, 12, 12]} />
                        <primitive object={material} attach="material" />
                    </mesh>
                </>
            )}
        </group>
    );
};

// Pipe Run with proper routing (legacy support)
const PipeRun = ({ points, type = 'suction', radius = 0.05 }: { points: [number, number, number][]; type: string; radius: number }) => {
    const material = type === 'discharge' ? MATERIALS.pipeDischarge :
        type === 'liquid' ? MATERIALS.pipeLiquid :
            MATERIALS.pipeSuction;

    const curve = useMemo(() => {
        const vectors = points.map(p => new THREE.Vector3(...p));
        return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.05);
    }, [points]);

    return (
        <mesh castShadow>
            <tubeGeometry args={[curve, 64, radius, 8, false]} />
            <primitive object={material} attach="material" />
        </mesh>
    );
};

// ============================================================
// MAIN COMPONENT - DATA-DRIVEN PROFESSIONAL LAYOUT
// ============================================================

const Refrigeration3DCanvas: React.FC<any> = ({ data, projectInfo }) => {
    // Extract system parameters from design data
    const refrigerant = data?.systemParams?.refrigerant || data?.project?.refrigerant || 'R717';
    const capacity = data?.summary?.totalCoolingLoad || data?.calculations?.loads?.reduce((sum: number, l: any) => sum + (l.total || 0), 0) || 150;

    // Get refrigerant-specific configuration
    const refrigerantConfig = useMemo(() => getRefrigerantConfig(refrigerant), [refrigerant]);

    // Get cycle configuration for equipment and piping requirements
    const cycleConfig = useMemo(() => getCycleConfiguration(refrigerant), [refrigerant]);
    const equipmentReqs = cycleConfig.equipment;
    const pipingReqs = cycleConfig.piping;

    // Create dynamic pipe materials based on refrigerant type
    const pipeMaterials = useMemo(() => ({
        discharge: new THREE.MeshStandardMaterial({
            color: refrigerantConfig.pipeColors.discharge,
            roughness: 0.25,
            metalness: 0.6,
            envMapIntensity: 1.2
        }),
        suction: new THREE.MeshStandardMaterial({
            color: refrigerantConfig.pipeColors.suction,
            roughness: 0.25,
            metalness: 0.6,
            envMapIntensity: 1.2
        }),
        liquid: new THREE.MeshStandardMaterial({
            color: refrigerantConfig.pipeColors.liquid,
            roughness: 0.25,
            metalness: 0.6,
            envMapIntensity: 1.2
        }),
        hotGas: new THREE.MeshStandardMaterial({
            color: refrigerantConfig.pipeColors.hotGas,
            roughness: 0.25,
            metalness: 0.6,
            envMapIntensity: 1.2
        })
    }), [refrigerantConfig]);

    // Detect compressor type from data (Screw, Reciprocating, etc.)
    // Check multiple sources for compressor type - more robust detection
    const compressorTypeFromData =
        data?.summary?.compressorType ||
        data?.equipment?.compressors?.[0]?.type ||
        projectInfo?.compressorType ||
        projectInfo?.equipment?.compressorType ||
        data?.compressorType ||
        'screw'; // Default to screw for industrial ammonia

    // Debug: Log what we detected
    console.log('Compressor type detected:', compressorTypeFromData, 'isScrew:', compressorTypeFromData?.toLowerCase()?.includes('screw'));

    const isScrew = compressorTypeFromData?.toLowerCase()?.includes('screw');
    const isAmmonia = refrigerant === 'R717' || refrigerantConfig.type === 'ammonia';

    // Equipment data from calculations
    const compressors = data?.equipment?.compressors || [];
    const evaporators = data?.equipment?.evaporators || [];
    const condensers = data?.equipment?.condensers || [];
    const separators = data?.equipment?.separators || [];
    const pumps = data?.equipment?.pumps || [];
    const receivers = data?.equipment?.receivers || [{ tag: 'REC-1' }, { tag: 'REC-2' }];
    const thermosiphon = data?.equipment?.thermosiphon || { tag: 'THERMO-1' };

    // PIPE SIZING from design calculations (ASHRAE/ASME B31.5)
    // Extract from piping data or calculate based on capacity
    const pipingSizing = data?.piping?.sizing || data?.pipework?.sizing || {};
    const dischargePipeSize = pipingSizing.discharge?.diameter || Math.max(0.08, Math.sqrt(capacity / 1500) * 0.15); // m
    const suctionPipeSize = pipingSizing.suction?.diameter || Math.max(0.12, Math.sqrt(capacity / 800) * 0.2);  // m  
    const liquidPipeSize = pipingSizing.liquid?.diameter || Math.max(0.04, Math.sqrt(capacity / 3000) * 0.08);   // m

    // Header sizes (larger diameter for manifolds)
    const dischargeHeaderSize = dischargePipeSize * 1.5;
    const suctionHeaderSize = suctionPipeSize * 1.5;

    // Calculate machine room dimensions based on equipment count and ASHRAE 15 clearances
    const compressorCount = Math.max(2, compressors.length || 2);
    const vesselCount = Math.max(3, separators.length + receivers.length + 1);
    const pumpCount = Math.max(2, pumps.length || 2);

    // ASHRAE 15 requires minimum 1m clearance for maintenance access
    const roomWidth = Math.max(14, compressorCount * 4.5 + vesselCount * 2.5);
    const roomDepth = Math.max(12, 8 + (capacity / 100));
    const roomHeight = 6;

    // Cold room dimensions (separate building)
    const coldRoomWidth = Math.max(10, capacity / 30);
    const coldRoomDepth = Math.max(8, capacity / 40);
    const coldRoomHeight = 5;

    return (
        <Box sx={{ width: '100%', height: '100%', position: 'relative', bgcolor: '#1a1a1a' }}>
            <Canvas shadows camera={{ position: [25, 18, 25], fov: 45 }}>
                <PerspectiveCamera makeDefault position={[25, 18, 25]} />
                <OrbitControls target={[0, 2, 0]} maxPolarAngle={Math.PI / 2.1} minDistance={5} maxDistance={60} />

                {/* PROFESSIONAL LIGHTING */}
                <ambientLight intensity={0.35} />
                <directionalLight
                    position={[20, 30, 15]}
                    intensity={1.4}
                    castShadow
                    shadow-mapSize={[4096, 4096]}
                    shadow-camera-far={100}
                    shadow-camera-left={-30}
                    shadow-camera-right={30}
                    shadow-camera-top={30}
                    shadow-camera-bottom={-30}
                />
                <directionalLight position={[-15, 20, -10]} intensity={0.5} />
                <directionalLight position={[0, 10, 20]} intensity={0.3} />

                {/* Environment map for realistic reflections on metal surfaces */}
                <Environment preset="warehouse" />

                {/* Hemisphere light for natural fill */}
                <hemisphereLight args={['#87CEEB', '#4a4a4a', 0.3]} />

                {/* MACHINE ROOM ENCLOSURE */}
                <ProfessionalMachineRoom width={roomWidth} depth={roomDepth} height={roomHeight} />
                <Grid args={[roomWidth + 10, roomDepth + coldRoomDepth + 10]} cellColor="#444" sectionColor="#666" fadeDistance={35} />
                <ContactShadows position={[0, 0.01, 0]} scale={50} blur={2} far={15} opacity={0.5} />

                {/* =============== EQUIPMENT LAYOUT =============== */}

                {/* COMPRESSOR PACKAGES - Uses correct type based on design data */}
                <group position={[-roomWidth / 4, 0, roomDepth / 4]}>
                    {compressors.length > 0 ? (
                        compressors.map((comp: any, i: number) => (
                            isScrew ? (
                                <ScrewCompressorPackage
                                    key={i}
                                    position={[i * 5, 0, 0]}
                                    tag={comp.tag || `COMP-${i + 1}`}
                                    rotation={0}
                                    capacity={comp.capacity || (capacity / compressorCount)}
                                />
                            ) : (
                                <IndustrialReciprocatingCompressor
                                    key={i}
                                    position={[i * 5, 0, 0]}
                                    tag={comp.tag || `COMP-${i + 1}`}
                                    rotation={0}
                                    capacity={comp.capacity || (capacity / compressorCount)}
                                    cylinders={comp.cylinders || 6}
                                />
                            )
                        ))
                    ) : (
                        /* Default: 2 compressors of correct type */
                        isScrew ? (
                            <>
                                <ScrewCompressorPackage position={[0, 0, 0]} tag="COMP-1" rotation={0} capacity={capacity / compressorCount} />
                                <ScrewCompressorPackage position={[5, 0, 0]} tag="COMP-2" rotation={0} capacity={capacity / compressorCount} />
                                {compressorCount > 2 && (
                                    <ScrewCompressorPackage position={[10, 0, 0]} tag="COMP-3" rotation={0} capacity={capacity / compressorCount} />
                                )}
                            </>
                        ) : (
                            <>
                                <IndustrialReciprocatingCompressor position={[0, 0, 0]} tag="COMP-1" rotation={0} capacity={capacity / compressorCount} cylinders={6} />
                                <IndustrialReciprocatingCompressor position={[5, 0, 0]} tag="COMP-2" rotation={0} capacity={capacity / compressorCount} cylinders={6} />
                                {compressorCount > 2 && (
                                    <IndustrialReciprocatingCompressor position={[10, 0, 0]} tag="COMP-3" rotation={0} capacity={capacity / compressorCount} cylinders={6} />
                                )}
                            </>
                        )
                    )}
                </group>

                {/* REFRIGERANT PUMPS - Only for flooded systems (R717) */}
                {equipmentReqs.hasRefrigerantPumps && (
                    <group position={[roomWidth / 4 - 2, 0, roomDepth / 4]}>
                        <AmmoniaPump position={[0, 0, 0]} tag="PUMP-1" />
                        <AmmoniaPump position={[1.5, 0, 0]} tag="PUMP-2" />
                        {pumpCount > 2 && <AmmoniaPump position={[3, 0, 0]} tag="PUMP-3" />}
                    </group>
                )}

                {/* HORIZONTAL PRESSURE VESSELS - Back Row */}
                <group position={[0, 0, -roomDepth / 4]}>
                    {/* High Pressure Receivers (Tan/Pink - Horizontal) */}
                    <HorizontalVessel
                        position={[-roomWidth / 4 + 1, 0, 0]}
                        length={2.8}
                        diameter={0.7}
                        type="receiver"
                        tag="REC-1"
                    />
                    <HorizontalVessel
                        position={[roomWidth / 4 - 3, 0, 0]}
                        length={2.8}
                        diameter={0.7}
                        type="receiver"
                        tag="REC-2"
                    />

                    {/* Low Pressure Separator/Receiver - Only for flooded systems (R717) */}
                    {equipmentReqs.hasSeparator && (
                        <HorizontalVessel
                            position={[0, 0, -3]}
                            length={3.5}
                            diameter={1.0}
                            type="separator"
                            tag="SEP-1"
                            elevated={true}
                            structureHeight={2.5}
                        />
                    )}

                    {/* Suction Accumulator - For DX systems (R404A, R134a, R290) */}
                    {equipmentReqs.hasSuctionAccumulator && !equipmentReqs.hasSeparator && (
                        <HorizontalVessel
                            position={[0, 0, -3]}
                            length={1.2}
                            diameter={0.5}
                            type="accumulator"
                            tag="ACC-1"
                            elevated={false}
                        />
                    )}

                    {/* Thermosiphon Oil Cooler - Only for systems with oil separator */}
                    {equipmentReqs.hasOilSeparator && (
                        <HorizontalVessel
                            position={[roomWidth / 4, 0, -3]}
                            length={2.2}
                            diameter={0.6}
                            type="thermosiphon"
                            tag="THERMO-1"
                        />
                    )}

                    {/* Filter Drier - For HFC/HFO systems */}
                    {equipmentReqs.hasFilterDrier && (
                        <group position={[-roomWidth / 4 + 3, 0.4, 0]}>
                            {/* Cylindrical filter drier body */}
                            <mesh castShadow>
                                <cylinderGeometry args={[0.08, 0.08, 0.4, 16]} />
                                <meshStandardMaterial color="#C0C0C0" metalness={0.7} roughness={0.3} />
                            </mesh>
                            <Html position={[0, 0.35, 0]}>
                                <div style={{ background: '#333', color: '#fff', padding: '2px 6px', fontSize: '9px', borderRadius: '3px' }}>
                                    FD-1
                                </div>
                            </Html>
                        </group>
                    )}
                </group>

                {/* =============== COMPLETE REFRIGERATION CYCLE PIPING =============== */}
                {/* Following proper ammonia refrigeration cycle per ASHRAE/IIAR standards */}
                {/* CYCLE: Compressor→Condenser→Receiver→Expansion→Evaporator→Separator→Compressor */}

                {/* Equipment positions for proper pipe connections */}
                {(() => {
                    // Calculate actual equipment nozzle positions
                    const comp1Pos = { x: -roomWidth / 4, y: 1.8, z: roomDepth / 4 };
                    const comp2Pos = { x: -roomWidth / 4 + 5, y: 1.8, z: roomDepth / 4 };
                    const condPos = { x: 0, y: roomHeight + 3.5 + 2.8, z: -roomDepth / 2 - 2 }; // Condenser hot gas inlet
                    const condOutPos = { x: 0, y: roomHeight + 3.5 + 0.4, z: -roomDepth / 2 - 2 - 1.8 / 2 - 0.15 }; // Condenser liquid out
                    const rec1Pos = { x: -roomWidth / 4 + 1, y: 0.5, z: -roomDepth / 4 };
                    const sepPos = { x: 0, y: 3.5, z: -roomDepth / 4 - 3 }; // Separator inlet
                    const evapPos = { x: 0, y: coldRoomHeight - 0.3, z: roomDepth / 2 + coldRoomDepth / 2 + 3 };
                    const pump1Pos = { x: roomWidth / 4 - 2, y: 0.5, z: roomDepth / 4 };

                    return (
                        <>
                            {/* === STAGE 1: COMPRESSOR DISCHARGE TO CONDENSER (Red - Hot Gas) === */}
                            {/* Discharge header collects from all compressors */}
                            <PipeHeader position={[0, 4.5, roomDepth / 4 - 2]} length={10} diameter={dischargeHeaderSize * 2} type="discharge" branches={compressorCount} />

                            {/* Discharge from compressor 1 nozzle UP to header */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [comp1Pos.x + 0.5, comp1Pos.y, comp1Pos.z - 0.5],
                                    [comp1Pos.x + 0.5, 4.5, comp1Pos.z - 0.5],
                                    [comp1Pos.x + 0.5, 4.5, roomDepth / 4 - 2]
                                ]}
                                type="discharge"
                                radius={dischargePipeSize}
                            />

                            {/* Discharge from compressor 2 nozzle UP to header */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [comp2Pos.x + 0.5, comp2Pos.y, comp2Pos.z - 0.5],
                                    [comp2Pos.x + 0.5, 4.5, comp2Pos.z - 0.5],
                                    [comp2Pos.x + 0.5, 4.5, roomDepth / 4 - 2]
                                ]}
                                type="discharge"
                                radius={dischargePipeSize}
                            />

                            {/* Discharge header to Condenser inlet - route outside building */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [0, 4.5, roomDepth / 4 - 2],
                                    [0, 4.5, -roomDepth / 2 + 1],
                                    [0, roomHeight + 4, -roomDepth / 2 + 1],
                                    [0, roomHeight + 4, -roomDepth / 2 - 2],
                                    [0, condPos.y, -roomDepth / 2 - 2]
                                ]}
                                type="discharge"
                                radius={dischargePipeSize * 1.2}
                            />

                            {/* === STAGE 2: CONDENSER TO RECEIVER (Yellow - Liquid) === */}
                            {/* Liquid from condenser bottom down to receiver top */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [0, roomHeight + 3.5, -roomDepth / 2 - 2 - 0.9],
                                    [0, roomHeight + 2, -roomDepth / 2 - 2 - 0.9],
                                    [0, roomHeight + 2, -roomDepth / 4],
                                    [0, 1.5, -roomDepth / 4],
                                    [rec1Pos.x + 1.4, 1.5, rec1Pos.z],
                                    [rec1Pos.x + 1.4, 0.85, rec1Pos.z]
                                ]}
                                type="liquid"
                                radius={liquidPipeSize}
                            />

                            {/* === STAGE 3: RECEIVER TO EVAPORATORS (Yellow - Liquid) === */}
                            {/* Liquid from receiver out to cold room through expansion valves */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [rec1Pos.x - 1.4, 0.6, rec1Pos.z],
                                    [rec1Pos.x - 1.4, 0.6, 0],
                                    [0, 0.6, 0],
                                    [0, 0.6, roomDepth / 2],
                                    [0, 0.6, evapPos.z - coldRoomDepth / 2 + 0.5],
                                    [0, evapPos.y - 0.4, evapPos.z - coldRoomDepth / 2 + 0.5]
                                ]}
                                type="liquid"
                                radius={liquidPipeSize}
                            />

                            {/* Liquid branches to each evaporator */}
                            {evaporators.length > 1 || true ? (
                                <>
                                    <SmoothPipeRoute
                                        waypoints={[
                                            [-coldRoomWidth / 4, evapPos.y - 0.4, evapPos.z - coldRoomDepth / 2 + 0.5],
                                            [-coldRoomWidth / 4, evapPos.y, evapPos.z]
                                        ]}
                                        type="liquid"
                                        radius={liquidPipeSize * 0.8}
                                    />
                                    <SmoothPipeRoute
                                        waypoints={[
                                            [coldRoomWidth / 4, evapPos.y - 0.4, evapPos.z - coldRoomDepth / 2 + 0.5],
                                            [coldRoomWidth / 4, evapPos.y, evapPos.z]
                                        ]}
                                        type="liquid"
                                        radius={liquidPipeSize * 0.8}
                                    />
                                </>
                            ) : null}

                            {/* === STAGE 4: EVAPORATOR TO SEPARATOR (Blue - Suction) === */}
                            {/* Suction return from evaporators to separator inlet */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [0, evapPos.y + 0.2, evapPos.z],
                                    [0, evapPos.y + 0.2, evapPos.z - coldRoomDepth / 2 - 1],
                                    [0, 4, evapPos.z - coldRoomDepth / 2 - 1],
                                    [0, 4, roomDepth / 2],
                                    [0, 4, sepPos.z + 1.75 / 2],
                                    [0, sepPos.y + 0.5, sepPos.z + 1.75 / 2]
                                ]}
                                type="suction"
                                radius={suctionPipeSize}
                            />

                            {/* === STAGE 5: SEPARATOR TO COMPRESSORS (Blue - Suction) === */}
                            {/* Suction from separator outlet to compressor suction nozzles */}
                            <PipeHeader position={[0, 3.0, -roomDepth / 4]} length={12} diameter={suctionHeaderSize * 2} type="suction" branches={compressorCount} />

                            {/* Separator to suction header */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [0, sepPos.y, sepPos.z - 1.75 / 2 - 0.5],
                                    [0, sepPos.y, sepPos.z + 3],
                                    [0, 3.0, sepPos.z + 3],
                                    [0, 3.0, -roomDepth / 4]
                                ]}
                                type="suction"
                                radius={suctionPipeSize * 1.2}
                            />

                            {/* Suction header to compressor 1 suction nozzle */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [comp1Pos.x, 3.0, -roomDepth / 4],
                                    [comp1Pos.x, 3.0, comp1Pos.z - 1.5],
                                    [comp1Pos.x, comp1Pos.y - 0.6, comp1Pos.z - 1.5],
                                    [comp1Pos.x - 0.8, comp1Pos.y - 0.6, comp1Pos.z]
                                ]}
                                type="suction"
                                radius={suctionPipeSize}
                            />

                            {/* Suction header to compressor 2 suction nozzle */}
                            <SmoothPipeRoute
                                waypoints={[
                                    [comp2Pos.x, 3.0, -roomDepth / 4],
                                    [comp2Pos.x, 3.0, comp2Pos.z - 1.5],
                                    [comp2Pos.x, comp2Pos.y - 0.6, comp2Pos.z - 1.5],
                                    [comp2Pos.x - 0.8, comp2Pos.y - 0.6, comp2Pos.z]
                                ]}
                                type="suction"
                                radius={liquidPipeSize * 1.2}
                            />

                            {/* === PUMP RECIRCULATION LINE (Flooded systems only) === */}
                            {equipmentReqs.hasRefrigerantPumps && (
                                <SmoothPipeRoute
                                    waypoints={[
                                        [pump1Pos.x, pump1Pos.y + 0.3, pump1Pos.z + 0.3],
                                        [pump1Pos.x, pump1Pos.y + 0.3, roomDepth / 2],
                                        [coldRoomWidth / 3, pump1Pos.y + 0.3, roomDepth / 2],
                                        [coldRoomWidth / 3, evapPos.y - 0.5, evapPos.z]
                                    ]}
                                    type="liquid"
                                    radius={liquidPipeSize * 1.2}
                                />
                            )}

                            {/* === DX DIRECT EXPANSION PIPING (Non-flooded systems) === */}
                            {/* For R404A, R134a, R290 - Direct from receiver to TXV to evaporator */}
                            {!equipmentReqs.hasRefrigerantPumps && !equipmentReqs.hasSeparator && (
                                <>
                                    {/* Liquid from receiver directly to TXV at evaporator inlet */}
                                    <SmoothPipeRoute
                                        waypoints={[
                                            [rec1Pos.x - 1.4, 0.6, rec1Pos.z],
                                            [-roomWidth / 4 + 3, 0.6, rec1Pos.z],  // Through filter drier
                                            [-roomWidth / 4 + 3, 0.6, 0],
                                            [0, 0.6, 0],
                                            [0, 0.6, roomDepth / 2],
                                            [0, evapPos.y - 0.5, evapPos.z - coldRoomDepth / 2 + 0.5]
                                        ]}
                                        type="liquid"
                                        radius={liquidPipeSize}
                                    />

                                    {/* Suction from evaporator to accumulator to compressor */}
                                    <SmoothPipeRoute
                                        waypoints={[
                                            [0, evapPos.y + 0.2, evapPos.z],
                                            [0, evapPos.y + 0.2, evapPos.z - coldRoomDepth / 2 - 1],
                                            [0, 4, evapPos.z - coldRoomDepth / 2 - 1],
                                            [0, 4, roomDepth / 2],
                                            [0, 4, -roomDepth / 4 - 3],  // To accumulator position
                                            [0, 1, -roomDepth / 4 - 3]    // Accumulator inlet
                                        ]}
                                        type="suction"
                                        radius={suctionPipeSize}
                                    />

                                    {/* Accumulator to suction header */}
                                    <SmoothPipeRoute
                                        waypoints={[
                                            [0, 1, -roomDepth / 4 - 3 - 0.6],  // Accumulator outlet
                                            [0, 3.0, -roomDepth / 4 - 3 - 0.6],
                                            [0, 3.0, -roomDepth / 4]
                                        ]}
                                        type="suction"
                                        radius={suctionPipeSize * 1.1}
                                    />
                                </>
                            )}
                        </>
                    );
                })()}

                {/* =============== COMPREHENSIVE VALVE SYSTEM =============== */}
                {/* Discharge Check Valves - Prevent backflow to compressors */}
                <Valve3D position={[-roomWidth / 4, 4.2, roomDepth / 4 - 1]} type="check" size={0.12} />
                <Valve3D position={[-roomWidth / 4 + 5, 4.2, roomDepth / 4 - 1]} type="check" size={0.12} />

                {/* Suction Stop Valves - Compressor isolation */}
                <Valve3D position={[-roomWidth / 4 - 1.5, 3.2, -roomDepth / 4 + 1]} type="gate" size={0.15} />
                <Valve3D position={[-roomWidth / 4 + 3.5, 3.2, -roomDepth / 4 + 1]} type="gate" size={0.15} />

                {/* Liquid Line King Valve */}
                <Valve3D position={[-roomWidth / 4 + 2.5, 0.8, -roomDepth / 4 + 0.5]} type="gate" size={0.10} />

                {/* Relief Valves - High pressure protection */}
                <Valve3D position={[-roomWidth / 4 + 1, 1.5, -roomDepth / 4 - 0.5]} type="relief" size={0.10} />
                <Valve3D position={[roomWidth / 4 - 3, 1.5, -roomDepth / 4 - 0.5]} type="relief" size={0.10} />

                {/* SOLENOID VALVES - Automatic liquid line control */}
                <SolenoidValve3D position={[0, 0.8, 2]} type="liquid" size={0.06} />
                <SolenoidValve3D position={[2, 0.8, 2]} type="liquid" size={0.06} />

                {/* EXPANSION VALVES - At evaporator inlets */}
                <ExpansionValve3D position={[-2, 0.8, roomDepth / 2 + 1]} size={0.05} />
                <ExpansionValve3D position={[2, 0.8, roomDepth / 2 + 1]} size={0.05} />

                {/* HAND EXPANSION VALVES - For manual adjustment */}
                <HandExpansionValve3D position={[-4, 0.8, 0]} size={0.05} />
                <HandExpansionValve3D position={[4, 0.8, 0]} size={0.05} />

                {/* Ball Valves - Service isolation */}
                <Valve3D position={[0, 0.8, 0]} type="ball" size={0.08} />
                <Valve3D position={[-3, 0.8, -1]} type="ball" size={0.06} />
                <Valve3D position={[3, 0.8, -1]} type="ball" size={0.06} />

                {/* =============== PIPE SUPPORTS (ASHRAE B31.5) =============== */}
                {/* Floor-mounted pipe stands - every 3m on liquid lines */}
                {[-6, -3, 0, 3, 6].map((x, i) => (
                    <PipeStand key={`liquid-stand-${i}`} position={[x, 0, 1]} height={0.8} pipeRadius={0.06} />
                ))}

                {/* Ceiling hangers - Suction header */}
                {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
                    <PipeCeilingHanger key={`suction-hanger-${i}`} position={[x, roomHeight - 0.2, -roomDepth / 4]} dropLength={roomHeight - 3.7} pipeRadius={0.17} />
                ))}

                {/* Ceiling hangers - Discharge header */}
                {[-4, -1, 2, 5].map((x, i) => (
                    <PipeCeilingHanger key={`discharge-hanger-${i}`} position={[x, roomHeight - 0.2, roomDepth / 4 - 2]} dropLength={roomHeight - 4.7} pipeRadius={0.12} />
                ))}

                {/* Roller supports for horizontal runs (thermal expansion) */}
                <PipeRollerSupport position={[-roomWidth / 4 + 1.5, 0, roomDepth / 4 + 2]} height={0.6} pipeRadius={0.06} />
                <PipeRollerSupport position={[roomWidth / 4 - 1.5, 0, roomDepth / 4 + 2]} height={0.6} pipeRadius={0.06} />

                {/* =============== ROOFTOP CONDENSERS - Ground-based tall platform =============== */}
                {/* Platform extends from ground level to rooftop */}
                <group position={[0, 0, -roomDepth / 2 - 2]}>
                    {/* Steel platform extending from ground to above roof - now grounded */}
                    <ProfessionalSteelStructure
                        width={8}
                        depth={4}
                        height={roomHeight + 3}
                        position={[0, 0, 0]}
                        withWalkway={true}
                        withLadder={true}
                    />
                    {/* Evaporative Condensers - On top of platform */}
                    <EvaporativeCondenser position={[-2.5, roomHeight + 3 + 0.5, 0]} tag="COND-1" fans={2} />
                    <EvaporativeCondenser position={[2.5, roomHeight + 3 + 0.5, 0]} tag="COND-2" fans={2} />
                </group>

                {/* =============== COLD STORAGE ROOM =============== */}
                <group position={[0, 0, roomDepth / 2 + coldRoomDepth / 2 + 3]}>
                    {/* Insulated Cold Room Structure */}
                    <ColdStorageRoomWithEvaporators
                        width={coldRoomWidth}
                        depth={coldRoomDepth}
                        height={coldRoomHeight}
                        evaporatorCount={evaporators.length || 2}
                        fansPerEvaporator={3}
                        temperature={evaporators[0]?.evapTemp || -25}
                    />
                </group>

            </Canvas>

            {/* PROFESSIONAL INFO PANEL */}
            <Paper sx={{
                position: 'absolute',
                top: 16,
                left: 16,
                p: 2,
                bgcolor: 'rgba(255,255,255,0.95)',
                maxWidth: 240,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                    3D Machine Room Layout
                </Typography>
                <Box display="flex" gap={0.5} mb={1}>
                    <Chip label={refrigerant} size="small" color="primary" />
                    <Chip
                        label={refrigerantConfig.cycleType.toUpperCase()}
                        size="small"
                        variant="outlined"
                        color="secondary"
                        sx={{ fontSize: '10px' }}
                    />
                </Box>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '10px' }}>
                    Refrigerant: <b>{refrigerantConfig.name}</b>
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                    Room: {roomWidth.toFixed(0)}m × {roomDepth.toFixed(0)}m × {roomHeight}m
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                    Total Load: <b>{capacity.toFixed(0)} kW</b>
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                    Compressors: {compressorCount} × {isScrew ? 'Screw' : 'Reciprocating'}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary">
                    Pumps: {pumpCount} × Hermetic
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                    <b>Pipe Sizing (ASME B31.5)</b>
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '10px' }}>
                    Discharge: Ø{(dischargePipeSize * 1000).toFixed(0)}mm | Suction: Ø{(suctionPipeSize * 1000).toFixed(0)}mm
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: '10px' }}>
                    Liquid: Ø{(liquidPipeSize * 1000).toFixed(0)}mm
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, color: 'success.main', fontWeight: 500 }}>
                    ASHRAE 15 Compliant
                </Typography>
            </Paper>

            {/* LEGEND - Dynamic colors based on refrigerant */}
            <Paper sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                p: 1.5,
                bgcolor: 'rgba(255,255,255,0.9)',
                borderRadius: 1
            }}>
                <Typography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                    Piping Legend ({refrigerantConfig.type === 'ammonia' ? 'IIAR 114' : 'ASHRAE'})
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip label="Discharge" size="small" sx={{ bgcolor: refrigerantConfig.pipeColors.discharge, color: 'white', fontSize: '10px' }} />
                    <Chip label="Suction" size="small" sx={{ bgcolor: refrigerantConfig.pipeColors.suction, color: 'white', fontSize: '10px' }} />
                    <Chip label="Liquid" size="small" sx={{ bgcolor: refrigerantConfig.pipeColors.liquid, color: 'white', fontSize: '10px' }} />
                </Box>
            </Paper>
        </Box>
    );
};

// Cold Storage Room with mounted evaporators - TRANSPARENT WALLS for visibility
const ColdStorageRoomWithEvaporators = ({
    width,
    depth,
    height,
    evaporatorCount = 2,
    fansPerEvaporator = 3,
    temperature = -25
}: any) => {
    // Transparent material for walls - allows viewing inside
    const transparentWallMat = new THREE.MeshStandardMaterial({
        color: '#E8E8FF',
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        roughness: 0.5
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: '#888888', roughness: 0.5, metalness: 0.3 });

    return (
        <group>
            {/* INSULATED PANEL STRUCTURE - With Transparent Walls */}
            {/* Floor (insulated - solid) */}
            <Bx args={[width, 0.2, depth]} position={[0, 0.1, 0]} material={MATERIALS.panelWhite} />

            {/* TRANSPARENT WALLS - Can see equipment inside */}
            <mesh position={[0, height / 2, -depth / 2]}>
                <planeGeometry args={[width, height]} />
                <primitive object={transparentWallMat} attach="material" />
            </mesh>
            <mesh position={[0, height / 2, depth / 2]}>
                <planeGeometry args={[width, height]} />
                <primitive object={transparentWallMat} attach="material" />
            </mesh>
            <mesh position={[-width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <primitive object={transparentWallMat} attach="material" />
            </mesh>
            <mesh position={[width / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[depth, height]} />
                <primitive object={transparentWallMat} attach="material" />
            </mesh>

            {/* Wall Frame - Visible edges */}
            {/* Bottom frame */}
            <Bx args={[width, 0.05, 0.05]} position={[0, 0.2, -depth / 2]} material={frameMat} />
            <Bx args={[width, 0.05, 0.05]} position={[0, 0.2, depth / 2]} material={frameMat} />
            <Bx args={[0.05, 0.05, depth]} position={[-width / 2, 0.2, 0]} material={frameMat} />
            <Bx args={[0.05, 0.05, depth]} position={[width / 2, 0.2, 0]} material={frameMat} />
            {/* Top frame */}
            <Bx args={[width, 0.05, 0.05]} position={[0, height, -depth / 2]} material={frameMat} />
            <Bx args={[width, 0.05, 0.05]} position={[0, height, depth / 2]} material={frameMat} />
            <Bx args={[0.05, 0.05, depth]} position={[-width / 2, height, 0]} material={frameMat} />
            <Bx args={[0.05, 0.05, depth]} position={[width / 2, height, 0]} material={frameMat} />
            {/* Vertical corners */}
            <Bx args={[0.05, height, 0.05]} position={[-width / 2, height / 2, -depth / 2]} material={frameMat} />
            <Bx args={[0.05, height, 0.05]} position={[width / 2, height / 2, -depth / 2]} material={frameMat} />
            <Bx args={[0.05, height, 0.05]} position={[-width / 2, height / 2, depth / 2]} material={frameMat} />
            <Bx args={[0.05, height, 0.05]} position={[width / 2, height / 2, depth / 2]} material={frameMat} />

            {/* Ceiling (slightly transparent) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color="#DDDDDD" transparent opacity={0.4} side={THREE.DoubleSide} />
            </mesh>

            {/* Sliding door */}
            <group position={[0, height / 2 - 0.5, depth / 2 + 0.08]}>
                <Bx args={[2.5, height - 1, 0.08]} material={MATERIALS.panelStainless} />
                {/* Door handle */}
                <Bx args={[0.15, 0.8, 0.05]} position={[1.1, 0, 0.05]} material={MATERIALS.steelFrameGray} />
            </group>

            {/* EVAPORATORS - Industrial Unit Coolers (Ceiling-mounted) */}
            {[...Array(evaporatorCount)].map((_, i) => (
                <group key={i} position={[
                    -width / 2 + width / (evaporatorCount + 1) * (i + 1),
                    height - 0.5,
                    0
                ]}>
                    <IndustrialUnitCooler
                        position={[0, 0, 0]}
                        fans={fansPerEvaporator}
                        tag={`EVAP-${i + 1}`}
                    />
                </group>
            ))}

            {/* Temperature indicator - Smaller, semi-transparent */}
            <Html position={[0, height + 0.5, 0]} distanceFactor={10}>
                <div style={{
                    background: 'rgba(34,85,170,0.7)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '500',
                    textAlign: 'center',
                    opacity: 0.85
                }}>
                    Cold Room<br />
                    {temperature}°C
                </div>
            </Html>
        </group>
    );
};

// Open Machine Room Structure (Like Reference - NO solid walls blocking view)
const ProfessionalMachineRoom = ({ width, depth, height }: { width: number; depth: number; height: number }) => {
    // Gray concrete-like material for floor and columns
    const concreteMat = new THREE.MeshStandardMaterial({ color: '#808080', roughness: 0.9, metalness: 0.1 });
    const columnMat = new THREE.MeshStandardMaterial({ color: '#B0B0B0', roughness: 0.6, metalness: 0.2 });

    return (
        <group>
            {/* CONCRETE FLOOR SLAB */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[width + 4, depth + 4]} />
                <primitive object={concreteMat} attach="material" />
            </mesh>

            {/* BLACK EQUIPMENT FOUNDATION PADS (like reference images) */}
            {/* Compressor row foundations */}
            {[-6, -1, 4].map((x, i) => (
                <Bx key={`comp-pad-${i}`} args={[3.5, 0.15, 2]} position={[x, 0.08, 3]}
                    material={new THREE.MeshStandardMaterial({ color: '#1a1a1a', roughness: 0.8 })} />
            ))}

            {/* STRUCTURAL COLUMNS - Open frame like reference */}
            {[...Array(Math.ceil(width / 5) + 1)].map((_, i) => (
                <group key={`col-${i}`}>
                    {/* Front columns */}
                    <Bx args={[0.25, height, 0.25]} position={[-width / 2 + i * 5, height / 2, depth / 2]} material={columnMat} />
                    {/* Back columns */}
                    <Bx args={[0.25, height, 0.25]} position={[-width / 2 + i * 5, height / 2, -depth / 2]} material={columnMat} />
                </group>
            ))}

            {/* HORIZONTAL ROOF BEAMS */}
            <Bx args={[width, 0.2, 0.3]} position={[0, height, depth / 2]} material={columnMat} />
            <Bx args={[width, 0.2, 0.3]} position={[0, height, -depth / 2]} material={columnMat} />
            <Bx args={[width, 0.2, 0.3]} position={[0, height, 0]} material={columnMat} />

            {/* CROSS BEAMS */}
            {[...Array(Math.ceil(width / 5) + 1)].map((_, i) => (
                <Bx key={`beam-${i}`} args={[0.15, 0.2, depth]} position={[-width / 2 + i * 5, height, 0]} material={columnMat} />
            ))}

            {/* ROOF DECK (light gray, slightly transparent for visibility) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height + 0.1, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color="#A0A0A0" transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

// ==============================
// VALVE & INFRASTRUCTURE COMPONENTS
// ==============================

// Ammonia Valve - WELDED CONNECTIONS ONLY (IIAR Standard)
// All ammonia valves use socket weld or butt weld - NO FLANGES
const AmmoniaValve = ({ position, type = "ball", size = 0.2, rotation = [0, 0, 0] }: any) => {
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#B0B0B0', metalness: 0.6, roughness: 0.25 });
    const handleMat = MATERIALS.valveHandle;

    return (
        <group position={position} rotation={rotation}>
            {/* Welded ends - no flanges for ammonia per IIAR */}
            <WeldedConnection radius={size} position={[0, 0, -size * 0.7]} rotation={[Math.PI / 2, 0, 0]} />
            <WeldedConnection radius={size} position={[0, 0, size * 0.7]} rotation={[Math.PI / 2, 0, 0]} />

            {/* Body - forged steel */}
            <Cyl args={[size, size, size * 1.4, 16]} rotation={[Math.PI / 2, 0, 0]} material={bodyMat} />

            {/* Handles per valve type */}
            {type === "ball" && (
                <group position={[0, size * 1.1, 0]}>
                    <Bx args={[size * 0.2, size * 0.35, size * 0.2]} material={bodyMat} />
                    <Bx args={[size * 0.18, size * 0.12, size * 1.6]} position={[0, size * 0.22, -size * 0.5]} material={handleMat} />
                </group>
            )}
            {type === "gate" && (
                <group position={[0, size * 1.3, 0]}>
                    <Cyl args={[size * 0.12, size * 0.12, size * 0.7, 10]} material={bodyMat} />
                    <Cyl args={[size * 0.8, size * 0.8, size * 0.18, 20]} position={[0, size * 0.45, 0]} material={handleMat} />
                </group>
            )}
            {type === "globe" && (
                <group position={[0, size * 1.2, 0]}>
                    <Cyl args={[size * 0.1, size * 0.1, size * 0.5, 10]} material={bodyMat} />
                    <Cyl args={[size * 0.6, size * 0.6, size * 0.12, 16]} position={[0, size * 0.35, 0]} material={handleMat} />
                </group>
            )}
            {type === "check" && (
                <group position={[0, size * 0.55, 0]}>
                    <Bx args={[size * 0.85, size * 0.85, size * 0.45]} rotation={[0, 0, Math.PI / 4]} material={bodyMat} />
                </group>
            )}
            {type === "relief" && (
                <group position={[0, size * 1.2, 0]}>
                    <Cyl args={[size * 0.45, size * 0.65, size * 1.3, 16]} material={bodyMat} />
                    <Cyl args={[size * 0.35, size * 0.35, size * 1.1, 16]} position={[0, size * 0.55, size * 0.65]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.pipeDischarge} />
                </group>
            )}
        </group>
    );
};

// Valve 3D component (with flanges for non-ammonia systems)
const Valve3D = ({ position, type = "ball", size = 0.2, rotation = [0, 0, 0], isAmmonia = false }: any) => {
    // For ammonia systems, use welded valve instead
    if (isAmmonia) {
        return <AmmoniaValve position={position} type={type} size={size} rotation={rotation} />;
    }

    const bodyMat = new THREE.MeshStandardMaterial({ color: '#CCCCCC', metalness: 0.5, roughness: 0.3 });
    const handleMat = MATERIALS.valveHandle;

    return (
        <group position={position} rotation={rotation}>
            {/* Flanges at both ends - for HFC/CO2 systems */}
            <Flange radius={size} position={[0, 0, -size * 0.7]} rotation={[Math.PI / 2, 0, 0]} />
            <Flange radius={size} position={[0, 0, size * 0.7]} rotation={[Math.PI / 2, 0, 0]} />

            {/* Body */}
            <Cyl args={[size, size, size * 1.4, 16]} rotation={[Math.PI / 2, 0, 0]} material={bodyMat} />

            {/* Specialized Handles */}
            {type === "ball" && (
                <group position={[0, size * 1.1, 0]}>
                    <Bx args={[size * 0.2, size * 0.3, size * 0.2]} material={bodyMat} />
                    <Bx args={[size * 0.15, size * 0.1, size * 1.5]} position={[0, size * 0.2, -size * 0.5]} material={handleMat} />
                </group>
            )}
            {type === "gate" && (
                <group position={[0, size * 1.2, 0]}>
                    <Cyl args={[size * 0.1, size * 0.1, size * 0.6, 8]} material={bodyMat} />
                    <Cyl args={[size * 0.7, size * 0.7, size * 0.15, 16]} position={[0, size * 0.4, 0]} material={handleMat} />
                </group>
            )}
            {type === "check" && (
                <group position={[0, size * 0.5, 0]}>
                    <Bx args={[size * 0.8, size * 0.8, size * 0.4]} rotation={[0, 0, Math.PI / 4]} material={bodyMat} />
                </group>
            )}
            {type === "relief" && (
                <group position={[0, size * 1.1, 0]}>
                    <Cyl args={[size * 0.4, size * 0.6, size * 1.2, 16]} material={bodyMat} />
                    <Cyl args={[size * 0.3, size * 0.3, size, 16]} position={[0, size * 0.5, size * 0.6]} rotation={[Math.PI / 2, 0, 0]} material={MATERIALS.pipeDischarge} />
                </group>
            )}
        </group>
    );
};

// Cold Storage Room (separate insulated space)
const ColdStorageRoom = ({ width, depth, height }: any) => (
    <group>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <primitive object={MATERIALS.wall} attach="material" />
        </mesh>
        {/* Walls */}
        <Bx args={[width, height, 0.2]} position={[0, height / 2, -depth / 2]} material={MATERIALS.wall} />
        <Bx args={[width, height, 0.2]} position={[0, height / 2, depth / 2]} material={MATERIALS.wall} />
        <Bx args={[0.2, height, depth]} position={[-width / 2, height / 2, 0]} material={MATERIALS.wall} />
        <Bx args={[0.2, height, depth]} position={[width / 2, height / 2, 0]} material={MATERIALS.wall} />
        {/* Ceiling */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]} receiveShadow>
            <planeGeometry args={[width, depth]} />
            <primitive object={MATERIALS.wall} attach="material" />
        </mesh>
    </group>
);

// Condenser Platform (rooftop steel structure)
const CondenserPlatform = ({ width = 4, depth = 2, height = 0.3, position = [0, 0, 0] }: any) => (
    <group position={position}>
        {/* Main deck */}
        <Bx args={[width, height, depth]} material={MATERIALS.steelFrame} />
        {/* Support columns */}
        <Bx args={[0.15, 2, 0.15]} position={[-width / 2 + 0.2, 1, -depth / 2 + 0.2]} material={MATERIALS.steelFrame} />
        <Bx args={[0.15, 2, 0.15]} position={[width / 2 - 0.2, 1, -depth / 2 + 0.2]} material={MATERIALS.steelFrame} />
        <Bx args={[0.15, 2, 0.15]} position={[-width / 2 + 0.2, 1, depth / 2 - 0.2]} material={MATERIALS.steelFrame} />
        <Bx args={[0.15, 2, 0.15]} position={[width / 2 - 0.2, 1, depth / 2 - 0.2]} material={MATERIALS.steelFrame} />
    </group>
);

// Pipe 90° Elbow (Professional Industrial)
const PipeElbow90 = ({ position, radius = 0.05, type = "suction", rotation = [0, 0, 0] }: any) => {
    const mat = type === "discharge" ? MATERIALS.pipeDischarge : type === "liquid" ? MATERIALS.pipeLiquid : MATERIALS.pipeSuction;
    return (
        <group position={position} rotation={rotation}>
            {/* Torus for 90° bend */}
            <mesh>
                <torusGeometry args={[radius * 2, radius, 12, 16, Math.PI / 2]} />
                <primitive object={mat} attach="material" />
            </mesh>
            {/* Flanges at both ends */}
            <Flange radius={radius} position={[0, 0, -radius * 2]} rotation={[Math.PI / 2, 0, 0]} />
            <Flange radius={radius} position={[radius * 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
        </group>
    );
};

// Pipe 45° Elbow (Professional Industrial)
const PipeElbow45 = ({ position, radius = 0.05, type = "suction", rotation = [0, 0, 0] }: any) => {
    const mat = type === "discharge" ? MATERIALS.pipeDischarge : type === "liquid" ? MATERIALS.pipeLiquid : MATERIALS.pipeSuction;
    return (
        <group position={position} rotation={rotation}>
            {/* Torus for 45° bend */}
            <mesh>
                <torusGeometry args={[radius * 2.5, radius, 12, 12, Math.PI / 4]} />
                <primitive object={mat} attach="material" />
            </mesh>
            {/* Flanges at both ends */}
            <Flange radius={radius} position={[0, 0, -radius * 2.5]} rotation={[Math.PI / 2, 0, 0]} />
        </group>
    );
};

// Pipe Tee Junction (T-fitting for branch connections)
const PipeTee = ({ position, radius = 0.05, type = "suction", rotation = [0, 0, 0] }: any) => {
    const mat = type === "discharge" ? MATERIALS.pipeDischarge : type === "liquid" ? MATERIALS.pipeLiquid : MATERIALS.pipeSuction;
    const bodyLength = radius * 4;
    const branchLength = radius * 3;

    return (
        <group position={position} rotation={rotation}>
            {/* Main horizontal run */}
            <Cyl args={[radius, radius, bodyLength, 16]} rotation={[0, 0, Math.PI / 2]} material={mat} />
            {/* Branch (perpendicular) */}
            <Cyl args={[radius, radius, branchLength, 16]} position={[0, branchLength / 2, 0]} material={mat} />
            {/* Flanges */}
            <Flange radius={radius} position={[-bodyLength / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
            <Flange radius={radius} position={[bodyLength / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
            <Flange radius={radius} position={[0, branchLength, 0]} />
            {/* Reinforcement at junction */}
            <mesh position={[0, radius * 0.5, 0]}>
                <sphereGeometry args={[radius * 1.3, 12, 12]} />
                <primitive object={mat} attach="material" />
            </mesh>
        </group>
    );
};

// Pipe Support Hanger (ASHRAE 15 compliant - every 3m)
const PipeSupportHanger = ({ position, pipeRadius = 0.05, dropHeight = 0.3, rotation = [0, 0, 0] }: any) => {
    return (
        <group position={position} rotation={rotation}>
            {/* Vertical drop rod */}
            <Cyl args={[0.015, 0.015, dropHeight, 8]} position={[0, dropHeight / 2, 0]} material={MATERIALS.steelFrame} />
            {/* Clevis (U-bolt holder) */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[pipeRadius * 1.3, 0.015, 8, 16, Math.PI]} />
                <primitive object={MATERIALS.steelFrame} attach="material" />
            </mesh>
            {/* Mounting plate (top) */}
            <Bx args={[0.08, 0.015, 0.04]} position={[0, dropHeight, 0]} material={MATERIALS.steelFrame} />
            {/* Rubber insulator */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[pipeRadius * 1.1, 0.01, 8, 16, Math.PI]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
        </group>
    );
};

// Pipe Header (Manifold with branch connections)
const PipeHeader = ({ position, length = 4, diameter = 0.3, type = "suction", branches = 4 }: any) => {
    const mat = type === "discharge" ? MATERIALS.pipeDischarge : type === "liquid" ? MATERIALS.pipeLiquid : MATERIALS.pipeSuction;
    const branchSpacing = length / (branches + 1);

    return (
        <group position={position}>
            {/* Main horizontal pipe */}
            <Cyl args={[diameter / 2, diameter / 2, length, 32]} rotation={[0, 0, Math.PI / 2]} material={mat} />
            {/* End caps */}
            <Flange radius={diameter / 2} position={[-length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />
            <Flange radius={diameter / 2} position={[length / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} />

            {/* Branch connections */}
            {[...Array(branches)].map((_, i) => (
                <group key={i} position={[-length / 2 + branchSpacing * (i + 1), -diameter / 2 - 0.08, 0]}>
                    {/* Branch stub */}
                    <Cyl args={[diameter / 4, diameter / 4, 0.15, 16]} material={mat} />
                    {/* Branch flange */}
                    <Flange radius={diameter / 4} position={[0, -0.08, 0]} rotation={[Math.PI, 0, 0]} />
                </group>
            ))}

            {/* Support hangers */}
            <PipeSupportHanger position={[-length / 3, diameter / 2, 0]} pipeRadius={diameter / 2} dropHeight={0.4} />
            <PipeSupportHanger position={[length / 3, diameter / 2, 0]} pipeRadius={diameter / 2} dropHeight={0.4} />
        </group>
    );
};


// Standard Pipe Router – INDUSTRIAL GRADE with straight segments and CORRECT 90° elbows
const StandardPipeRouter = ({ start, end, type = "suction", radius = 0.05 }: any) => {
    const mat = type === 'discharge' ? MATERIALS.pipeDischarge : type === 'liquid' ? MATERIALS.pipeLiquid : MATERIALS.pipeSuction;
    const elbowRadius = radius * 3; // Elbow bend radius

    // Calculate orthogonal path segments (X → Z → Y routing for industrial look)
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const dz = end[2] - start[2];

    // Build path points
    const points: THREE.Vector3[] = [new THREE.Vector3(start[0], start[1], start[2])];

    // Add intermediate waypoints for orthogonal routing
    let current = new THREE.Vector3(start[0], start[1], start[2]);

    // Step 1: Move along X-axis
    if (Math.abs(dx) > elbowRadius * 2) {
        current = new THREE.Vector3(end[0], start[1], start[2]);
        points.push(current.clone());
    }

    // Step 2: Move along Z-axis
    if (Math.abs(dz) > elbowRadius * 2) {
        current = new THREE.Vector3(current.x, start[1], end[2]);
        points.push(current.clone());
    }

    // Step 3: Move along Y-axis (vertical)
    if (Math.abs(dy) > elbowRadius * 2) {
        current = new THREE.Vector3(current.x, end[1], current.z);
        points.push(current.clone());
    }

    // Ensure we end at the target
    if (!current.equals(new THREE.Vector3(end[0], end[1], end[2]))) {
        points.push(new THREE.Vector3(end[0], end[1], end[2]));
    }

    // Add P-trap for suction risers (IIAR-2 compliance)
    const hasPTrap = type === 'suction' && dy > 1;

    // Render pipe segments and elbows
    const pipeElements: JSX.Element[] = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const segDx = p2.x - p1.x;
        const segDy = p2.y - p1.y;
        const segDz = p2.z - p1.z;
        const length = Math.sqrt(segDx * segDx + segDy * segDy + segDz * segDz);

        if (length < 0.01) continue;

        // Calculate midpoint
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const midZ = (p1.z + p2.z) / 2;

        // Determine axis and rotation
        let rotation: [number, number, number] = [0, 0, 0];
        if (Math.abs(segDx) > Math.abs(segDy) && Math.abs(segDx) > Math.abs(segDz)) {
            rotation = [0, 0, Math.PI / 2]; // X-axis
        } else if (Math.abs(segDz) > Math.abs(segDy)) {
            rotation = [Math.PI / 2, 0, 0]; // Z-axis
        }
        // Y-axis is default [0,0,0]

        // Add straight pipe segment
        pipeElements.push(
            <Cyl key={`seg-${i}`}
                args={[radius, radius, length, 16]}
                position={[midX, midY, midZ]}
                rotation={rotation}
                material={mat} />
        );

        // Add elbow at junction (if not last segment)
        if (i < points.length - 2) {
            const p3 = points[i + 2];
            const dir1 = new THREE.Vector3(segDx, segDy, segDz).normalize();
            const dir2 = new THREE.Vector3(p3.x - p2.x, p3.y - p2.y, p3.z - p2.z).normalize();

            // Calculate elbow rotation based on direction change
            let elbowRot: [number, number, number] = [0, 0, 0];

            // Determine the plane of the bend
            if (Math.abs(dir1.x) > 0.5 && Math.abs(dir2.z) > 0.5) {
                // X to Z bend (horizontal turn)
                elbowRot = [Math.PI / 2, 0, dir2.z > 0 ? 0 : Math.PI];
                if (dir1.x < 0) elbowRot[2] += Math.PI;
            } else if (Math.abs(dir1.z) > 0.5 && Math.abs(dir2.y) > 0.5) {
                // Z to Y bend (vertical rise from Z)
                elbowRot = [0, 0, dir2.y > 0 ? -Math.PI / 2 : Math.PI / 2];
            } else if (Math.abs(dir1.x) > 0.5 && Math.abs(dir2.y) > 0.5) {
                // X to Y bend (vertical rise from X)
                elbowRot = [0, Math.PI / 2, dir2.y > 0 ? -Math.PI / 2 : Math.PI / 2];
            } else if (Math.abs(dir1.y) > 0.5 && Math.abs(dir2.x) > 0.5) {
                // Y to X bend
                elbowRot = [0, Math.PI / 2, dir1.y > 0 ? Math.PI / 2 : -Math.PI / 2];
            } else if (Math.abs(dir1.y) > 0.5 && Math.abs(dir2.z) > 0.5) {
                // Y to Z bend
                elbowRot = [0, 0, dir1.y > 0 ? Math.PI / 2 : -Math.PI / 2];
            }

            pipeElements.push(
                <mesh key={`elbow-${i}`} position={[p2.x, p2.y, p2.z]} rotation={elbowRot}>
                    <torusGeometry args={[elbowRadius, radius, 12, 16, Math.PI / 2]} />
                    <primitive object={mat} attach="material" />
                </mesh>
            );
        }
    }

    return (
        <group>
            {pipeElements}

            {/* P-Trap for suction risers */}
            {hasPTrap && (
                <group position={[start[0], start[1] - 0.2, start[2]]} rotation={[Math.PI / 2, 0, 0]}>
                    <mesh>
                        <torusGeometry args={[0.2, radius, 12, 16, Math.PI]} />
                        <primitive object={mat} attach="material" />
                    </mesh>
                </group>
            )}

            {/* Start and End flanges */}
            <Flange radius={radius} position={start} />
            <Flange radius={radius} position={end} />
        </group>
    );
};


export default Refrigeration3DCanvas;

