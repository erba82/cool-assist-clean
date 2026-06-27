#!/bin/bash

# OpenFOAM v10 Installation Script for Ubuntu on WSL2
# Auto-install script for GFDDE Phase 5

set -e  # Exit on error

echo "=================================="
echo "🚀 OpenFOAM v10 Installation"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please run as normal user (not root)"
   exit 1
fi

echo "📦 Step 1: Updating system..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq

echo ""
echo "🔑 Step 2: Adding OpenFOAM repository..."
sudo sh -c "wget -O - https://dl.openfoam.org/gpg.key | apt-key add -" 2>/dev/null
sudo add-apt-repository -y http://dl.openfoam.org/ubuntu 2>/dev/null
sudo apt-get update -qq

echo ""
echo "📥 Step 3: Installing OpenFOAM v10..."
echo "   (This will download ~2GB, please wait...)"
sudo apt-get install -y openfoam10

echo ""
echo "⚙️  Step 4: Configuring environment..."
if ! grep -q "source /opt/openfoam10/etc/bashrc" ~/.bashrc; then
    echo "source /opt/openfoam10/etc/bashrc" >> ~/.bashrc
    echo "✅ Added OpenFOAM to .bashrc"
else
    echo "✅ OpenFOAM already in .bashrc"
fi

source /opt/openfoam10/etc/bashrc

echo ""
echo "🐍 Step 5: Installing Python tools..."
sudo apt-get install -y python3 python3-pip
pip3 install flask flask-cors --quiet

echo ""
echo "📁 Step 6: Creating directories..."
mkdir -p ~/cases ~/results
echo "✅ Created ~/cases and ~/results"

echo ""
echo "=================================="
echo "✅ Installation Complete!"
echo "=================================="
echo ""
echo "Test OpenFOAM:"
echo "  blockMesh -help"
echo ""
echo "Next steps:"
echo "1. Copy wrapper: wsl cp /mnt/c/Users/Erfan/cool-assist-clean/backend/services/openfoam/openfoam_wrapper.py ~/"
echo "2. Run service: python3 ~/openfoam_wrapper.py"
echo ""
