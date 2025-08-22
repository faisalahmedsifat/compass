# Compass Build System
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "0.1.0")
LDFLAGS := -X main.Version=$(VERSION)
BINARY_NAME := compass

.PHONY: build clean install test run help dev-setup dev-start dev-test lint

# Default target
all: build

# Build the binary
build:
	@echo "Building Compass v$(VERSION)..."
	go build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME) cmd/compass/main.go
	@echo "✅ Built: ./$(BINARY_NAME)"

# Build for all platforms
build-all:
	@echo "Building for all platforms..."
	GOOS=darwin GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME)-darwin-amd64 cmd/compass/main.go
	GOOS=darwin GOARCH=arm64 go build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME)-darwin-arm64 cmd/compass/main.go
	GOOS=linux GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME)-linux-amd64 cmd/compass/main.go
	GOOS=windows GOARCH=amd64 go build -ldflags "$(LDFLAGS)" -o $(BINARY_NAME)-windows-amd64.exe cmd/compass/main.go
	@echo "✅ Built all platform binaries"

# Install to system
install: build
	@echo "Installing Compass..."
	sudo cp $(BINARY_NAME) /usr/local/bin/
	mkdir -p ~/.config/compass
	cp config.yaml.example ~/.config/compass/config.yaml 2>/dev/null || true
	@echo "✅ Installed to /usr/local/bin/$(BINARY_NAME)"
	@echo "✅ Config file: ~/.config/compass/config.yaml"

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -f $(BINARY_NAME)
	rm -f $(BINARY_NAME)-*
	@echo "✅ Cleaned"

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...
	@echo "✅ Tests completed"

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	go mod download
	go mod tidy
	@echo "✅ Dependencies updated"

# Run Compass locally
run: build
	@echo "Starting Compass..."
	./$(BINARY_NAME) start

# Run in daemon mode
daemon: build
	@echo "Starting Compass in daemon mode..."
	./$(BINARY_NAME) start --daemon

# Stop Compass
stop:
	@echo "Stopping Compass..."
	./$(BINARY_NAME) stop

# Show status
status:
	./$(BINARY_NAME) status

# Open dashboard
dashboard:
	./$(BINARY_NAME) dashboard

# Development targets

# Complete development setup for new contributors
dev-setup:
	@echo "🧭 Running comprehensive development setup..."
	./dev-setup.sh

# Start both backend and frontend for development
dev-start: build
	@echo "🚀 Starting development environment..."
	@echo "Backend will start on :8080, Frontend on :5174"
	./dev-start.sh

# Run comprehensive test suite
dev-test:
	@echo "🧪 Running full test suite..."
	./dev-test.sh

# Lint backend code
lint:
	@echo "🔍 Linting Go code..."
	golangci-lint run
	@echo "✅ Linting completed"

# Format Go code
fmt:
	@echo "🎨 Formatting Go code..."
	go fmt ./...
	goimports -w .
	@echo "✅ Code formatted"

# Build production-ready frontend
build-frontend:
	@echo "📦 Building frontend for production..."
	cd dashboard && npm run build
	@echo "✅ Frontend built: dashboard/dist/"

# Install development tools
dev-tools:
	@echo "🛠️  Installing development tools..."
	go install golang.org/x/tools/cmd/goimports@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	@echo "✅ Development tools installed"

# Quick health check for development environment
dev-check:
	@echo "🩺 Development environment health check..."
	@echo "Checking Go installation..."
	@go version || (echo "❌ Go not found" && exit 1)
	@echo "Checking Node.js installation..."
	@node --version || (echo "❌ Node.js not found" && exit 1)
	@echo "Checking if backend builds..."
	@go build -o /tmp/compass-test cmd/compass/main.go && rm -f /tmp/compass-test || (echo "❌ Backend build failed" && exit 1)
	@echo "Checking if frontend dependencies are installed..."
	@cd dashboard && npm list >/dev/null 2>&1 || (echo "❌ Frontend dependencies missing, run 'cd dashboard && npm install'" && exit 1)
	@echo "✅ Development environment is healthy!"

# Show help
help:
	@echo "🧭 Compass Build System"
	@echo ""
	@echo "📦 Build Targets:"
	@echo "  build         - Build the Compass binary"
	@echo "  build-all     - Build for all platforms"
	@echo "  build-frontend- Build frontend for production"
	@echo "  clean         - Remove build artifacts"
	@echo ""
	@echo "🛠️  Development Targets:"
	@echo "  dev-setup     - Complete setup for new contributors"
	@echo "  dev-start     - Start both backend and frontend"
	@echo "  dev-test      - Run comprehensive test suite"
	@echo "  dev-check     - Health check for dev environment"
	@echo "  dev-tools     - Install development tools"
	@echo ""
	@echo "🔍 Code Quality:"
	@echo "  test          - Run backend tests"
	@echo "  lint          - Lint Go code"
	@echo "  fmt           - Format Go code"
	@echo ""
	@echo "🚀 Runtime Targets:"
	@echo "  run           - Build and run Compass"
	@echo "  daemon        - Build and run in daemon mode"
	@echo "  stop          - Stop Compass"
	@echo "  status        - Show system status"
	@echo "  dashboard     - Open dashboard in browser"
	@echo ""
	@echo "📚 Other:"
	@echo "  deps          - Update dependencies"
	@echo "  install       - Install to /usr/local/bin"
	@echo "  help          - Show this help"
