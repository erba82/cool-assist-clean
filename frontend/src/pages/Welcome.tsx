import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';

const Welcome: React.FC = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const mode = theme.palette.mode;
    const [currentWord, setCurrentWord] = useState(0);

    const words = ['HVACR', 'Electrical', 'Engineering', 'AI-Powered'];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWord((prev) => (prev + 1) % words.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleGetStarted = () => {
        navigate('/dashboard');
    };

    const bgGradient = mode === 'light'
        ? 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)'
        : 'linear-gradient(180deg, #0a0a0a 0%, #151515 100%)';

    const gridPattern = mode === 'light'
        ? 'radial-gradient(circle at 1px 1px, #e5e5e5 1px, transparent 1px)'
        : 'radial-gradient(circle at 1px 1px, #262626 1px, transparent 1px)';

    return (
        <div style={{
            minHeight: '100vh',
            background: bgGradient,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {/* Minimal Grid Pattern */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: gridPattern,
                backgroundSize: '40px 40px',
                opacity: 0.5,
            }} />

            {/* Main Content */}
            <Container maxWidth="md" style={{ textAlign: 'center', position: 'relative', zIndex: 10 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {/* Minimal Logo - Centered */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Logo size={100} animated={true} />
                        </motion.div>
                    </div>

                    {/* Brand Name */}
                    <Typography
                        variant="h1"
                        style={{
                            fontSize: '4rem',
                            fontWeight: 700,
                            color: mode === 'light' ? '#0a0a0a' : '#ffffff',
                            marginBottom: 16,
                            letterSpacing: '-0.03em',
                        }}
                    >
                        Cool-Assist
                    </Typography>

                    {/* Dynamic Subtitle */}
                    <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentWord}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Typography
                                    variant="h6"
                                    style={{
                                        fontSize: '1.25rem',
                                        color: mode === 'light' ? '#666666' : '#999999',
                                        fontWeight: 400,
                                    }}
                                >
                                    {words[currentWord]} Assistant
                                </Typography>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Minimal Description */}
                    <Typography
                        variant="body1"
                        style={{
                            color: mode === 'light' ? '#666666' : '#999999',
                            marginBottom: 40,
                            maxWidth: 480,
                            margin: '0 auto 40px',
                            lineHeight: 1.6,
                            fontSize: '0.938rem',
                        }}
                    >
                        AI-powered engineering platform for HVACR and electrical professionals
                    </Typography>

                    {/* Minimal CTA Button */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={handleGetStarted}
                            variant="contained"
                            style={{
                                padding: '12px 40px',
                                fontSize: '1rem',
                                borderRadius: 8,
                                backgroundColor: mode === 'light' ? '#0a0a0a' : '#ffffff',
                                color: mode === 'light' ? '#ffffff' : '#0a0a0a',
                            }}
                        >
                            Get Started
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Minimal Footer */}
                <div style={{ marginTop: 64 }}>
                    <Typography
                        variant="caption"
                        style={{
                            color: mode === 'light' ? '#999999' : '#666666',
                            fontSize: '0.813rem'
                        }}
                    >
                        Professional Engineering Platform
                    </Typography>
                </div>
            </Container>
        </div>
    );
};

export default Welcome;