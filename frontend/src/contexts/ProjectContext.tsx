/**
 * ProjectContext.tsx
 * State management for user projects
 * Stores projects in localStorage with chat history
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types
export interface ChatMessage {
    id: number;
    text?: string;
    sender: 'user' | 'ai';
    type?: 'text' | 'design' | 'recommendations' | 'info_request';
    designData?: any;
    recommendationsData?: any;
    infoRequestData?: any;
    timestamp: number;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
    isPinned: boolean;
    chatHistory: ChatMessage[];
    designData?: any;
    status: 'active' | 'completed' | 'archived';
}

interface ProjectContextType {
    projects: Project[];
    currentProject: Project | null;
    createProject: (name: string, description?: string) => Project;
    deleteProject: (id: string) => void;
    selectProject: (id: string) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    togglePin: (id: string) => void;
    addMessage: (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    clearCurrentProject: () => void;
    pinnedProjects: Project[];
    recentProjects: Project[];
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const STORAGE_KEY = 'cool-assist-projects';

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load projects:', e);
        }
        return [];
    });

    const [currentProject, setCurrentProject] = useState<Project | null>(null);

    // Save to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
        } catch (e) {
            console.error('Failed to save projects:', e);
        }
    }, [projects]);

    // Create new project
    const createProject = useCallback((name: string, description?: string): Project => {
        const newProject: Project = {
            id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name,
            description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isPinned: false,
            chatHistory: [{
                id: 1,
                text: `👋 Hello! I am your HVAC-R Design Assistant.\n\nProject "${name}" has been created. How can I help you?`,
                sender: 'ai',
                type: 'text',
                timestamp: Date.now(),
            }],
            status: 'active',
        };

        setProjects(prev => [newProject, ...prev]);
        setCurrentProject(newProject);
        return newProject;
    }, []);

    // Delete project
    const deleteProject = useCallback((id: string) => {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (currentProject?.id === id) {
            setCurrentProject(null);
        }
    }, [currentProject]);

    // Select project
    const selectProject = useCallback((id: string) => {
        const project = projects.find(p => p.id === id);
        if (project) {
            setCurrentProject(project);
        }
    }, [projects]);

    // Update project
    const updateProject = useCallback((id: string, updates: Partial<Project>) => {
        setProjects(prev => prev.map(p =>
            p.id === id
                ? { ...p, ...updates, updatedAt: Date.now() }
                : p
        ));
        if (currentProject?.id === id) {
            setCurrentProject(prev => prev ? { ...prev, ...updates, updatedAt: Date.now() } : null);
        }
    }, [currentProject]);

    // Toggle pin
    const togglePin = useCallback((id: string) => {
        setProjects(prev => prev.map(p =>
            p.id === id ? { ...p, isPinned: !p.isPinned } : p
        ));
    }, []);

    // Add message to project
    const addMessage = useCallback((projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const newMessage: ChatMessage = {
            ...message,
            id: Date.now(),
            timestamp: Date.now(),
        };

        setProjects(prev => prev.map(p =>
            p.id === projectId
                ? { ...p, chatHistory: [...p.chatHistory, newMessage], updatedAt: Date.now() }
                : p
        ));

        if (currentProject?.id === projectId) {
            setCurrentProject(prev => prev ? {
                ...prev,
                chatHistory: [...prev.chatHistory, newMessage],
                updatedAt: Date.now(),
            } : null);
        }
    }, [currentProject]);

    // Clear current project
    const clearCurrentProject = useCallback(() => {
        setCurrentProject(null);
    }, []);

    // Computed values
    const pinnedProjects = projects.filter(p => p.isPinned).sort((a, b) => b.updatedAt - a.updatedAt);
    const recentProjects = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

    return (
        <ProjectContext.Provider value={{
            projects,
            currentProject,
            createProject,
            deleteProject,
            selectProject,
            updateProject,
            togglePin,
            addMessage,
            clearCurrentProject,
            pinnedProjects,
            recentProjects,
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjects = (): ProjectContextType => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};

export default ProjectContext;

