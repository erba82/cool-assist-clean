/*
 * EngineeringCalculator.tsx
 * Fixed version with proper motion handling
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Button,
  Typography,
  TextField,
  IconButton,
  Divider,
  useTheme,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip
} from '@mui/material';
import BackspaceIcon from '@mui/icons-material/Backspace';
import HistoryIcon from '@mui/icons-material/History';
import FunctionsIcon from '@mui/icons-material/Functions';
import CalculateIcon from '@mui/icons-material/Calculate';
import ScienceIcon from '@mui/icons-material/Science';
import MemoryIcon from '@mui/icons-material/Memory';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

// Styled components for calculator with improved dark mode
const CalculatorPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[900] 
    : theme.palette.background.paper,
  background: theme.palette.mode === 'dark' 
    ? 'linear-gradient(145deg, #1e1e1e, #2d2d2d)' 
    : 'linear-gradient(145deg, #f0f0f0, #ffffff)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
    : '0 8px 32px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
  maxWidth: 450,
  margin: '0 auto',
}));

const DisplayField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    fontSize: '1.8rem',
    textAlign: 'right',
    padding: theme.spacing(2),
    fontFamily: 'Roboto Mono, monospace',
    color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit',
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'inherit',
  },
  marginBottom: theme.spacing(2),
}));

// MotionButton to replace styled CalcButton with framer-motion
const MotionButton = motion(Button);

const CalcButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  padding: theme.spacing(1.5),
  fontSize: '1.2rem',
  fontWeight: 'bold',
  width: '100%',
  height: '100%',
  minHeight: 60,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 4px 8px rgba(255, 255, 255, 0.1)'
      : '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
}));

const OperatorButton = styled(CalcButton)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const NumberButton = styled(CalcButton)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#f5f5f5',
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0',
  },
}));

const FunctionButton = styled(CalcButton)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.secondary.dark 
    : theme.palette.secondary.light,
  color: theme.palette.secondary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.secondary.main,
  },
}));

const EqualsButton = styled(CalcButton)(({ theme }) => ({
  backgroundColor: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.secondary.dark,
  },
}));

const HistoryPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  overflowY: 'auto',
  maxHeight: 500,
  borderRadius: theme.spacing(2),
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 12px rgba(255, 255, 255, 0.05)'
    : '0 4px 12px rgba(0, 0, 0, 0.08)',
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[900] 
    : theme.palette.background.paper,
}));

const MemoryButtonStyled = styled(Button)(({ theme }) => ({
  minWidth: 'auto',
  padding: theme.spacing(0.5, 1),
  margin: theme.spacing(0, 0.5),
  fontSize: '0.8rem',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : undefined,
}));

// Interface for calculator mode
interface CalculatorMode {
  id: string;
  name: string;
  icon: React.ReactElement;
}

// Interface for engineering unit
interface EngineeringUnit {
  id: string;
  name: string;
  category: string;
  conversionFactor: number; // to base unit
}

// Calculator modes
const calculatorModes: CalculatorMode[] = [
  { id: 'standard', name: 'Standard', icon: <CalculateIcon /> },
  { id: 'scientific', name: 'Scientific', icon: <FunctionsIcon /> },
  { id: 'engineering', name: 'Engineering', icon: <ScienceIcon /> },
  { id: 'programmer', name: 'Programmer', icon: <MemoryIcon /> },
];

// Engineering units for conversions
const engineeringUnits: EngineeringUnit[] = [
  // Temperature
  { id: 'celsius', name: 'Celsius (°C)', category: 'temperature', conversionFactor: 1 },
  { id: 'fahrenheit', name: 'Fahrenheit (°F)', category: 'temperature', conversionFactor: 1.8 },
  { id: 'kelvin', name: 'Kelvin (K)', category: 'temperature', conversionFactor: 1 },
  
  // Pressure
  { id: 'pascal', name: 'Pascal (Pa)', category: 'pressure', conversionFactor: 1 },
  { id: 'kilopascal', name: 'Kilopascal (kPa)', category: 'pressure', conversionFactor: 1000 },
  { id: 'bar', name: 'Bar', category: 'pressure', conversionFactor: 100000 },
  { id: 'psi', name: 'PSI', category: 'pressure', conversionFactor: 6894.76 },
  
  // Power
  { id: 'watt', name: 'Watt (W)', category: 'power', conversionFactor: 1 },
  { id: 'kilowatt', name: 'Kilowatt (kW)', category: 'power', conversionFactor: 1000 },
  { id: 'btu_h', name: 'BTU/h', category: 'power', conversionFactor: 0.29307107 },
  { id: 'ton_ref', name: 'Refrigeration Ton', category: 'power', conversionFactor: 3516.85 },
];

// Engineering constants
const engineeringConstants = [
  { id: 'pi', name: 'π (Pi)', value: Math.PI },
  { id: 'e', name: 'e (Euler\'s number)', value: Math.E },
  { id: 'g', name: 'g (Gravity)', value: 9.80665 },
  { id: 'r', name: 'R (Gas constant)', value: 8.31446 },
  { id: 'stefan_boltzmann', name: 'σ (Stefan-Boltzmann)', value: 5.67e-8 },
  { id: 'avogadro', name: 'NA (Avogadro\'s number)', value: 6.022e23 },
];

const EngineeringCalculator: React.FC = () => {
  const theme = useTheme();
  const [display, setDisplay] = useState('0');
  const [memory, setMemory] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [calculatorMode, setCalculatorMode] = useState<string>('standard');
  const [angleUnit, setAngleUnit] = useState<string>('deg');
  const [memoryArray, setMemoryArray] = useState<string[]>([]);
  const [showMemory, setShowMemory] = useState(false);
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  // Handle calculator mode change
  const handleModeChange = (event: React.SyntheticEvent, newMode: string) => {
    if (newMode !== null) {
      setCalculatorMode(newMode);
    }
  };

  // Handle angle unit change
  const handleAngleUnitChange = (event: SelectChangeEvent) => {
    setAngleUnit(event.target.value);
  };

  const clearDisplay = () => {
    setDisplay('0');
    setWaitingForOperand(false);
    setLastPressed('C');
  };

  const clearAll = () => {
    setDisplay('0');
    setMemory(null);
    setOperation(null);
    setWaitingForOperand(false);
    setLastPressed('AC');
  };

  const inputDigit = (digit: string) => {
    setLastPressed(digit);
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    setLastPressed('.');
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const toggleSign = () => {
    setLastPressed('+/-');
    setDisplay(display.charAt(0) === '-' ? display.substring(1) : '-' + display);
  };

  const inputPercent = () => {
    setLastPressed('%');
    const value = parseFloat(display);
    setDisplay(String(value / 100));
  };

  const performOperation = (nextOperation: string) => {
    setLastPressed(nextOperation);
    const inputValue = parseFloat(display);

    if (memory === null) {
      setMemory(display);
    } else if (operation) {
      const currentValue = parseFloat(memory);
      let newValue: number;

      switch (operation) {
        case '+':
          newValue = currentValue + inputValue;
          break;
        case '-':
          newValue = currentValue - inputValue;
          break;
        case '×':
          newValue = currentValue * inputValue;
          break;
        case '÷':
          newValue = currentValue / inputValue;
          break;
        case 'x^y':
          newValue = Math.pow(currentValue, inputValue);
          break;
        case 'mod':
          newValue = currentValue % inputValue;
          break;
        default:
          newValue = inputValue;
      }

      const historyEntry = `${currentValue} ${operation} ${inputValue} = ${newValue}`;
      setHistory([...history, historyEntry]);
      setMemory(String(newValue));
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculateResult = () => {
    if (!memory || !operation) return;
    setLastPressed('=');

    const inputValue = parseFloat(display);
    const currentValue = parseFloat(memory);
    let newValue: number;

    switch (operation) {
      case '+':
        newValue = currentValue + inputValue;
        break;
      case '-':
        newValue = currentValue - inputValue;
        break;
      case '×':
        newValue = currentValue * inputValue;
        break;
      case '÷':
        newValue = currentValue / inputValue;
        break;
      case 'x^y':
        newValue = Math.pow(currentValue, inputValue);
        break;
      case 'mod':
        newValue = currentValue % inputValue;
        break;
      default:
        newValue = inputValue;
    }

    const historyEntry = `${currentValue} ${operation} ${inputValue} = ${newValue}`;
    setHistory([...history, historyEntry]);
    setDisplay(String(newValue));
    setMemory(null);
    setOperation(null);
    setWaitingForOperand(true);
  };

  const performFunction = (func: string) => {
    setLastPressed(func);
    const inputValue = parseFloat(display);
    let result: number;

    switch (func) {
      case 'sqrt':
        result = Math.sqrt(inputValue);
        break;
      case 'cbrt':
        result = Math.cbrt(inputValue);
        break;
      case 'sin':
        result = angleUnit === 'rad' 
          ? Math.sin(inputValue) 
          : Math.sin(inputValue * (Math.PI / 180));
        break;
      case 'cos':
        result = angleUnit === 'rad' 
          ? Math.cos(inputValue) 
          : Math.cos(inputValue * (Math.PI / 180));
        break;
      case 'tan':
        result = angleUnit === 'rad' 
          ? Math.tan(inputValue) 
          : Math.tan(inputValue * (Math.PI / 180));
        break;
      case 'asin':
        result = angleUnit === 'rad' 
          ? Math.asin(inputValue) 
          : Math.asin(inputValue) * (180 / Math.PI);
        break;
      case 'acos':
        result = angleUnit === 'rad' 
          ? Math.acos(inputValue) 
          : Math.acos(inputValue) * (180 / Math.PI);
        break;
      case 'atan':
        result = angleUnit === 'rad' 
          ? Math.atan(inputValue) 
          : Math.atan(inputValue) * (180 / Math.PI);
        break;
      case 'log':
        result = Math.log10(inputValue);
        break;
      case 'ln':
        result = Math.log(inputValue);
        break;
      case 'exp':
        result = Math.exp(inputValue);
        break;
      case '1/x':
        result = 1 / inputValue;
        break;
      case 'x^2':
        result = Math.pow(inputValue, 2);
        break;
      case 'x^3':
        result = Math.pow(inputValue, 3);
        break;
      case 'fact':
        if (inputValue < 0 || !Number.isInteger(inputValue)) {
          setDisplay('Error');
          return;
        }
        result = factorial(inputValue);
        break;
      default:
        return;
    }

    const historyEntry = `${func}(${inputValue}) = ${result}`;
    setHistory([...history, historyEntry]);
    setDisplay(String(result));
    setWaitingForOperand(true);
  };

  // Calculate factorial
  const factorial = (n: number): number => {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  };

  // Memory functions
  const memoryStore = () => {
    const value = display;
    setMemoryArray([...memoryArray, value]);
    setLastPressed('MS');
  };

  const memoryRecall = (index: number) => {
    if (index >= 0 && index < memoryArray.length) {
      setDisplay(memoryArray[index]);
      setWaitingForOperand(true);
      setLastPressed('MR');
    }
  };

  const memoryClear = () => {
    setMemoryArray([]);
    setLastPressed('MC');
  };

  const memoryAdd = () => {
    setLastPressed('M+');
    const currentValue = parseFloat(display);
    if (memoryArray.length > 0) {
      const lastMemory = parseFloat(memoryArray[memoryArray.length - 1]);
      const newValue = lastMemory + currentValue;
      const newMemoryArray = [...memoryArray];
      newMemoryArray[newMemoryArray.length - 1] = String(newValue);
      setMemoryArray(newMemoryArray);
    } else {
      memoryStore();
    }
  };

  const memorySubtract = () => {
    setLastPressed('M-');
    const currentValue = parseFloat(display);
    if (memoryArray.length > 0) {
      const lastMemory = parseFloat(memoryArray[memoryArray.length - 1]);
      const newValue = lastMemory - currentValue;
      const newMemoryArray = [...memoryArray];
      newMemoryArray[newMemoryArray.length - 1] = String(newValue);
      setMemoryArray(newMemoryArray);
    }
  };

  // Insert constant
  const insertConstant = (constant: number) => {
    setDisplay(String(constant));
    setWaitingForOperand(true);
    setLastPressed('constant');
  };

  // Button animation variants
  const buttonVariants = {
    pressed: { scale: 0.95, opacity: 0.8 },
    normal: { scale: 1, opacity: 1 }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CalculateIcon sx={{ mr: 1 }} /> Engineering Calculator
      </Typography>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs
          value={calculatorMode}
          onChange={handleModeChange}
          variant="fullWidth"
          indicatorColor="secondary"
          textColor="secondary"
          sx={{ 
            mb: 2, 
            borderRadius: 1, 
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.05)' 
              : 'background.paper',
            '& .MuiTabs-indicator': {
              height: 3
            }
          }}
        >
          {calculatorModes.map((mode) => (
            <Tab 
              key={mode.id} 
              value={mode.id} 
              label={mode.name} 
              icon={mode.icon} 
              iconPosition="start"
            />
          ))}
        </Tabs>
      </motion.div>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={showHistory || showMemory ? 8 : 12}>
          <CalculatorPaper elevation={3}>
            {(calculatorMode === 'scientific' || calculatorMode === 'engineering') && (
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="angle-unit-label">Angle</InputLabel>
                  <Select
                    labelId="angle-unit-label"
                    value={angleUnit}
                    label="Angle"
                    onChange={handleAngleUnitChange}
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : undefined
                    }}
                  >
                    <MenuItem value="deg">Degrees</MenuItem>
                    <MenuItem value="rad">Radians</MenuItem>
                  </Select>
                </FormControl>
                
                <Box>
                  <Tooltip title="Memory Store">
                    <MotionButton
                      variant="outlined" 
                      color="primary" 
                      onClick={memoryStore}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={lastPressed === 'MS' ? { scale: 0.95 } : { scale: 1 }}
                      sx={{ 
                        minWidth: 'auto',
                        padding: theme.spacing(0.5, 1),
                        margin: theme.spacing(0, 0.5),
                        fontSize: '0.8rem',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : undefined,
                      }}
                    >
                      MS
                    </MotionButton>
                  </Tooltip>
                  <Tooltip title="Memory Recall">
                    <MotionButton
                      variant="outlined" 
                      color="primary" 
                      onClick={() => setShowMemory(!showMemory)}
                      disabled={memoryArray.length === 0}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={lastPressed === 'MR' ? { scale: 0.95 } : { scale: 1 }}
                      sx={{ 
                        minWidth: 'auto',
                        padding: theme.spacing(0.5, 1),
                        margin: theme.spacing(0, 0.5),
                        fontSize: '0.8rem',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : undefined,
                      }}
                    >
                      MR
                    </MotionButton>
                  </Tooltip>
                  <Tooltip title="Memory Add">
                    <MotionButton
                      variant="outlined" 
                      color="primary" 
                      onClick={memoryAdd}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={lastPressed === 'M+' ? { scale: 0.95 } : { scale: 1 }}
                      sx={{ 
                        minWidth: 'auto',
                        padding: theme.spacing(0.5, 1),
                        margin: theme.spacing(0, 0.5),
                        fontSize: '0.8rem',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : undefined,
                      }}
                    >
                      M+
                    </MotionButton>
                  </Tooltip>
                  <Tooltip title="Memory Subtract">
                    <MotionButton
                      variant="outlined" 
                      color="primary" 
                      onClick={memorySubtract}
                      disabled={memoryArray.length === 0}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={lastPressed === 'M-' ? { scale: 0.95 } : { scale: 1 }}
                      sx={{ 
                        minWidth: 'auto',
                        padding: theme.spacing(0.5, 1),
                        margin: theme.spacing(0, 0.5),
                        fontSize: '0.8rem',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : undefined,
                      }}
                    >
                      M-
                    </MotionButton>
                  </Tooltip>
                </Box>
              </Box>
            )}
            
            <DisplayField
              fullWidth
              variant="outlined"
              value={display}
              InputProps={{
                readOnly: true,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(0, 0, 0, 0.02)'
                }
              }}
            />
            
            <Grid container spacing={1}>
              {/* Scientific/Engineering functions */}
              {(calculatorMode === 'scientific' || calculatorMode === 'engineering') && (
                <>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'sin' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('sin')}>sin</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'cos' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('cos')}>cos</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'tan' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('tan')}>tan</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'sqrt' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('sqrt')}>√</FunctionButton>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'asin' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('asin')}>sin⁻¹</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'acos' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('acos')}>cos⁻¹</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'atan' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('atan')}>tan⁻¹</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'cbrt' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('cbrt')}>∛</FunctionButton>
                    </motion.div>
                  </Grid>
                </>
              )}
              
              {/* Engineering specific functions */}
              {calculatorMode === 'engineering' && (
                <>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'constant' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => insertConstant(Math.PI)}>π</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'constant' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => insertConstant(Math.E)}>e</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'mod' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performOperation('mod')}>mod</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'fact' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('fact')}>n!</FunctionButton>
                    </motion.div>
                  </Grid>
                </>
              )}
              
              {/* Scientific functions second row */}
              {(calculatorMode === 'scientific' || calculatorMode === 'engineering') && (
                <>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'log' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('log')}>log</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'ln' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('ln')}>ln</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === 'x^y' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performOperation('x^y')}>x^y</FunctionButton>
                    </motion.div>
                  </Grid>
                  <Grid item xs={3}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      animate={lastPressed === '1/x' ? 'pressed' : 'normal'}
                      variants={buttonVariants}
                    >
                      <FunctionButton onClick={() => performFunction('1/x')}>1/x</FunctionButton>
                    </motion.div>
                  </Grid>
                </>
              )}
              
              {/* Programmer mode functions */}
              {calculatorMode === 'programmer' && (
                <>
                  <Grid item xs={3}>
                    <FunctionButton disabled>HEX</FunctionButton>
                  </Grid>
                  <Grid item xs={3}>
                    <FunctionButton disabled>DEC</FunctionButton>
                  </Grid>
                  <Grid item xs={3}>
                    <FunctionButton disabled>OCT</FunctionButton>
                  </Grid>
                  <Grid item xs={3}>
                    <FunctionButton disabled>BIN</FunctionButton>
                  </Grid>
                  
                  <Grid item xs={3}>
                    <FunctionButton disabled>AND</FunctionButton>
                  </Grid>
                  <Grid item xs={3}>
                    <FunctionButton disabled>OR</FunctionButton>
                  </Grid>
                  <Grid item xs={3}>
                    <FunctionButton disabled>XOR</FunctionButton>
                  </Grid>
                  <Grid item xs={3}>
                    <FunctionButton disabled>NOT</FunctionButton>
                  </Grid>
                </>
              )}
              
              {/* Clear and backspace row */}
              <Grid item xs={6}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === 'AC' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <Button
                    onClick={clearAll}
                    sx={{ 
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.error.dark 
                        : theme.palette.error.light, 
                      color: theme.palette.mode === 'dark'
                        ? theme.palette.error.contrastText
                        : theme.palette.error.contrastText,
                      '&:hover': {
                        backgroundColor: theme.palette.error.main,
                      },
                      borderRadius: theme.spacing(1),
                      padding: theme.spacing(1.5),
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      width: '100%',
                      height: '100%',
                      minHeight: 60,
                    }}
                  >
                    AC
                  </Button>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === 'C' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <Button
                    onClick={clearDisplay}
                    sx={{ 
                      backgroundColor: theme.palette.mode === 'dark'
                        ? theme.palette.warning.dark
                        : theme.palette.warning.light,
                      color: theme.palette.warning.contrastText,
                      '&:hover': {
                        backgroundColor: theme.palette.warning.main,
                      },
                      borderRadius: theme.spacing(1),
                      padding: theme.spacing(1.5),
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      width: '100%',
                      height: '100%',
                      minHeight: 60,
                    }}
                  >
                    C
                  </Button>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <OperatorButton
                    onClick={() => {
                      setLastPressed('backspace');
                      setDisplay(display.slice(0, -1) || '0');
                    }}
                  >
                    <BackspaceIcon />
                  </OperatorButton>
                </motion.div>
              </Grid>
              
              {/* Number pad and operations */}
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '7' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('7')}>7</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '8' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('8')}>8</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '9' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('9')}>9</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '÷' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <OperatorButton onClick={() => performOperation('÷')}>÷</OperatorButton>
                </motion.div>
              </Grid>
              
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '4' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('4')}>4</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '5' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('5')}>5</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '6' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('6')}>6</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '×' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <OperatorButton onClick={() => performOperation('×')}>×</OperatorButton>
                </motion.div>
              </Grid>
              
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '1' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('1')}>1</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '2' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('2')}>2</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '3' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('3')}>3</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '-' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <OperatorButton onClick={() => performOperation('-')}>−</OperatorButton>
                </motion.div>
              </Grid>
              
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '0' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={() => inputDigit('0')}>0</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '.' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={inputDecimal}>.</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '+/-' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <NumberButton onClick={toggleSign}>+/−</NumberButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '+' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <OperatorButton onClick={() => performOperation('+')}>+</OperatorButton>
                </motion.div>
              </Grid>
              
              {/* Equals button and history */}
              <Grid item xs={9}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  animate={lastPressed === '=' ? 'pressed' : 'normal'}
                  variants={buttonVariants}
                >
                  <EqualsButton onClick={calculateResult}>=</EqualsButton>
                </motion.div>
              </Grid>
              <Grid item xs={3}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <FunctionButton 
                    onClick={() => {
                      setShowHistory(!showHistory);
                      setShowMemory(false);
                    }}
                    sx={{ 
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.info.dark 
                        : theme.palette.info.light 
                    }}
                  >
                    <HistoryIcon />
                  </FunctionButton>
                </motion.div>
              </Grid>
            </Grid>
          </CalculatorPaper>
        </Grid>
        
        {showHistory && (
          <Grid item xs={12} md={4}>
            <HistoryPaper elevation={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  History
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => setHistory([])}
                  disabled={history.length === 0}
                >
                  Clear
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {history.length === 0 ? (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ textAlign: 'center', py: 2 }}
                >
                  No calculations yet
                </Typography>
              ) : (
                <AnimatePresence initial={false}>
                  {history.map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2">{entry}</Typography>
                        {index < history.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </HistoryPaper>
          </Grid>
        )}
        
        {showMemory && (
          <Grid item xs={12} md={4}>
            <HistoryPaper elevation={2}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  <MemoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Memory
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={memoryClear}
                  disabled={memoryArray.length === 0}
                >
                  Clear All
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {memoryArray.length === 0 ? (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ textAlign: 'center', py: 2 }}
                >
                  No values stored in memory
                </Typography>
              ) : (
                <AnimatePresence initial={false}>
                  {memoryArray.map((value, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">M{index + 1}: {value}</Typography>
                        <Button 
                          size="small" 
                          variant="text" 
                          onClick={() => memoryRecall(index)}
                        >
                          Recall
                        </Button>
                        {index < memoryArray.length - 1 && <Divider sx={{ my: 1 }} />}
                      </Box>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </HistoryPaper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EngineeringCalculator;