import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Button, Grid, TextField, 
  Tabs, Tab, FormControl, InputLabel, MenuItem, Select,
  Divider, Card, CardContent, List, ListItem, ListItemText,
  ListItemIcon, CircularProgress, Accordion, AccordionSummary,
  AccordionDetails, Slider, Tooltip, IconButton, Chip
} from '@mui/material';
import EngineeringIcon from '@mui/icons-material/Engineering';
import CalculateIcon from '@mui/icons-material/Calculate';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import AirIcon from '@mui/icons-material/Air';
import Layout from '../components/Layout/Layout';

// Import calculation modules
import { 
  calculateCoolingLoadFromFormData, 
  CoolingLoadResult,
  BuildingInfo,
  ClimateData,
  CLIMATE_DATA
} from '../utils/cooling_load_calculations';
import { 
  calculateHeatingLoadFromFormData, 
  HeatingLoadResult 
} from '../utils/heating_load_calculations';
import { 
  calculateVentilationRequirementsFromFormData, 
  VentilationRequirements 
} from '../utils/ventilation_calculations';
import { 
  provideAIAssistance, 
  generateNaturalLanguageExplanation,
  generateInputFormFields,
  AIAssistanceRequest,
  AIAssistanceResponse
} from '../utils/ai_integration';

// Define the main component
const LoadCalculation: React.FC = () => {
  // State variables
  const [tabValue, setTabValue] = useState(0);
  const [calculationType, setCalculationType] = useState('residential');
  const [buildingType, setBuildingType] = useState('apartment');
  const [climateZone, setClimateZone] = useState('moderate');
  const [location, setLocation] = useState('tehran');
  const [totalArea, setTotalArea] = useState('');
  const [floors, setFloors] = useState('');
  const [occupants, setOccupants] = useState('');
  const [indoorTempCooling, setIndoorTempCooling] = useState('24');
  const [indoorHumidityCooling, setIndoorHumidityCooling] = useState('50');
  const [indoorTempHeating, setIndoorTempHeating] = useState('21');
  const [includePickupLoad, setIncludePickupLoad] = useState(true);
  const [setbackTemp, setSetbackTemp] = useState('15');
  const [supplyAirDistribution, setSupplyAirDistribution] = useState('ceiling');
  const [wallConstructionType, setWallConstructionType] = useState('brick-with-insulation');
  const [windowType, setWindowType] = useState('double-glazed');
  const [roofType, setRoofType] = useState('flat-built-up');
  const [lightingDensity, setLightingDensity] = useState('10');
  const [equipmentDensity, setEquipmentDensity] = useState('15');
  const [infiltrationRate, setInfiltrationRate] = useState('0.5');
  const [energyEfficiency, setEnergyEfficiency] = useState('medium');
  const [budget, setBudget] = useState('medium');
  const [comfort, setComfort] = useState('medium');
  const [sustainability, setSustainability] = useState('medium');
  
  const [calculating, setCalculating] = useState(false);
  const [coolingResult, setCoolingResult] = useState<CoolingLoadResult | null>(null);
  const [heatingResult, setHeatingResult] = useState<HeatingLoadResult | null>(null);
  const [ventilationResult, setVentilationResult] = useState<VentilationRequirements | null>(null);
  const [aiAssistance, setAiAssistance] = useState<AIAssistanceResponse | null>(null);
  const [naturalLanguageExplanation, setNaturalLanguageExplanation] = useState<string>('');
  
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [activeCalculation, setActiveCalculation] = useState<'cooling' | 'heating' | 'ventilation' | 'all'>('all');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [suggestedValues, setSuggestedValues] = useState<Record<string, any>>({});

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Collect form data
  const collectFormData = () => {
    return {
      calculationType,
      buildingType,
      climateZone,
      location,
      totalArea,
      floors,
      occupants,
      indoorTempCooling,
      indoorHumidityCooling,
      indoorTempHeating,
      includePickupLoad: includePickupLoad.toString(),
      setbackTemp,
      supplyAirDistribution,
      wallConstructionType,
      windowType,
      roofType,
      lightingDensity,
      equipmentDensity,
      infiltrationRate,
      energyEfficiency,
      budget,
      comfort,
      sustainability
    };
  };

  // Request AI assistance
  const requestAIAssistance = (calculationType: 'cooling' | 'heating' | 'ventilation' | 'all') => {
    const formData = collectFormData();
    
    const aiRequest: AIAssistanceRequest = {
      userInput: formData,
      calculationType,
      buildingLocation: location,
      buildingType: calculationType,
      previousCalculations: {
        cooling: coolingResult || undefined,
        heating: heatingResult || undefined,
        ventilation: ventilationResult || undefined
      },
      userPreferences: {
        energyEfficiency: energyEfficiency as 'low' | 'medium' | 'high',
        budget: budget as 'low' | 'medium' | 'high',
        comfort: comfort as 'low' | 'medium' | 'high',
        sustainability: sustainability as 'low' | 'medium' | 'high'
      }
    };
    
    const assistance = provideAIAssistance(aiRequest);
    setAiAssistance(assistance);
    setMissingFields(assistance.missingFields);
    setSuggestedValues(assistance.suggestedValues);
    
    return assistance;
  };

  // Handle calculation
  const handleCalculate = () => {
    setCalculating(true);
    
    // Request AI assistance
    const assistance = requestAIAssistance('all');
    
    // Use enhanced input from AI assistance
    const enhancedFormData = assistance.enhancedInput;
    
    // Perform calculations
    setTimeout(() => {
      try {
        // Calculate cooling load
        const coolingResult = calculateCoolingLoadFromFormData(enhancedFormData);
        setCoolingResult(coolingResult);
        
        // Calculate heating load
        const heatingResult = calculateHeatingLoadFromFormData(enhancedFormData);
        setHeatingResult(heatingResult);
        
        // Calculate ventilation requirements
        const ventilationResult = calculateVentilationRequirementsFromFormData(enhancedFormData);
        setVentilationResult(ventilationResult);
        
        // Generate natural language explanation
        const explanation = generateNaturalLanguageExplanation(
          coolingResult,
          heatingResult,
          ventilationResult
        );
        setNaturalLanguageExplanation(explanation);
      } catch (error) {
        console.error('Calculation error:', error);
        // Handle error
      }
      
      setCalculating(false);
    }, 2000);
  };

  // Reset calculation
  const resetCalculation = () => {
    setCoolingResult(null);
    setHeatingResult(null);
    setVentilationResult(null);
    setAiAssistance(null);
    setNaturalLanguageExplanation('');
    setTotalArea('');
    setFloors('');
    setOccupants('');
    setMissingFields([]);
    setSuggestedValues({});
  };

  // Apply suggested values
  const applySuggestedValues = () => {
    if (suggestedValues.totalArea) setTotalArea(suggestedValues.totalArea.toString());
    if (suggestedValues.floors) setFloors(suggestedValues.floors.toString());
    if (suggestedValues.occupants) setOccupants(suggestedValues.occupants.toString());
    if (suggestedValues.lightingDensity) setLightingDensity(suggestedValues.lightingDensity.toString());
    if (suggestedValues.equipmentDensity) setEquipmentDensity(suggestedValues.equipmentDensity.toString());
    if (suggestedValues.infiltrationRate) setInfiltrationRate(suggestedValues.infiltrationRate.toString());
    if (suggestedValues.wallConstructionType) setWallConstructionType(suggestedValues.wallConstructionType);
    if (suggestedValues.windowType) setWindowType(suggestedValues.windowType);
    if (suggestedValues.roofType) setRoofType(suggestedValues.roofType);
  };

  // Format breakdown percentage
  const formatBreakdownPercentage = (value: number, total: number) => {
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Render the component
  return (
    <Layout>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <EngineeringIcon sx={{ mr: 2, fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            HVAC Load Calculator
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          Calculate cooling, heating, and ventilation loads for buildings using industry-standard methods such as ASHRAE Heat Balance Method and ASHRAE Standard 62.1.
        </Typography>
        
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Quick Estimation" />
            <Tab label="Detailed Calculation" />
            <Tab label="Results Analysis" disabled={!coolingResult} />
          </Tabs>
          
          <Box sx={{ p: 4 }}>
            {tabValue === 0 && (
              <>
                {!coolingResult ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Building Type</InputLabel>
                        <Select
                          value={calculationType}
                          label="Building Type"
                          onChange={(e) => setCalculationType(e.target.value)}
                        >
                          <MenuItem value="residential">Residential</MenuItem>
                          <MenuItem value="commercial">Commercial</MenuItem>
                          <MenuItem value="industrial">Industrial</MenuItem>
                        </Select>
                      </FormControl>
                      
                      {calculationType === 'residential' && (
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Residential Type</InputLabel>
                          <Select
                            value={buildingType}
                            label="Residential Type"
                            onChange={(e) => setBuildingType(e.target.value)}
                          >
                            <MenuItem value="apartment">Apartment</MenuItem>
                            <MenuItem value="house">Single-Family House</MenuItem>
                            <MenuItem value="townhouse">Townhouse</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                      
                      {calculationType === 'commercial' && (
                        <FormControl fullWidth margin="normal">
                          <InputLabel>Commercial Type</InputLabel>
                          <Select
                            value={buildingType}
                            label="Commercial Type"
                            onChange={(e) => setBuildingType(e.target.value)}
                          >
                            <MenuItem value="office">Office</MenuItem>
                            <MenuItem value="retail">Retail</MenuItem>
                            <MenuItem value="restaurant">Restaurant</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                      
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Location</InputLabel>
                        <Select
                          value={location}
                          label="Location"
                          onChange={(e) => setLocation(e.target.value)}
                        >
                          {Object.keys(CLIMATE_DATA).map((key) => (
                            <MenuItem key={key} value={key}>
                              {CLIMATE_DATA[key].location}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Total Area (m²)"
                        value={totalArea}
                        onChange={(e) => setTotalArea(e.target.value)}
                        type="number"
                        margin="normal"
                        error={missingFields.includes('totalArea')}
                        helperText={missingFields.includes('totalArea') ? 'Required field' : ''}
                      />
                      
                      <TextField
                        fullWidth
                        label="Number of Floors"
                        value={floors}
                        onChange={(e) => setFloors(e.target.value)}
                        type="number"
                        margin="normal"
                      />
                      
                      <TextField
                        fullWidth
                        label="Number of Occupants"
                        value={occupants}
                        onChange={(e) => setOccupants(e.target.value)}
                        type="number"
                        margin="normal"
                        error={missingFields.includes('occupants')}
                        helperText={missingFields.includes('occupants') ? 'Required field' : ''}
                      />
                    </Grid>
                    
                    {missingFields.length > 0 && suggestedValues && Object.keys(suggestedValues).length > 0 && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText', mb: 2 }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Some required fields are missing. Would you like to use our suggested values?
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                            {Object.entries(suggestedValues).map(([key, value]) => (
                              <Chip 
                                key={key} 
                                label={`${key}: ${value}`} 
                                variant="outlined" 
                                color="primary"
                              />
                            ))}
                          </Box>
                          <Button 
                            variant="contained" 
                            size="small" 
                            onClick={applySuggestedValues}
                          >
                            Apply Suggested Values
                          </Button>
                        </Paper>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Accordion 
                        expanded={showAdvancedOptions} 
                        onChange={() => setShowAdvancedOptions(!showAdvancedOptions)}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>Advanced Options</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth margin="normal">
                                <InputLabel>Wall Construction Type</InputLabel>
                                <Select
                                  value={wallConstructionType}
                                  label="Wall Construction Type"
                                  onChange={(e) => setWallConstructionType(e.target.value)}
                                >
                                  <MenuItem value="brick-with-insulation">Brick with Insulation</MenuItem>
                                  <MenuItem value="concrete-with-insulation">Concrete with Insulation</MenuItem>
                                  <MenuItem value="metal-panel-with-insulation">Metal Panel with Insulation</MenuItem>
                                  <MenuItem value="wood-frame-with-insulation">Wood Frame with Insulation</MenuItem>
                                  <MenuItem value="curtain-wall">Curtain Wall</MenuItem>
                                </Select>
                              </FormControl>
                              
                              <FormControl fullWidth margin="normal">
                                <InputLabel>Window Type</InputLabel>
                                <Select
                                  value={windowType}
                                  label="Window Type"
                                  onChange={(e) => setWindowType(e.target.value)}
                                >
                                  <MenuItem value="single-glazed">Single Glazed</MenuItem>
                                  <MenuItem value="double-glazed">Double Glazed</MenuItem>
                                  <MenuItem value="double-glazed-low-e">Double Glazed Low-E</MenuItem>
                                  <MenuItem value="triple-glazed">Triple Glazed</MenuItem>
                                  <MenuItem value="triple-glazed-low-e">Triple Glazed Low-E</MenuItem>
                                </Select>
                              </FormControl>
                              
                              <FormControl fullWidth margin="normal">
                                <InputLabel>Roof Type</InputLabel>
                                <Select
                                  value={roofType}
                                  label="Roof Type"
                                  onChange={(e) => setRoofType(e.target.value)}
                                >
                                  <MenuItem value="flat-built-up">Flat Built-Up</MenuItem>
                                  <MenuItem value="metal-with-insulation">Metal with Insulation</MenuItem>
                                  <MenuItem value="concrete-with-insulation">Concrete with Insulation</MenuItem>
                                  <MenuItem value="green-roof">Green Roof</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <TextField
                                fullWidth
                                label="Lighting Power Density (W/m²)"
                                value={lightingDensity}
                                onChange={(e) => setLightingDensity(e.target.value)}
                                type="number"
                                margin="normal"
                              />
                              
                              <TextField
                                fullWidth
                                label="Equipment Power Density (W/m²)"
                                value={equipmentDensity}
                                onChange={(e) => setEquipmentDensity(e.target.value)}
                                type="number"
                                margin="normal"
                              />
                              
                              <TextField
                                fullWidth
                                label="Infiltration Rate (ACH)"
                                value={infiltrationRate}
                                onChange={(e) => setInfiltrationRate(e.target.value)}
                                type="number"
                                margin="normal"
                              />
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                      
                      <Accordion 
                        expanded={showPreferences} 
                        onChange={() => setShowPreferences(!showPreferences)}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography>Preferences</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth margin="normal">
                                <InputLabel>Energy Efficiency Priority</InputLabel>
                                <Select
                                  value={energyEfficiency}
                                  label="Energy Efficiency Priority"
                                  onChange={(e) => setEnergyEfficiency(e.target.value)}
                                >
                                  <MenuItem value="low">Low Priority</MenuItem>
                                  <MenuItem value="medium">Medium Priority</MenuItem>
                                  <MenuItem value="high">High Priority</MenuItem>
                                </Select>
                              </FormControl>
                              
                              <FormControl fullWidth margin="normal">
                                <InputLabel>Budget Constraints</InputLabel>
                                <Select
                                  value={budget}
                                  label="Budget Constraints"
                                  onChange={(e) => setBudget(e.target.value)}
                                >
                                  <MenuItem value="low">Limited Budget</MenuItem>
                                  <MenuItem value="medium">Moderate Budget</MenuItem>
                                  <MenuItem value="high">Flexible Budget</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            
                            <Grid item xs={12} md={6}>
                              <FormControl fullWidth margin="normal">
                                <InputLabel>Comfort Priority</InputLabel>
                                <Select
                                  value={comfort}
                                  label="Comfort Priority"
                                  onChange={(e) => setComfort(e.target.value)}
                                >
                                  <MenuItem value="low">Low Priority</MenuItem>
                                  <MenuItem value="medium">Medium Priority</MenuItem>
                                  <MenuItem value="high">High Priority</MenuItem>
                                </Select>
                              </FormControl>
                              
                              <FormControl fullWidth margin="normal">
                                <InputLabel>Sustainability Priority</InputLabel>
                                <Select
                                  value={sustainability}
                                  label="Sustainability Priority"
                                  onChange={(e) => setSustainability(e.target.value)}
                                >
                                  <MenuItem value="low">Low Priority</MenuItem>
                                  <MenuItem value="medium">Medium Priority</MenuItem>
                                  <MenuItem value="high">High Priority</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                    
                    <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        startIcon={<CalculateIcon />}
                        size="large"
                        onClick={handleCalculate}
                        disabled={!totalArea || calculating}
                      >
                        {calculating ? <CircularProgress size={24} color="inherit" /> : 'Calculate Load'}
                      </Button>
                    </Grid>
                  </Grid>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography variant="h6">Calculation Results</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<ArrowBackIcon />}
                        onClick={resetCalculation}
                      >
                        New Calculation
                      </Button>
                    </Box>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AcUnitIcon sx={{ color: 'primary.main', mr: 1 }} />
                              <Typography variant="h6" gutterBottom>Cooling Load</Typography>
                            </Box>
                            <Typography variant="h4" color="primary" gutterBottom>
                              {(coolingResult.total / 1000).toFixed(2)} kW
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {(coolingResult.total * 3.412 / 1000).toFixed(2)} MBH | {(coolingResult.total / 3500).toFixed(2)} Tons
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" gutterBottom>Breakdown:</Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Walls:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {formatBreakdownPercentage(coolingResult.breakdown.walls, coolingResult.total)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Windows (Conduction):
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {formatBreakdownPercentage(coolingResult.breakdown.windows.conduction, coolingResult.total)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Windows (Solar):
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {formatBreakdownPercentage(coolingResult.breakdown.windows.solar, coolingResult.total)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Roof:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {formatBreakdownPercentage(coolingResult.breakdown.roof, coolingResult.total)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Occupants:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {formatBreakdownPercentage(
                                    coolingResult.breakdown.occupants.sensible + coolingResult.breakdown.occupants.latent, 
                                    coolingResult.total
                                  )}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Lighting:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {formatBreakdownPercentage(coolingResult.breakdown.lighting, coolingResult.total)}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Equipment:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {formatBreakdownPercentage(
                                    coolingResult.breakdown.equipment.sensible + coolingResult.breakdown.equipment.latent, 
                                    coolingResult.total
                                  )}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <LocalFireDepartmentIcon sx={{ color: 'secondary.main', mr: 1 }} />
                              <Typography variant="h6" gutterBottom>Heating Load</Typography>
                            </Box>
                            <Typography variant="h4" color="secondary" gutterBottom>
                              {(heatingResult?.total ? (heatingResult.total / 1000).toFixed(2) : 0)} kW
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {heatingResult?.total ? (heatingResult.total * 3.412 / 1000).toFixed(2) : 0} MBH
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" gutterBottom>Breakdown:</Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Walls:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {heatingResult ? formatBreakdownPercentage(heatingResult.breakdown.walls, heatingResult.total) : '0%'}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Windows:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {heatingResult ? formatBreakdownPercentage(heatingResult.breakdown.windows, heatingResult.total) : '0%'}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Roof:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {heatingResult ? formatBreakdownPercentage(heatingResult.breakdown.roof, heatingResult.total) : '0%'}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Floor:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {heatingResult ? formatBreakdownPercentage(heatingResult.breakdown.floor, heatingResult.total) : '0%'}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Infiltration:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {heatingResult ? formatBreakdownPercentage(heatingResult.breakdown.infiltration, heatingResult.total) : '0%'}
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Ventilation:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {heatingResult ? formatBreakdownPercentage(heatingResult.breakdown.ventilation, heatingResult.total) : '0%'}
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={4}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <AirIcon sx={{ color: 'info.main', mr: 1 }} />
                              <Typography variant="h6" gutterBottom>Ventilation</Typography>
                            </Box>
                            <Typography variant="h4" color="info.main" gutterBottom>
                              {ventilationResult ? (ventilationResult.totalOutdoorAirflow * 2118.88).toFixed(0) : 0} CFM
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {ventilationResult?.airChangesPerHour.toFixed(2) ?? '0.00'} Air Changes per Hour
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle2" gutterBottom>Indoor Air Quality:</Typography>
                            <Grid container spacing={1}>
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  CO₂ Concentration:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {ventilationResult?.iaqAnalysis?.co2Concentration?.toFixed(0) ?? '0'} ppm
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Relative Humidity:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {ventilationResult?.iaqAnalysis?.relativeHumidityRange?.min.toFixed(0) ?? '0'}-{ventilationResult?.iaqAnalysis?.relativeHumidityRange?.max.toFixed(0) ?? '0'}%
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Typography variant="subtitle2" sx={{ mt: 1 }} gutterBottom>
                                  Energy Impact:
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Annual Heating:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {ventilationResult?.energyImpact?.annualHeatingLoad?.toFixed(0) ?? '0'} kWh
                                </Typography>
                              </Grid>
                              
                              <Grid item xs={8}>
                                <Typography variant="body2">
                                  Annual Cooling:
                                </Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="body2" align="right">
                                  {ventilationResult?.energyImpact?.annualCoolingLoad?.toFixed(0) ?? '0'} kWh
                                </Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sx={{ mt: 2 }}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>Recommendations</Typography>
                            <List>
                              {aiAssistance && aiAssistance.enhancedRecommendations.map((rec: string, index: number) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    <CheckCircleOutlineIcon color="primary" />
                                  </ListItemIcon>
                                  <ListItemText primary={rec} />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={<PictureAsPdfIcon />}
                          onClick={() => setTabValue(2)} // Switch to Results Analysis tab
                        >
                          View Detailed Analysis
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </>
            )}
            
            {tabValue === 1 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Detailed Calculation
                </Typography>
                <Typography variant="body1" paragraph>
                  Advanced HVAC load calculations based on ASHRAE standards, including comprehensive building envelope analysis, 
                  internal loads, ventilation requirements, and more.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => setTabValue(0)}
                >
                  Go to Quick Estimation
                </Button>
              </Box>
            )}
            
            {tabValue === 2 && coolingResult && heatingResult && ventilationResult && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Detailed Analysis</Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<ArrowBackIcon />}
                    onClick={() => setTabValue(0)}
                  >
                    Back to Results
                  </Button>
                </Box>
                
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom>
                    HVAC Load Analysis Report
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    Building Type: {calculationType.charAt(0).toUpperCase() + calculationType.slice(1)} - {buildingType.charAt(0).toUpperCase() + buildingType.slice(1)}
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    Location: {CLIMATE_DATA[location].location}
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    Total Area: {totalArea} m² | Floors: {floors} | Occupants: {occupants}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Render the natural language explanation */}
                  <div dangerouslySetInnerHTML={{ __html: naturalLanguageExplanation.replace(/\n\n/g, '<br/><br/>').replace(/## (.*?)\n\n/g, '<h3>$1</h3>') }} />
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Optimization Suggestions
                  </Typography>
                  
                  <List>
                    {aiAssistance && aiAssistance.optimizationSuggestions.map((suggestion: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon color="info" />
                        </ListItemIcon>
                        <ListItemText primary={suggestion} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Psychrometric Analysis
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Cooling Design Conditions:
                        </Typography>
                        
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Outdoor Temperature:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {coolingResult.psychrometrics.outdoorTemp.toFixed(1)}°C
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Outdoor Humidity:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {coolingResult.psychrometrics.outdoorHumidity.toFixed(0)}%
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Indoor Temperature:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {coolingResult.psychrometrics.indoorTemp.toFixed(1)}°C
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Indoor Humidity:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {coolingResult.psychrometrics.indoorHumidity.toFixed(0)}%
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Supply Air Temperature:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {coolingResult.psychrometrics.supplyAirTemp.toFixed(1)}°C
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Supply Air Flow:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(coolingResult.psychrometrics.supplyAirFlow * 2118.88).toFixed(0)} CFM
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                          Heating Design Conditions:
                        </Typography>
                        
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Outdoor Temperature:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {heatingResult.designTemperature.outdoor.toFixed(1)}°C
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Indoor Temperature:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {heatingResult.designTemperature.indoor.toFixed(1)}°C
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Supply Air Temperature:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {heatingResult.systemSizing.supplyAirTemp.toFixed(1)}°C
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Supply Air Flow:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(heatingResult.systemSizing.airflow * 2118.88).toFixed(0)} CFM
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          System Sizing
                        </Typography>
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Cooling System:
                        </Typography>
                        
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Cooling Capacity:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(coolingResult.total / 1000).toFixed(2)} kW ({(coolingResult.total / 3500).toFixed(2)} Tons)
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Sensible Capacity:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(coolingResult.totalSensible / 1000).toFixed(2)} kW
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Latent Capacity:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(coolingResult.totalLatent / 1000).toFixed(2)} kW
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Sensible Heat Ratio:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(coolingResult.totalSensible / coolingResult.total).toFixed(2)}
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                          Heating System:
                        </Typography>
                        
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Heating Capacity:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(heatingResult.total / 1000).toFixed(2)} kW ({(heatingResult.total * 3.412 / 1000).toFixed(0)} MBH)
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              System Heat Output:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(heatingResult.systemSizing.heatOutput / 1000).toFixed(2)} kW
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                          Ventilation System:
                        </Typography>
                        
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              Outdoor Air Flow:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(ventilationResult.totalOutdoorAirflow * 2118.88).toFixed(0)} CFM
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              System Effectiveness:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {ventilationResult.systemEffectiveness.toFixed(2)}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={6}>
                            <Typography variant="body2">
                              System Outdoor Air Flow:
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" align="right">
                              {(ventilationResult.systemOutdoorAirflow * 2118.88).toFixed(0)} CFM
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sx={{ mt: 2, textAlign: 'center' }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      startIcon={<PictureAsPdfIcon />}
                      disabled
                    >
                      Generate PDF Report (Coming Soon)
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
};

export default LoadCalculation;
