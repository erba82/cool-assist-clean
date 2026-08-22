import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Alert, Box, Button, Checkbox, Chip, CircularProgress, Divider,
  FormControlLabel, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, Typography
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import RefreshIcon from '@mui/icons-material/Refresh';

const SNAPSHOT_SCHEMA = 'cool-assist.design-snapshot.v1';

const asObject = (value: unknown): Record<string, any> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, any> : {}
);

const asArray = (value: unknown): any[] => Array.isArray(value) ? value : [];

const textOrNull = (value: unknown): string | null => (
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
);

const compactValue = (value: unknown): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  const serialised = JSON.stringify(value);
  return serialised.length > 120 ? `${serialised.slice(0, 117)}…` : serialised;
};

/**
 * Converts only explicit active-design information into a MOC comparison snapshot.
 * Missing fields remain null/empty; no calculation, compatibility or BIM data is invented.
 */
export function buildMocSnapshot(design: any) {
  const source = asObject(design);
  const project = asObject(source.project);
  const projectInfo = asObject(source.projectInfo);
  const pid = asObject(source.pidData);
  const synchronization = asObject(source.synchronization);
  const procurement = asObject(synchronization.procurement);
  const rows = asArray(procurement.rows);
  const explicitBim = asObject(source.bim);
  const calculation = asObject(source.calculation || source.thermodynamicCalculation);
  const energy = asObject(source.energy || source.energyManagement);
  const compliance = asObject(source.compliance);

  const projectRefrigerant = textOrNull(project.refrigerant) || textOrNull(projectInfo.refrigerant);
  const operatingConditionsSI = asObject(project.operatingConditionsSI || projectInfo.operatingConditionsSI || source.operatingConditionsSI);
  const selectedTier = textOrNull(procurement.selectedTier) || textOrNull(asObject(project.procurement).selectedTier);

  return {
    schema: SNAPSHOT_SCHEMA,
    discipline: textOrNull(source.discipline) || 'refrigeration',
    project: {
      refrigerant: projectRefrigerant,
      systemType: textOrNull(project.systemType) || textOrNull(project.cycleType) || textOrNull(source.systemType),
      operatingConditionsSI,
      location: textOrNull(asObject(projectInfo.location).city) || textOrNull(project.location) || textOrNull(projectInfo.location)
    },
    calculation: {
      status: textOrNull(calculation.status) || textOrNull(source.calculationStatus),
      provider: textOrNull(calculation.provider) || textOrNull(asObject(source.thermophysical).provider),
      referenceState: textOrNull(calculation.referenceState) || textOrNull(asObject(source.thermophysical).referenceState),
      results: asObject(calculation.results)
    },
    graph: {
      nodes: asArray(pid.equipment || pid.nodes).map((node) => {
        const data = asObject(node?.data);
        return {
          id: textOrNull(node?.id) || textOrNull(data.tag),
          type: textOrNull(node?.type) || textOrNull(data.componentType),
          service: textOrNull(data.service),
          dn: textOrNull(data.dn) || textOrNull(data.size),
          model: textOrNull(data.model) || textOrNull(asObject(data.details).model),
          manufacturer: textOrNull(data.manufacturer) || textOrNull(asObject(data.details).manufacturer)
        };
      }),
      connections: asArray(pid.pipes || pid.edges).map((connection) => {
        const data = asObject(connection?.data);
        return {
          id: textOrNull(connection?.id) || textOrNull(data.tag),
          from: textOrNull(connection?.source) || textOrNull(connection?.from),
          to: textOrNull(connection?.target) || textOrNull(connection?.to),
          service: textOrNull(data.service) || textOrNull(connection?.service),
          dn: textOrNull(data.dn) || textOrNull(data.size) || textOrNull(connection?.dn),
          jointPolicy: textOrNull(data.jointPolicy),
          insulation: textOrNull(data.insulation)
        };
      })
    },
    selection: {
      status: textOrNull(source.selectionStatus),
      equipment: rows.map((row) => {
        const graphical = asObject(row?.graphicalSelection);
        const offer = asObject(row?.selectedOffer);
        return {
          id: textOrNull(row?.id) || textOrNull(row?.equipmentId) || textOrNull(row?.tag),
          family: textOrNull(graphical.family) || textOrNull(row?.equipmentType),
          model: textOrNull(graphical.selectedModel) || textOrNull(offer.model),
          manufacturer: textOrNull(graphical.selectedBrand) || textOrNull(offer.brand),
          selectionStatus: textOrNull(graphical.engineeringCompatibility) || textOrNull(offer.engineeringCompatibility),
          catalogueModelId: textOrNull(graphical.selectedCatalogueModelId) || textOrNull(offer.catalogueModelId)
        };
      })
    },
    procurement: {
      selectedTier,
      rows: rows.map((row) => {
        const graphical = asObject(row?.graphicalSelection);
        const offer = asObject(row?.selectedOffer);
        return {
          id: textOrNull(row?.id) || textOrNull(row?.equipmentId) || textOrNull(row?.tag),
          selectedTier: textOrNull(row?.selectedTier) || selectedTier,
          brand: textOrNull(offer.brand) || textOrNull(graphical.selectedBrand),
          model: textOrNull(offer.model) || textOrNull(graphical.selectedModel),
          catalogueModelId: textOrNull(offer.catalogueModelId) || textOrNull(graphical.selectedCatalogueModelId),
          engineeringCompatibility: textOrNull(offer.engineeringCompatibility) || textOrNull(graphical.engineeringCompatibility)
        };
      })
    },
    bim: { instances: asArray(explicitBim.instances) },
    energy: {
      baselineId: textOrNull(energy.baselineId),
      meterBoundary: textOrNull(energy.meterBoundary),
      strategyIds: asArray(energy.strategyIds)
    },
    compliance: { checks: asArray(compliance.checks || compliance.standards) },
    evidence: asArray(source.evidence)
  };
}

interface ChangeImpactMocPanelProps {
  design: any;
}

const ChangeImpactMocPanel: React.FC<ChangeImpactMocPanelProps> = ({ design }) => {
  const activeSnapshot = useMemo(() => buildMocSnapshot(design), [design]);
  const baselineStorageKey = useMemo(() => {
    const source = asObject(design);
    const project = asObject(source.project);
    const projectInfo = asObject(source.projectInfo);
    const identity = textOrNull(project.id) || textOrNull(projectInfo.id) || textOrNull(projectInfo.name) || textOrNull(project.name) || 'active-design';
    return `cool-assist.moc-baseline.${identity}`;
  }, [design]);
  const [baseline, setBaseline] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [replacementInKind, setReplacementInKind] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = window.sessionStorage.getItem(baselineStorageKey);
      setBaseline(stored ? JSON.parse(stored) : null);
    } catch {
      setBaseline(null);
    }
    setEvaluation(null);
  }, [baselineStorageKey]);

  const captureBaseline = () => {
    try {
      window.sessionStorage.setItem(baselineStorageKey, JSON.stringify(activeSnapshot));
    } catch {
      // The in-memory state remains available if browser storage is unavailable.
    }
    setBaseline(activeSnapshot);
    setEvaluation(null);
  };

  const evaluate = async () => {
    if (!baseline) return;
    setLoading(true);
    try {
      const response = await axios.post('/api/core/change-impact/evaluate', {
        baseline,
        proposed: activeSnapshot,
        changeContext: { reason: reason.trim() || null, replacementInKind, finalIssueRequested: false }
      });
      setEvaluation(response.data?.evaluation || null);
    } catch (error: any) {
      setEvaluation(error?.response?.data?.evaluation || {
        status: 'blocked',
        blockers: ['Change-impact evaluation could not be completed. Check the available design snapshot and backend service.'],
        changes: []
      });
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (severity?: string): 'error' | 'warning' | 'info' | 'success' => {
    if (severity === 'critical' || severity === 'high') return 'error';
    if (severity === 'medium') return 'warning';
    if (severity === 'low') return 'info';
    return 'success';
  };

  const statusColor = evaluation?.status === 'blocked' ? 'error' : evaluation?.status === 'review-required' ? 'warning' : 'success';

  return <Box sx={{ mt: 3 }}>
    <Divider sx={{ mb: 2 }} />
    <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
      <Box>
        <Typography variant="h6" color="primary" display="flex" alignItems="center" gap={1}>
          <AccountTreeIcon /> Design Change Impact & MOC Gate
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Compare an explicit captured design snapshot with the active design. This creates a review checklist, not an MOC/PSSR approval or construction release.
        </Typography>
      </Box>
      <Chip label={baseline ? 'BASELINE CAPTURED' : 'BASELINE REQUIRED'} color={baseline ? 'info' : 'warning'} size="small" />
    </Box>

    <Alert severity="info" sx={{ mt: 2 }}>
      The panel uses only explicit active-design data. Missing fields remain unresolved; no property, manufacturer, clearance, compliance or safety result is inferred.
    </Alert>

    <Box display="flex" gap={1} mt={2} flexWrap="wrap">
      <Button variant="outlined" startIcon={<RefreshIcon />} onClick={captureBaseline}>
        {baseline ? 'Replace Baseline with Active Design' : 'Capture Active Design as Baseline'}
      </Button>
      <Button variant="contained" disabled={!baseline || loading} onClick={evaluate}>
        {loading ? <CircularProgress size={18} color="inherit" /> : 'Evaluate Change Impact'}
      </Button>
    </Box>

    {baseline && <Box mt={2}>
      <TextField
        fullWidth
        size="small"
        label="Human-authored reason for proposed change (optional)"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <FormControlLabel
        control={<Checkbox checked={replacementInKind} onChange={(event) => setReplacementInKind(event.target.checked)} />}
        label="The site team believes this is replacement-in-kind (requires independent confirmation)"
      />
    </Box>}

    {evaluation && <Box mt={2}>
      <Alert severity={statusColor} sx={{ mb: 2 }}>
        <b>{String(evaluation.status || 'blocked').toUpperCase()}</b> · {evaluation.changeCount || 0} semantic change(s) · final issue remains prohibited.
      </Alert>
      {evaluation.overallSeverity && <Chip label={`Overall severity: ${evaluation.overallSeverity}`} color={severityColor(evaluation.overallSeverity)} size="small" sx={{ mb: 1 }} />}
      {evaluation.blockers?.map((blocker: string, index: number) => <Typography key={`${blocker}-${index}`} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>• {blocker}</Typography>)}

      {asArray(evaluation.changes).length > 0 && <Table size="small" sx={{ mt: 2 }}>
        <TableHead><TableRow><TableCell><b>Change</b></TableCell><TableCell><b>Severity</b></TableCell><TableCell><b>Before → After</b></TableCell><TableCell><b>Affected gates</b></TableCell></TableRow></TableHead>
        <TableBody>{asArray(evaluation.changes).map((change: any) => <TableRow key={change.id}>
          <TableCell>{change.id}</TableCell>
          <TableCell><Chip label={change.severity} color={severityColor(change.severity)} size="small" /></TableCell>
          <TableCell>{compactValue(change.before)} → {compactValue(change.after)}</TableCell>
          <TableCell>{asArray(change.impactedGates).join(', ') || '—'}</TableCell>
        </TableRow>)}</TableBody>
      </Table>}

      {asArray(evaluation.mocChecklist).length > 0 && <Box mt={2}>
        <Typography variant="subtitle2">Required human review checklist</Typography>
        {asArray(evaluation.mocChecklist).map((item: string, index: number) => <Typography key={`${item}-${index}`} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>• {item}</Typography>)}
      </Box>}
    </Box>}
  </Box>;
};

export default ChangeImpactMocPanel;
