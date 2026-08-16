const fs = require('fs');
const file = 'frontend/src/components/UnifiedChatPage.tsx';
let source = fs.readFileSync(file, 'utf8');

function replaceOnce(pattern, replacement, label) {
  if (!pattern.test(source)) throw new Error(`Unable to find ${label}`);
  source = source.replace(pattern, replacement);
}

replaceOnce(
  /import ProfessionalPIDCanvas from '\.\/ProfessionalPIDCanvas';/,
  "import ProfessionalPIDCanvas from './ProfessionalPIDCanvas';\nimport CalculationBook from './CalculationBook';",
  'ProfessionalPIDCanvas import'
);

replaceOnce(
  /const ComplianceSection = \(\{ compliance \}: \{ compliance\?: any \}\) => \ {[\s\S]*?\n\};\n\/\/ Lazy load 3D component/,
  `const ComplianceSection = ({ compliance, refrigerant }: { compliance?: any; refrigerant?: string }) => {
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
// Lazy load 3D component`,
  'ComplianceSection implementation'
);

replaceOnce(
  /<Tab label="Load Calculation" \/>\s*<Tab label="Equipment" \/>/,
  '<Tab label="Load Calculation" />\n                            <Tab label="Calculation Book" />\n                            <Tab label="Equipment" />',
  'preview tabs'
);

replaceOnce(
  /\{previewTab === 1 && <LoadsSection loads=\{activeDesign\.loads\} \/>\}/,
  '{previewTab === 1 && <LoadsSection loads={activeDesign.loads} />}\n                            {previewTab === 2 && <CalculationBook data={activeDesign} />}',
  'calculation-book render location'
);

source = source.replace('{previewTab === 6 && <ComplianceSection compliance={activeDesign.compliance} />}', "{previewTab === 7 && <ComplianceSection compliance={activeDesign.compliance} refrigerant={activeDesign.project?.refrigerant || activeDesign.projectInfo?.refrigerant} />}");
source = source.replace('{previewTab === 5 && <EnergyAnalysisView data={activeDesign} />}', '{previewTab === 6 && <EnergyAnalysisView data={activeDesign} />}');
source = source.replace('{previewTab === 4 && (', '{previewTab === 5 && (');
source = source.replace('{previewTab === 3 && (', '{previewTab === 4 && (');
source = source.replace('{previewTab === 2 && <EquipmentSection equipment={activeDesign.proposals?.best || activeDesign.equipment || {}} />}', '{previewTab === 3 && <EquipmentSection equipment={activeDesign.proposals?.best || activeDesign.equipment || {}} />}');

if (!source.includes('<CalculationBook data={activeDesign} />')) throw new Error('CalculationBook was not inserted');
if (!source.includes('previewTab === 7 && <ComplianceSection')) throw new Error('Compliance tab was not shifted');
fs.writeFileSync(file, source, 'utf8');
console.log('Calculation book and compliance integration completed successfully.');
