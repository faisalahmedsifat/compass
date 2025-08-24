#!/bin/bash

# Install Compass as a systemd user service
# Usage: ./install-service.sh [username]

set -e

USER_NAME=${1:-$USER}
COMPASS_BINARY=${COMPASS_BINARY:-$(which compass)}
SERVICE_DIR="$HOME/.config/systemd/user"
SERVICE_FILE="compass.service"

echo "🧭 Installing Compass as systemd user service"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if compass binary exists
if [ ! -x "$COMPASS_BINARY" ]; then
    echo "❌ Error: compass binary not found or not executable"
    echo "   Make sure compass is installed and in your PATH"
    echo "   Or set COMPASS_BINARY environment variable"
    exit 1
fi

echo "📍 Found compass binary: $COMPASS_BINARY"

# Create systemd user directory if it doesn't exist
mkdir -p "$SERVICE_DIR"

# Create service file
cat > "$SERVICE_DIR/$SERVICE_FILE" << EOF
[Unit]
Description=Compass Workspace Tracker
Documentation=https://github.com/faisalahmedsifat/compass
After=graphical-session.target
Wants=graphical-session.target

[Service]
Type=exec
Environment=DISPLAY=:0
Environment=XDG_RUNTIME_DIR=/run/user/$UID
ExecStart=$COMPASS_BINARY start
ExecStop=$COMPASS_BINARY stop
ExecReload=$COMPASS_BINARY restart
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=compass

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=false

[Install]
WantedBy=default.target
EOF

echo "📝 Created service file: $SERVICE_DIR/$SERVICE_FILE"

# Reload systemd and enable service
systemctl --user daemon-reload
systemctl --user enable compass.service

echo "✅ Compass service installed successfully!"
echo ""
echo "🚀 Usage:"
echo "  systemctl --user start compass    # Start service"
echo "  systemctl --user stop compass     # Stop service"
echo "  systemctl --user restart compass  # Restart service"
echo "  systemctl --user status compass   # Check status"
echo "  systemctl --user enable compass   # Enable auto-start (already done)"
echo "  systemctl --user disable compass  # Disable auto-start"
echo ""
echo "📊 You can also use compass commands:"
echo "  compass status                     # Check daemon status"
echo "  compass start --daemon            # Start using built-in daemon"
echo "  compass stop                       # Stop daemon"
echo ""
echo "🌐 Dashboard will be available at: http://localhost:8080"

# Check if we should start the service
read -p "Start Compass service now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    systemctl --user start compass.service
    echo "🧭 Compass service started!"
    echo "📊 Check status: systemctl --user status compass"
fi
