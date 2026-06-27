// backend/models/Chat.js
// Version: 1.0.1
// Date: 2025-04-05 10:35:00

const mongoose = require('mongoose');

// Schema برای هر پیام در مکالمه
const MessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
        enum: ['user', 'ai'], // فقط کاربر یا هوش مصنوعی می تواند فرستنده باشد
    },
    content: {
        type: String,
        required: [true, 'Message content cannot be empty'],
        trim: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, { _id: false }); // _id برای هر پیام در آرایه لازم نیست

// Schema اصلی برای هر مکالمه
const ChatSchema = new mongoose.Schema({
    // تغییر نام از userId به user برای هماهنگی با کد سرور
    user: {
        type: mongoose.Schema.Types.ObjectId, // ارجاع به مدل User
        required: true,
        ref: 'User', // نام مدلی که به آن ارجاع می‌دهد
        index: true, // ایندکس برای جستجوی سریع مکالمات کاربر
    },
    title: {
        type: String,
        trim: true,
        default: 'New Chat', // عنوان پیش‌فرض
    },
    messages: {
        type: [MessageSchema], // آرایه‌ای از پیام‌ها با ساختار بالا
        default: [], // شروع با آرایه خالی
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// --- Middleware برای آپدیت updatedAt قبل از save ---
ChatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // اگر مکالمه جدید است و عنوان پیش‌فرض دارد، شاید بخواهیم از اولین پیام کاربر عنوان بسازیم
  if (this.isNew && this.title === 'New Chat' && this.messages.length > 0 && this.messages[0].sender === 'user') {
       this.title = this.messages[0].content.substring(0, 50) + (this.messages[0].content.length > 50 ? '...' : '');
  }
  next();
});

// --- Middleware برای آپدیت updatedAt قبل از findOneAndUpdate ---
ChatSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

module.exports = mongoose.model('Chat', ChatSchema);