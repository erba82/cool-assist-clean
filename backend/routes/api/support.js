/**
 * API های مربوط به چت پشتیبانی
 */

const express = require('express');
const router = express.Router();
const { generateGeminiResponse } = require('../../services/ai.service');
const authMiddleware = require('../../middleware/auth');
const SupportChat = require('../../models/SupportChat');

// پرامپت پایه برای چت بات پشتیبانی
const SUPPORT_BASE_PROMPT = `
شما یک دستیار پشتیبانی هوشمند برای اپلیکیشن "کول اسیست" هستید.
کول اسیست یک اپلیکیشن مبتنی بر هوش مصنوعی برای متخصصان HVAC و الکتریکال است.

وظیفه شما:
1. پاسخگویی به سوالات کاربران در مورد نحوه استفاده از اپلیکیشن
2. راهنمایی در مورد اشتراک‌ها و پلن‌های پرداختی
3. رفع مشکلات فنی رایج
4. ارجاع به پشتیبانی انسانی در صورت نیاز

پلن‌های اشتراکی:
- پایه (رایگان): دسترسی محدود، 10 پرسش روزانه
- استاندارد (ماهانه 99,000 تومان): دسترسی به تمام ابزارها، 100 پرسش روزانه
- حرفه‌ای (ماهانه 299,000 تومان): امکانات پیشرفته، پرسش نامحدود

ویژگی‌های اصلی اپلیکیشن:
- چت هوش مصنوعی برای مشاوره فنی
- محاسبه بار سرمایش و گرمایش
- طراحی مدارهای PLC
- تولید دیاگرام‌های فنی
- جستجوی اطلاعات فنی
- مدیریت پروژه‌های HVAC
- ویژگی‌های عیب‌یابی تجهیزات

پاسخ‌های شما باید:
- مختصر و مفید باشد
- به سوال دقیقا پاسخ دهد
- لحنی دوستانه و کمک‌کننده داشته باشد
- هرگز اطلاعات غلط ندهد
- اگر پاسخ سوالی را نمی‌دانید، صادقانه بگویید و پیشنهاد کنید کاربر با پشتیبانی انسانی تماس بگیرد

پاسخ خود را به زبان فارسی ارائه دهید.
`;

// API پرسش از چت بات پشتیبانی
router.post('/', authMiddleware, async (req, res) => {
    const { message, chatId } = req.body;
    const userId = req.user.id; // Use req.user.id instead of req.user._id for demo mode

    if (!message) {
        return res.status(400).json({ error: 'پیام مورد نیاز است' });
    }

    // TEMPORARY: Database-independent support chat implementation
    let currentChat;
    try {
        // یافتن یا ایجاد چت جدید (demo mode)
        if (chatId) {
            currentChat = {
                _id: chatId,
                user: userId,
                messages: [] // Start fresh in demo mode for simplicity
            };
        } else {
            currentChat = {
                _id: 'demo-support-chat-' + Date.now(),
                user: userId,
                messages: []
            };
        }

        // اضافه کردن پیام کاربر به تاریخچه چت (demo mode)
        currentChat.messages.push({
            sender: 'user',
            content: message,
            timestamp: new Date()
        });

        // آماده‌سازی تاریخچه گفتگو برای هوش مصنوعی
        let chatHistory = [];
        if (currentChat.messages.length > 1) {
            chatHistory = currentChat.messages.slice(-10).map(msg => ({
                sender: msg.sender,
                content: msg.content
            }));
        }

        // ساخت پرامپت کامل با ترکیب پرامپت پایه و پیام کاربر
        const fullPrompt = `${SUPPORT_BASE_PROMPT}\n\nپیام کاربر: ${message}`;
        
        // دریافت پاسخ از سرویس هوش مصنوعی
        const aiResponseText = await generateGeminiResponse(fullPrompt, {
            history: chatHistory
        });

        // اضافه کردن پاسخ به تاریخچه چت (demo mode)
        currentChat.messages.push({
            sender: 'bot',
            content: aiResponseText,
            timestamp: new Date()
        });

        console.log(`Support chat processed in demo mode with ID: ${currentChat._id}`);

        // ارسال پاسخ به کاربر
        res.status(200).json({
            chatId: currentChat._id,
            text: aiResponseText,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Support Chat Error:', error);
        res.status(500).json({ error: 'خطا در پردازش پیام پشتیبانی' });
    }
});

// API دریافت تاریخچه گفتگوی پشتیبانی
router.get('/', authMiddleware, async (req, res) => {
    try {
        // TEMPORARY: Return demo support chats without database
        const demoSupportChats = [
            {
                _id: 'demo-support-chat-1',
                user: req.user.id,
                messages: [
                    {
                        sender: 'user',
                        content: 'سلام، چگونه می‌توانم از قابلیت تولید دیاگرام استفاده کنم؟',
                        timestamp: new Date(Date.now() - 3600000)
                    },
                    {
                        sender: 'bot',
                        content: 'سلام! برای استفاده از قابلیت تولید دیاگرام، از صفحه “تولید خودکار دیاگرام” بازدید کنید و توضیحات سیستم خود را وارد کنید.',
                        timestamp: new Date(Date.now() - 3500000)
                    }
                ],
                createdAt: new Date(Date.now() - 3600000),
                updatedAt: new Date(Date.now() - 3500000)
            }
        ];
        
        console.log(`Retrieved ${demoSupportChats.length} demo support chats for user ${req.user.id}`);
        res.status(200).json(demoSupportChats);
    } catch (error) {
        console.error('Get Support Chats Error:', error);
        res.status(500).json({ error: 'خطا در دریافت تاریخچه گفتگوهای پشتیبانی' });
    }
});

// API دریافت گفتگوی پشتیبانی مشخص
router.get('/:chatId', authMiddleware, async (req, res) => {
    try {
        // TEMPORARY: Return demo support chat without database
        const demoSupportChat = {
            _id: req.params.chatId,
            user: req.user.id,
            messages: [
                {
                    sender: 'user',
                    content: 'سلام، چگونه می‌توانم از قابلیت تولید دیاگرام استفاده کنم؟',
                    timestamp: new Date(Date.now() - 3600000)
                },
                {
                    sender: 'bot',
                    content: 'سلام! برای استفاده از قابلیت تولید دیاگرام، از صفحه “تولید خودکار دیاگرام” بازدید کنید و توضیحات سیستم خود را وارد کنید.',
                    timestamp: new Date(Date.now() - 3500000)
                }
            ],
            createdAt: new Date(Date.now() - 3600000),
            updatedAt: new Date(Date.now() - 3500000)
        };

        console.log(`Retrieved demo support chat ${req.params.chatId} for user ${req.user.id}`);
        res.status(200).json(demoSupportChat);
    } catch (error) {
        console.error('Get Support Chat Error:', error);
        res.status(500).json({ error: 'خطا در دریافت گفتگوی پشتیبانی' });
    }
});

module.exports = router;