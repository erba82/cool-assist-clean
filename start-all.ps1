# GFDDE - Quick Start Script
# Starts all services in separate windows

Write-Host "🚀 Starting GFDDE System..."
Write-Host ""

# Start CoolProp Service
Write-Host "📦 Starting CoolProp Service (port 5001)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend\services\physics'; python coolprop_service.py"
Start-Sleep -Seconds 2

# Start ML Service
Write-Host "🤖 Starting ML Service (port 5002)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend\services\ml'; python ml_service.py"
Start-Sleep -Seconds 2

# Start CFD Service
Write-Host "🌡️  Starting Enhanced CFD Service (port 5003)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend\services\cfd'; python cfd_service.py"
Start-Sleep -Seconds 2

# Start Backend
Write-Host "⚙️  Starting Backend Server (port 5000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start"
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting Frontend (port 3000)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm start"

Write-Host ""
Write-Host "=" * 80
Write-Host "✅ All services starting..."
Write-Host "=" * 80
Write-Host ""
Write-Host "Services:"
Write-Host "  🌐 Frontend:  http://localhost:3000"
Write-Host "  ⚙️  Backend:   http://localhost:5000"
Write-Host "  📦 CoolProp:  http://localhost:5001"
Write-Host "  🤖 ML:        http://localhost:5002"
Write-Host "  🌡️  CFD:       http://localhost:5003"
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop services"
Write-Host "=" * 80
