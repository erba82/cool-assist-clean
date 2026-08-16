'use strict';
const fs = require('fs');
const path = require('path');
const target = path.resolve(process.cwd(), 'frontend/src/components/UnifiedChatPage.tsx');
let source = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');

function replaceExactlyOnce(pattern, replacement, label) {
  const matches = source.match(pattern) || [];
  if (matches.length !== 1) {
    throw new Error(`${label}: expected one match, found ${matches.length}`);
  }
  source = source.replace(pattern, replacement);
}

replaceExactlyOnce(
  /    const handleSend = async \(\) => \{\n        if \(!input\.trim\(\)\) return;\n        const msg = input;\n        setInput\(''\);/,
  `    const handleSend = async (messageOverride?: string) => {\n        const msg = messageOverride ?? input;\n        if (!msg.trim()) return;\n        if (!messageOverride) setInput('');`,
  'handleSend signature'
);

replaceExactlyOnce(
  /                                    onConfirm=\{\(\) => \{\n                                        setInput\('confirm'\);\n                                        setTimeout\(\(\) => handleSend\(\), 100\);\s*\n                                    \}\}/,
  `                                    onConfirm={() => {\n                                        void handleSend('confirm');\n                                    }}`,
  'recommendation confirmation callback'
);

replaceExactlyOnce(
  /                                    onModify=\{\(what: string\) => \{\n                                        setInput\(`change \$\{what\}`\);\n                                        setTimeout\(\(\) => handleSend\(\), 100\);\s*\n                                    \}\}/,
  `                                    onModify={(what: string) => {\n                                        void handleSend(\`change \${what}\`);\n                                    }}`,
  'recommendation modification callback'
);

replaceExactlyOnce(
  /                                    onSubmitAnswer=\{\(answer: string\) => \{\n                                        setInput\(answer\);\n                                        setTimeout\(\(\) => handleSend\(\), 100\);\s*\n                                    \}\}/,
  `                                    onSubmitAnswer={(answer: string) => {\n                                        void handleSend(answer);\n                                    }}`,
  'information-answer callback'
);

fs.writeFileSync(target, source, 'utf8');
console.log('Applied direct, closure-safe message dispatch for chat action callbacks.');
