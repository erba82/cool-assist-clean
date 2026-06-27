/**
 * سرویس هوش مصنوعی
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

// تنظیمات کلیدی
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
let googleAI;
let geminiModel;

// راه‌اندازی سرویس Google AI
function initializeGoogleAI() {
    if (!GOOGLE_API_KEY) {
        console.error("Cannot initialize Google AI: API key is missing");
        return false;
    }

    try {
        googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        geminiModel = googleAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        console.log("Google AI Service initialized successfully with model: gemini-2.0-flash");
        return true;
    } catch (error) {
        console.error("Error initializing Google AI Service:", error);
        return false;
    }
}

// تابع برای تولید پاسخ با Google AI
async function generateGeminiResponse(message, context = {}) {
    if (!geminiModel) {
        if (!initializeGoogleAI()) {
            return "متأسفانه سرویس هوش مصنوعی در حال حاضر در دسترس نیست. لطفاً با مدیر سیستم تماس بگیرید.";
        }
    }

    try {
        // تنظیم پارامترهای تولید متن
        const generationConfig = {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
        };

        // پیام‌های گذشته (در صورت وجود)
        let history = [];
        if (context && context.history && Array.isArray(context.history)) {
            history = context.history.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            }));
        }

        // شروع چت یا استفاده از چت موجود
        let result;
        
        if (history.length > 0) {
            const chat = geminiModel.startChat({
                history: history,
                generationConfig: generationConfig
            });
            
            result = await chat.sendMessage(message);
        } else {
            result = await geminiModel.generateContent(message, generationConfig);
        }

        // استخراج متن پاسخ
        const response = result.response;
        const text = response.text();
        
        return text;
    } catch (error) {
        console.error("Google AI Error:", error);
        return `متأسفانه در پردازش درخواست شما خطایی رخ داد: ${error.message}`;
    }
}

// راه‌اندازی اولیه سرویس هوش مصنوعی
initializeGoogleAI();

module.exports = {
    generateGeminiResponse,
    initializeGoogleAI
};