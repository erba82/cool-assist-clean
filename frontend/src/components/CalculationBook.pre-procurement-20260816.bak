import React, { useMemo } from 'react';
import { Alert, Box, Chip, Divider, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

interface Props {
  data: any;
}

const dash = (value: any, suffix = '') => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'number' ? value : Number(value);
  const shown = Number.isFinite(numeric) && String(value).trim() !== '' ? numeric.toLocaleString(undefined, { maximumFractionDigits: 2 }) : String(value);
  return `${shown}${suffix}`;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f3d5e', mb: 1 }}>{title}</Typography>
    <Paper variant="outlined" sx={{ overflow: 'auto' }}>{children}</Paper>
  </Box>
);

const CalculationBook: React.FC<Props> = ({ data }) => {
  const model = useMemo(() => {
    const project = data?.project || data?.projectInfo || {};
    const pid = data?.pidData || data?.pidData2D || {};
    const pidNodes = Array.isArray(pid.nodes) ? pid.nodes : (Array.isArray(pid.equipment) ? pid.equipment : []);
    const pidEdges = Array.isArray(pid.edges) ? pid.edges : (Array.isArray(pid.pipes) ? pid.pipes : []);
    const tags = new Map(pidNodes.map((node: any) => [node.id, node.data?.tag || node.data?.label || node.id]));
    return {
      project,
      refrigerant: project.refrigerant || data?.projectInfo?.refrigerant || pid?.refrigerant || '—',
      loads: Array.isArray(data?.loads) ? data.loads : [],
      equipment: data?.equipment || data?.proposals?.best || {},
      energy: data?.energy || {},
      calculations: data?.calculations || data?.fullResults?.calculations || {},
      pidMetadata: pid?.metadata || {},
      pidEdges,
      tags
    };
  }, [data]);

  const loadTotal = model.loads.reduce((sum: number, item: any) => sum + (Number(item.load || item.total || item.totalLoad) || 0), 0);
  const compressorRows = Array.isArray(model.equipment.compressors) ? model.equipment.compressors : [];
  const condenserRows = Array.isArray(model.equipment.condensers) ? model.equipment.condensers : [];
  const evaporatorRows = Array.isArray(model.equipment.evaporators) ? model.equipment.evaporators : [];
  const vesselRows = [
    ...(Array.isArray(model.equipment.separators) ? model.equipment.separators : []),
    ...(Array.isArray(model.equipment.oilSeparators) ? model.equipment.oilSeparators : []),
    ...(model.equipment.receiver ? [model.equipment.receiver] : [])
  ];

  if (!data) return <Box p={3}><Alert severity="info">No completed design is loaded. Submit and confirm a design request to generate the calculation book.</Alert></Box>;

  return <Box sx={{ p: 1 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0b2942' }}>Engineering Calculation Book</Typography>
        <Typography variant="body2" color="text.secondary">Generated from the active design response. Missing fields are deliberately shown as “—”; they are not replaced with estimated engineering values.</Typography>
      </Box>
      <Chip label={model.refrigerant} color="primary" variant="outlined" sx={{ fontWeight: 800 }} />
    </Box>

    <Grid container spacing={1.25} sx={{ mb: 2 }}>
      {[
        ['Cooling load', dash(data?.summary?.totalCoolingLoad ?? loadTotal, ' kW')],
        ['Rooms', dash(model.project.roomCount ?? model.loads.length)],
        ['Selected compressors', dash(compressorRows.length)],
        ['Generated P&ID lines', dash(model.pidEdges.length)]
      ].map(([label, value]) => <Grid item xs={6} md={3} key={String(label)}><Paper variant="outlined" sx={{ p: 1.2, borderTop: '3px solid #1f6d9a' }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 900 }}>{value}</Typography></Paper></Grid>)}
    </Grid>

    <Section title="1. Design Basis">
      <Table size="small"><TableBody>
        <TableRow><TableCell>Project</TableCell><TableCell>{dash(model.project.name)}</TableCell><TableCell>Refrigerant</TableCell><TableCell>{model.refrigerant}</TableCell></TableRow>
        <TableRow><TableCell>Location</TableCell><TableCell>{dash(model.project.location?.city || model.project.location)}</TableCell><TableCell>Calculation source</TableCell><TableCell>{data?.success ? 'Completed design response' : 'Unverified response'}</TableCell></TableRow>
      </TableBody></Table>
    </Section>

    <Section title="2. Profile-specific design assumptions">
      {model.pidMetadata?.profile ? <Table size="small"><TableBody>
        <TableRow><TableCell>Profile</TableCell><TableCell>{dash(model.pidMetadata.profile.id)}</TableCell><TableCell>Family</TableCell><TableCell>{dash(model.pidMetadata.profile.family)}</TableCell></TableRow>
        <TableRow><TableCell>Cycle</TableCell><TableCell>{dash(model.pidMetadata.cycle)}</TableCell><TableCell>Safety class</TableCell><TableCell>{dash(model.pidMetadata.profile.safetyClass)}</TableCell></TableRow>
        <TableRow><TableCell>Piping material</TableCell><TableCell>{dash(model.pidMetadata.profile.pipingMaterial)}</TableCell><TableCell>Joint policy</TableCell><TableCell>{dash(model.pidMetadata.jointPolicy)}</TableCell></TableRow>
        <TableRow><TableCell>Safeguards carried into P&amp;ID</TableCell><TableCell colSpan={3}>{Array.isArray(model.pidMetadata.profile.safeguards) && model.pidMetadata.profile.safeguards.length ? model.pidMetadata.profile.safeguards.join(', ') : 'No profile safeguard list returned.'}</TableCell></TableRow>
      </TableBody></Table> : <Alert severity="warning">No refrigerant-profile metadata was returned with this design.</Alert>}
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>The profile establishes the generated selection policy. Final component ratings, pressure classes, charge limits, safety zoning, and relief design remain subject to manufacturer selection and engineering review.</Typography>
    </Section>
    <Section title="2. Cooling Load Calculation">
      {model.loads.length ? <Table size="small"><TableHead><TableRow><TableCell>Room</TableCell><TableCell>Temperature</TableCell><TableCell align="right">Total load</TableCell><TableCell align="right">Transmission</TableCell><TableCell align="right">Product</TableCell><TableCell align="right">Infiltration</TableCell><TableCell align="right">Internal</TableCell></TableRow></TableHead><TableBody>
        {model.loads.map((load: any, index: number) => <TableRow key={`${load.room || 'room'}-${index}`}><TableCell>{dash(load.room || load.roomName)}</TableCell><TableCell>{dash(load.temperature, ' °C')}</TableCell><TableCell align="right">{dash(load.load ?? load.total, ' kW')}</TableCell><TableCell align="right">{dash(load.breakdown?.transmission, ' kW')}</TableCell><TableCell align="right">{dash(load.breakdown?.product, ' kW')}</TableCell><TableCell align="right">{dash(load.breakdown?.infiltration, ' kW')}</TableCell><TableCell align="right">{dash(load.breakdown?.internal, ' kW')}</TableCell></TableRow>)}
        <TableRow sx={{ '& td': { fontWeight: 900 } }}><TableCell colSpan={2}>Calculated total</TableCell><TableCell align="right">{dash(data?.summary?.totalCoolingLoad ?? loadTotal, ' kW')}</TableCell><TableCell colSpan={4}>The total shown is the active engine output; no load component is synthesized here.</TableCell></TableRow>
      </TableBody></Table> : <Alert severity="warning">The active response did not contain room-level load results.</Alert>}
    </Section>

    <Section title="4. Equipment Selection">
      <Box sx={{ p: 1.25 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: .5 }}>Compressors</Typography>
        <Table size="small"><TableHead><TableRow><TableCell>Tag</TableCell><TableCell>Model</TableCell><TableCell>Type</TableCell><TableCell align="right">Capacity</TableCell><TableCell align="right">Power</TableCell></TableRow></TableHead><TableBody>{compressorRows.length ? compressorRows.map((item: any, index: number) => <TableRow key={item.tag || index}><TableCell>{dash(item.tag)}</TableCell><TableCell>{dash(item.model)}</TableCell><TableCell>{dash(item.type)}</TableCell><TableCell align="right">{dash(item.capacity ?? item.capacityKW, ' kW')}</TableCell><TableCell align="right">{dash(item.power ?? item.powerKW, ' kW')}</TableCell></TableRow>) : <TableRow><TableCell colSpan={5}>No compressor selection was returned.</TableCell></TableRow>}</TableBody></Table>
        <Divider sx={{ my: 1.5 }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: .5 }}>Condensers and Evaporators</Typography>
        <Table size="small"><TableHead><TableRow><TableCell>Category</TableCell><TableCell>Tag / room</TableCell><TableCell>Model</TableCell><TableCell align="right">Capacity</TableCell></TableRow></TableHead><TableBody>{[...condenserRows.map((item: any) => ({ ...item, category: 'Condenser' })), ...evaporatorRows.map((item: any) => ({ ...item, category: 'Evaporator' }))].length ? [...condenserRows.map((item: any) => ({ ...item, category: 'Condenser' })), ...evaporatorRows.map((item: any) => ({ ...item, category: 'Evaporator' }))].map((item: any, index: number) => <TableRow key={`${item.category}-${item.tag || index}`}><TableCell>{item.category}</TableCell><TableCell>{dash(item.tag || item.roomName)}</TableCell><TableCell>{dash(item.model)}</TableCell><TableCell align="right">{dash(item.capacity ?? item.capacityPerUnit ?? item.heatRejection, ' kW')}</TableCell></TableRow>) : <TableRow><TableCell colSpan={4}>No condenser or evaporator selection was returned.</TableCell></TableRow>}</TableBody></Table>
        {vesselRows.length > 0 && <><Divider sx={{ my: 1.5 }} /><Typography variant="subtitle2" sx={{ fontWeight: 800, mb: .5 }}>Vessels and Separators</Typography><Table size="small"><TableHead><TableRow><TableCell>Tag</TableCell><TableCell>Type</TableCell><TableCell align="right">Volume</TableCell><TableCell align="right">Design pressure</TableCell></TableRow></TableHead><TableBody>{vesselRows.map((item: any, index: number) => <TableRow key={item.tag || index}><TableCell>{dash(item.tag)}</TableCell><TableCell>{dash(item.type || item.model)}</TableCell><TableCell align="right">{dash(item.volume, ' L')}</TableCell><TableCell align="right">{dash(item.designPressure, ' bar')}</TableCell></TableRow>)}</TableBody></Table></>}
      </Box>
    </Section>

    <Section title="4. Generated P&ID Line Register">
      {model.pidEdges.length ? <Table size="small"><TableHead><TableRow><TableCell>Line</TableCell><TableCell>Service</TableCell><TableCell>From</TableCell><TableCell>To</TableCell><TableCell align="right">DN</TableCell><TableCell>Joint policy</TableCell></TableRow></TableHead><TableBody>{model.pidEdges.map((edge: any, index: number) => <TableRow key={edge.id || index}><TableCell>{dash(edge.label || edge.id)}</TableCell><TableCell>{dash(edge.data?.service || edge.service)}</TableCell><TableCell>{dash(model.tags.get(edge.source))}</TableCell><TableCell>{dash(model.tags.get(edge.target))}</TableCell><TableCell align="right">{dash(edge.data?.dn ?? edge.dn)}</TableCell><TableCell>{dash(edge.data?.jointType || edge.jointType)}</TableCell></TableRow>)}</TableBody></Table> : <Alert severity="warning">No generated P&ID topology was returned with this design.</Alert>}
    </Section>

    <Section title="6. Energy and Review Status">
      <Table size="small"><TableBody>
        <TableRow><TableCell>Reported COP</TableCell><TableCell>{dash(model.energy.cop ?? model.energy.COP)}</TableCell><TableCell>Annual energy</TableCell><TableCell>{dash(model.energy.annualEnergy ?? model.energy.annualConsumption, ' kWh')}</TableCell></TableRow>
        <TableRow><TableCell>Calculation payload</TableCell><TableCell>{Object.keys(model.calculations).length ? 'Available' : 'Not returned'}</TableCell><TableCell>Engineering issue status</TableCell><TableCell>Review required before IFC issue</TableCell></TableRow>
      </TableBody></Table>
    </Section>
  </Box>;
};

export default CalculationBook;
