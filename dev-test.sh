#!/bin/bash

# 🧭 Compass Development Testing Script
# Runs all tests for both backend and frontend

echo "🧭 Running Compass Test Suite..."

echo ""
echo "🖥️  Backend Tests (Go):"
echo "─────────────────────────"
go test ./... || echo "❌ Backend tests failed"

echo ""
echo "⚛️  Frontend Tests (React):"
echo "─────────────────────────────"
cd dashboard
npm test -- --watchAll=false || echo "❌ Frontend tests failed"
cd ..

echo ""
echo "🔍 Backend Linting:"
echo "──────────────────"
golangci-lint run || echo "❌ Backend linting failed"

echo ""
echo "🔍 Frontend Linting:"
echo "───────────────────"
cd dashboard
npm run lint || echo "❌ Frontend linting failed"
cd ..

echo ""
echo "✅ Test suite complete!"
