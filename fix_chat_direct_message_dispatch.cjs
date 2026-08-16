'use strict';
const fs = require('fs');
const path = require('path');
const target = path.resolve(process.cwd(), 'frontend/src/components/UnifiedChatPage.tsx');
let source = fs.readFileSync(target, 'utf8');
const changes = [
  [
    `    const handleSend = async () => {
        if (!input.trim()) return;
        const msg = input;
        setInput('');`,
    `    const handleSend = async (messageOverride?: string) => {
        const msg = messageOverride ?? input;
        if (!msg.trim()) return;
        if (!messageOverride) setInput('');`
  ],
  [
    `                                    onConfirm={() => {
                                        setInput('confirm');
                                        setTimeout(() => handleSend(), 100);    
                                    }}
                                    onModify={(what: string) => {
                                        setInput(\`change \${what}\`);
                                        setTimeout(() => handleSend(), 100);    
                                    }}`,
    `                                    onConfirm={() => {
                                        void handleSend('confirm');
                                    }}
                                    onModify={(what: string) => {
                                        void handleSend(\`change \${what}\`);
                                    }}`
  ],
  [
    `                                    onSubmitAnswer={(answer: string) => {
                                        setInput(answer);
                                        setTimeout(() => handleSend(), 100);    
                                    }}`,
    `                                    onSubmitAnswer={(answer: string) => {
                                        void handleSend(answer);
                                    }}`
  ],
];
for (const [find, replace] of changes) {
  const first = source.indexOf(find);
  if (first < 0 || source.indexOf(find, first + find.length) >= 0) {
    throw new Error(`Expected exactly one source fragment: ${find.slice(0, 90)}`);
  }
  source = source.slice(0, first) + replace + source.slice(first + find.length);
}
fs.writeFileSync(target, source, 'utf8');
console.log('Direct message dispatch for recommendation and information actions is enabled.');
