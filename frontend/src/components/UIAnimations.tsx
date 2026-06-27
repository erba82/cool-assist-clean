import React, { ReactNode } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Box, Paper, Card, useTheme } from '@mui/material';

// کامپوننت کارت انیمیشنی
export const AnimatedCard: React.FC<{
  children: ReactNode;
  delay?: number;
  sx?: any;
  onClick?: () => void;
}> = ({ children, delay = 0, sx = {}, onClick }) => {
  const theme = useTheme();
  
  const variants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        duration: 0.4, 
        delay, 
        ease: [0.4, 0, 0.2, 1],
      }
    },
    hover: { 
      y: -8, 
      boxShadow: theme.palette.mode === 'dark'
        ? '0 10px 30px rgba(255,255,255,0.1)'
        : '0 10px 30px rgba(0,0,0,0.1)',
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.98, transition: { duration: 0.1 } }
  };
  
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
    >
      <Card
        elevation={3}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.3s ease',
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg, #1e1e1e, #2d2d2d)'
            : 'linear-gradient(145deg, #f8f9fa, #ffffff)',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.1), transparent)',
            transform: 'translateX(-100%)',
            transition: 'transform 0.8s ease-in-out',
          },
          '&:hover::after': {
            transform: 'translateX(100%)',
          },
          ...sx
        }}
      >
        {children}
      </Card>
    </motion.div>
  );
};

// کامپوننت سرتیتر صفحه با انیمیشن
export const AnimatedPageHeader: React.FC<{
  children: ReactNode;
  icon?: ReactNode;
}> = ({ children, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: 'spring' as const, stiffness: 50 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        {icon && (
          <motion.div
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ marginRight: '16px' }}
          >
            {icon}
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </Box>
    </motion.div>
  );
};

// کامپوننت لیست آیتم‌های انیمیشنی
export const AnimatedList: React.FC<{
  children: ReactNode[];
  staggerDelay?: number;
}> = ({ children, staggerDelay = 0.1 }) => {
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={itemVariants} transition={{ duration: 0.4 }}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// کامپوننت باکس با انیمیشن‌های مختلف
export const AnimatedBox: React.FC<{
  children: ReactNode;
  delay?: number;
  animation?: string;
  sx?: any;
}> = ({ children, delay = 0, animation = 'fadeInUp', sx = {} }) => {
  const animations: Record<string, Variants> = {
    fadeInUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0, 
        transition: { duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }
      }
    },
    fadeInLeft: {
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, 
        x: 0, 
        transition: { duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }
      }
    },
    fadeInRight: {
      hidden: { opacity: 0, x: 20 },
      visible: { 
        opacity: 1, 
        x: 0, 
        transition: { duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }
      }
    },
    zoomIn: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1, 
        transition: { duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }
      }
    },
  };

  const selectedAnimation = animations[animation as keyof typeof animations] || animations.fadeInUp;

  return (
    <motion.div
      variants={selectedAnimation}
      initial="hidden"
      animate="visible"
    >
      <Box sx={sx}>
        {children}
      </Box>
    </motion.div>
  );
};

// کامپوننت ترنزیشن صفحه
export const PageTransition: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{ width: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// کامپوننت متن با انیمیشن تایپ
export const TypedText: React.FC<{
  text: string;
  duration?: number;
  delay?: number;
}> = ({ text, duration = 1, delay = 0 }) => {
  const words = text.split(" ");
  
  return (
    <span style={{ display: "inline-block" }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: duration / words.length, 
            delay: delay + (i * (duration / words.length)) 
          }}
          style={{ marginRight: '4px', display: "inline-block" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

// کامپوننت دکمه با انیمیشن
export const AnimatedButton: React.FC<{
  children: ReactNode;
  onClick?: () => void;
  sx?: any;
}> = ({ children, onClick, sx = {} }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      style={{ display: "inline-block", ...sx }}
    >
      {children}
    </motion.div>
  );
};