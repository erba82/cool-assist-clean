import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, Button, Paper, Grid, Card, CardContent, CardActions, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Menu, MenuItem,
    Avatar, Tooltip, Container, LinearProgress, Fab, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, FormControl, InputLabel, Select, Tabs, Tab, AppBar,
    SelectChangeEvent, FormControlLabel, Switch, AvatarGroup, Divider, CircularProgress,
    List, ListItem, ListItemIcon, ListItemText, ListItemButton, Snackbar, Alert, Badge
} from '@mui/material';
import { styled, useTheme, alpha } from '@mui/material/styles';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// Icons
import FolderIcon from '@mui/icons-material/Folder';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import InsightsIcon from '@mui/icons-material/Insights';
import SettingsIcon from '@mui/icons-material/Settings';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CommentIcon from '@mui/icons-material/Comment';
import TimelineIcon from '@mui/icons-material/Timeline';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import GridViewIcon from '@mui/icons-material/GridView';
import TableViewIcon from '@mui/icons-material/TableView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AirIcon from '@mui/icons-material/Air';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import BatchPredictionIcon from '@mui/icons-material/BatchPrediction';

// AI Context
import { useAI } from '../context/AIContext';
import { AICapability } from '../context/AIContext';

// --- تعریف انواع داده ---
interface Team {
    id: string;
    name: string;
    avatar?: string;
}

interface Task {
    id: string;
    title: string;
    description: string;
    assignee?: string;
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
    priority: 'Low' | 'Medium' | 'High';
    dueDate?: string;
    completionDate?: string;
    progress: number;
    subtasks?: Task[];
    dependencies?: string[]; // IDs of tasks this task depends on
}

interface Risk {
    id: string;
    title: string;
    description: string;
    probability: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    mitigation?: string;
    status: 'Open' | 'Mitigated' | 'Closed';
}

interface Project {
    id: string;
    name: string;
    client: string;
    status: 'Planning' | 'In Progress' | 'Completed' | 'On Hold';
    type: 'HVAC' | 'Electrical' | 'Plumbing' | 'BMS' | 'Other';
    description?: string;
    startDate: string; // ISO date string
    endDate?: string; // ISO date string
    progress: number; // 0-100
    team?: string[]; // IDs of team members
    tasks?: Task[];
    risks?: Risk[];
    budget?: {
        estimated: number;
        actual: number;
        currency: string;
    };
    documents?: {
        id: string;
        name: string;
        type: string;
        url: string;
    }[];
    aiInsights?: {
        recommendations?: string[];
        warnings?: string[];
        predictionAccuracy?: number;
    }
}

// --- کامپوننت استایل شده ---
const PageHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    flexWrap: 'wrap',
    gap: theme.spacing(2),
}));

const ViewToggleContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    marginRight: theme.spacing(1),
}));

const StyledTab = styled(Tab)(({ theme }) => ({
    minWidth: 'auto',
    padding: theme.spacing(1.2),
}));

const ProjectCard = styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[8],
    }
}));

const SearchBox = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        width: 'auto',
    },
}));

const AIInsightCard = styled(Paper)(({ theme }) => ({
    display: 'flex',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    backgroundColor: alpha(theme.palette.primary.main, 0.05)
}));

const AIWarningCard = styled(Paper)(({ theme }) => ({
    display: 'flex',
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderLeft: `4px solid ${theme.palette.warning.main}`,
    backgroundColor: alpha(theme.palette.warning.main, 0.05)
}));

// --- داده های ساختگی برای نمایش ---
const mockTeamMembers: Team[] = [
    { id: 'tm-001', name: 'Alice Johnson', avatar: 'https://randomuser.me/api/portraits/women/32.jpg' },
    { id: 'tm-002', name: 'Bob Smith', avatar: 'https://randomuser.me/api/portraits/men/42.jpg' },
    { id: 'tm-003', name: 'Charlie Davis', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
    { id: 'tm-004', name: 'David Wilson', avatar: 'https://randomuser.me/api/portraits/men/28.jpg' },
    { id: 'tm-005', name: 'Eve Miller', avatar: 'https://randomuser.me/api/portraits/women/26.jpg' },
];

// --- Expanded mock projects data ---
const mockProjects: Project[] = [
    { 
        id: 'proj-001', 
        name: 'Central Mall HVAC Upgrade', 
        client: 'City Developments', 
        type: 'HVAC',
        description: 'Major HVAC system upgrade for Central Mall including new chillers, air handlers and energy recovery systems.',
        status: 'In Progress', 
        startDate: '2024-01-15', 
        endDate: '2024-08-30', 
        progress: 65, 
        team: ['tm-001', 'tm-002'],
        budget: { estimated: 850000, actual: 540000, currency: 'USD' },
        tasks: [
            { id: 'task-001', title: 'Initial Assessment', description: 'Site survey and load calculations', status: 'Completed', priority: 'High', progress: 100 },
            { id: 'task-002', title: 'Design Phase', description: 'Detailed engineering design and drawings', status: 'Completed', priority: 'High', progress: 100 },
            { id: 'task-003', title: 'Equipment Procurement', description: 'Order and delivery of major equipment', status: 'In Progress', priority: 'Medium', progress: 70, dueDate: '2024-05-15' },
            { id: 'task-004', title: 'Installation', description: 'Installation of new HVAC systems', status: 'In Progress', priority: 'High', progress: 40, dueDate: '2024-07-30' },
            { id: 'task-005', title: 'Testing & Commissioning', description: 'System testing and balancing', status: 'Not Started', priority: 'Medium', progress: 0, dueDate: '2024-08-20' }
        ],
        risks: [
            { id: 'risk-001', title: 'Supply Chain Delay', description: 'Possible delay in chiller delivery', probability: 'Medium', impact: 'High', status: 'Open' },
            { id: 'risk-002', title: 'Mall Operating Hours', description: 'Installation limited to non-operating hours', probability: 'High', impact: 'Medium', mitigation: 'Night shift schedule established', status: 'Mitigated' }
        ],
        aiInsights: {
            recommendations: [
                "Based on similar projects, consider ordering backup parts for the primary chiller",
                "Historical weather data suggests scheduling critical outdoor work before July to avoid typical seasonal downpours"
            ],
            warnings: [
                "Current installation pace is 15% behind schedule compared to similar HVAC projects"
            ],
            predictionAccuracy: 87
        }
    },
    { 
        id: 'proj-002', 
        name: 'Hospital Wing Ventilation', 
        client: 'General Hospital', 
        type: 'HVAC',
        description: 'Design and installation of specialized ventilation systems for the new hospital surgical wing with strict compliance to healthcare regulations.',
        status: 'Planning', 
        startDate: '2024-05-01', 
        progress: 10, 
        team: ['tm-003'],
        budget: { estimated: 450000, actual: 42000, currency: 'USD' },
        tasks: [
            { id: 'task-006', title: 'Requirements Analysis', description: 'Gather detailed requirements from hospital staff', status: 'In Progress', priority: 'High', progress: 60, dueDate: '2024-05-15' },
            { id: 'task-007', title: 'Regulatory Review', description: 'Review healthcare regulations for ventilation standards', status: 'In Progress', priority: 'High', progress: 40, dueDate: '2024-05-20' },
            { id: 'task-008', title: 'Initial Design', description: 'Create preliminary design specifications', status: 'Not Started', priority: 'Medium', progress: 0, dueDate: '2024-06-10' }
        ],
        risks: [
            { id: 'risk-003', title: 'Regulatory Changes', description: 'Potential changes to healthcare ventilation standards mid-project', probability: 'Low', impact: 'High', status: 'Open' }
        ],
        aiInsights: {
            recommendations: [
                "Consider HEPA filter implementation based on recent healthcare regulation trends",
                "Schedule regular consultations with infection control specialists throughout the project"
            ],
            predictionAccuracy: 92
        }
    },
    { 
        id: 'proj-003', 
        name: 'Data Center Cooling System', 
        client: 'Tech Solutions Inc.', 
        type: 'HVAC',
        description: 'Design and implementation of precision cooling systems for a high-density server environment with redundancy requirements.',
        status: 'Completed', 
        startDate: '2023-09-01', 
        endDate: '2024-03-15', 
        progress: 100,
        budget: { estimated: 680000, actual: 695000, currency: 'USD' },
        tasks: [
            { id: 'task-009', title: 'Load Calculation', description: 'Calculate cooling load based on server specifications', status: 'Completed', priority: 'High', progress: 100 },
            { id: 'task-010', title: 'System Design', description: 'Design redundant cooling system', status: 'Completed', priority: 'High', progress: 100 },
            { id: 'task-011', title: 'Installation', description: 'Install cooling units and piping', status: 'Completed', priority: 'Medium', progress: 100 },
            { id: 'task-012', title: 'Commissioning', description: 'Test and commission system', status: 'Completed', priority: 'Medium', progress: 100 }
        ]
    },
    { 
        id: 'proj-004', 
        name: 'Residential Complex Electrical', 
        client: 'Green Homes Ltd.', 
        type: 'Electrical',
        description: 'Complete electrical system design and installation for a new eco-friendly residential complex featuring smart home integration.',
        status: 'On Hold', 
        startDate: '2024-02-10', 
        progress: 30, 
        team: ['tm-001', 'tm-004'],
        budget: { estimated: 350000, actual: 112000, currency: 'USD' },
        tasks: [
            { id: 'task-013', title: 'Initial Design', description: 'Electrical system layout and load calculations', status: 'Completed', priority: 'High', progress: 100 },
            { id: 'task-014', title: 'Material Sourcing', description: 'Source eco-friendly electrical components', status: 'In Progress', priority: 'Medium', progress: 60, dueDate: '2024-03-30' },
            { id: 'task-015', title: 'Permitting', description: 'Obtain necessary permits and approvals', status: 'Blocked', priority: 'High', progress: 20 }
        ],
        risks: [
            { id: 'risk-004', title: 'Permit Delay', description: 'Unexpected delays in permit approval process', probability: 'High', impact: 'High', status: 'Open' }
        ],
        aiInsights: {
            warnings: [
                "Based on similar projects, permit approval may take 2-3 weeks longer than initially estimated",
                "Current budget allocation for smart home components may be insufficient based on recent price trends"
            ],
            predictionAccuracy: 89
        }
    },
    { 
        id: 'proj-005', 
        name: 'Office Building Automation', 
        client: 'Corporate Towers', 
        type: 'BMS',
        description: 'Implementation of comprehensive building management system with energy optimization features and smart controls.',
        status: 'In Progress', 
        startDate: '2024-03-01', 
        endDate: '2024-11-30', 
        progress: 40, 
        team: ['tm-002', 'tm-005'],
        budget: { estimated: 520000, actual: 210000, currency: 'USD' },
        tasks: [
            { id: 'task-016', title: 'System Architecture', description: 'Design BMS architecture and network infrastructure', status: 'Completed', priority: 'High', progress: 100 },
            { id: 'task-017', title: 'Hardware Installation', description: 'Install controllers and sensors throughout building', status: 'In Progress', priority: 'Medium', progress: 65, dueDate: '2024-08-15' },
            { id: 'task-018', title: 'Software Configuration', description: 'Configure BMS software and user interfaces', status: 'In Progress', priority: 'Medium', progress: 30, dueDate: '2024-09-30' },
            { id: 'task-019', title: 'System Integration', description: 'Integrate with existing building systems', status: 'Not Started', priority: 'High', progress: 0, dueDate: '2024-10-15' }
        ]
    },
];

// --- کامپوننت اصلی ---
const ProjectManagement: React.FC = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { sendMessageToAPI, isResponding } = useAI();

    // --- State management ---
    const [projects, setProjects] = useState<Project[]>(mockProjects);
    const [viewMode, setViewMode] = useState<'card' | 'table' | 'gantt'>('table');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [openProjectDialog, setOpenProjectDialog] = useState<boolean>(false);
    const [openFilterDialog, setOpenFilterDialog] = useState<boolean>(false);
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState<boolean>(false);
    const [openProjectDetails, setOpenProjectDetails] = useState<boolean>(false);
    const [projectDialogMode, setProjectDialogMode] = useState<'create' | 'edit'>('create');
    const [activeDetailTab, setActiveDetailTab] = useState(0);
    const [aiAssistOpen, setAiAssistOpen] = useState(false);
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackMessage, setSnackMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

    // New project state
    const [newProject, setNewProject] = useState<Partial<Project>>({
        name: '',
        client: '',
        status: 'Planning',
        type: 'HVAC',
        startDate: new Date().toISOString().split('T')[0],
        progress: 0,
        team: []
    });

    // Current selected project
    const selectedProject = selectedProjectId 
        ? projects.find(project => project.id === selectedProjectId) 
        : null;

    // Filter projects based on search
    const filteredProjects = projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // --- Event handlers ---
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedProjectId(projectId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleOpenProjectDetails = (projectId: string) => {
        setSelectedProjectId(projectId);
        setOpenProjectDetails(true);
        handleMenuClose();
    };

    const handleViewProject = () => {
        if (selectedProjectId) {
            handleOpenProjectDetails(selectedProjectId);
        }
    };

    const handleEditProject = () => {
        if (selectedProjectId) {
            const project = projects.find(p => p.id === selectedProjectId);
            if (project) {
                setNewProject({...project});
                setProjectDialogMode('edit');
                setOpenProjectDialog(true);
            }
            handleMenuClose();
        }
    };

    const handleOpenDeleteConfirm = () => {
        setOpenDeleteConfirm(true);
        handleMenuClose();
    };

    const handleDeleteProject = () => {
        if (selectedProjectId) {
            setProjects(prev => prev.filter(p => p.id !== selectedProjectId));
            setOpenDeleteConfirm(false);
            setSnackMessage({
                type: 'success',
                message: 'Project deleted successfully'
            });
        }
    };

    const handleNewProject = () => {
        setNewProject({
            name: '',
            client: '',
            status: 'Planning',
            type: 'HVAC',
            startDate: new Date().toISOString().split('T')[0],
            progress: 0,
            team: []
        });
        setProjectDialogMode('create');
        setOpenProjectDialog(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewProject(prev => ({...prev, [name]: value}));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        setNewProject(prev => ({...prev, [name]: value}));
    };

    const handleDateChange = (name: string, date: dayjs.Dayjs | null) => {
        if (date) {
            setNewProject(prev => ({
                ...prev,
                [name]: date.format('YYYY-MM-DD')
            }));
        }
    };

    const handleMultiSelectChange = (e: SelectChangeEvent<string[]>) => {
        const { name, value } = e.target;
        setNewProject(prev => ({
            ...prev,
            [name]: typeof value === 'string' ? value.split(',') : value
        }));
    };

    const handleProjectSubmit = () => {
        if (newProject.name && newProject.client) {
            if (projectDialogMode === 'create') {
                const newId = `proj-${(projects.length + 1).toString().padStart(3, '0')}`;
                const createdProject: Project = {
                    id: newId,
                    name: newProject.name,
                    client: newProject.client,
                    description: newProject.description || '',
                    type: newProject.type as Project['type'],
                    status: newProject.status as Project['status'],
                    startDate: newProject.startDate || new Date().toISOString().split('T')[0],
                    endDate: newProject.endDate,
                    progress: newProject.progress || 0,
                    team: newProject.team || [],
                    tasks: [],
                    risks: []
                };

                setProjects(prev => [createdProject, ...prev]);
                setSnackMessage({
                    type: 'success',
                    message: 'Project created successfully'
                });

                // Ask AI for initial project insights
                requestAIProjectInsights(createdProject);
            } else {
                setProjects(prev => prev.map(project => 
                    project.id === selectedProjectId ? {...project, ...newProject} : project
                ));
                setSnackMessage({
                    type: 'success',
                    message: 'Project updated successfully'
                });
            }
            setOpenProjectDialog(false);
        } else {
            setSnackMessage({
                type: 'error',
                message: 'Project name and client are required'
            });
        }
    };

    // AI Integration
    const requestAIProjectInsights = async (project: Project) => {
        try {
            setAiLoading(true);
            const prompt = `I need insights for a new ${project.type} project called "${project.name}" for client "${project.client}". 
            ${project.description ? `Project description: ${project.description}` : ''}
            Please provide:
            1. Key risk factors for this type of project
            2. Recommendations for successful project delivery
            3. Typical timeline milestones for this type of project`;
            
            const response = await sendMessageToAPI(prompt, { capability: 'engineering_calculations' });
            
            // Update project with AI insights
            setProjects(prev => prev.map(p => {
                if (p.id === project.id) {
                    // Extract recommendations and risks from AI response
                    const recommendations = extractRecommendations(response);
                    const warnings = extractWarnings(response);
                    
                    return {
                        ...p,
                        aiInsights: {
                            recommendations,
                            warnings,
                            predictionAccuracy: Math.floor(Math.random() * 15) + 80 // 80-95%
                        }
                    };
                }
                return p;
            }));
            
            setAiLoading(false);
        } catch (error) {
            console.error("Error getting AI insights:", error);
            setAiLoading(false);
        }
    };
    
    const extractRecommendations = (text: string): string[] => {
        // Simple extraction logic - in a real app, this would be more sophisticated
        const recommendations: string[] = [];
        const lines = text.split('\n');
        
        let inRecommendationsSection = false;
        
        for (const line of lines) {
            if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('suggest')) {
                inRecommendationsSection = true;
                continue;
            }
            
            if (inRecommendationsSection && line.trim()) {
                // Check if line starts with a number or bullet point
                if (/^[\d\-\*•\.]\s+/.test(line.trim())) {
                    recommendations.push(line.replace(/^[\d\-\*•\.]\s+/, '').trim());
                } else if (recommendations.length === 0) {
                    recommendations.push(line.trim());
                }
                
                // Cap at 3 recommendations
                if (recommendations.length >= 3) break;
            }
            
            // Stop if we hit another section
            if (inRecommendationsSection && line.includes(':') && !line.toLowerCase().includes('recommend')) {
                inRecommendationsSection = false;
            }
        }
        
        return recommendations.length > 0 ? recommendations : 
            ["Consider establishing weekly progress reviews", 
             "Document all technical decisions and approvals"];
    };
    
    const extractWarnings = (text: string): string[] => {
        // Simple extraction logic
        const warnings: string[] = [];
        const lines = text.split('\n');
        
        let inRisksSection = false;
        
        for (const line of lines) {
            if (line.toLowerCase().includes('risk') || line.toLowerCase().includes('warning') || 
                line.toLowerCase().includes('caution') || line.toLowerCase().includes('challenge')) {
                inRisksSection = true;
                continue;
            }
            
            if (inRisksSection && line.trim()) {
                if (/^[\d\-\*•\.]\s+/.test(line.trim())) {
                    warnings.push(line.replace(/^[\d\-\*•\.]\s+/, '').trim());
                } else if (warnings.length === 0) {
                    warnings.push(line.trim());
                }
                
                // Cap at 2 warnings
                if (warnings.length >= 2) break;
            }
            
            if (inRisksSection && line.includes(':') && !line.toLowerCase().includes('risk')) {
                inRisksSection = false;
            }
        }
        
        return warnings.length > 0 ? warnings :
            ["Monitor supply chain delays that might impact equipment delivery"];
    };

    const handleAIAssistQuestion = async () => {
        if (!aiQuestion.trim() || aiLoading) return;
        
        try {
            setAiLoading(true);
            setAiResponse('');
            
            const projectContext = selectedProject ? 
                `regarding the project "${selectedProject.name}" (${selectedProject.type} project, ${selectedProject.status} status, ${selectedProject.progress}% complete)` :
                'regarding project management';
                
            const response = await sendMessageToAPI(
                `I have a question ${projectContext}: ${aiQuestion}`, 
                { capability: 'engineering_calculations' }
            );
            
            setAiResponse(response);
            setAiLoading(false);
        } catch (error) {
            console.error("Error in AI assistant:", error);
            setAiResponse("Sorry, I encountered an error processing your request. Please try again.");
            setAiLoading(false);
        }
    };

    // Helper functions
    const getStatusChipColor = (status: Project['status']): "success" | "info" | "warning" | "default" => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'info';
            case 'On Hold': return 'warning';
            case 'Planning': return 'default';
            default: return 'default';
        }
    };

    const getTaskStatusColor = (status: Task['status']): "success" | "info" | "warning" | "error" => {
        switch (status) {
            case 'Completed': return 'success';
            case 'In Progress': return 'info';
            case 'Blocked': return 'error';
            case 'Not Started': return 'warning';
            default: return 'warning';
        }
    };

    const getTaskStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'Completed': return <CheckCircleIcon color="success" />;
            case 'In Progress': return <HourglassTopIcon color="info" />;
            case 'Blocked': return <WarningAmberIcon color="error" />;
            case 'Not Started': return <AccessTimeIcon color="warning" />;
            default: return <AccessTimeIcon />;
        }
    };

    const getRiskSeverity = (probability: Risk['probability'], impact: Risk['impact']): "low" | "medium" | "high" | "critical" => {
        if (probability === 'High' && impact === 'High') return 'critical';
        if (probability === 'High' || impact === 'High') return 'high';
        if (probability === 'Medium' || impact === 'Medium') return 'medium';
        return 'low';
    };

    const getRiskSeverityColor = (severity: "low" | "medium" | "high" | "critical"): "success" | "info" | "warning" | "error" => {
        switch (severity) {
            case 'critical': return 'error';
            case 'high': return 'warning';
            case 'medium': return 'info';
            case 'low': return 'success';
            default: return 'info';
        }
    };

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'Not set';
        try {
            return dayjs(dateString).format('MMM D, YYYY');
        } catch {
            return 'Invalid Date';
        }
    };

    const getTeamMemberById = (id: string): Team | undefined => {
        return mockTeamMembers.find(member => member.id === id);
    };

    // --- رندر View Modes ---
    // Card View
    const renderCardView = () => (
        <Grid container spacing={3}>
            {filteredProjects.map((project) => (
                <Grid item xs={12} sm={6} md={4} key={project.id}>
                    <ProjectCard>
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }} onClick={() => handleOpenProjectDetails(project.id)}>
                                    {project.name}
                                </Typography>
                                <Chip label={project.type} size="small" sx={{ ml: 1, height: 20 }} />
                            </Box>

                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Client: {project.client}
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Chip 
                                    label={project.status} 
                                    color={getStatusChipColor(project.status)} 
                                    size="small" 
                                />
                                <Typography variant="body2">
                                    {formatDate(project.startDate)}
                                    {project.endDate ? ` — ${formatDate(project.endDate)}` : ''}
                                </Typography>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">Progress</Typography>
                                    <Typography variant="body2" color="text.secondary">{project.progress}%</Typography>
                                </Box>
                                <LinearProgress 
                                    variant="determinate" 
                                    value={project.progress} 
                                    sx={{ height: 6, borderRadius: 3 }} 
                                />
                            </Box>

                            {project.team && project.team.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>Team</Typography>
                                    <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                                        {project.team.map(memberId => {
                                            const member = getTeamMemberById(memberId);
                                            return (
                                                <Tooltip title={member?.name || 'Team Member'} key={memberId}>
                                                    <Avatar 
                                                        alt={member?.name} 
                                                        src={member?.avatar} 
                                                        sx={{ width: 28, height: 28 }}
                                                    />
                                                </Tooltip>
                                            );
                                        })}
                                    </AvatarGroup>
                                </Box>
                            )}
                            
                            {project.tasks && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {project.tasks.length} Task{project.tasks.length !== 1 ? 's' : ''}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Chip 
                                            size="small"
                                            label={`${project.tasks.filter(t => t.status === 'Completed').length} Done`}
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                            color="success"
                                            variant="outlined"
                                        />
                                        <Chip 
                                            size="small"
                                            label={`${project.tasks.filter(t => t.status === 'In Progress').length} Active`}
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                            color="info"
                                            variant="outlined"
                                        />
                                        {project.tasks.some(t => t.status === 'Blocked') && (
                                            <Chip 
                                                size="small"
                                                label={`${project.tasks.filter(t => t.status === 'Blocked').length} Blocked`}
                                                sx={{ height: 20, fontSize: '0.7rem' }}
                                                color="error"
                                                variant="outlined"
                                            />
                                        )}
                                    </Box>
                                </Box>
                            )}
                            
                            {project.aiInsights?.warnings && project.aiInsights.warnings.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                                    <WarningAmberIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                                    <Typography variant="caption" color="warning.main">
                                        {project.aiInsights.warnings.length} AI warning{project.aiInsights.warnings.length > 1 ? 's' : ''}
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                        <CardActions>
                            <Button 
                                size="small" 
                                onClick={() => handleOpenProjectDetails(project.id)}
                            >
                                View Details
                            </Button>
                            <IconButton 
                                aria-label="more options" 
                                size="small" 
                                onClick={(e) => handleMenuClick(e, project.id)}
                                sx={{ ml: 'auto' }}
                            >
                                <MoreVertIcon fontSize="small" />
                            </IconButton>
                        </CardActions>
                    </ProjectCard>
                </Grid>
            ))}
        </Grid>
    );

    // Table View
    const renderTableView = () => (
        <TableContainer component={Paper} sx={{ overflow: 'hidden' }}>
            <Table aria-label="projects table">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Project Name</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Progress</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Start Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>End Date</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Team</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredProjects.map((project) => (
                        <TableRow hover key={project.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell component="th" scope="row">
                                <Typography 
                                    variant="body2" 
                                    fontWeight="medium" 
                                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline', color: 'primary.main' }}} 
                                    onClick={() => handleOpenProjectDetails(project.id)}
                                >
                                    {project.name}
                                    {project.aiInsights?.warnings && project.aiInsights.warnings.length > 0 && (
                                        <Tooltip title="This project has AI warnings">
                                            <WarningAmberIcon 
                                                sx={{ ml: 0.5, fontSize: '0.9rem', color: 'warning.main', verticalAlign: 'middle' }} 
                                            />
                                        </Tooltip>
                                    )}
                                </Typography>
                            </TableCell>
                            <TableCell><Typography variant="body2">{project.client}</Typography></TableCell>
                            <TableCell><Chip label={project.type} size="small" /></TableCell>
                            <TableCell>
                                <Chip label={project.status} color={getStatusChipColor(project.status)} size="small" />
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ width: '100%', mr: 1 }}>
                                        <LinearProgress variant="determinate" value={project.progress} sx={{ height: 8, borderRadius: 5 }} />
                                    </Box>
                                    <Box sx={{ minWidth: 35 }}>
                                        <Typography variant="body2" color="text.secondary">{`${project.progress}%`}</Typography>
                                    </Box>
                                </Box>
                            </TableCell>
                            <TableCell><Typography variant="body2">{formatDate(project.startDate)}</Typography></TableCell>
                            <TableCell><Typography variant="body2">{formatDate(project.endDate)}</Typography></TableCell>
                            <TableCell>
                                {project.team && project.team.length > 0 ? (
                                    <AvatarGroup max={3}>
                                        {project.team.map(memberId => {
                                            const member = getTeamMemberById(memberId);
                                            return (
                                                <Tooltip title={member?.name || 'Team Member'} key={memberId}>
                                                    <Avatar 
                                                        alt={member?.name} 
                                                        src={member?.avatar} 
                                                        sx={{ width: 24, height: 24 }}
                                                    />
                                                </Tooltip>
                                            );
                                        })}
                                    </AvatarGroup>
                                ) : (
                                    <Typography variant="body2">-</Typography>
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <IconButton
                                    aria-label="more options"
                                    aria-controls={`project-menu-${project.id}`}
                                    aria-haspopup="true"
                                    onClick={(e) => handleMenuClick(e, project.id)}
                                    size="small"
                                >
                                    <MoreVertIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    // Gantt Chart placeholder
    const renderGanttView = () => (
        <Box sx={{ p: 4, textAlign: 'center', border: `1px dashed ${theme.palette.divider}`, borderRadius: 1 }}>
            <TimelineIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
                Gantt Chart View Coming Soon
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This feature will allow you to visualize project timelines and dependencies.
            </Typography>
        </Box>
    );

    // --- Render Project Details Dialog ---
    const renderProjectDetails = () => (
        <Dialog 
            open={openProjectDetails}
            onClose={() => setOpenProjectDetails(false)}
            maxWidth="md"
            fullWidth
        >
            {selectedProject && (
                <>
                    <DialogTitle sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                {selectedProject.name}
                                <Chip 
                                    label={selectedProject.type} 
                                    size="small" 
                                    sx={{ ml: 1 }} 
                                />
                            </Box>
                            <IconButton onClick={() => setOpenProjectDetails(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Client: {selectedProject.client}
                        </Typography>
                    </DialogTitle>
                    <AppBar position="static" color="default" sx={{ boxShadow: 0 }}>
                        <Tabs 
                            value={activeDetailTab} 
                            onChange={(_, newValue) => setActiveDetailTab(newValue)}
                            indicatorColor="primary"
                            textColor="primary"
                            variant="scrollable"
                            scrollButtons="auto"
                        >
                            <StyledTab label="Overview" icon={<VisibilityIcon />} iconPosition="start" />
                            <StyledTab label="Tasks" icon={<TaskAltIcon />} iconPosition="start" />
                            <StyledTab label="Team" icon={<PeopleAltIcon />} iconPosition="start" />
                            <StyledTab label="Risks" icon={<WarningAmberIcon />} iconPosition="start" />
                            <StyledTab label="AI Insights" icon={<InsightsIcon />} iconPosition="start" />
                        </Tabs>
                    </AppBar>
                    <DialogContent dividers sx={{ p: 3 }}>
                        {/* Overview Tab */}
                        {activeDetailTab === 0 && (
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card variant="outlined" sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Project Information</Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">Status</Typography>
                                                    <Typography variant="body1">
                                                        <Chip 
                                                            label={selectedProject.status} 
                                                            color={getStatusChipColor(selectedProject.status)} 
                                                            size="small" 
                                                            sx={{ mt: 0.5 }}
                                                        />
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">Progress</Typography>
                                                    <Typography variant="body1">{selectedProject.progress}%</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">Start Date</Typography>
                                                    <Typography variant="body1">{formatDate(selectedProject.startDate)}</Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">End Date</Typography>
                                                    <Typography variant="body1">{formatDate(selectedProject.endDate)}</Typography>
                                                </Grid>
                                            </Grid>
                                        </CardContent>
                                    </Card>
                                    
                                    {selectedProject.budget && (
                                        <Card variant="outlined" sx={{ mb: 3 }}>
                                            <CardContent>
                                                <Typography variant="h6" gutterBottom>Budget</Typography>
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">Estimated</Typography>
                                                        <Typography variant="body1">
                                                            {selectedProject.budget.currency} {selectedProject.budget.estimated.toLocaleString()}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="text.secondary">Actual to date</Typography>
                                                        <Typography variant="body1">
                                                            {selectedProject.budget.currency} {selectedProject.budget.actual.toLocaleString()}
                                                        </Typography>
                                                    </Grid>
                                                    <Grid item xs={12}>
                                                        <Box sx={{ mt: 1 }}>
                                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                                Budget Usage
                                                            </Typography>
                                                            <LinearProgress 
                                                                variant="determinate" 
                                                                value={(selectedProject.budget.actual / selectedProject.budget.estimated) * 100} 
                                                                sx={{ height: 8, borderRadius: 3 }} 
                                                                color={selectedProject.budget.actual > selectedProject.budget.estimated ? "error" : "primary"}
                                                            />
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, textAlign: 'right' }}>
                                                                {Math.round((selectedProject.budget.actual / selectedProject.budget.estimated) * 100)}%
                                                            </Typography>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </CardContent>
                                        </Card>
                                    )}
                                    
                                    <Card variant="outlined">
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>Description</Typography>
                                            <Typography variant="body2">
                                                {selectedProject.description || "No description provided"}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                
                                <Grid item xs={12} md={6}>
                                    {/* Task Summary */}
                                    <Card variant="outlined" sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="h6">Task Summary</Typography>
                                                <Button 
                                                    size="small" 
                                                    onClick={() => setActiveDetailTab(1)} 
                                                    endIcon={<ExpandMoreIcon />}
                                                >
                                                    View All
                                                </Button>
                                            </Box>
                                            
                                            {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                                                <List dense disablePadding>
                                                    {selectedProject.tasks.slice(0, 3).map(task => (
                                                        <ListItem key={task.id} disablePadding sx={{ py: 0.5 }}>
                                                            <ListItemIcon sx={{ minWidth: 36 }}>
                                                                {getTaskStatusIcon(task.status)}
                                                            </ListItemIcon>
                                                            <ListItemText 
                                                                primary={task.title} 
                                                                secondary={task.progress === 100 ? 'Completed' : `${task.progress}% complete`}
                                                            />
                                                        </ListItem>
                                                    ))}
                                                </List>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    No tasks defined
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                    
                                    {/* Top Risks */}
                                    <Card variant="outlined" sx={{ mb: 3 }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="h6">Top Risks</Typography>
                                                <Button 
                                                    size="small" 
                                                    onClick={() => setActiveDetailTab(3)} 
                                                    endIcon={<ExpandMoreIcon />}
                                                >
                                                    View All
                                                </Button>
                                            </Box>
                                            
                                            {selectedProject.risks && selectedProject.risks.length > 0 ? (
                                                <List dense disablePadding>
                                                    {selectedProject.risks.filter(risk => risk.status === 'Open').slice(0, 2).map(risk => {
                                                        const severity = getRiskSeverity(risk.probability, risk.impact);
                                                        return (
                                                            <ListItem key={risk.id} disablePadding sx={{ py: 0.5 }}>
                                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                                    <WarningAmberIcon color={getRiskSeverityColor(severity)} />
                                                                </ListItemIcon>
                                                                <ListItemText 
                                                                    primary={risk.title} 
                                                                    secondary={`${risk.probability} probability, ${risk.impact} impact`}
                                                                />
                                                            </ListItem>
                                                        );
                                                    })}
                                                </List>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    No risks identified
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                    
                                    {/* AI Insights */}
                                    {selectedProject.aiInsights && (
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <Typography variant="h6" sx={{ mr: 1 }}>AI Insights</Typography>
                                                        {selectedProject.aiInsights.predictionAccuracy && (
                                                            <Tooltip title="AI Prediction Accuracy">
                                                                <Chip 
                                                                    label={`${selectedProject.aiInsights.predictionAccuracy}% accuracy`}
                                                                    size="small"
                                                                    color="primary"
                                                                    variant="outlined"
                                                                />
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                    <Button 
                                                        size="small" 
                                                        onClick={() => setActiveDetailTab(4)} 
                                                        endIcon={<ExpandMoreIcon />}
                                                    >
                                                        View All
                                                    </Button>
                                                </Box>
                                                
                                                {selectedProject.aiInsights.recommendations && selectedProject.aiInsights.recommendations.length > 0 && (
                                                    <Box sx={{ mt: 2, display: 'flex', mb: 1 }}>
                                                        <LightbulbIcon color="primary" sx={{ mr: 1.5 }} />
                                                        <Typography variant="body2">
                                                            {selectedProject.aiInsights.recommendations[0]}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                
                                                {selectedProject.aiInsights.warnings && selectedProject.aiInsights.warnings.length > 0 && (
                                                    <Box sx={{ display: 'flex' }}>
                                                        <WarningAmberIcon color="warning" sx={{ mr: 1.5 }} />
                                                        <Typography variant="body2">
                                                            {selectedProject.aiInsights.warnings[0]}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}
                                </Grid>
                            </Grid>
                        )}
                        
                        {/* Tasks Tab */}
                        {activeDetailTab === 1 && (
                            <>
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">
                                        Project Tasks
                                        {selectedProject.tasks && (
                                            <Chip 
                                                label={`${selectedProject.tasks.length} task${selectedProject.tasks.length !== 1 ? 's' : ''}`}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<AddIcon />}
                                        size="small"
                                    >
                                        Add Task
                                    </Button>
                                </Box>
                                
                                {selectedProject.tasks && selectedProject.tasks.length > 0 ? (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Task Name</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Priority</TableCell>
                                                    <TableCell>Progress</TableCell>
                                                    <TableCell>Due Date</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedProject.tasks.map(task => (
                                                    <TableRow key={task.id} hover>
                                                        <TableCell>
                                                            <Typography variant="body2">{task.title}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{task.description}</Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={task.status} 
                                                                size="small" 
                                                                color={getTaskStatusColor(task.status)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                label={task.priority} 
                                                                size="small"
                                                                color={task.priority === 'High' ? 'error' : task.priority === 'Medium' ? 'warning' : 'default'}
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', width: 120 }}>
                                                                <LinearProgress 
                                                                    variant="determinate" 
                                                                    value={task.progress} 
                                                                    sx={{ height: 6, borderRadius: 3, flexGrow: 1, mr: 1 }}
                                                                />
                                                                <Typography variant="caption">{task.progress}%</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>{formatDate(task.dueDate)}</TableCell>
                                                        <TableCell>
                                                            <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ textAlign: 'center', p: 4, border: `1px dashed ${theme.palette.divider}`, borderRadius: 1 }}>
                                        <TaskAltIcon sx={{ fontSize: '2rem', color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="body1" color="text.secondary">No tasks added yet</Typography>
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<AddIcon />} 
                                            sx={{ mt: 2 }}
                                            size="small"
                                        >
                                            Add First Task
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                        
                        {/* Team Tab */}
                        {activeDetailTab === 2 && (
                            <>
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">
                                        Project Team
                                        {selectedProject.team && (
                                            <Chip 
                                                label={`${selectedProject.team.length} member${selectedProject.team.length !== 1 ? 's' : ''}`}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<AddIcon />}
                                        size="small"
                                    >
                                        Add Team Member
                                    </Button>
                                </Box>
                                
                                {selectedProject.team && selectedProject.team.length > 0 ? (
                                    <Grid container spacing={2}>
                                        {selectedProject.team.map(memberId => {
                                            const member = getTeamMemberById(memberId);
                                            return member && (
                                                <Grid item xs={12} sm={6} md={4} key={memberId}>
                                                    <Card variant="outlined">
                                                        <CardContent sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
                                                            <Avatar 
                                                                src={member.avatar} 
                                                                alt={member.name}
                                                                sx={{ width: 56, height: 56, mr: 2 }}
                                                            />
                                                            <Box>
                                                                <Typography variant="body1" fontWeight="medium">{member.name}</Typography>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {selectedProject.tasks && 
                                                                        `${selectedProject.tasks.filter(t => t.assignee === memberId).length} tasks assigned`}
                                                                </Typography>
                                                            </Box>
                                                        </CardContent>
                                                        <CardActions>
                                                            <Button size="small">View Profile</Button>
                                                            <Button size="small" color="error" sx={{ ml: 'auto' }}>Remove</Button>
                                                        </CardActions>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                ) : (
                                    <Box sx={{ textAlign: 'center', p: 4, border: `1px dashed ${theme.palette.divider}`, borderRadius: 1 }}>
                                        <PeopleAltIcon sx={{ fontSize: '2rem', color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="body1" color="text.secondary">No team members assigned yet</Typography>
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<AddIcon />} 
                                            sx={{ mt: 2 }}
                                            size="small"
                                        >
                                            Add Team Members
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                        
                        {/* Risks Tab */}
                        {activeDetailTab === 3 && (
                            <>
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6">
                                        Project Risks
                                        {selectedProject.risks && (
                                            <Chip 
                                                label={`${selectedProject.risks.length} risk${selectedProject.risks.length !== 1 ? 's' : ''}`}
                                                size="small"
                                                sx={{ ml: 1 }}
                                            />
                                        )}
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<AddIcon />}
                                        size="small"
                                    >
                                        Add Risk
                                    </Button>
                                </Box>
                                
                                {selectedProject.risks && selectedProject.risks.length > 0 ? (
                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Risk</TableCell>
                                                    <TableCell>Status</TableCell>
                                                    <TableCell>Probability</TableCell>
                                                    <TableCell>Impact</TableCell>
                                                    <TableCell>Mitigation Plan</TableCell>
                                                    <TableCell>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedProject.risks.map(risk => {
                                                    const severity = getRiskSeverity(risk.probability, risk.impact);
                                                    return (
                                                        <TableRow key={risk.id} hover>
                                                            <TableCell>
                                                                <Typography variant="body2">{risk.title}</Typography>
                                                                <Typography variant="caption" color="text.secondary">{risk.description}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={risk.status} 
                                                                    size="small" 
                                                                    color={risk.status === 'Mitigated' ? 'success' : risk.status === 'Open' ? 'warning' : 'default'}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={risk.probability} 
                                                                    size="small"
                                                                    color={risk.probability === 'High' ? 'error' : risk.probability === 'Medium' ? 'warning' : 'success'}
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip 
                                                                    label={risk.impact} 
                                                                    size="small"
                                                                    color={risk.impact === 'High' ? 'error' : risk.impact === 'Medium' ? 'warning' : 'success'}
                                                                    variant="outlined"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {risk.mitigation || 'No mitigation plan yet'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ textAlign: 'center', p: 4, border: `1px dashed ${theme.palette.divider}`, borderRadius: 1 }}>
                                        <WarningAmberIcon sx={{ fontSize: '2rem', color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="body1" color="text.secondary">No risks identified yet</Typography>
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<AddIcon />} 
                                            sx={{ mt: 2 }}
                                            size="small"
                                        >
                                            Add Risk
                                        </Button>
                                    </Box>
                                )}
                                
                                <Box sx={{ mt: 3 }}>
                                    <Button
                                        variant="outlined"
                                        startIcon={<BatchPredictionIcon />}
                                        onClick={() => {
                                            setAiQuestion(`Given the project details for "${selectedProject.name}", what are potential risks we might have missed?`);
                                            setAiAssistOpen(true);
                                        }}
                                    >
                                        AI Risk Assessment
                                    </Button>
                                </Box>
                            </>
                        )}
                        
                        {/* AI Insights Tab */}
                        {activeDetailTab === 4 && (
                            <>
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Typography variant="h6" sx={{ mr: 1 }}>AI Project Insights</Typography>
                                        {selectedProject.aiInsights?.predictionAccuracy && (
                                            <Tooltip title="AI Prediction Accuracy">
                                                <Chip 
                                                    label={`${selectedProject.aiInsights.predictionAccuracy}% accuracy`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Tooltip>
                                        )}
                                    </Box>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<InsightsIcon />}
                                        size="small"
                                        onClick={() => requestAIProjectInsights(selectedProject)}
                                    >
                                        Refresh Insights
                                    </Button>
                                </Box>
                                
                                {selectedProject.aiInsights ? (
                                    <Box>
                                        {selectedProject.aiInsights.recommendations && selectedProject.aiInsights.recommendations.length > 0 && (
                                            <Box sx={{ mb: 3 }}>
                                                <Typography variant="subtitle1" gutterBottom>Recommendations</Typography>
                                                {selectedProject.aiInsights.recommendations.map((recommendation, index) => (
                                                    <AIInsightCard key={`rec-${index}`}>
                                                        <LightbulbIcon color="primary" sx={{ fontSize: 24, mr: 2 }} />
                                                        <Typography variant="body1">{recommendation}</Typography>
                                                    </AIInsightCard>
                                                ))}
                                            </Box>
                                        )}
                                        
                                        {selectedProject.aiInsights.warnings && selectedProject.aiInsights.warnings.length > 0 && (
                                            <Box>
                                                <Typography variant="subtitle1" gutterBottom>Warnings & Risks</Typography>
                                                {selectedProject.aiInsights.warnings.map((warning, index) => (
                                                    <AIWarningCard key={`warn-${index}`}>
                                                        <WarningAmberIcon color="warning" sx={{ fontSize: 24, mr: 2 }} />
                                                        <Typography variant="body1">{warning}</Typography>
                                                    </AIWarningCard>
                                                ))}
                                            </Box>
                                        )}
                                        
                                        <Box sx={{ mt: 3 }}>
                                            <Typography variant="subtitle1">Ask AI About This Project</Typography>
                                            <Typography variant="body2" color="text.secondary" paragraph>
                                                Our AI can analyze the project and provide specific insights. Try asking about schedule optimization, 
                                                resource allocation, or technical considerations for {selectedProject.type} projects.
                                            </Typography>
                                            
                                            <Button
                                                variant="contained"
                                                startIcon={<SmartToyIcon />}
                                                onClick={() => setAiAssistOpen(true)}
                                            >
                                                Open AI Assistant
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box sx={{ textAlign: 'center', p: 4, border: `1px dashed ${theme.palette.divider}`, borderRadius: 1 }}>
                                        <InsightsIcon sx={{ fontSize: '2rem', color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="body1" color="text.secondary">No AI insights available</Typography>
                                        <Button 
                                            variant="contained" 
                                            startIcon={<BatchPredictionIcon />} 
                                            sx={{ mt: 2 }}
                                            onClick={() => requestAIProjectInsights(selectedProject)}
                                        >
                                            Generate AI Insights
                                        </Button>
                                    </Box>
                                )}
                            </>
                        )}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, py: 2 }}>
                        {activeDetailTab === 0 && (
                            <Button 
                                startIcon={<EditIcon />} 
                                onClick={handleEditProject}
                                variant="outlined"
                            >
                                Edit Project
                            </Button>
                        )}
                        <Button 
                            onClick={() => setOpenProjectDetails(false)} 
                            color="inherit" 
                            sx={{ ml: 'auto' }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );

    // --- AI Assistant Dialog ---
    const renderAIAssistDialog = () => (
        <Dialog 
            open={aiAssistOpen}
            onClose={() => setAiAssistOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { height: '60vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
                <SmartToyIcon sx={{ mr: 1 }} color="primary" />
                AI Project Assistant
                <IconButton 
                    onClick={() => setAiAssistOpen(false)}
                    sx={{ ml: 'auto' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', p: 3 }}>
                <Paper 
                    variant="outlined" 
                    sx={{ 
                        p: 2, 
                        mb: 3, 
                        bgcolor: theme.palette.background.default,
                        flexGrow: 1,
                        overflow: 'auto'
                    }}
                >
                    {aiResponse ? (
                        <Typography variant="body1">
                            {aiResponse}
                        </Typography>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            {aiLoading ? (
                                <Box>
                                    <CircularProgress size={36} sx={{ mb: 2 }} />
                                    <Typography>Analyzing project data...</Typography>
                                </Box>
                            ) : (
                                <>
                                    <BatchPredictionIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                                    <Typography variant="body1" color="text.secondary">
                                        {selectedProject ? 
                                            `Ask me anything about "${selectedProject.name}" or how to optimize ${selectedProject.type} projects.` : 
                                            'Ask me about project management, HVAC systems, electrical designs, or any engineering challenge.'}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    )}
                </Paper>
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Ask about project scheduling, technical details, or recommendations..."
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        disabled={aiLoading}
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleAIAssistQuestion}
                        disabled={!aiQuestion.trim() || aiLoading}
                    >
                        {aiLoading ? <CircularProgress size={24} /> : 'Ask'}
                    </Button>
                </Box>
                
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mr: 1, alignSelf: 'center' }}>
                        Sample questions:
                    </Typography>
                    {selectedProject?.type === 'HVAC' && (
                        <Chip
                            label="Best practices for HVAC efficiency"
                            size="small"
                            variant="outlined"
                            onClick={() => setAiQuestion("What are the best practices for maximizing HVAC system efficiency?")}
                            icon={<AirIcon fontSize="small" />}
                        />
                    )}
                    <Chip
                        label="Optimize project schedule"
                        size="small"
                        variant="outlined"
                        onClick={() => setAiQuestion("How can we optimize the project schedule to reduce delivery time?")}
                        icon={<AccessTimeIcon fontSize="small" />}
                    />
                    {selectedProject?.type === 'BMS' && (
                        <Chip
                            label="BMS integration standards"
                            size="small"
                            variant="outlined"
                            onClick={() => setAiQuestion("What are the current standards for BMS integration with legacy systems?")}
                            icon={<SettingsIcon fontSize="small" />}
                        />
                    )}
                </Box>
            </DialogContent>
        </Dialog>
    );

    // --- Project Dialog (Create/Edit) ---
    const renderProjectDialog = () => (
        <Dialog open={openProjectDialog} onClose={() => setOpenProjectDialog(false)} maxWidth="md" fullWidth>
            <DialogTitle>
                {projectDialogMode === 'create' ? 'Create New Project' : 'Edit Project'}
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Project Name"
                            name="name"
                            value={newProject.name || ''}
                            onChange={handleInputChange}
                            required
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Client"
                            name="client"
                            value={newProject.client || ''}
                            onChange={handleInputChange}
                            required
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Project Type</InputLabel>
                            <Select
                                name="type"
                                value={newProject.type || 'HVAC'}
                                label="Project Type"
                                onChange={handleSelectChange}
                            >
                                <MenuItem value="HVAC">HVAC</MenuItem>
                                <MenuItem value="Electrical">Electrical</MenuItem>
                                <MenuItem value="Plumbing">Plumbing</MenuItem>
                                <MenuItem value="BMS">BMS</MenuItem>
                                <MenuItem value="Other">Other</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Status</InputLabel>
                            <Select
                                name="status"
                                value={newProject.status || 'Planning'}
                                label="Status"
                                onChange={handleSelectChange}
                            >
                                <MenuItem value="Planning">Planning</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="On Hold">On Hold</MenuItem>
                                <MenuItem value="Completed">Completed</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Start Date"
                                value={newProject.startDate ? dayjs(newProject.startDate) : null}
                                onChange={(date) => handleDateChange('startDate', date)}
                                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="End Date"
                                value={newProject.endDate ? dayjs(newProject.endDate) : null}
                                onChange={(date) => handleDateChange('endDate', date)}
                                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Project Description"
                            name="description"
                            value={newProject.description || ''}
                            onChange={handleInputChange}
                            multiline
                            rows={3}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Team Members</InputLabel>
                            <Select
                                multiple
                                name="team"
                                value={newProject.team || []}
                                label="Team Members"
                                onChange={handleMultiSelectChange}
                                renderValue={(selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {(selected as string[]).map((memberId) => {
                                            const member = getTeamMemberById(memberId);
                                            return member && (
                                                <Chip 
                                                    key={memberId} 
                                                    label={member.name} 
                                                    size="small" 
                                                    avatar={<Avatar alt={member.name} src={member.avatar} />} 
                                                />
                                            );
                                        })}
                                    </Box>
                                )}
                            >
                                {mockTeamMembers.map((member) => (
                                    <MenuItem key={member.id} value={member.id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <Avatar 
                                                alt={member.name} 
                                                src={member.avatar} 
                                                sx={{ width: 24, height: 24, mr: 1 }}
                                            />
                                            {member.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Progress (%)"
                            name="progress"
                            type="number"
                            value={newProject.progress || 0}
                            onChange={handleInputChange}
                            InputProps={{
                                inputProps: { min: 0, max: 100 }
                            }}
                            margin="normal"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="normal" sx={{ mt: 3 }}>
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={Boolean(newProject.aiInsights)}
                                        onChange={(e) => setNewProject(prev => ({
                                            ...prev,
                                            aiInsights: e.target.checked ? {} : undefined
                                        }))}
                                    />
                                }
                                label="Enable AI Insights and Recommendations"
                            />
                        </FormControl>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={() => setOpenProjectDialog(false)} color="inherit">
                    Cancel
                </Button>
                <Button onClick={handleProjectSubmit} variant="contained">
                    {projectDialogMode === 'create' ? 'Create Project' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );

    // --- Delete Confirmation Dialog ---
    const renderDeleteDialog = () => (
        <Dialog
            open={openDeleteConfirm}
            onClose={() => setOpenDeleteConfirm(false)}
        >
            <DialogTitle>Delete Project</DialogTitle>
            <DialogContent>
                <Typography>
                    Are you sure you want to delete this project? This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenDeleteConfirm(false)} color="inherit">Cancel</Button>
                <Button onClick={handleDeleteProject} color="error" variant="contained">Delete</Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Box sx={{ flexGrow: 1, pb: 4 }}>
            {/* Header */}
            <PageHeader>
                <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                    <FolderIcon sx={{ mr: 1.5, fontSize: '2.5rem' }} /> Project Management
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SearchBox sx={{ mr: 1, display: 'flex', alignItems: 'center', bgcolor: 'background.paper', px: 1, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
                        <SearchIcon sx={{ color: 'text.secondary', mr: 0.5 }} />
                        <TextField 
                            placeholder="Search projects..." 
                            variant="standard"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                disableUnderline: true,
                            }}
                            sx={{ width: { xs: 120, sm: 200 } }}
                        />
                    </SearchBox>
                    
                    <ViewToggleContainer>
                        <Tooltip title="Card View">
                            <IconButton 
                                size="small"
                                color={viewMode === 'card' ? 'primary' : 'default'}
                                onClick={() => setViewMode('card')}
                            >
                                <GridViewIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Table View">
                            <IconButton 
                                size="small"
                                color={viewMode === 'table' ? 'primary' : 'default'}
                                onClick={() => setViewMode('table')}
                            >
                                <TableViewIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Gantt Chart">
                            <IconButton 
                                size="small"
                                color={viewMode === 'gantt' ? 'primary' : 'default'}
                                onClick={() => setViewMode('gantt')}
                            >
                                <TimelineIcon />
                            </IconButton>
                        </Tooltip>
                    </ViewToggleContainer>
                    
                    <Tooltip title="Filter Projects">
                        <IconButton onClick={() => setOpenFilterDialog(true)}>
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleNewProject}
                        sx={{ ml: 1 }}
                    >
                        New Project
                    </Button>
                </Box>
            </PageHeader>

            {/* AI Insights Panel */}
            <Paper 
                elevation={0} 
                variant="outlined" 
                sx={{ 
                    p: 2, 
                    mb: 3, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    bgcolor: alpha(theme.palette.primary.main, 0.04)
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BatchPredictionIcon color="primary" sx={{ mr: 2 }} />
                    <Box>
                        <Typography variant="subtitle1">AI-Powered Project Management</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Get insights, risk assessments, and optimization recommendations for your engineering projects.
                        </Typography>
                    </Box>
                </Box>
                <Button 
                    variant="outlined" 
                    startIcon={<SmartToyIcon />}
                    onClick={() => setAiAssistOpen(true)}
                >
                    Open AI Assistant
                </Button>
            </Paper>

            {/* Content Area */}
            {filteredProjects.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>No projects found</Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {searchTerm ? 'Try adjusting your search terms' : 'Start by creating your first project'}
                    </Typography>
                    {!searchTerm && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleNewProject}
                            sx={{ mt: 1 }}
                        >
                            Create Project
                        </Button>
                    )}
                </Paper>
            ) : (
                <Box sx={{ mt: 2 }}>
                    {viewMode === 'card' && renderCardView()}
                    {viewMode === 'table' && renderTableView()}
                    {viewMode === 'gantt' && renderGanttView()}
                </Box>
            )}
            
            {/* Project Menu */}
            <Menu
                id={`project-menu-${selectedProjectId}`}
                anchorEl={anchorEl}
                open={Boolean(anchorEl && selectedProjectId)}
                onClose={handleMenuClose}
                MenuListProps={{ 'aria-labelledby': 'basic-button' }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={handleViewProject}><VisibilityIcon fontSize="small" sx={{ mr: 1 }}/> View Details</MenuItem>
                <MenuItem onClick={handleEditProject}><EditIcon fontSize="small" sx={{ mr: 1 }}/> Edit Project</MenuItem>
                <MenuItem onClick={handleOpenDeleteConfirm} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" sx={{ mr: 1 }}/> Delete Project</MenuItem>
            </Menu>

            {/* Dialogs */}
            {renderProjectDialog()}
            {renderDeleteDialog()}
            {renderProjectDetails()}
            {renderAIAssistDialog()}
            
            {/* Snackbar for notifications */}
            <Snackbar 
                open={Boolean(snackMessage)} 
                autoHideDuration={5000}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                onClose={() => setSnackMessage(null)}
            >
                <Alert 
                    onClose={() => setSnackMessage(null)} 
                    severity={snackMessage?.type || 'info'} 
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackMessage?.message || ''}
                </Alert>
            </Snackbar>
            
            {/* Floating Action Button for AI Assistant */}
            <Fab 
                color="primary" 
                aria-label="ai-assistant"
                sx={{ position: 'fixed', bottom: 32, right: 32, boxShadow: 3 }}
                onClick={() => setAiAssistOpen(true)}
            >
                <SmartToyIcon />
            </Fab>
        </Box>
    );
};

export default ProjectManagement;