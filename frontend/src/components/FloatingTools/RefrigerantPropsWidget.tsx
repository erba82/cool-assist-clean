/**
 * RefrigerantPropsWidget.tsx
 * Refrigerant properties lookup with MUI styling
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton, Paper, Button, Slider, Select, MenuItem, FormControl, Grid, useTheme } from '@mui/material';

interface RefrigerantPropsWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    onMinimize?: () => void;
}

interface RefrigerantData {
    name: string;
    minTemp: number;
    maxTemp: number;
    getPressure: (T: number) => number;
    getDensity: (T: number) => number;
    getEnthalpyLiq: (T: number) => number;
    getEnthalpyVap: (T: number) => number;
}

const RefrigerantPropsWidget: React.FC<RefrigerantPropsWidgetProps> = ({ isOpen, onClose, onBack, onMinimize }) => {
    const theme = useTheme();
    const isDarkMode = theme.palette.mode === 'dark';
    const [refrigerant, setRefrigerant] = useState<string>('R-410A');
    const [temperature, setTemperature] = useState<number>(52.4);

    const refrigerants: Record<string, RefrigerantData> = useMemo(() => ({
        'R-410A': {
            name: 'R-410A',
            minTemp: -50,
            maxTemp: 80,
            getPressure: (T) => 10 + (T + 50) * 0.3,
            getDensity: (T) => 1100 - T * 2.5,
            getEnthalpyLiq: (T) => 200 + T * 1.8,
            getEnthalpyVap: (T) => 410 + T * 0.3,
        },
        'R-134a': {
            name: 'R-134a',
            minTemp: -40,
            maxTemp: 100,
            getPressure: (T) => 2 + (T + 40) * 0.08,
            getDensity: (T) => 1200 - T * 3,
            getEnthalpyLiq: (T) => 170 + T * 1.5,
            getEnthalpyVap: (T) => 390 + T * 0.25,
        },
        'R-22': {
            name: 'R-22',
            minTemp: -40,
            maxTemp: 90,
            getPressure: (T) => 3 + (T + 40) * 0.12,
            getDensity: (T) => 1190 - T * 2.8,
            getEnthalpyLiq: (T) => 180 + T * 1.6,
            getEnthalpyVap: (T) => 400 + T * 0.28,
        },
        'R-717': {
            name: 'Ammonia (R-717)',
            minTemp: -50,
            maxTemp: 100,
            getPressure: (T) => 1 + (T + 50) * 0.15,
            getDensity: (T) => 680 - T * 1.5,
            getEnthalpyLiq: (T) => 100 + T * 4.5,
            getEnthalpyVap: (T) => 1420 + T * 1.2,
        },
    }), []);

    const currentRef = refrigerants[refrigerant];

    const properties = useMemo(() => ({
        pressure: currentRef.getPressure(temperature).toFixed(1),
        density: currentRef.getDensity(temperature).toFixed(1),
        enthalpyLiq: currentRef.getEnthalpyLiq(temperature).toFixed(1),
        enthalpyVap: currentRef.getEnthalpyVap(temperature).toFixed(1),
    }), [temperature, currentRef]);

    const handleRefrigerantChange = useCallback((e: any) => {
        const newRef = e.target.value;
        setRefrigerant(newRef);
        const data = refrigerants[newRef];
        setTemperature(Math.min(Math.max(temperature, data.minTemp), data.maxTemp));
    }, [refrigerants, temperature]);

    return (
        <AnimatePresence>
            {isOpen && (
                <Paper
                    component={motion.div}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    elevation={8}
                    sx={{ width: 340, borderRadius: 3, overflow: 'hidden', border: '1px solid #E5E7EB' }}
                >
                    {/* Header */}
                    <Box sx={{ height: 44, bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderBottom: `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton size="small" onClick={onBack} sx={{ color: 'text.secondary', '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#E5E7EB' } }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                            </IconButton>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary" sx={{ ml: 0.5 }}>Refrigerant Props</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {onMinimize && (
                                <IconButton size="small" onClick={onMinimize} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                                </IconButton>
                            )}
                            <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', '&:hover': { color: '#EF4444' } }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Content */}
                    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Fluid Selector */}
                        <Box>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, mb: 0.5, display: 'block' }}>Fluid</Typography>
                            <FormControl fullWidth size="small">
                                <Select
                                    value={refrigerant}
                                    onChange={handleRefrigerantChange}
                                    sx={{ bgcolor: theme.palette.background.paper, borderRadius: 2, fontSize: 14, fontWeight: 500, color: 'text.primary', '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'text.secondary' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#10B981' } }}
                                >
                                    {Object.keys(refrigerants).map(key => (
                                        <MenuItem key={key} value={key}>{refrigerants[key].name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Temperature Slider */}
                        <Box sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB', borderRadius: 3, p: 1.5, border: `1px solid ${theme.palette.divider}` }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 2, px: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Saturation Temp</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                    <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#10B981' }}>{temperature.toFixed(1)}</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>°C</Typography>
                                </Box>
                            </Box>

                            <Box sx={{ px: 1 }}>
                                <Slider
                                    value={temperature}
                                    min={currentRef.minTemp}
                                    max={currentRef.maxTemp}
                                    step={0.1}
                                    onChange={(_, v) => setTemperature(v as number)}
                                    valueLabelDisplay="auto"
                                    valueLabelFormat={v => `${properties.pressure} bar`}
                                    sx={{
                                        color: '#10B981',
                                        '& .MuiSlider-thumb': {
                                            width: 20,
                                            height: 20,
                                            bgcolor: '#fff',
                                            border: '2.5px solid #10B981',
                                            boxShadow: '0 0 12px rgba(16, 185, 129, 0.4)',
                                            '&:hover': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.6)' }
                                        },
                                        '& .MuiSlider-track': { height: 4 },
                                        '& .MuiSlider-rail': { height: 4, bgcolor: theme.palette.divider },
                                        '& .MuiSlider-valueLabel': { bgcolor: '#10B981', fontSize: 12, fontWeight: 700 }
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 9, fontWeight: 500 }}>Min: {currentRef.minTemp}°C</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 9, fontWeight: 500 }}>Max: {currentRef.maxTemp}°C</Typography>
                            </Box>
                        </Box>

                        {/* Results Divider */}
                        <Box sx={{ position: 'relative', height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ position: 'absolute', inset: '0', top: '50%', height: 1, bgcolor: theme.palette.divider }} />
                            <Typography variant="caption" sx={{ position: 'relative', zIndex: 1, bgcolor: theme.palette.background.paper, px: 1, color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', fontSize: 10 }}>Results</Typography>
                        </Box>

                        {/* Results Grid */}
                        <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 2, p: 1.5 }}>
                            <Grid container spacing={2}>
                                {[
                                    { label: 'Pressure (Sat)', value: properties.pressure, unit: 'bar' },
                                    { label: 'Density (Liq)', value: properties.density, unit: 'kg/m³' },
                                    { label: 'Enthalpy (Liq)', value: properties.enthalpyLiq, unit: 'kJ/kg' },
                                    { label: 'Enthalpy (Vap)', value: properties.enthalpyVap, unit: 'kJ/kg' },
                                ].map(item => (
                                    <Grid item xs={6} key={item.label}>
                                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>{item.label}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                                            <Typography sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>{item.value}</Typography>
                                            <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 500, fontSize: 10 }}>{item.unit}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                variant="outlined"
                                fullWidth
                                startIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>show_chart</span>}
                                sx={{ borderColor: '#E5E7EB', color: '#6B7280', textTransform: 'none', fontWeight: 500, fontSize: 12, '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F9FAFB' } }}
                            >
                                View P-T Chart
                            </Button>
                            <IconButton sx={{ border: '1px solid #E5E7EB', borderRadius: 2, color: '#9CA3AF', '&:hover': { color: '#10B981' } }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>share</span>
                            </IconButton>
                        </Box>
                    </Box>
                </Paper>
            )}
        </AnimatePresence>
    );
};

export default RefrigerantPropsWidget;
