// backend/routes/auth.js
// Version: 1.0.6 - Fixed password retrieval issue
// Date: 2025-04-05 10:45:00

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
const path = require('path');

// مسیر فایل .env را نسبت به این فایل (auth.js) تعیین می‌کنیم
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const router = express.Router();

// میدلور برای لاگ کردن تمام درخواست‌های احراز هویت
router.use((req, res, next) => {
  console.log(`Auth Route: ${req.method} ${req.originalUrl} - Body:`, 
    req.method === 'POST' ? { ...req.body, password: req.body.password ? '****' : undefined } : 'No Body');
  next();
});

// --- ثبت نام کاربر جدید ---
router.post('/register', async (req, res) => {
  try {
    console.log('Register request received:', { 
      ...req.body, 
      password: req.body.password ? '[MASKED]' : undefined 
    });

    // اطمینان از وجود تمام فیلدهای مورد نیاز
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log('Register validation failed: Missing required fields');
      return res.status(400).json({ message: 'All fields (name, email, password) are required' });
    }

    // بررسی وجود کاربر با همین ایمیل
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log(`Register failed: Email ${email} already exists`);
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // ساخت کاربر جدید
    user = new User({
      name,
      email: email.toLowerCase(),
      password
    });

    // هش کردن پسورد به صورت دستی به جای استفاده از middleware
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    console.log(`Password hashed for ${email}`);

    // ذخیره کاربر در دیتابیس
    await user.save();
    console.log(`User registered successfully: ${email}`);

    // ساخت توکن JWT
    const payload = { userId: user.id };
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not found in environment variables!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    jwt.sign(
      payload, 
      jwtSecret, 
      { expiresIn: jwtExpiresIn }, 
      (err, token) => {
        if (err) {
          console.error('JWT Sign error:', err);
          return res.status(500).json({ message: 'Error generating auth token' });
        }

        // ارسال پاسخ موفقیت‌آمیز با توکن و اطلاعات کاربر
        res.status(201).json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// --- ورود کاربر ---
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received:', { 
      ...req.body, 
      password: req.body.password ? '[MASKED]' : undefined 
    });

    // اطمینان از وجود تمام فیلدهای مورد نیاز
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Login validation failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // ***** تغییر مهم: استفاده از select('+password') *****
    // بررسی وجود کاربر با ایمیل داده شده و بازیابی فیلد password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      console.log(`Login failed: No user found with email ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // لاگ برای دیباگ
    console.log(`Found user for ${email}, has password: ${!!user.password}`);

    // بررسی وجود پسورد
    if (!user.password) {
      console.error(`Login failed: User ${email} has no password set in database`);
      return res.status(400).json({ message: 'Account setup is incomplete. Please contact support.' });
    }

    // استفاده مستقیم از bcrypt به جای متد مدل
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log(`User logged in successfully: ${email}`);

    // ساخت توکن JWT
    const payload = { userId: user.id };
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not found in environment variables!');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    jwt.sign(
      payload, 
      jwtSecret, 
      { expiresIn: jwtExpiresIn }, 
      (err, token) => {
        if (err) {
          console.error('JWT Sign error:', err);
          return res.status(500).json({ message: 'Error generating auth token' });
        }
        
        // ارسال پاسخ موفقیت‌آمیز با توکن و اطلاعات کاربر
        res.status(200).json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;