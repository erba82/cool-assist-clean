import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material';
import axios from 'axios';

interface FacilityData {
  type: string;
  totalCapacity: number;
  refrigerant: string;
  systemType: string;
  rooms: Room[];
}

interface Room {
  id: number;
  length: number;
  width: number;
  height: number;
  name: string;
}

const AmmoniaCalculationTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [facilityData, setFacilityData] = useState<FacilityData>({
    type: '5000-ton Cold Storage',
    totalCapacity: 5000,
    refrigerant: 'NH3',
    systemType: 'Direct Expansion with Pump Circulation',
    rooms: Array(12).fill(null).map((_, i) => ({
      id: i + 1,
      length: 18,
      width: 15,
      height: 9,
      name: `Cold Room ${i + 1}`
    }))
  });

  const calculateAmmoniaSystem = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      console.log('Sending ammonia calculation request...', facilityData);
      
      const response = await axios.post('/api/ammonia/calculate-5000-ton', {
        facilityData
      });

      console.log('Ammonia calculation response:', response.data);
      setResults(response.data);
    } catch (err: any) {
      console.error('Ammonia calculation error:', err);
      setError(
        err.response?.data?.details || 
        err.response?.data?.error || 
        'Error calculating ammonia system. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold' }}>
        <EngineeringIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
        Professional Ammonia Refrigeration System Calculator
      </Typography>
      
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Calculate comprehensive ammonia refrigeration system for 5000-ton cold storage facility
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Facility Configuration
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Facility Type"
                value={facilityData.type}
                onChange={(e) => setFacilityData(prev => ({ ...prev, type: e.target.value }))}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Total Capacity (tons)"
                type="number"
                value={facilityData.totalCapacity}
                onChange={(e) => setFacilityData(prev => ({ ...prev, totalCapacity: Number(e.target.value) }))}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Refrigerant Type"
                value={facilityData.refrigerant}
                onChange={(e) => setFacilityData(prev => ({ ...prev, refrigerant: e.target.value }))}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="System Type"
                value={facilityData.systemType}
                onChange={(e) => setFacilityData(prev => ({ ...prev, systemType: e.target.value }))}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          onClick={calculateAmmoniaSystem}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
          sx={{ minWidth: 250, py: 1.5 }}
        >
          {loading ? 'Calculating...' : 'Calculate Ammonia System'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}

      {results && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ color: 'success.main', fontWeight: 'bold' }}>
            Calculation Results
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Specifications
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Refrigerant</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {results.specifications?.refrigerant || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Total Capacity</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {results.specifications?.totalCapacity || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">System Type</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {results.specifications?.systemType || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Number of Rooms</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {results.specifications?.numberOfRooms || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Load Calculation Results
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, textAlign: 'center', backgroundColor: 'primary.light', color: 'white', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {results.calculationResults?.loadCalculation?.totalLoad?.toFixed(1) || '0'}
                    </Typography>
                    <Typography variant="body2">Total Load (kW)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, textAlign: 'center', backgroundColor: 'info.light', color: 'white', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {results.calculationResults?.loadCalculation?.coolingLoad?.toFixed(1) || '0'}
                    </Typography>
                    <Typography variant="body2">Cooling Load (kW)</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ p: 2, textAlign: 'center', backgroundColor: 'secondary.light', color: 'white', borderRadius: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {results.calculationResults?.loadCalculation?.freezingLoad?.toFixed(1) || '0'}
                    </Typography>
                    <Typography variant="body2">Freezing Load (kW)</Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected Equipment
              </Typography>
              <Typography variant="body2">
                Compressors: {results.equipment?.compressors?.length || 0} units
              </Typography>
              <Typography variant="body2">
                Condensers: {results.equipment?.condensers?.length || 0} units
              </Typography>
              <Typography variant="body2">
                Success: {results.success ? 'Yes' : 'No'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AmmoniaCalculationTest;