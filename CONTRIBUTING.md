# Contributing to Compass 🧭

Thank you for your interest in contributing to Compass! This document provides guidelines and information for contributors.

## 🚀 Quick Start for Contributors

### Prerequisites
- **Go 1.21+** (required)
- **Git** (required)
- **macOS** (for testing - Linux/Windows support needs contributors!)

### Development Setup

```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/[your-username]/compass.git
cd compass

# 3. Install dependencies
make deps

# 4. Build and test
make build
./compass start

# 5. Verify functionality
./compass stats                  # Check CLI
open http://localhost:8080       # Check dashboard
curl http://localhost:8080/api/health  # Check API
```

## 🎯 Contribution Areas

### 🟢 **High Priority (Ready for Contributors)**

#### **Cross-Platform Support**
- **`internal/capture/platform_linux.go`** - Linux window tracking (using X11/Wayland)
- **`internal/capture/platform_windows.go`** - Windows window tracking (Win32 API)
- **Testing on different platforms**

#### **Browser Integration**
- **Chrome extension** for tab tracking
- **Firefox extension** for tab tracking  
- **Safari integration** (macOS)

#### **Enhanced Categorization**
- **More rules** in `internal/processor/categorizer.go`
- **Project detection** (git repo, workspace folders)
- **Language/framework detection** (React, Go, Python projects)

#### **Dashboard Improvements**
- **Timeline view** of activities
- **Productivity insights** visualization
- **Export functionality** enhancements
- **Mobile-responsive** improvements

### 🟡 **Medium Priority**

#### **Performance & Features**
- **Database optimization** (indexes, queries)
- **Memory usage** optimization
- **Multi-monitor** support
- **Window positioning** accuracy

#### **Privacy & Security**
- **Enhanced privacy filters**
- **Encryption at rest** options
- **Data anonymization** features
- **GDPR compliance** tools

### 🔴 **Advanced (Experienced Contributors)**

#### **AI Integration** 
- **Local AI** with Ollama
- **Natural language** activity summaries
- **Pattern recognition** algorithms
- **Productivity scoring** systems

#### **Integrations**
- **IDE plugins** (VS Code, IntelliJ, etc.)
- **Time tracking** exports (Toggl, RescueTime)
- **Calendar integration** (Google Calendar, Outlook)
- **Team features** (optional sharing)

## 📋 Development Guidelines

### **Code Style**
- Follow **Go conventions** (`go fmt`, `golint`)
- Use **meaningful variable names**
- Add **comments for complex logic**
- Keep functions **small and focused**

### **Architecture Principles**
1. **Privacy First** - Never compromise user privacy
2. **Local Storage** - All data stays on user's machine
3. **Performance** - Minimal resource usage
4. **Cross-Platform** - Consider all platforms in design
5. **Modular Design** - Clean separation of concerns

### **Testing Requirements**
- **Unit tests** for new functions
- **Integration tests** for API endpoints
- **Manual testing** on target platforms
- **Performance testing** for resource usage

### **Documentation**
- Update **README.md** for user-facing changes
- Update **system.md** for architectural changes
- Add **code comments** for complex logic
- Include **examples** in documentation

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
├── cmd/compass/main.go           # CLI entry point
├── internal/
│   ├── capture/                  # Data collection
│   │   ├── engine.go             # Capture orchestration
│   │   ├── platform_darwin.go   # macOS implementation
│   │   ├── platform_linux.go    # Linux (needs contributor)
│   │   └── platform_windows.go  # Windows (needs contributor)
│   ├── processor/                # Data processing
│   │   └── categorizer.go        # Activity categorization
│   ├── storage/                  # Data persistence
│   │   ├── database.go           # SQLite interface
│   │   └── migrations.go         # Schema management
│   ├── server/                   # Web interface
│   │   ├── server.go             # HTTP/WebSocket server
│   │   └── dashboard.go          # HTML dashboard
│   └── config/                   # Configuration
│       └── config.go             # Settings management
├── pkg/types/                    # Shared types
└── static/                       # Frontend assets (embedded)
```

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
