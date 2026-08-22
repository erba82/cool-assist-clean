import React, { useEffect, useMemo } from 'react';
import { Alert, Box, Button, Chip, Divider, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ProcurementBOMPanel from './ProcurementBOMPanel';

interface Props {
  data: any;
  onProcurementTierChange?: (tier: string) => void;
}

const dash = (value: any, suffix = '') => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = typeof value === 'number' ? value : Number(value);
  const shown = Number.isFinite(numeric) && String(value).trim() !== '' ? numeric.toLocaleString(undefined, { maximumFractionDigits: 3 }) : String(value);
  return `${shown}${suffix}`;
};

const statusColor = (status: string) => status === 'verified-candidate' || status === 'verified-quotation' || status === 'user-confirmed' ? 'success' : status === 'inputs-required' || status === 'input-required' ? 'error' : 'warning';

const reportValue = (value: any) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return dash(value);
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box className="calculation-book-section" sx={{ mb: 3 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f3d5e', mb: 1 }}>{title}</Typography>
    <Paper variant="outlined" sx={{ overflow: 'auto' }}>{children}</Paper>
  </Box>
);

const CalculationBook: React.FC<Props> = ({ data, onProcurementTierChange }) => {
  const model = useMemo(() => {
    const project = data?.project || data?.projectInfo || {};
    const pid = data?.pidData || data?.pidData2D || {};
    const pidNodes = Array.isArray(pid.nodes) ? pid.nodes : (Array.isArray(pid.equipment) ? pid.equipment : []);
    const pidEdges = Array.isArray(pid.edges) ? pid.edges : (Array.isArray(pid.pipes) ? pid.pipes : []);
    const tags = new Map(pidNodes.map((node: any) => [node.id, node.data?.tag || node.data?.label || node.id]));
    return {
      project,
      designBasis: data?.designBasis || data?.fullResults?.designBasis || null,
      refrigerant: project.refrigerant || data?.projectInfo?.refrigerant || pid?.refrigerant || '—',
      loads: Array.isArray(data?.loads) ? data.loads : [],
      equipment: data?.equipment || data?.proposals?.best || {},
      energy: data?.energy || {},
      energyManagement: data?.energyManagement || {},
      procurement: data?.synchronization?.procurement || data?.procurement || data?.fullResults?.synchronization?.procurement || null,
      calculations: data?.calculations || data?.fullResults?.calculations || {},
      pidMetadata: pid?.metadata || {},
      pidNodes,
      pidEdges,
      tags
    };
  }, [data]);

  useEffect(() => {
    const clearPrintMode = () => document.body.classList.remove('print-calculation-book');
    window.addEventListener('afterprint', clearPrintMode);
    return () => window.removeEventListener('afterprint', clearPrintMode);
  }, []);

  const loadTotal = model.loads.reduce((sum: number, item: any) => sum + (Number(item.load || item.total || item.totalLoad) || 0), 0);
  const compressorRows = Array.isArray(model.equipment.compressors) ? model.equipment.compressors : [];
  const condenserRows = Array.isArray(model.equipment.condensers) ? model.equipment.condensers : [];
  const evaporatorRows = Array.isArray(model.equipment.evaporators) ? model.equipment.evaporators : [];
  const vesselRows = [
    ...(Array.isArray(model.equipment.separators) ? model.equipment.separators : []),
    ...(Array.isArray(model.equipment.oilSeparators) ? model.equipment.oilSeparators : []),
    ...(model.equipment.receiver ? [model.equipment.receiver] : [])
  ];
  const designAssumptions = Array.isArray(model.designBasis?.assumptions) && model.designBasis.assumptions.length
    ? model.designBasis.assumptions
    : compressorRows.flatMap((item: any) => Array.isArray(item.assumptions) ? item.assumptions : []);
  const candidateCount = [...compressorRows, ...condenserRows, ...evaporatorRows].length;
  const printBook = () => {
    document.body.classList.add('print-calculation-book');
    window.setTimeout(() => window.print(), 0);
  };

  if (!data) return <Box p={3}><Alert severity="info">No completed design is loaded. Submit and confirm a design request to generate the calculation book.</Alert></Box>;

  return <Box className="calculation-book-print-root" sx={{ p: 1 }}>
    <style>{`
      @media print {
        @page { size: A4 landscape; margin: 10mm; }
        body.print-calculation-book * { visibility: hidden !important; }
        body.print-calculation-book .calculation-book-print-root,
        body.print-calculation-book .calculation-book-print-root * { visibility: visible !important; }
        body.print-calculation-book .calculation-book-print-root { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 0 !important; background: #fff !important; }
        body.print-calculation-book .no-print { display: none !important; }
        body.print-calculation-book .MuiPaper-root { box-shadow: none !important; break-inside: avoid; }
        body.print-calculation-book .calculation-book-section { break-inside: avoid; }
        body.print-calculation-book .MuiTableCell-root { font-size: 8pt !important; padding: 3px 5px !important; }
      }
    `}</style>
    <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 2 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#0b2942' }}>Engineering Calculation Book</Typography>
        <Typography variant="body2" color="text.secondary">Traceable design basis, calculated loads, thermophysical provenance and manufacturer-selection status. A blank field is never filled with an estimated engineering rating.</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}><Chip label={model.refrigerant} color="primary" variant="outlined" sx={{ fontWeight: 800 }} /><Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={printBook}>Print / Save PDF</Button></Box>
    </Box>
    <Box className="print-only-title" sx={{ display: 'none', '@media print': { display: 'block', mb: 1.5 } }}>
      <Typography variant="h5" sx={{ fontWeight: 900 }}>Cool-Assist — Engineering Calculation Book</Typography>
      <Typography variant="caption">Preliminary / review-gated issue. This report is not an IFC, procurement authorization, safety approval or construction document.</Typography>
    </Box>

    <Grid container spacing={1.25} sx={{ mb: 2 }}>
      {[
        ['Calculated cooling load', dash(data?.summary?.totalCoolingLoad ?? loadTotal, ' kW')],
        ['Rooms', dash(model.project.roomCount ?? model.loads.length)],
        ['Equipment candidates', dash(candidateCount)],
        ['P&ID process lines', dash(model.pidEdges.length)]
      ].map(([label, value]) => <Grid item xs={6} md={3} key={String(label)}><Paper variant="outlined" sx={{ p: 1.2, borderTop: '3px solid #1f6d9a' }}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography sx={{ fontWeight: 900 }}>{value}</Typography></Paper></Grid>)}
    </Grid>

    <Section title="1. Design Basis and Issue Status">
      <Table size="small"><TableBody>
        <TableRow><TableCell>Project</TableCell><TableCell>{dash(model.project.name)}</TableCell><TableCell>Refrigerant</TableCell><TableCell>{model.refrigerant}</TableCell></TableRow>
        <TableRow><TableCell>Location</TableCell><TableCell>{dash(model.project.location?.city || model.project.location)}</TableCell><TableCell>Issue status</TableCell><TableCell>Preliminary — engineering review required before final issue</TableCell></TableRow>
        <TableRow><TableCell>Design Basis</TableCell><TableCell>{model.designBasis?.status || 'not-provided'}</TableCell><TableCell>Calculation authority</TableCell><TableCell>{model.designBasis?.proposalMode || 'input/provider required'}</TableCell></TableRow>
        <TableRow><TableCell>Cost status</TableCell><TableCell>{data?.summary?.costStatus || 'supplier-quotation-required'}</TableCell><TableCell>Thermophysical provider</TableCell><TableCell>{compressorRows.find((item: any) => item?.thermophysicalCycle?.provenance)?.thermophysicalCycle?.provenance?.providerId || 'input/provider required'}</TableCell></TableRow>
      </TableBody></Table>
    </Section>

    <Section title="2. Assumptions Register — confirmation required where noted">
      {designAssumptions.length ? <Table size="small"><TableHead><TableRow><TableCell>Parameter</TableCell><TableCell>Proposed / confirmed value</TableCell><TableCell>Unit</TableCell><TableCell>Status</TableCell><TableCell>Provenance / rationale</TableCell></TableRow></TableHead><TableBody>
        {designAssumptions.map((item: any, index: number) => <TableRow key={`${item.id || item.field || 'assumption'}-${index}`}><TableCell>{dash(item.label || item.field)}</TableCell><TableCell>{reportValue(item.value ?? item.proposedValue)}</TableCell><TableCell>{dash(item.unit)}</TableCell><TableCell><Chip size="small" color={statusColor(item.status)} label={item.status || 'review-required'} /></TableCell><TableCell>{dash(item.source || item.rationale)}</TableCell></TableRow>)}
      </TableBody></Table> : <Alert severity="warning">No assumptions register was returned. The design basis must be reviewed before calculation use.</Alert>}
    </Section>

    <Section title="3. Cooling Load Calculation">
      {model.loads.length ? <Table size="small"><TableHead><TableRow><TableCell>Room</TableCell><TableCell>Temperature</TableCell><TableCell align="right">Total load</TableCell><TableCell align="right">Transmission</TableCell><TableCell align="right">Product</TableCell><TableCell align="right">Infiltration</TableCell><TableCell align="right">Internal</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>
        {model.loads.map((load: any, index: number) => <TableRow key={`${load.room || 'room'}-${index}`}><TableCell>{dash(load.room || load.roomName)}</TableCell><TableCell>{dash(load.temperature, ' °C')}</TableCell><TableCell align="right">{dash(load.load ?? load.total, ' kW')}</TableCell><TableCell align="right">{dash(load.breakdown?.transmission, ' kW')}</TableCell><TableCell align="right">{dash(load.breakdown?.product, ' kW')}</TableCell><TableCell align="right">{dash(load.breakdown?.infiltration, ' kW')}</TableCell><TableCell align="right">{dash(load.breakdown?.internal, ' kW')}</TableCell><TableCell><Chip size="small" color={statusColor(load.calculationStatus)} label={load.calculationStatus || 'review-required'} /></TableCell></TableRow>)}
        <TableRow sx={{ '& td': { fontWeight: 900 } }}><TableCell colSpan={2}>Calculated total</TableCell><TableCell align="right">{dash(data?.summary?.totalCoolingLoad ?? loadTotal, ' kW')}</TableCell><TableCell colSpan={5}>No room-load component is synthesized by this report.</TableCell></TableRow>
      </TableBody></Table> : <Alert severity="warning">The active response did not contain room-level load results.</Alert>}
    </Section>

    <Section title="4. Thermodynamic Cycle and Compressor Selection Evidence">
      <Table size="small"><TableHead><TableRow><TableCell>Tag</TableCell><TableCell>Manufacturer / model candidate</TableCell><TableCell>Operating point</TableCell><TableCell align="right">Cycle duty</TableCell><TableCell align="right">Cycle power</TableCell><TableCell align="right">Cycle COP</TableCell><TableCell>Performance-map / train status</TableCell></TableRow></TableHead><TableBody>
        {compressorRows.length ? compressorRows.map((item: any, index: number) => {
          const candidate = item.manufacturerSelection?.selectedModel;
          const cycle = item.thermophysicalCycle?.performance;
          return <TableRow key={item.tag || index}><TableCell>{dash(item.tag)}</TableCell><TableCell>{candidate ? `${candidate.manufacturer} — ${candidate.model}` : 'Manufacturer model not selected'}</TableCell><TableCell>Te {dash(item.operatingPoint?.evapTempC, ' °C')} / Tc {dash(item.operatingPoint?.condTempC, ' °C')}</TableCell><TableCell align="right">{dash(cycle?.coolingLoadKw, ' kW')}</TableCell><TableCell align="right">{dash(cycle?.compressorPowerKw, ' kW')}</TableCell><TableCell align="right">{dash(cycle?.cop)}</TableCell><TableCell><Chip size="small" color={statusColor(item.selectionStatus)} label={item.selectionStatus || 'review-required'} /><Typography variant="caption" display="block">{item.train?.reason || item.manufacturerSelection?.reason || 'Manufacturer map required.'}</Typography></TableCell></TableRow>;
        }) : <TableRow><TableCell colSpan={7}>No compressor duty record was returned.</TableCell></TableRow>}
      </TableBody></Table>
      <Alert severity="warning" sx={{ mt: 1 }}>Cycle power and COP are thermophysical preliminary values only. Unit refrigeration capacity, motor rating, number of duty/standby compressors and compressor COP must come from the selected manufacturer map at this operating point.</Alert>
    </Section>

    <Section title="5. Heat Rejection, Evaporator and Vessel Selection Status">
      <Table size="small"><TableHead><TableRow><TableCell>Category</TableCell><TableCell>Tag / room</TableCell><TableCell>Design duty / role</TableCell><TableCell>Manufacturer model</TableCell><TableCell>Status and blocking evidence</TableCell></TableRow></TableHead><TableBody>
        {[...condenserRows.map((item: any) => ({ ...item, category: 'Condenser' })), ...evaporatorRows.map((item: any) => ({ ...item, category: 'Evaporator' })), ...vesselRows.map((item: any) => ({ ...item, category: 'Vessel / separator' }))].length ? [...condenserRows.map((item: any) => ({ ...item, category: 'Condenser' })), ...evaporatorRows.map((item: any) => ({ ...item, category: 'Evaporator' })), ...vesselRows.map((item: any) => ({ ...item, category: 'Vessel / separator' }))].map((item: any, index: number) => <TableRow key={`${item.category}-${item.tag || index}`}><TableCell>{item.category}</TableCell><TableCell>{dash(item.tag || item.roomName)}</TableCell><TableCell>{dash(item.heatRejection ?? item.designDuty?.requiredCoolingLoadKw ?? item.volume, item.volume ? ' L' : ' kW')}</TableCell><TableCell>{dash(item.model)}</TableCell><TableCell><Chip size="small" color={statusColor(item.selectionStatus)} label={item.selectionStatus || 'review-required'} /><Typography variant="caption" display="block">{(item.blockingReasons || item.issues || []).join(' ') || 'Manufacturer document and review required.'}</Typography></TableCell></TableRow>) : <TableRow><TableCell colSpan={5}>No selection records were returned.</TableCell></TableRow>}
      </TableBody></Table>
    </Section>

    <Section title="6. P&ID Line Register and Layout Readiness">
      {model.pidEdges.length ? <Table size="small"><TableHead><TableRow><TableCell>Line</TableCell><TableCell>Service</TableCell><TableCell>From</TableCell><TableCell>To</TableCell><TableCell align="right">DN</TableCell><TableCell>Sizing status</TableCell><TableCell>Joint policy</TableCell></TableRow></TableHead><TableBody>{model.pidEdges.map((edge: any, index: number) => <TableRow key={edge.id || index}><TableCell>{dash(edge.data?.lineId || edge.label || edge.id)}</TableCell><TableCell>{dash(edge.data?.service || edge.service)}</TableCell><TableCell>{dash(model.tags.get(edge.source))}</TableCell><TableCell>{dash(model.tags.get(edge.target))}</TableCell><TableCell align="right">{dash(edge.data?.dn ?? edge.dn)}</TableCell><TableCell>{dash(edge.data?.sizingStatus)}</TableCell><TableCell>{dash(edge.data?.jointType || edge.jointType)}</TableCell></TableRow>)}</TableBody></Table> : <Alert severity="warning">No generated P&amp;ID topology was returned with this design.</Alert>}
      <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>P&amp;ID logical topology, 3D layout and line sizing are separate controlled deliverables. A missing DN or elevation is intentionally shown as input/review required.</Typography>
    </Section>

    <Section title="7. Procurement, Energy and Review Gate">
      <Table size="small"><TableBody>
        <TableRow><TableCell>Supplier price / quotation</TableCell><TableCell>{data?.summary?.costStatus || 'supplier-quotation-required'}</TableCell><TableCell>Measured baseline energy</TableCell><TableCell>{model.energyManagement?.baseline?.origin === 'measured' ? dash(model.energyManagement.baseline.annualKwh, ' kWh') : 'Input required — see Energy Hub'}</TableCell></TableRow>
        <TableRow><TableCell>Engineering issue status</TableCell><TableCell>Review required before IFC issue</TableCell><TableCell>EnPI status</TableCell><TableCell>{model.energyManagement?.enpis?.[0]?.status || 'input-required'}</TableCell></TableRow>
      </TableBody></Table>
      <Box className="no-print"><Divider sx={{ my: 1.5 }} /><Typography variant="subtitle2" sx={{ fontWeight: 800, px: 1.25, pt: 1 }}>Location-Aware Procurement &amp; Price Inquiry</Typography><ProcurementBOMPanel procurement={model.procurement} onTierChange={onProcurementTierChange} /></Box>
    </Section>
  </Box>;
};

export default CalculationBook;
