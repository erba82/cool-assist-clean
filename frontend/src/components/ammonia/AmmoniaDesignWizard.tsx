// src/components/ammonia/AmmoniaDesignWizard.tsx
// The UI Orchestrator for Ammonia Refrigeration Design

import React, { useState } from 'react';
import {
    Box, Paper, Typography, Stepper, Step, StepLabel,
    Button, Grid, Card, CardContent, Alert, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Divider, CircularProgress
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import DevicesIcon from '@mui/icons-material/Devices';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import DescriptionIcon from '@mui/icons-material/Description';
import PIDDrawingEngine from '../PIDDrawingEngine';

// Import our modular components
import { RefrigerationEngine, LoadCalculation, Room } from './EngineeringCore';
import { EquipmentSelector, EquipmentSelection } from './EquipmentSelector';
import { PIDGenerator, PnIDDiagram } from './PIDGenerator';

// ==============================================
// DATA INTERFACES
// ==============================================

interface ProjectData {
    info: {
        name: string;
        location: string;
        elevation: number;
    };
    loadCalculation: LoadCalculation;
    equipmentSelection: EquipmentSelection;
    pidDiagram: PnIDDiagram;
}

// Common interface for electrical equipment (motors)
interface MotorEquipment {
    id?: string;
    tag: string;
    manufacturer?: string;
    power: number;
    amps: number;
    cable: string;
    breaker: number;
}

// ==============================================
// MAIN COMPONENT
// ==============================================

const phases = [
    { id: 'data', label: 'Project Data', icon: <CalculateIcon /> },
    { id: 'load', label: 'Load Calculation', icon: <CalculateIcon /> },
    { id: 'equip', label: 'Equipment', icon: <DevicesIcon /> },
    { id: 'pid', label: 'P&ID', icon: <AccountTreeIcon /> },
    { id: 'wiring', label: 'Wiring', icon: <ElectricalServicesIcon /> },
    { id: 'report', label: 'Report', icon: <DescriptionIcon /> }
];

const AmmoniaDesignWizard: React.FC<{ chatId?: string }> = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [project, setProject] = useState<ProjectData | null>(null);
    const [loading, setLoading] = useState(false);

    const loadDemo = async () => {
        console.log('📥 Loading Ardabil Slaughterhouse Demo...');
        setLoading(true);
        
        try {
            // Simulate async processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Step 1: Calculate loads using EngineeringCore
            const loadCalculation = RefrigerationEngine.buildArdabilScenario();
            
            // Step 2: Select equipment using EquipmentSelector
            const equipmentSelection = EquipmentSelector.selectEquipment(loadCalculation);
            
            // Step 3: Generate P&ID using PIDGenerator
            const pidDiagram = PIDGenerator.generateDiagram(loadCalculation, equipmentSelection);
            
            // Create project data
            const projectData: ProjectData = {
                info: {
                    name: 'Ardabil Poultry Slaughterhouse',
                    location: 'Ardabil, Iran',
                    elevation: 1350
                },
                loadCalculation,
                equipmentSelection,
                pidDiagram
            };
            
            setProject(projectData);
            setActiveStep(1); // Move to Load Calculation tab
            console.log('✅ Project loaded:', projectData);
        } catch (error) {
            console.error('❌ Error loading demo:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStepChange = (newStep: number) => {
        if (project) {
            setActiveStep(newStep);
        } else {
            console.warn('⚠️ Cannot change step - no project loaded');
        }
    };

    return (
        <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box p={2} borderBottom="1px solid #eee" display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                    {project ? project.info.name : 'Ammonia System Design'}
                </Typography>
                {!project && (
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={loadDemo}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        {loading ? 'Loading Demo...' : 'Load Demo'}
                    </Button>
                )}
            </Box>

            {project && (
                <>
                    <Box p={2} borderBottom="1px solid #eee">
                        <Stepper activeStep={activeStep} alternativeLabel nonLinear>
                            {phases.map((phase, index) => (
                                <Step key={phase.id}>
                                    <StepLabel 
                                        icon={phase.icon}
                                        onClick={() => handleStepChange(index)}
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        {phase.label}
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>

                    <Box flexGrow={1} p={2} overflow="auto" bgcolor="#f5f5f5">
                        {activeStep === 0 && <DataView project={project} />}
                        {activeStep === 1 && <LoadView project={project} />}
                        {activeStep === 2 && <EquipmentView project={project} />}
                        {activeStep === 3 && <PIDView project={project} />}
                        {activeStep === 4 && <WiringView project={project} />}
                        {activeStep === 5 && <ReportView project={project} />}
                    </Box>
                </>
            )}

            {!project && (
                <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center">
                    <Typography variant="h6" color="textSecondary">
                        Click "Load Demo" to simulate Ardabil Slaughterhouse
                    </Typography>
                </Box>
            )}
        </Paper>
    );
};

// ==============================================
// VIEW COMPONENTS
// ==============================================

const DataView: React.FC<{ project: ProjectData }> = ({ project }) => (
    <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Project Information</strong>
        </Alert>
        
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>Project Details</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableBody>
                            <TableRow>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell>{project.info.name}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Location</strong></TableCell>
                                <TableCell>{project.info.location}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><strong>Elevation</strong></TableCell>
                                <TableCell>{project.info.elevation}m ASL</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    </Box>
);

const LoadView: React.FC<{ project: ProjectData }> = ({ project }) => (
    <Box>
        <Alert severity="success" sx={{ mb: 2 }}>
            <strong>Load Summary</strong> | 
            Low Stage: {project.loadCalculation.lowStageLoad.toFixed(1)} kW | 
            High Stage: {project.loadCalculation.highStageLoad.toFixed(1)} kW | 
            THR: {project.loadCalculation.totalHeatRejection.toFixed(1)} kW
        </Alert>

        <TableContainer component={Paper}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: '#1976d2' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Room</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Temperature (°C)</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Type</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Load (kW)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {project.loadCalculation.rooms.map((room) => (
                        <TableRow key={room.id} sx={{ bgcolor: room.type === 'blast' ? '#fff3e0' : 'white' }}>
                            <TableCell><strong>{room.name}</strong></TableCell>
                            <TableCell>
                                <Chip 
                                    label={room.temperature} 
                                    size="small" 
                                    color={room.temperature === -40 ? 'warning' : room.temperature === -18 ? 'info' : 'default'}
                                />
                            </TableCell>
                            <TableCell>{room.type}</TableCell>
                            <TableCell align="right"><strong>{room.totalLoad.toFixed(1)}</strong></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

const EquipmentView: React.FC<{ project: ProjectData }> = ({ project }) => (
    <Grid container spacing={2}>
        <Grid item xs={12}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom color="warning.main">
                        ⚡ Booster Stage Compressors (-40°C)
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tag</TableCell>
                                    <TableCell>Manufacturer</TableCell>
                                    <TableCell>Model</TableCell>
                                    <TableCell align="right">Capacity (kW)</TableCell>
                                    <TableCell align="right">Power (kW)</TableCell>
                                    <TableCell align="right">Price ($)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {project.equipmentSelection.boosterCompressors.map((comp) => (
                                    <TableRow key={comp.id}>
                                        <TableCell><Chip label={comp.tag} size="small" color="warning" /></TableCell>
                                        <TableCell>{comp.manufacturer}</TableCell>
                                        <TableCell>{comp.model}</TableCell>
                                        <TableCell align="right">{comp.capacity.toFixed(1)}</TableCell>
                                        <TableCell align="right">{comp.power.toFixed(1)}</TableCell>
                                        <TableCell align="right">{comp.price.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={12}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                        🔵 High Stage Compressors
                    </Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Tag</TableCell>
                                    <TableCell>Manufacturer</TableCell>
                                    <TableCell>Model</TableCell>
                                    <TableCell align="right">Capacity (kW)</TableCell>
                                    <TableCell align="right">Power (kW)</TableCell>
                                    <TableCell align="right">Price ($)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {project.equipmentSelection.highStageCompressors.map((comp) => (
                                    <TableRow key={comp.id}>
                                        <TableCell><Chip label={comp.tag} size="small" color="primary" /></TableCell>
                                        <TableCell>{comp.manufacturer}</TableCell>
                                        <TableCell>{comp.model}</TableCell>
                                        <TableCell align="right">{comp.capacity.toFixed(1)}</TableCell>
                                        <TableCell align="right">{comp.power.toFixed(1)}</TableCell>
                                        <TableCell align="right">{comp.price.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Vessels</Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableBody>
                                {project.equipmentSelection.vessels.map((vessel) => (
                                    <TableRow key={vessel.id}>
                                        <TableCell><Chip label={vessel.tag} size="small" /></TableCell>
                                        <TableCell>{vessel.model}</TableCell>
                                        <TableCell align="right">${vessel.price.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Condenser</Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell><Chip label={project.equipmentSelection.condenser.tag} size="small" color="success" /></TableCell>
                                    <TableCell>{project.equipmentSelection.condenser.manufacturer} {project.equipmentSelection.condenser.model}</TableCell>
                                    <TableCell align="right">${project.equipmentSelection.condenser.price.toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Grid>

        <Grid item xs={12}>
            <Alert severity="info">
                <strong>Total Equipment Cost:</strong> ${project.equipmentSelection.totalPrice.toLocaleString()}
            </Alert>
        </Grid>
    </Grid>
);

const PIDView: React.FC<{ project: ProjectData }> = ({ project }) => {
    return (
        <Box height="100%" display="flex" flexDirection="column">
            <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                    P&ID Diagram - Two-Stage Booster Topology
                </Typography>
                <Typography variant="caption">
                    {project.loadCalculation.rooms.length} Evaporators | 
                    {project.equipmentSelection.boosterCompressors.length + project.equipmentSelection.highStageCompressors.length} Compressors
                </Typography>
            </Box>

            <Box flexGrow={1}>
                <PIDDrawingEngine 
                    nodes={project.pidDiagram.nodes} 
                    edges={project.pidDiagram.edges} 
                />
            </Box>
        </Box>
    );
};

const WiringView: React.FC<{ project: ProjectData }> = ({ project }) => {
    // Create a unified array of motor equipment with proper typing
    const allMotors: MotorEquipment[] = [
        ...project.equipmentSelection.boosterCompressors.map(comp => ({
            id: comp.id,
            tag: comp.tag,
            manufacturer: comp.manufacturer,
            power: comp.power,
            amps: comp.amps,
            cable: comp.cable,
            breaker: comp.breaker
        })),
        ...project.equipmentSelection.highStageCompressors.map(comp => ({
            id: comp.id,
            tag: comp.tag,
            manufacturer: comp.manufacturer,
            power: comp.power,
            amps: comp.amps,
            cable: comp.cable,
            breaker: comp.breaker
        })),
        {
            id: project.equipmentSelection.condenser.id,
            tag: project.equipmentSelection.condenser.tag,
            manufacturer: project.equipmentSelection.condenser.manufacturer,
            power: project.equipmentSelection.condenser.power,
            amps: project.equipmentSelection.condenser.amps,
            cable: project.equipmentSelection.condenser.cable,
            breaker: project.equipmentSelection.condenser.breaker
        }
    ];

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow sx={{ bgcolor: '#2e7d32' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Motor Tag</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Manufacturer</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Power (kW)</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Rated Current (A)</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cable Size</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Breaker (A)</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {allMotors.map((motor, index) => (
                        <TableRow key={`${motor.id || motor.tag}-${index}`}>
                            <TableCell><Chip label={motor.tag} size="small" color="success" /></TableCell>
                            <TableCell>{motor.manufacturer || ''}</TableCell>
                            <TableCell align="right">{motor.power.toFixed(1)}</TableCell>
                            <TableCell align="right">{motor.amps.toFixed(1)}</TableCell>
                            <TableCell><strong>{motor.cable}</strong></TableCell>
                            <TableCell align="right"><strong>{motor.breaker}</strong></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

const ReportView: React.FC<{ project: ProjectData }> = ({ project }) => (
    <Paper sx={{ p: 3 }}>
        <Typography variant="h5" align="center" gutterBottom>
            REFRIGERATION SYSTEM DESIGN CALCULATION
        </Typography>
        <Typography align="center" color="textSecondary" gutterBottom>
            {project.info.name} | Elevation: {project.info.elevation}m
        </Typography>
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>1. Project Information</Typography>
        <Typography variant="body2" paragraph>
            • Location: {project.info.location}<br />
            • Elevation: {project.info.elevation}m ASL<br />
            • Refrigerant: R717 (Ammonia)<br />
            • System Type: Two-Stage Booster
        </Typography>
        
        <Typography variant="h6" gutterBottom>2. Load Summary</Typography>
        <Typography variant="body2" paragraph>
            • Low Stage Load (Blast Freezers @ -40°C): {project.loadCalculation.lowStageLoad.toFixed(1)} kW<br />
            • High Stage Load (Cold Stores & Chilling): {project.loadCalculation.highStageLoad.toFixed(1)} kW<br />
            • Total Evaporator Load: {(project.loadCalculation.lowStageLoad + project.loadCalculation.highStageLoad).toFixed(1)} kW<br />
            • Total Heat Rejection: {project.loadCalculation.totalHeatRejection.toFixed(1)} kW
        </Typography>
        
        <Typography variant="h6" gutterBottom>3. Equipment Selection</Typography>
        <Typography variant="body2" paragraph>
            <strong>Booster Compressors:</strong><br />
            {project.equipmentSelection.boosterCompressors.map(comp => 
                `• ${comp.tag}: ${comp.manufacturer} ${comp.model} - ${comp.capacity.toFixed(0)}kW / ${comp.power.toFixed(0)}kW ($${comp.price.toLocaleString()})`
            ).join('<br />')}
        </Typography>
        <Typography variant="body2" paragraph>
            <strong>High Stage Compressors:</strong><br />
            {project.equipmentSelection.highStageCompressors.map(comp => 
                `• ${comp.tag}: ${comp.manufacturer} ${comp.model} - ${comp.capacity.toFixed(0)}kW / ${comp.power.toFixed(0)}kW ($${comp.price.toLocaleString()})`
            ).join('<br />')}
        </Typography>
        <Typography variant="body2">
            <strong>Condenser:</strong><br />
            • {project.equipmentSelection.condenser.tag}: {project.equipmentSelection.condenser.manufacturer} {project.equipmentSelection.condenser.model} - {project.equipmentSelection.condenser.capacity.toFixed(0)}kW ($${project.equipmentSelection.condenser.price.toLocaleString()})
        </Typography>
        
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>4. Total Project Cost</Typography>
        <Typography variant="body2">
            <strong>Equipment Cost:</strong> ${project.equipmentSelection.totalPrice.toLocaleString()}
        </Typography>
    </Paper>
);

export default AmmoniaDesignWizard;