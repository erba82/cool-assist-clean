const { GoogleGenerativeAI } = require("@google/generative-ai");

// کلید شما
const apiKey = "AIzaSyBifqZBpw_EvPFU_vksuE-QyRTZpfANgcU";

const genAI = new GoogleGenerativeAI(apiKey);

async function runTest() {
  try {
    console.log("🚀 در حال تست مدل جدید Gemini 2.0 Flash...");
    
    // تغییر مهم: استفاده از مدلی که در لیست شما موجود بود
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent("سلام! اگر صدای من را می‌شنوی یک جمله کوتاه در مورد هوش مصنوعی بگو.");
    const response = await result.response;
    
    console.log("✅ موفقیت! پاسخ هوش مصنوعی:");
    console.log("------------------------------------------------");
    console.log(response.text());
    console.log("------------------------------------------------");
    
  } catch (error) {
    console.error("❌ خطا:", error.message);
  }
}

runTest();