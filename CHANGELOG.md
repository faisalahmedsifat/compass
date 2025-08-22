# Changelog

All notable changes to Compass will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-08-21

### 🎉 Initial Release - MVP Complete!

#### Added

- **Complete window tracking** for macOS using AppleScript
- **Real-time categorization** engine with rule-based classification
- **Local SQLite database** for activity storage
- **REST API** with endpoints for activities, stats, current workspace
- **WebSocket support** for real-time dashboard updates
- **Beautiful web dashboard** at http://localhost:8080
- **CLI commands**: start, stop, stats, status, export, dashboard
- **Privacy controls** with app/title exclusions
- **Configuration management** via YAML files
- **Screenshot capture** with privacy filtering
- **Cross-platform build system** (Makefile)
- **Installation script** for easy setup

#### Features

- **Smart categorization**: Development, Debugging, Communication, Learning, etc.
- **Window relationships**: Tracks all background windows and their context
- **Focus time tracking**: Monitors how long windows stay active
- **Context switch detection**: Identifies workflow patterns
- **Privacy filtering**: Excludes sensitive apps and titles
- **Local-only storage**: No cloud uploads, complete data control
- **Real-time updates**: Live dashboard via WebSocket
- **Export functionality**: JSON and CSV formats

#### Technical Implementation

- **Go 1.21+** with modern dependency management
- **SQLite** for local data storage with migrations
- **Gorilla WebSocket** for real-time communication
- **Cobra CLI** framework for command structure
- **Viper configuration** management
- **AppleScript integration** for macOS window detection
- **Embedded dashboard** (no external dependencies)

#### Platforms

- ✅ **macOS** (Intel + Apple Silicon) - Fully tested and working
- ⏳ **Linux** (planned for v0.2.0)
- ⏳ **Windows** (planned for v0.2.0)

#### Performance

- **~18MB binary** (single file distribution)
- **<30MB RAM** usage during operation
- **<1% CPU** impact on modern systems
- **10-second capture interval** (configurable)

#### Security & Privacy

- **Local-only data** (never leaves your machine)
- **Configurable exclusions** for sensitive applications
- **Title filtering** for private content
- **Optional screenshot blurring**
- **SQLite encryption** support ready

### 🔄 **Live Test Results**

```
Total Active Time: 1h+ tracked
Windows Detected: 7+ simultaneously
Categories: Development (primary), Communication
Context Switches: 11+ detected
Applications: Cursor, Chrome, Slack, Terminal, Preview, System Settings
Database: 20+ activities captured and stored
```

---

## [Unreleased]

### Added

- **Configurable screenshot intervals** - Screenshots can now be captured at different intervals than workspace capture
- **Enhanced configuration documentation** - Added comprehensive CONFIG.md and improved README configuration sections
- **Configuration development guidelines** - Updated CONTRIBUTING.md with configuration management best practices
- **Cursor AI rules** - Added .cursorrules file to ensure documentation consistency

### Changed

- **Screenshot capture logic** - Screenshots now use independent timing from workspace capture
- **Configuration structure** - Added `screenshot_interval` field to tracking configuration
- **Documentation structure** - Improved configuration documentation with examples and troubleshooting

### Configuration

- **New option**: `tracking.screenshot_interval` - Controls how often screenshots are taken (default: 60s)
- **Backward compatible** - Existing configurations continue to work with sensible defaults
- **Validation added** - Screenshot interval must be at least 1 second

### Examples

```yaml
# High-frequency monitoring with reasonable screenshots
tracking:
  interval: 10s           # Workspace capture every 10 seconds
  screenshot_interval: 300s  # Screenshots every 5 minutes

# Battery-optimized configuration
tracking:
  interval: 30s           # Less frequent workspace capture
  screenshot_interval: 600s  # Screenshots every 10 minutes
```

### Planned for v0.2.0

- Linux window tracking support
- Windows window tracking support
- Browser tab extraction
- Performance optimizations
- Enhanced categorization rules

### Planned for v0.3.0

- Local AI integration (Ollama)
- Advanced pattern recognition
- Productivity insights
- Team collaboration features (optional)

### Planned for v1.0.0

- IDE plugins (VS Code, IntelliJ)
- Mobile companion app
- Advanced analytics
- Export integrations (Toggl, RescueTime)

---

## Version Numbering

- **Patch (0.1.x)**: Bug fixes, minor improvements
- **Minor (0.x.0)**: New features, platform support
- **Major (x.0.0)**: Breaking changes, major rewrites
