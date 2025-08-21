# Compass Build System
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "0.1.0")
LDFLAGS := -X main.Version=$(VERSION)
BINARY_NAME := compass

.PHONY: build clean install test run help

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

# Show help
help:
	@echo "Compass Build System"
	@echo ""
	@echo "Available targets:"
	@echo "  build      - Build the Compass binary"
	@echo "  build-all  - Build for all platforms"
	@echo "  install    - Install to /usr/local/bin"
	@echo "  clean      - Remove build artifacts"
	@echo "  test       - Run tests"
	@echo "  deps       - Update dependencies"
	@echo "  run        - Build and run Compass"
	@echo "  daemon     - Build and run in daemon mode"
	@echo "  stop       - Stop Compass"
	@echo "  status     - Show system status"
	@echo "  dashboard  - Open dashboard in browser"
	@echo "  help       - Show this help"
