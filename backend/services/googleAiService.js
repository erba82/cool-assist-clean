// backend/services/googleAiService.js
// Version: 1.0.1 - Ensure dotenv loads before reading API_KEY
// Date: [تاریخ امروز] - [ساعت فعلی]

const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

// --- بارگذاری متغیرهای محیطی از فایل .env در ریشه بک‌اند ---
// این خط باید *قبل* از دسترسی به process.env اجرا شود
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// --------------------------------------------------------

// --- خواندن API Key بعد از اجرای dotenv.config ---
const API_KEY = process.env.GOOGLE_API_KEY;
// -----------------------------------------------
const MODEL_NAME = "gemini-2.0-flash";

// --- بررسی وجود API Key ---
if (!API_KEY) {
    console.warn("------------------------------------------------------------------");
    console.warn("WARNING: GOOGLE_API_KEY is not defined or accessible in .env file!");
    console.warn("         Google AI Service will use mock responses.");
    console.warn("------------------------------------------------------------------");
} else {
    console.log("GOOGLE_API_KEY found in .env."); // لاگ برای تایید پیدا شدن کلید
}

// ... (بقیه کد: safetySettings, generationConfig)

let genAI;
let model;

try {
    if (API_KEY) { // فقط اگر کلید وجود دارد، سرویس را مقداردهی اولیه کن
        genAI = new GoogleGenerativeAI(API_KEY);
        model = genAI.getGenerativeModel({ "gemini-2.0-flash" });
        console.log("Google AI Service initialized successfully with model:", MODEL_NAME);
    } else {
         genAI = null;
         model = null;
         console.log("Google AI Service not initialized due to missing API Key.");
    }
} catch (error) {
     console.error("Error initializing Google AI (check API Key validity):", error);
     genAI = null;
     model = null;
}


// --- تابع اصلی برای تولید پاسخ ---
async function generateGeminiResponse(prompt, capabilityContext = null) {
    // --- بررسی مجدد وجود model ---
    if (!model || !API_KEY) {
        console.log("generateGeminiResponse called but model/API Key is not available. Returning mock response.");
        return "(Mock Response) Google AI is not configured. Please set GOOGLE_API_KEY correctly in .env.";
    }
    // ---------------------------

    try {
        // ... (منطق ساخت finalPrompt بر اساس capability - بدون تغییر)
        let finalPrompt = prompt;
        // ...

        console.log("--- Sending Prompt to Gemini ---");
        console.log(finalPrompt.substring(0, 500) + (finalPrompt.length > 500 ? "..." : "")); // لاگ کردن بخشی از پرامپت
        console.log("-------------------------------");

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        console.log("--- Received Response from Gemini ---");
        // ...
        console.log("------------------------------------");

        return text;

    } catch (error) {
        // ... (مدیریت خطا - بدون تغییر)
        console.error("Error generating response from Google AI:", error);
        return `Error communicating with AI: ${error.message}`;
    }
}

module.exports = { generateGeminiResponse };