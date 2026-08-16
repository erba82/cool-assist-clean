/**
 * Unified AI Chat Interface
 * All design results displayed inline within chat flow
 * No separate wizard panel - everything in one place
 */

import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import {
    Box, TextField, IconButton, Paper, Typography,
    CircularProgress, Avatar, Card, CardContent,
    Accordion, AccordionSummary, AccordionDetails,
    Table, TableBody, TableCell, TableHead, TableRow,
    Tabs, Tab, Button, Chip, Divider, Alert, Grid, useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ChatIcon from '@mui/icons-material/Chat';
import CalculateIcon from '@mui/icons-material/Calculate';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedIcon from '@mui/icons-material/Verified';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import axios from 'axios';
import ProfessionalPIDCanvas from './ProfessionalPIDCanvas';
import CalculationBook from './CalculationBook';

const ComplianceSection = ({ compliance, refrigerant }: { compliance?: any; refrigerant?: string }) => {
  const declared = Array.isArray(compliance?.checks) ? compliance.checks : (Array.isArray(compliance?.standards) ? compliance.standards : []);
  const isAmmonia = /717|ammonia|nh3/i.test(String(refrigerant || ''));
  const checks = declared.length ? declared : [
    { standard: 'ASHRAE 15 / 34', status: 'REVIEW REQUIRED', note: 'No machine-verifiable ASHRAE review record was returned by the active design calculation.' },
    { standard: 'ASME BPVC VIII / B31.5', status: 'REVIEW REQUIRED', note: 'Pressure-vessel and piping ratings must be verified against the generated equipment and line register.' },
    ...(isAmmonia ? [{ standard: 'IIAR 2 / IIAR 9', status: 'REVIEW REQUIRED', note: 'Ammonia safety review applies to R717 systems and has not been automatically approved.' }] : [])
  ];
  const hasFailure = checks.some((check: any) => /fail|non.?compliant|action/i.test(String(check.status || '')));
  const allPassed = declared.length > 0 && checks.every((check: any) => /pass|approved|compliant/i.test(String(check.status || '')));
  const overallStatus = compliance?.overallStatus || (hasFailure ? 'ACTION REQUIRED' : allPassed ? 'REVIEWED' : 'REVIEW REQUIRED');
  const chipColor: 'success' | 'warning' | 'error' = hasFailure ? 'error' : allPassed ? 'success' : 'warning';
  return <Box p={2}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}><Typography variant="h6" color="primary">Industrial Compliance Review</Typography><Chip label={overallStatus} color={chipColor} size="small" /></Box>
    <Alert severity={allPassed ? 'success' : 'warning'} sx={{ mb: 2 }}>{allPassed ? 'Only the checks returned by the active design are displayed as reviewed.' : 'This page does not imply compliance. Complete the listed engineering reviews before issue for construction.'}</Alert>
    <Table size="small"><TableHead><TableRow><TableCell><b>Standard</b></TableCell><TableCell><b>Status</b></TableCell><TableCell><b>Review Note</b></TableCell></TableRow></TableHead><TableBody>{checks.map((check: any, index: number) => { const status = check.status || 'REVIEW REQUIRED'; const color: 'success' | 'warning' | 'error' = /fail|non.?compliant|action/i.test(status) ? 'error' : /pass|approved|compliant/i.test(status) ? 'success' : 'warning'; return <TableRow key={check.standard || check.code || index}><TableCell>{check.standard || check.code || 'Standard'}</TableCell><TableCell><Chip label={status} color={color} variant="outlined" size="small" /></TableCell><TableCell>{check.note || check.details || 'No review narrative was returned by the calculation engine.'}</TableCell></TableRow>; })}</TableBody></Table>
  </Box>;
};
// Lazy load 3D component to prevent react-three-fiber from crashing on initial load
const Refrigeration3DCanvasV2 = lazy(() => import('./3D/Refrigeration3DCanvasV2')); const Refrigeration3DCanvas = lazy(() => import('./3D/Refrigeration3DCanvas')); const TopologyIndustrialCanvas = lazy(() => import('./3D/TopologyIndustrialCanvas'));
import { AnnualEnergyChart, EnergySankeyDiagram, StrategySelection } from './EnergyVisualization';
import InformationGatheringPanel from './InformationGatheringPanel';
import { ToolsPanel, CalculatorWidget, UnitConverterWidget, RefrigerantPropsWidget } from './FloatingTools';
import { useParams } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';

// ============================================================
// INLINE DESIGN RESULT COMPONENTS
// ============================================================

// Utility function to calculate equipment cost (Best Value tier = factor 1.0)
const calculateEquipmentCost = (equipment: any): number => {
    if (!equipment) return 0;

    let total = 0;
    const priceFactor = 1.0; // Best Value tier

    // Compressors
    equipment.compressors?.forEach((c: any) => {
        const cap = c.capacityPerUnit || c.capacity || c.designLoad || 100;
        const basePrice = 15000 + (cap * 120);
        const qty = (c.operatingUnits || c.units || 1) + (c.standbyUnits || 0);
        total += Math.round(basePrice * priceFactor) * qty;
    });

    // Condensers
    equipment.condensers?.forEach((c: any) => {
        const cap = c.heatRejection || c.totalCapacity || c.capacity || 500;
        const basePrice = 25000 + (cap * 50);
        total += Math.round(basePrice * priceFactor) * (c.count || 1);
    });

    // Evaporators
    equipment.evaporators?.forEach((e: any) => {
        const cap = e.capacityPerUnit || e.capacity || 50;
        const basePrice = 3000 + (cap * 85);
        total += Math.round(basePrice * priceFactor) * (e.count || 1);
    });

    // Separators
    equipment.separators?.forEach((s: any) => {
        const vol = s.volume || 500;
        const basePrice = 8000 + (vol * 8);
        total += Math.round(basePrice * priceFactor);
    });

    // Receiver
    if (equipment.receiver) {
        const vol = equipment.receiver.volume || 500;
        const basePrice = 12000 + (vol * 6);
        total += Math.round(basePrice * priceFactor);
    }

    // Thermosiphon
    if (equipment.thermosiphon) {
        total += Math.round(8000 * priceFactor);
    }

    // Oil Separators
    equipment.oilSeparators?.forEach(() => {
        total += Math.round(12000 * priceFactor);
    });

    // Pumps
    equipment.separators?.filter((s: any) => s.pumps).forEach((s: any) => {
        const power = s.pumps?.power || 3;
        const basePrice = 5000 + (power * 1500);
        total += Math.round(basePrice * priceFactor);
    });

    return total;
};


// Project Summary Card
const ProjectSummaryCard = ({ data }: { data: any }) => {
    if (!data) return null;

    const safeString = (val: any): string => {
        if (!val) return 'N/A';
        if (typeof val === 'string') return val;
        if (typeof val === 'object') {
            if (val.city && val.country) return `${val.city}, ${val.country}`;
            if (val.city) return val.city;
            return JSON.stringify(val);
        }
        return String(val);
    };

    return (
        <Card sx={{ bgcolor: '#e3f2fd', mb: 2 }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <AcUnitIcon color="primary" />
                    <Typography variant="h6" color="primary">
                        {data.project?.name || 'Design Result'}
                    </Typography>
                </Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Location</Typography>
                        <Typography variant="body2">{safeString(data.project?.location)}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Refrigerant</Typography>
                        <Typography variant="body2">{data.project?.refrigerant || 'R717'}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Total Cooling Load</Typography>
                        <Typography variant="h6" color="primary">
                            {Math.round(data.summary?.totalCoolingLoad || 0)} kW
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="caption" color="textSecondary">Estimated Cost</Typography>
                        <Typography variant="h6" color="success.main">
                            ${calculateEquipmentCost(data.equipment).toLocaleString()}
                        </Typography>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

// Expandable Loads Section
const LoadsSection = ({ loads }: { loads: any[] }) => {
    if (!loads || loads.length === 0) return null;

    return (
        <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                    <AcUnitIcon color="info" />
                    <Typography fontWeight="bold">Load Calculation ({loads.length} rooms)</Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Room</TableCell>
                            <TableCell align="right">Temp (°C)</TableCell>
                            <TableCell align="right">Load (kW)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loads.map((l: any, i: number) => (
                            <TableRow key={i}>
                                <TableCell>{l.room || l.roomName || `Room ${i + 1}`}</TableCell>
                                <TableCell align="right">{l.temperature || '-18'}</TableCell>
                                <TableCell align="right">{(l.load || 0).toFixed(1)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </AccordionDetails>
        </Accordion>
    );
};

// Equipment Section with 3 Pricing Tiers (Economic/Best Value/Premium)
const EquipmentSection = ({ equipment }: { equipment: any }) => {
    const [pricingTier, setPricingTier] = React.useState(1); // 0=Economic, 1=Best Value, 2=Premium

    if (!equipment) return null;

    // Define pricing tiers
    const tiers = [
        { name: 'Economic', factor: 0.75, color: '#e8f5e9', brands: { comp: 'Bitzer', cond: 'BAC', evap: 'Güntner', vessel: 'Fabricated', pump: 'Hermetic' } },
        { name: 'Best Value', factor: 1.0, color: '#e3f2fd', brands: { comp: 'GEA', cond: 'Evapco', evap: 'Lu-Ve', vessel: 'Alfa Laval', pump: 'Grundfos' } },
        { name: 'Premium', factor: 1.35, color: '#fff3e0', brands: { comp: 'Mycom', cond: 'Baltimore', evap: 'Alfa Laval', vessel: 'Frick', pump: 'Witt' } }
    ];

    const currentTier = tiers[pricingTier];

    // Helper to get price for an item based on current tier
    const getPrice = (basePrice: number) => Math.round(basePrice * currentTier.factor);

    // Calculate total cost for current tier
    const calculateTotal = () => {
        let total = 0;

        // Compressors
        equipment.compressors?.forEach((c: any) => {
            const cap = c.capacityPerUnit || 100;
            const basePrice = 15000 + (cap * 120);
            const qty = (c.operatingUnits || 1) + (c.standbyUnits || 0);
            total += getPrice(basePrice) * qty;
        });

        // Condensers
        equipment.condensers?.forEach((c: any) => {
            const cap = c.heatRejection || c.totalCapacity || 500;
            const basePrice = 25000 + (cap * 50);
            total += getPrice(basePrice) * (c.count || 1);
        });

        // Evaporators
        equipment.evaporators?.forEach((e: any) => {
            const cap = e.capacityPerUnit || e.capacity || 50;
            const basePrice = 3000 + (cap * 85);
            total += getPrice(basePrice) * (e.count || 1);
        });

        // Separators
        equipment.separators?.forEach((s: any) => {
            const vol = s.volume || 500;
            const basePrice = 8000 + (vol * 8);
            total += getPrice(basePrice);
        });

        // Receiver
        if (equipment.receiver) {
            const vol = equipment.receiver.volume || 500;
            const basePrice = 12000 + (vol * 6);
            total += getPrice(basePrice);
        }

        // Thermosiphon
        if (equipment.thermosiphon) {
            total += getPrice(8000);
        }

        // Oil Separators
        equipment.oilSeparators?.forEach(() => {
            total += getPrice(12000);
        });

        // Pumps
        equipment.separators?.filter((s: any) => s.pumps).forEach((s: any) => {
            const power = s.pumps.power || 3;
            const basePrice = 5000 + (power * 1500);
            total += getPrice(basePrice);
        });

        return total;
    };

    const renderTable = (title: string, items: any[], columns: any[]) => (
        <Box mb={3}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ borderLeft: '3px solid #1976d2', pl: 1 }}>
                {title}
            </Typography>
            <Paper variant="outlined">
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            {columns.map((col, i) => (
                                <TableCell key={i}><b>{col.header}</b></TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, i) => (
                            <TableRow key={i} hover>
                                {columns.map((col, j) => (
                                    <TableCell key={j}>
                                        {col.render ? col.render(item) : item[col.field]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );

    return (
        <Box p={2}>
            {/* Pricing Tier Tabs */}
            <Tabs
                value={pricingTier}
                onChange={(_, v) => setPricingTier(v)}
                variant="fullWidth"
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
            >
                {tiers.map((tier, i) => (
                    <Tab
                        key={i}
                        label={tier.name}
                        sx={{
                            bgcolor: pricingTier === i ? tier.color : 'transparent',
                            fontWeight: pricingTier === i ? 'bold' : 'normal'
                        }}
                    />
                ))}
            </Tabs>

            {/* Brand Info Alert */}
            <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                    <b>Brands for this tier:</b> Compressor: {currentTier.brands.comp} | Condenser: {currentTier.brands.cond} | Evaporator: {currentTier.brands.evap}
                </Typography>
            </Alert>

            {/* Compressors */}
            {equipment.compressors?.length > 0 && renderTable('Compressors', equipment.compressors, [
                { header: 'Tag', field: 'tag' },
                { header: 'Brand', render: () => currentTier.brands.comp },
                { header: 'Model', render: (i: any) => i.fullModel || i.model },
                { header: 'Qty', render: (i: any) => `${i.operatingUnits ?? 1}+${i.standbyUnits ?? 0}` },
                { header: 'Capacity (kW)', field: 'capacityPerUnit' },
                { header: 'COP', render: (i: any) => i.cop?.toFixed(2) || '~3.5' },
                { header: 'Power (kW)', render: (i: any) => i.electrical?.ratedPower || i.motorPower || '-' },
                {
                    header: 'Price ($)', render: (i: any) => {
                        const cap = i.capacityPerUnit || 100;
                        const base = 15000 + (cap * 120);
                        const qty = (i.operatingUnits || 1) + (i.standbyUnits || 0);
                        return `$${getPrice(base).toLocaleString()} × ${qty} = $${(getPrice(base) * qty).toLocaleString()}`;
                    }
                }
            ])}

            {/* Condensers */}
            {equipment.condensers?.length > 0 && renderTable('Condensers', equipment.condensers, [
                { header: 'Type', field: 'type' },
                { header: 'Brand', render: () => currentTier.brands.cond },
                { header: 'Model', field: 'model' },
                { header: 'Qty', field: 'count' },
                { header: 'Rejection (kW)', field: 'heatRejection' },
                { header: 'Fans', render: (i: any) => `${i.fanCount || '-'} × ${((i.fanPowerPerUnit || 0) / (i.fanCount || 1)).toFixed(1)} kW` },
                {
                    header: 'Price ($)', render: (i: any) => {
                        const cap = i.heatRejection || i.totalCapacity || 500;
                        const base = 25000 + (cap * 50);
                        const qty = i.count || 1;
                        return `$${getPrice(base).toLocaleString()} × ${qty} = $${(getPrice(base) * qty).toLocaleString()}`;
                    }
                }
            ])}

            {/* Evaporators */}
            {equipment.evaporators?.length > 0 && renderTable('Evaporators', equipment.evaporators, [
                { header: 'Room', render: (i: any) => i.roomName || i.tag?.replace('EVAP-', '') || '-' },
                { header: 'Brand', render: () => currentTier.brands.evap },
                { header: 'Model', field: 'model' },
                { header: 'Qty', render: (i: any) => i.count || 1 },
                { header: 'Capacity (kW)', render: (i: any) => (i.capacityPerUnit ?? i.capacity)?.toFixed(1) || '-' },
                { header: 'Fans', render: (i: any) => i.fanCount ? `${i.fanCount} × Ø${i.fanDiameter || 630}mm` : '-' },
                {
                    header: 'Price ($)', render: (i: any) => {
                        const cap = i.capacityPerUnit || i.capacity || 50;
                        const base = 3000 + (cap * 85);
                        const qty = i.count || 1;
                        return `$${getPrice(base).toLocaleString()} × ${qty} = $${(getPrice(base) * qty).toLocaleString()}`;
                    }
                }
            ])}

            {/* Separators */}
            {equipment.separators?.length > 0 && renderTable('Liquid Separators', equipment.separators, [
                { header: 'Tag', field: 'tag' },
                { header: 'Brand', render: () => currentTier.brands.vessel },
                { header: 'Temp (°C)', render: (i: any) => i.evaporatingTemp ?? '-' },
                { header: 'Volume (L)', field: 'volume' },
                { header: 'Design P (bar)', field: 'designPressure' },
                {
                    header: 'Price ($)', render: (i: any) => {
                        const vol = i.volume || 500;
                        const base = 8000 + (vol * 8);
                        return `$${getPrice(base).toLocaleString()}`;
                    }
                }
            ])}

            {/* Receiver */}
            {equipment.receiver && renderTable('High Pressure Receiver', [equipment.receiver], [
                { header: 'Tag', field: 'tag' },
                { header: 'Brand', render: () => currentTier.brands.vessel },
                { header: 'Volume (L)', field: 'volume' },
                { header: 'Design P (bar)', field: 'designPressure' },
                {
                    header: 'Price ($)', render: (i: any) => {
                        const vol = i.volume || 500;
                        const base = 12000 + (vol * 6);
                        return `$${getPrice(base).toLocaleString()}`;
                    }
                }
            ])}

            {/* Thermosiphon */}
            {equipment.thermosiphon && renderTable('Thermosiphon', [equipment.thermosiphon], [
                { header: 'Tag', field: 'tag' },
                { header: 'Brand', render: () => currentTier.brands.vessel },
                { header: 'Type', field: 'type' },
                { header: 'Volume (L)', field: 'volume' },
                { header: 'Heat Load (kW)', field: 'heatLoad' },
                { header: 'Price ($)', render: () => `$${getPrice(8000).toLocaleString()}` }
            ])}

            {/* Oil Separators */}
            {equipment.oilSeparators?.length > 0 && renderTable('Oil Separators', equipment.oilSeparators, [
                { header: 'Tag', field: 'tag' },
                { header: 'Brand', render: () => currentTier.brands.vessel },
                { header: 'For Compressor', field: 'forCompressor' },
                { header: 'Type', field: 'type' },
                { header: 'Efficiency (%)', field: 'efficiency' },
                { header: 'Price ($)', render: () => `$${getPrice(12000).toLocaleString()}` }
            ])}

            {/* Pumps */}
            {equipment.separators?.some((s: any) => s.pumps) && (
                <Box mb={3}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ borderLeft: '3px solid #1976d2', pl: 1 }}>
                        NH₃ Liquid Pumps
                    </Typography>
                    <Paper variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell><b>Separator</b></TableCell>
                                    <TableCell><b>Brand</b></TableCell>
                                    <TableCell><b>Config</b></TableCell>
                                    <TableCell><b>Flow (m³/h)</b></TableCell>
                                    <TableCell><b>Power (kW)</b></TableCell>
                                    <TableCell><b>Price ($)</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {equipment.separators.filter((s: any) => s.pumps).map((s: any, i: number) => {
                                    const power = s.pumps.power || 3;
                                    const base = 5000 + (power * 1500);
                                    return (
                                        <TableRow key={i} hover>
                                            <TableCell>{s.tag}</TableCell>
                                            <TableCell>{currentTier.brands.pump}</TableCell>
                                            <TableCell>{s.pumps.operating}+{s.pumps.standby}</TableCell>
                                            <TableCell>{s.pumps.flowPerPump}</TableCell>
                                            <TableCell>{s.pumps.power}</TableCell>
                                            <TableCell>${getPrice(base).toLocaleString()}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                </Box>
            )}

            {/* Total Cost Summary */}
            <Paper elevation={3} sx={{ p: 2, mt: 3, bgcolor: currentTier.color }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">
                        Total - {currentTier.name}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                        ${calculateTotal().toLocaleString()}
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

// Enhanced Energy Analysis View with Innovative Strategies
const EnergyAnalysisView = ({ data }: { data: any }) => {
    if (!data) return null;

    const compressorPower = data.equipment?.compressors?.reduce((sum: number, c: any) => {
        const power = c.electrical?.ratedPower || c.electrical?.totalPower || c.electricalPower || c.motorPower || c.power || 0;
        const units = c.operatingUnits || c.count || 1;
        return sum + (power * units);
    }, 0) || 0;

    const condenserPower = data.equipment?.condensers?.reduce((sum: number, c: any) => {
        return sum + (c.totalElectricalPower || c.electrical?.fanMotor || 0);
    }, 0) || 0;

    const evaporatorPower = data.equipment?.evaporators?.reduce((sum: number, e: any) => {
        const fanPower = e.motorPower || e.fanPower || 0.5;
        const fanCount = e.fanCount || 2;
        const units = e.count || 1;
        return sum + (fanPower * fanCount * units);
    }, 0) || 0;

    const totalPower = compressorPower + condenserPower + evaporatorPower;
    const totalLoad = data.summary?.totalCoolingLoad || data.loads?.reduce((s: number, l: any) => s + (l.load || 0), 0) || 100;
    const systemCOP = totalPower > 0 ? (totalLoad / totalPower) : (data.equipment?.compressors?.[0]?.cop || 3.5);
    const monthlyKWh = totalPower * 18 * 30;
    const monthlyCost = monthlyKWh * 0.12;

    // Innovative Energy Strategies data
    const strategies = data.innovativeEnergyStrategies?.strategies || [];
    const totalSavings = data.innovativeEnergyStrategies?.totalAnnualSavings || 0;
    const totalEnergySavings = data.innovativeEnergyStrategies?.totalEnergySavings || 0;
    const totalCO2 = data.innovativeEnergyStrategies?.totalCO2Reduction || 0;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#4caf50';
            case 'medium': return '#ff9800';
            case 'low': return '#9e9e9e';
            default: return '#2196f3';
        }
    };

    return (
        <Box p={2}>
            <Typography variant="h6" gutterBottom color="primary">Energy Optimization Report</Typography>

            {/* Current Performance Summary */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">Total Electrical Load</Typography>
                        <Typography variant="h4" color="primary">{Math.round(totalPower) || '~50'} kW</Typography>
                        <Typography variant="caption">Peak Demand</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">System COP</Typography>
                        <Typography variant="h4" color="success.main">{isFinite(systemCOP) ? systemCOP.toFixed(2) : '~3.5'}</Typography>
                        <Typography variant="caption">Efficiency Ratio</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">Est. Monthly Cost</Typography>
                        <Typography variant="h4" color="warning.main">${Math.round(monthlyCost) > 0 ? Math.round(monthlyCost).toLocaleString() : '~2,500'}</Typography>
                        <Typography variant="caption">@ $0.12/kWh</Typography>
                    </Paper>
                </Grid>
            </Grid>

            {/* Energy Flow Diagram */}
            <Box mt={3}>
                <EnergySankeyDiagram data={data} strategies={strategies} />
            </Box>

            {/* Annual Energy Chart */}
            <Box mt={3}>
                <AnnualEnergyChart data={data} />
            </Box>

            {/* PDF Export Button */}
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                        // Generate PDF content
                        const strategiesHtml = strategies.map((s: any) =>
                            '<div style="margin:10px 0;padding:10px;border-left:4px solid #4caf50;background:#f5f5f5;">' +
                            '<strong>' + (s.name || '') + '</strong> (' + (s.priority?.toUpperCase() || 'MEDIUM') + ')' +
                            '<br/>Annual Savings: <span style="color:green;font-weight:bold;">$' + Math.round(s.financialImpact?.annualCostSavings || 0).toLocaleString() + '</span>' +
                            '<br/>Payback: ' + (s.financialImpact?.paybackYears || 0).toFixed(1) + ' years' +
                            '</div>'
                        ).join('');

                        const htmlContent =
                            '<html><head><title>Energy Optimization Report</title>' +
                            '<style>body{font-family:Arial,sans-serif;padding:20px;}h1{color:#1976d2;}table{border-collapse:collapse;width:100%;margin:10px 0;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background:#e3f2fd;}.savings{color:green;font-weight:bold;}</style></head>' +
                            '<body><h1>🔋 Energy Optimization Report</h1>' +
                            '<p><strong>Generated:</strong> ' + new Date().toLocaleString() + '</p>' +
                            '<h2>System Performance</h2>' +
                            '<table><tr><th>Metric</th><th>Value</th></tr>' +
                            '<tr><td>Total Electrical Load</td><td>' + Math.round(totalPower) + ' kW</td></tr>' +
                            '<tr><td>System COP</td><td>' + (isFinite(systemCOP) ? systemCOP.toFixed(2) : '~3.5') + '</td></tr>' +
                            '<tr><td>Monthly Energy</td><td>' + Math.round(monthlyKWh).toLocaleString() + ' kWh</td></tr>' +
                            '<tr><td>Est. Monthly Cost</td><td>$' + Math.round(monthlyCost).toLocaleString() + '</td></tr></table>' +
                            '<h2>Innovative Strategies (' + strategies.length + ')</h2>' +
                            strategiesHtml +
                            '<h2>Summary</h2>' +
                            '<table><tr><td>Total Annual Savings</td><td class="savings">$' + Math.round(totalSavings).toLocaleString() + '</td></tr>' +
                            '<tr><td>Total Energy Savings</td><td>' + Math.round(totalEnergySavings).toLocaleString() + ' kWh/year</td></tr>' +
                            '<tr><td>CO₂ Reduction</td><td>' + totalCO2.toFixed(1) + ' tons/year</td></tr></table>' +
                            '<p style="margin-top:30px;color:#666;font-size:12px;">Report generated by Cool-Assist Energy Optimization Engine</p></body></html>';

                        const printWindow = window.open('', '_blank');
                        if (printWindow) {
                            printWindow.document.write(htmlContent);
                            printWindow.document.close();
                            printWindow.print();
                        }
                    }}
                >
                    📄 Export PDF Report
                </Button>
            </Box>

            {/* Innovative Energy Strategies Section */}
            {strategies.length > 0 && (
                <Box mt={4}>
                    <Typography variant="h6" gutterBottom color="primary">
                        💡 Innovative Energy-Saving Strategies ({strategies.length})
                    </Typography>

                    {/* Total Savings Summary */}
                    <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#e8f5e9' }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="textSecondary">Total Annual Savings</Typography>
                                <Typography variant="h4" color="success.main">${Math.round(totalSavings).toLocaleString()}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="textSecondary">Energy Savings</Typography>
                                <Typography variant="h5" color="primary">{Math.round(totalEnergySavings).toLocaleString()} kWh/year</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Typography variant="subtitle2" color="textSecondary">CO₂ Reduction</Typography>
                                <Typography variant="h5" color="success.dark">{totalCO2.toFixed(1)} tons/year</Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Individual Strategy Cards */}
                    <Grid container spacing={2}>
                        {strategies.map((strategy: any, idx: number) => (
                            <Grid item xs={12} md={6} key={idx}>
                                <Card sx={{ borderLeft: `4px solid ${getPriorityColor(strategy.priority)}` }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                                            <Typography variant="h6" component="div">
                                                {strategy.name}
                                            </Typography>
                                            <Chip
                                                label={strategy.priority?.toUpperCase() || 'MEDIUM'}
                                                size="small"
                                                sx={{ bgcolor: getPriorityColor(strategy.priority), color: 'white' }}
                                            />
                                        </Box>

                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            {strategy.description}
                                        </Typography>

                                        <Grid container spacing={2} sx={{ mt: 1 }}>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary">Annual Savings</Typography>
                                                <Typography variant="h6" color="success.main">
                                                    ${Math.round(strategy.financialImpact?.annualCostSavings || strategy.financialImpact?.annualBenefit || strategy.financialImpact?.netAnnualSavings || 0).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary">Payback Period</Typography>
                                                <Typography variant="h6" color="primary">
                                                    {(strategy.financialImpact?.paybackYears || 0).toFixed(1)} years
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary">Energy Savings</Typography>
                                                <Typography variant="body2">
                                                    {strategy.energySavings?.percent || 0}%
                                                    ({Math.round(strategy.energySavings?.kWhPerYear || 0).toLocaleString()} kWh)
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary">Implementation Cost</Typography>
                                                <Typography variant="body2">
                                                    ${Math.round(strategy.financialImpact?.implementationCost || strategy.financialImpact?.netImplementationCost || 0).toLocaleString()}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                        {strategy.regionalNotes && (
                                            <Alert severity="info" sx={{ mt: 2 }}>
                                                <Typography variant="caption">{strategy.regionalNotes}</Typography>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            {/* Standard Recommendations if no innovative strategies */}
            {strategies.length === 0 && (
                <Grid item xs={12}>
                    <Card sx={{ mt: 2 }}>
                        <CardContent>
                            <Typography variant="h6">Optimization Suggestions</Typography>
                            <Box component="ul" sx={{ pl: 2 }}>
                                <li><Typography variant="body2">Consider <b>Variable Frequency Drives (VFD)</b> for compressors (+15% efficiency at part load)</Typography></li>
                                <li><Typography variant="body2">Install <b>Floating Head Pressure Control</b> for condensers (saves 2-3% energy per degree drop)</Typography></li>
                                <li><Typography variant="body2">Recommended <b>Defrost on Demand</b> system for evaporators</Typography></li>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            )}
        </Box>
    );
};

// Expandable P&ID Section
const PIDSection = ({ pidData, projectInfo }: { pidData: any, projectInfo: any }) => {
    if (!pidData) return null;

    const safeString = (val: any): string => {
        if (!val) return 'Project';
        if (typeof val === 'string') return val;
        if (typeof val === 'object' && val.city) return val.city;
        return String(val);
    };

    return (
        <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={1}>
                    <AccountTreeIcon color="success" />
                    <Typography fontWeight="bold">P&ID Diagram</Typography>
                    <Chip label="ISO 14617" size="small" sx={{ ml: 1 }} />
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Box height="500px" border="1px solid #ccc" borderRadius={1} overflow="hidden">
                    <ProfessionalPIDCanvas
                        data={pidData}
                        projectInfo={{
                            client: safeString(projectInfo?.location),
                            projectName: projectInfo?.name || 'AMMONIA REFRIGERATION SYSTEM',
                            drawingTitle: 'GENERAL PIPING DIAGRAM',
                            drawingNo: 'PID-001',
                            designer: 'GFDDE AI',
                            date: new Date().toLocaleDateString()
                        }}
                    />
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};

// Full Design Result Message (inline in chat)
const DesignResultMessage = ({ data, onNewDesign, onDownloadReport }: { data: any, onNewDesign: () => void, onDownloadReport: () => void }) => {
    if (!data) return null;

    return (
        <Box sx={{ maxWidth: '100%', mb: 2 }}>
            <ProjectSummaryCard data={data} />
            <LoadsSection loads={data.loads} />
            <EquipmentSection equipment={data.equipment} />
            <PIDSection pidData={data.pidData} projectInfo={data.project} />
            <Box display="flex" gap={1} mt={2}>
                <Button variant="contained" startIcon={<DownloadIcon />} onClick={onDownloadReport} size="small">
                    Download Report
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onNewDesign} size="small">
                    New Design
                </Button>
            </Box>
        </Box>
    );
};

// ============================================================
// INTELLIGENT CHAT COMPONENTS (Phase 6)
// ============================================================

// Recommendations Card Component
const RecommendationsCard = ({ data, onConfirm, onModify }: { data: any, onConfirm: () => void, onModify: (what: string) => void }) => {
    if (!data) return null;

    const refrigerant = data.refrigerant?.recommended || {};
    const materials = data.materials || {};
    const standards = data.standards || {};
    const summary = data.projectSummary || {};

    return (
        <Box sx={{ maxWidth: '100%' }}>
            <Card sx={{ bgcolor: '#e8f5e9', mb: 2, border: '2px solid #4caf50' }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                        <VerifiedIcon color="success" />
                        <Typography variant="h6" color="success.main">
                            Smart Recommendations
                        </Typography>
                    </Box>

                    {/* Project Summary */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">📍 Location</Typography>
                            <Typography variant="body1" fontWeight="bold">{summary.location || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">🌡️ Temperature</Typography>
                            <Typography variant="body1" fontWeight="bold">{summary.temperature || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">⚡ Est. Load</Typography>
                            <Typography variant="body1" fontWeight="bold">{summary.estimatedLoad || 'N/A'}</Typography>
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 2 }} />

                    {/* Refrigerant Recommendation */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#fff', borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                            ❄️ Recommended Refrigerant
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="h5" color="primary">{refrigerant.name || 'N/A'}</Typography>
                                <Box display="flex" gap={1} mt={1}>
                                    <Chip label={`GWP: ${refrigerant.gwp || 0}`} size="small" color={refrigerant.gwp < 10 ? 'success' : 'warning'} />
                                    <Chip label={`Safety: ${refrigerant.safety || 'N/A'}`} size="small" />
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                {refrigerant.advantages && (
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">Advantages:</Typography>
                                        <ul style={{ margin: 0, paddingLeft: 16 }}>
                                            {(refrigerant.advantages || []).slice(0, 3).map((a: string, i: number) => (
                                                <li key={i}><Typography variant="caption">{a}</Typography></li>
                                            ))}
                                        </ul>
                                    </Box>
                                )}
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Materials Recommendation */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#fff', borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
                            🏗️ Recommended Materials
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="textSecondary">Panels</Typography>
                                <Typography variant="body2">{materials.panel?.walls?.thickness || 100}mm PU</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="textSecondary">Door</Typography>
                                <Typography variant="body2">{materials.door?.type || 'sliding'}</Typography>
                                {materials.door?.heater && <Chip label="+ Heater" size="small" color="warning" sx={{ mt: 0.5 }} />}
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption" color="textSecondary">Floor</Typography>
                                <Typography variant="body2">{materials.floor?.type || 'standard'}</Typography>
                                {materials.floor?.heatingRequired && <Chip label="+ Heating" size="small" color="error" sx={{ mt: 0.5 }} />}
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Standards */}
                    <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                            📜 Regional Standards: {standards.code || 'ASHRAE 15'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            Country: {standards.country || 'International'} | Safety Factor: {standards.safetyFactor || 1.15}
                        </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Box display="flex" gap={2} mt={3}>
                        <Button
                            variant="contained"
                            color="success"
                            size="large"
                            onClick={onConfirm}
                            startIcon={<VerifiedIcon />}
                            sx={{ flex: 1 }}
                        >
                            ✅ Confirm & Calculate
                        </Button>
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => onModify('refrigerant')}
                        >
                            Change Refrigerant
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => onModify('materials')}
                        >
                            Change Materials
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

// Info Request Card Component
const InfoRequestCard = ({ data, onSubmitInfo }: { data: any, onSubmitInfo: (info: string) => void }) => {
    const [inputValue, setInputValue] = useState('');

    if (!data) return null;

    const questions = data.questions || [];
    const filled = data.filled || [];
    const completeness = data.completeness || '0%';

    return (
        <Card sx={{ bgcolor: '#fff8e1', mb: 2, border: '2px solid #ff9800' }}>
            <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <SettingsIcon color="warning" />
                    <Typography variant="h6" color="warning.dark">
                        📋 More Information Needed
                    </Typography>
                    <Chip label={`${completeness} complete`} size="small" color="warning" sx={{ ml: 'auto' }} />
                </Box>

                {/* What we have */}
                {filled.length > 0 && (
                    <Box sx={{ mb: 2, p: 1, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                        <Typography variant="caption" color="success.main" fontWeight="bold">
                            ✓ Information received:
                        </Typography>
                        <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                            {filled.map((f: string, i: number) => (
                                <Chip key={i} label={f} size="small" color="success" variant="outlined" />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Questions */}
                <Typography variant="subtitle2" gutterBottom>Please provide:</Typography>
                {questions.map((q: any, idx: number) => {
                    // Safely extract question text from various possible formats
                    const questionText = typeof q === 'string' ? q : (q.text || q.question || q.field || JSON.stringify(q));
                    const example = typeof q === 'object' ? (q.placeholder || q.example || '') : '';
                    const options = typeof q === 'object' ? q.options : null;

                    return (
                        <Box key={idx} sx={{ mb: 1, p: 1.5, bgcolor: '#fff', borderRadius: 1, border: '1px solid #ddd' }}>
                            <Typography variant="body2" fontWeight="bold">
                                {idx + 1}. {questionText}
                            </Typography>
                            {example && (
                                <Typography variant="caption" color="textSecondary">
                                    Example: {example}
                                </Typography>
                            )}
                            {options && Array.isArray(options) && (
                                <Box display="flex" gap={0.5} flexWrap="wrap" mt={1}>
                                    {options.map((opt: any, oi: number) => (
                                        <Chip
                                            key={oi}
                                            label={typeof opt === 'string' ? opt : (opt.label || JSON.stringify(opt))}
                                            size="small"
                                            variant="outlined"
                                            clickable
                                            onClick={() => setInputValue(prev => prev + (prev ? ', ' : '') + (typeof opt === 'string' ? opt : (opt.label || '')))}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>
                    );
                })}

                {/* Quick Input */}
                <Box display="flex" gap={1} mt={2}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Type your answers here..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && inputValue && onSubmitInfo(inputValue)}
                    />
                    <Button
                        variant="contained"
                        color="warning"
                        disabled={!inputValue}
                        onClick={() => { onSubmitInfo(inputValue); setInputValue(''); }}
                    >
                        Submit
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );
};

// ============================================================
// MAIN CHAT COMPONENT
// ============================================================

interface ChatMessage {
    id: number;
    text?: string;
    sender: 'user' | 'ai';
    type?: 'text' | 'design' | 'recommendations' | 'info_request';
    designData?: any;
    recommendationsData?: any;
    infoRequestData?: any;
}

const UnifiedChatPage: React.FC = () => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const { projectId } = useParams<{ projectId: string }>();
    const { currentProject, selectProject, addMessage, projects } = useProjects();

    // Load project chat history when projectId changes
    useEffect(() => {
        if (projectId && (!currentProject || currentProject.id !== projectId)) {
            selectProject(projectId);
        }
    }, [projectId, currentProject, selectProject]);

    // Get messages from current project or use default
    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (currentProject) {
            return currentProject.chatHistory as ChatMessage[];
        }
        return [{
            id: 1,
            text: "👋 Hello! I am your HVAC-R Design Engineer.\n\nDescribe your project in detail:\n• Cold storage warehouses\n• Freezing tunnels\n• Slaughterhouse refrigeration\n• Industrial cooling systems",
            sender: 'ai',
            type: 'text'
        }];
    });

    // Update messages when currentProject changes
    useEffect(() => {
        if (currentProject) {
            setMessages(currentProject.chatHistory as ChatMessage[]);
        }
    }, [currentProject]);

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatMode, setChatMode] = useState<'general' | 'design'>('design');
    const endRef = useRef<HTMLDivElement>(null);

    // Floating Tools State
    const [showToolsPanel, setShowToolsPanel] = useState(false);
    const [activeTool, setActiveTool] = useState<'refrigerant' | 'calculator' | 'converter' | null>(null);

    const handleToolSelect = (tool: 'refrigerant' | 'calculator' | 'converter') => {
        setActiveTool(tool);
        setShowToolsPanel(false);
    };

    const handleCloseTools = () => {
        setShowToolsPanel(false);
        setActiveTool(null);
    };

    const handleBackToTools = () => {
        setActiveTool(null);
        setShowToolsPanel(true);
    };

    useEffect(() => {
        const textMessages = messages.filter(m => m.type !== 'design');
        localStorage.setItem('cool-assist-unified-chat', JSON.stringify(textMessages));
    }, [messages]);

    useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth"}); }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput('');

        const userMessage = { id: Date.now(), text: msg, sender: 'user' as const, type: 'text' as const, timestamp: Date.now() };
        setMessages(p => [...p, userMessage]);

        // Save user message to project if exists
        if (currentProject) {
            addMessage(currentProject.id, { text: msg, sender: 'user', type: 'text' });
        }

        setLoading(true);

        try {
            // Choose endpoint based on chat mode
            const endpoint = chatMode === 'general'
                ? '/api/chat/general'
                : '/api/chat/message';

            const res = await axios.post(endpoint, {
                message: msg,
                sessionId: 'user-session-1'
            });

            if (res.data && res.data.success) {
                const responseType = res.data.type;

                // Handle general chat response
                if (responseType === 'general_response') {
                    const aiMsg = {
                        id: Date.now() + 1,
                        text: res.data.message,
                        sender: 'ai' as const,
                        type: 'text' as const,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, aiMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { text: res.data.message, sender: 'ai', type: 'text' });
                    }
                }
                // Handle design mode responses (existing logic)
                else if (responseType === 'greeting') {
                    const greetingText = res.data.message + '\n\n' + res.data.help;
                    const aiMsg = {
                        id: Date.now() + 1,
                        text: greetingText,
                        sender: 'ai' as const,
                        type: 'text' as const,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, aiMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { text: greetingText, sender: 'ai', type: 'text' });
                    }
                }
                else if (responseType === 'info_request') {
                    const aiMsg = {
                        id: Date.now() + 1,
                        sender: 'ai' as const,
                        type: 'info_request' as const,
                        infoRequestData: res.data,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, aiMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { sender: 'ai', type: 'info_request', infoRequestData: res.data });
                    }
                }
                else if (responseType === 'recommendations') {
                    const aiMsg = {
                        id: Date.now() + 1,
                        sender: 'ai' as const,
                        type: 'recommendations' as const,
                        recommendationsData: res.data,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, aiMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { sender: 'ai', type: 'recommendations', recommendationsData: res.data });
                    }
                }
                else if (responseType === 'refrigerant_selection') {
                    // Display refrigerant selection options
                    const options = res.data.refrigerantOptions || [];
                    let optionsText = res.data.message + '\n\n';
                    options.forEach((opt: any, idx: number) => {
                        optionsText += `${idx + 1}. **${opt.name}** (${opt.type}) - GWP: ${opt.gwp}\n`;
                    });
                    optionsText += '\n📝 To select, type the refrigerant name (e.g., R404A)';

                    const aiMsg = {
                        id: Date.now() + 1,
                        text: optionsText,
                        sender: 'ai' as const,
                        type: 'text' as const,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, aiMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { text: optionsText, sender: 'ai', type: 'text' });
                    }
                }
                // Handle room count question for large capacity storage
                else if (responseType === 'room_count_question') {
                    const question = res.data.question;
                    const options = question?.options || [];
                    let optionsText = res.data.message + '\n\n';
                    optionsText += '🏗️ **گزینه‌های پیشنهادی:**\n';
                    options.forEach((opt: any) => {
                        if (opt.isRecommended) {
                            optionsText += `  ✅ **${opt.value} سالن** (پیشنهاد سیستم)\n`;
                        } else {
                            optionsText += `  • ${opt.value} سالن\n`;
                        }
                    });
                    optionsText += '\n📝 عدد مورد نظر خود را تایپ کنید (مثلاً: 3)';

                    const aiMsg = {
                        id: Date.now() + 1,
                        text: optionsText,
                        sender: 'ai' as const,
                        type: 'text' as const,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, aiMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { text: optionsText, sender: 'ai', type: 'text' });
                    }
                }
                else if (responseType === 'question_response') {
                    const questionText = res.data.message + '\n\n' + res.data.note;
                    const aiMsg = {
                        id: Date.now() + 1,
                        text: questionText,
                        sender: 'ai' as const,
                        type: 'text' as const,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, aiMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { text: questionText, sender: 'ai', type: 'text' });
                    }
                }
                else if (responseType === 'unknown') {
                    const unknownText = res.data.message + '\n\n' + res.data.help;
                    const aiMsg = {
                        id: Date.now() + 1,
                        text: unknownText,
                        sender: 'ai' as const,
                        type: 'text' as const,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, aiMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { text: unknownText, sender: 'ai', type: 'text' });
                    }
                }
                else {
                    // Full design result (after confirmation)
                    const designCompleteText = `✅ Design Complete! (${Math.round(res.data.summary?.totalCoolingLoad || 0)} kW)`;
                    setMessages(p => [...p, {
                        id: Date.now() + 1,
                        text: designCompleteText,
                        sender: 'ai',
                        type: 'text',
                        timestamp: Date.now()
                    }]);

                    if (currentProject) {
                        addMessage(currentProject.id, { text: designCompleteText, sender: 'ai', type: 'text' });
                    }

                    const designMsg = {
                        id: Date.now() + 2,
                        sender: 'ai' as const,
                        type: 'design' as const,
                        designData: res.data,
                        timestamp: Date.now()
                    };
                    setMessages(p => [...p, designMsg]);

                    if (currentProject) {
                        addMessage(currentProject.id, { sender: 'ai', type: 'design', designData: res.data });
                    }
                }
            } else {
                const errorMsg = res.data?.error || res.data?.message || 'Unknown error';
                const errorText = `❌ Error: ${errorMsg}`;
                const aiMsg = {
                    id: Date.now() + 1,
                    text: errorText,
                    sender: 'ai' as const,
                    type: 'text' as const,
                    timestamp: Date.now()
                };
                setMessages(p => [...p, aiMsg]);

                if (currentProject) {
                    addMessage(currentProject.id, { text: errorText, sender: 'ai', type: 'text' });
                }
            }
        } catch (e: any) {
            console.error("Error:", e);
            const errorText = `❌ Error: ${e.response?.data?.error || 'Connection error'}`;
            const aiMsg = {
                id: Date.now() + 1,
                text: errorText,
                sender: 'ai' as const,
                type: 'text' as const,
                timestamp: Date.now()
            };
            setMessages(p => [...p, aiMsg]);

            if (currentProject) {
                addMessage(currentProject.id, { text: errorText, sender: 'ai', type: 'text' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleNewDesign = () => {
        setMessages(p => [...p, {
            id: Date.now(),
            text: "--- New Design ---\nPlease describe your new project.",
            sender: 'ai',
            type: 'text'
        }]);
    };

    const handleDownloadReport = async (designData: any) => {
        try {
            const response = await axios.post('/api/core/report', designData, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'design_report.html');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error("Report download error:", e);
            alert("Error downloading report");
        }
    };

    const clearHistory = () => {
        if (window.confirm("Are you sure you want to clear chat history?")) {
            setMessages([{
                id: 1,
                text: "👋 Hello! I am your HVAC-R Design Engineer.",
                sender: 'ai',
                type: 'text'
            }]);
            localStorage.removeItem('cool-assist-unified-chat');
        }
    };

    const [activeDesign, setActiveDesign] = useState<any>(null);
    const [previewTab, setPreviewTab] = useState(0);

    useEffect(() => {
        const designMessages = messages.filter(m => m.type === 'design');
        if (designMessages.length > 0) {
            setActiveDesign(designMessages[designMessages.length - 1].designData);
        }
    }, [messages]);

    return (
        <Box display="flex" height="calc(100vh - 64px)">
            <Box width="40%" display="flex" flexDirection="column" bgcolor={isDarkMode ? theme.palette.background.default : '#f5f5f5'} borderRight={`1px solid ${theme.palette.divider}`}>
                <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 0 }}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}><SmartToyIcon /></Avatar>
                        <Box>
                            <Typography variant="h6">AI Engineer</Typography>
                            <Typography variant="caption" color="textSecondary">HVAC-R Design • Online</Typography>
                        </Box>
                    </Box>
                </Paper>

                {/* Chat messages area - mode toggle buttons removed, using bottom toggle instead */}

                <Box flexGrow={1} overflow="auto" p={2}>
                    {messages.map(m => (
                        <Box key={m.id} mb={2}>
                            {m.type === 'design' ? (
                                <Card sx={{ bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#e8f5e9', cursor: 'pointer', '&:hover': { bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.25)' : '#c8e6c9' } }} onClick={() => setActiveDesign(m.designData)}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <VerifiedIcon color="success" />
                                            <Typography fontWeight="bold">✅ {m.designData?.project?.name || 'Design'}</Typography>
                                        </Box>
                                        <Typography variant="body2" color="textSecondary" mt={1}>
                                            Total Load: {Math.round(m.designData?.summary?.totalCoolingLoad || 0)} kW<br />
                                            Est. Cost: ${calculateEquipmentCost(m.designData?.equipment).toLocaleString()}
                                        </Typography>
                                        <Typography variant="caption" color="primary" mt={1} display="block">
                                            👆 Click to view details →
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ) : m.type === 'recommendations' ? (
                                <RecommendationsCard
                                    data={m.recommendationsData}
                                    onConfirm={() => {
                                        setInput('confirm');
                                        setTimeout(() => handleSend(), 100);
                                    }}
                                    onModify={(what: string) => {
                                        setInput(`change ${what}`);
                                        setTimeout(() => handleSend(), 100);
                                    }}
                                />
                            ) : m.type === 'info_request' ? (
                                <InformationGatheringPanel
                                    completeness={parseFloat(m.infoRequestData?.completeness || '0')}
                                    receivedInfo={(m.infoRequestData?.filled || []).map((f: any) =>
                                        typeof f === 'string' ? f : (f.field || f.text || JSON.stringify(f))
                                    )}
                                    missingFields={(m.infoRequestData?.questions || m.infoRequestData?.missing || []).map((q: any) => ({
                                        field: q.field || 'information',
                                        question: typeof q === 'string' ? q : (q.text || q.question || q.config?.questions?.en || q.config?.questions?.fa || q.field || JSON.stringify(q)),
                                        example: q.placeholder || q.example || q.config?.placeholder?.en || q.config?.placeholder?.fa || ''
                                    }))}
                                    recommendations={m.infoRequestData?.recommendations}
                                    onSubmitAnswer={(answer: string) => {
                                        setInput(answer);
                                        setTimeout(() => handleSend(), 100);
                                    }}
                                />
                            ) : (
                                <Box display="flex" justifyContent={m.sender === 'user' ? 'flex-end' : 'flex-start'}>
                                    {m.sender === 'ai' && <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}><SmartToyIcon fontSize="small" /></Avatar>}
                                    <Paper sx={{
                                        p: 2,
                                        maxWidth: '85%',
                                        bgcolor: m.sender === 'user' ? (isDarkMode ? '#047857' : '#10B981') : theme.palette.background.paper,
                                        color: m.sender === 'user' ? 'white' : 'text.primary',
                                        borderRadius: 2,
                                        border: m.sender === 'ai' ? `1px solid ${theme.palette.divider}` : 'none',
                                        boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                                    }}>
                                        <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>{m.text}</Typography>
                                    </Paper>
                                </Box>
                            )}
                        </Box>
                    ))}

                    {loading && (
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}><SmartToyIcon fontSize="small" /></Avatar>
                            <CircularProgress size={24} />
                            <Typography variant="body2" color="textSecondary">Calculating...</Typography>
                        </Box>
                    )}

                    <div ref={endRef} />
                </Box>

                <Paper elevation={3} sx={{ p: 2, borderRadius: 0 }}>
                    {/* Tools Toggle Row */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box
                                component="span"
                                className="material-symbols-outlined"
                                sx={{
                                    fontSize: 18,
                                    color: chatMode === 'design' ? '#10B981' : '#9ca3af',
                                    transition: 'color 0.2s',
                                }}
                            >
                                toggle_on
                            </Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: chatMode === 'design' ? '#10B981' : '#6b7280',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    '&:hover': { color: '#10B981' },
                                }}
                                onClick={() => setChatMode(chatMode === 'design' ? 'general' : 'design')}
                            >
                                Design & Calculations Mode
                            </Typography>
                        </Box>
                        <Button
                            size="small"
                            onClick={() => setShowToolsPanel(!showToolsPanel)}
                            sx={{
                                textTransform: 'none',
                                color: '#6b7280',
                                fontSize: '0.75rem',
                                '&:hover': { color: '#10B981', bgcolor: 'rgba(16, 185, 129, 0.08)' },
                            }}
                            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>handyman</span>}
                        >
                            Tools
                        </Button>
                    </Box>

                    {/* Input Area */}
                    <Box display="flex" gap={1}>
                        <TextField
                            fullWidth
                            placeholder="Ask questions or describe your project..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            variant="outlined"
                            size="small"
                            sx={{
                                bgcolor: theme.palette.background.paper,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    color: 'text.primary',
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#10B981',
                                    },
                                    '& fieldset': {
                                        borderColor: theme.palette.divider,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: 'text.secondary',
                                    }
                                },
                                '& .MuiInputBase-input': {
                                    color: 'text.primary',
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: 'text.secondary',
                                    opacity: 0.7,
                                }
                            }}
                        />
                        <IconButton
                            onClick={handleSend}
                            disabled={loading}
                            sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                borderRadius: 2,
                                '&:hover': { bgcolor: 'primary.dark' },
                                '&:disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                            }}
                        >
                            <SendIcon sx={{ transform: 'rotate(-45deg)' }} />
                        </IconButton>
                    </Box>
                    <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1} sx={{ fontSize: '10px' }}>
                        AI can make mistakes. Verify important calculations.
                    </Typography>
                </Paper>
            </Box>

            <Box width="60%" display="flex" flexDirection="column" bgcolor={theme.palette.background.default}>
                {activeDesign ? (
                    <>
                        <Paper elevation={1} sx={{ p: 1, borderRadius: 0, bgcolor: theme.palette.background.paper, borderBottom: `1px solid ${theme.palette.divider}` }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" fontWeight="bold">📊 {activeDesign.projectInfo?.name || 'Design Preview'}</Typography>
                                <Box>
                                    <Button size="small" startIcon={<DownloadIcon />} onClick={() => handleDownloadReport(activeDesign)}>Download</Button>
                                    <Button size="small" startIcon={<RefreshIcon />} onClick={handleNewDesign}>New</Button>
                                </Box>
                            </Box>
                        </Paper>

                        <Tabs value={previewTab} onChange={(_, v) => setPreviewTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Summary" />
                            <Tab label="Load Calculation" />
                            <Tab label="Calculation Book" />
                            <Tab label="Equipment" />
                            <Tab label="P&ID 2D" />
                            <Tab label="P&ID 3D" />
                            <Tab label="Energy" />
                            <Tab label="Compliance" />
                        </Tabs>

                        <Box flexGrow={1} overflow="auto" p={2}>
                            {previewTab === 0 && <ProjectSummaryCard data={activeDesign} />}
                            {previewTab === 1 && <LoadsSection loads={activeDesign.loads} />}
                            {previewTab === 2 && <CalculationBook data={activeDesign} />}
                            {previewTab === 3 && <EquipmentSection equipment={activeDesign.proposals?.best || activeDesign.equipment || {}} />}
                            {previewTab === 4 && (
                                <Box height="100%" minHeight="500px">
                                    <ProfessionalPIDCanvas
                                        data={activeDesign}
                                        projectInfo={{
                                            client: activeDesign.projectInfo?.location?.city || activeDesign.project?.location?.city || 'Client',
                                            projectName: activeDesign.projectInfo?.name || activeDesign.project?.name || 'Project',
                                            drawingTitle: 'GENERAL PIPING DIAGRAM',
                                            drawingNo: 'PID-001',
                                            designer: 'GFDDE AI',
                                            date: new Date().toLocaleDateString()
                                        }}
                                    />
                                </Box>
                            )}
                            {previewTab === 5 && (
                                <Box height="100%" minHeight="600px">
                                    <Suspense fallback={
                                        <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                                            <CircularProgress />
                                            <Typography sx={{ ml: 2 }}>Loading 3D View...</Typography>
                                        </Box>
                                    }>
                                        <TopologyIndustrialCanvas
                                            data={activeDesign}
                                            projectInfo={{
                                                projectName: activeDesign.projectInfo?.name || activeDesign.project?.name || 'Refrigeration System',
                                                client: activeDesign.projectInfo?.location?.city || 'Client'
                                            }}
                                        />
                                    </Suspense>
                                </Box>
                            )}
                            {previewTab === 6 && <EnergyAnalysisView data={activeDesign} />}
                            {previewTab === 7 && <ComplianceSection compliance={activeDesign.compliance} refrigerant={activeDesign.project?.refrigerant || activeDesign.projectInfo?.refrigerant} />}
                        </Box>
                    </>
                ) : (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%" bgcolor={theme.palette.background.default}>
                        <Box textAlign="center" color="text.secondary">
                            <AccountTreeIcon sx={{ fontSize: 80, opacity: 0.3 }} />
                            <Typography variant="h6" mt={2}>Preview Panel</Typography>
                            <Typography variant="body2">Design results will be displayed here</Typography>
                            <Typography variant="caption" display="block" mt={1}>Describe a project in the chat on the left</Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Floating Tools Container */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 2,
                }}
            >
                <ToolsPanel
                    isOpen={showToolsPanel}
                    onClose={handleCloseTools}
                    onSelectTool={handleToolSelect}
                />
                <CalculatorWidget
                    isOpen={activeTool === 'calculator'}
                    onClose={handleCloseTools}
                    onBack={handleBackToTools}
                />
                <UnitConverterWidget
                    isOpen={activeTool === 'converter'}
                    onClose={handleCloseTools}
                    onBack={handleBackToTools}
                />
                <RefrigerantPropsWidget
                    isOpen={activeTool === 'refrigerant'}
                    onClose={handleCloseTools}
                    onBack={handleBackToTools}
                />
            </Box>
        </Box >
    );
};

export default UnifiedChatPage;
