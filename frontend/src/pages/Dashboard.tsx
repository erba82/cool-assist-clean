import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Grid, Paper, AppBar, Toolbar,
  IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider, Card, CardContent, useTheme, useMediaQuery,
  Avatar, Menu, MenuItem, Badge
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AcUnit as AcUnitIcon,
  BarChart as BarChartIcon,
  Build as BuildIcon,
  Note as NoteIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Search as SearchIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import FileSearch from '../components/FileSearch';
import { useAI } from '../context/AIContext';

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('search');
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifMenuAnchor, setNotifMenuAnchor] = useState<null | HTMLElement>(null);
  const [stats, setStats] = useState({
    projects: 0,
    documents: 0,
    refrigerants: 0,
    alerts: 0
  });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { isLoading } = useAI();

  // Fetch dashboard statistics
  useEffect(() => {
    // In a real app, this would be an API call
    // For now, just set some dummy data
    setTimeout(() => {
      setStats({
        projects: 12,
        documents: 237,
        refrigerants: 8,
        alerts: 3
      });
    }, 1000);
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (section: string) => {
    if (section === 'search' || section === 'overview') {
      setActiveSection(section);
      setDrawerOpen(false);
    } else {
      // For other sections, navigate to their respective pages
      navigate(`/${section}`);
    }
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotifMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifMenuAnchor(event.currentTarget);
  };

  const handleNotifMenuClose = () => {
    setNotifMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  const menuItems = [
    { text: 'Overview', icon: <DashboardIcon />, section: 'overview' },
    { text: 'Document Search', icon: <SearchIcon />, section: 'search' },
    { text: 'Refrigerant Properties', icon: <AcUnitIcon />, section: 'refrigerant-properties' },
    { text: 'Load Calculation', icon: <BarChartIcon />, section: 'load-calculation' },
    { text: 'Diagram Generator', icon: <NoteIcon />, section: 'diagram-generator' },
    { text: 'Project Management', icon: <BuildIcon />, section: 'project-management' }
  ];

  // Drawer content
  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div">
          Cool Assist
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            onClick={() => handleNavigation(item.section)}
            selected={activeSection === item.section}
          >
            <ListItemIcon>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  // Dashboard stat cards
  const StatCard = ({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h5">{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  // Main content based on active section
  const renderContent = () => {
    if (activeSection === 'search') {
      return <FileSearch />;
    }

    // Overview section (default)
    return (
      <>
        <Typography variant="h5" component="h2" gutterBottom>
          Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Projects" 
              value={stats.projects} 
              icon={<BuildIcon />} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Documents" 
              value={stats.documents} 
              icon={<NoteIcon />} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Refrigerants" 
              value={stats.refrigerants} 
              icon={<AcUnitIcon />} 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Alerts" 
              value={stats.alerts} 
              icon={<NotificationsIcon />} 
            />
          </Grid>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Welcome to Cool Assist! This is your HVAC engineering assistant dashboard.
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
                Use the navigation menu to access different tools and features. Click on "Document Search" to search through your HVAC documents.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </>
    );
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Cool Assist HVAC Engineering Assistant
          </Typography>

          {/* Notifications Icon */}
          <IconButton color="inherit" onClick={handleNotifMenuOpen}>
            <Badge badgeContent={stats.alerts} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Settings Icon */}
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>

          {/* User Avatar */}
          <IconButton 
            color="inherit" 
            onClick={handleUserMenuOpen} 
            sx={{ ml: 1 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}>
              <PersonIcon />
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleUserMenuClose}>Profile</MenuItem>
        <MenuItem onClick={handleUserMenuClose}>My Account</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notifMenuAnchor}
        open={Boolean(notifMenuAnchor)}
        onClose={handleNotifMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleNotifMenuClose}>
          <Typography variant="body2">System update completed</Typography>
        </MenuItem>
        <MenuItem onClick={handleNotifMenuClose}>
          <Typography variant="body2">New refrigerant data available</Typography>
        </MenuItem>
        <MenuItem onClick={handleNotifMenuClose}>
          <Typography variant="body2">Maintenance reminder: Check filters</Typography>
        </MenuItem>
      </Menu>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? drawerOpen : true}
        onClose={handleDrawerToggle}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` },
          mt: ['56px', '64px'],
          bgcolor: 'background.default', // Match background
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : (
          renderContent()
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;