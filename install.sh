#!/bin/bash

# Compass Installation Script
set -e

REPO_URL="https://github.com/faisalahmedsifat/compass.git"
INSTALL_DIR="/usr/local/bin"
CONFIG_DIR="$HOME/.config/compass"
COMPASS_DIR="$HOME/.compass"

echo "🧭 Installing Compass - Complete Workspace Tracker"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if Go is installed
if ! command -v go &> /dev/null; then
    echo "❌ Go is not installed. Please install Go first:"
    echo "   https://golang.org/doc/install"
    exit 1
fi

echo "✅ Go found: $(go version)"

# Check if Git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first"
    exit 1
fi

echo "✅ Git found"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Using temporary directory: $TEMP_DIR"

# Clone repository
echo "📥 Cloning Compass repository..."
git clone "$REPO_URL" "$TEMP_DIR/compass"
cd "$TEMP_DIR/compass"

# Build binary
echo "🔨 Building Compass..."
go mod download
go build -o compass cmd/compass/main.go

# Test binary
echo "🧪 Testing binary..."
./compass --version

# Install binary
echo "📦 Installing binary to $INSTALL_DIR..."
if [[ -w "$INSTALL_DIR" ]]; then
    cp compass "$INSTALL_DIR/"
else
    sudo cp compass "$INSTALL_DIR/"
fi

# Create config directory
echo "⚙️  Setting up configuration..."
mkdir -p "$CONFIG_DIR"
mkdir -p "$COMPASS_DIR"

# Copy example config if it doesn't exist
if [[ ! -f "$CONFIG_DIR/config.yaml" ]]; then
    cp config.yaml.example "$CONFIG_DIR/config.yaml"
    echo "✅ Created config file: $CONFIG_DIR/config.yaml"
else
    echo "✅ Config file already exists: $CONFIG_DIR/config.yaml"
fi

# Clean up
cd /
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 Compass installed successfully!"
echo ""
echo "Quick Start:"
echo "  compass start              # Start tracking"
echo "  compass stats              # View stats"
echo "  open http://localhost:8080 # Open dashboard"
echo ""
echo "Configuration: $CONFIG_DIR/config.yaml"
echo "Database: $COMPASS_DIR/compass.db"
echo ""
echo "For macOS: You may need to grant accessibility permissions in:"
echo "System Preferences > Security & Privacy > Privacy > Accessibility"
echo ""
echo "Run 'compass --help' for more options."
