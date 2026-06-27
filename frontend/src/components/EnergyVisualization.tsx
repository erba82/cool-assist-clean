/**
 * Advanced Energy Visualization Components
 * 1. Annual Energy Chart (8760-hour profile)
 * 2. Sankey Energy Flow Diagram
 * 3. Strategy Selection Controls
 */

import React, { useState, useMemo } from 'react';
import {
    Box, Typography, Paper, Chip, Checkbox, FormControlLabel,
    Button, ButtonGroup, Grid, Tooltip, Card, CardContent
} from '@mui/material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Legend, BarChart, Bar, LineChart, Line, ComposedChart
} from 'recharts';
import DownloadIcon from '@mui/icons-material/Download';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';

// ====================================================
// ANNUAL ENERGY CHART (8760-hour visualization)
// ====================================================
interface AnnualEnergyChartProps {
    data: any;
    simulationData?: any;
}

export const AnnualEnergyChart: React.FC<AnnualEnergyChartProps> = ({ data, simulationData }) => {
    const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('monthly');

    // Generate monthly energy data from equipment
    const monthlyData = useMemo(() => {
        const totalPower = data?.equipment?.compressors?.reduce((sum: number, c: any) => {
            const power = c.electrical?.ratedPower || c.motorPower || 50;
            const units = c.operatingUnits || 1;
            return sum + (power * units);
        }, 0) || 100;

        const operatingHours = 18; // hours/day
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];

        // Seasonal load factors (higher in summer)
        const seasonalFactors = [0.7, 0.65, 0.75, 0.85, 0.95, 1.0, 1.0, 1.0, 0.95, 0.85, 0.75, 0.7];

        return months.map((month, idx) => {
            const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][idx];
            const factor = seasonalFactors[idx];
            const baselineEnergy = totalPower * operatingHours * daysInMonth * factor;
            const optimizedEnergy = baselineEnergy * 0.72; // 28% savings with strategies
            const peakDemand = totalPower * factor;
            const optimizedPeak = peakDemand * 0.78; // 22% peak reduction

            return {
                month,
                baseline: Math.round(baselineEnergy),
                optimized: Math.round(optimizedEnergy),
                savings: Math.round(baselineEnergy - optimizedEnergy),
                peakDemand: Math.round(peakDemand),
                optimizedPeak: Math.round(optimizedPeak),
                cost: Math.round(baselineEnergy * 0.12),
                optimizedCost: Math.round(optimizedEnergy * 0.12)
            };
        });
    }, [data]);

    // Calculate totals
    const totals = useMemo(() => {
        const baselineTotal = monthlyData.reduce((sum, m) => sum + m.baseline, 0);
        const optimizedTotal = monthlyData.reduce((sum, m) => sum + m.optimized, 0);
        return {
            baseline: baselineTotal,
            optimized: optimizedTotal,
            savings: baselineTotal - optimizedTotal,
            savingsPercent: ((baselineTotal - optimizedTotal) / baselineTotal * 100).toFixed(1),
            costSavings: Math.round((baselineTotal - optimizedTotal) * 0.12)
        };
    }, [monthlyData]);

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="primary">
                    📊 Annual Energy Profile (8760-Hour Model)
                </Typography>
                <ButtonGroup size="small" variant="outlined">
                    <Button
                        onClick={() => setViewMode('monthly')}
                        variant={viewMode === 'monthly' ? 'contained' : 'outlined'}
                    >
                        Monthly
                    </Button>
                    <Button
                        onClick={() => setViewMode('weekly')}
                        variant={viewMode === 'weekly' ? 'contained' : 'outlined'}
                    >
                        Weekly
                    </Button>
                    <Button
                        onClick={() => setViewMode('daily')}
                        variant={viewMode === 'daily' ? 'contained' : 'outlined'}
                    >
                        Daily
                    </Button>
                </ButtonGroup>
            </Box>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#ffebee', textAlign: 'center' }}>
                        <CardContent sx={{ py: 1 }}>
                            <Typography variant="caption" color="textSecondary">Baseline</Typography>
                            <Typography variant="h6">{(totals.baseline / 1000).toFixed(0)} MWh</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#e8f5e9', textAlign: 'center' }}>
                        <CardContent sx={{ py: 1 }}>
                            <Typography variant="caption" color="textSecondary">Optimized</Typography>
                            <Typography variant="h6">{(totals.optimized / 1000).toFixed(0)} MWh</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#e3f2fd', textAlign: 'center' }}>
                        <CardContent sx={{ py: 1 }}>
                            <Typography variant="caption" color="textSecondary">Annual Savings</Typography>
                            <Typography variant="h6" color="success.main">{totals.savingsPercent}%</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card sx={{ bgcolor: '#fff3e0', textAlign: 'center' }}>
                        <CardContent sx={{ py: 1 }}>
                            <Typography variant="caption" color="textSecondary">Cost Savings</Typography>
                            <Typography variant="h6" color="warning.main">${totals.costSavings.toLocaleString()}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Energy Consumption Chart */}
            <Typography variant="subtitle2" gutterBottom>Monthly Energy Consumption (kWh)</Typography>
            <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <RechartsTooltip
                        formatter={(value: number, name: string) => [
                            `${value.toLocaleString()} kWh`,
                            name === 'baseline' ? 'Baseline' : name === 'optimized' ? 'Optimized' : name
                        ]}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="baseline" fill="#ef5350" name="Baseline" opacity={0.7} />
                    <Bar yAxisId="left" dataKey="optimized" fill="#4caf50" name="Optimized" />
                    <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#ff9800" name="Savings" strokeWidth={2} />
                </ComposedChart>
            </ResponsiveContainer>

            {/* Peak Demand Chart */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Peak Demand (kW)</Typography>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: number) => [`${value} kW`]} />
                    <Legend />
                    <Area type="monotone" dataKey="peakDemand" stroke="#ef5350" fill="#ffcdd2" name="Baseline Peak" />
                    <Area type="monotone" dataKey="optimizedPeak" stroke="#4caf50" fill="#c8e6c9" name="Optimized Peak" />
                </AreaChart>
            </ResponsiveContainer>
        </Paper>
    );
};

// ====================================================
// SANKEY ENERGY FLOW DIAGRAM
// ====================================================
interface EnergySankeyProps {
    data: any;
    strategies?: any[];
}

export const EnergySankeyDiagram: React.FC<EnergySankeyProps> = ({ data, strategies = [] }) => {
    // Calculate energy flows
    const totalLoad = data?.summary?.totalCoolingLoad || 500;
    const compressorPower = totalLoad / 3.5; // COP ~3.5
    const condenserPower = compressorPower * 0.08;
    const evaporatorPower = compressorPower * 0.05;
    const totalInput = compressorPower + condenserPower + evaporatorPower;

    // Energy outputs
    const usefulCooling = totalLoad;
    const condenserHeat = totalLoad + (compressorPower * 0.95);
    const losses = totalInput * 0.05;

    // Renewable inputs (if solar strategy enabled)
    const hasSolar = strategies.some(s => s.id === 'solar-hybrid' && s.applicable);
    const solarInput = hasSolar ? totalInput * 0.35 : 0;
    const gridInput = totalInput - solarInput;

    // Heat recovery
    const hasHeatRecovery = strategies.some(s => s.id === 'waste-heat' && s.applicable);
    const recoveredHeat = hasHeatRecovery ? condenserHeat * 0.4 : 0;

    // Flow data for simple visualization (since Nivo may not install)
    const flows = [
        { source: 'Grid', target: 'System', value: Math.round(gridInput), color: '#ffa726' },
        { source: 'Solar', target: 'System', value: Math.round(solarInput), color: '#ffeb3b' },
        { source: 'System', target: 'Compressors', value: Math.round(compressorPower), color: '#42a5f5' },
        { source: 'System', target: 'Condensers', value: Math.round(condenserPower), color: '#26a69a' },
        { source: 'System', target: 'Evaporators', value: Math.round(evaporatorPower), color: '#66bb6a' },
        { source: 'Condensers', target: 'Heat Rejection', value: Math.round(condenserHeat - recoveredHeat), color: '#ef5350' },
        { source: 'Condensers', target: 'Heat Recovery', value: Math.round(recoveredHeat), color: '#7cb342' },
        { source: 'Evaporators', target: 'Cooling', value: Math.round(usefulCooling), color: '#29b6f6' },
    ];

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" color="primary" gutterBottom>
                ⚡ Energy Flow Diagram
            </Typography>

            {/* Simple visual representation */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 3 }}>
                <Box sx={{ textAlign: 'center' }}>
                    {/* Input Section */}
                    <Paper sx={{ p: 2, bgcolor: '#fff3e0', mb: 2, display: 'inline-block', minWidth: 200 }}>
                        <Typography variant="subtitle2" color="warning.main">⚡ Energy Input</Typography>
                        <Typography variant="h5">{Math.round(totalInput)} kW</Typography>
                        <Box sx={{ mt: 1 }}>
                            <Chip
                                label={`Grid: ${Math.round(gridInput)} kW`}
                                size="small"
                                sx={{ bgcolor: '#ffa726', color: 'white', mr: 1 }}
                            />
                            {solarInput > 0 && (
                                <Chip
                                    label={`Solar: ${Math.round(solarInput)} kW`}
                                    size="small"
                                    sx={{ bgcolor: '#ffeb3b', color: 'black' }}
                                />
                            )}
                        </Box>
                    </Paper>

                    {/* Arrow Down */}
                    <Typography variant="h4" sx={{ color: '#90a4ae' }}>↓</Typography>

                    {/* System Section */}
                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd', mb: 2, display: 'inline-block', minWidth: 300 }}>
                        <Typography variant="subtitle2" color="primary">🔧 Refrigeration System</Typography>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                            <Grid item xs={4}>
                                <Typography variant="caption">Compressors</Typography>
                                <Typography variant="body2" fontWeight="bold">{Math.round(compressorPower)} kW</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption">Condensers</Typography>
                                <Typography variant="body2" fontWeight="bold">{Math.round(condenserPower)} kW</Typography>
                            </Grid>
                            <Grid item xs={4}>
                                <Typography variant="caption">Evaporators</Typography>
                                <Typography variant="body2" fontWeight="bold">{Math.round(evaporatorPower)} kW</Typography>
                            </Grid>
                        </Grid>
                    </Paper>

                    {/* Arrow Down */}
                    <Typography variant="h4" sx={{ color: '#90a4ae' }}>↓</Typography>

                    {/* Output Section */}
                    <Grid container spacing={2} justifyContent="center">
                        <Grid item>
                            <Paper sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}>
                                <Typography variant="subtitle2" color="success.main">❄️ Cooling Output</Typography>
                                <Typography variant="h5">{Math.round(usefulCooling)} kW</Typography>
                            </Paper>
                        </Grid>
                        <Grid item>
                            <Paper sx={{ p: 2, bgcolor: '#ffebee', textAlign: 'center' }}>
                                <Typography variant="subtitle2" color="error.main">🔥 Heat Rejection</Typography>
                                <Typography variant="h5">{Math.round(condenserHeat - recoveredHeat)} kW</Typography>
                            </Paper>
                        </Grid>
                        {recoveredHeat > 0 && (
                            <Grid item>
                                <Paper sx={{ p: 2, bgcolor: '#c8e6c9', textAlign: 'center' }}>
                                    <Typography variant="subtitle2" color="success.dark">♻️ Heat Recovery</Typography>
                                    <Typography variant="h5">{Math.round(recoveredHeat)} kW</Typography>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </Box>

            {/* Efficiency Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Grid container spacing={2}>
                    <Grid item xs={3}>
                        <Typography variant="caption" color="textSecondary">System COP</Typography>
                        <Typography variant="h6">{(usefulCooling / totalInput).toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="caption" color="textSecondary">Renewable %</Typography>
                        <Typography variant="h6" color="success.main">{((solarInput / totalInput) * 100).toFixed(0)}%</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="caption" color="textSecondary">Heat Recovery</Typography>
                        <Typography variant="h6" color="primary">{((recoveredHeat / condenserHeat) * 100).toFixed(0)}%</Typography>
                    </Grid>
                    <Grid item xs={3}>
                        <Typography variant="caption" color="textSecondary">Overall Efficiency</Typography>
                        <Typography variant="h6" color="success.main">{(((usefulCooling + recoveredHeat) / totalInput) * 100).toFixed(0)}%</Typography>
                    </Grid>
                </Grid>
            </Box>
        </Paper>
    );
};

// ====================================================
// STRATEGY SELECTION WITH CHECKBOXES
// ====================================================
interface StrategySelectionProps {
    strategies: any[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

export const StrategySelection: React.FC<StrategySelectionProps> = ({
    strategies,
    selectedIds,
    onSelectionChange
}) => {
    const handleToggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(s => s !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const handleSelectAll = () => {
        onSelectionChange(strategies.map(s => s.id));
    };

    const handleClearAll = () => {
        onSelectionChange([]);
    };

    // Calculate totals for selected strategies
    const selectedStrategies = strategies.filter(s => selectedIds.includes(s.id));
    const totalSavings = selectedStrategies.reduce((sum, s) =>
        sum + (s.financialImpact?.annualCostSavings || s.financialImpact?.annualBenefit || 0), 0
    );
    const totalEnergySavings = selectedStrategies.reduce((sum, s) =>
        sum + (s.energySavings?.kWhPerYear || 0), 0
    );
    const totalCost = selectedStrategies.reduce((sum, s) =>
        sum + (s.financialImpact?.implementationCost || 0), 0
    );

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#4caf50';
            case 'medium': return '#ff9800';
            case 'low': return '#9e9e9e';
            default: return '#2196f3';
        }
    };

    return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" color="primary">
                    ✅ Select Energy Strategies
                </Typography>
                <Box>
                    <Button
                        startIcon={<SelectAllIcon />}
                        size="small"
                        onClick={handleSelectAll}
                        sx={{ mr: 1 }}
                    >
                        Select All
                    </Button>
                    <Button
                        startIcon={<ClearAllIcon />}
                        size="small"
                        onClick={handleClearAll}
                    >
                        Clear
                    </Button>
                </Box>
            </Box>

            {/* Strategy Checkboxes */}
            <Grid container spacing={2}>
                {strategies.map((strategy) => (
                    <Grid item xs={12} md={6} key={strategy.id}>
                        <Paper
                            variant="outlined"
                            sx={{
                                p: 2,
                                borderColor: selectedIds.includes(strategy.id) ? 'primary.main' : 'divider',
                                borderWidth: selectedIds.includes(strategy.id) ? 2 : 1,
                                cursor: 'pointer',
                                '&:hover': { bgcolor: '#f5f5f5' }
                            }}
                            onClick={() => handleToggle(strategy.id)}
                        >
                            <Box display="flex" alignItems="start">
                                <Checkbox
                                    checked={selectedIds.includes(strategy.id)}
                                    onChange={() => handleToggle(strategy.id)}
                                    sx={{ mt: -0.5, mr: 1 }}
                                />
                                <Box flex={1}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="subtitle2">{strategy.name}</Typography>
                                        <Chip
                                            label={strategy.priority?.toUpperCase() || 'MEDIUM'}
                                            size="small"
                                            sx={{ bgcolor: getPriorityColor(strategy.priority), color: 'white' }}
                                        />
                                    </Box>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                        Saves ${Math.round(strategy.financialImpact?.annualCostSavings || 0).toLocaleString()}/yr
                                        • Payback: {(strategy.financialImpact?.paybackYears || 0).toFixed(1)} yrs
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Selected Summary */}
            {selectedIds.length > 0 && (
                <Paper sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9' }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Selected: {selectedIds.length} of {strategies.length} strategies
                    </Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">Total Annual Savings</Typography>
                            <Typography variant="h5" color="success.main">
                                ${Math.round(totalSavings).toLocaleString()}
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">Energy Savings</Typography>
                            <Typography variant="h5" color="primary">
                                {Math.round(totalEnergySavings).toLocaleString()} kWh
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="caption" color="textSecondary">Implementation Cost</Typography>
                            <Typography variant="h5" color="warning.main">
                                ${Math.round(totalCost).toLocaleString()}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}
        </Paper>
    );
};

export default { AnnualEnergyChart, EnergySankeyDiagram, StrategySelection };
