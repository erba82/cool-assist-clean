/*
 * DiagramGenerator.tsx
 * Updated page for generating diagrams with AI
 * Date: 2025-04-27 15:10:00
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\pages\DiagramGenerator.tsx
 */

import React, { useState } from 'react';
import { Box, Typography, Paper, Button, Tabs, Tab, Grid, Card, CardContent, CardMedia, Alert, Chip } from '@mui/material';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import DrawIcon from '@mui/icons-material/Draw';
import Layout from '../components/Layout/Layout';
import AIDiagramGeneratorPanel from '../components/AIDiagramGeneratorPanel';

const DiagramGenerator: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [showAIDialog, setShowAIDialog] = useState(false);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleOpenAIGenerator = () => {
    setShowAIDialog(true);
  };

  const handleCloseAIGenerator = () => {
    setShowAIDialog(false);
  };

  return (
    <Layout>
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <ArchitectureIcon sx={{ mr: 2, fontSize: '2rem', color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Diagram Generator
          </Typography>
        </Box>
        
        <Typography variant="body1" paragraph>
          Design and generate professional diagrams for HVAC systems, including piping flow diagrams, wiring diagrams, and 3D visualizations.
        </Typography>
        
        {/* Enhanced CAD Tools Alert */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            🚀 New: Enhanced CAD Drawing Tools Available!
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Experience AutoCAD-like precision drawing with advanced tools including snap modes, layer management, 
            extensive symbol library, and professional export options.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<DrawIcon />}
            onClick={() => window.open('/enhanced-diagram-generator', '_blank')}
            sx={{ mr: 1 }}
          >
            Open Enhanced CAD Editor
          </Button>
          <Chip label="NEW" color="primary" size="small" />
        </Alert>
        
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="2D Piping Diagrams" />
            <Tab label="Wiring Diagrams" />
            <Tab label="3D Visualizations" />
          </Tabs>
          
          <Box sx={{ p: 4 }}>
            {tabValue === 0 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    2D Piping Flow Diagrams
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Generate detailed piping flow diagrams for HVAC systems with industry-standard symbols and annotations. Export as PDF for professional documentation.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexDirection: 'column' }}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleOpenAIGenerator}
                      startIcon={<AutoFixHighIcon />}
                      fullWidth
                    >
                      Generate with AI
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="secondary"
                      onClick={() => window.open('/enhanced-diagram-generator', '_blank')}
                      startIcon={<DrawIcon />}
                      fullWidth
                    >
                      Manual Drawing (Enhanced CAD)
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image="https://via.placeholder.com/600x400?text=Piping+Flow+Diagram+Example"
                      alt="Piping Flow Diagram Example"
                    />
                    <CardContent>
                      <Typography variant="caption">
                        Example of a 2D piping flow diagram
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            {tabValue === 1 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Wiring Diagrams
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Create electrical wiring diagrams for control systems, showing connections between components, power sources, and controllers.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    disabled
                    sx={{ mt: 2 }}
                  >
                    Start Design (Coming Soon)
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image="https://via.placeholder.com/600x400?text=Wiring+Diagram+Example"
                      alt="Wiring Diagram Example"
                    />
                    <CardContent>
                      <Typography variant="caption">
                        Example of a wiring diagram
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
            
            {tabValue === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    3D Visualizations
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Visualize HVAC systems in 3D to better understand spatial relationships and installation requirements. Identify potential conflicts before installation.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    disabled
                    sx={{ mt: 2 }}
                  >
                    Start Design (Coming Soon)
                  </Button>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="200"
                      image="https://via.placeholder.com/600x400?text=3D+Visualization+Example"
                      alt="3D Visualization Example"
                    />
                    <CardContent>
                      <Typography variant="caption">
                        Example of a 3D system visualization
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>
        
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button 
            variant="outlined" 
            color="primary"
            onClick={() => window.history.back()}
          >
            Return to dashboard
          </Button>
        </Box>
      </Box>
      
      <AIDiagramGeneratorPanel
        open={showAIDialog}
        onClose={handleCloseAIGenerator}
      />
    </Layout>
  );
};

export default DiagramGenerator;