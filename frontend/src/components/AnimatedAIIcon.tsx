/*
 * AnimatedAIIcon.tsx
 * Enhanced AI icon with beautiful animations and gradients
 * Date: 2025-04-27 18:15:00
 */

import React, { useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { motion, useAnimation, Variants } from 'framer-motion';
import MemoryIcon from '@mui/icons-material/Memory';

interface AnimatedAIIconProps {
  size?: number;
  color?: string;
  isActive?: boolean;
  onClick?: () => void;
  pulseEffect?: boolean;
}

const AnimatedAIIcon: React.FC<AnimatedAIIconProps> = ({
  size = 24,
  color,
  isActive = false,
  onClick,
  pulseEffect = true
}) => {
  const theme = useTheme();
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  
  // Use modern blue gradient colors instead of plain color
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.info.main;
  
  // Icon animation variants
  const iconVariants: Variants = {
    idle: { 
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
    active: { 
      scale: 1.05,
      rotate: [0, -3, 3, -3, 3, 0], 
      transition: { 
        rotate: { 
          repeat: Infinity, 
          repeatType: "loop", 
          duration: 3,
          ease: "easeInOut" 
        },
        scale: { duration: 0.3 }
      }
    },
    hover: { 
      scale: 1.15, 
      rotate: 0,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.9,
      transition: { duration: 0.1 }
    }
  };
  
  // Ring animation variants
  const ringVariants: Variants = {
    idle: {
      opacity: 0,
      scale: 1.2,
    },
    active: {
      opacity: [0, 0.3, 0],
      scale: [1, 1.2, 1],
      transition: { 
        repeat: Infinity,
        duration: 2.5,
        ease: "easeInOut"
      }
    },
    hover: {
      opacity: 0.2,
      scale: 1.3,
      transition: { duration: 0.2 }
    }
  };
  
  // Update animation based on active state
  useEffect(() => {
    if (isActive) {
      controls.start('active');
    } else {
      controls.start('idle');
    }
  }, [isActive, controls]);
  
  // Particles animation for active state
  const numParticles = 6;
  const particleVariants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0,
    },
    visible: (i: number) => ({
      opacity: [0, 0.7, 0],
      scale: [0, 1, 0],
      x: [0, Math.cos(i * Math.PI * 2 / numParticles) * size],
      y: [0, Math.sin(i * Math.PI * 2 / numParticles) * size],
      transition: {
        repeat: Infinity,
        duration: 2 + i * 0.2,
        delay: i * 0.1,
        ease: "easeInOut",
      }
    })
  };
  
  return (
    <Box 
      sx={{ 
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        width: size,
        height: size,
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated gradient ring */}
      <motion.div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          boxShadow: `0 0 10px 2px rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.3)`,
          filter: 'blur(3px)',
          opacity: 0.5,
        }}
        initial="idle"
        animate={isActive ? 'active' : isHovered ? 'hover' : 'idle'}
        variants={ringVariants}
      />
      
      {/* Animated particles when active */}
      {isActive && pulseEffect && Array.from({ length: numParticles }).map((_, i) => (
        <motion.div
          key={i}
          custom={i}
          initial="hidden"
          animate="visible"
          variants={particleVariants}
          style={{
            position: 'absolute',
            width: size / 8,
            height: size / 8,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            opacity: 0.7,
          }}
        />
      ))}
      
      {/* Animated icon */}
      <motion.div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2,
          filter: `drop-shadow(0 0 3px ${primaryColor})`,
        }}
        initial="idle"
        animate={controls}
        variants={iconVariants}
        whileHover="hover"
        whileTap="tap"
      >
        <MemoryIcon 
          sx={{ 
            fontSize: size,
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#256EFF',
          }} 
        />
      </motion.div>
    </Box>
  );
};

export default AnimatedAIIcon;