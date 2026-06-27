import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Paper, TextField, Button, Typography, Avatar,
  IconButton, Divider, CircularProgress, List, ListItem,
  Link, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';

import { AIProvider } from '../services/ai/AIProviderFactory';
import { SearchService, SearchResult } from '../services/search/SearchService';

const ChatContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '600px',
  maxWidth: '1000px',
  margin: '0 auto',
  backgroundColor: theme.palette.background.paper,
}));

const MessagesList = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
}));

const MessageItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(2),
  maxWidth: '80%',
}));

const UserMessage = styled(MessageItem)({
  alignSelf: 'flex-end',
  flexDirection: 'row-reverse',
});

const AIMessage = styled(MessageItem)({
  alignSelf: 'flex-start',
});

const MessageBubble = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5),
  borderRadius: '18px',
  marginLeft: theme.spacing(1),
  marginRight: theme.spacing(1),
  position: 'relative',
}));

const UserBubble = styled(MessageBubble)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderBottomRightRadius: '4px',
}));

const AIBubble = styled(MessageBubble)(({ theme }) => ({
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.primary,
  borderBottomLeftRadius: '4px',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const SearchResultsContainer = styled(Box)(({ theme }) => ({
  maxHeight: '200px',
  overflow: 'auto',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
  borderTop: `1px solid ${theme.palette.divider}`,
}));

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatProps {
  aiProvider: AIProvider;
  searchService: SearchService;
}

const AIChat: React.FC<AIChatProps> = ({ aiProvider, searchService }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-message',
      content: 'Hello! I\'m your Cool-Assist AI. How can I help you with your HVACR or electrical engineering questions today?',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [aiModel, setAIModel] = useState<string>('default');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleSearch = async () => {
    if (!inputText.trim()) return;
    
    setShowSearch(true);
    try {
      const results = await searchService.searchCombined(inputText, 5);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content: inputText,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setShowSearch(false);
    
    try {
      // Get AI response
      const response = await aiProvider.generateResponse(inputText);
      
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: response,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}-ai-error`,
        content: 'Sorry, I encountered an error while processing your request. Please try again later.',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const formatTimestamp = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const selectSearchResult = (result: SearchResult) => {
    setInputText(prev => `${prev} [Referencing: ${result.title}]`);
    setShowSearch(false);
  };

  return (
    <ChatContainer elevation={3}>
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <SmartToyIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Cool-Assist AI</Typography>
        </Box>
        <Box>
          <Chip 
            label={`AI Model: ${aiModel}`} 
            size="small" 
            color="secondary" 
            sx={{ mr: 1 }}
          />
          <IconButton size="small" color="inherit">
            <SettingsIcon />
          </IconButton>
        </Box>
      </Box>

      <MessagesList>
        {messages.map((message) => (
          message.sender === 'user' ? (
            <UserMessage key={message.id}>
              <Avatar sx={{ bgcolor: 'primary.dark' }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <UserBubble>
                  <Typography variant="body1">{message.content}</Typography>
                </UserBubble>
                <Typography variant="caption" sx={{ mr: 2, mt: 0.5, color: 'text.secondary' }}>
                  {formatTimestamp(message.timestamp)}
                </Typography>
              </Box>
            </UserMessage>
          ) : (
            <AIMessage key={message.id}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                <SmartToyIcon />
              </Avatar>
              <Box>
                <AIBubble>
                  <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                </AIBubble>
                <Typography variant="caption" sx={{ ml: 2, mt: 0.5, color: 'text.secondary' }}>
                  {formatTimestamp(message.timestamp)}
                </Typography>
              </Box>
            </AIMessage>
          )
        ))}
        
        {isLoading && (
          <AIMessage>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <SmartToyIcon />
            </Avatar>
            <AIBubble sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">
                Thinking...
              </Typography>
            </AIBubble>
          </AIMessage>
        )}
        <div ref={messagesEndRef} />
      </MessagesList>

      {showSearch && searchResults.length > 0 && (
        <SearchResultsContainer>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Search Results:</Typography>
          <List dense>
            {searchResults.map((result, index) => (
              <ListItem 
                key={index}
                button 
                onClick={() => selectSearchResult(result)}
                sx={{ 
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2">{result.title}</Typography>
                    <Chip 
                      label={result.source} 
                      size="small" 
                      color={result.source === 'database' ? 'primary' : 'secondary'}
                      sx={{ height: 20 }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {result.snippet}
                  </Typography>
                  <Link href={result.url} target="_blank" variant="caption" sx={{ color: 'primary.main' }}>
                    {result.url}
                  </Link>
                </Box>
              </ListItem>
            ))}
          </List>
        </SearchResultsContainer>
      )}

      <InputContainer>
        <IconButton>
          <AttachFileIcon />
        </IconButton>
        <TextField
          fullWidth
          placeholder="Type your message here..."
          variant="outlined"
          value={inputText}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={3}
        />
        <IconButton 
          onClick={handleSearch}
          color={showSearch ? "primary" : "default"}
          sx={{ mx: 0.5 }}
        >
          <SearchIcon />
        </IconButton>
        <Button 
          variant="contained" 
          color="primary"
          endIcon={<SendIcon />}
          onClick={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          Send
        </Button>
      </InputContainer>
    </ChatContainer>
  );
};

export default AIChat;