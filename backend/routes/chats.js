// backend/routes/chats.js
// Version: 1.0.1
// Date: 2025-04-05 10:50:55

const express = require('express');
const Chat = require('../models/Chat'); // مدل چت
const authMiddleware = require('../middleware/auth'); // Middleware احراز هویت

const router = express.Router();

// --- میدلور لاگ برای تمام درخواست‌های API چت ---
router.use((req, res, next) => {
  console.log(`Chat Route: ${req.method} ${req.originalUrl} - User: ${req.user?.id || 'Not Auth'}`);
  next();
});

// --- Middleware: تمام روترهای این فایل نیاز به احراز هویت دارند ---
router.use(authMiddleware);

// --- گرفتن لیست مکالمات کاربر ---
// @route   GET /api/chats
// @desc    Get all chats for the logged-in user
// @access  Private
router.get('/', async (req, res) => {
    try {
        // تغییر userId به user مطابق با تغییر در مدل Chat
        const chats = await Chat.find({ user: req.user.id })
                                 .select('title updatedAt createdAt') // فقط فیلدهای لازم برای لیست
                                 .sort({ updatedAt: -1 }); // مرتب سازی بر اساس آخرین آپدیت
        
        console.log(`Retrieved ${chats.length} chats for user ${req.user.id}`);
        res.json(chats);
    } catch (err) {
        console.error('Get Chats Error:', err.message);
        res.status(500).json({ message: 'Server Error fetching chats' });
    }
});

// --- شروع یک مکالمه جدید ---
// @route   POST /api/chats
// @desc    Create a new empty chat
// @access  Private
router.post('/', async (req, res) => {
    try {
        // تغییر userId به user مطابق با تغییر در مدل Chat
        const newChat = new Chat({
            user: req.user.id,
            title: req.body.title || `Chat ${new Date().toLocaleString()}`
        });
        
        const savedChat = await newChat.save();
        console.log(`New chat created with ID: ${savedChat._id} for user ${req.user.id}`);
        res.status(201).json(savedChat); // چت جدید را برمیگردانیم
    } catch (err) {
        console.error('Create Chat Error:', err.message);
        res.status(500).json({ message: 'Server Error creating chat' });
    }
});


// --- گرفتن پیام‌های یک مکالمه خاص ---
// @route   GET /api/chats/:chatId
// @desc    Get all messages for a specific chat
// @access  Private
router.get('/:chatId', async (req, res) => {
    try {
        // تغییر userId به user مطابق با تغییر در مدل Chat
        const chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id });
        
        if (!chat) {
            console.log(`Chat not found: ${req.params.chatId} for user ${req.user.id}`);
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }
        
        console.log(`Retrieved chat ${req.params.chatId} with ${chat.messages.length} messages`);
        res.json(chat); // کل آبجکت چت (شامل پیام ها) را برمیگردانیم
    } catch (err) {
        console.error(`Get Chat Messages Error for ID ${req.params.chatId}:`, err.message);
         if (err.kind === 'ObjectId') { // اگر chatId فرمت درستی نداشت
             return res.status(400).json({ message: 'Invalid Chat ID format' });
         }
        res.status(500).json({ message: 'Server Error fetching chat' });
    }
});

// --- اضافه کردن پیام جدید به مکالمه ---
// @route   POST /api/chats/:chatId/messages
// @desc    Add a new message to a chat
// @access  Private
router.post('/:chatId/messages', async (req, res) => {
     const { sender, content } = req.body;
     if (!sender || !content || !['user', 'ai'].includes(sender)) {
         return res.status(400).json({ message: 'Invalid message format (sender and content required)' });
     }

     try {
        // تغییر userId به user مطابق با تغییر در مدل Chat
        const chat = await Chat.findOneAndUpdate(
            { _id: req.params.chatId, user: req.user.id }, // پیدا کردن چت کاربر
            { 
                $push: { messages: { sender, content, timestamp: new Date() } },
                $set: { updatedAt: new Date() } // آپدیت زمان بروزرسانی
            }, 
            { new: true, runValidators: true } // برگرداندن سند آپدیت شده و اجرای validation ها
        );

        if (!chat) {
            console.log(`Failed to add message: Chat ${req.params.chatId} not found for user ${req.user.id}`);
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }

        console.log(`Added ${sender} message to chat ${req.params.chatId}`);
        res.json(chat.messages[chat.messages.length - 1]); // فقط پیام اضافه شده را برمیگردانیم

    } catch (err) {
        console.error(`Add Message Error to chat ${req.params.chatId}:`, err.message);
        if (err.kind === 'ObjectId') { return res.status(400).json({ message: 'Invalid Chat ID format' }); }
        res.status(500).json({ message: 'Server Error adding message' });
    }
});


// --- ویرایش عنوان مکالمه ---
// @route   PUT /api/chats/:chatId
// @desc    Update chat title
// @access  Private
router.put('/:chatId', async (req, res) => {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required and must be a non-empty string' });
    }

    try {
        // تغییر userId به user مطابق با تغییر در مدل Chat
        const chat = await Chat.findOneAndUpdate(
            { _id: req.params.chatId, user: req.user.id },
            { 
                title: title.trim(),
                updatedAt: new Date() // آپدیت زمان بروزرسانی
            },
            { new: true } // برگرداندن سند آپدیت شده
        );

        if (!chat) {
            console.log(`Failed to update title: Chat ${req.params.chatId} not found for user ${req.user.id}`);
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }
        
        console.log(`Updated title for chat ${req.params.chatId} to: ${title.trim()}`);
        res.json({ id: chat._id, title: chat.title }); // فقط آی‌دی و عنوان جدید را برمیگردانیم

    } catch (err) {
        console.error(`Update Title Error for chat ${req.params.chatId}:`, err.message);
        if (err.kind === 'ObjectId') { return res.status(400).json({ message: 'Invalid Chat ID format' }); }
        res.status(500).json({ message: 'Server Error updating title' });
    }
});

// --- حذف یک مکالمه ---
// @route   DELETE /api/chats/:chatId
// @desc    Delete a chat
// @access  Private
router.delete('/:chatId', async (req, res) => {
    try {
        // تغییر userId به user مطابق با تغییر در مدل Chat
        const chat = await Chat.findOneAndDelete({ _id: req.params.chatId, user: req.user.id });

        if (!chat) {
            console.log(`Failed to delete: Chat ${req.params.chatId} not found for user ${req.user.id}`);
            return res.status(404).json({ message: 'Chat not found or access denied' });
        }
        
        console.log(`Deleted chat ${req.params.chatId}`);
        res.json({ message: 'Chat deleted successfully', id: req.params.chatId });

    } catch (err) {
        console.error(`Delete Chat Error for ID ${req.params.chatId}:`, err.message);
        if (err.kind === 'ObjectId') { return res.status(400).json({ message: 'Invalid Chat ID format' }); }
        res.status(500).json({ message: 'Server Error deleting chat' });
    }
});


module.exports = router;