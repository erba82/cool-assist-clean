/**
 * مدل چت پشتیبانی
 */

const mongoose = require('mongoose');

const SupportChatSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    messages: [{
        sender: {
            type: String,
            enum: ['user', 'bot', 'admin'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['active', 'resolved', 'transferred'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// به‌روزرسانی خودکار updatedAt
SupportChatSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('SupportChat', SupportChatSchema);