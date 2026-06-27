/*
 * ExportManager.tsx
 * Advanced export functionality for diagrams with multiple format support
 * Date: 2025-12-10
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\components\diagram\ExportManager.tsx
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Slider,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  InputLabel
} from '@mui/material';
import {
  GetApp as ExportIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Code as SvgIcon,
  Description as DwgIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportSettings {
  format: 'pdf' | 'png' | 'jpg' | 'svg' | 'dwg';
  quality: number; // 1-100 for images
  paperSize: 'A4' | 'A3' | 'A2' | 'A1' | 'A0' | 'Letter' | 'Legal' | 'Custom';
  orientation: 'portrait' | 'landscape';
  scale: number; // 1-500 (percentage)
  dpi: number; // 72, 150, 300, 600
  includeTitle: boolean;
  includeDate: boolean;
  includeLayers: boolean;
  includeGrid: boolean;
  title: string;
  author: string;
  description: string;
  customWidth?: number;
  customHeight?: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  background: 'white' | 'transparent' | 'custom';
  backgroundColor?: string;
}

interface ExportManagerProps {
  canvasRef: React.RefObject<HTMLElement>;
  onExport?: (settings: ExportSettings) => void;
  defaultSettings?: Partial<ExportSettings>;
}

const paperSizes = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A2: { width: 420, height: 594 },
  A1: { width: 594, height: 841 },
  A0: { width: 841, height: 1189 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
  Custom: { width: 0, height: 0 }
};

const dpiOptions = [
  { value: 72, label: '72 DPI (Screen)' },
  { value: 150, label: '150 DPI (Draft)' },
  { value: 300, label: '300 DPI (High Quality)' },
  { value: 600, label: '600 DPI (Print Quality)' }
];

const ExportManager: React.FC<ExportManagerProps> = ({
  canvasRef,
  onExport,
  defaultSettings
}) => {
  const [exportDialog, setExportDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'pdf',
    quality: 90,
    paperSize: 'A4',
    orientation: 'landscape',
    scale: 100,
    dpi: 300,
    includeTitle: true,
    includeDate: true,
    includeLayers: false,
    includeGrid: false,
    title: 'HVAC System Diagram',
    author: 'Cool-Assist',
    description: '',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    background: 'white',
    backgroundColor: '#ffffff',
    ...defaultSettings
  });

  const steps = ['Format', 'Layout', 'Options', 'Export'];

  const handleSettingChange = <K extends keyof ExportSettings>(
    key: K, 
    value: ExportSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExportPDF = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      setExportProgress(20);
      
      const canvas = await html2canvas(canvasRef.current, {
        scale: settings.dpi / 96,
        backgroundColor: settings.background === 'transparent' ? null : settings.backgroundColor,
        useCORS: true,
        allowTaint: true
      });

      setExportProgress(60);

      const imgData = canvas.toDataURL('image/png');
      
      const paperSize = paperSizes[settings.paperSize];
      const pdf = new jsPDF({
        orientation: settings.orientation,
        unit: 'mm',
        format: settings.paperSize === 'Custom' && settings.customWidth && settings.customHeight
          ? [settings.customWidth, settings.customHeight]
          : [paperSize.width, paperSize.height]
      });

      // Add title page if enabled
      if (settings.includeTitle) {
        pdf.setFontSize(20);
        pdf.text(settings.title, 20, 30);
        
        if (settings.author) {
          pdf.setFontSize(12);
          pdf.text(`Author: ${settings.author}`, 20, 45);
        }
        
        if (settings.description) {
          pdf.setFontSize(10);
          const lines = pdf.splitTextToSize(settings.description, 170);
          pdf.text(lines, 20, 60);
        }
        
        if (settings.includeDate) {
          pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, pdf.internal.pageSize.height - 20);
        }
        
        pdf.addPage();
      }

      setExportProgress(80);

      // Calculate image dimensions
      const pageWidth = pdf.internal.pageSize.getWidth() - settings.margins.left - settings.margins.right;
      const pageHeight = pdf.internal.pageSize.getHeight() - settings.margins.top - settings.margins.bottom;
      
      const imgAspectRatio = canvas.width / canvas.height;
      const pageAspectRatio = pageWidth / pageHeight;
      
      let imgWidth, imgHeight;
      if (imgAspectRatio > pageAspectRatio) {
        imgWidth = pageWidth * (settings.scale / 100);
        imgHeight = imgWidth / imgAspectRatio;
      } else {
        imgHeight = pageHeight * (settings.scale / 100);
        imgWidth = imgHeight * imgAspectRatio;
      }

      // Center the image
      const x = settings.margins.left + (pageWidth - imgWidth) / 2;
      const y = settings.margins.top + (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      setExportProgress(100);

      // Download the PDF
      pdf.save(`${settings.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [canvasRef, settings]);

  const handleExportImage = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      setExportProgress(30);
      
      const canvas = await html2canvas(canvasRef.current, {
        scale: settings.dpi / 96,
        backgroundColor: settings.background === 'transparent' ? null : settings.backgroundColor,
        useCORS: true,
        allowTaint: true
      });

      setExportProgress(70);

      const link = document.createElement('a');
      link.download = `${settings.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${settings.format}`;
      
      if (settings.format === 'png') {
        link.href = canvas.toDataURL('image/png');
      } else if (settings.format === 'jpg') {
        link.href = canvas.toDataURL('image/jpeg', settings.quality / 100);
      }

      setExportProgress(100);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [canvasRef, settings]);

  const handleExportSVG = useCallback(async () => {
    // SVG export would require converting the canvas content to SVG format
    // This is a placeholder for SVG export functionality
    alert('SVG export is coming soon!');
  }, []);

  const handleExportDWG = useCallback(async () => {
    // DWG export would require a specialized library or server-side conversion
    alert('DWG export is coming soon! This feature requires additional licensing.');
  }, []);

  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportProgress(0);

    try {
      switch (settings.format) {
        case 'pdf':
          await handleExportPDF();
          break;
        case 'png':
        case 'jpg':
          await handleExportImage();
          break;
        case 'svg':
          await handleExportSVG();
          break;
        case 'dwg':
          await handleExportDWG();
          break;
      }
      
      onExport?.(settings);
      setExportDialog(false);
      
    } finally {
      setExporting(false);
      setExportProgress(0);
      setActiveStep(0);
    }
  }, [settings, handleExportPDF, handleExportImage, handleExportSVG, handleExportDWG, onExport]);

  const renderFormatStep = () => (
    <FormControl component="fieldset">
      <FormLabel component="legend">Export Format</FormLabel>
      <RadioGroup
        value={settings.format}
        onChange={(e) => handleSettingChange('format', e.target.value as any)}
      >
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <FormControlLabel
              value="pdf"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PdfIcon sx={{ mr: 1 }} />
                  PDF
                </Box>
              }
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              value="png"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ mr: 1 }} />
                  PNG
                </Box>
              }
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              value="jpg"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ImageIcon sx={{ mr: 1 }} />
                  JPEG
                </Box>
              }
            />
          </Grid>
          <Grid item xs={6}>
            <FormControlLabel
              value="svg"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SvgIcon sx={{ mr: 1 }} />
                  SVG
                </Box>
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              value="dwg"
              control={<Radio />}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DwgIcon sx={{ mr: 1 }} />
                  DWG (AutoCAD)
                </Box>
              }
            />
          </Grid>
        </Grid>
      </RadioGroup>
    </FormControl>
  );

  const renderLayoutStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Paper Size</InputLabel>
          <Select
            value={settings.paperSize}
            onChange={(e) => handleSettingChange('paperSize', e.target.value as any)}
          >
            {Object.keys(paperSizes).map(size => (
              <MenuItem key={size} value={size}>
                {size} {size !== 'Custom' && `(${paperSizes[size as keyof typeof paperSizes].width}×${paperSizes[size as keyof typeof paperSizes].height}mm)`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth>
          <InputLabel>Orientation</InputLabel>
          <Select
            value={settings.orientation}
            onChange={(e) => handleSettingChange('orientation', e.target.value as any)}
          >
            <MenuItem value="portrait">Portrait</MenuItem>
            <MenuItem value="landscape">Landscape</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {settings.paperSize === 'Custom' && (
        <>
          <Grid item xs={6}>
            <TextField
              label="Width (mm)"
              type="number"
              fullWidth
              value={settings.customWidth || ''}
              onChange={(e) => handleSettingChange('customWidth', Number(e.target.value))}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Height (mm)"
              type="number"
              fullWidth
              value={settings.customHeight || ''}
              onChange={(e) => handleSettingChange('customHeight', Number(e.target.value))}
            />
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <Typography gutterBottom>Scale: {settings.scale}%</Typography>
        <Slider
          value={settings.scale}
          onChange={(_, value) => handleSettingChange('scale', value as number)}
          min={10}
          max={500}
          step={10}
          marks={[
            { value: 25, label: '25%' },
            { value: 50, label: '50%' },
            { value: 100, label: '100%' },
            { value: 200, label: '200%' }
          ]}
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth>
          <InputLabel>DPI/Quality</InputLabel>
          <Select
            value={settings.dpi}
            onChange={(e) => handleSettingChange('dpi', e.target.value as number)}
          >
            {dpiOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );

  const renderOptionsStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <TextField
          label="Title"
          fullWidth
          value={settings.title}
          onChange={(e) => handleSettingChange('title', e.target.value)}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          label="Author"
          fullWidth
          value={settings.author}
          onChange={(e) => handleSettingChange('author', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          label="Description"
          fullWidth
          multiline
          rows={3}
          value={settings.description}
          onChange={(e) => handleSettingChange('description', e.target.value)}
        />
      </Grid>

      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>Include Options</Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={settings.includeTitle}
              onChange={(e) => handleSettingChange('includeTitle', e.target.checked)}
            />
          }
          label="Include title page"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={settings.includeDate}
              onChange={(e) => handleSettingChange('includeDate', e.target.checked)}
            />
          }
          label="Include date"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={settings.includeLayers}
              onChange={(e) => handleSettingChange('includeLayers', e.target.checked)}
            />
          }
          label="Include layer information"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={settings.includeGrid}
              onChange={(e) => handleSettingChange('includeGrid', e.target.checked)}
            />
          }
          label="Include grid"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Background</FormLabel>
          <RadioGroup
            value={settings.background}
            onChange={(e) => handleSettingChange('background', e.target.value as any)}
            row
          >
            <FormControlLabel value="white" control={<Radio />} label="White" />
            <FormControlLabel value="transparent" control={<Radio />} label="Transparent" />
            <FormControlLabel value="custom" control={<Radio />} label="Custom" />
          </RadioGroup>
        </FormControl>
        
        {settings.background === 'custom' && (
          <TextField
            label="Background Color"
            type="color"
            value={settings.backgroundColor}
            onChange={(e) => handleSettingChange('backgroundColor', e.target.value)}
            sx={{ ml: 2 }}
          />
        )}
      </Grid>
    </Grid>
  );

  return (
    <>
      <Button
        variant="contained"
        startIcon={<ExportIcon />}
        onClick={() => setExportDialog(true)}
      >
        Export
      </Button>

      <Dialog 
        open={exportDialog} 
        onClose={() => setExportDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Export Diagram
        </DialogTitle>
        
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && renderFormatStep()}
          {activeStep === 1 && renderLayoutStep()}
          {activeStep === 2 && renderOptionsStep()}
          {activeStep === 3 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              {exporting ? (
                <>
                  <CircularProgress variant="determinate" value={exportProgress} size={80} />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Exporting... {exportProgress}%
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Ready to Export
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Format: {settings.format.toUpperCase()} • 
                    Size: {settings.paperSize} • 
                    DPI: {settings.dpi}
                  </Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setExportDialog(false)} disabled={exporting}>
            Cancel
          </Button>
          
          {activeStep > 0 && activeStep < 3 && (
            <Button onClick={() => setActiveStep(prev => prev - 1)}>
              Back
            </Button>
          )}
          
          {activeStep < 2 && (
            <Button 
              variant="contained" 
              onClick={() => setActiveStep(prev => prev + 1)}
            >
              Next
            </Button>
          )}
          
          {activeStep === 2 && (
            <Button 
              variant="contained" 
              onClick={() => setActiveStep(3)}
            >
              Review
            </Button>
          )}
          
          {activeStep === 3 && (
            <Button 
              variant="contained" 
              onClick={handleExport}
              disabled={exporting}
            >
              Export
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ExportManager;