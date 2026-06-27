/*
 * DashboardLayout.tsx
 * Enhanced dashboard layout with beautiful animations and interactions
 * Date: 2025-04-27 19:45:00
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Box, AppBar, Toolbar, IconButton, Drawer, List, ListItemButton,
    ListItemIcon, ListItemText, Divider, useTheme, useMediaQuery, Avatar, Menu, MenuItem,
    Badge, Typography, Tooltip, CssBaseline, Fade
} from '@mui/material';
import {
    Chat as ChatIcon, AcUnit as AcUnitIcon, Folder as FolderIcon,
    Science as EngineeringCalculatorIcon, CompareArrows as UnitConverterIcon,
    Menu as MenuIcon, Notifications as NotificationsIcon,
    ExitToApp as LogoutIcon, AccountCircle as AccountCircleIcon,
    Settings as SettingsIcon, ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Brightness4 as Brightness4Icon, Brightness7 as Brightness7Icon,
    AccountBalance as AccountBalanceIcon, Help as HelpIcon,
    Instagram as InstagramIcon, Telegram as TelegramIcon,
    LinkedIn as LinkedInIcon, Schema as SchemaIcon,
    ElectricalServices as ElectricalServicesIcon,
    Dashboard as DashboardIcon,
} from '@mui/icons-material';
// Importing X (Twitter) icon
import { SvgIcon } from '@mui/material';
import { useThemeMode } from '../App';
import { useLayout } from '../context/LayoutContext';
import SupportChatBot from '../support/SupportChatBot';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { useProjects } from '../contexts/ProjectContext';
import { Collapse, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, PushPin as PinIcon, ExpandMore, ExpandLess } from '@mui/icons-material';

// Cool-Assist Minimal Logo Component for Sidebar
const SidebarLogo: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
    return <Logo size={collapsed ? 32 : 40} animated={false} />;
};

// Sidebar widths
const drawerWidthExpanded = 240;
const drawerWidthCollapsed = 72;

// Props Interface
interface DashboardLayoutProps {
    children: React.ReactNode;
    onLogout: () => void;
}

// Custom X (Twitter) icon
const XIcon = (props: any) => (
    <SvgIcon {...props}>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </SvgIcon>
);

// Main component
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, onLogout }) => {
    const theme = useTheme();
    const { mode, toggleColorMode } = useThemeMode();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const location = useLocation();

    // Get and send data to layout context
    const { setMainDrawerWidth, setIsMainDrawerOpen } = useLayout();

    const [open, setOpen] = useState(true); // Desktop sidebar state
    const [mobileOpen, setMobileOpen] = useState<boolean>(false); // Mobile drawer state
    const [showSupportChat, setShowSupportChat] = useState<boolean>(false); // Support chat state
    const [hoveredMenuItem, setHoveredMenuItem] = useState<string | null>(null);
    const [projectsExpanded, setProjectsExpanded] = useState<boolean>(true); // Projects submenu
    const [newProjectDialog, setNewProjectDialog] = useState<boolean>(false);
    const [newProjectName, setNewProjectName] = useState<string>('');

    // Projects context
    const { projects, recentProjects, createProject, deleteProject, selectProject, togglePin } = useProjects();

    // Calculate current sidebar width
    const currentDrawerWidth = open ? drawerWidthExpanded : drawerWidthCollapsed;

    // Update sidebar info in context
    useEffect(() => {
        setMainDrawerWidth(currentDrawerWidth);
        setIsMainDrawerOpen(open);

        console.log(`Dashboard sidebar state updated: width=${currentDrawerWidth}, isOpen=${open}`);
    }, [open, currentDrawerWidth, setMainDrawerWidth, setIsMainDrawerOpen]);

    // Handler functions
    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleMobileDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const handleLogout = () => {
        onLogout();
    };

    const toggleSupportChat = () => {
        setShowSupportChat(!showSupportChat);
    };

    // Handle new project creation
    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            const project = createProject(newProjectName.trim());
            setNewProjectName('');
            setNewProjectDialog(false);
            navigate(`/chat/${project.id}`);
        }
    };

    // Handle project selection
    const handleProjectClick = (projectId: string) => {
        selectProject(projectId);
        navigate(`/chat/${projectId}`);
        if (isMobile) setMobileOpen(false);
    };

    // Sidebar menu items (without Projects - it's now a submenu under AI Assistant)
    interface MenuItemType {
        text: string;
        icon: React.ReactElement;
        path: string;
    }

    const menuItems: MenuItemType[] = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    ];

    // Open social links in new window
    const handleSocialClick = (url: string) => {
        window.open(url, '_blank');
    };

    // Animation variants for menu items
    const menuItemVariants = {
        initial: {
            opacity: 0,
            x: -20
        },
        animate: (custom: number) => ({
            opacity: 1,
            x: 0,
            transition: {
                delay: custom * 0.05,
                duration: 0.3,
                ease: "easeOut"
            }
        }),
        hover: {
            scale: 1.05,
            backgroundColor: theme.palette.action.hover,
            transition: { duration: 0.2 }
        },
        tap: {
            scale: 0.95
        },
        exit: {
            opacity: 0,
            x: -20,
            transition: { duration: 0.2 }
        }
    };

    // Animation variants for icons in collapsed mode
    const iconVariants = {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
        hover: {
            scale: 1.2,
            color: theme.palette.primary.main,
            transition: { duration: 0.2 }
        }
    };

    // Text animation variants
    const textVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.2 } }
    };

    // Sidebar content component
    const SidebarContent = () => (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo and Brand */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Box sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}>
                    {/* Logo Centered */}
                    <motion.div>
                        <SidebarLogo collapsed={!open} />
                    </motion.div>

                    {/* Brand Text */}
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                variants={textVariants}
                                initial="hidden"
                                animate="visible"
                                exit="hidden"
                                transition={{ duration: 0.3 }}
                                style={{ marginLeft: 8 }}
                            >
                                <Typography
                                    variant="h6"
                                    sx={{
                                        fontWeight: 700,
                                        color: theme.palette.text.primary,
                                        fontSize: '1.125rem'
                                    }}
                                >
                                    Cool-Assist
                                </Typography>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
            </motion.div>

            {/* Navigation Menu */}
            <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
                <List sx={{ px: 1 }}>
                    {/* Dashboard */}
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <ListItemButton
                                key={item.text}
                                onClick={() => handleNavigation(item.path)}
                                sx={{
                                    mb: 0.5,
                                    borderRadius: 2,
                                    minHeight: 44,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: open ? 2 : 1.5,
                                    backgroundColor: isActive
                                        ? theme.palette.mode === 'light'
                                            ? 'rgba(16, 185, 129, 0.08)'
                                            : 'rgba(16, 185, 129, 0.12)'
                                        : 'transparent',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'light'
                                            ? 'rgba(16, 185, 129, 0.08)'
                                            : 'rgba(16, 185, 129, 0.12)',
                                    }
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: isActive ? '#10b981' : theme.palette.text.secondary }}>
                                    {item.icon}
                                </ListItemIcon>
                                {open && <ListItemText primary={item.text} sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: isActive ? 600 : 400, color: isActive ? '#10b981' : theme.palette.text.secondary } }} />}
                                {isActive && <Box sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: '0 2px 2px 0', backgroundColor: '#10b981' }} />}
                            </ListItemButton>
                        );
                    })}

                    {/* AI Assistant with Projects Submenu */}
                    <ListItemButton
                        onClick={() => { handleNavigation('/chat'); setProjectsExpanded(!projectsExpanded); }}
                        sx={{
                            mb: 0.5,
                            borderRadius: 2,
                            minHeight: 44,
                            justifyContent: open ? 'initial' : 'center',
                            px: open ? 2 : 1.5,
                            backgroundColor: location.pathname.startsWith('/chat')
                                ? theme.palette.mode === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)'
                                : 'transparent',
                            '&:hover': { backgroundColor: theme.palette.mode === 'light' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.12)' }
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center', color: location.pathname.startsWith('/chat') ? '#10b981' : theme.palette.text.secondary }}>
                            <ChatIcon />
                        </ListItemIcon>
                        {open && (
                            <>
                                <ListItemText primary="AI Assistant" sx={{ '& .MuiListItemText-primary': { fontSize: '0.875rem', fontWeight: location.pathname.startsWith('/chat') ? 600 : 400, color: location.pathname.startsWith('/chat') ? '#10b981' : theme.palette.text.secondary } }} />
                                {projectsExpanded ? <ExpandLess sx={{ color: theme.palette.text.secondary, fontSize: 18 }} /> : <ExpandMore sx={{ color: theme.palette.text.secondary, fontSize: 18 }} />}
                            </>
                        )}
                        {location.pathname.startsWith('/chat') && <Box sx={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: '0 2px 2px 0', backgroundColor: '#10b981' }} />}
                    </ListItemButton>

                    {/* Projects Submenu */}
                    {open && (
                        <Collapse in={projectsExpanded} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding sx={{ pl: 2 }}>
                                {/* Add New Project Button */}
                                <ListItemButton
                                    onClick={() => setNewProjectDialog(true)}
                                    sx={{ borderRadius: 2, minHeight: 36, mb: 0.5, py: 0.5, '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.08)' } }}
                                >
                                    <ListItemIcon sx={{ minWidth: 28, color: '#10b981' }}>
                                        <AddIcon sx={{ fontSize: 18 }} />
                                    </ListItemIcon>
                                    <ListItemText primary="New Project" sx={{ '& .MuiListItemText-primary': { fontSize: '0.8rem', fontWeight: 500, color: '#10b981' } }} />
                                </ListItemButton>

                                {/* Project List */}
                                {recentProjects.slice(0, 10).map((project) => (
                                    <ListItemButton
                                        key={project.id}
                                        onClick={() => handleProjectClick(project.id)}
                                        sx={{
                                            borderRadius: 2,
                                            minHeight: 36,
                                            mb: 0.25,
                                            py: 0.5,
                                            backgroundColor: location.pathname === `/chat/${project.id}` ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                                            '&:hover': { backgroundColor: 'rgba(16, 185, 129, 0.08)' }
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 28, color: project.isPinned ? '#F59E0B' : theme.palette.text.disabled }}>
                                            {project.isPinned ? <PinIcon sx={{ fontSize: 14 }} /> : <FolderIcon sx={{ fontSize: 14 }} />}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={project.name}
                                            sx={{
                                                '& .MuiListItemText-primary': {
                                                    fontSize: '0.8rem',
                                                    fontWeight: location.pathname === `/chat/${project.id}` ? 600 : 400,
                                                    color: location.pathname === `/chat/${project.id}` ? '#10b981' : theme.palette.text.secondary,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }
                                            }}
                                        />
                                        {/* Pin/Unpin and Delete buttons on hover */}
                                        <Box sx={{ display: 'flex', gap: 0.5, opacity: 0, '&:hover': { opacity: 1 }, '.MuiListItemButton-root:hover &': { opacity: 1 } }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); togglePin(project.id); }}
                                                sx={{ p: 0.25, color: project.isPinned ? '#F59E0B' : theme.palette.text.disabled }}
                                            >
                                                <PinIcon sx={{ fontSize: 12 }} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                                                sx={{ p: 0.25, color: theme.palette.error.main }}
                                            >
                                                <DeleteIcon sx={{ fontSize: 12 }} />
                                            </IconButton>
                                        </Box>
                                    </ListItemButton>
                                ))}

                                {recentProjects.length === 0 && (
                                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: theme.palette.text.disabled, py: 1 }}>
                                        No projects yet
                                    </Typography>
                                )}
                            </List>
                        </Collapse>
                    )}
                </List>
            </Box>

            {/* Footer with social links and theme toggle */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <Box sx={{
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`
                }}>
                    {/* Theme Toggle */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <IconButton
                                onClick={toggleColorMode}
                                sx={{
                                    backgroundColor: theme.palette.mode === 'light'
                                        ? 'rgba(16, 185, 129, 0.1)'
                                        : 'rgba(16, 185, 129, 0.15)',
                                    color: '#10b981',
                                    '&:hover': {
                                        backgroundColor: theme.palette.mode === 'light'
                                            ? 'rgba(16, 185, 129, 0.2)'
                                            : 'rgba(16, 185, 129, 0.25)'
                                    }
                                }}
                            >
                                {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                        </motion.div>
                    </Box>

                    {/* Social Links */}
                    <AnimatePresence>
                        {open && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: 'block',
                                        textAlign: 'center',
                                        mb: 1,
                                        color: theme.palette.text.secondary,
                                        fontWeight: 500
                                    }}
                                >
                                    Connect with us
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                    {[
                                        { icon: <InstagramIcon />, url: 'https://instagram.com', color: '#E4405F' },
                                        { icon: <TelegramIcon />, url: 'https://telegram.org', color: '#0088cc' },
                                        { icon: <LinkedInIcon />, url: 'https://linkedin.com', color: '#0077b5' },
                                        { icon: <XIcon />, url: 'https://x.com', color: '#1DA1F2' }
                                    ].map((social, index) => (
                                        <motion.div
                                            key={index}
                                            whileHover={{
                                                scale: 1.2,
                                                rotate: 5,
                                                transition: { duration: 0.2 }
                                            }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <IconButton
                                                size="small"
                                                onClick={() => handleSocialClick(social.url)}
                                                sx={{
                                                    color: theme.palette.text.secondary,
                                                    backgroundColor: 'transparent',
                                                    width: 32,
                                                    height: 32,
                                                    '&:hover': {
                                                        color: social.color,
                                                        backgroundColor: `${social.color}15`
                                                    }
                                                }}
                                            >
                                                {social.icon}
                                            </IconButton>
                                        </motion.div>
                                    ))}
                                </Box>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Collapse Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 180 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <Tooltip title={open ? "Collapse sidebar" : "Expand sidebar"}>
                                <IconButton onClick={handleDrawerToggle}>
                                    {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                                </IconButton>
                            </Tooltip>
                        </motion.div>
                    </Box>
                </Box>
            </motion.div>
        </Box>
    );

    return (
        <Box sx={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            bgcolor: theme.palette.mode === 'dark' ? '#0a0e1a' : '#e5e7eb', // Darker background
            gap: '12px', // Space between sidebar and content
            p: '12px', // Padding around all
        }}>
            <CssBaseline />

            {/* Desktop Sidebar - Permanent */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', sm: 'block' },
                    width: currentDrawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: currentDrawerWidth,
                        boxSizing: 'border-box',
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: open ? theme.transitions.duration.enteringScreen : theme.transitions.duration.leavingScreen,
                        }),
                        overflowX: 'hidden',
                        border: 'none', // Remove border
                        borderRadius: 2, // Add rounded corners
                        backgroundColor: theme.palette.background.paper,
                        boxShadow: 2, // Add shadow
                    },
                }}
                open={open}
            >
                <SidebarContent />
            </Drawer>

            {/* Mobile Sidebar - Temporary */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={handleMobileDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Better mobile performance
                }}
                sx={{
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': {
                        width: drawerWidthExpanded,
                        boxSizing: 'border-box',
                        backgroundColor: theme.palette.background.paper,
                    },
                }}
            >
                <SidebarContent />
            </Drawer>

            {/* Main Content Area */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 2,
                    transition: "all 0.3s ease",
                }}
            >
                {/* No AppBar - clean layout */}
                <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    sx={{
                        flexGrow: 1,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        '&::-webkit-scrollbar': {
                            width: '8px'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'rgba(0, 0, 0, 0.2)',
                            borderRadius: '4px',
                        }
                    }}
                >
                    {children}
                </Box>
            </Box>

            {/* Support chat component */}
            {showSupportChat && <SupportChatBot onClose={() => setShowSupportChat(false)} />}

            {/* New Project Dialog */}
            <Dialog open={newProjectDialog} onClose={() => setNewProjectDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Create New Project</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Project Name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                        sx={{ mt: 1 }}
                        placeholder="e.g., Industrial Cooling System"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setNewProjectDialog(false)} sx={{ color: theme.palette.text.secondary }}>Cancel</Button>
                    <Button
                        onClick={handleCreateProject}
                        variant="contained"
                        disabled={!newProjectName.trim()}
                        sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
                    >
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DashboardLayout;
