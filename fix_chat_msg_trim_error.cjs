'use strict';
const fs = require('fs');
const path = require('path');
const target = path.resolve(process.cwd(), 'frontend/src/components/UnifiedChatPage.tsx');
let source = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');

const find = `    const handleSend = async (messageOverride?: string) => {
        const msg = messageOverride ?? input;
        if (!msg.trim()) return;`;

const replacement = `    const handleSend = async (messageOverride?: any) => {
        const rawMsg = messageOverride !== undefined ? messageOverride : input;
        const msg = typeof rawMsg === 'string' ? rawMsg : String(rawMsg?.target?.value ?? rawMsg?.message ?? rawMsg?.text ?? '');
        if (!msg.trim()) return;`;

const first = source.indexOf(find);
if (first < 0 || source.indexOf(find, first + find.length) >= 0) {
  throw new Error('Expected exactly one handleSend start block in UnifiedChatPage.tsx');
}
source = source.slice(0, first) + replacement + source.slice(first + find.length);
fs.writeFileSync(target, source, 'utf8');
console.log('Fixed handleSend msg.trim safety in UnifiedChatPage.tsx');
