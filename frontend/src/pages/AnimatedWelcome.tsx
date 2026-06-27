// AnimatedWelcome.tsx (با Container maxWidth="md")

import React, { useEffect, useState } from 'react';
import { Box, Typography, Container, Fade } from '@mui/material';

// Define props interface with onComplete
interface AnimatedWelcomeProps {
  onComplete: () => void;
}

const AnimatedWelcome: React.FC<AnimatedWelcomeProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0); // State for animation steps

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = [];

    // Timer for step 1 (Show "Welcome to Cool Assist")
    timeouts.push(setTimeout(() => setStep(1), 500)); // Slight delay before starting

    // Timer for step 2 (Show subtitle)
    timeouts.push(setTimeout(() => setStep(2), 2000)); // 1.5 seconds after step 1 starts

    // Timer for step 3 (Show description)
    timeouts.push(setTimeout(() => setStep(3), 3500)); // 1.5 seconds after step 2 starts

    // Timer to call onComplete after everything is shown
    timeouts.push(setTimeout(() => {
        console.log("AnimatedWelcome complete, calling onComplete..."); // For debugging
        onComplete();
    }, 5500)); // 2 seconds after the last text appears

    // Cleanup function: clear all timers if the component unmounts
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [onComplete]); // Run only once on mount

  return (
    // --- تغییر اصلی اینجاست: maxWidth="md" ---
    <Container maxWidth="md" sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Step 1: Main Title */}
        <Fade in={step >= 1} timeout={1000}>
          <Typography
            variant="h2" // <-- h2 باقی می‌ماند
            component="h1"
            sx={{
              mb: 4,
              fontWeight: 'bold',
              color: 'primary.main'
              // whiteSpace: 'nowrap' // حذف شده
            }}
          >
            Welcome to Cool Assist
          </Typography>
        </Fade>

        {/* Step 2: Subtitle */}
        <Fade in={step >= 2} timeout={1000}>
          <Typography
            variant="h5"
            sx={{
              mb: 4,
            }}
          >
            Your Intelligent HVACR Engineering Assistant
          </Typography>
        </Fade>

        {/* Step 3: Description */}
        <Fade in={step >= 3} timeout={1000}>
          <Typography
            variant="body1"
            sx={{
              mb: 4,
            }}
          >
            We provide powerful tools to help you design, calculate, and manage your HVACR projects with ease.
          </Typography>
        </Fade>
      </Box>
    </Container>
  );
};

export default AnimatedWelcome;