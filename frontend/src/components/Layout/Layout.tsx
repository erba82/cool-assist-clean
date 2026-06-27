import React, { ReactNode } from 'react';
import { Box, Container } from '@mui/material';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 2, textAlign: 'center', bgcolor: '#f5f5f5' }}>
        <Container>
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            © {new Date().getFullYear()} COOL-ASSIST | AI HVACR & Electrical Assistant
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
