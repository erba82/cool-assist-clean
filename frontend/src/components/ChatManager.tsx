/*
 * ChatManager.tsx
 * Enhanced chat management with animation and delete functionality
 * Date: 2025-04-27 17:30:00
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, List, ListItem, ListItemText, IconButton, Typography, 
  Divider, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Tooltip, Chip, ListItemSecondaryAction, ListItemButton, Skeleton,
  CircularProgress, Alert, useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FolderIcon from '@mui/icons-material/Folder';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ChatIcon from '@mui/icons-material/Chat';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// Import ChatService
import ChatService, { ChatItem } from '../services/ChatService';

interface ChatManagerProps {
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  selectedChatId?: string | null;
  chats?: ChatItem[];
  loading?: boolean;
}

const ChatManager: React.FC<ChatManagerProps> = ({ 
  onSelectChat, 
  onDeleteChat,
  selectedChatId,
  chats: externalChats,
  loading: externalLoading
}) => {
  const theme = useTheme();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<ChatItem | null>(null);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  
  // Use external chats if provided
  useEffect(() => {
    if (externalChats) {
      setChats(externalChats);
      setLoading(false);
    }
  }, [externalChats]);
  
  // Load chats on mount if no external chats provided
  useEffect(() => {
    if (!externalChats) {
      fetchChats();
    }
  }, [externalChats]);
  
  // Use external loading if provided
  useEffect(() => {
    if (externalLoading !== undefined) {
      setLoading(externalLoading);
    }
  }, [externalLoading]);
  
  // Fetch chats from API
  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const chatList = await ChatService.getChatList();
      setChats(chatList);
      console.log('Fetched chats:', chatList.length);
    } catch (err: any) {
      setError(err.message || 'Failed to load chats');
      console.error('Error fetching chats:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle chat delete
  const handleDeleteChat = (chat: ChatItem) => {
    setChatToDelete(chat);
    setDeleteDialogOpen(true);
  };
  
  // Confirm delete
  const confirmDelete = async () => {
    if (!chatToDelete) return;
    
    setDeleteDialogOpen(false);
    setDeletingChatId(chatToDelete._id);
    
    try {
      await ChatService.deleteChat(chatToDelete._id);
      
      // Remove chat from local state
      setChats(prev => prev.filter(chat => chat._id !== chatToDelete._id));
      
      // Notify parent component
      if (onDeleteChat) {
        onDeleteChat(chatToDelete._id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete chat');
      console.error('Error deleting chat:', err);
    } finally {
      setDeletingChatId(null);
    }
  };
  
  // Navigate to chat
  const navigateToChat = (chatId: string) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    } else {
      window.location.href = `/chat?id=${chatId}`;
    }
  };
  
  // Get tag color
  const getCapabilityColor = (capability: string): 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
    switch(capability) {
      case 'refrigerant':
        return 'primary';
      case 'diagram':
      case 'diagram_generation':
        return 'secondary';
      case 'calculation':
      case 'engineering_calculations':
        return 'success';
      case 'troubleshooting':
        return 'error';
      case 'deep_search':
        return 'info';
      case 'plc_design':
        return 'warning';
      default:
        return 'default' as any;
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ m: 1, mb: 0 }} 
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Skeleton variant="rectangular" height={60} animation="wave" />
            </Box>
          ))}
        </Box>
      ) : chats.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <FolderIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>No Chat History</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Start a new chat to begin</Typography>
          <Button 
            variant="contained" 
            onClick={() => navigateToChat('new')}
            startIcon={<ChatIcon />}
          >
            Start New Chat
          </Button>
        </Box>
      ) : (
        <List sx={{ maxHeight: 'calc(100% - 64px)', overflowY: 'auto', p: 0, flexGrow: 1 }}>
          <AnimatePresence>
            {chats.map((chat) => (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ListItem
                  disablePadding
                  sx={{
                    opacity: deletingChatId === chat._id ? 0.5 : 1,
                    pointerEvents: deletingChatId === chat._id ? 'none' : 'auto',
                  }}
                >
                  <ListItemButton 
                    onClick={() => navigateToChat(chat._id)}
                    selected={selectedChatId === chat._id}
                    sx={{
                      py: 1.5,
                      mx: 1,
                      mb: 0.5,
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      backgroundColor: selectedChatId === chat._id
                        ? theme.palette.mode === 'light'
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(16, 185, 129, 0.12)'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'light' 
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(16, 185, 129, 0.12)'
                      },
                      '&.Mui-selected': {
                        bgcolor: theme.palette.mode === 'light'
                          ? 'rgba(16, 185, 129, 0.08)'
                          : 'rgba(16, 185, 129, 0.12)',
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'light'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(16, 185, 129, 0.16)'
                        }
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: selectedChatId === chat._id ? 600 : 400,
                            color: selectedChatId === chat._id ? '#10b981' : theme.palette.text.primary,
                            maxWidth: '90%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {chat.title || 'Untitled Chat'}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                            <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                          
                          {chat.metadata?.capabilities && chat.metadata.capabilities.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {chat.metadata.capabilities.slice(0, 2).map((capability, index) => (
                                <Chip
                                  key={index}
                                  label={capability}
                                  size="small"
                                  color={getCapabilityColor(capability)}
                                  sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.6rem' } }}
                                />
                              ))}
                              {chat.metadata.capabilities.length > 2 && (
                                <Chip
                                  label={`+${chat.metadata.capabilities.length - 2}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.6rem' } }}
                                />
                              )}
                            </Box>
                          )}
                        </Box>
                      }
                    />
                    <ArrowForwardIcon 
                      fontSize="small" 
                      sx={{ 
                        color: selectedChatId === chat._id ? '#10b981' : 'action.active',
                        transition: 'color 0.2s'
                      }} 
                    />
                  </ListItemButton>
                  
                  <ListItemSecondaryAction sx={{ right: 8 }}>
                    <Tooltip title="Delete chat">
                      <span>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat);
                          }}
                          disabled={deletingChatId === chat._id}
                          sx={{ 
                            color: theme.palette.text.secondary,
                            opacity: deletingChatId === chat._id ? 0.5 : 0.7,
                            '&:hover': {
                              opacity: 1,
                              backgroundColor: theme.palette.mode === 'light'
                                ? 'rgba(0, 0, 0, 0.04)'
                                : 'rgba(255, 255, 255, 0.08)'
                            }
                          }}
                        >
                          {deletingChatId === chat._id ? (
                            <CircularProgress size={18} sx={{ color: theme.palette.text.secondary }} />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Chat?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this chat? This action cannot be undone.
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600 }}>
            "{chatToDelete?.title}"
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatManager;