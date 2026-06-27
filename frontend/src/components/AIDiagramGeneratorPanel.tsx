/*
 * AIDiagramGeneratorPanel.tsx
 * Updated with fix for localStorage issue
 * Date: 2025-04-27 15:20:00
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\AIDiagramGeneratorPanel.tsx
 */

import React, { useState } from 'react';
import { 
  Box, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Button, Typography, IconButton, Divider, 
  Chip, CircularProgress, Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useDiagramStore } from '../store/diagramStore';

interface AIDiagramGeneratorPanelProps {
  open: boolean;
  onClose: () => void;
}

const AIDiagramGeneratorPanel: React.FC<AIDiagramGeneratorPanelProps> = ({ 
  open, 
  onClose 
}) => {
  const { isLoading, generateDiagramFromAI } = useDiagramStore();
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const examplePrompts = [
    "5000-ton cold storage with 12 rooms measuring 18 x 15 at a height of 9 meters with ammonia refrigerant and all rooms with two circuits both above zero and below zero, with screw compressors, direct system, sending via pump",
    "Create a 100-ton ammonia refrigeration system for a cold storage facility with 6 rooms, using BITZER screw compressors and GUNTNER evaporators with Danfoss valves",
    "Design a multi-room cold storage with NH3 refrigerant, evaporative condenser, thermosiphon separators, and individual temperature controls for each room",
    "Create a cooling system for a small commercial building with a chiller, cooling tower, and air handling units. Use R-410A refrigerant.",
    "Design a hot water recirculation system for a 3-story apartment building with a natural gas boiler and expansion tank.",
    "Create a compressed air distribution system for a manufacturing facility with a reciprocating compressor and air dryer."
  ];
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrompt(e.target.value);
    setError(null);
  };
  
  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter a description for your diagram.");
      return;
    }

    setError(null);
    
    try {
      const diagramData = await generateDiagramFromAI(prompt);
      
      if (diagramData) {
        // اصلاح: اطمینان از ذخیره صحیح داده دیاگرام با لاگ تأیید
        console.log("Saving diagram data to localStorage", diagramData);
        localStorage.setItem('diagramData', JSON.stringify(diagramData));
        
        // اصلاح: کمی تأخیر قبل از باز کردن صفحه جدید
        setTimeout(() => {
          // اصلاح: استفاده از آدرس کامل با پروتکل
          const diagramViewerUrl = `${window.location.origin}/diagram-viewer`;
          console.log("Opening diagram viewer at:", diagramViewerUrl);
          window.open(diagramViewerUrl, '_blank');
          onClose();
        }, 500);
      } else {
        setError("Failed to generate diagram. Please try again with more details.");
      }
    } catch (error: any) {
      console.error('Error generating diagram:', error);
      setError(error.message || "An error occurred while generating the diagram.");
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={!isLoading ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AutoFixHighIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">AI Diagram Generator</Typography>
        </Box>
        <IconButton onClick={!isLoading ? onClose : undefined} size="small" disabled={isLoading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ py: 1 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          Describe your piping system requirements, and our AI will generate an optimized flow diagram.
          Include details like components, pipe sizes, flow rates, and any specific requirements.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <TextField
            value={prompt}
            onChange={handlePromptChange}
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            placeholder="Describe your piping system in detail (e.g., 'Design a chilled water system with a 50-ton chiller, cooling tower, and 3 air handling units using 4-inch copper pipe with isolation valves at each unit.')"
            disabled={isLoading}
            margin="normal"
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Example Prompts:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {examplePrompts.map((example, index) => (
                <Chip 
                  key={index} 
                  label={example} 
                  onClick={() => handleExampleClick(example)} 
                  clickable
                  variant="outlined" 
                  sx={{ mb: 1 }}
                  disabled={isLoading}
                />
              ))}
            </Box>
          </Box>
        </form>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', alignItems: 'start', bgcolor: 'info.50', p: 1.5, borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Tip:</strong> For best results, include details such as component types, sizes, materials, flow rates, and any specific requirements or standards that should be followed.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          variant="contained"
          onClick={handleSubmit}
          disabled={isLoading || !prompt.trim()}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Generating...' : 'Generate Diagram'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AIDiagramGeneratorPanel;