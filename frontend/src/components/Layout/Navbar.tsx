import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import CalculateIcon from '@mui/icons-material/Calculate';
import SchemaIcon from '@mui/icons-material/Schema';
import FolderIcon from '@mui/icons-material/Folder';
import BuildIcon from '@mui/icons-material/Build';
import HomeIcon from '@mui/icons-material/Home';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const menuItems = [
    { text: 'Dashboard ', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Refrigerant-Properties', icon: <AcUnitIcon />, path: '/refrigerant-properties' },
    { text: 'Load-Calculation', icon: <CalculateIcon />, path: '/load-calculation' },
    { text: 'Diagram-Generator', icon: <SchemaIcon />, path: '/diagram-generator' },
    { text: 'Project-Management', icon: <FolderIcon />, path: '/project-management' },
    { text: 'Troubleshooting', icon: <BuildIcon />, path: '/troubleshooting' },
  ];

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#0066b2' }}>
        <Toolbar>
          {isMobile ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={toggleDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          ) : null}
          
          <Box 
            component="img" 
            src="/assets/logo.jpg" 
            alt="Cool-Assist Logo" 
            sx={{ 
              height: 40, 
              mr: 1,
              display: { xs: 'none', sm: 'block' }
            }} 
            onClick={() => navigate('/')}
          />
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            onClick={() => navigate('/')}
          >
            COOL-ASSIST
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex' }}>
              {menuItems.map((item) => (
                <Button 
                  key={item.path}
                  color="inherit"
                  onClick={() => handleNavigation(item.path)}
                  sx={{ 
                    mx: 0.5,
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    borderBottom: isActive(item.path) ? '2px solid white' : 'none'
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          
          <Button 
            color="inherit" 
            variant="outlined" 
            sx={{ ml: 2 }}
            onClick={() => navigate('/')}
          >
            Exit
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <List>
            <ListItem button onClick={() => handleNavigation('/')}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="صفحه اصلی" />
            </ListItem>
            
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.path} 
                onClick={() => handleNavigation(item.path)}
                selected={isActive(item.path)}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
