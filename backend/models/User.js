// backend/models/User.js
// Version: 1.0.2
// Date: 2025-04-05 10:45:00

const mongoose = require('mongoose');
// حذف import bcrypt چون ما در auth.js مستقیماً از آن استفاده می‌کنیم

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    // حذف select: false برای اطمینان از دسترسی به پسورد
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// حذف middleware ها و متدهای مربوط به هش کردن پسورد 
// چون ما در auth.js مستقیماً از bcrypt استفاده می‌کنیم

module.exports = mongoose.model('User', UserSchema);