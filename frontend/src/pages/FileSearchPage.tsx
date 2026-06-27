import React from 'react';
import { Box } from '@mui/material';
import FileSearch from '../components/FileSearch'; // مسیر کامپوننت FileSearch را بررسی کنید

const FileSearchPage: React.FC = () => {
    return (
        <Box>
            {/* <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 'bold' }}>
                Document Search Engine
            </Typography> */}
            
            {/* Render the actual search component */}
            <FileSearch />
        </Box>
    );
};

export default FileSearchPage;