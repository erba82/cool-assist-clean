/**
 * AutomaticDiagramGenerator.tsx
 * AI-powered automatic diagram generation component
 * Date: 2025-12-10
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\pages\AutomaticDiagramGenerator.tsx
 */

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import {
  AutoFixHigh as AIIcon,
  AccountTree as DiagramIcon,
  Memory as SystemIcon
} from '@mui/icons-material';
import axios from 'axios';

interface SystemAnalysis {
  systemType: string;
  capacity: string;
  application: string;
  rooms?: {
    count: number;
    details: string;
  };
  requirements: string[];
}

interface DiagramResults {
  mainDiagram: string;
  equipmentList: string;
  specifications: string;
}

interface GenerationResults {
  systemAnalysis: SystemAnalysis;
  diagrams: DiagramResults;
  metadata: {
    generatedAt: string;
    aiGenerated: boolean;
  };
}

const AutomaticDiagramGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerationResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateAutomaticDiagram = async () => {
    if (!prompt.trim()) {
      setError('Please enter a system description');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Sending automatic diagram generation request...', prompt);
      
      const response = await axios.post('/api/diagram/auto-generate', {
        prompt: prompt.trim(),
        options: {
          includeCalculations: true,
          includeEquipmentSpecs: true,
          generatePID: true,
          professionalFormat: true
        }
      });

      console.log('Automatic diagram generation response:', response.data);
      setResults(response.data);
    } catch (err: any) {
      console.error('Automatic diagram generation error:', err);
      setError(
        err.response?.data?.details || 
        err.response?.data?.error || 
        'Error generating automatic diagram. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      generateAutomaticDiagram();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        <AIIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        AI-Powered Automatic Diagram Generator
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Enter your system requirements and let AI generate complete professional flow diagrams automatically
      </Typography>

      {/* Input Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Description
          </Typography>
          
          <TextField
            fullWidth
            multiline
            rows={6}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your HVACR system requirements... 
For example: 
- 5000-ton ammonia cold storage with 12 rooms (18x15x9m each)
- Industrial refrigeration system for food processing
- Multi-zone HVAC system for commercial building
- Chiller plant with cooling towers and pumps"
            variant="outlined"
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Chip label="Ammonia Systems" color="primary" variant="outlined" />
            <Chip label="Cold Storage" color="secondary" variant="outlined" />
            <Chip label="Industrial Refrigeration" color="info" variant="outlined" />
            <Chip label="Multi-Room Systems" color="success" variant="outlined" />
            <Chip label="Automatic Controls" color="warning" variant="outlined" />
          </Box>

          <Button
            variant="contained"
            size="large"
            onClick={generateAutomaticDiagram}
            disabled={loading || !prompt.trim()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AIIcon />}
            sx={{ minWidth: 300, py: 1.5 }}
          >
            {loading ? 'AI is Generating...' : 'Generate Complete Diagram Automatically'}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {/* Results Display */}
      {results && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
            <DiagramIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            AI-Generated Professional Flow Diagrams
          </Typography>

          {/* System Analysis Summary */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <SystemIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI System Analysis
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">System Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {results.systemAnalysis?.systemType?.toUpperCase() || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Capacity</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {results.systemAnalysis?.capacity || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Application</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {results.systemAnalysis?.application || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="body2" color="text.secondary">Rooms</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {results.systemAnalysis?.rooms?.count || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                AI-Detected Requirements
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {results.systemAnalysis?.requirements?.map((req: string, index: number) => (
                  <Chip key={index} label={req} variant="outlined" size="small" color="primary" />
                )) || []}
              </Box>
            </CardContent>
          </Card>

          {/* Main Diagram Display */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Professional P&ID Flow Diagram
              </Typography>
              <Paper sx={{ p: 3, backgroundColor: 'grey.50', minHeight: 400, maxHeight: 600, overflow: 'auto' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {results.diagrams?.mainDiagram || 'Generating main diagram...'}
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          {/* Equipment List */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Equipment List with Specifications
              </Typography>
              <Paper sx={{ p: 3, backgroundColor: 'grey.50', minHeight: 300, maxHeight: 500, overflow: 'auto' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {results.diagrams?.equipmentList || 'Generating equipment list...'}
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Technical Specifications & Notes
              </Typography>
              <Paper sx={{ p: 3, backgroundColor: 'grey.50', minHeight: 300, maxHeight: 500, overflow: 'auto' }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {results.diagrams?.specifications || 'Generating technical specifications...'}
                </Typography>
              </Paper>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generation Metadata
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Generated At</Typography>
                  <Typography variant="body1">
                    {new Date(results.metadata?.generatedAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">AI Generated</Typography>
                  <Chip 
                    label="Fully Automated" 
                    color="success" 
                    icon={<AIIcon />}
                    size="small" 
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AutomaticDiagramGenerator;