const { GoogleGenerativeAI } = require("@google/generative-ai");

// کلید جدید خود را اینجا جایگزین کنید (نه کلیدی که اینجا فرستادید!)
const apiKey = "AIzaSyBifqZBpw_EvPFU_vksuE-QyRTZpfANgcU";

const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
  try {
    console.log("در حال اتصال به Gemini 1.5 Flash...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Hello! Just reply with 'Works!' if you receive this.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ موفقیت! پاسخ مدل:", text);
  } catch (error) {
    console.error("❌ خطا:", error.message);
    if (error.message.includes("404")) {
        console.log("نکته: مطمئن شوید پکیج @google/generative-ai آپدیت است (که شما انجام دادید).");
    }
  }
}

testConnection();