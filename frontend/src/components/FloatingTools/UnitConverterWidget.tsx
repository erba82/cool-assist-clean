/**
 * UnitConverterWidget.tsx
 * Unit converter with MUI styling
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton, Paper, Button, TextField, Select, MenuItem, FormControl, ToggleButtonGroup, ToggleButton } from '@mui/material';

interface UnitConverterWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    onMinimize?: () => void;
}

type UnitCategory = 'length' | 'pressure' | 'temp' | 'weight';

interface UnitDefinition {
    name: string;
    toBase: (val: number) => number;
    fromBase: (val: number) => number;
}

const UnitConverterWidget: React.FC<UnitConverterWidgetProps> = ({ isOpen, onClose, onBack, onMinimize }) => {
    const [category, setCategory] = useState<UnitCategory>('length');
    const [inputValue, setInputValue] = useState<string>('120');
    const [fromUnit, setFromUnit] = useState<string>('m');
    const [toUnit, setToUnit] = useState<string>('ft');

    const unitDefinitions: Record<UnitCategory, Record<string, UnitDefinition>> = useMemo(() => ({
        length: {
            m: { name: 'Meters', toBase: v => v, fromBase: v => v },
            km: { name: 'Kilometers', toBase: v => v * 1000, fromBase: v => v / 1000 },
            ft: { name: 'Feet', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
            mi: { name: 'Miles', toBase: v => v * 1609.34, fromBase: v => v / 1609.34 },
            in: { name: 'Inches', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
        },
        pressure: {
            bar: { name: 'Bar', toBase: v => v, fromBase: v => v },
            psi: { name: 'PSI', toBase: v => v * 0.0689476, fromBase: v => v / 0.0689476 },
            kPa: { name: 'kPa', toBase: v => v * 0.01, fromBase: v => v / 0.01 },
            MPa: { name: 'MPa', toBase: v => v * 10, fromBase: v => v / 10 },
            atm: { name: 'atm', toBase: v => v * 1.01325, fromBase: v => v / 1.01325 },
        },
        temp: {
            C: { name: '°C', toBase: v => v, fromBase: v => v },
            F: { name: '°F', toBase: v => (v - 32) * 5 / 9, fromBase: v => v * 9 / 5 + 32 },
            K: { name: 'K', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
        },
        weight: {
            kg: { name: 'Kilograms', toBase: v => v, fromBase: v => v },
            lb: { name: 'Pounds', toBase: v => v * 0.453592, fromBase: v => v / 0.453592 },
            g: { name: 'Grams', toBase: v => v / 1000, fromBase: v => v * 1000 },
            oz: { name: 'Ounces', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
        },
    }), []);

    const convert = useCallback((value: number, from: string, to: string, cat: UnitCategory): number => {
        const units = unitDefinitions[cat];
        if (!units[from] || !units[to]) return 0;
        const baseValue = units[from].toBase(value);
        return units[to].fromBase(baseValue);
    }, [unitDefinitions]);

    const result = useMemo(() => {
        const val = parseFloat(inputValue);
        if (isNaN(val)) return '0';
        const converted = convert(val, fromUnit, toUnit, category);
        return converted.toFixed(2);
    }, [inputValue, fromUnit, toUnit, category, convert]);

    const handleCategoryChange = useCallback((_: any, newCategory: UnitCategory | null) => {
        if (newCategory) {
            setCategory(newCategory);
            const units = Object.keys(unitDefinitions[newCategory]);
            setFromUnit(units[0]);
            setToUnit(units[1] || units[0]);
            setInputValue('1');
        }
    }, [unitDefinitions]);

    const handleSwap = useCallback(() => {
        setFromUnit(toUnit);
        setToUnit(fromUnit);
        setInputValue(result);
    }, [fromUnit, toUnit, result]);

    const currentUnits = unitDefinitions[category];

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
                    <Box sx={{ height: 44, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <IconButton size="small" onClick={onBack} sx={{ color: '#6B7280', '&:hover': { bgcolor: '#E5E7EB' } }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
                            </IconButton>
                            <Typography variant="subtitle2" fontWeight={600} color="#1F2937" sx={{ ml: 0.5 }}>Unit Converter</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {onMinimize && (
                                <IconButton size="small" onClick={onMinimize} sx={{ color: '#9CA3AF', '&:hover': { color: '#6B7280' } }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>remove</span>
                                </IconButton>
                            )}
                            <IconButton size="small" onClick={onClose} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
                            </IconButton>
                        </Box>
                    </Box>

                    {/* Content */}
                    <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {/* Category Tabs */}
                        <ToggleButtonGroup
                            value={category}
                            exclusive
                            onChange={handleCategoryChange}
                            fullWidth
                            size="small"
                            sx={{ bgcolor: '#F3F4F6', borderRadius: 2, p: 0.5, '& .MuiToggleButton-root': { border: 'none', borderRadius: 1.5, fontSize: 12, fontWeight: 500, py: 0.75, textTransform: 'none', color: '#6B7280', '&.Mui-selected': { bgcolor: '#fff', color: '#1F2937', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } } }}
                        >
                            <ToggleButton value="length">Length</ToggleButton>
                            <ToggleButton value="pressure">Pressure</ToggleButton>
                            <ToggleButton value="temp">Temp</ToggleButton>
                            <ToggleButton value="weight">Weight</ToggleButton>
                        </ToggleButtonGroup>

                        {/* Input/Output Container */}
                        <Box sx={{ position: 'relative' }}>
                            {/* Input */}
                            <Box sx={{ bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 2, p: 1.5, mb: 1.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Input</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <TextField
                                        type="number"
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        variant="standard"
                                        InputProps={{ disableUnderline: true, sx: { fontSize: 20, fontWeight: 700, color: '#1F2937' } }}
                                        sx={{ flex: 1 }}
                                    />
                                    <Box sx={{ height: 24, width: 1, bgcolor: '#E5E7EB' }} />
                                    <FormControl size="small" variant="standard">
                                        <Select value={fromUnit} onChange={e => setFromUnit(e.target.value)} disableUnderline sx={{ fontSize: 14, fontWeight: 500, color: '#6B7280' }}>
                                            {Object.entries(currentUnits).map(([key, unit]) => (
                                                <MenuItem key={key} value={key}>{unit.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>

                            {/* Swap Button */}
                            <IconButton
                                onClick={handleSwap}
                                sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, width: 32, height: 32, bgcolor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', color: '#10B981', '&:hover': { transform: 'translate(-50%, -50%) scale(1.1)' } }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>swap_vert</span>
                            </IconButton>

                            {/* Output */}
                            <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 2, p: 1.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(16, 185, 129, 0.7)', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Result</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Typography sx={{ flex: 1, fontSize: 20, fontWeight: 700, color: '#10B981' }}>{result}</Typography>
                                    <Box sx={{ height: 24, width: 1, bgcolor: 'rgba(16, 185, 129, 0.2)' }} />
                                    <FormControl size="small" variant="standard">
                                        <Select value={toUnit} onChange={e => setToUnit(e.target.value)} disableUnderline sx={{ fontSize: 14, fontWeight: 500, color: '#10B981' }}>
                                            {Object.entries(currentUnits).map(([key, unit]) => (
                                                <MenuItem key={key} value={key}>{unit.name}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </Box>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <Button variant="outlined" fullWidth onClick={() => setInputValue('0')} sx={{ borderColor: '#E5E7EB', color: '#6B7280', textTransform: 'none', fontWeight: 500, '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F9FAFB' } }}>
                                Clear
                            </Button>
                            <Button variant="contained" fullWidth sx={{ bgcolor: '#10B981', textTransform: 'none', fontWeight: 500, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', '&:hover': { bgcolor: '#059669' } }} endIcon={<span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>}>
                                Convert
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            )}
        </AnimatePresence>
    );
};

export default UnitConverterWidget;
