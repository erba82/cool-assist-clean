// src/services/ChatService.ts
// Enhanced version with deleteChat and other improvements

import axios from 'axios';
import MockChatService from './MockChatService';

// Backend API base URL
// *** Make sure this matches the address and port your backend server is running on ***
const API_BASE_URL = '/api';

// +++ Main change: use real API +++
const USE_MOCK_API = false; // <--- Changed to false
// ++++++++++++++++++++++++++++++++++++++

export interface ChatMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: string; // or Date if server returns Date
}

// This interface should match the data structure returned by the `/chats` API
export interface ChatItem {
  _id: string;
  title: string;
  messages: ChatMessage[]; // Does the API return the full list of messages? If not, this should be optional
  createdAt: string; // or Date
  updatedAt: string; // or Date
  metadata?: { // Added metadata as optional
    capabilities?: string[];
    tags?: string[];
    favorite?: boolean;
  }
}

// Interface for add message response (if your API returns something)
export interface AddMessageResponse {
  // Depending on what your API returns
  // e.g.: message: string; chat?: ChatItem;
  // or just a status 200 OK
  success: boolean; // example
}

// --- Chat Service ---
const ChatService = {

  // Get chat list
  getChatList: async (): Promise<ChatItem[]> => {
    if (USE_MOCK_API) {
      console.warn("Using MOCK API for getChatList");
      return MockChatService.getChatList();
    }

    try {
      console.log(`[API Call] GET ${API_BASE_URL}/chats`);
      // *** Note: Authorization header is automatically added by Axios config in App.tsx ***
      const response = await axios.get<ChatItem[]>(`${API_BASE_URL}/chats`);
      console.log('[API Response] Chat list received:', response.data.length);
      // Simplify data to avoid sending too much (optional)
      // return response.data.map(chat => ({ _id: chat._id, title: chat.title, updatedAt: chat.updatedAt, createdAt: chat.createdAt }));
      return response.data; // Return full data as per interface
    } catch (error) {
      console.error('Error fetching chat list from API:', error);
      // Throw error to be handled in component
      throw error;
    }
  },

  // Get a chat by ID
  getChat: async (chatId: string): Promise<ChatItem> => {
    if (USE_MOCK_API) {
      console.warn(`Using MOCK API for getChat: ${chatId}`);
      return MockChatService.getChat(chatId);
    }

    try {
      console.log(`[API Call] GET ${API_BASE_URL}/chats/${chatId}`);
      const response = await axios.get<ChatItem>(`${API_BASE_URL}/chats/${chatId}`);
      console.log(`[API Response] Chat ${chatId} received.`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching chat ${chatId} from API:`, error);
      throw error;
    }
  },

  // Create new chat
  createChat: async (title?: string): Promise<ChatItem> => {
    if (USE_MOCK_API) {
      console.warn("Using MOCK API for createChat");
      return MockChatService.createChat(title);
    }

    try {
      const payload = title ? { title } : {};
      console.log(`[API Call] POST ${API_BASE_URL}/chats with payload:`, payload);
      const response = await axios.post<ChatItem>(`${API_BASE_URL}/chats`, payload);
      console.log('[API Response] Create chat successful:', response.data._id);
      return response.data;
    } catch (error) {
      console.error('Error creating new chat via API:', error);
      throw error;
    }
  },

  // Update chat title
  // *** Note: Your API in server.js returns the whole updated Chat object, not just id and title ***
  updateChatTitle: async (chatId: string, title: string): Promise<ChatItem> => {
    if (USE_MOCK_API) {
      console.warn(`Using MOCK API for updateChatTitle: ${chatId}`);
      // MockService might return a different format, should be compatible here
      const mockResult = await MockChatService.updateChatTitle(chatId, title);
      // Convert to ChatItem format if needed
      return {
        ...mockResult,
        _id: mockResult.id,
        messages: [], // Add required fields that might not exist in mockResult
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    try {
      console.log(`[API Call] PUT ${API_BASE_URL}/chats/${chatId} with title: ${title}`);
      // Send only title in the body (as per backend API)
      const response = await axios.put<ChatItem>(`${API_BASE_URL}/chats/${chatId}`, { title });
      console.log('[API Response] Update title successful for chat:', response.data._id);
      return response.data; // Return the whole updated Chat object
    } catch (error) {
      console.error(`Error updating chat title for ${chatId} via API:`, error);
      throw error;
    }
  },

  // Delete chat
  // *** Note: Your API returns just a message { message: '...' } ***
  deleteChat: async (chatId: string): Promise<{ message: string }> => {
    if (USE_MOCK_API) {
      console.warn(`Using MOCK API for deleteChat: ${chatId}`);
      // MockService might return a different format
      const mockResult = await MockChatService.deleteChat(chatId);
      return { message: mockResult.message }; // Match real API format
    }

    try {
      console.log(`[API Call] DELETE ${API_BASE_URL}/chats/${chatId}`);
      const response = await axios.delete<{ message: string }>(`${API_BASE_URL}/chats/${chatId}`);
      console.log(`[API Response] Delete chat ${chatId} successful:`, response.data.message);
      return response.data;
    } catch (error) {
      console.error(`Error deleting chat ${chatId} via API:`, error);
      throw error;
    }
  },

  // Add message to chat
  // *** Important Note: The API for adding a message doesn't exist in your server.js! ***
  // You're just directly storing messages in the messages array of the Chat model.
  // To make this function work, you need to create a new API in server.js, e.g.:
  // POST /api/chats/:chatId/messages
  // which receives a new message and adds it to the messages array of that chat.
  addMessage: async (chatId: string, message: { sender: 'user' | 'ai'; content: string }): Promise<AddMessageResponse> => {
    if (USE_MOCK_API) {
      console.warn(`Using MOCK API for addMessage to chat: ${chatId}`);
      return MockChatService.addMessage(chatId, message);
    }

    // +++ Need API Endpoint in backend +++
    const ADD_MESSAGE_ENDPOINT = `${API_BASE_URL}/chats/${chatId}/messages`;
    console.warn(`[API Call] Attempting POST ${ADD_MESSAGE_ENDPOINT}. This endpoint needs to be implemented in the backend!`);

    try {
      // Assuming the backend API is implemented
      const response = await axios.post<AddMessageResponse>(ADD_MESSAGE_ENDPOINT, message);
      console.log(`[API Response] Add message to chat ${chatId} successful:`, response.data);
      return response.data; // Or whatever the API returns
    } catch (error) {
      console.error(`Error adding message to chat ${chatId} via API:`, error);
      console.error(`Please ensure the endpoint POST ${ADD_MESSAGE_ENDPOINT} is implemented in your backend.`);
      // Throw error or return an error response
      // throw error;
      return { success: false }; // Example: return error response
    }
  }
};

export default ChatService;