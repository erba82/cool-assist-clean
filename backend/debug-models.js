const https = require('https');

// کلید شما
const apiKey = "AIzaSyBifqZBpw_EvPFU_vksuE-QyRTZpfANgcU";

console.log("🔍 تست شماره ۲: شروع درخواست مستقیم از گوگل...");

// آدرس لیست مدل‌ها
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => { data += chunk; });

  res.on('end', () => {
    console.log(`وضعیت پاسخ: ${res.statusCode}`);
    if (res.statusCode === 200) {
        const response = JSON.parse(data);
        console.log("✅ لیست مدل‌های فعال برای شما:");
        response.models.forEach(m => {
            if (m.name.includes("gemini")) console.log(" - " + m.name);
        });
    } else {
        console.log("❌ خطا در دریافت لیست:");
        console.log(data);
    }
  }).on("error", (err) => {
      console.log("❌ خطای اتصال:", err.message);
  });
});