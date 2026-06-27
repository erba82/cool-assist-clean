const fs = require('fs');
const path = require('path');

// متنی که دنبالش هستیم
const SEARCH_TERM = "gemini-1.5-flash";
const IGNORE_DIRS = ['node_modules', '.git', 'dist'];

function searchInDir(startPath) {
    if (!fs.existsSync(startPath)) {
        console.log("مسیر وجود ندارد:", startPath);
        return;
    }

    const files = fs.readdirSync(startPath);
    for (const file of files) {
        const filename = path.join(startPath, file);
        const stat = fs.lstatSync(filename);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                searchInDir(filename); // جستجوی بازگشتی در پوشه‌ها
            }
        } else {
            // فقط فایل‌های متنی را چک کن
            if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.env') || filename.endsWith('.json')) {
                const content = fs.readFileSync(filename, 'utf8');
                if (content.includes(SEARCH_TERM)) {
                    console.log(`\n🚨 پیدا شد در فایل: ${filename}`);
                    // پیدا کردن شماره خط
                    const lines = content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.includes(SEARCH_TERM)) {
                            console.log(`   خط ${index + 1}: ${line.trim().substring(0, 100)}...`);
                        }
                    });
                }
            }
        }
    }
}

console.log("🔍 شروع جستجو برای 'gemini-1.5-flash' در کل پروژه...");
searchInDir(__dirname);
console.log("✅ جستجو تمام شد.");