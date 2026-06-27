import React, { useState, useEffect } from 'react';
import {
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Divider, 
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  Snackbar,
  useTheme,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import DescriptionIcon from '@mui/icons-material/Description';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import WiringDiagramRenderer from '../components/WiringDiagramRenderer';

interface WiringData {
  layout: string;
  description?: string;
}

const WiringDiagramPage: React.FC = () => {
  const theme = useTheme();
  const [wiringData, setWiringData] = useState<WiringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

  // Load wiring diagram data from localStorage on mount
  useEffect(() => {
    console.log('>>> WiringDiagramPage Mounted <<<');
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        const storedData = localStorage.getItem('wiringDiagramData');
        console.log('>>> Reading localStorage wiringDiagramData:', storedData ? 'Found' : 'Not Found');
        
        if (storedData) {
          const parsedData: WiringData = JSON.parse(storedData);
          console.log('>>> Parsed Wiring Data:', parsedData);
          
          if (!parsedData || typeof parsedData.layout !== 'string' || !parsedData.layout.trim()) {
            console.error('>>> Parsed data is invalid or layout is empty.');
            throw new Error('Wiring diagram data is invalid or layout is empty.');
          }
          
          setWiringData(parsedData);
          console.log('>>> Wiring data set to state.');
        } else {
          console.error('>>> No wiring diagram data found in localStorage.');
          setError('No wiring diagram data found. Please generate from chat page.');
        }
      } catch (e: any) {
        console.error('>>> Error reading/parsing wiring diagram data:', e);
        setError(`Error loading wiring diagram: ${e.message}`);
      } finally {
        setIsLoading(false);
        console.log('>>> Loading finished.');
      }
    }, 200);
  }, []);

  const handleClose = () => { window.close(); };

  const handleCopyCode = () => {
    if (wiringData?.layout) {
      navigator.clipboard.writeText(wiringData.layout)
        .then(() => {
          setShowSnackbar(true);
        })
        .catch(err => {
          console.error('Failed to copy text:', err);
        });
    }
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  console.log('>>> Rendering WiringDiagramPage:', { isLoading, error, hasWiringData: !!wiringData });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'grey.100' }}>
      {/* AppBar */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
        <Toolbar variant="dense">
          <ElectricalServicesIcon sx={{ mr: 1.5 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
            Wiring Diagram Viewer
          </Typography>
          {wiringData && (
            <Tooltip title="Copy Diagram Code">
              <IconButton color="primary" onClick={handleCopyCode}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Close Viewer">
            <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading Wiring Diagram...</Typography>
          </Box>
        )}
        
        {error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
            <Alert severity="error" sx={{ width: '100%', maxWidth: '600px' }}>
              {error}
              <Button onClick={handleClose} size="small" sx={{ ml: 2 }}>Close</Button>
              <Button 
                onClick={() => window.location.reload()} 
                size="small" 
                color="primary" 
                sx={{ ml: 1 }}
              >
                Retry
              </Button>
            </Alert>
          </Box>
        )}
        
        {!isLoading && !error && wiringData && (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
              Wiring diagram generated based on your request.
            </Typography>
            <Box 
              id="wiring-diagram-container" 
              sx={{ 
                flexGrow: 1, 
                minHeight: '400px', 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1, 
                bgcolor: 'background.paper',
                overflow: 'hidden'
              }}
            >
              <WiringDiagramRenderer layoutData={wiringData.layout} />
            </Box>
            {wiringData.description && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Description:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {wiringData.description}
                </Typography>
              </Paper>
            )}
          </Box>
        )}
        
        {!isLoading && !error && !wiringData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
            <Alert severity="warning" sx={{ width: '100%', maxWidth: '600px' }}>
              No wiring diagram data loaded.
              <Button onClick={handleClose} size="small" sx={{ ml: 2 }}>Close</Button>
            </Alert>
          </Box>
        )}
      </Box>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message="Diagram code copied to clipboard"
        action={
          <Button color="secondary" size="small" onClick={handleCloseSnackbar}>
            Close
          </Button>
        }
      />
    </Box>
  );
};

export default WiringDiagramPage;