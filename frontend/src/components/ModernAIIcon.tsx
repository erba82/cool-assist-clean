import React, { useState, useEffect } from 'react';
import { Box, useTheme } from '@mui/material';
import { motion, useAnimation } from 'framer-motion';

interface ModernAIIconProps {
  size?: number;
  isActive?: boolean;
  pulseEffect?: boolean;
}

const ModernAIIcon: React.FC<ModernAIIconProps> = ({ size = 24, isActive = false, pulseEffect = true }) => {
  const theme = useTheme();
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  
  // Black and white color scheme
  const isDark = theme.palette.mode === 'dark';
  const primaryColor = isDark ? '#ffffff' : '#000000';
  const secondaryColor = isDark ? '#e0e0e0' : '#333333';
  const accentColor = isDark ? '#cccccc' : '#666666';
  
  useEffect(() => {
    if (isActive) {
      controls.start({
        rotate: [0, 360],
        transition: { duration: 20, repeat: Infinity, ease: "linear" }
      });
    } else {
      controls.stop();
      controls.set({ rotate: 0 });
    }
  }, [isActive, controls]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer glow effect */}
      {(pulseEffect && isActive) && (
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            background: isDark 
              ? 'radial-gradient(circle, rgba(255,255,255,0.2), rgba(255,255,255,0.05))'
              : 'radial-gradient(circle, rgba(0,0,0,0.2), rgba(0,0,0,0.05))',
            filter: 'blur(8px)',
          }}
        />
      )}
      
      {/* AI Icon */}
      <motion.div
        animate={controls}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bwGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>
            <filter id="bwGlow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Brain outline */}
          <g filter="url(#bwGlow)">
            {/* Left hemisphere */}
            <path
              d="M 35 25 Q 20 30, 20 50 Q 20 70, 35 75 Q 40 77, 45 75 L 45 60 Q 42 58, 40 55 Q 35 50, 40 45 Q 42 42, 45 40 L 45 25 Q 40 23, 35 25 Z"
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
              opacity={isActive ? "1" : "0.8"}
            >
              {isActive && (
                <animate
                  attributeName="opacity"
                  values="0.8;1;0.8"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </path>
            
            {/* Right hemisphere */}
            <path
              d="M 65 25 Q 80 30, 80 50 Q 80 70, 65 75 Q 60 77, 55 75 L 55 60 Q 58 58, 60 55 Q 65 50, 60 45 Q 58 42, 55 40 L 55 25 Q 60 23, 65 25 Z"
              fill="none"
              stroke={primaryColor}
              strokeWidth="2"
              opacity={isActive ? "1" : "0.8"}
            >
              {isActive && (
                <animate
                  attributeName="opacity"
                  values="0.8;1;0.8"
                  dur="2s"
                  repeatCount="indefinite"
                  begin="0.3s"
                />
              )}
            </path>
            
            {/* Neural network lines */}
            <g stroke={accentColor} strokeWidth="1" opacity="0.5">
              <line x1="35" y1="35" x2="65" y2="35" />
              <line x1="35" y1="50" x2="65" y2="50" />
              <line x1="35" y1="65" x2="65" y2="65" />
              <line x1="45" y1="30" x2="55" y2="30" />
              <line x1="45" y1="70" x2="55" y2="70" />
            </g>
            
            {/* Neural nodes */}
            <motion.g
              animate={isActive ? {
                opacity: [0.6, 1, 0.6],
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <circle cx="35" cy="35" r="2.5" fill={primaryColor} />
              <circle cx="35" cy="50" r="2.5" fill={secondaryColor} />
              <circle cx="35" cy="65" r="2.5" fill={primaryColor} />
              <circle cx="65" cy="35" r="2.5" fill={secondaryColor} />
              <circle cx="65" cy="50" r="2.5" fill={primaryColor} />
              <circle cx="65" cy="65" r="2.5" fill={secondaryColor} />
            </motion.g>
            
            {/* Center processing core */}
            <motion.circle
              cx="50"
              cy="50"
              r={isActive ? "5" : "4"}
              fill={primaryColor}
              animate={isActive ? {
                r: [4, 6, 4],
                opacity: [1, 0.7, 1],
              } : {}}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Inner core */}
            <circle
              cx="50"
              cy="50"
              r="2"
              fill={isDark ? '#000000' : '#ffffff'}
            />
            
            {/* Energy pulses */}
            {isActive && (
              <>
                <motion.circle
                  cx="50"
                  cy="50"
                  r="0"
                  stroke={primaryColor}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                  animate={{
                    r: [0, 20, 0],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="0"
                  stroke={secondaryColor}
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.4"
                  animate={{
                    r: [0, 20, 0],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 1,
                  }}
                />
              </>
            )}
          </g>
        </svg>
      </motion.div>
    </Box>
  );
};

export default ModernAIIcon;