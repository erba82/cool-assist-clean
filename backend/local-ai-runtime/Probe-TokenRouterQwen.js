'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const safe = (value) => String(value || '').replace(/Bearer\s+[^\s]+/gi, 'Bearer [redacted]').slice(0, 360);

(async () => {
    const key = process.env.TOKENROUTER_API_KEY;
    const base = (process.env.TOKENROUTER_API_BASE_URL || 'https://api.tokenrouter.com/v1').replace(/\/$/, '');
    const model = process.env.TOKENROUTER_QWEN_MODEL || 'qwen/qwen3.8-max';
    if (!key) throw new Error('TOKENROUTER_API_KEY is not configured in backend/.env.');
    const started = Date.now();
    const response = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Reply exactly API_OK.' }], temperature: 0, max_tokens: 128, stream: false })
    });
    let body = null;
    try { body = await response.json(); } catch (_) { body = null; }
    const content = body?.choices?.[0]?.message?.content || '';
    const error = body?.error?.message || body?.message || null;
    console.log(JSON.stringify({ model, ok: response.ok, httpStatus: response.status, latencyMs: Date.now() - started, responseReceived: Boolean(String(content).trim()), returnedModel: body?.model || null, providerMessage: error ? safe(error) : null }, null, 2));
    process.exitCode = response.ok && content ? 0 : 1;
})().catch((error) => {
    console.error(JSON.stringify({ ok: false, httpStatus: null, responseReceived: false, providerMessage: safe(error.message) }, null, 2));
    process.exitCode = 1;
});
