#!/bin/bash
# Cool-Assist Node/Express backend (port 8001). Supervisor's `backend` program is
# preconfigured for a Python/uvicorn stack, so start this Node app manually here.
cd /app/backend
setsid nohup node server.js > /var/log/node_backend.log 2>&1 < /dev/null &
disown
echo "Backend starting on :8001 (logs: /var/log/node_backend.log)"
