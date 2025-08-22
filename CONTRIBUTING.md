# Contributing to Compass 🧭

Thank you for your interest in contributing to Compass! This document provides comprehensive guidelines for contributing to our full-stack workspace intelligence platform.

## 🌟 **What You're Contributing To**

Compass is a **comprehensive workspace intelligence platform** with:
- **Backend (Go):** CLI tool, REST API, WebSocket server, window tracking, smart categorization
- **Frontend (React):** Advanced dashboard with Timeline views, Analytics, AI insights, Screenshot gallery
- **Platform Support:** macOS (complete), Linux (in progress), Windows (planned)

---

## 🚀 **Quick Start for Contributors**

### **Prerequisites**
- **Backend:** Go 1.21+, Make, SQLite3
- **Frontend:** Node.js 18+, npm/yarn
- **Development:** Git, VS Code (recommended)
- **Testing:** macOS for testing window tracking (Linux/Windows contributors welcome!)

### **🏗️ Full Development Setup**

#### **🎯 Automatic Setup (Recommended)**
```bash
# 1. Fork and clone
git clone https://github.com/[your-username]/compass.git
cd compass

# 2. Run the automated setup script
./dev-setup.sh                  # Installs everything automatically

# 3. Start the development environment
./dev-start.sh                  # Starts both backend and frontend

# 4. Verify everything works
open http://localhost:5174       # Advanced React dashboard
open http://localhost:8080       # Backend API endpoints
```

#### **🛠️ Manual Setup (For Learning)**
```bash
# 1. Fork and clone
git clone https://github.com/[your-username]/compass.git
cd compass

# 2. Backend setup (Go)
make deps                        # Install Go dependencies
make build                       # Build compass binary

# 3. Frontend setup (React)
cd dashboard
npm install                      # Install React dependencies
cd ..

# 4. Start development environment
# Terminal 1: Backend
./compass start                  # API server on :8080

# Terminal 2: Frontend
cd dashboard && npm run dev      # React dev server on :5174

# 5. Verify everything works
open http://localhost:5174       # Advanced dashboard
open http://localhost:8080       # API endpoints
curl http://localhost:8080/api/health  # API health check
./compass stats                  # CLI functionality
```

#### **⚡ Development Tools**
```bash
# Available after setup
./dev-test.sh                   # Run all tests
make dev-check                  # Health check
make help                       # Show all make commands
make lint                       # Lint Go code
make fmt                        # Format Go code
```

### **⚡ Quick Backend-Only Setup**

```bash
# For backend/API development only
git clone https://github.com/[your-username]/compass.git
cd compass && make deps && make build
./compass start
open http://localhost:8080
```

## 🎯 **Contribution Areas**

### 🟢 **High Priority (Great for New Contributors)**

#### **🖥️ Backend (Go) Contributions**
- **`internal/capture/platform_linux.go`** - Linux window tracking using X11/Wayland APIs
- **`internal/capture/platform_windows.go`** - Windows window tracking with Win32 API
- **Enhanced categorization rules** in `internal/processor/categorizer.go`
- **API endpoint improvements** and new features
- **Performance optimizations** for capture engine
- **Database schema enhancements** and query optimization

#### **⚛️ Frontend (React) Contributions**
- **New dashboard components** for advanced analytics
- **Timeline view enhancements** - drill-down functionality, more granular views
- **Chart improvements** - new visualization types, interactive features
- **Mobile responsiveness** - improve tablet/phone experience
- **Accessibility improvements** - ARIA labels, keyboard navigation
- **Export functionality** - PDF reports, CSV exports, data visualization exports
- **Real-time features** - WebSocket integration, live updating components
- **Performance optimization** - component memoization, lazy loading

#### **🌐 Browser Integration**
- **Chrome extension** for tab tracking and context awareness
- **Firefox extension** for comprehensive browser monitoring
- **Safari integration** (macOS) for complete browser coverage

#### **📱 Cross-Platform Support**
- **Linux testing and fixes** for X11/Wayland environments
- **Windows testing and implementation** for Win32 API integration
- **macOS accessibility** improvements and edge case handling

### 🟡 **Medium Priority (Some Experience Required)**

#### **🔍 Advanced Analytics**
- **Machine learning patterns** for productivity insights
- **Predictive analytics** for suggesting optimal work patterns
- **Advanced correlation analysis** between different productivity metrics
- **Goal tracking and progress monitoring** features

#### **⚡ Performance & Optimization**
- **Database query optimization** and indexing strategies
- **Memory usage profiling** and optimization
- **Capture efficiency improvements** - reduce system impact
- **Bundle size optimization** for faster dashboard loading
- **WebSocket connection management** and reconnection logic

#### **🔒 Privacy & Security**
- **Enhanced privacy filters** with regex pattern matching
- **Data encryption at rest** options for sensitive information
- **Anonymization features** for data sharing/export
- **GDPR compliance tools** and data management features

### 🔴 **Advanced (Experienced Contributors)**

#### **🤖 AI & Intelligence**
- **Local AI integration** with Ollama for privacy-preserving insights
- **Natural language processing** for activity summarization
- **Advanced pattern recognition** using machine learning
- **Productivity scoring algorithms** and recommendation systems

#### **🔗 Integrations & Ecosystem**
- **IDE plugins** - VS Code, IntelliJ, Vim extensions
- **Time tracking exports** - Toggl, RescueTime, Clockify compatibility
- **Calendar integration** - Google Calendar, Outlook, Apple Calendar
- **Team collaboration features** - shared insights, team analytics
- **API ecosystem** - third-party integration support

#### **📊 Enterprise Features**
- **Team dashboards** and organization-level insights
- **Advanced reporting** and analytics for productivity teams
- **Data governance** and administrative controls
- **Scalability improvements** for organization deployments

## 📋 **Development Guidelines**

### **🖥️ Backend (Go) Guidelines**

#### **Code Style**
```bash
# Required tools
go install golang.org/x/tools/cmd/goimports@latest
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Format and lint
go fmt ./...                     # Format code
goimports -w .                   # Fix imports
golangci-lint run                # Comprehensive linting
```

#### **Go Best Practices**
- Follow **Go conventions** - use `gofmt`, meaningful names, error handling
- **Package structure** - keep packages focused and avoid circular dependencies  
- **Error handling** - always handle errors, use wrapped errors for context
- **Context usage** - pass context for cancellation and timeouts
- **Interface design** - prefer small, focused interfaces
- **Testing** - write table-driven tests, use testify for assertions

### **⚛️ Frontend (React) Guidelines**

#### **Code Style**
```bash
# Required tools in dashboard/
npm install                      # Install dependencies
npm run lint                     # ESLint + TypeScript checking
npm run format                   # Prettier formatting
npm run type-check               # TypeScript validation
```

#### **React/TypeScript Best Practices**
- **Component design** - functional components with hooks, proper prop typing
- **State management** - use React hooks, TanStack Query for server state
- **Performance** - memoization with `useMemo`/`useCallback`, lazy loading
- **Accessibility** - proper ARIA labels, semantic HTML, keyboard navigation
- **Styling** - Tailwind CSS classes, responsive design, dark mode support
- **Type safety** - strict TypeScript, proper interface definitions

### **🏗️ Architecture Principles**

1. **🔒 Privacy First** - Never compromise user privacy, all data stays local
2. **📱 Cross-Platform** - Design for macOS, Linux, and Windows from the start
3. **⚡ Performance** - Minimal resource usage, efficient algorithms
4. **🧩 Modular Design** - Clean separation between capture, processing, storage, and UI
5. **🔗 API-First** - Backend provides comprehensive REST/WebSocket API
6. **📊 Real-Time** - Live updates and responsive user experience
7. **🎨 User-Centric** - Intuitive UI with powerful analytics capabilities

### **🧪 Testing Requirements**

#### **Backend Testing**
```bash
# Unit tests
go test ./...                    # Run all tests
go test -v ./internal/capture    # Verbose output for specific package
go test -race ./...              # Race condition detection
go test -cover ./...             # Coverage reporting

# Integration tests
make test-integration            # API endpoint testing
./compass start --test-mode      # Start in test mode
```

#### **Frontend Testing**
```bash
# In dashboard/
npm test                         # Jest unit tests
npm run test:coverage            # Coverage reporting
npm run test:e2e                 # Playwright end-to-end tests
npm run test:components          # Component testing with React Testing Library
```

#### **Manual Testing Checklist**
- ✅ **Backend:** API endpoints respond correctly, window tracking works, data persists
- ✅ **Frontend:** All dashboard tabs load, real-time updates work, responsive design
- ✅ **Integration:** Frontend correctly displays backend data, WebSocket connections stable
- ✅ **Cross-Platform:** Test on macOS (required), Linux (if available), Windows (if available)
- ✅ **Performance:** CPU usage <5%, memory usage <100MB, UI responsive <16ms frame time

### **📚 Documentation Standards**

#### **Code Documentation**
- **Go:** Use GoDoc comments for exported functions and types
- **React:** JSDoc comments for complex components and hooks
- **README updates** for new features or architectural changes
- **API documentation** for new endpoints using OpenAPI/Swagger format

#### **Commit Messages**
```bash
# Format: type(scope): description
feat(timeline): add month view with daily aggregation
fix(capture): resolve memory leak in window tracking
docs(readme): update installation instructions
test(api): add integration tests for stats endpoints
refactor(ui): extract reusable chart components
```

#### **Pull Request Requirements**
- 📝 **Clear description** of changes and motivation
- 🧪 **Test coverage** for new functionality
- 📸 **Screenshots** for UI changes
- ⚡ **Performance impact** assessment
- 📖 **Documentation updates** if needed

## 🔧 **Development Workflow**

### **1. Setting Up Development**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Edit code, add tests, update docs

# Test thoroughly
make test
./compass start  # Test functionality
```

### **2. Testing Changes**
```bash
# Build and test
make build
./compass start

# Test specific components
curl http://localhost:8080/api/current    # Test API
./compass stats                           # Test CLI
open http://localhost:8080                # Test dashboard

# Test edge cases
# - Multiple monitors
# - Different applications  
# - Privacy filtering
# - Long-running sessions
```

### **3. Submitting Changes**
```bash
# Commit with clear messages
git add .
git commit -m "feat: add Linux window tracking support"

# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Include:
# - Clear description of changes
# - Test results on your platform
# - Screenshots if UI changes
# - Performance impact assessment
```

## 🐛 **Bug Reports**

### **Good Bug Report Includes:**
```bash
# System information
./compass status
./compass --version
uname -a

# Steps to reproduce
1. Start compass
2. Open specific applications
3. Observe unexpected behavior

# Expected vs actual behavior
# Screenshots or logs if applicable
```

### **Common Issues & Solutions:**

**macOS Permission Issues:**
- Grant accessibility permissions in System Preferences
- Check Terminal has "Screen Recording" permission

**Performance Issues:**
- Check capture interval (`config.yaml`)
- Monitor database size
- Review excluded applications

**Data Not Showing:**
- Verify AppleScript permissions
- Check database connectivity
- Review privacy filters

## 📁 **Project Structure**

```
compass/
├── 🔧 Backend (Go)
│   ├── cmd/compass/main.go              # CLI entry point & command handling
│   ├── internal/
│   │   ├── capture/                     # Platform-specific window tracking
│   │   │   ├── engine.go                # Capture orchestration & scheduling
│   │   │   ├── platform_darwin.go      # macOS (AppleScript + Accessibility)
│   │   │   ├── platform_linux.go       # Linux (X11/Wayland) [NEEDS CONTRIBUTOR]
│   │   │   └── platform_windows.go     # Windows (Win32 API) [NEEDS CONTRIBUTOR]
│   │   ├── processor/                   # Data processing & intelligence
│   │   │   ├── categorizer.go           # Smart activity categorization
│   │   │   └── analytics.go             # Advanced analytics processing
│   │   ├── storage/                     # Data persistence layer
│   │   │   ├── database.go              # SQLite interface & queries
│   │   │   ├── migrations.go            # Schema management & versioning
│   │   │   └── models.go                # Data models & relationships
│   │   ├── server/                      # Web server & API
│   │   │   ├── server.go                # HTTP/WebSocket server setup
│   │   │   ├── handlers.go              # REST API endpoints
│   │   │   ├── websocket.go             # Real-time updates
│   │   │   └── middleware.go            # Authentication, CORS, logging
│   │   └── config/                      # Configuration management
│   │       ├── config.go                # Settings & privacy controls
│   │       └── defaults.go              # Default configuration values
│   ├── pkg/types/                       # Shared type definitions
│   │   ├── types.go                     # Core data structures
│   │   └── api.go                       # API request/response types
│   ├── Makefile                         # Build automation & tasks
│   ├── go.mod                           # Go module dependencies
│   └── config.yaml.example              # Example configuration file
│
├── 🎨 Frontend (React)
│   └── dashboard/
│       ├── src/
│       │   ├── components/              # React components
│       │   │   ├── Dashboard.tsx        # Main dashboard controller
│       │   │   ├── TimelineView.tsx     # Google Calendar-like timeline
│       │   │   ├── FocusHeatmap.tsx     # Productivity heatmap visualization
│       │   │   ├── AppEfficiencyRadar.tsx # App performance radar chart
│       │   │   ├── EnergyProductivityScatter.tsx # Energy vs productivity
│       │   │   ├── FlowStateIndicator.tsx # Real-time focus state
│       │   │   ├── ProductivityInsights.tsx # AI-powered recommendations
│       │   │   ├── AppTransitionAnalysis.tsx # Context switching analysis
│       │   │   ├── ScreenshotGallery.tsx # Visual activity timeline
│       │   │   ├── StatsCard.tsx        # Summary statistics display
│       │   │   ├── CategoriesCard.tsx   # Activity categorization
│       │   │   ├── ActivitiesCard.tsx   # Recent activities list
│       │   │   ├── CurrentWorkspaceCard.tsx # Current state display
│       │   │   ├── ConnectionStatus.tsx # API connection indicator
│       │   │   ├── TimePeriodSelector.tsx # Time range selector
│       │   │   └── WelcomeModal.tsx     # First-time user onboarding
│       │   ├── hooks/                   # Custom React hooks
│       │   │   └── useCompassApi.ts     # API integration & data fetching
│       │   ├── types/                   # TypeScript type definitions
│       │   │   └── index.ts             # Frontend data models
│       │   ├── utils/                   # Helper functions & utilities
│       │   │   ├── dateUtils.ts         # Date formatting & manipulation
│       │   │   └── chartUtils.ts        # Chart configuration & helpers
│       │   ├── App.tsx                  # Root React component
│       │   ├── main.tsx                 # React app entry point
│       │   └── index.css                # Global styles & Tailwind imports
│       ├── public/                      # Static assets
│       │   └── vite.svg                 # Favicon & public assets
│       ├── package.json                 # Node.js dependencies & scripts
│       ├── tailwind.config.js           # Tailwind CSS configuration
│       ├── vite.config.ts               # Vite build tool configuration
│       ├── tsconfig.json                # TypeScript configuration
│       ├── tsconfig.app.json            # App-specific TypeScript config
│       ├── tsconfig.node.json           # Node.js TypeScript config
│       ├── eslint.config.js             # ESLint linting configuration
│       └── postcss.config.js            # PostCSS configuration
│
├── 📚 Documentation
│   ├── README.md                        # Main project documentation
│   ├── CONTRIBUTING.md                  # This file - contribution guidelines
│   ├── CHANGELOG.md                     # Version history & changes
│   └── docs/                            # Additional documentation
│       ├── API.md                       # API documentation
│       ├── ARCHITECTURE.md              # System architecture details
│       └── DEPLOYMENT.md                # Production deployment guide
│
└── 🛠️ Development Tools
    ├── .gitignore                       # Git ignore patterns
    ├── install.sh                       # Installation script
    ├── docker-compose.yml               # Container orchestration [PLANNED]
    └── .github/                         # GitHub workflows & templates
        ├── workflows/                   # CI/CD automation
        └── ISSUE_TEMPLATE/              # Issue & PR templates
```

### **🎯 Key Areas for Contribution**

#### **🟢 Beginner-Friendly**
- **Frontend components** - New charts, UI improvements, mobile responsiveness
- **Documentation** - API docs, tutorials, examples
- **Testing** - Unit tests, integration tests, manual testing on different platforms
- **Bug fixes** - Small improvements and edge case handling

#### **🟡 Intermediate**
- **Backend features** - New API endpoints, enhanced categorization, performance optimization
- **Data analysis** - Advanced analytics algorithms, pattern recognition
- **Cross-platform support** - Linux/Windows window tracking implementation
- **Browser integrations** - Extensions for Chrome, Firefox, Safari

#### **🔴 Advanced**
- **AI integration** - Local LLM integration, machine learning features
- **Architecture improvements** - Scalability, microservices, advanced real-time features
- **Enterprise features** - Team collaboration, advanced privacy controls
- **Platform-specific optimizations** - Native integrations, system-level optimizations

## 🎖️ **Contributor Recognition**

Contributors will be:
- **Listed in README** for significant contributions
- **Credited in releases** 
- **Added to CONTRIBUTORS.md**
- **Invited to core team** for sustained contributions

## 💬 **Questions?**

- **GitHub Issues**: For feature requests and bug reports
- **GitHub Discussions**: For questions and ideas  
- **Email**: [Contact maintainer if needed]

---

**🧭 Thank you for contributing to Compass!**

*Help us build the ultimate workspace intelligence tool.*
