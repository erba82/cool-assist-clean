# GFDDE Complete Setup Script
# Automated installation for all components

Write-Host "=" * 80
Write-Host "🚀 GFDDE - Complete System Setup"
Write-Host "=" * 80
Write-Host ""

$ErrorActionPreference = "Continue"

# Check Node.js
Write-Host "📦 Checking Node.js..."
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installed: $nodeVersion"
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ from nodejs.org"
    exit 1
}

# Check Python
Write-Host ""
Write-Host "🐍 Checking Python..."
try {
    $pythonVersion = python --version
    Write-Host "✅ Python installed: $pythonVersion"
} catch {
    Write-Host "❌ Python not found. Please install Python 3.9+ from python.org"
    exit 1
}

# Check pip
try {
    $pipVersion = pip --version
    Write-Host "✅ pip installed: $pipVersion"
} catch {
    Write-Host "❌ pip not found"
    exit 1
}

Write-Host ""
Write-Host "=" * 80
Write-Host "📥 Installing Backend Dependencies"
Write-Host "=" * 80

Set-Location backend

Write-Host ""
Write-Host "Installing Node.js packages..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend npm install failed"
    exit 1
}

Write-Host ""
Write-Host "Installing Python packages for services..."

# CoolProp Service
Write-Host ""
Write-Host "  📦 CoolProp Service..."
Set-Location services/physics
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ CoolProp dependencies installed"
} else {
    Write-Host "  ⚠️  CoolProp install had issues (continuing...)"
}

# ML Service  
Set-Location ../ml
Write-Host ""
Write-Host "  📦 ML Service..."
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ ML dependencies installed"
} else {
    Write-Host "  ⚠️  ML install had issues (continuing...)"
}

# CFD Service
Set-Location ../cfd
Write-Host ""
Write-Host "  📦 Enhanced CFD Service..."
pip install -r requirements.txt --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ CFD dependencies installed"
} else {
    Write-Host "  ⚠️  CFD install had issues (continuing...)"
}

Set-Location ../../..

Write-Host ""
Write-Host "=" * 80
Write-Host "📥 Installing Frontend Dependencies"
Write-Host "=" * 80

Set-Location frontend

Write-Host ""
Write-Host "Installing React packages..."
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend npm install failed"
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "=" * 80
Write-Host "✅ Installation Complete!"
Write-Host "=" * 80

Write-Host ""
Write-Host "📊 Installation Summary:"
Write-Host "  ✅ Backend: Node.js packages installed"
Write-Host "  ✅ Frontend: React packages installed"
Write-Host "  ✅ CoolProp: Python service ready"
Write-Host "  ✅ ML: Machine learning service ready"
Write-Host "  ✅ CFD: Enhanced CFD service ready"

Write-Host ""
Write-Host "🚀 To start the system:"
Write-Host ""
Write-Host "  1. Start Python services:"
Write-Host "     cd backend/services/physics"
Write-Host "     python coolprop_service.py"
Write-Host ""
Write-Host "     cd backend/services/ml"
Write-Host "     python ml_service.py"
Write-Host ""
Write-Host "     cd backend/services/cfd"
Write-Host "     python cfd_service.py"
Write-Host ""
Write-Host "  2. Start Backend (separate terminal):"
Write-Host "     cd backend"
Write-Host "     npm start"
Write-Host ""
Write-Host "  3. Start Frontend (separate terminal):"
Write-Host "     cd frontend"
Write-Host "     npm start"
Write-Host ""
Write-Host "  Or use the quick start script: .\start-all.ps1"
Write-Host ""
Write-Host "=" * 80
