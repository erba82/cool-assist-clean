const fs = require('fs');
const path = require('path');

// دنبال این عبارت هستیم
const SEARCH_TERM = "gemini-1.5-flash";
// پوشه‌هایی که نادیده می‌گیریم
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];

function searchInDir(startPath) {
    if (!fs.existsSync(startPath)) return;

    const files = fs.readdirSync(startPath);
    for (const file of files) {
        const filename = path.join(startPath, file);
        const stat = fs.lstatSync(filename);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                searchInDir(filename);
            }
        } else {
            // جستجو در فایل‌های کدی فرانت‌اند و بک‌اند
            if (filename.match(/\.(js|jsx|ts|tsx|html|env|json)$/)) {
                const content = fs.readFileSync(filename, 'utf8');
                if (content.includes(SEARCH_TERM)) {
                    console.log(`\n🔥 پیدا شد! => ${filename}`);
                    // نمایش خطی که پیدا شده
                    const lines = content.split('\n');
                    lines.forEach((line, idx) => {
                        if (line.includes(SEARCH_TERM)) {
                            console.log(`   خط ${idx + 1}: ${line.trim().substring(0, 100)}...`);
                        }
                    });
                }
            }
        }
    }
}

console.log(`🔍 جستجو در: ${process.cwd()}`);
searchInDir(process.cwd());
console.log("✅ تمام.");