// src/services/MockChatService.ts
// بدون استفاده از uuid

// تولید یک ID تصادفی (جایگزین uuid)
function generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15) + 
           Date.now().toString(36);
  }
  
  export interface ChatMessage {
    sender: 'user' | 'ai';
    content: string;
    timestamp: string;
  }
  
  export interface ChatItem {
    _id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
  }
  
  // ذخیره‌سازی چت‌ها در localStorage
  const STORAGE_KEY = 'mock_chat_data';
  
  // کلاس سرویس مجازی چت
  class MockChatService {
    private chats: ChatItem[] = [];
    
    constructor() {
      // بارگیری چت‌های قبلی از localStorage
      this.loadChats();
    }
    
    // ذخیره‌سازی چت‌ها در localStorage
    private saveChats() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.chats));
    }
    
    // بارگیری چت‌ها از localStorage
    private loadChats() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.chats = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error loading chats from localStorage:', error);
        this.chats = [];
      }
    }
    
    // دریافت لیست چت‌ها
    async getChatList(): Promise<ChatItem[]> {
      console.log('[MockAPI] Fetching chat list');
      // تاخیر مصنوعی برای شبیه‌سازی شبکه
      await this.delay(300);
      return [...this.chats];
    }
    
    // دریافت یک چت با ID
    async getChat(chatId: string): Promise<ChatItem> {
      console.log(`[MockAPI] Fetching chat ${chatId}`);
      await this.delay(300);
      
      const chat = this.chats.find(c => c._id === chatId);
      if (!chat) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      return { ...chat };
    }
    
    // ایجاد چت جدید
    async createChat(title?: string): Promise<ChatItem> {
      console.log(`[MockAPI] Creating new chat with title: ${title}`);
      await this.delay(400);
      
      const newChat: ChatItem = {
        _id: generateId(), // استفاده از تابع تولید ID
        title: title || 'New Chat',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.chats.unshift(newChat);
      this.saveChats();
      
      return { ...newChat };
    }
    
    // به‌روزرسانی عنوان چت
    async updateChatTitle(chatId: string, title: string): Promise<{ id: string; title: string }> {
      console.log(`[MockAPI] Updating chat ${chatId} title to: ${title}`);
      await this.delay(300);
      
      const chatIndex = this.chats.findIndex(c => c._id === chatId);
      if (chatIndex === -1) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      this.chats[chatIndex].title = title;
      this.chats[chatIndex].updatedAt = new Date().toISOString();
      this.saveChats();
      
      return { id: chatId, title };
    }
    
    // حذف چت
    async deleteChat(chatId: string): Promise<{ message: string; id: string }> {
      console.log(`[MockAPI] Deleting chat ${chatId}`);
      await this.delay(300);
      
      const chatIndex = this.chats.findIndex(c => c._id === chatId);
      if (chatIndex === -1) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      this.chats.splice(chatIndex, 1);
      this.saveChats();
      
      return { message: 'Chat deleted successfully', id: chatId };
    }
    
    // افزودن پیام به چت
    async addMessage(chatId: string, message: { sender: 'user' | 'ai'; content: string }): Promise<any> {
      console.log(`[MockAPI] Adding ${message.sender} message to chat ${chatId}`);
      await this.delay(200);
      
      const chatIndex = this.chats.findIndex(c => c._id === chatId);
      if (chatIndex === -1) {
        throw new Error(`Chat with ID ${chatId} not found`);
      }
      
      const newMessage: ChatMessage = {
        ...message,
        timestamp: new Date().toISOString()
      };
      
      this.chats[chatIndex].messages.push(newMessage);
      this.chats[chatIndex].updatedAt = new Date().toISOString();
      this.saveChats();
      
      return { success: true, message: 'Message added' };
    }
    
    // تاخیر مصنوعی برای شبیه‌سازی شبکه
    private delay(ms: number): Promise<void> {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  }
  
  export default new MockChatService();