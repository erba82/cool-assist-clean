/*
 * DiagramViewerPage.tsx
 * Updated with fix for localStorage issue
 * Date: 2025-04-27 15:25:00
 * Path: C:\Users\Erfan\cool-assist-clean\frontend\src\pages\DiagramViewerPage.tsx
 */

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Button, Alert, AppBar, Toolbar, IconButton,
    Tooltip, Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FlowDiagramRenderer from '../components/FlowDiagramRenderer';
import { DiagramData } from '../context/AIContext';

const DiagramViewerPage: React.FC = () => {
    const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log(">>> DiagramViewerPage Mounted <<<");
        setIsLoading(true);
        setError(null);

        // اصلاح: افزودن تأخیر کوتاه برای اطمینان از تکمیل ذخیره‌سازی localStorage
        setTimeout(() => {
            try {
                const storedData = localStorage.getItem('diagramData');
                console.log(">>> Reading localStorage 'diagramData':", storedData ? 'Found' : 'Not Found');
                
                if (storedData) {
                    const parsedData: DiagramData = JSON.parse(storedData);
                    console.log(">>> Parsed Diagram Data:", parsedData);
                    
                    if (!parsedData || typeof parsedData.layout !== 'string' || !parsedData.layout.trim()) {
                        console.error(">>> Parsed data is invalid or layout is empty.");
                        throw new Error("اطلاعات دیاگرام دریافتی معتبر نیست یا طرح‌بندی خالی است.");
                    }
                    
                    setDiagramData(parsedData);
                    // اصلاح: داده را در localStorage حفظ می‌کنیم تا در صورت رفرش صفحه از بین نرود
                    console.log(">>> Diagram data set to state.");
                } else {
                    console.error(">>> No diagram data found in localStorage.");
                    setError("اطلاعات دیاگرام یافت نشد. لطفاً تب را بسته و از صفحه چت دوباره تولید کنید.");
                }
            } catch (e: any) {
                console.error(">>> Error reading/parsing/setting diagram data:", e);
                setError(`خطا در بارگذاری اطلاعات دیاگرام: ${e.message}. داده‌های ذخیره شده ممکن است نامعتبر باشند.`);
            } finally {
                setIsLoading(false);
                console.log(">>> Loading finished.");
            }
        }, 200);
    }, []);

    const handleClose = () => { window.close(); };
    
    const handleSavePdf = async () => { alert("قابلیت ذخیره PDF در حال توسعه است."); };

    console.log(">>> Rendering DiagramViewerPage:", { isLoading, error, hasDiagramData: !!diagramData });

    if (!isLoading && !error && diagramData) {
       console.log(">>> Preparing to render FlowDiagramRenderer with layout data length:", diagramData.layout?.length);
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: 'grey.100' }}>
            {/* AppBar */}
            <AppBar position="static" elevation={1} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
                <Toolbar variant="dense">
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: '1.1rem' }}>
                        Diagram Viewer
                    </Typography>
                    <Tooltip title="Save as PDF (Beta)">
                         <span>
                         <IconButton color="primary" onClick={handleSavePdf}><PictureAsPdfIcon /></IconButton>
                         </span>
                    </Tooltip>
                    <Tooltip title="Close Viewer">
                        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close"><CloseIcon /></IconButton>
                    </Tooltip>
                </Toolbar>
            </AppBar>

            {/* محتوای اصلی */}
            <Box sx={{ flexGrow: 1, p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress /><Typography sx={{ ml: 2 }}>Loading Diagram...</Typography>
                    </Box>
                )}
                {error && (
                     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
                         <Alert severity="error" sx={{ width: '100%', maxWidth: '600px' }}>
                             {error}
                             <Button onClick={handleClose} size="small" sx={{ ml: 2 }}>Close</Button>
                             {/* اصلاح: افزودن دکمه برای تلاش مجدد */}
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
                {!isLoading && !error && diagramData && (
                     <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                         <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>Diagram generated based on your request.</Typography>
                         <Box id="diagram-container" sx={{ flexGrow: 1, minHeight: '400px', border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
                             <FlowDiagramRenderer layoutData={diagramData.layout} />
                         </Box>
                         <Box sx={{ display: 'flex', gap: 2, maxHeight: '25vh', overflow: 'hidden' }}>
                             <Paper variant="outlined" sx={{ flex: 1, p: 1.5, overflowY: 'auto', '& pre': { m: 0, fontSize: '0.75rem' } }}>
                                 <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Equipment:</Typography>
                                 <Typography component="pre" variant="caption">{diagramData.equipment || "N/A"}</Typography>
                             </Paper>
                             <Paper variant="outlined" sx={{ flex: 1, p: 1.5, overflowY: 'auto', '& pre': { m: 0, fontSize: '0.75rem' } }}>
                                 <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Consumables:</Typography>
                                  <Typography component="pre" variant="caption">{diagramData.consumables || "N/A"}</Typography>
                             </Paper>
                         </Box>
                     </Box>
                 )}
                 {!isLoading && !error && !diagramData && (
                       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
                           <Alert severity="warning" sx={{ width: '100%', maxWidth: '600px' }}>
                               No diagram data loaded.
                               <Button onClick={handleClose} size="small" sx={{ ml: 2 }}>Close</Button>
                           </Alert>
                      </Box>
                  )}
            </Box>
        </Box>
    );
};

export default DiagramViewerPage;