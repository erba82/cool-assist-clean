/**
 * CalculatorWidget.tsx
 * Scientific calculator with MUI styling
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton, Paper, Button, Grid } from '@mui/material';

interface CalculatorWidgetProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    onMinimize?: () => void;
}

const CalculatorWidget: React.FC<CalculatorWidgetProps> = ({ isOpen, onClose, onBack, onMinimize }) => {
    const [display, setDisplay] = useState<string>('0');
    const [expression, setExpression] = useState<string>('');
    const [isRadians, setIsRadians] = useState<boolean>(true);

    const handleNumber = useCallback((num: string) => {
        setDisplay(prev => prev === '0' ? num : prev + num);
        setExpression(prev => prev + num);
    }, []);

    const handleOperator = useCallback((op: string) => {
        setDisplay('0');
        setExpression(prev => prev + ` ${op} `);
    }, []);

    const handleFunction = useCallback((func: string) => {
        setExpression(prev => prev + `${func}(`);
        setDisplay('0');
    }, []);

    const handleClear = useCallback(() => {
        setDisplay('0');
        setExpression('');
    }, []);

    const handleBackspace = useCallback(() => {
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
        setExpression(prev => prev.slice(0, -1));
    }, []);

    const handleEquals = useCallback(() => {
        try {
            let expr = expression
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/√\(/g, 'Math.sqrt(')
                .replace(/π/g, 'Math.PI')
                .replace(/e(?![a-z])/g, 'Math.E')
                .replace(/×/g, '*')
                .replace(/÷/g, '/');

            // eslint-disable-next-line no-eval
            const result = eval(expr);
            setDisplay(String(parseFloat(result.toFixed(10))));
            setExpression(String(parseFloat(result.toFixed(10))));
        } catch {
            setDisplay('Error');
        }
    }, [expression]);

    const scientificButtons = ['sin', 'cos', 'tan', 'log', 'ln', '√', '(', ')', 'x²', 'xʸ', 'π', 'e'];

    const buttonStyle = {
        minWidth: 0,
        height: 36,
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 1,
        textTransform: 'none' as const,
    };

    const numButtonStyle = {
        ...buttonStyle,
        height: 40,
        fontSize: 16,
        bgcolor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        color: '#374151',
        '&:hover': { bgcolor: '#F9FAFB' },
    };

    const opButtonStyle = {
        ...buttonStyle,
        height: 40,
        fontSize: 18,
        bgcolor: '#EEF2FF',
        color: '#6366F1',
        '&:hover': { bgcolor: '#E0E7FF' },
    };

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
                            <Typography variant="subtitle2" fontWeight={600} color="#1F2937" sx={{ ml: 0.5 }}>Eng. Calculator</Typography>
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
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {/* Display */}
                        <Box sx={{ bgcolor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 2, p: 1.5, height: 80, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', position: 'relative' }}>
                            <Button
                                size="small"
                                onClick={() => setIsRadians(!isRadians)}
                                sx={{ position: 'absolute', top: 8, left: 8, fontSize: 10, fontWeight: 700, minWidth: 0, px: 1, py: 0.25, color: '#9CA3AF', bgcolor: '#F3F4F6', '&:hover': { color: '#10B981', bgcolor: 'rgba(16,185,129,0.1)' } }}
                            >
                                {isRadians ? 'RAD' : 'DEG'}
                            </Button>
                            <Typography variant="caption" sx={{ color: '#9CA3AF', fontFamily: 'monospace', mb: 0.5, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {expression || '0'}
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#1F2937', fontWeight: 700, fontFamily: 'monospace' }}>
                                {display}
                            </Typography>
                        </Box>

                        {/* Scientific Functions */}
                        <Grid container spacing={0.5}>
                            {scientificButtons.map(btn => (
                                <Grid item xs={3} key={btn}>
                                    <Button
                                        fullWidth
                                        onClick={() => {
                                            if (btn === 'x²') setExpression(prev => `(${prev})**2`);
                                            else if (btn === 'xʸ') setExpression(prev => prev + '**');
                                            else if (['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(btn)) handleFunction(btn);
                                            else setExpression(prev => prev + btn);
                                        }}
                                        sx={{ ...buttonStyle, bgcolor: '#F3F4F6', color: '#6B7280', '&:hover': { bgcolor: '#E5E7EB' } }}
                                    >
                                        {btn}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>

                        <Box sx={{ height: 1, bgcolor: '#E5E7EB' }} />

                        {/* Main Buttons */}
                        <Grid container spacing={0.5}>
                            {/* Row 1: AC, Backspace, %, ÷ */}
                            <Grid item xs={3}><Button fullWidth onClick={handleClear} sx={{ ...buttonStyle, height: 40, bgcolor: '#FEF2F2', color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}>AC</Button></Grid>
                            <Grid item xs={3}><Button fullWidth onClick={handleBackspace} sx={{ ...numButtonStyle }}><span className="material-symbols-outlined" style={{ fontSize: 18 }}>backspace</span></Button></Grid>
                            <Grid item xs={3}><Button fullWidth onClick={() => handleOperator('%')} sx={{ ...opButtonStyle }}>%</Button></Grid>
                            <Grid item xs={3}><Button fullWidth onClick={() => handleOperator('÷')} sx={{ ...opButtonStyle }}>÷</Button></Grid>

                            {/* Row 2: 7, 8, 9, × */}
                            {['7', '8', '9'].map(n => <Grid item xs={3} key={n}><Button fullWidth onClick={() => handleNumber(n)} sx={{ ...numButtonStyle }}>{n}</Button></Grid>)}
                            <Grid item xs={3}><Button fullWidth onClick={() => handleOperator('×')} sx={{ ...opButtonStyle }}>×</Button></Grid>

                            {/* Row 3: 4, 5, 6, - */}
                            {['4', '5', '6'].map(n => <Grid item xs={3} key={n}><Button fullWidth onClick={() => handleNumber(n)} sx={{ ...numButtonStyle }}>{n}</Button></Grid>)}
                            <Grid item xs={3}><Button fullWidth onClick={() => handleOperator('-')} sx={{ ...opButtonStyle }}>−</Button></Grid>

                            {/* Row 4: 1, 2, 3, + */}
                            {['1', '2', '3'].map(n => <Grid item xs={3} key={n}><Button fullWidth onClick={() => handleNumber(n)} sx={{ ...numButtonStyle }}>{n}</Button></Grid>)}
                            <Grid item xs={3}><Button fullWidth onClick={() => handleOperator('+')} sx={{ ...opButtonStyle }}>+</Button></Grid>

                            {/* Row 5: 0, ., = */}
                            <Grid item xs={6}><Button fullWidth onClick={() => handleNumber('0')} sx={{ ...numButtonStyle, textAlign: 'left', pl: 3 }}>0</Button></Grid>
                            <Grid item xs={3}><Button fullWidth onClick={() => handleNumber('.')} sx={{ ...numButtonStyle }}>.</Button></Grid>
                            <Grid item xs={3}><Button fullWidth onClick={handleEquals} sx={{ ...buttonStyle, height: 40, bgcolor: '#10B981', color: '#fff', '&:hover': { bgcolor: '#059669' } }}>=</Button></Grid>
                        </Grid>
                    </Box>
                </Paper>
            )}
        </AnimatePresence>
    );
};

export default CalculatorWidget;
