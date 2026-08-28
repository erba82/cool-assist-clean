# Cool-Assist (HVACR & Electrical Assistant) — Runtime Fix

## Problem statement (verbatim, fa)
"ایرادات اجرایی رو برطرف کن و برنامه رو ران کن" — plus a repeated
`ChunkLoadError: Loading chunk src_pages_DashboardLayout_tsx failed` on localhost:3001.

## Stack
- Frontend: React 18 + TypeScript, custom Webpack 5 dev server (not CRA). Port 3000 (supervisor sets PORT=3000; webpack default 3001 locally).
- Backend: Node.js + Express (`backend/server.js`), MongoDB via mongoose. Port 8001.
- Note: supervisor `backend` program is preconfigured for a Python/uvicorn stack and does NOT run this Node app. Start backend with `bash /app/start_backend.sh`.

## Root causes found & fixes (2026-08-28)
1. Missing dependencies — `node_modules` absent in both frontend and backend → dev build could not produce/serve chunks → ChunkLoadError. Fixed: `yarn install` (frontend), `npm install` (backend).
2. "Invalid Host header" from webpack-dev-server behind the preview proxy. Fixed: added `host:'0.0.0.0'` and `allowedHosts:'all'` in `webpack.config.js` devServer.
3. API routing: external ingress routes `/api` → :8001. Set backend `PORT=8001` (backend/.env) and pointed webpack devServer `/api` proxy to `http://127.0.0.1:8001`.
4. Infinite "Loading application module…" (Suspense stuck) on all DashboardLayout routes:
   - Eager-imported the `DashboardLayout` shell in `App.tsx` (was `React.lazy`) — nested lazy boundaries (lazy layout wrapping lazy page) never resolved.
   - Removed `React.StrictMode` in `index.tsx` (React 18 StrictMode + React.lazy dev-mode Suspense-stuck bug).

## Verified working (preview screenshots)
/welcome, /diagram-viewer, /dashboard, /calculator, /chat (AI Assistant) all render. Backend /health OK on :8001.

## Notes / backlog
- Auth is intentionally bypassed in `App.tsx` ProtectedRoute (dev). `routes/auth.js` exists but is not mounted in server.js.
- Backend is not supervisor-managed (supervisor expects Python). Re-run `bash /app/start_backend.sh` after a pod restart.
- AI providers (NVIDIA/Gemini/etc.) need API keys in backend/.env for live AI responses; chat UI loads without them.
