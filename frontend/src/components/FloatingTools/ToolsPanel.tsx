/**
 * ToolsPanel.tsx
 * Floating tools menu with MUI styling (no Tailwind dependency)
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Typography, IconButton, Paper } from '@mui/material';

interface ToolsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTool: (tool: 'refrigerant' | 'calculator' | 'converter') => void;
    onMinimize?: () => void;
}

const tools = [
    {
        id: 'refrigerant' as const,
        name: 'Refrigerant Props',
        description: 'P-T charts, Enthalpy',
        icon: 'thermometer',
        bgColor: '#EFF6FF',
        iconColor: '#3B82F6',
    },
    {
        id: 'calculator' as const,
        name: 'Eng. Calculator',
        description: 'Scientific functions',
        icon: 'calculate',
        bgColor: '#EEF2FF',
        iconColor: '#6366F1',
    },
    {
        id: 'converter' as const,
        name: 'Unit Converter',
        description: 'Length, Mass, Pressure',
        icon: 'compare_arrows',
        bgColor: '#ECFDF5',
        iconColor: '#10B981',
    },
];

const ToolsPanel: React.FC<ToolsPanelProps> = ({ isOpen, onClose, onSelectTool, onMinimize }) => {
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
                    sx={{
                        width: 340,
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid #E5E7EB',
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            height: 44,
                            bgcolor: '#F9FAFB',
                            borderBottom: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            px: 2,
                            cursor: 'move',
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span className="material-symbols-outlined" style={{ color: '#10B981', fontSize: 20 }}>handyman</span>
                            <Typography variant="subtitle2" fontWeight={600} color="#374151">Tools</Typography>
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
                    <Box sx={{ p: 2 }}>
                        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, display: 'block' }}>
                            Select Utility
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {tools.map((tool, index) => (
                                <Box
                                    key={tool.id}
                                    component={motion.button}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onSelectTool(tool.id)}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        p: 1.5,
                                        borderRadius: 2,
                                        border: '1px solid #E5E7EB',
                                        bgcolor: '#FFFFFF',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: '#10B981',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            bgcolor: '#F9FAFB',
                                        }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            bgcolor: tool.bgColor,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'scale(1.1)' }
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ color: tool.iconColor, fontSize: 24 }}>{tool.icon}</span>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" fontWeight={700} color="#1F2937">{tool.name}</Typography>
                                        <Typography variant="caption" color="#6B7280">{tool.description}</Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Footer */}
                    <Box sx={{ height: 24, bgcolor: '#F9FAFB', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ width: 40, height: 4, bgcolor: '#E5E7EB', borderRadius: 2 }} />
                    </Box>
                </Paper>
            )}
        </AnimatePresence>
    );
};

export default ToolsPanel;
