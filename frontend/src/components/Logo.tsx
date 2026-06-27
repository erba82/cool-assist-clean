import React from 'react';
import { Box, useTheme } from '@mui/material';
import { LogoIcon } from './CustomIcons';

interface LogoProps {
    size?: number;
    variant?: 'icon' | 'full';
    animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 40, variant = 'icon', animated = true }) => {
    const theme = useTheme();
    
    const IconLogo = () => (
        <Box
            sx={{
                width: size,
                height: size,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981',
                // Spark animation - flash scale every 2 seconds
                '& svg .animate-spark-pulse': {
                    animation: 'spark-flash 2s infinite ease-in-out',
                    transformOrigin: 'center',
                },
                // Frost animation - green halo after spark flash
                '& svg .animate-frost-pulse': {
                    animation: 'frost-halo 2s infinite ease-in-out',
                },
                '@keyframes spark-flash': {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '5%': { transform: 'scale(1.5)', opacity: 1 },
                    '10%': { transform: 'scale(1)', opacity: 1 },
                },
                '@keyframes frost-halo': {
                    '0%, 10%': { filter: 'drop-shadow(0 0 0px rgba(16, 185, 129, 0))' },
                    '15%': { filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.4))' },
                    '25%': { filter: 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.8))' },
                    '40%': { filter: 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.6))' },
                    '60%': { filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.3))' },
                    '100%': { filter: 'drop-shadow(0 0 0px rgba(16, 185, 129, 0))' },
                },
                '&:hover': {
                    transform: 'scale(1.05)',
                },
                transition: 'transform 0.2s ease',
            }}
        >
            <LogoIcon className="w-full h-full" />
        </Box>
    );

    const FullLogo = () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconLogo />
            <Box
                sx={{
                    color: theme.palette.text.primary,
                    fontWeight: 700,
                    fontSize: `${size * 0.6}px`,
                    fontFamily: '"Inter", sans-serif',
                    letterSpacing: '-0.02em',
                }}
            >
                Cool-Assist
            </Box>
        </Box>
    );

    return variant === 'icon' ? <IconLogo /> : <FullLogo />;
};

export default Logo;
