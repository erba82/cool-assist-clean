const fs = require('fs');
let content = fs.readFileSync('./services/OllamaService.js', 'utf8');
content = content.replace(/http:\/\/127\.0\.0\.1:11434';/g, 'http://127.0.0.1:11434/api';');
fs.writeFileSync('./services/OllamaService.js', content);
console.log('Updated successfully');
