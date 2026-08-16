import React from 'react';
import { Alert, Box, Chip, Link, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

interface Props {
  procurement?: any;
}

const tierLabel: Record<string, string> = {
  premium: 'Tier 1 · Premium',
  standard: 'Tier 2 · Standard',
  budget: 'Tier 3 · Budget'
};

const amount = (price: any) => {
  if (!price) return '—';
  const currency = price.currency || '';
  if (Number.isFinite(Number(price.amount))) return `${Number(price.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;
  if (Number.isFinite(Number(price.minimum)) || Number.isFinite(Number(price.maximum))) {
    const minimum = Number.isFinite(Number(price.minimum)) ? Number(price.minimum).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';
    const maximum = Number.isFinite(Number(price.maximum)) ? Number(price.maximum).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—';
    return `${minimum} – ${maximum} ${currency}`;
  }
  return 'Quote required';
};

const sourceLabel = (offer: any) => offer?.supplierSource ? (
  <Link href={offer.supplierSource} target="_blank" rel="noreferrer">Source</Link>
) : 'No public source';

const ProcurementBOMPanel: React.FC<Props> = ({ procurement }) => {
  if (!procurement) return <Alert severity="info">No location-aware procurement result was returned for this design.</Alert>;
  const rows = Array.isArray(procurement.rows) ? procurement.rows : [];
  const location = procurement.location || {};
  return <Box sx={{ p: 1.25 }}>
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1.25 }}>
      <Chip color="primary" size="small" label={tierLabel[procurement.selectedTier] || procurement.selectedTier || 'Tier not selected'} />
      <Chip variant="outlined" size="small" label={[location.city, location.countryCode || location.country].filter(Boolean).join(', ') || 'Location required'} />
      <Chip variant="outlined" size="small" label={`Target currency: ${procurement.currency?.currency || 'unresolved'}`} />
    </Box>
    <Alert severity="warning" sx={{ mb: 1.25 }}>
      Public reference prices are not landed costs. Freight, duties, taxes, stock, commercial terms and final technical approval remain supplier-quotation and engineering-review items.
    </Alert>
    <Table size="small">
      <TableHead><TableRow>
        <TableCell>Equipment / Tag</TableCell><TableCell>Tier</TableCell><TableCell>Brand & model</TableCell><TableCell>Observed base price</TableCell><TableCell>Regional reference</TableCell><TableCell>Availability</TableCell><TableCell>Engineering status</TableCell><TableCell>Source</TableCell>
      </TableRow></TableHead>
      <TableBody>{rows.length ? rows.flatMap((row: any, rowIndex: number) => ['premium', 'standard', 'budget'].map((tier: string) => {
        const offer = row?.offersByTier?.[tier];
        const selected = tier === procurement.selectedTier;
        return <TableRow key={`${row.equipmentId || rowIndex}-${tier}`} sx={selected ? { backgroundColor: 'rgba(15, 61, 94, 0.08)' } : undefined}>
          <TableCell>{row.tag || row.equipmentId || '—'}{selected ? <Typography component="span" variant="caption" sx={{ ml: .5, fontWeight: 700 }}>(selected)</Typography> : null}</TableCell>
          <TableCell>{tierLabel[tier]}</TableCell>
          <TableCell>{offer?.brand ? `${offer.brand}${offer.model ? ` · ${offer.model}` : ''}` : 'No sourced offer'}</TableCell>
          <TableCell>{amount(offer?.basePrice)}</TableCell>
          <TableCell>{amount(offer?.convertedPrice)}</TableCell>
          <TableCell>{offer?.locationAvailability?.status || 'not found'}</TableCell>
          <TableCell>{offer?.engineeringCompatibility || 'not assessed'}</TableCell>
          <TableCell>{sourceLabel(offer)}</TableCell>
        </TableRow>;
      })) : <TableRow><TableCell colSpan={8}>No procurement line item was generated.</TableCell></TableRow>}</TableBody>
    </Table>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
      {procurement.traceability?.liveRefresh?.reason || 'A provider timestamp and source URL are required for every displayed price.'}
    </Typography>
  </Box>;
};

export default ProcurementBOMPanel;
