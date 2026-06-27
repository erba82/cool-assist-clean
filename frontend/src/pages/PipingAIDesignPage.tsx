// C:\Users\Erfan\cool-assist-clean\frontend\src\pages\PipingAIDesignPage.tsx
import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, TextField, Button, CircularProgress, Paper, Grid, Alert,
    Select, MenuItem, InputLabel, FormControl, Checkbox, FormControlLabel, SelectChangeEvent,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import axios from 'axios';
import { saveAs } from 'file-saver'; // برای دکمه Export
import FlowDiagramRenderer from '../components/FlowDiagramRenderer';

// --- گزینه‌ها (کپی شده از piping ai با کمی تغییر) ---
const refrigerantOptions: readonly string[] = [ "R134a", "R410A", "R404A", "R22", "R717 (Ammonia)", "R290 (Propane)", "R600a (Isobutane)", "R1234yf", "R32", "R744 (CO2)", "R12", "R11", "R113", "R114", "R115", "R123", "R13", "R14", "R21", "R23", "R30", "R40", "R41", "R141b", "R142b", "R143", "R152a", "R161", "R170", "R290", "R600", "R600a", "R601", "R610", "R611", "R630", "R702", "R704", "R718", "R720", "R728", "R732a", "R740", "R744", "R752", "R764", "R1132a", "R1216", "R1233zd(E)", "R1234ze(E)", "R1243zf", "R1270", "R1336mzz(Z)", "R13I1", "RC318", "R401A", "R401B", "R401C", "R402A", "R402B", "R403A", "R404A", "R406A", "R407A", "R407B", "R407C", "R407D", "R407E", "R407F", "R408A", "R409A", "R410A", "R410B", "R411A", "R411B", "R412A", "R413A", "R414A", "R414B", "R415A", "R416A", "R417A", "R417B", "R417C", "R419A", "R420A", "R421A", "R421B", "R422A", "R422B", "R422C", "R422D", "R423A", "R424A", "R426A", "R427A", "R428A", "R429A", "R430A", "R437A", "R438A", "R440A", "R442A", "R444A", "R444B", "R445A", "R446A", "R447A", "R448A", "R449A", "R449B", "R450A", "R451A", "R452A", "R452B", "R453A", "R454A", "R454B", "R454C", "R455A", "R456A", "R457A", "R458A", "R459A", "R460A", "R463A", "R465A", "R466A"];
const designStandardOptions: readonly string[] = [ "EN 378", "ASHRAE 15", "ASME B31.5", "ISO 5149" ];
const designSectionOptions: readonly string[] = [ "Refrigeration", "Air Conditioning", "Ventilation" ];
const condenserControlOptions: readonly string[] = [ "Air Cooled", "Evaporative", "Water Cooled" ];

// --- نقشه مقادیر پیش‌فرض (کپی شده از piping ai) ---
interface DefaultValues { pipingType: string; assumptions: string; flowRate?: number; operatingPressure?: number; }
const defaultValuesMap: { [key: string]: { [key: string]: DefaultValues } } = {
    "EN 378": { "R134a": { pipingType: "Standard steel piping", assumptions: "Assuming standard operating conditions for R134a according to EN 378.", flowRate: 0.5, operatingPressure: 10 }, "R410A": { pipingType: "High-pressure steel piping", assumptions: "Assuming high-pressure conditions for R410A according to EN 378.", flowRate: 0.7, operatingPressure: 15 }, /* ... defaults for EN 378 ... */ },
    "ASHRAE 15": { "R134a": { pipingType: "Standard copper piping", assumptions: "Assuming standard operating conditions for R134a according to ASHRAE 15.", flowRate: 0.4, operatingPressure: 9 }, "R410A": { pipingType: "High-pressure copper piping", assumptions: "Assuming high-pressure conditions for R410A according to ASHRAE 15.", flowRate: 0.6, operatingPressure: 14 }, /* ... defaults for ASHRAE 15 ... */ },
    // ... سایر استانداردها در صورت نیاز ...
};
// ---------------------------------------------------

interface PipingApiResponse {
    interpretedRequirements?: {
        systemRequirements?: string;
        pipeDiameter?: number;
        valveSize?: string;
        valveType?: string;
        pipeMaterial?: string;
        axialDiameter?: number;
        preliminaryEquipment?: string; // برای دیالوگ
    };
    optimizedLayout?: string;
    equipmentList?: string;
    consumablesList?: string;
}

// --- کامپوننت اصلی صفحه ---
const PipingAIDesignPage: React.FC = () => {
    // --- وضعیت‌های فرم ---
    const [designSection, setDesignSection] = useState<string>('');
    const [pipingType, setPipingType] = useState<string>('');
    const [components, setComponents] = useState<string>('');
    const [spatialConstraints, setSpatialConstraints] = useState<string>('');
    const [otherParameters, setOtherParameters] = useState<string>('');
    const [evaporatorCapacity, setEvaporatorCapacity] = useState<string>('');
    const [refrigerantType, setRefrigerantType] = useState<string>('');
    const [designStandard, setDesignStandard] = useState<string>('');
    const [assumptions, setAssumptions] = useState<string>('');
    const [flowRate, setFlowRate] = useState<string>('');
    const [operatingPressure, setOperatingPressure] = useState<string>('');
    const [temperatureRange, setTemperatureRange] = useState<string>('');
    const [condenserControlType, setCondenserControlType] = useState<string>('');
    const [useDefaults, setUseDefaults] = useState<boolean>(true);

    // --- وضعیت‌های UI و نتایج ---
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<PipingApiResponse | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
    const [formKey, setFormKey] = useState<number>(Date.now()); // کلید برای ریست کردن فرم

    // --- افکت برای مدیریت مقادیر پیش‌فرض ---
    useEffect(() => {
        if (useDefaults && refrigerantType && designStandard) {
            const defaults = defaultValuesMap[designStandard]?.[refrigerantType];
            if (defaults) {
                setPipingType(defaults.pipingType);
                setAssumptions(defaults.assumptions);
                setFlowRate(defaults.flowRate !== undefined ? String(defaults.flowRate) : '');
                setOperatingPressure(defaults.operatingPressure !== undefined ? String(defaults.operatingPressure) : '');
            } else {
                setPipingType(''); setAssumptions(''); setFlowRate(''); setOperatingPressure(''); // ریست اگر پیش‌فرض نبود
            }
        }
         // اگر useDefaults خاموش شد، فیلدهای مربوطه را خالی نمی‌کنیم تا کاربر ویرایش‌هایش را از دست ندهد
    }, [refrigerantType, designStandard, useDefaults]);

    // --- اعتبارسنجی ورودی‌ها ---
    const validateInputs = (): boolean => {
        setError(null);
        const errors: string[] = [];
        if (!designSection) errors.push("بخش طراحی");
        if (!components) errors.push("اجزاء سیستم");
        if (!spatialConstraints) errors.push("محدودیت‌های فضایی");
        if (evaporatorCapacity === '' || isNaN(parseFloat(evaporatorCapacity)) || parseFloat(evaporatorCapacity) < 0) errors.push("ظرفیت اواپراتور (عدد مثبت)");
        if (!refrigerantType) errors.push("نوع مبرد");
        if (!designStandard) errors.push("استاندارد طراحی");
        if (!temperatureRange) errors.push("محدوده دما");
        if (!condenserControlType) errors.push("نوع کنترل کندانسور");

        if (!useDefaults) {
            if (!pipingType) errors.push("نوع لوله‌کشی");
            if (!assumptions) errors.push("فرضیات");
            if (flowRate === '' || isNaN(parseFloat(flowRate)) || parseFloat(flowRate) < 0) errors.push("دبی (عدد مثبت)");
            if (operatingPressure === '' || isNaN(parseFloat(operatingPressure)) || parseFloat(operatingPressure) < 0) errors.push("فشار کاری (عدد مثبت)");
        }

        if (errors.length > 0) {
            setError(`لطفا فیلدهای الزامی را به درستی پر کنید: ${errors.join(', ')}`);
            return false;
        }
        return true;
    };

    // --- ارسال اولیه -> نمایش دیالوگ تایید ---
    const handleInitialSubmit = async () => {
        if (!validateInputs()) return;
        setLoading(true);
        setError(null);
        setResults(null);

        const requestData = {
            designSection, pipingType, components, spatialConstraints, otherParameters,
            evaporatorCapacity: parseFloat(evaporatorCapacity), // ارسال عدد
            refrigerantType, designStandard, assumptions,
            // ارسال اعداد یا undefined اگر خالی هستند
            flowRate: flowRate !== '' ? parseFloat(flowRate) : undefined,
            operatingPressure: operatingPressure !== '' ? parseFloat(operatingPressure) : undefined,
            temperatureRange, condenserControlType, useDefaults
        };

        try {
            console.log("[Frontend] Sending request to /api/piping/generate-full-design", requestData);
            const response = await axios.post<PipingApiResponse>('/api/piping/generate-full-design', requestData);
            console.log("[Frontend] Received response:", response.data);
            setResults(response.data); // ذخیره کامل پاسخ
            setShowConfirmDialog(true); // نمایش دیالوگ

        } catch (err: any) {
            console.error("[Frontend] Error generating piping design:", err);
            const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message || 'خطای ناشناخته در تولید طرح پایپینگ.';
             setError(`خطا: ${errorMsg}`);
            setResults(null);
        } finally {
            setLoading(false);
        }
    };

    // --- مدیریت تایید دیالوگ ---
    const handleConfirmGenerate = () => {
         setShowConfirmDialog(false);
         console.log("[Frontend] User confirmed. Displaying results.");
         // نتایج از قبل در state هستند، نیازی به کار اضافه نیست
    };

     // --- مدیریت عدم تایید دیالوگ ---
    const handleCancelGenerate = () => {
        setShowConfirmDialog(false);
        setResults(null); // پاک کردن نتایج چون کاربر لغو کرد
        console.log("[Frontend] User cancelled generation.");
    };

    // --- مدیریت Export ---
    const handleExport = () => {
        if (!results || !results.optimizedLayout) {
             setError("داده‌ای برای ذخیره وجود ندارد.");
            return;
        }
        setError(null); // Clear error if export is possible

        let exportContent = `
--- Cool-Assist Piping AI Design ---
Date: ${new Date().toLocaleString()}

--- Input Parameters ---
Design Section: ${designSection}
Refrigerant Type: ${refrigerantType}
Design Standard: ${designStandard}
Evaporator Capacity: ${evaporatorCapacity} kW
Components: ${components}
Spatial Constraints: ${spatialConstraints}
Temperature Range: ${temperatureRange} C
Condenser Control Type: ${condenserControlType}
Other Parameters: ${otherParameters || 'None'}
Used Defaults: ${useDefaults ? 'Yes' : 'No'}
${!useDefaults ? `Piping Type: ${pipingType}\nAssumptions: ${assumptions}\nFlow Rate: ${flowRate || 'N/A'} kg/s\nOperating Pressure: ${operatingPressure || 'N/A'} bar` : ''}
--- End Inputs ---

--- System Requirements Summary (AI Generated) ---
${results.interpretedRequirements?.systemRequirements || 'Not available.'}
--- End Requirements ---

--- Symbolic Layout (AI Generated) ---
${results.optimizedLayout}
--- End Layout ---

--- Equipment List (AI Generated) ---
${results.equipmentList || 'Not available.'}
--- End Equipment ---

--- Consumables List (AI Generated) ---
${results.consumablesList || 'Not available.'}
--- End Consumables ---
`;
        try {
            const blob = new Blob([exportContent.trim()], { type: "text/plain;charset=utf-8" });
            saveAs(blob, `coolassist_piping_design_${Date.now()}.txt`);
        } catch (exportError: any) {
             console.error("[Frontend] Export Error:", exportError);
             setError(`خطا در ذخیره فایل: ${exportError.message}`);
        }
    };

     // --- ریست کردن فرم ---
     const handleResetForm = () => {
         setDesignSection(''); setPipingType(''); setComponents('');
         setSpatialConstraints(''); setOtherParameters(''); setEvaporatorCapacity('');
         setRefrigerantType(''); setDesignStandard(''); setAssumptions('');
         setFlowRate(''); setOperatingPressure(''); setTemperatureRange('');
         setCondenserControlType(''); setUseDefaults(true);
         setError(null); setResults(null); setShowConfirmDialog(false);
         setFormKey(Date.now()); // تغییر کلید برای ری-رندر کامل فرم
         console.log("[Frontend] Form reset.");
     };


    // --- رندر ---
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }} key={formKey}> {/* کلید برای ریست */}
            <Typography variant="h4" gutterBottom component="h1">
                طراحی سیستم پایپینگ (Piping AI)
            </Typography>

            {/* فرم ورودی */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Typography variant="h6" gutterBottom component="h2">پارامترهای ورودی</Typography>
                <Grid container spacing={2}>
                    {/* ردیف ۱ */}
                    <Grid item xs={12} sm={6} md={4}>
                       <FormControl fullWidth margin="dense" required>
                            <InputLabel id="ds-label">بخش طراحی</InputLabel>
                            <Select labelId="ds-label" value={designSection} label="بخش طراحی" onChange={(e: SelectChangeEvent<string>) => setDesignSection(e.target.value)}>
                                {designSectionOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth margin="dense" required>
                            <InputLabel id="ref-label">نوع مبرد</InputLabel>
                            <Select labelId="ref-label" value={refrigerantType} label="نوع مبرد" onChange={(e: SelectChangeEvent<string>) => setRefrigerantType(e.target.value)}>
                               {/* فیلتر کردن موارد تکراری احتمالی در لیست اصلی */}
                               {Array.from(new Set(refrigerantOptions)).map((option) => (
                                  <MenuItem key={option} value={option}>{option}</MenuItem>
                               ))}
                            </Select>
                        </FormControl>
                    </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                         <FormControl fullWidth margin="dense" required>
                            <InputLabel id="std-label">استاندارد طراحی</InputLabel>
                            <Select labelId="std-label" value={designStandard} label="استاندارد طراحی" onChange={(e: SelectChangeEvent<string>) => setDesignStandard(e.target.value)}>
                                {designStandardOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                        </FormControl>
                     </Grid>

                    {/* ردیف ۲ */}
                     <Grid item xs={12} sm={6} md={4}>
                        <TextField fullWidth label="ظرفیت اواپراتور (kW)" type="number" value={evaporatorCapacity} onChange={(e) => setEvaporatorCapacity(e.target.value)} margin="dense" required InputProps={{ inputProps: { min: 0, step: "0.1" } }} />
                     </Grid>
                      <Grid item xs={12} sm={6} md={8}>
                         <TextField fullWidth label="اجزاء سیستم (با کاما جدا کنید)" value={components} onChange={(e) => setComponents(e.target.value)} margin="dense" required/>
                     </Grid>


                    {/* ردیف ۳ */}
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="محدودیت‌های فضایی" multiline minRows={2} maxRows={4} value={spatialConstraints} onChange={(e) => setSpatialConstraints(e.target.value)} margin="dense" required />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="سایر پارامترها / توضیحات" multiline minRows={2} maxRows={4} value={otherParameters} onChange={(e) => setOtherParameters(e.target.value)} margin="dense"/>
                    </Grid>

                     {/* ردیف ۴: فیلدهای مشروط */}
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField fullWidth label="نوع لوله‌کشی" value={pipingType} onChange={(e) => setPipingType(e.target.value)} margin="dense" disabled={useDefaults} required={!useDefaults}/>
                    </Grid>
                     <Grid item xs={12} sm={6} md={3}>
                         <TextField fullWidth label="فرضیات" value={assumptions} onChange={(e) => setAssumptions(e.target.value)} margin="dense" disabled={useDefaults} required={!useDefaults} multiline minRows={1}/>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                       <TextField fullWidth label="دبی (kg/s)" type="number" value={flowRate} onChange={(e) => setFlowRate(e.target.value)} margin="dense" disabled={useDefaults} required={!useDefaults} InputProps={{ inputProps: { min: 0, step: "0.01" } }}/>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                       <TextField fullWidth label="فشار کاری (bar)" type="number" value={operatingPressure} onChange={(e) => setOperatingPressure(e.target.value)} margin="dense" disabled={useDefaults} required={!useDefaults} InputProps={{ inputProps: { min: 0, step: "0.1" } }}/>
                    </Grid>


                     {/* ردیف ۵ */}
                     <Grid item xs={12} sm={6} md={4}>
                         <TextField fullWidth label="محدوده دما (°C)" value={temperatureRange} onChange={(e) => setTemperatureRange(e.target.value)} margin="dense" required placeholder="-10 to 40"/>
                     </Grid>
                     <Grid item xs={12} sm={6} md={4}>
                         <FormControl fullWidth margin="dense" required>
                            <InputLabel id="cc-label">نوع کنترل کندانسور</InputLabel>
                            <Select labelId="cc-label" value={condenserControlType} label="نوع کنترل کندانسور" onChange={(e: SelectChangeEvent<string>) => setCondenserControlType(e.target.value)}>
                                {condenserControlOptions.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                            </Select>
                        </FormControl>
                     </Grid>
                     <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', pt: { md: 1 } }}>
                          <FormControlLabel control={<Checkbox checked={useDefaults} onChange={(e) => setUseDefaults(e.target.checked)} />} label="استفاده از مقادیر پیش‌فرض" sx={{ m: 0 }}/>
                     </Grid>


                    {/* دکمه‌ها */}
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                        <Button variant="contained" color="primary" onClick={handleInitialSubmit} disabled={loading} size="large" sx={{ minWidth: 180 }}>
                            {loading ? <CircularProgress size={24} color="inherit" /> : '۱. تولید طرح'}
                        </Button>
                         <Button variant="outlined" color="secondary" onClick={handleResetForm} disabled={loading} size="large">
                             ریست فرم
                         </Button>
                    </Grid>

                    {/* نمایش خطا */}
                    {error && <Grid item xs={12}><Alert severity="error" sx={{ mt: 2, whiteSpace: 'pre-wrap' }}>{error}</Alert></Grid>}

                </Grid>
            </Paper>

            {/* --- نمایش نتایج --- */}
             {results && !showConfirmDialog && ( // فقط بعد از تایید دیالوگ
                 <Paper sx={{ p: { xs: 2, sm: 3 }, mt: 3 }}>
                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                         <Typography variant="h6" gutterBottom component="h2" sx={{ mb: { xs: 1, sm: 0 } }}>
                             نتایج طراحی
                         </Typography>
                         <Button variant="outlined" onClick={handleExport} size="small">
                             ذخیره نتایج (TXT)
                         </Button>
                     </Box>
                     <Grid container spacing={3}>
                        {/* Layout */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>طرح‌بندی نمادین (Symbolic Layout):</Typography>
                            <Paper variant="outlined" sx={{ p: 2, maxHeight: '400px', overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem', backgroundColor: 'grey.100' }}>
                                {results.optimizedLayout || "Layout not generated."}
                            </Paper>
                            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                (این طرح‌بندی برای استفاده در نرم‌افزارهای CAD یا نمایشگرهای فلوچارت است.)
                            </Typography>
                        </Grid>
                         {/* Equipment */}
                         <Grid item xs={12} md={6}>
                             <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>لیست تجهیزات:</Typography>
                              <Paper variant="outlined" sx={{ p: 2, maxHeight: '300px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.875rem', backgroundColor: 'grey.50' }}>
                                 {results.equipmentList || "Equipment list not generated."}
                              </Paper>
                         </Grid>
                         {/* Consumables */}
                         <Grid item xs={12} md={6}>
                             <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>لیست مواد مصرفی:</Typography>
                             <Paper variant="outlined" sx={{ p: 2, maxHeight: '300px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.875rem', backgroundColor: 'grey.50' }}>
                                  {results.consumablesList || "Consumables list not generated."}
                             </Paper>
                         </Grid>
                         {/* Requirements Summary (Optional Display) */}
                         <Grid item xs={12}>
                             <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>خلاصه نیازمندی‌های سیستم (AI):</Typography>
                              <Paper variant="outlined" sx={{ p: 2, maxHeight: '200px', overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: '0.875rem', backgroundColor: 'grey.50' }}>
                                 {results.interpretedRequirements?.systemRequirements || "Requirements summary not available."}
                              </Paper>
                         </Grid>
                     </Grid>
                 </Paper>
             )}

            {/* --- دیالوگ تایید --- */}
             <Dialog open={showConfirmDialog} onClose={handleCancelGenerate} maxWidth="sm" fullWidth>
                 <DialogTitle sx={{ fontWeight: 'bold' }}>۲. تایید جزئیات اولیه محاسبه‌شده</DialogTitle>
                 <DialogContent>
                     <DialogContentText component="div" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'text.secondary', border: '1px dashed grey', p: 2, borderRadius: 1, backgroundColor: 'grey.50' }}>
                         {results?.interpretedRequirements?.preliminaryEquipment ? (
                              results.interpretedRequirements.preliminaryEquipment
                         ) : (
                             <Box sx={{ display: 'flex', alignItems: 'center' }}><CircularProgress size={20} sx={{ mr: 1 }} /> در حال بارگذاری جزئیات...</Box>
                         )}
                     </DialogContentText>
                     <DialogContentText sx={{ mt: 2, fontSize: '0.9rem' }}>
                         آیا این جزئیات اولیه را تأیید می‌کنید تا طرح‌بندی نهایی، لیست تجهیزات و مواد مصرفی بر اساس آن تولید شود؟
                     </DialogContentText>
                 </DialogContent>
                 <DialogActions sx={{ p: 2 }}>
                     <Button onClick={handleCancelGenerate} color="secondary">لغو و ویرایش ورودی</Button>
                     <Button onClick={handleConfirmGenerate} variant="contained" autoFocus disabled={!results?.interpretedRequirements?.preliminaryEquipment}>
                         تایید و نمایش نتایج نهایی
                     </Button>
                 </DialogActions>
             </Dialog>

        </Container>
    );
};

export default PipingAIDesignPage;