import React, { useState } from 'react';
import { 
  Box, Container, Typography, Paper, Grid, TextField, 
  Button, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Divider, List, ListItem, ListItemText
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MemoryIcon from '@mui/icons-material/Memory';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import { Link } from 'react-router-dom';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

interface PLCModel {
  id: string;
  name: string;
  manufacturer: string;
  description: string;
}

interface PLCFunction {
  id: string;
  name: string;
  description: string;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  description: string;
}

const PLCDesign: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  
  // Sample data
  const plcModels: PLCModel[] = [
    { id: 'siemens-s7-1200', name: 'Siemens S7-1200', manufacturer: 'Siemens', description: 'Compact PLC for small to medium applications' },
    { id: 'siemens-s7-1500', name: 'Siemens S7-1500', manufacturer: 'Siemens', description: 'High-performance PLC for complex applications' },
    { id: 'allen-bradley-controllogix', name: 'Allen-Bradley ControlLogix', manufacturer: 'Rockwell Automation', description: 'Modular PLC for large-scale automation' },
    { id: 'allen-bradley-compactlogix', name: 'Allen-Bradley CompactLogix', manufacturer: 'Rockwell Automation', description: 'Compact PLC for small to medium applications' },
    { id: 'mitsubishi-fx5u', name: 'Mitsubishi FX5U', manufacturer: 'Mitsubishi Electric', description: 'Compact PLC with high-speed processing' },
    { id: 'omron-cp1e', name: 'Omron CP1E', manufacturer: 'Omron', description: 'Entry-level PLC for basic automation tasks' },
  ];
  
  const plcFunctions: PLCFunction[] = [
    { id: 'temperature-control', name: 'Temperature Control', description: 'PID control for temperature regulation' },
    { id: 'motor-control', name: 'Motor Control', description: 'Start/stop and speed control for motors' },
    { id: 'sequence-control', name: 'Sequence Control', description: 'Sequential operation of multiple devices' },
    { id: 'alarm-management', name: 'Alarm Management', description: 'Monitoring and handling of system alarms' },
    { id: 'data-logging', name: 'Data Logging', description: 'Recording process data for analysis' },
    { id: 'hmi-interface', name: 'HMI Interface', description: 'Communication with human-machine interface' },
  ];
  
  const equipmentList: Equipment[] = [
    { id: 'temp-sensor', name: 'Temperature Sensor', type: 'Sensor', description: 'PT100 temperature sensor' },
    { id: 'pressure-sensor', name: 'Pressure Sensor', type: 'Sensor', description: '4-20mA pressure transducer' },
    { id: 'flow-sensor', name: 'Flow Sensor', type: 'Sensor', description: 'Electromagnetic flow meter' },
    { id: 'ac-motor', name: 'AC Motor', type: 'Actuator', description: '3-phase induction motor' },
    { id: 'servo-motor', name: 'Servo Motor', type: 'Actuator', description: 'Precision servo motor with encoder' },
    { id: 'solenoid-valve', name: 'Solenoid Valve', type: 'Actuator', description: '24V DC solenoid valve' },
    { id: 'vfd', name: 'Variable Frequency Drive', type: 'Controller', description: 'VFD for motor speed control' },
    { id: 'hmi-panel', name: 'HMI Panel', type: 'Interface', description: 'Touch screen operator interface' },
  ];
  const handleModelChange = (event: SelectChangeEvent<string>) => {
    setSelectedModel(event.target.value);
  };
  
  const handleFunctionChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedFunctions(event.target.value as string[]);
  };
  
  const handleEquipmentChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedEquipment(event.target.value as string[]);
  };
  
  const generateCode = () => {
    // Simple code generation based on selections
    const model = plcModels.find(m => m.id === selectedModel);
    const functions = selectedFunctions.map(id => plcFunctions.find(f => f.id === id));
    const equipment = selectedEquipment.map(id => equipmentList.find(e => e.id === id));
    
    let code = `// PLC Program for ${projectName}\n`;
    code += `// Description: ${description}\n`;
    code += `// Generated by Cool-Assist\n\n`;
    
    if (model) {
      code += `// Target PLC: ${model.name} (${model.manufacturer})\n\n`;
      
      // Add variable declarations based on equipment
      code += `// Variable Declarations\n`;
      equipment.forEach(item => {
        if (item) {
          if (item.type === 'Sensor') {
            code += `VAR\n  ${item.id.toUpperCase()}: REAL; // ${item.name}\nEND_VAR\n`;
          } else if (item.type === 'Actuator') {
            code += `VAR\n  ${item.id.toUpperCase()}: BOOL; // ${item.name}\nEND_VAR\n`;
          } else if (item.type === 'Controller') {
            code += `VAR\n  ${item.id.toUpperCase()}_SETPOINT: REAL; // ${item.name} setpoint\n  ${item.id.toUpperCase()}_FEEDBACK: REAL; // ${item.name} feedback\nEND_VAR\n`;
          }
        }
      });
      
      // Add function blocks based on selected functions
      code += `\n// Function Blocks\n`;
      functions.forEach(func => {
        if (func) {
          if (func.id === 'temperature-control') {
            code += `FUNCTION_BLOCK FB_TEMP_CONTROL\n  VAR_INPUT\n    Setpoint: REAL;\n    ProcessValue: REAL;\n  END_VAR\n  VAR_OUTPUT\n    ControlOutput: REAL;\n  END_VAR\n  // PID control logic for temperature\nEND_FUNCTION_BLOCK\n\n`;
          } else if (func.id === 'motor-control') {
            code += `FUNCTION_BLOCK FB_MOTOR_CONTROL\n  VAR_INPUT\n    Start: BOOL;\n    Stop: BOOL;\n    Speed: REAL;\n  END_VAR\n  VAR_OUTPUT\n    Running: BOOL;\n    ActualSpeed: REAL;\n  END_VAR\n  // Motor control logic\nEND_FUNCTION_BLOCK\n\n`;
          } else if (func.id === 'alarm-management') {
            code += `FUNCTION_BLOCK FB_ALARM_MANAGER\n  VAR_INPUT\n    AlarmCondition: BOOL;\n    Acknowledge: BOOL;\n  END_VAR\n  VAR_OUTPUT\n    AlarmActive: BOOL;\n    AlarmAcknowledged: BOOL;\n  END_VAR\n  // Alarm management logic\nEND_FUNCTION_BLOCK\n\n`;
          }
        }
      });
      
      // Add main program
      code += `// Main Program\nPROGRAM Main\n  VAR\n    // Instance declarations\n`;
      functions.forEach(func => {
        if (func) {
          code += `    ${func.id.replace(/-/g, '_')}_inst: FB_${func.id.replace(/-/g, '_').toUpperCase()};\n`;
        }
      });
      code += `  END_VAR\n\n  // Program logic\n`;
      
      // Add some sample logic
      if (selectedFunctions.includes('temperature-control') && selectedEquipment.includes('temp-sensor')) {
        code += `  // Temperature control\n  ${functions.find(f => f?.id === 'temperature-control')?.id.replace(/-/g, '_')}_inst(Setpoint := 25.0, ProcessValue := TEMP_SENSOR);\n`;
      }
      
      if (selectedFunctions.includes('motor-control') && selectedEquipment.includes('ac-motor')) {
        code += `  // Motor control\n  ${functions.find(f => f?.id === 'motor-control')?.id.replace(/-/g, '_')}_inst(Start := TRUE, Stop := FALSE, Speed := 50.0);\n  AC_MOTOR := ${functions.find(f => f?.id === 'motor-control')?.id.replace(/-/g, '_')}_inst.Running;\n`;
      }
      
      code += `END_PROGRAM\n`;
    }
    
    setGeneratedCode(code);
  };
  
  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedCode], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${projectName.replace(/\s+/g, '_')}_plc_program.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          component={Link} 
          to="/" 
          startIcon={<ArrowBackIcon />} 
          variant="outlined" 
          sx={{ mr: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <MemoryIcon sx={{ mr: 1 }} /> PLC Design
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Project Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth margin="normal">
              <InputLabel id="plc-model-label">PLC Model</InputLabel>
              <Select
                labelId="plc-model-label"
                value={selectedModel}
                label="PLC Model"
                onChange={handleModelChange}
              >
                {plcModels.map((model) => (
                  <MenuItem key={model.id} value={model.id}>
                    {model.name} - {model.manufacturer}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Project Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Paper>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                PLC Functions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControl fullWidth>
                <InputLabel id="functions-label">Select Functions</InputLabel>
                <Select
                  labelId="functions-label"
                  multiple
                  value={selectedFunctions}
                  onChange={handleFunctionChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const func = plcFunctions.find(f => f.id === value);
                        return func ? func.name : '';
                      }).join(', ')}
                    </Box>
                  )}
                >
                  {plcFunctions.map((func) => (
                    <MenuItem key={func.id} value={func.id}>
                      <Typography variant="body1">{func.name}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {func.description}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </StyledCard>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <StyledCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Equipment
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <FormControl fullWidth>
                <InputLabel id="equipment-label">Select Equipment</InputLabel>
                <Select
                  labelId="equipment-label"
                  multiple
                  value={selectedEquipment}
                  onChange={handleEquipmentChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map((value) => {
                        const equip = equipmentList.find(e => e.id === value);
                        return equip ? equip.name : '';
                      }).join(', ')}
                    </Box>
                  )}
                >
                  {equipmentList.map((equip) => (
                    <MenuItem key={equip.id} value={equip.id}>
                      <Typography variant="body1">{equip.name}</Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {equip.type}: {equip.description}
                      </Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          startIcon={<CodeIcon />}
          onClick={generateCode}
          disabled={!selectedModel || selectedFunctions.length === 0 || !projectName}
          sx={{ mr: 2 }}
        >
          Generate PLC Code
        </Button>
        
        <Button 
          variant="outlined" 
          color="primary" 
          size="large" 
          startIcon={<DownloadIcon />}
          onClick={downloadCode}
          disabled={!generatedCode}
        >
          Download Code
        </Button>
      </Box>
      
      {generatedCode && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Generated PLC Code
          </Typography>
          <Box 
            component="pre" 
            sx={{ 
              p: 2, 
              backgroundColor: '#f5f5f5', 
              borderRadius: 1, 
              overflow: 'auto',
              fontSize: '0.875rem',
              fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
              maxHeight: '400px'
            }}
          >
            {generatedCode}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default PLCDesign;
