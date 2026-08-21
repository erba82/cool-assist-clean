/**
 * Evidence-safe energy visualization components.
 *
 * These components intentionally render only documented monthly energy records
 * and explicit equipment nameplate data. They do not infer operating hours,
 * tariff, seasonal load factors, COP, savings, solar contribution, or heat
 * recovery from a design request.
 */

import React, { useMemo } from 'react';
import {
  Alert, Box, Typography, Paper, Chip, Checkbox, FormControlLabel,
  Button, Grid
} from '@mui/material';
import {
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  Bar, Line, ComposedChart
} from 'recharts';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';

type EvidenceOrigin = 'measured' | 'calculated' | 'approved-scenario';

interface MonthlyEnergyPoint {
  month: string;
  actualKwh: number;
  scenarioKwh: number | null;
  actualCost: number | null;
  scenarioCost: number | null;
  actualPeakKw: number | null;
  scenarioPeakKw: number | null;
  origin: EvidenceOrigin;
  source: string;
}

interface AnnualEnergyChartProps {
  data: any;
  simulationData?: any;
}

const finiteNumber = (value: unknown): number | null => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
};

const approvedOrigins = new Set<EvidenceOrigin>(['measured', 'calculated', 'approved-scenario']);

const resolveMonthlyEvidence = (data: any, simulationData?: any): MonthlyEnergyPoint[] => {
  const candidates = [
    simulationData?.monthlyRecords,
    data?.energyManagement?.monthlyRecords,
    data?.energyManagement?.baseline?.monthlyRecords
  ];
  const records = candidates.find((candidate) => Array.isArray(candidate)) || [];

  return records.flatMap((record: any, index: number) => {
    const origin = String(record?.origin || '').toLowerCase() as EvidenceOrigin;
    const actualKwh = finiteNumber(record?.actualKwh ?? record?.measuredKwh ?? record?.energyKwh ?? record?.kwh);
    if (!approvedOrigins.has(origin) || actualKwh === null) return [];

    return [{
      month: String(record?.month || record?.period || `Record ${index + 1}`),
      actualKwh,
      scenarioKwh: finiteNumber(record?.scenarioKwh ?? record?.approvedScenarioKwh),
      actualCost: finiteNumber(record?.actualCost ?? record?.measuredCost),
      scenarioCost: finiteNumber(record?.scenarioCost ?? record?.approvedScenarioCost),
      actualPeakKw: finiteNumber(record?.actualPeakKw ?? record?.measuredPeakKw),
      scenarioPeakKw: finiteNumber(record?.scenarioPeakKw ?? record?.approvedScenarioPeakKw),
      origin,
      source: String(record?.source || record?.meterId || 'Source not documented')
    }];
  });
};

const getExplicitPower = (items: any[], fields: string[]): number | null => {
  if (!items.length) return null;
  const powers = items.map((item) => {
    const raw = fields.map((field) => field.split('.').reduce((value: any, key) => value?.[key], item)).find((value) => value !== undefined && value !== null);
    return finiteNumber(raw);
  });
  return powers.every((power) => power !== null) ? powers.reduce((sum, power) => sum + Number(power), 0) : null;
};

export const AnnualEnergyChart: React.FC<AnnualEnergyChartProps> = ({ data, simulationData }) => {
  const monthlyData = useMemo(() => resolveMonthlyEvidence(data, simulationData), [data, simulationData]);
  const hasScenario = monthlyData.some((point) => point.scenarioKwh !== null);
  const hasActualCost = monthlyData.some((point) => point.actualCost !== null);
  const hasScenarioCost = monthlyData.some((point) => point.scenarioCost !== null);
  const hasPeakEvidence = monthlyData.some((point) => point.actualPeakKw !== null || point.scenarioPeakKw !== null);

  const totals = useMemo(() => {
    const actual = monthlyData.reduce((sum, point) => sum + point.actualKwh, 0);
    const scenarioValues = monthlyData.filter((point) => point.scenarioKwh !== null);
    const scenario = scenarioValues.length === monthlyData.length
      ? scenarioValues.reduce((sum, point) => sum + Number(point.scenarioKwh), 0) : null;
    const actualCostValues = monthlyData.filter((point) => point.actualCost !== null);
    const scenarioCostValues = monthlyData.filter((point) => point.scenarioCost !== null);
    const actualCost = actualCostValues.length === monthlyData.length
      ? actualCostValues.reduce((sum, point) => sum + Number(point.actualCost), 0) : null;
    const scenarioCost = scenarioCostValues.length === monthlyData.length
      ? scenarioCostValues.reduce((sum, point) => sum + Number(point.scenarioCost), 0) : null;
    return { actual, scenario, actualCost, scenarioCost };
  }, [monthlyData]);

  if (!monthlyData.length) {
    return <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" color="primary" gutterBottom>Monthly energy evidence</Typography>
      <Alert severity="warning">No approved monthly energy records are available. Upload or register meter-derived monthly records with `origin` (`measured`, `calculated`, or `approved-scenario`) and a documented source before plotting consumption, cost, demand, or savings.</Alert>
    </Paper>;
  }

  const deltaKwh = totals.scenario === null ? null : totals.actual - totals.scenario;
  const deltaCost = totals.actualCost === null || totals.scenarioCost === null ? null : totals.actualCost - totals.scenarioCost;

  return <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2} gap={2}>
      <Box>
        <Typography variant="h6" color="primary">Monthly energy evidence profile</Typography>
        <Typography variant="caption" color="text.secondary">Records are displayed only when their origin and source are explicitly documented. This is not an 8760-hour simulation.</Typography>
      </Box>
      <Chip size="small" color="success" label={`${monthlyData.length} documented record(s)`} />
    </Box>

    <Grid container spacing={2} sx={{ mb: 3 }}>
      {[
        ['Documented energy', `${(totals.actual / 1000).toFixed(2)} MWh`, 'measured / calculated'],
        ['Approved scenario', totals.scenario === null ? 'Not available' : `${(totals.scenario / 1000).toFixed(2)} MWh`, totals.scenario === null ? 'input-required' : 'approved-scenario'],
        ['Energy delta', deltaKwh === null ? 'Not available' : `${deltaKwh.toLocaleString(undefined, { maximumFractionDigits: 0 })} kWh`, deltaKwh === null ? 'input-required' : 'review-required'],
        ['Cost delta', deltaCost === null ? 'Not available' : deltaCost.toLocaleString(undefined, { maximumFractionDigits: 2 }), deltaCost === null ? 'input-required' : 'review-required']
      ].map(([label, value, status]) => <Grid item xs={6} md={3} key={label}><Paper variant="outlined" sx={{ p: 1.25, textAlign: 'center', height: '100%' }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="h6">{value}</Typography><Typography variant="caption" color="text.secondary">{status}</Typography></Paper></Grid>)}
    </Grid>

    <Typography variant="subtitle2" gutterBottom>Monthly energy (kWh)</Typography>
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" />
        <RechartsTooltip formatter={(value: number, name: string) => [`${Number(value).toLocaleString()} kWh`, name === 'actualKwh' ? 'Documented energy' : 'Approved scenario']} />
        <Legend />
        <Bar dataKey="actualKwh" fill="#1565c0" name="Documented energy" />
        {hasScenario && <Bar dataKey="scenarioKwh" fill="#2e7d32" name="Approved scenario" />}
        {hasActualCost && hasScenarioCost && <Line type="monotone" dataKey="scenarioCost" stroke="#b45309" name="Approved scenario cost" strokeWidth={2} />}
      </ComposedChart>
    </ResponsiveContainer>

    {hasPeakEvidence && <>
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Documented peak demand (kW)</Typography>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <RechartsTooltip formatter={(value: number) => [`${Number(value).toLocaleString()} kW`]} />
          <Legend />
          <Line type="monotone" dataKey="actualPeakKw" stroke="#c62828" name="Documented peak" strokeWidth={2} />
          {hasScenario && <Line type="monotone" dataKey="scenarioPeakKw" stroke="#2e7d32" name="Approved scenario peak" strokeWidth={2} />}
        </ComposedChart>
      </ResponsiveContainer>
    </>}
  </Paper>;
};

interface EnergySankeyProps {
  data: any;
  strategies?: any[];
}

export const EnergySankeyDiagram: React.FC<EnergySankeyProps> = ({ data }) => {
  const compressors = Array.isArray(data?.equipment?.compressors) ? data.equipment.compressors : [];
  const condensers = Array.isArray(data?.equipment?.condensers) ? data.equipment.condensers : [];
  const evaporators = Array.isArray(data?.equipment?.evaporators) ? data.equipment.evaporators : [];
  const pumps = Array.isArray(data?.equipment?.pumps) ? data.equipment.pumps : [];
  const compressorPower = getExplicitPower(compressors, ['electrical.ratedPower', 'electrical.totalPower', 'electricalPower', 'motorPower', 'powerKW']);
  const condenserPower = getExplicitPower(condensers, ['totalElectricalPower', 'electrical.fanMotor', 'electricalPower', 'motorPower', 'powerKW']);
  const evaporatorPower = getExplicitPower(evaporators, ['electrical.ratedPower', 'electricalPower', 'motorPower', 'fanPower']);
  const pumpPower = getExplicitPower(pumps, ['electrical.ratedPower', 'electricalPower', 'motorPower', 'powerKW']);
  const designLoad = finiteNumber(data?.summary?.totalCoolingLoad ?? data?.calculations?.totalCoolingLoad);
  const powerGroups = [compressorPower, condenserPower, evaporatorPower, pumpPower];
  const knownConnectedLoad = powerGroups.reduce((sum, value) => sum + (value === null ? 0 : value), 0);
  const allPowerGroupsDeclared = powerGroups.every((value) => value !== null);
  const designPointRatio = allPowerGroupsDeclared && designLoad !== null && knownConnectedLoad > 0 ? designLoad / knownConnectedLoad : null;

  return <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" color="primary" gutterBottom>Electrical evidence and design-point flow</Typography>
    <Alert severity={allPowerGroupsDeclared && designLoad !== null ? 'info' : 'warning'} sx={{ mb: 2 }}>
      {allPowerGroupsDeclared && designLoad !== null
        ? 'Values below are a design-point ratio derived from declared load and explicit nameplate powers. They are not a measured COP, a savings claim, or a live energy balance.'
        : 'A complete electrical flow cannot be calculated yet. Add explicit nameplate power for compressors, condensers, evaporators and pumps, plus the declared design load.'}
    </Alert>

    <Grid container spacing={1.25}>
      {[
        ['Compressors', compressorPower], ['Condensers', condenserPower], ['Evaporators', evaporatorPower], ['Pumps', pumpPower]
      ].map(([label, value]) => <Grid item xs={6} md={3} key={String(label)}><Paper variant="outlined" sx={{ p: 1.25, textAlign: 'center' }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="h6">{value === null ? 'Input required' : `${Number(value).toLocaleString()} kW`}</Typography><Typography variant="caption">explicit nameplate only</Typography></Paper></Grid>)}
    </Grid>

    <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f8fafc', borderRadius: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Known declared connected load</Typography><Typography variant="h6">{knownConnectedLoad > 0 ? `${knownConnectedLoad.toLocaleString()} kW` : 'Input required'}</Typography></Grid>
        <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Declared design cooling load</Typography><Typography variant="h6">{designLoad === null ? 'Input required' : `${designLoad.toLocaleString()} kW`}</Typography></Grid>
        <Grid item xs={12} md={4}><Typography variant="caption" color="text.secondary">Design-point load / electrical ratio</Typography><Typography variant="h6">{designPointRatio === null ? 'Review required' : designPointRatio.toFixed(2)}</Typography></Grid>
      </Grid>
    </Box>
  </Paper>;
};

interface StrategySelectionProps {
  strategies: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const StrategySelection: React.FC<StrategySelectionProps> = ({ strategies, selectedIds, onSelectionChange }) => {
  const handleToggle = (id: string) => onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((selected) => selected !== id) : [...selectedIds, id]);
  const handleSelectAll = () => onSelectionChange(strategies.map((strategy) => strategy.id));
  const handleClearAll = () => onSelectionChange([]);
  const selectedStrategies = strategies.filter((strategy) => selectedIds.includes(strategy.id));

  const getPriorityColor = (priority: string) => priority === 'high' ? '#4caf50' : priority === 'medium' ? '#ff9800' : priority === 'low' ? '#9e9e9e' : '#2196f3';

  return <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="h6" color="primary">Select energy measures for review</Typography>
      <Box><Button startIcon={<SelectAllIcon />} size="small" onClick={handleSelectAll} sx={{ mr: 1 }}>Select all</Button><Button startIcon={<ClearAllIcon />} size="small" onClick={handleClearAll}>Clear</Button></Box>
    </Box>
    <Alert severity="info" sx={{ mb: 2 }}>Selection records review candidates only. Savings, payback, tariff and carbon claims require site evidence and an approved M&amp;V plan.</Alert>
    <Grid container spacing={2}>
      {strategies.map((strategy) => <Grid item xs={12} md={6} key={strategy.id}><Paper variant="outlined" sx={{ p: 2, borderColor: selectedIds.includes(strategy.id) ? 'primary.main' : 'divider', borderWidth: selectedIds.includes(strategy.id) ? 2 : 1, cursor: 'pointer' }} onClick={() => handleToggle(strategy.id)}><Box display="flex" alignItems="start"><Checkbox checked={selectedIds.includes(strategy.id)} onChange={() => handleToggle(strategy.id)} sx={{ mt: -0.5, mr: 1 }} /><Box flex={1}><Box display="flex" justifyContent="space-between" alignItems="center"><Typography variant="subtitle2">{strategy.name}</Typography><Chip label={strategy.priority?.toUpperCase() || 'MEDIUM'} size="small" sx={{ bgcolor: getPriorityColor(strategy.priority), color: 'white' }} /></Box><Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>{strategy.description || 'Candidate measure; site evidence and M&V review required.'}</Typography></Box></Box></Paper></Grid>)}
    </Grid>
    {selectedIds.length > 0 && <Paper sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9' }}><Typography variant="subtitle2">Selected: {selectedIds.length} of {strategies.length} review candidate(s)</Typography><Typography variant="caption" color="text.secondary">No aggregated savings, payback or cost is stated until approved site evidence is attached.</Typography></Paper>}
  </Paper>;
};

export default { AnnualEnergyChart, EnergySankeyDiagram, StrategySelection };
