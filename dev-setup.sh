#!/bin/bash

# 🧭 Compass Development Setup Script
# This script helps new contributors get up and running quickly

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emoji for better UX
COMPASS="🧭"
CHECK="✅"
CROSS="❌"
ARROW="➜"
ROCKET="🚀"
GEAR="⚙️"
BOOK="📚"

print_header() {
    echo -e "\n${PURPLE}${COMPASS} ===============================================${NC}"
    echo -e "${PURPLE}${COMPASS}     Compass Development Setup Script      ${COMPASS}${NC}"
    echo -e "${PURPLE}${COMPASS} ===============================================${NC}\n"
}

print_section() {
    echo -e "\n${CYAN}${GEAR} $1${NC}"
    echo -e "${CYAN}$(printf '%.0s─' {1..50})${NC}"
}

print_success() {
    echo -e "${GREEN}${CHECK} $1${NC}"
}

print_error() {
    echo -e "${RED}${CROSS} $1${NC}"
}

print_info() {
    echo -e "${BLUE}${ARROW} $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        print_success "$1 is installed"
        return 0
    else
        print_error "$1 is not installed"
        return 1
    fi
}

check_prerequisites() {
    print_section "Checking Prerequisites"
    
    local all_good=true
    
    # Check Go
    if check_command "go"; then
        local go_version=$(go version | cut -d' ' -f3 | cut -d'o' -f2)
        print_info "Go version: $go_version"
        # Check if Go version is >= 1.21
        if printf '%s\n' "1.21" "$go_version" | sort -V | head -n1 | grep -q "1.21"; then
            print_success "Go version is compatible"
        else
            print_error "Go version 1.21+ required, found $go_version"
            all_good=false
        fi
    else
        print_error "Please install Go 1.21+ from https://golang.org/dl/"
        all_good=false
    fi
    
    # Check Node.js
    if check_command "node"; then
        local node_version=$(node --version | cut -d'v' -f2)
        print_info "Node.js version: $node_version"
        # Check if Node version is >= 18
        if printf '%s\n' "18.0.0" "$node_version" | sort -V | head -n1 | grep -q "18.0.0"; then
            print_success "Node.js version is compatible"
        else
            print_error "Node.js version 18+ required, found $node_version"
            all_good=false
        fi
    else
        print_error "Please install Node.js 18+ from https://nodejs.org/"
        all_good=false
    fi
    
    # Check npm
    if check_command "npm"; then
        local npm_version=$(npm --version)
        print_info "npm version: $npm_version"
    else
        print_error "npm should come with Node.js installation"
        all_good=false
    fi
    
    # Check make
    if ! check_command "make"; then
        print_warning "make is not installed. Some build scripts may not work."
        print_info "On macOS: xcode-select --install"
        print_info "On Ubuntu/Debian: sudo apt-get install build-essential"
    fi
    
    # Check git
    if ! check_command "git"; then
        print_error "git is required for development"
        all_good=false
    fi
    
    if [ "$all_good" = false ]; then
        print_error "Please install missing prerequisites before continuing"
        exit 1
    fi
    
    print_success "All prerequisites are satisfied!"
}

setup_backend() {
    print_section "Setting up Backend (Go)"
    
    # Install Go tools
    print_info "Installing Go development tools..."
    go install golang.org/x/tools/cmd/goimports@latest
    go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
    print_success "Go tools installed"
    
    # Download dependencies
    print_info "Downloading Go dependencies..."
    if make deps 2>/dev/null; then
        print_success "Go dependencies downloaded"
    elif go mod download; then
        print_success "Go dependencies downloaded (fallback method)"
    else
        print_error "Failed to download Go dependencies"
        exit 1
    fi
    
    # Build the project
    print_info "Building Compass binary..."
    if make build 2>/dev/null; then
        print_success "Compass binary built successfully"
    elif go build -o compass ./cmd/compass; then
        print_success "Compass binary built successfully (fallback method)"
    else
        print_error "Failed to build Compass binary"
        exit 1
    fi
    
    # Test the binary
    if [ -f "./compass" ]; then
        print_success "Binary exists and is ready"
    else
        print_error "Binary not found after build"
        exit 1
    fi
}

setup_frontend() {
    print_section "Setting up Frontend (React)"
    
    if [ ! -d "dashboard" ]; then
        print_error "Dashboard directory not found"
        exit 1
    fi
    
    cd dashboard
    
    # Install dependencies
    print_info "Installing Node.js dependencies..."
    if npm install; then
        print_success "Node.js dependencies installed"
    else
        print_error "Failed to install Node.js dependencies"
        exit 1
    fi
    
    # Install development tools globally (optional)
    print_info "Installing optional global development tools..."
    npm install -g typescript@latest eslint@latest prettier@latest 2>/dev/null || print_warning "Could not install global tools (permission issue?)"
    
    # Run type checking
    print_info "Running TypeScript type checking..."
    if npm run type-check 2>/dev/null; then
        print_success "TypeScript types are valid"
    else
        print_warning "TypeScript type checking failed (this might be expected in development)"
    fi
    
    cd ..
    print_success "Frontend setup complete"
}

create_dev_scripts() {
    print_section "Creating Development Scripts"
    
    # Create a development startup script
    cat > dev-start.sh << 'EOF'
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
EOF
    
    chmod +x dev-start.sh
    print_success "Created dev-start.sh script"
    
    # Create a testing script
    cat > dev-test.sh << 'EOF'
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
EOF
    
    chmod +x dev-test.sh
    print_success "Created dev-test.sh script"
    
    # Create a build script
    cat > dev-build.sh << 'EOF'
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
EOF
    
    chmod +x dev-build.sh
    print_success "Created dev-build.sh script"
}

create_vscode_config() {
    print_section "Creating VS Code Configuration"
    
    mkdir -p .vscode
    
    # VS Code settings
    cat > .vscode/settings.json << 'EOF'
{
  "go.formatTool": "goimports",
  "go.lintTool": "golangci-lint",
  "go.lintOnSave": "package",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.workingDirectories": ["dashboard"],
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  }
}
EOF
    
    # VS Code extensions recommendations
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "golang.go",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
EOF
    
    # VS Code tasks
    cat > .vscode/tasks.json << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build Backend",
      "type": "shell",
      "command": "make build",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "./compass start",
      "group": "build",
      "isBackground": true,
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Start Frontend",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/dashboard"
      },
      "group": "build",
      "isBackground": true,
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Test All",
      "type": "shell",
      "command": "./dev-test.sh",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
EOF
    
    print_success "VS Code configuration created"
}

show_next_steps() {
    print_section "🎉 Setup Complete!"
    
    echo -e "${GREEN}${ROCKET} Your Compass development environment is ready!${NC}\n"
    
    echo -e "${CYAN}${BOOK} Quick Start Commands:${NC}"
    echo -e "  ${YELLOW}./dev-start.sh${NC}     - Start both backend and frontend"
    echo -e "  ${YELLOW}./dev-test.sh${NC}      - Run all tests and linting"
    echo -e "  ${YELLOW}./dev-build.sh${NC}     - Build for production"
    echo ""
    
    echo -e "${CYAN}${BOOK} Manual Commands:${NC}"
    echo -e "  ${YELLOW}./compass start${NC}    - Start backend only (:8080)"
    echo -e "  ${YELLOW}cd dashboard && npm run dev${NC} - Start frontend only (:5174)"
    echo ""
    
    echo -e "${CYAN}${BOOK} Access Points:${NC}"
    echo -e "  ${BLUE}📊 Advanced Dashboard: http://localhost:5174${NC}"
    echo -e "  ${BLUE}🔌 Backend API:        http://localhost:8080${NC}"
    echo ""
    
    echo -e "${CYAN}${BOOK} Development Tips:${NC}"
    echo -e "  • Use VS Code for the best development experience"
    echo -e "  • Check ${YELLOW}CONTRIBUTING.md${NC} for detailed guidelines"
    echo -e "  • Run ${YELLOW}./dev-test.sh${NC} before committing changes"
    echo -e "  • Backend changes require restart, frontend has hot reload"
    echo ""
    
    echo -e "${GREEN}${COMPASS} Happy coding! Welcome to the Compass contributor community! ${COMPASS}${NC}"
}

main() {
    print_header
    
    # Check if we're in the right directory
    if [ ! -f "go.mod" ] || [ ! -d "dashboard" ]; then
        print_error "Please run this script from the compass project root directory"
        exit 1
    fi
    
    check_prerequisites
    setup_backend
    setup_frontend
    create_dev_scripts
    create_vscode_config
    show_next_steps
}

# Run the main function
main "$@"

