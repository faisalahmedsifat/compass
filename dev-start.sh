#!/bin/bash

# 🧭 Compass Development Startup Script
# Starts both backend and frontend in parallel

trap 'kill $(jobs -p)' EXIT

echo "🧭 Starting Compass Development Environment..."

# Start backend
echo "🖥️  Starting backend on :8080..."
./compass start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "⚛️  Starting frontend on :5174..."
cd dashboard && npm run dev &
FRONTEND_PID=$!

echo ""
echo "🚀 Development environment started!"
echo "📊 Frontend Dashboard: http://localhost:5174"
echo "🔌 Backend API:       http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
