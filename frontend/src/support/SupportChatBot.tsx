// بخش‌های اصلاح رنگ‌بندی در فایل SupportChatBot.tsx

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Paper, Typography, TextField, IconButton, 
  Avatar, Tooltip, CircularProgress, Chip, Collapse,
  useTheme, Fade, Zoom
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Send as SendIcon,
  Close as CloseIcon,
  SupportAgent as SupportAgentIcon,
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// آیکون هوش مصنوعی جدید
import ModernAIIcon from '../components/ModernAIIcon';

// استایل‌های اصلاح شده با رنگ‌های خاکستری (بدون رنگ قرمز)
const ChatContainer = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  width: '350px',
  maxWidth: 'calc(100vw - 60px)',
  maxHeight: '600px',
  display: 'flex',
  flexDirection: 'column',
  zIndex: 1000,
  overflow: 'hidden',
  boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
  borderRadius: '16px',
  border: `1px solid ${theme.palette.divider}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  // تغییر رنگ به خاکستری
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(90deg, #424242, #616161)`
    : `linear-gradient(90deg, #9e9e9e, #757575)`,
  color: theme.palette.common.white,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${theme.palette.divider}`,
  cursor: 'grab',
  '&:active': {
    cursor: 'grabbing'
  }
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '400px',
  overflowY: 'auto',
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.background.default 
    : theme.palette.grey[50],
  flexGrow: 1,
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': {
    width: '6px'
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[400],
    borderRadius: '3px'
  }
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  backgroundColor: theme.palette.background.paper
}));

const SystemMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[800] 
    : theme.palette.grey[200],
  borderRadius: '16px',
  marginBottom: theme.spacing(1),
  maxWidth: '85%',
  alignSelf: 'center',
  fontSize: '0.875rem',
  boxShadow: '0px 1px 3px rgba(0,0,0,0.08)'
}));

const UserMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  // تغییر رنگ به خاکستری
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(135deg, #616161, #424242)`
    : `linear-gradient(135deg, #9e9e9e, #757575)`,
  color: theme.palette.common.white,
  borderRadius: '16px 16px 0 16px',
  marginBottom: theme.spacing(1),
  maxWidth: '85%',
  alignSelf: 'flex-end',
  marginRight: theme.spacing(1),
  boxShadow: '0px 2px 5px rgba(0,0,0,0.1)'
}));

const BotMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  backgroundColor: theme.palette.mode === 'dark' 
    ? theme.palette.grey[800] 
    : theme.palette.background.paper,
  borderRadius: '16px 16px 16px 0',
  marginBottom: theme.spacing(1),
  maxWidth: '85%',
  alignSelf: 'flex-start',
  marginLeft: theme.spacing(1),
  boxShadow: '0px 2px 5px rgba(0,0,0,0.05)',
  border: `1px solid ${theme.palette.divider}`
}));

const ChatButton = styled(motion.div)(({ theme }) => ({
  position: 'fixed',
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  // تغییر رنگ به خاکستری
  backgroundColor: theme.palette.mode === 'dark' ? '#616161' : '#9e9e9e',
  color: theme.palette.common.white,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)',
  cursor: 'pointer',
  zIndex: 1000,
  isolation: 'isolate',
  '&:before': {
    content: '""',
    position: 'absolute',
    inset: '-5px',
    borderRadius: '50%',
    background: `radial-gradient(circle at center, ${theme.palette.background.paper}, transparent)`,
    opacity: 0.6,
    zIndex: -1,
    transition: 'opacity 0.3s ease'
  },
  '&:hover:before': {
    opacity: 1
  }
}));

// باقی کد بدون تغییر حفظ می‌شود
// ...

// Message type definition
interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
}

// FAQ items
const FAQ_ITEMS = [
  {
    question: "How do I renew my subscription?",
    answer: "To renew your subscription, go to your Account page and select Renew from the Subscriptions section."
  },
  {
    question: "Can I cancel my subscription?",
    answer: "Yes, you can cancel your subscription anytime from your Account page. You'll continue to have access to services until the end of your current billing period."
  },
  {
    question: "How can I reset my password?",
    answer: "On the login page, click 'Forgot Password' and enter your email address. We'll send you a link to reset your password."
  },
  {
    question: "What refrigerants do you support?",
    answer: "We support a wide range of refrigerants including Ammonia, CO2, R-134a, R-410A, R-22, R-404A, and many others in our HVAC calculations and diagrams."
  }
];

interface SupportChatBotProps {
  onClose?: () => void;
}

const SupportChatBot: React.FC<SupportChatBotProps> = ({ onClose }) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFAQ, setShowFAQ] = useState<boolean>(true);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  
  // Position state for dragging both chat window and button
  const [chatPosition, setChatPosition] = useState(() => {
    // Set initial position to bottom right but not covering buttons
    const x = window.innerWidth - 380; 
    const y = window.innerHeight - 550;
    return { x: Math.max(0, x), y: Math.max(0, y) };
  });
  
  const [buttonPosition, setButtonPosition] = useState(() => {
    // Position the button in the bottom right
    return { x: window.innerWidth - 80, y: window.innerHeight - 80 };
  });
  
  // State for tracking dragging
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const [isDraggingButton, setIsDraggingButton] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Animation variants for messages
  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
  };

  useEffect(() => {
    // Show welcome message when chat opens
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: `system-${Date.now()}`,
          sender: 'system',
          content: 'Welcome to Cool-Assist Support. How can we help you today?',
          timestamp: new Date()
        }
      ]);
    }
    
    // Scroll to the latest message
    scrollToBottom();
  }, [isOpen, messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };
  
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };
  
  const sendMessage = async () => {
    if (inputMessage.trim() === '') return;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    
    try {
      // API request to chatbot
      const response = await axios.post('/api/support-chat', {
        message: inputMessage,
      });
      
      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        content: response.data.text || "Sorry, I'm unable to respond at the moment. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Support chat error:', error);
      
      // Error message
      const errorMessage: Message = {
        id: `system-${Date.now()}`,
        sender: 'system',
        content: "Sorry, there was a problem connecting to the server. Please try again later.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFAQClick = (question: string, answer: string) => {
    // Add question as user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: question,
      timestamp: new Date()
    };
    
    // Add answer as bot message
    const botMessage: Message = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      content: answer,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage, botMessage]);
    setShowFAQ(false);
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Handlers for drag operations
  const handleStartChatDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingChat(true);
    setDragOffset({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y
    });
    document.body.style.userSelect = 'none';
  };

  const handleStartButtonDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent toggling the chat when starting drag
    setIsDraggingButton(true);
    setDragOffset({
      x: e.clientX - buttonPosition.x,
      y: e.clientY - buttonPosition.y
    });
    document.body.style.userSelect = 'none';
  };
  
  // UseEffect for handling mouse move/up events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingChat) {
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        setChatPosition({
          x: Math.max(0, Math.min(window.innerWidth - 350, x)),
          y: Math.max(0, Math.min(window.innerHeight - 400, y))
        });
      } else if (isDraggingButton) {
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        setButtonPosition({
          x: Math.max(10, Math.min(window.innerWidth - 70, x)),
          y: Math.max(10, Math.min(window.innerHeight - 70, y))
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDraggingChat(false);
      setIsDraggingButton(false);
      document.body.style.userSelect = '';
    };
    
    if (isDraggingChat || isDraggingButton) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDraggingChat, isDraggingButton, dragOffset, chatPosition, buttonPosition]);

  // Show chat button when closed
  if (!isOpen) {
    return (
      <ChatButton
        style={{
          position: 'fixed',
          left: buttonPosition.x,
          top: buttonPosition.y,
          zIndex: 1000,
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
        whileTap={{ scale: 0.95 }}
        onMouseDown={handleStartButtonDrag}
        onClick={() => !isDraggingButton && toggleChat()}
        transition={{ duration: 0.3 }}
      >
        <Tooltip title="Support Chat">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <SupportAgentIcon fontSize="large" />
          </Box>
        </Tooltip>
      </ChatButton>
    );
  }
  
  return (
    <AnimatePresence>
      <motion.div
        key="chat-container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <ChatContainer
          elevation={5}
          style={{
            position: 'fixed',
            left: chatPosition.x,
            top: chatPosition.y,
            zIndex: 1100,
            cursor: isDraggingChat ? 'grabbing' : 'auto',
          }}
        >
          <ChatHeader 
            onMouseDown={handleStartChatDrag}
            sx={{ cursor: isDraggingChat ? 'grabbing' : 'grab' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <DragIndicatorIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
              <Avatar 
                sx={{ 
                  bgcolor: theme.palette.secondary.main,
                  mr: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <SupportAgentIcon fontSize="small" />
              </Avatar>
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                Cool-Assist Support
              </Typography>
            </Box>
            <IconButton 
              color="inherit" 
              onClick={handleClose} 
              aria-label="Close"
              sx={{ 
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                } 
              }}
            >
              <CloseIcon />
            </IconButton>
          </ChatHeader>
          
          <MessagesContainer>
            <AnimatePresence>
              {messages.map((message) => {
                if (message.sender === 'user') {
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }} key={message.id}>
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={messageVariants}
                        style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}
                      >
                        <UserMessage>
                          <Typography variant="body2">{message.content}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.5, opacity: 0.7 }}>
                            {formatTime(message.timestamp)}
                          </Typography>
                        </UserMessage>
                      </motion.div>
                    </Box>
                  );
                } else if (message.sender === 'bot') {
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }} key={message.id}>
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={messageVariants}
                        style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}
                      >
                        <BotMessage>
                          <Typography variant="body2">{message.content}</Typography>
                          <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                            {formatTime(message.timestamp)}
                          </Typography>
                        </BotMessage>
                      </motion.div>
                    </Box>
                  );
                } else {
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'center' }} key={message.id}>
                      <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={messageVariants}
                      >
                        <SystemMessage>
                          <Typography variant="body2" align="center">
                            {message.content}
                          </Typography>
                        </SystemMessage>
                      </motion.div>
                    </Box>
                  );
                }
              })}
            </AnimatePresence>
            
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ModernAIIcon size={24} isActive={true} />
                    <CircularProgress size={16} color="primary" />
                  </Box>
                </motion.div>
              </Box>
            )}
            
            {messages.length > 0 && showFAQ && (
              <Box sx={{ mt: 2, mb: 1 }}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      mb: 1, 
                      cursor: 'pointer',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(25, 118, 210, 0.05)',
                      p: 1,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(25, 118, 210, 0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setShowFAQ(!showFAQ)}
                    component={motion.div}
                    whileHover={{ 
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(25, 118, 210, 0.08)',
                      scale: 1.01
                    }}
                  >
                    <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 500 }}>
                      Frequently Asked Questions
                    </Typography>
                    {showFAQ ? <ArrowDropUpIcon color="primary" /> : <ArrowDropDownIcon color="primary" />}
                  </Box>
                </motion.div>
                <Collapse in={showFAQ}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {FAQ_ITEMS.map((faq, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.3 }}
                      >
                        <Chip 
                          label={faq.question}
                          onClick={() => handleFAQClick(faq.question, faq.answer)}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ 
                            mb: 1,
                            '&:hover': {
                              bgcolor: 'rgba(25, 118, 210, 0.1)',
                              borderColor: 'primary.main',
                              transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.2s ease'
                          }}
                        />
                      </motion.div>
                    ))}
                  </Box>
                </Collapse>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </MessagesContainer>
          
          <InputContainer>
            <TextField
              fullWidth
              placeholder="Type your message..."
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              variant="outlined"
              size="small"
              autoComplete="off"
              sx={{ 
                mr: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  '&.Mui-focused': {
                    boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`
                  }
                } 
              }}
            />
            <IconButton 
              color="primary" 
              onClick={sendMessage} 
              disabled={inputMessage.trim() === '' || loading}
              aria-label="Send message"
              sx={{
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.08)' 
                    : theme.palette.primary.light + '40',
                  transform: 'scale(1.05)'
                },
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
              component={motion.button}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <SendIcon />
            </IconButton>
          </InputContainer>
        </ChatContainer>
      </motion.div>
    </AnimatePresence>
  );
};

export default SupportChatBot;