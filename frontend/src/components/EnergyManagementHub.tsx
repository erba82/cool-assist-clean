import React, { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Divider, Grid, Paper, Table, TableBody, TableCell,
  TableHead, TableRow, TextField, Typography
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';

interface EnergyManagementHubProps { data: any; }

type Origin = 'measured' | 'calculated' | 'scenario' | 'input-required' | 'review-required';

const dash = (value: unknown, unit = '') => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}` : String(value);
};

const originColor: Record<Origin, 'success' | 'info' | 'warning' | 'default'> = {
  measured: 'success', calculated: 'info', scenario: 'info', 'input-required': 'warning', 'review-required': 'warning'
};

const getExplicitElectricalPower = (data: any) => {
  const compressors = Array.isArray(data?.equipment?.compressors) ? data.equipment.compressors : [];
  const condensers = Array.isArray(data?.equipment?.condensers) ? data.equipment.condensers : [];
  const evaporators = Array.isArray(data?.equipment?.evaporators) ? data.equipment.evaporators : [];
  const pumps = Array.isArray(data?.equipment?.pumps) ? data.equipment.pumps : [];
  const records = [...compressors, ...condensers, ...evaporators, ...pumps];
  const powers = records.map((item: any) => Number(item?.electrical?.ratedPower ?? item?.electricalPower ?? item?.motorPower ?? item?.powerKW));
  return powers.length > 0 && powers.every((power) => Number.isFinite(power) && power >= 0)
    ? powers.reduce((sum, power) => sum + power, 0) : null;
};

const EnergyManagementHub: React.FC<EnergyManagementHubProps> = ({ data }) => {
  const management = data?.energyManagement || data?.energyManagementPlan || {};
  const baseline = management?.baseline || {};
  const meters = Array.isArray(management?.meters) ? management.meters : [];
  const enpis = Array.isArray(management?.enpis) ? management.enpis : [];
  const actions = Array.isArray(management?.actions) ? management.actions : [];
  const existingRecommendations = Array.isArray(data?.innovativeEnergyStrategies?.strategies)
    ? data.innovativeEnergyStrategies.strategies : [];
  const explicitPower = useMemo(() => getExplicitElectricalPower(data), [data]);
  const [annualHours, setAnnualHours] = useState('');
  const [tariff, setTariff] = useState('');
  const [annualThroughput, setAnnualThroughput] = useState('');

  const scenario = useMemo(() => {
    const hours = Number(annualHours);
    const rate = Number(tariff);
    const throughput = Number(annualThroughput);
    const canCalculateKwh = explicitPower !== null && Number.isFinite(hours) && hours > 0;
    const annualKwh = canCalculateKwh ? explicitPower * hours : null;
    const annualCost = annualKwh !== null && Number.isFinite(rate) && rate >= 0 ? annualKwh * rate : null;
    const enpi = annualKwh !== null && Number.isFinite(throughput) && throughput > 0 ? annualKwh / throughput : null;
    return { annualKwh, annualCost, enpi };
  }, [annualHours, tariff, annualThroughput, explicitPower]);

  const printHub = () => window.print();
  const baselineOrigin: Origin = baseline?.origin || (baseline?.annualKwh ? 'measured' : 'input-required');
  const actionRows = actions.length ? actions : [
    { id: 'energy-boundary', name: 'Define energy boundary and baseline period', owner: 'Project energy manager', status: 'input-required', evidence: 'Meter IDs, boundary and baseline dates are required.' },
    { id: 'meter-coverage', name: 'Establish sub-meter coverage', owner: 'Electrical/controls engineer', status: 'input-required', evidence: 'Compressor, condenser, evaporator/pump and facility meter coverage is required.' },
    { id: 'm-and-v', name: 'Prepare M&V plan before savings claim', owner: 'Energy reviewer', status: 'review-required', evidence: 'Define relevant variables, comparison period and approval workflow.' }
  ];

  return <Box className="energy-management-hub" sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0b2942' }}>Energy Management Hub</Typography>
        <Typography variant="body2" color="text.secondary">Baseline, EnPI, action ownership and scenario analysis are separated. Savings are not shown until data and an M&amp;V review exist.</Typography>
      </Box>
      <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={printHub}>Print energy record</Button>
    </Box>

    <Alert severity="info" sx={{ mb: 2 }}>This dashboard is aligned for energy-management review. It does not claim ISO 50001/50006 compliance or measured savings without approved boundary, meter and baseline records.</Alert>

    <Grid container spacing={1.25} sx={{ mb: 2 }}>
      {[
        ['Baseline', baseline?.annualKwh ? dash(baseline.annualKwh, ' kWh') : 'Input required', baselineOrigin],
        ['Meter coverage', meters.length ? `${meters.length} declared meter(s)` : 'Input required', meters.length ? 'measured' : 'input-required'],
        ['Electrical connected load', explicitPower === null ? 'Review required' : dash(explicitPower, ' kW'), explicitPower === null ? 'review-required' : 'calculated'],
        ['Active actions', `${actionRows.length}`, actionRows.some((item: any) => item.status === 'input-required') ? 'input-required' : 'review-required']
      ].map(([label, value, origin]) => <Grid item xs={6} md={3} key={String(label)}><Paper variant="outlined" sx={{ p: 1.25, height: '100%' }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 900, mt: .25 }}>{value}</Typography><Chip size="small" label={String(origin)} color={originColor[String(origin) as Origin]} sx={{ mt: .75 }} /></Paper></Grid>)}
    </Grid>

    <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Baseline and meter register</Typography>
      <Table size="small"><TableHead><TableRow><TableCell>Field</TableCell><TableCell>Value</TableCell><TableCell>Origin / status</TableCell><TableCell>Evidence</TableCell></TableRow></TableHead><TableBody>
        <TableRow><TableCell>Baseline period</TableCell><TableCell>{baseline?.period || '—'}</TableCell><TableCell><Chip size="small" label={baselineOrigin} color={originColor[baselineOrigin]} /></TableCell><TableCell>{baseline?.source || 'Provide meter interval source, time zone and quality check.'}</TableCell></TableRow>
        <TableRow><TableCell>Energy boundary</TableCell><TableCell>{baseline?.boundary || '—'}</TableCell><TableCell><Chip size="small" label={baseline?.boundary ? 'review-required' : 'input-required'} color="warning" /></TableCell><TableCell>Define included compressors, condensers, evaporators, pumps and auxiliaries.</TableCell></TableRow>
        {meters.map((meter: any, index: number) => <TableRow key={meter.id || index}><TableCell>{meter.name || meter.id || `Meter ${index + 1}`}</TableCell><TableCell>{dash(meter.coverage)}</TableCell><TableCell><Chip size="small" label={meter.status || 'measured'} color="success" /></TableCell><TableCell>{meter.source || 'Meter source not documented'}</TableCell></TableRow>)}
      </TableBody></Table>
    </Paper>

    <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Scenario workbook — explicit inputs only</Typography>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.25 }}>This calculation is a user scenario, not a measured baseline or savings guarantee. It requires explicit electrical nameplate power, operating hours, tariff and optional throughput.</Typography>
      <Grid container spacing={1.25} alignItems="center">
        <Grid item xs={12} md={3}><TextField fullWidth size="small" type="number" label="Annual operating hours" value={annualHours} onChange={(event) => setAnnualHours(event.target.value)} inputProps={{ min: 0 }} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth size="small" type="number" label="Electricity tariff / kWh" value={tariff} onChange={(event) => setTariff(event.target.value)} inputProps={{ min: 0, step: 'any' }} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth size="small" type="number" label="Annual throughput (optional)" value={annualThroughput} onChange={(event) => setAnnualThroughput(event.target.value)} inputProps={{ min: 0, step: 'any' }} /></Grid>
        <Grid item xs={12} md={3}><Box><Typography variant="caption" color="text.secondary">Scenario output</Typography><Typography sx={{ fontWeight: 900 }}>{scenario.annualKwh === null ? 'Input required' : dash(scenario.annualKwh, ' kWh/year')}</Typography><Typography variant="caption">{scenario.annualCost === null ? 'Tariff required for cost' : `${dash(scenario.annualCost)} currency/year`}{scenario.enpi === null ? '' : ` · ${dash(scenario.enpi, ' kWh/unit')}`}</Typography></Box></Grid>
      </Grid>
    </Paper>

    <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Energy performance indicators</Typography>
      <Table size="small"><TableHead><TableRow><TableCell>EnPI</TableCell><TableCell>Value</TableCell><TableCell>Boundary / relevant variable</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>
        {enpis.length ? enpis.map((item: any, index: number) => <TableRow key={item.id || index}><TableCell>{item.name || item.id}</TableCell><TableCell>{dash(item.value, item.unit ? ` ${item.unit}` : '')}</TableCell><TableCell>{item.boundary || item.relevantVariables || '—'}</TableCell><TableCell><Chip size="small" label={item.status || 'review-required'} color={originColor[(item.status || 'review-required') as Origin]} /></TableCell></TableRow>) : <TableRow><TableCell>kWh per cooling output / throughput</TableCell><TableCell>—</TableCell><TableCell>Requires approved meter boundary and relevant-variable data.</TableCell><TableCell><Chip size="small" label="input-required" color="warning" /></TableCell></TableRow>}
      </TableBody></Table>
    </Paper>

    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>Action register and measurement &amp; verification</Typography>
      <Table size="small"><TableHead><TableRow><TableCell>Action</TableCell><TableCell>Owner</TableCell><TableCell>Status</TableCell><TableCell>Evidence / next gate</TableCell></TableRow></TableHead><TableBody>
        {actionRows.map((item: any, index: number) => <TableRow key={item.id || index}><TableCell>{item.name}</TableCell><TableCell>{item.owner || 'Assign owner'}</TableCell><TableCell><Chip size="small" label={item.status || 'review-required'} color={originColor[(item.status || 'review-required') as Origin]} /></TableCell><TableCell>{item.evidence || item.mAndV || 'Review required'}</TableCell></TableRow>)}
        {existingRecommendations.map((item: any, index: number) => <TableRow key={`candidate-${index}`}><TableCell>{item.name || 'Candidate measure'}</TableCell><TableCell>Engineering reviewer</TableCell><TableCell><Chip size="small" label="review-required" color="warning" /></TableCell><TableCell>Legacy recommendation retained as a candidate only; enter site measure, tariff, baseline and M&amp;V evidence before presenting savings or payback.</TableCell></TableRow>)}
      </TableBody></Table>
    </Paper>
    <Divider sx={{ my: 1.5 }} />
    <Typography variant="caption" color="text.secondary">Reference scope: data-driven targets, measurement, review and continual improvement. Project-specific tariff, emission factor, savings and payback require documentary inputs and approval.</Typography>
  </Box>;
};

export default EnergyManagementHub;
