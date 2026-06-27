const { GoogleGenerativeAI } = require("@google/generative-ai");

try {
  // تلاش برای خواندن نسخه پکیج نصب شده
  const pkg = require("./node_modules/@google/generative-ai/package.json");
  console.log("📦 نسخه فعلی پکیج شما: " + pkg.version);
  
  if (pkg.version < "0.12.0") {
      console.log("❌ نسخه شما قدیمی است! برای همین ارور دریافت می‌کنید.");
  } else {
      console.log("✅ نسخه شما جدید است و باید کار کند.");
  }

} catch (e) {
  console.log("⚠️ نمی‌توانم نسخه را بخوانم.");
}

// تست اتصال با کلید شما
const genAI = new GoogleGenerativeAI("کلید-جدید-را-اینجا-بگذارید");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

console.log("🚀 در حال تلاش برای اتصال...");
model.generateContent("Hi").then(res => {
    console.log("🎉 پاسخ دریافت شد: ", res.response.text());
}).catch(err => {
    console.error("❌ ارور:", err.message);
});