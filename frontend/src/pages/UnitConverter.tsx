/*
 * UnitConverter.tsx
 * Fixed version with proper SelectChangeEvent typing
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Card,
  CardContent,
  IconButton,
  SelectChangeEvent as MuiSelectChangeEvent,
  useTheme
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import HistoryIcon from '@mui/icons-material/History';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

// Fix the SelectChangeEvent type issue
type SelectChangeEvent<T = unknown> = MuiSelectChangeEvent<T>;

// Styled components with dark mode support
const ConverterPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
    : '0 8px 32px rgba(0, 0, 0, 0.1)',
  backgroundColor: theme.palette.mode === 'dark'
    ? theme.palette.grey[900]
    : theme.palette.background.paper,
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(145deg, #1e1e1e, #2d2d2d)'
    : 'linear-gradient(145deg, #f0f0f0, #ffffff)',
}));

const HistoryCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark'
    ? theme.palette.grey[800]
    : theme.palette.background.default,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 2px 8px rgba(255, 255, 255, 0.05)'
    : '0 2px 8px rgba(0, 0, 0, 0.1)',
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.3)'
      : 'rgba(0, 0, 0, 0.2)',
  },
  backgroundColor: theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.05)'
    : undefined,
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.05)'
      : theme.palette.background.paper,
  },
  '& .MuiInputBase-input': {
    color: theme.palette.mode === 'dark'
      ? theme.palette.text.primary
      : undefined,
  }
}));

// Unit conversion data
interface UnitCategory {
  name: string;
  units: {
    [key: string]: {
      name: string;
      toBase: (value: number) => number;
      fromBase: (value: number) => number;
    };
  };
}

const unitCategories: UnitCategory[] = [
  {
    name: 'Temperature',
    units: {
      celsius: {
        name: 'Celsius (°C)',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      fahrenheit: {
        name: 'Fahrenheit (°F)',
        toBase: (value) => (value - 32) * (5/9),
        fromBase: (value) => value * (9/5) + 32,
      },
      kelvin: {
        name: 'Kelvin (K)',
        toBase: (value) => value - 273.15,
        fromBase: (value) => value + 273.15,
      },
      rankine: {
        name: 'Rankine (°R)',
        toBase: (value) => (value - 491.67) * (5/9),
        fromBase: (value) => value * (9/5) + 491.67,
      },
    },
  },
  {
    name: 'Pressure',
    units: {
      pascal: {
        name: 'Pascal (Pa)',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      kilopascal: {
        name: 'Kilopascal (kPa)',
        toBase: (value) => value * 1000,
        fromBase: (value) => value / 1000,
      },
      bar: {
        name: 'Bar',
        toBase: (value) => value * 100000,
        fromBase: (value) => value / 100000,
      },
      psi: {
        name: 'PSI',
        toBase: (value) => value * 6894.76,
        fromBase: (value) => value / 6894.76,
      },
      mmHg: {
        name: 'mmHg',
        toBase: (value) => value * 133.322,
        fromBase: (value) => value / 133.322,
      },
      inHg: {
        name: 'inHg',
        toBase: (value) => value * 3386.39,
        fromBase: (value) => value / 3386.39,
      },
    },
  },
  {
    name: 'Length',
    units: {
      meter: {
        name: 'Meter (m)',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      centimeter: {
        name: 'Centimeter (cm)',
        toBase: (value) => value / 100,
        fromBase: (value) => value * 100,
      },
      millimeter: {
        name: 'Millimeter (mm)',
        toBase: (value) => value / 1000,
        fromBase: (value) => value * 1000,
      },
      inch: {
        name: 'Inch (in)',
        toBase: (value) => value * 0.0254,
        fromBase: (value) => value / 0.0254,
      },
      foot: {
        name: 'Foot (ft)',
        toBase: (value) => value * 0.3048,
        fromBase: (value) => value / 0.3048,
      },
    },
  },
  {
    name: 'Volume',
    units: {
      cubicMeter: {
        name: 'Cubic Meter (m³)',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      liter: {
        name: 'Liter (L)',
        toBase: (value) => value / 1000,
        fromBase: (value) => value * 1000,
      },
      gallon: {
        name: 'Gallon (US)',
        toBase: (value) => value * 0.00378541,
        fromBase: (value) => value / 0.00378541,
      },
      cubicFoot: {
        name: 'Cubic Foot (ft³)',
        toBase: (value) => value * 0.0283168,
        fromBase: (value) => value / 0.0283168,
      },
    },
  },
  {
    name: 'Flow Rate',
    units: {
      cubicMeterPerSecond: {
        name: 'Cubic Meter/Second (m³/s)',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      literPerSecond: {
        name: 'Liter/Second (L/s)',
        toBase: (value) => value / 1000,
        fromBase: (value) => value * 1000,
      },
      cubicFootPerMinute: {
        name: 'Cubic Foot/Minute (CFM)',
        toBase: (value) => value * 0.000471947,
        fromBase: (value) => value / 0.000471947,
      },
      gallonPerMinute: {
        name: 'Gallon/Minute (GPM)',
        toBase: (value) => value * 0.0000630902,
        fromBase: (value) => value / 0.0000630902,
      },
    },
  },
  {
    name: 'Power',
    units: {
      watt: {
        name: 'Watt (W)',
        toBase: (value) => value,
        fromBase: (value) => value,
      },
      kilowatt: {
        name: 'Kilowatt (kW)',
        toBase: (value) => value * 1000,
        fromBase: (value) => value / 1000,
      },
      btuPerHour: {
        name: 'BTU/hour',
        toBase: (value) => value * 0.29307107,
        fromBase: (value) => value / 0.29307107,
      },
      horsePower: {
        name: 'Horsepower (hp)',
        toBase: (value) => value * 745.7,
        fromBase: (value) => value / 745.7,
      },
      ton: {
        name: 'Refrigeration Ton',
        toBase: (value) => value * 3516.85,
        fromBase: (value) => value / 3516.85,
      },
    },
  },
];

interface ConversionHistory {
  fromValue: number;
  fromUnit: string;
  toUnit: string;
  toValue: number;
  category: string;
  timestamp: Date;
}

const UnitConverter: React.FC = () => {
  const theme = useTheme();
  const [category, setCategory] = useState<string>(unitCategories[0].name);
  const [fromUnit, setFromUnit] = useState<string>(Object.keys(unitCategories[0].units)[0]);
  const [toUnit, setToUnit] = useState<string>(Object.keys(unitCategories[0].units)[1]);
  const [fromValue, setFromValue] = useState<string>('1');
  const [toValue, setToValue] = useState<string>('');
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

    // Find the current category object
    const currentCategory = unitCategories.find(cat => cat.name === category) || unitCategories[0];

    // Convert value when inputs change
    useEffect(() => {
      if (fromValue === '') {
        setToValue('');
        return;
      }
  
      const numValue = parseFloat(fromValue);
      if (isNaN(numValue)) {
        setToValue('Invalid input');
        return;
      }
  
      const fromUnitObj = currentCategory.units[fromUnit];
      const toUnitObj = currentCategory.units[toUnit];
  
      if (!fromUnitObj || !toUnitObj) {
        setToValue('Unit not found');
        return;
      }
  
      // Convert to base unit then to target unit
      const baseValue = fromUnitObj.toBase(numValue);
      const result = toUnitObj.fromBase(baseValue);
  
      // Format the result based on the magnitude
      let formattedResult: string;
      if (Math.abs(result) < 0.000001 || Math.abs(result) >= 1000000) {
        formattedResult = result.toExponential(6);
      } else {
        formattedResult = result.toPrecision(6).replace(/\.?0+$/, '');
      }
  
      setToValue(formattedResult);
    }, [fromValue, fromUnit, toUnit, category]);
  
    // Handle category change
      const handleCategoryChange = (event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
        const newCategory = event.target.value as string;
        setCategory(newCategory);
        
        // Find the new category object
        const newCategoryObj = unitCategories.find(cat => cat.name === newCategory) || unitCategories[0];
      
      // Set default units for the new category
      const unitKeys = Object.keys(newCategoryObj.units);
      setFromUnit(unitKeys[0]);
      setToUnit(unitKeys.length > 1 ? unitKeys[1] : unitKeys[0]);
    };
  
    // Swap units with animation
    const handleSwapUnits = () => {
      setIsSwapping(true);
      setTimeout(() => {
        setFromUnit(toUnit);
        setToUnit(fromUnit);
        setFromValue(toValue);
        setIsSwapping(false);
      }, 300);
    };
  
    // Add to history
    const addToHistory = () => {
      if (fromValue === '' || toValue === '') return;
      
      const numFromValue = parseFloat(fromValue);
      const numToValue = parseFloat(toValue);
      
      if (isNaN(numFromValue) || isNaN(numToValue)) return;
      
      const newEntry: ConversionHistory = {
        fromValue: numFromValue,
        fromUnit,
        toUnit,
        toValue: numToValue,
        category,
        timestamp: new Date(),
      };
      
      setHistory([newEntry, ...history]);
    };
  
    // Clear history
    const clearHistory = () => {
      setHistory([]);
    };
  
    // Delete history item
    const deleteHistoryItem = (index: number) => {
      const newHistory = [...history];
      newHistory.splice(index, 1);
      setHistory(newHistory);
    };
  
    // Animation variants
    const containerVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.5 }
      }
    };
  
    const swapVariants = {
      rotate: { rotate: 360, transition: { duration: 0.5 } },
      rest: { rotate: 0 }
    };
  
    return (
      <Box sx={{ p: 2 }}>
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <SwapHorizIcon sx={{ mr: 1 }} /> Unit Converter
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={showHistory ? 8 : 12}>
              <ConverterPaper elevation={3}>
                <Grid container spacing={3}>
                  {/* Category Selection */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="category-select-label" 
                        sx={{ 
                          color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : undefined 
                        }}
                      >
                        Category
                      </InputLabel>
                      <StyledSelect
                        labelId="category-select-label"
                        id="category-select"
                        value={category}
                        label="Category"
                        onChange={handleCategoryChange}
                      >
                        {unitCategories.map((cat) => (
                          <MenuItem key={cat.name} value={cat.name}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </StyledSelect>
                    </FormControl>
                  </Grid>
                  
                  {/* From Unit */}
                  <Grid item xs={12} sm={5}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      <Typography variant="subtitle2" gutterBottom>From:</Typography>
                      <StyledTextField
                        fullWidth
                        variant="outlined"
                        type="text"
                        value={fromValue}
                        onChange={(e) => setFromValue(e.target.value)}
                        sx={{ mb: 2 }}
                        inputProps={{ inputMode: 'decimal' }}
                      />
                      <FormControl fullWidth>
                        <InputLabel id="from-unit-select-label"
                          sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : undefined 
                          }}
                        >
                          Unit
                        </InputLabel>
                        <StyledSelect
                          labelId="from-unit-select-label"
                          id="from-unit-select"
                          value={fromUnit}
                          label="Unit"
                          onChange={(e: SelectChangeEvent<unknown>, child: React.ReactNode) => setFromUnit(e.target.value as string)}
                        >
                          {Object.entries(currentCategory.units).map(([key, unit]) => (
                            <MenuItem key={key} value={key}>
                              {unit.name}
                            </MenuItem>
                          ))}
                        </StyledSelect>
                      </FormControl>
                    </motion.div>
                  </Grid>
                  
                  {/* Swap Button */}
                  <Grid item xs={12} sm={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div
                      animate={isSwapping ? 'rotate' : 'rest'}
                      variants={swapVariants}
                    >
                      <IconButton 
                        onClick={handleSwapUnits}
                        sx={{ 
                          backgroundColor: theme.palette.mode === 'dark' 
                            ? theme.palette.primary.dark 
                            : theme.palette.primary.light,
                          color: 'white',
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main,
                          },
                          width: { xs: '100%', sm: 'auto' },
                          height: { xs: 40, sm: 40 },
                          mt: { xs: 0, sm: 4 }
                        }}
                      >
                        <SwapHorizIcon />
                      </IconButton>
                    </motion.div>
                  </Grid>
                  
                  {/* To Unit */}
                  <Grid item xs={12} sm={5}>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      <Typography variant="subtitle2" gutterBottom>To:</Typography>
                      <StyledTextField
                        fullWidth
                        variant="outlined"
                        value={toValue}
                        InputProps={{
                          readOnly: true,
                        }}
                        sx={{ mb: 2 }}
                      />
                      <FormControl fullWidth>
                        <InputLabel id="to-unit-select-label"
                          sx={{ 
                            color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : undefined 
                          }}
                        >
                          Unit
                        </InputLabel>
                        <StyledSelect
                          labelId="to-unit-select-label"
                          id="to-unit-select"
                          value={toUnit}
                          label="Unit"
                          onChange={(e: SelectChangeEvent<unknown>, child: React.ReactNode) => setToUnit(e.target.value as string)}
                        >
                          {Object.entries(currentCategory.units).map(([key, unit]) => (
                            <MenuItem key={key} value={key}>
                              {unit.name}
                            </MenuItem>
                          ))}
                        </StyledSelect>
                      </FormControl>
                    </motion.div>
                  </Grid>
                  
                  {/* Action Buttons */}
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={addToHistory}
                        disabled={fromValue === '' || toValue === ''}
                      >
                        Save Conversion
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => setShowHistory(!showHistory)}
                      >
                        {showHistory ? 'Hide History' : 'Show History'}
                      </Button>
                    </motion.div>
                  </Grid>
                </Grid>
              </ConverterPaper>
            </Grid>
            
            {/* History Panel */}
            {showHistory && (
              <Grid item xs={12} md={4}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 2, 
                      height: '100%', 
                      maxHeight: 500, 
                      overflow: 'auto',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.grey[900] 
                        : theme.palette.background.paper,
                      '&::-webkit-scrollbar': { width: '6px' },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(0,0,0,0.2)',
                        borderRadius: '3px'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        Conversion History
                      </Typography>
                      <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={clearHistory}
                        disabled={history.length === 0}
                      >
                        Clear All
                      </Button>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    
                    {history.length === 0 ? (
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ textAlign: 'center', py: 2 }}
                      >
                        No conversions saved yet
                      </Typography>
                    ) : (
                      <AnimatePresence initial={false}>
                        {history.map((item, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <HistoryCard variant="outlined">
                              <CardContent 
                                sx={{ 
                                  py: 1, 
                                  position: 'relative',
                                  '&:last-child': { paddingBottom: 1 }
                                }}
                              >
                                <IconButton 
                                  size="small" 
                                  sx={{ 
                                    position: 'absolute', 
                                    top: 8, 
                                    right: 8,
                                    color: theme.palette.mode === 'dark'
                                      ? 'rgba(255,255,255,0.5)'
                                      : undefined
                                  }}
                                  onClick={() => deleteHistoryItem(index)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                                <Typography 
                                  variant="subtitle2" 
                                  color="primary"
                                  sx={{
                                    color: theme.palette.mode === 'dark'
                                      ? theme.palette.primary.light
                                      : theme.palette.primary.main
                                  }}
                                >
                                  {item.category}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', my: 1 }}>
                                  <Typography variant="body2" sx={{ flex: 1 }}>
                                    {item.fromValue} {currentCategory.units[item.fromUnit]?.name || item.fromUnit}
                                  </Typography>
                                  <SwapHorizIcon sx={{ mx: 1, color: 'text.secondary' }} />
                                  <Typography variant="body2" sx={{ flex: 1 }}>
                                    {item.toValue} {currentCategory.units[item.toUnit]?.name || item.toUnit}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  {item.timestamp.toLocaleString()}
                                </Typography>
                              </CardContent>
                            </HistoryCard>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
            )}
          </Grid>
        </motion.div>
      </Box>
    );
  };
  
  export default UnitConverter;