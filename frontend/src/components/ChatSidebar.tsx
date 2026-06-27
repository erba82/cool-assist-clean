import React, { useState, useEffect } from 'react';
import { 
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  IconButton, CircularProgress, Typography, Divider, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, 
  Drawer, Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import ChatService, { ChatItem } from '../services/ChatService';
import { useLayout } from '../context/LayoutContext';

// تنظیم عرض سایدبار
const SIDEBAR_WIDTH = 280;

const SidebarContainer = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}));

const SidebarHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const ChatList = styled(List)({
  overflow: 'auto',
  flex: 1,
  paddingTop: 0
});

// تعریف props
interface ChatSidebarProps {
  onSelectChat: (chatId: string | null) => void;
  selectedChatId?: string | null;
  onCreateNewChat: () => void;
}

// کامپوننت اصلی
const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  onSelectChat, 
  selectedChatId, 
  onCreateNewChat
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const { mainDrawerWidth, isMainDrawerOpen } = useLayout();
  
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openEditDialog, setOpenEditDialog] = useState<boolean>(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [newChatTitle, setNewChatTitle] = useState<string>('');
  
  // حالت نمایش دراور در موبایل و تبلت
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  
  // در دسکتاپ، وقتی سایدبار اصلی باز است باید دراور به شکل موقتی نمایش داده شود
  const isTemporaryMode = isMobile || isTablet || isMainDrawerOpen;
  
  // دریافت لیست چت‌ها
  const fetchChats = async () => {
    setLoading(true);
    setError(null);
    try {
      const chatList = await ChatService.getChatList();
      setChats(chatList);
      console.log('Fetched chats:', chatList);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
      setError('Failed to load chats. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // بارگذاری اولیه چت‌ها
  useEffect(() => {
    fetchChats();
  }, []);

  // تغییر عنوان چت
  const handleEditChatTitle = async () => {
    try {
      const updatedChat = await ChatService.updateChatTitle(currentChatId, newChatTitle);
      setChats(chats.map(chat => 
        chat._id === currentChatId ? { ...chat, title: updatedChat.title } : chat
      ));
      setOpenEditDialog(false);
      setNewChatTitle('');
    } catch (err) {
      console.error('Failed to update chat title:', err);
      setError('Failed to update chat title. Please try again.');
    }
  };

  // حذف چت
  const handleDeleteChat = async () => {
    try {
      await ChatService.deleteChat(currentChatId);
      setChats(chats.filter(chat => chat._id !== currentChatId));
      setOpenDeleteDialog(false);
      if (selectedChatId === currentChatId) {
        const nextChat = chats.find(chat => chat._id !== currentChatId);
        onSelectChat(nextChat ? nextChat._id : null);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
      setError('Failed to delete chat. Please try again.');
    }
  };

  // باز کردن دیالوگ ویرایش
  const openEditTitleDialog = (chat: ChatItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentChatId(chat._id);
    setNewChatTitle(chat.title);
    setOpenEditDialog(true);
  };

  // باز کردن دیالوگ حذف
  const openConfirmDeleteDialog = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentChatId(chatId);
    setOpenDeleteDialog(true);
  };
  
  // انتخاب چت و بستن دراور در حالت موقت
  const handleChatSelect = (chatId: string) => {
    onSelectChat(chatId);
    if (isTemporaryMode) {
      setDrawerOpen(false);
    }
  };
  
  // مدیریت باز و بسته کردن دراور
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // فرمت تاریخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 30) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // محتوای سایدبار
  const drawerContent = (
    <SidebarContainer>
      <SidebarHeader>
        <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>My Chats</Typography>
        <Box>
          <IconButton color="primary" onClick={onCreateNewChat} title="New Chat" size="small">
            <AddIcon />
          </IconButton>
          {isTemporaryMode && (
            <IconButton onClick={toggleDrawer} size="small">
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>
      </SidebarHeader>

      {/* نمایش خطا */}
      {error && (
        <Box sx={{ p: 2, color: 'error.main' }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* نمایش لودینگ */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={30} />
        </Box>
      ) : chats.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="textSecondary" variant="body2">No chats yet</Typography>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={onCreateNewChat}
            sx={{ mt: 2, textTransform: 'none' }}
            size="small"
          >
            Start a new chat
          </Button>
        </Box>
      ) : (
        /* لیست چت‌ها */
        <ChatList>
          {chats.map((chat) => (
            <React.Fragment key={chat._id}>
              <ListItem 
                button 
                selected={chat._id === selectedChatId}
                onClick={() => handleChatSelect(chat._id)}
                sx={{ pl: 2, pr: 1 }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ChatIcon color={chat._id === selectedChatId ? "primary" : "inherit"} fontSize="small" />
                </ListItemIcon>
                <ListItemText 
                  primary={chat.title} 
                  secondary={formatDate(chat.updatedAt)}
                  primaryTypographyProps={{
                    noWrap: true,
                    style: { maxWidth: '150px' },
                    variant: 'body2'
                  }}
                  secondaryTypographyProps={{
                    variant: 'caption',
                    fontSize: '0.7rem'
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={(e) => openEditTitleDialog(chat, e)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" onClick={(e) => openConfirmDeleteDialog(chat._id, e)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </ChatList>
      )}
    </SidebarContainer>
  );

  // دکمه برای باز کردن دراور در حالت موقت
  const drawerToggleButton = isTemporaryMode ? (
    <Tooltip title="Show Chats">
      <IconButton 
        onClick={toggleDrawer}
        sx={{ 
          position: 'absolute', 
          left: 16, 
          top: 12, 
          bgcolor: 'background.paper',
          boxShadow: 1,
          zIndex: 10
        }}
      >
        <MenuIcon />
      </IconButton>
    </Tooltip>
  ) : null;

  return (
    <>
      {drawerToggleButton}
      
      <Drawer
        variant={isTemporaryMode ? "temporary" : "permanent"}
        open={isTemporaryMode ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* دیالوگ ویرایش عنوان */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Chat Title</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Chat Title"
            type="text"
            fullWidth
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditChatTitle} color="primary">Update</Button>
        </DialogActions>
      </Dialog>

      {/* دیالوگ حذف چت */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Chat</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this chat? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteChat} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatSidebar;