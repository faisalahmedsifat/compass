#!/bin/bash

# 🧭 Compass Development Build Script
# Builds both backend and frontend for production

echo "🧭 Building Compass for Production..."

echo ""
echo "🖥️  Building Backend:"
echo "───────────────────"
make build || go build -o compass ./cmd/compass
echo "✅ Backend built"

echo ""
echo "⚛️  Building Frontend:"
echo "────────────────────"
cd dashboard
npm run build
cd ..
echo "✅ Frontend built"

echo ""
echo "🚀 Production build complete!"
echo "📦 Backend binary: ./compass"
echo "📦 Frontend build: ./dashboard/dist/"
