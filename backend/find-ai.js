const fs = require('fs');
const path = require('path');

// دنبال تابع اصلی ساخت مدل می‌گردیم
const SEARCH_TERM = "getGenerativeModel";
const IGNORE_DIRS = ['node_modules', '.git', 'dist'];

function searchInDir(startPath) {
    if (!fs.existsSync(startPath)) return;
    const files = fs.readdirSync(startPath);

    for (const file of files) {
        const filename = path.join(startPath, file);
        const stat = fs.lstatSync(filename);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) searchInDir(filename);
        } else if (filename.endsWith('.js') || filename.endsWith('.ts')) {
            const content = fs.readFileSync(filename, 'utf8');
            if (content.includes(SEARCH_TERM)) {
                console.log(`\n🎯 هدف پیدا شد در فایل: ${filename}`);
                const lines = content.split('\n');
                lines.forEach((line, idx) => {
                    if (line.includes(SEARCH_TERM)) {
                        console.log(`   خط ${idx + 1}: ${line.trim()}`);
                    }
                });
            }
        }
    }
}

console.log("🔍 در حال جستجوی تابع هوش مصنوعی...");
searchInDir(__dirname);