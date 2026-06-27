import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import Layout from '../components/Layout/Layout';

const Troubleshooting: React.FC = () => {
  return (
    <Layout>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Troubleshooting
        </Typography>
        <Typography variant="body1" paragraph>
          Diagnosing and fixing problems with air conditioning systems
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            This feature is under development.
          </Typography>
          <Typography variant="body1" paragraph>
            Troubleshooting will be available soon.
            This section will help you diagnose and fix problems with air conditioning systems.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => window.history.back()}
          >
            Return to dashboard
          </Button>
        </Paper>
      </Box>
    </Layout>
  );
};

export default Troubleshooting;
