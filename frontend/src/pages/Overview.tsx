/**
 * Overview.tsx (Dashboard)
 * Dashboard with dynamic Pinned Projects and All Projects from ProjectContext
 * Using theme-aware colors for dark mode support
 */

import React, { useState } from 'react';
import {
    Box, Typography, Card, CardContent, Avatar, TextField,
    InputAdornment, Select, MenuItem, FormControl, Chip, IconButton,
    Table, TableBody, TableCell, TableHead, TableRow, Pagination,
    useTheme
} from '@mui/material';
import {
    Search as SearchIcon,
    ArrowForward as ArrowForwardIcon,
    Analytics as AnalyticsIcon,
    Chat as ChatIcon,
    PushPin as PinIcon,
    Folder as FolderIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../contexts/ProjectContext';

const Overview: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { pinnedProjects, recentProjects, selectProject } = useProjects();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('Last Updated');
    const [currentPage, setCurrentPage] = useState(1);
    const projectsPerPage = 5;

    const isDarkMode = theme.palette.mode === 'dark';

    // Filter projects by search
    const filteredProjects = recentProjects.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Paginate
    const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);
    const paginatedProjects = filteredProjects.slice(
        (currentPage - 1) * projectsPerPage,
        currentPage * projectsPerPage
    );

    // Format date
    const formatDate = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return { bg: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5', text: '#10B981' };
            case 'completed': return { bg: isDarkMode ? 'rgba(34, 197, 94, 0.2)' : '#F0FDF4', text: '#22C55E' };
            case 'archived': return { bg: isDarkMode ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6', text: '#6B7280' };
            default: return { bg: isDarkMode ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6', text: '#6B7280' };
        }
    };

    const handleProjectClick = (projectId: string) => {
        selectProject(projectId);
        navigate(`/chat/${projectId}`);
    };

    return (
        <Box sx={{ width: '100%', maxWidth: 1200, margin: '0 auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                        Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage and organize your engineering projects.
                    </Typography>
                </Box>
                <TextField
                    size="small"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: 240,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            bgcolor: theme.palette.background.paper,
                        }
                    }}
                />
            </Box>

            {/* Pinned Projects */}
            {pinnedProjects.length > 0 && (
                <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <PinIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
                        <Typography variant="h6" fontWeight={600} color="text.primary">
                            Pinned Projects
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                        {pinnedProjects.slice(0, 4).map((project) => {
                            const statusColor = getStatusColor(project.status);
                            return (
                                <Card
                                    key={project.id}
                                    onClick={() => handleProjectClick(project.id)}
                                    sx={{
                                        flex: '1 1 300px',
                                        maxWidth: 400,
                                        borderRadius: 3,
                                        border: `1px solid ${theme.palette.divider}`,
                                        bgcolor: theme.palette.background.paper,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                            borderColor: '#10B981',
                                        }
                                    }}
                                >
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Avatar sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F9FAFB', width: 40, height: 40 }}>
                                                <AnalyticsIcon sx={{ color: 'text.secondary' }} />
                                            </Avatar>
                                            <Chip
                                                label={project.status}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusColor.bg,
                                                    color: statusColor.text,
                                                    fontWeight: 600,
                                                    fontSize: 12,
                                                    textTransform: 'capitalize',
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                                            {project.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                                            {project.description || `${project.chatHistory.length} messages`}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Updated {formatDate(project.updatedAt)}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Box>
            )}

            {/* All Projects */}
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                        All Projects
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">Sort by:</Typography>
                        <FormControl size="small" variant="standard">
                            <Select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                disableUnderline
                                sx={{ fontSize: 14, fontWeight: 500, color: 'text.primary' }}
                            >
                                <MenuItem value="Last Updated">Last Updated</MenuItem>
                                <MenuItem value="Name">Name</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </Box>

                {filteredProjects.length > 0 ? (
                    <>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, overflow: 'hidden' }}>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Project Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Status</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedProjects.map((project) => {
                                        const statusColor = getStatusColor(project.status);
                                        return (
                                            <TableRow
                                                key={project.id}
                                                hover
                                                onClick={() => handleProjectClick(project.id)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F9FAFB' }
                                                }}
                                            >
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F3F4F6', width: 36, height: 36 }}>
                                                            {project.isPinned ? <PinIcon sx={{ color: '#F59E0B', fontSize: 20 }} /> : <FolderIcon sx={{ color: 'text.secondary', fontSize: 20 }} />}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography fontWeight={600} color="text.primary">
                                                                {project.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {project.chatHistory.length} messages • Updated {formatDate(project.updatedAt)}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={project.status}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: statusColor.bg,
                                                            color: statusColor.text,
                                                            fontWeight: 500,
                                                            fontSize: 12,
                                                            textTransform: 'capitalize',
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" sx={{ color: 'text.secondary' }}>
                                                        <ArrowForwardIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Card>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Showing <strong>{(currentPage - 1) * projectsPerPage + 1}</strong> to <strong>{Math.min(currentPage * projectsPerPage, filteredProjects.length)}</strong> of <strong>{filteredProjects.length}</strong> results
                                </Typography>
                                <Pagination
                                    count={totalPages}
                                    page={currentPage}
                                    onChange={(_, page) => setCurrentPage(page)}
                                    color="primary"
                                    sx={{
                                        '& .MuiPaginationItem-root': { borderRadius: 2 },
                                        '& .Mui-selected': { bgcolor: '#10B981 !important' }
                                    }}
                                />
                            </Box>
                        )}
                    </>
                ) : (
                    <Card sx={{ borderRadius: 3, border: `1px solid ${theme.palette.divider}`, p: 4, textAlign: 'center' }}>
                        <FolderIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No projects yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Create a new project from the sidebar to get started.
                        </Typography>
                    </Card>
                )}
            </Box>

            {/* Quick Actions */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
                    Quick Actions
                </Typography>
                <Card
                    sx={{
                        cursor: 'pointer',
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        '&:hover': { borderColor: '#10B981' }
                    }}
                    onClick={() => navigate('/chat')}
                >
                    <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5', width: 36, height: 36 }}>
                            <ChatIcon sx={{ color: '#10B981', fontSize: 20 }} />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600} color="text.primary">AI Assistant</Typography>
                            <Typography variant="caption" color="text.secondary">Get help with calculations</Typography>
                        </Box>
                        <ArrowForwardIcon sx={{ color: 'text.secondary' }} />
                    </CardContent>
                </Card>
            </Box>
        </Box>
    );
};

export default Overview;
