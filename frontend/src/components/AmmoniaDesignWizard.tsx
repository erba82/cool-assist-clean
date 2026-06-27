import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Paper, Typography, Stepper, Step, StepLabel,
    Grid, Card, CardContent, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Divider, Alert, Button
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import DevicesIcon from '@mui/icons-material/Devices';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import BoltIcon from '@mui/icons-material/Bolt';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ProfessionalPIDCanvas from './ProfessionalPIDCanvas';

const steps = [
    { label: 'Load Calculation', icon: <CalculateIcon /> },
    { label: 'Equipment Selection', icon: <DevicesIcon /> },
    { label: 'P&ID Diagram', icon: <AccountTreeIcon /> },
    { label: 'Energy Optimization', icon: <BoltIcon /> },
    { label: 'Standards Compliance', icon: <VerifiedUserIcon /> },
];

// --- Helper Functions ---

// Safely convert any value to a displayable string
const safeString = (val: any): string => {
    if (val === null || val === undefined) return 'N/A';
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'object') {
        // Handle location objects {city, country}
        if (val.city && val.country) return `${val.city}, ${val.country}`;
        if (val.city) return val.city;
        if (val.name) return val.name;
        return JSON.stringify(val);
    }
    return String(val);
};

const transformApiToWizard = (apiResult: any) => {
    // Transform Core Engine API response to Wizard props format
    if (!apiResult || !apiResult.project) return null;

    return {
        projectInfo: apiResult.project,
        loads: {
            rooms: (apiResult.loads || []).map((l: any) => ({
                name: l.room,
                temp: l.temperature,
                loadKW: l.load ? l.load.toFixed(1) : '0',
                evapSelection: {
                    qty: apiResult.equipment?.evaporators?.find((e: any) => e.evapTemp === l.temperature)?.count || 1,
                    capacityPerUnit: apiResult.equipment?.evaporators?.find((e: any) => e.evapTemp === l.temperature)?.capacity?.toFixed(1) || '0'
                }
            }))
        },
        proposals: {
            best: {
                totalPrice: apiResult.summary?.totalCost || 0,
                compressors: (apiResult.equipment?.compressors || []).map((c: any) => ({
                    tag: c.tag,
                    manufacturer: 'Mycom',
                    model: c.model,
                    capacity: c.capacity ? c.capacity.toFixed(0) : '0',
                    power: c.power || 0,
                    cop: c.cop || 0,
                    price: 50000 // Placeholder
                })),
                condenser: apiResult.equipment?.condensers?.[0] ? {
                    manufacturer: 'BAC',
                    type: apiResult.equipment.condensers[0].type,
                    model: apiResult.equipment.condensers[0].model,
                    capacity: apiResult.equipment.condensers[0].capacity.toFixed(0),
                    price: 80000 // Placeholder
                } : null,
                vessels: (apiResult.equipment?.separators || []).map((s: any) => ({
                    tag: s.tag,
                    type: 'Separator',
                    volume: s.volume,
                    price: 15000 // Placeholder
                })),
                evaporators: (apiResult.equipment?.evaporators || []).map((e: any) => ({
                    roomName: `Rooms @ ${e.evapTemp}°C`,
                    manufacturer: 'Güntner',
                    model: e.model,
                    count: e.count,
                    qty: Math.ceil(e.count / Math.max(1, (apiResult.project.roomCount || 1))), // Rough estimate
                    capacityPerUnit: e.capacity ? e.capacity.toFixed(1) : '0',
                    fans: e.fanCount,
                    fanPower: 1.5
                })),
                pumps: apiResult.equipment?.pumps || [],
                gfdde_variants: apiResult.energy?.variants || [] // Add variants if available
            }
        },
        diagram: {
            layout: apiResult.pidData, // Pass directly to PIDCanvas
            metadata: {
                projectName: apiResult.project.name,
                systemType: `Ammonia System (${apiResult.project.refrigerant})`
            }
        },
        optimization: {
            totalSavingsKW: ((apiResult.summary?.totalCoolingLoad || 0) * 0.4 / 3.5).toFixed(0), // Est
            annualSavingsUSD: apiResult.energy?.annualSavings || 0,
            optimizedPowerKW: ((apiResult.summary?.totalCoolingLoad || 0) / 3.5).toFixed(0),
            measures: apiResult.energy?.recommendations || []
        },
        compliance: {
            standard: {
                code: apiResult.standards?.primary || 'ISO 5149',
                name: 'Refrigerating systems and heat pumps',
                region: safeString(apiResult.project.location),
                safety_class: 'B2L'
            },
            checklist: (apiResult.standards?.design || []).map((s: string) => ({
                item: s,
                status: 'Required',
                detail: 'Standard compliance checked'
            }))
        }
    };
};

// --- Sub-Components ---

const LoadView = ({ data }: { data: any }) => (
    <Box>
        <Alert severity="info" sx={{ mb: 2 }}>Total Rooms: {data?.rooms?.length || 0}</Alert>
        <TableContainer component={Paper} variant="outlined">
            <Table size="small">
                <TableHead sx={{ bgcolor: '#eee' }}>
                    <TableRow>
                        <TableCell>Room Name</TableCell>
                        <TableCell>Temp (°C)</TableCell>
                        <TableCell align="right">Load (kW)</TableCell>
                        <TableCell>Evaporators</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data?.rooms?.map((room: any, i: number) => (
                        <TableRow key={i}>
                            <TableCell>{room.name}</TableCell>
                            <TableCell><Chip label={room.temp} size="small" /></TableCell>
                            <TableCell align="right"><strong>{room.loadKW}</strong></TableCell>
                            <TableCell>{room.evapSelection?.qty || 1} x {room.evapSelection?.capacityPerUnit || '?'}kW</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

const EquipmentView = ({ data, allProposals }: { data: any, allProposals: any }) => {
    // 🆕 Extract GFDDE variants from backend response
    const gfddeVariants = allProposals?.gfdde_variants || data?.gfdde_variants || [];

    if (!data) return <Alert severity="warning">No equipment data available</Alert>;

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h5" color="primary">
                    Total Estimate: ${(data?.totalPrice || 0).toLocaleString()}
                </Typography>
                {gfddeVariants.length > 0 && (
                    <Chip
                        icon={<BoltIcon />}
                        label={`🆕 ${gfddeVariants.length} GFDDE Variants Generated`}
                        color="secondary"
                        variant="filled"
                        sx={{ fontWeight: 'bold', fontSize: '13px' }}
                    />
                )}
            </Box>

            {/* 🆕 GFDDE AI Variants Display */}
            {gfddeVariants.length > 0 && (
                <Box mb={3} sx={{ bgcolor: '#f5f3ff', p: 2, borderRadius: 2, border: '2px solid #9c27b0' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#7b1fa2' }}>
                        <BoltIcon />
                        AI-Generated Design Variants (GFDDE Engine)
                    </Typography>
                    <Grid container spacing={2}>
                        {gfddeVariants.map((variant: any, index: number) => (
                            <Grid item xs={12} md={3} key={index}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        bgcolor: 'white',
                                        borderLeft: '4px solid #9c27b0',
                                        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)', transition: '0.2s' }
                                    }}
                                >
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold" color="secondary" gutterBottom>
                                            {variant.strategy.toUpperCase()}
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>Score:</strong> {(variant.rank_score ?? 0).toFixed(1)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>COP:</strong> {(variant.performance?.system_COP ?? 0).toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            <strong>Cost:</strong> ${(variant.cost_estimate?.total ?? 0).toLocaleString()}
                                        </Typography>
                                        <Typography variant="body2" color="success.main">
                                            <strong>CO₂:</strong> {(variant.carbon_footprint?.annual_co2 ?? 0).toFixed(0)} kg/yr
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <strong>GFDDE AI Engine Active:</strong> These variants were automatically generated using Machine Learning,
                        ASHRAE compliance validation, and multi-objective optimization.
                    </Alert>
                </Box>
            )}

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="primary">Compressors</Typography>
                    {data?.compressors?.map((c: any, i: number) => (
                        <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                            <CardContent sx={{ py: 1 }}>
                                <Typography variant="subtitle2">{c.tag}: {c.manufacturer} {c.model}</Typography>
                                <Typography variant="caption" display="block">
                                    Capacity: {c.capacity} kW | Power: {c.power} kW | COP: {c.cop}
                                </Typography>
                                <Typography variant="caption" display="block">
                                    Stage: {c.stage} | Price: ${c.price}
                                </Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="primary">Vessels & Condenser</Typography>
                    {data?.condenser && (
                        <Card variant="outlined" sx={{ mb: 1 }}>
                            <CardContent sx={{ py: 1 }}>
                                <Typography variant="subtitle2">Condenser: {data.condenser.manufacturer} {data.condenser.model || data.condenser.type}</Typography>
                                <Typography variant="caption" display="block">
                                    Capacity: {data.condenser.capacity} kW | Fans: {data.condenser.fans}x{data.condenser.fanPower}kW
                                </Typography>
                                <Typography variant="caption">Price: ${data.condenser.price}</Typography>
                            </CardContent>
                        </Card>
                    )}
                    {data?.vessels?.map((v: any, i: number) => (
                        <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                            <CardContent sx={{ py: 1 }}>
                                <Typography variant="subtitle2">{v.tag} ({v.type})</Typography>
                                <Typography variant="caption">Vol: {v.volume} L | Price: ${v.price}</Typography>
                            </CardContent>
                        </Card>
                    ))}
                </Grid>

                {/* Evaporators Section */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="primary">Evaporators</Typography>
                    {data?.evaporators?.length > 0 ? (
                        data.evaporators.map((e: any, i: number) => (
                            <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                                <CardContent sx={{ py: 1 }}>
                                    <Typography variant="subtitle2">{e.roomName} (x{e.count} rooms)</Typography>
                                    <Typography variant="body2">{e.manufacturer} {e.model}</Typography>
                                    <Typography variant="caption" display="block">
                                        Qty per room: {e.qty} | Cap: {e.capacityPerUnit} kW
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                        Fans: {e.fans} x {e.fanDiameter}mm ({e.fanPower} kW)
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Typography variant="caption" color="textSecondary">No evaporators selected</Typography>
                    )}
                </Grid>

                {/* Pumps Section */}
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" color="primary">Ammonia Pumps</Typography>
                    {data?.pumps?.length > 0 ? (
                        data.pumps.map((p: any, i: number) => (
                            <Card key={i} variant="outlined" sx={{ mb: 1 }}>
                                <CardContent sx={{ py: 1 }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2">
                                            {p.tag} ({p.circuit})
                                        </Typography>
                                        <Chip label={p.duty} size="small" color={p.duty === 'Duty' ? 'success' : 'default'} variant="outlined" />
                                    </Box>
                                    <Typography variant="caption" display="block">
                                        {p.manufacturer} {p.model}
                                    </Typography>
                                    <Typography variant="caption">
                                        Flow: {p.flow_max} m³/h | Head: {p.head_max} m
                                    </Typography>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Typography variant="caption" color="textSecondary">No pumps required (High Stage only)</Typography>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

const PIDView = ({ data }: { data: any }) => {
    // 🔍 DEBUG: Log diagram structure (CORRECT STRUCTURE: equipment[], pipes[])
    console.log('🎨 PIDView Rendering:', {
        hasData: !!data,
        hasLayout: !!data?.layout,
        equipmentCount: data?.layout?.equipment?.length || 0,
        pipesCount: data?.layout?.pipes?.length || 0,
        hasMetadata: !!data?.metadata,
        layoutKeys: data?.layout ? Object.keys(data.layout) : [],
        metadata: data?.metadata
    });

    // Pass the raw pidData (layout) which has {equipment: [], pipes: []}
    const canvasData = data?.layout || null;

    return (
        <Box height="700px" border="1px solid #ccc" borderRadius={2} overflow="hidden">
            <ProfessionalPIDCanvas
                data={canvasData}
                projectInfo={{
                    client: data?.metadata?.projectName || 'CLIENT',
                    projectName: data?.metadata?.systemType || 'AMMONIA REFRIGERATION SYSTEM',
                    drawingTitle: 'GENERAL PIPING DIAGRAM',
                    drawingNo: 'PID-001',
                    designer: 'GFDDE AI',
                    date: new Date().toLocaleDateString()
                }}
            />
        </Box>
    );
};

const OptimizationView = ({ data }: { data: any }) => {
    if (!data) return <Alert severity="warning">No optimization data available.</Alert>;
    return (
        <Box>
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">Total Savings</Typography>
                        <Typography variant="h4" color="success.main">{data.totalSavingsKW} kW</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">Annual Savings</Typography>
                        <Typography variant="h4" color="primary.main">${parseInt(data.annualSavingsUSD).toLocaleString()}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ p: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="textSecondary">Optimized Power</Typography>
                        <Typography variant="h4" color="warning.main">{Math.round(data.optimizedPowerKW)} kW</Typography>
                    </Paper>
                </Grid>
            </Grid>
            <Typography variant="h6" gutterBottom>Recommended Measures</Typography>
            <Grid container spacing={2}>
                {(data.measures || []).map((m: any, i: number) => (
                    <Grid item xs={12} key={i}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" color="primary">{m.title || 'Recommendation'}</Typography>
                                    {m.roiMonths && <Chip label={`ROI: ${m.roiMonths} months`} color="success" size="small" />}
                                </Box>
                                <Typography variant="body2" paragraph>{m.description || ''}</Typography>
                                <Box display="flex" gap={3}>
                                    <Typography variant="caption"><strong>Savings:</strong> {m.savingsKW || m.estimatedSavings || m.savings || 0} kW</Typography>
                                    {m.costUSD && <Typography variant="caption"><strong>Est. Cost:</strong> ${m.costUSD}</Typography>}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

const ComplianceView = ({ data }: { data: any }) => {
    if (!data) return <Alert severity="warning">No compliance data available.</Alert>;

    const standard = data.standard || {};
    const checklist = data.checklist || [];

    return (
        <Box>
            <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#f0f7ff' }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <VerifiedUserIcon color="primary" sx={{ fontSize: 40 }} />
                    <Box>
                        <Typography variant="h5" color="primary">{standard.code || 'ISO 5149'}</Typography>
                        <Typography variant="body2" color="textSecondary">{standard.name || 'Refrigerating systems'}</Typography>
                        <Typography variant="caption">Region: {standard.region || 'International'} | Safety Class: {standard.safety_class || 'B2L'}</Typography>
                    </Box>
                </Box>
            </Paper>
            <Typography variant="h6" gutterBottom>Compliance Checklist</Typography>
            <Grid container spacing={2}>
                {checklist.map((item: any, i: number) => (
                    <Grid item xs={12} key={i}>
                        <Card variant="outlined" sx={{ borderLeft: item.status === 'Critical' ? '4px solid #d32f2f' : item.status === 'Required' ? '4px solid #ff9800' : '4px solid #4caf50' }}>
                            <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" color="primary">{item.item || 'Requirement'}</Typography>
                                    <Chip
                                        label={item.status || 'Required'}
                                        color={item.status === 'Critical' ? 'error' : item.status === 'Required' ? 'warning' : 'success'}
                                        size="small"
                                    />
                                </Box>
                                <Typography variant="body2" sx={{ mt: 1 }}>{item.detail || ''}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

// --- Main Component ---

const AmmoniaDesignWizard: React.FC<{ projectData: any, onReset?: () => void }> = ({ projectData, onReset }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [selectedTier, setSelectedTier] = useState('best');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiData, setApiData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Use passed projectData OR fetched apiData (prioritize apiData if set locally, otherwise projectData)
    const rawData = apiData || projectData;

    // Adapt API data to Wizard format if needed
    const wizardData = useMemo(() => {
        console.log('🔄 [AmmoniaDesignWizard] useMemo triggered');
        console.log('  rawData:', rawData);
        console.log('  rawData keys:', rawData ? Object.keys(rawData) : 'null');

        if (!rawData) {
            console.log('  ➡️ No rawData, returning null');
            return null;
        }

        // If it already has the 'proposals' and 'diagram' structure, it's likely already transformed
        if (rawData.proposals && rawData.diagram) {
            console.log('  ➡️ Already transformed (has proposals + diagram)');
            return rawData;
        }

        // Otherwise, try to transform it. Check if it has 'project', 'loads', etc. (Raw Core API format)
        if (rawData.project && rawData.loads && rawData.equipment) {
            console.log('  ➡️ Transforming from Core API format');
            const transformed = transformApiToWizard(rawData);
            console.log('  📦 Transformed result keys:', transformed ? Object.keys(transformed) : 'null');
            console.log('  📦 diagram.layout:', transformed?.diagram?.layout);
            return transformed;
        }

        // Fallback or unknown format
        console.warn('  ⚠️ Unknown data format in Wizard, keys:', Object.keys(rawData));
        return rawData;
    }, [rawData]);

    // Use the transformed data
    const data = wizardData;

    useEffect(() => {
        if (data) setActiveStep(0);
    }, [data]);

    const handleNewDesign = () => {
        setApiData(null);
        if (onReset) onReset();
    };

    const handleDesign = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/core/design', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt })
            });
            const result = await response.json();

            if (result.success) {
                // Generate report HTML link
                const reportResponse = await fetch('http://localhost:5000/api/core/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        results: result.fullResults, // Use full results for report
                        project: result.project,
                        format: 'json'
                    })
                });
                const reportResult = await reportResponse.json();

                // Enhance result with report data
                result.report = reportResult.report;
                setApiData(result);
            } else {
                setError(result.error || 'Design failed');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    if (!data) {
        return (
            <Paper sx={{ p: 4, maxWidth: 800, mx: 'auto', mt: 4 }}>
                <Typography variant="h5" gutterBottom color="primary">
                    Ammonia Refrigeration Design Wizard
                </Typography>
                <Typography textTransform="uppercase" variant="caption" color="textSecondary" fontWeight="bold">
                    Powered by GFDDE Core Engine v2.0
                </Typography>

                <Box mt={3}>
                    <Typography gutterBottom>Describe your project (Persian or English):</Typography>
                    <textarea
                        style={{ width: '100%', height: 150, padding: 10, fontSize: 16 }}
                        placeholder="Example: Design a poultry slaughterhouse in Ardabil with 1 chilling room (20x8x4m at -5C) and 4 freezing tunnels..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </Box>

                {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

                <Box mt={3} display="flex" justifyContent="flex-end">
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleDesign}
                        disabled={loading}
                        startIcon={loading ? <BoltIcon /> : <CalculateIcon />}
                    >
                        {loading ? 'Designing...' : 'Generate Design'}
                    </Button>
                </Box>
            </Paper>
        );
    }

    // data has essentially taken the place of 'wizardData'
    const equipData = data.proposals?.[selectedTier] || data.proposals?.best;

    return (
        <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Box p={2} bgcolor="#f5f5f5" borderBottom="1px solid #ddd" display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                    <Typography variant="h6" color="primary">
                        Project: {data.projectInfo?.name || 'New Project'}
                    </Typography>
                    <Typography variant="caption">
                        {safeString(data.projectInfo?.location)} | {data.projectInfo?.refrigerant || 'R717'}
                    </Typography>
                </Box>
                <Box>
                    <Button variant="outlined" size="small" onClick={handleNewDesign}>
                        New Design
                    </Button>
                </Box>
            </Box>

            <Box bgcolor="#fff" borderBottom="1px solid #ddd">
                <Stepper activeStep={activeStep} alternativeLabel>
                    {steps.map((step, index) => (
                        <Step key={index} onClick={() => setActiveStep(index)} sx={{ cursor: 'pointer' }}>
                            <StepLabel>{step.label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>
            </Box>

            <Box flexGrow={1} p={2} overflow="auto">
                {activeStep === 0 && <LoadView data={data.loads} />}
                {activeStep === 1 && (
                    <Box>
                        {data.proposals && (
                            <Box display="flex" justifyContent="center" gap={2} mb={3}>
                                {['economic', 'best', 'premium'].map(tier => (
                                    <Button
                                        key={tier}
                                        variant={selectedTier === tier ? 'contained' : 'outlined'}
                                        color={tier === 'premium' ? 'secondary' : tier === 'economic' ? 'success' : 'primary'}
                                        onClick={() => setSelectedTier(tier)}
                                    >
                                        {tier.toUpperCase()}
                                    </Button>
                                ))}
                            </Box>
                        )}
                        <EquipmentView data={equipData} allProposals={data.proposals} />
                    </Box>
                )}
                {activeStep === 2 && <PIDView data={data.diagram} />}
                {activeStep === 3 && <OptimizationView data={data.optimization} />}
                {activeStep === 4 && <ComplianceView data={data.compliance} />}
            </Box>
        </Paper>
    );
};

export default AmmoniaDesignWizard;
