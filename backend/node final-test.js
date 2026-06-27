// فایل: debug-models.js
const https = require('https');

// کلید شما
const apiKey = "AIzaSyBifqZBpw_EvPFU_vksuE-QyRTZpfANgcU";

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("🔍 در حال پرس‌وجو از گوگل برای لیست مدل‌های در دسترس...");

https.get(url, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode !== 200) {
        console.log(`❌ خطا با کد ${res.statusCode}:`);
        console.log(JSON.stringify(response, null, 2));
        return;
      }

      console.log("✅ ارتباط موفق بود! لیست مدل‌های فعال برای شما:");
      console.log("------------------------------------------------");
      
      let flashFound = false;
      if (response.models) {
        response.models.forEach(model => {
          // فقط اسم مدل‌های اصلی را چاپ می‌کنیم
          if (model.name.includes("gemini")) {
             console.log(`- ${model.name.replace('models/', '')}`);
             if (model.name.includes("gemini-1.5-flash")) flashFound = true;
          }
        });
      } else {
        console.log("⚠️ هیچ مدلی یافت نشد!");
      }
      
      console.log("------------------------------------------------");
      if (flashFound) {
          console.log("🎉 مدل gemini-1.5-flash در لیست وجود دارد!");
          console.log("نتیجه: مشکل از سمت گوگل نیست، احتمالاً پروکسی/VPN شما درخواست‌های SDK را خراب می‌کند.");
      } else {
          console.log("⛔ مدل gemini-1.5-flash در لیست شما نیست!");
          console.log("نتیجه: این کلید API دسترسی به این مدل را ندارد. باید یک پروژه جدید در AI Studio بسازید.");
      }

    } catch (e) {
      console.log("خطا در خواندن پاسخ:", e.message);
      console.log("متن خام:", data);
    }
  });

}).on("error", (err) => {
  console.log("❌ خطای شبکه (اینترنت/VPN):", err.message);
});