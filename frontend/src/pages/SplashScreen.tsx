import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { motion, Variants } from 'framer-motion';

// آدرس صحیح لوگو
import logoFromFile from '../assets/logo.png';

// رنگ‌های پس‌زمینه مطابق با لوگو
const LOGO_BLUE = '#0D47A1';
const LOGO_WHITE_OR_GREY = '#FFFFFF';

interface SplashScreenProps {
    onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    const [showLogo, setShowLogo] = useState<boolean>(false);
    const [showText, setShowText] = useState<boolean>(false);
    const [isAnimating, setIsAnimating] = useState<boolean>(false);

    useEffect(() => {
        const timeouts: NodeJS.Timeout[] = [];
        
        // تاخیر اندکی برای شروع انیمیشن
        timeouts.push(setTimeout(() => setShowLogo(true), 500));
        
        // نمایش متن بعد از لوگو
        timeouts.push(setTimeout(() => setShowText(true), 1700));
        
        // فعال‌سازی انیمیشن‌های framer-motion
        timeouts.push(setTimeout(() => setIsAnimating(true), 800));
        
        // اتمام اسپلش اسکرین
        timeouts.push(setTimeout(() => {
            console.log("Splash screen (two-tone) complete, calling onComplete...");
            onComplete();
        }, 3700));
        
        return () => { timeouts.forEach(clearTimeout); };
    }, [onComplete]);

    // انیمیشن‌های motion
    const logoVariants: Variants = {
        hidden: { scale: 0.8, opacity: 0 },
        visible: { 
            scale: 1, 
            opacity: 1,
            transition: { 
                type: "spring" as const, 
                damping: 12,
                duration: 0.8
            }
        }
    };

    const textVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                duration: 0.8,
                delay: 0.2
            }
        }
    };

    const leftPanelVariants: Variants = {
        hidden: { x: '-100%' },
        visible: { 
            x: 0,
            transition: { 
                type: "tween" as const, 
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1]
            }
        }
    };

    const rightPanelVariants: Variants = {
        hidden: { x: '100%' },
        visible: { 
            x: 0,
            transition: { 
                type: "tween" as const, 
                duration: 0.8,
                ease: [0.4, 0, 0.2, 1]
            }
        }
    };

    return (
        <Box
            sx={{
                position: 'fixed', 
                top: 0, 
                left: 0, 
                width: '100vw', 
                height: '100vh',
                display: 'flex', 
                zIndex: 9999, 
                overflow: 'hidden',
                background: '#000', 
            }}
        >
            {/* نیمه آبی سمت چپ */}
            <motion.div
                initial="hidden"
                animate={isAnimating ? "visible" : "hidden"}
                variants={leftPanelVariants}
                style={{
                    flex: 1,
                    height: '100%',
                    backgroundColor: LOGO_BLUE
                }}
            />
            
            {/* نیمه سفید/خاکستری سمت راست */}
            <motion.div
                initial="hidden"
                animate={isAnimating ? "visible" : "hidden"}
                variants={rightPanelVariants}
                style={{
                    flex: 1,
                    height: '100%',
                    backgroundColor: LOGO_WHITE_OR_GREY
                }}
            />

            {/* محتوای روی پس‌زمینه (لوگو و متن) - کاملاً وسط چین */}
            <Box
                sx={{
                    position: 'absolute', // روی پس‌زمینه قرار بگیرد
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%',
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center',
                }}
            >
                {/* لوگو با انیمیشن */}
                <motion.div
                    initial="hidden"
                    animate={showLogo ? "visible" : "hidden"}
                    variants={logoVariants}
                >
                    <img
                        src={logoFromFile}
                        alt="Cool-Assist Logo"
                        style={{
                            maxHeight: '150px', 
                            maxWidth: '80%', 
                            marginBottom: '32px',
                            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
                        }}
                    />
                </motion.div>

                {/* متن با انیمیشن */}
                <motion.div
                    initial="hidden"
                    animate={showText ? "visible" : "hidden"}
                    variants={textVariants}
                >
                    <Typography
                        variant="h5" 
                        component="p"
                        sx={{
                            color: LOGO_BLUE,
                            textAlign: 'center', 
                            fontWeight: 500, 
                            textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            background: 'rgba(255,255,255,0.7)',
                            py: 1,
                            px: 3,
                            borderRadius: 2,
                            backdropFilter: 'blur(4px)'
                        }}
                    >
                        AI-Powered HVACR & Electrical Engineering Assistant
                    </Typography>
                </motion.div>
            </Box>
        </Box>
    );
};

export default SplashScreen;