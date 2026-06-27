import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Paper, List, ListItem,
  ListItemText, CircularProgress, Divider, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Search as SearchIcon, FileCopy, PictureAsPdf, Image, 
  TableChart, Architecture, Close } from '@mui/icons-material';

// آدرس API
const API_URL = 'http://localhost:5000/api';

interface SearchResult {
  name: string;
  path: string;
  extension: string;
  preview: string;
  relevance: number;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
}

interface FileDetails {
  name: string;
  path: string;
  text: string;
  extension: string;
  lastIndexed: string;
}

const FileSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Search encountered an error: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error has occurred');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (extension: string) => {
    switch (extension) {
      case '.pdf':
        return <PictureAsPdf color="error" />;
      case '.docx':
      case '.doc':
        return <FileCopy color="primary" />;
      case '.xlsx':
      case '.xls':
        return <TableChart style={{ color: 'green' }} />;
      case '.jpg':
      case '.jpeg':
      case '.png':
        return <Image color="secondary" />;
      case '.dwg':
        return <Architecture style={{ color: 'purple' }} />;
      default:
        return <FileCopy />;
    }
  };

  const handleFileClick = async (filename: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/file/${encodeURIComponent(filename)}`);
      
      if (!response.ok) {
        throw new Error(`دریافت جزئیات فایل با خطا مواجه شد: ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedFile(data.file);
      setDialogOpen(true);
    } catch (err: any) {
      console.error('خطای دریافت جزئیات فایل:', err);
      setError(err instanceof Error ? err.message : 'دریافت جزئیات فایل با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" component="h2" gutterBottom>
      Search for HVAC files
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          label="Searching for engineering documents"
          placeholder="Enter a search term to search PDF, Word, Excel, and maps..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          variant="outlined"
          dir="rtl"
        />
        <Button 
          variant="contained" 
          onClick={handleSearch} 
          disabled={loading || !query.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          sx={{ ml: 2, height: 56 }}
        >
          search
        </Button>
      </Paper>
      
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#fdeded' }}>
          <Typography color="error">خطا: {error}</Typography>
        </Paper>
      )}
      
      {results.length > 0 && (
        <Paper sx={{ mt: 2, p: 0 }}>
          <Typography variant="h6" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          Search results ({results.length})
          </Typography>
          <Divider />
          <List>
            {results.map((item, index) => (
              <React.Fragment key={index}>
                <ListItem 
                  button 
                  onClick={() => handleFileClick(item.name)}
                  sx={{ 
                    '&:hover': { bgcolor: '#f8f8f8' },
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', mb: 1 }}>
                    {getFileIcon(item.extension)}
                    <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                      {item.name}
                    </Typography>
                    <Chip 
                      label={item.extension.substring(1).toUpperCase()} 
                      size="small" 
                      sx={{ ml: 'auto' }} 
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                    {item.preview}
                  </Typography>
                </ListItem>
                {index < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
      
      {!loading && query && results.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1">
            هیچ نتیجه‌ای برای "{query}" یافت نشد.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Use different keywords or check if the files are indexed.
          </Typography>
        </Paper>
      )}

      {/* دیالوگ جزئیات فایل */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedFile && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getFileIcon(selectedFile.extension)}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {selectedFile.name}
                  </Typography>
                </Box>
                <IconButton onClick={() => setDialogOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                مسیر: {selectedFile.path}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                آخرین به‌روزرسانی: {new Date(selectedFile.lastIndexed).toLocaleString('fa-IR')}
              </Typography>
              <Paper variant="outlined" sx={{ mt: 2, p: 2, maxHeight: 400, overflow: 'auto' }}>
                <Typography variant="body2" component="pre" 
                  sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {selectedFile.text}
                </Typography>
              </Paper>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>بستن</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default FileSearch;