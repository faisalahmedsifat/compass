# 🧭 Compass - System Design Document

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User's Computer                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐        ┌──────────────────────────┐      │
│  │   Terminal   │        │      Web Browser         │      │
│  │              │        │                          │      │
│  │ $ compass    │        │  http://localhost:8080   │      │
│  │   start      │◄───────┤  (Dashboard View)        │      │
│  └──────┬───────┘        └──────────▲───────────────┘      │
│         │                           │                       │
│         │                           │                       │
│  ┌──────▼───────────────────────────┴────────────┐         │
│  │          Compass Core (Single Binary)          │         │
│  ├────────────────────────────────────────────────┤         │
│  │                                                │         │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │         │
│  │  │ Capture  │  │  Process │  │   Web    │   │         │
│  │  │  Engine  │──►│  Engine  │──►│  Server  │   │         │
│  │  └────┬─────┘  └────┬─────┘  └────▲─────┘   │         │
│  │       │             │              │          │         │
│  │       ▼             ▼              │          │         │
│  │  ┌─────────────────────────────────┴───┐     │         │
│  │  │         SQLite Database              │     │         │
│  │  │  (./compass.db - local file)         │     │         │
│  │  └──────────────────────────────────────┘     │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 2. Architecture Components

### 2.1 Core Modules

```
compass/
├── cmd/
│   └── compass/
│       └── main.go                 # CLI entry point
├── internal/
│   ├── capture/                    # Data collection
│   │   ├── screen.go               # Screenshot capture
│   │   ├── window.go               # Window detection
│   │   └── platform_darwin.go     # macOS specific
│   │   └── platform_linux.go      # Linux specific
│   │   └── platform_windows.go    # Windows specific
│   ├── processor/                  # Data processing
│   │   ├── categorizer.go         # Activity categorization
│   │   ├── aggregator.go          # Time aggregation
│   │   └── analyzer.go            # Pattern analysis
│   ├── storage/                    # Data persistence
│   │   ├── database.go            # SQLite interface
│   │   ├── models.go              # Data models
│   │   └── migrations.go          # Schema management
│   ├── server/                     # Web interface
│   │   ├── server.go              # HTTP server
│   │   ├── api.go                 # REST endpoints
│   │   ├── websocket.go           # Real-time updates
│   │   └── static/                # Dashboard HTML/JS/CSS
│   └── config/                     # Configuration
│       └── config.go              # Settings management
└── pkg/
    └── types/                      # Shared types
        └── types.go
```

### 2.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA CAPTURE PIPELINE                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Every 10 seconds:                                          │
│                                                              │
│  1. CAPTURE LAYER                                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │  OS APIs → Window List → Active Window → Screenshot │      │
│  └────────────────────┬─────────────────────────────┘      │
│                       │                                      │
│                       ▼                                      │
│  2. PROCESSING LAYER                                        │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Raw Data → Privacy Filter → Categorizer → Aggregator │   │
│  └────────────────────┬─────────────────────────────┘      │
│                       │                                      │
│                       ▼                                      │
│  3. STORAGE LAYER                                           │
│  ┌──────────────────────────────────────────────────┐      │
│  │  Structured Data → SQLite → Indexes → Compression │      │
│  └────────────────────┬─────────────────────────────┘      │
│                       │                                      │
│                       ▼                                      │
│  4. PRESENTATION LAYER                                      │
│  ┌──────────────────────────────────────────────────┐      │
│  │  REST API → WebSocket → Dashboard → Visualizations │     │
│  └──────────────────────────────────────────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 3. Database Schema

### 3.1 Core Tables

```sql
-- Main activity tracking table
CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Window information
    app_name TEXT NOT NULL,              -- "Visual Studio Code"
    window_title TEXT,                    -- "main.go - compass"
    process_id INTEGER,                   -- 1234
    
    -- Window state
    is_active BOOLEAN DEFAULT FALSE,      -- Currently focused?
    focus_duration INTEGER,                -- Seconds in focus
    
    -- Workspace context
    total_windows INTEGER,                 -- How many windows open
    window_list JSON,                      -- All windows JSON array
    
    -- Categorization
    category TEXT,                         -- "Development"
    confidence REAL,                       -- 0.95
    
    -- Optional screenshot
    screenshot BLOB,                       -- Compressed PNG
    
    -- Indexes for performance
    INDEX idx_timestamp (timestamp),
    INDEX idx_app_name (app_name),
    INDEX idx_category (category)
);

-- Aggregated statistics
CREATE TABLE hourly_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hour_bucket DATETIME,                  -- 2024-01-15 10:00:00
    app_name TEXT,
    category TEXT,
    
    total_seconds INTEGER,                 -- Time in seconds
    active_seconds INTEGER,                -- Time as active window
    background_seconds INTEGER,            -- Time in background
    
    switch_count INTEGER,                  -- Context switches
    window_count_avg REAL,                 -- Avg windows open
    
    UNIQUE(hour_bucket, app_name)
);

-- Window relationships
CREATE TABLE window_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME,
    
    active_app TEXT,
    background_apps JSON,                  -- Array of background apps
    
    pattern_name TEXT,                     -- "Development Setup"
    frequency INTEGER,                     -- How often seen
    productivity_score REAL                -- Correlation with productivity
);

-- User sessions
CREATE TABLE sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time DATETIME,
    end_time DATETIME,
    
    total_activities INTEGER,
    total_apps INTEGER,
    total_categories INTEGER,
    
    summary_json JSON                      -- AI-generated summary
);
```

### 3.2 Data Models (Go)

```go
package types

import "time"

// Core activity record
type Activity struct {
    ID          int64     `json:"id"`
    Timestamp   time.Time `json:"timestamp"`
    
    // Window data
    AppName     string    `json:"app_name"`
    WindowTitle string    `json:"window_title"`
    ProcessID   int       `json:"process_id"`
    
    // State
    IsActive    bool      `json:"is_active"`
    FocusDuration int     `json:"focus_duration"`
    
    // Context
    AllWindows  []Window  `json:"all_windows"`
    Category    string    `json:"category"`
    Confidence  float64   `json:"confidence"`
    
    // Optional
    Screenshot  []byte    `json:"-"` // Don't send in API
}

// Window information
type Window struct {
    AppName     string    `json:"app_name"`
    Title       string    `json:"title"`
    ProcessID   int       `json:"pid"`
    IsActive    bool      `json:"is_active"`
    LastActive  time.Time `json:"last_active"`
    Position    Rectangle `json:"position"`
    Monitor     int       `json:"monitor"`
}

// Categorized activity
type CategorizedActivity struct {
    Activity
    Category    string    `json:"category"`
    SubCategory string    `json:"sub_category"`
    Project     string    `json:"project"`
    Tags        []string  `json:"tags"`
}

// Aggregated stats
type Stats struct {
    Period      string              `json:"period"`
    TotalTime   time.Duration       `json:"total_time"`
    ByApp       map[string]Duration `json:"by_app"`
    ByCategory  map[string]Duration `json:"by_category"`
    Patterns    []Pattern           `json:"patterns"`
}
```

## 4. Capture System Design

### 4.1 Platform-Specific Window Detection

```go
// Platform interface
type WindowManager interface {
    GetActiveWindow() (*Window, error)
    GetAllWindows() ([]*Window, error)
    TakeScreenshot() (image.Image, error)
}

// macOS Implementation
type DarwinWindowManager struct{}

func (m *DarwinWindowManager) GetAllWindows() ([]*Window, error) {
    // Use CGWindowListCopyWindowInfo
    // Or AppleScript for quick MVP:
    script := `
    tell application "System Events"
        set windowList to {}
        repeat with proc in (every process whose visible is true)
            set procName to name of proc
            repeat with win in windows of proc
                set end of windowList to {procName, name of win}
            end repeat
        end repeat
        return windowList
    end tell
    `
    // Execute and parse results
}

// Linux Implementation  
type LinuxWindowManager struct{}

func (m *LinuxWindowManager) GetAllWindows() ([]*Window, error) {
    // Use X11 or Wayland APIs
    // Quick MVP using wmctrl:
    cmd := exec.Command("wmctrl", "-l", "-p")
    output, _ := cmd.Output()
    // Parse window list
}

// Windows Implementation
type WindowsWindowManager struct{}

func (m *WindowsWindowManager) GetAllWindows() ([]*Window, error) {
    // Use Windows API
    // EnumWindows to get all windows
    // GetWindowText for titles
    // GetWindowThreadProcessId for PIDs
}
```

### 4.2 Capture Pipeline

```go
type CaptureEngine struct {
    windowMgr    WindowManager
    storage      *Storage
    categorizer  *Categorizer
    interval     time.Duration
    privacyFilter *PrivacyFilter
}

func (c *CaptureEngine) Start(ctx context.Context) {
    ticker := time.NewTicker(c.interval)
    defer ticker.Stop()
    
    for {
        select {
        case <-ticker.C:
            c.captureWorkspace()
        case <-ctx.Done():
            return
        }
    }
}

func (c *CaptureEngine) captureWorkspace() error {
    // 1. Get all windows
    windows, err := c.windowMgr.GetAllWindows()
    if err != nil {
        return err
    }
    
    // 2. Take screenshot (optional)
    var screenshot []byte
    if c.config.CaptureScreenshots {
        img, _ := c.windowMgr.TakeScreenshot()
        screenshot = c.compressImage(img)
    }
    
    // 3. Apply privacy filters
    windows = c.privacyFilter.FilterWindows(windows)
    screenshot = c.privacyFilter.BlurSensitive(screenshot)
    
    // 4. Categorize activity
    category := c.categorizer.Categorize(windows)
    
    // 5. Store in database
    activity := &Activity{
        Timestamp:   time.Now(),
        AppName:     windows[0].AppName, // Active window
        WindowTitle: windows[0].Title,
        AllWindows:  windows,
        Category:    category,
        Screenshot:  screenshot,
    }
    
    return c.storage.SaveActivity(activity)
}
```

## 5. Processing & Categorization

### 5.1 Rule-Based Categorizer (MVP)

```go
type Categorizer struct {
    rules []Rule
}

type Rule struct {
    Name       string
    Priority   int
    Matcher    func(windows []Window) bool
    Category   string
}

func NewCategorizer() *Categorizer {
    return &Categorizer{
        rules: []Rule{
            {
                Name: "Development",
                Priority: 10,
                Matcher: func(windows []Window) bool {
                    hasIDE := false
                    hasLocalhost := false
                    
                    for _, w := range windows {
                        if isIDE(w.AppName) {
                            hasIDE = true
                        }
                        if strings.Contains(w.Title, "localhost") {
                            hasLocalhost = true
                        }
                    }
                    return hasIDE && hasLocalhost
                },
                Category: "Development",
            },
            {
                Name: "Debugging",
                Priority: 9,
                Matcher: func(windows []Window) bool {
                    hasError := false
                    hasStackOverflow := false
                    
                    for _, w := range windows {
                        if strings.Contains(w.Title, "error") ||
                           strings.Contains(w.Title, "exception") {
                            hasError = true
                        }
                        if strings.Contains(w.Title, "Stack Overflow") {
                            hasStackOverflow = true
                        }
                    }
                    return hasError && hasStackOverflow
                },
                Category: "Debugging",
            },
            // More rules...
        },
    }
}

func (c *Categorizer) Categorize(windows []Window) string {
    // Sort rules by priority
    sort.Slice(c.rules, func(i, j int) bool {
        return c.rules[i].Priority > c.rules[j].Priority
    })
    
    // Apply rules in order
    for _, rule := range c.rules {
        if rule.Matcher(windows) {
            return rule.Category
        }
    }
    
    return "Uncategorized"
}
```

### 5.2 AI-Enhanced Categorizer (Future)

```go
type AICategotizer struct {
    baseCategotizer *Categorizer
    aiClient        AIClient
    cache           *Cache
}

func (c *AICategotizer) Categorize(windows []Window) string {
    // Try rule-based first
    category := c.baseCategotizer.Categorize(windows)
    if category != "Uncategorized" {
        return category
    }
    
    // Check cache
    cacheKey := c.generateCacheKey(windows)
    if cached, found := c.cache.Get(cacheKey); found {
        return cached
    }
    
    // Use AI for complex cases
    prompt := c.buildPrompt(windows)
    result, err := c.aiClient.Classify(prompt)
    if err != nil {
        return "Uncategorized"
    }
    
    // Cache result
    c.cache.Set(cacheKey, result)
    return result
}
```

## 6. Web Server & API

### 6.1 HTTP Server

```go
type Server struct {
    db       *sql.DB
    addr     string
    upgrader websocket.Upgrader
    clients  map[*websocket.Conn]bool
}

func (s *Server) Start() error {
    mux := http.NewServeMux()
    
    // API endpoints
    mux.HandleFunc("/api/activities", s.handleActivities)
    mux.HandleFunc("/api/stats", s.handleStats)
    mux.HandleFunc("/api/current", s.handleCurrent)
    mux.HandleFunc("/api/export", s.handleExport)
    
    // WebSocket for real-time updates
    mux.HandleFunc("/ws", s.handleWebSocket)
    
    // Static dashboard files
    mux.Handle("/", http.FileServer(http.FS(staticFiles)))
    
    log.Printf("Dashboard available at http://localhost%s", s.addr)
    return http.ListenAndServe(s.addr, mux)
}

func (s *Server) handleActivities(w http.ResponseWriter, r *http.Request) {
    // Parse query params
    from := r.URL.Query().Get("from")
    to := r.URL.Query().Get("to")
    limit := r.URL.Query().Get("limit")
    
    // Query database
    activities, err := s.db.QueryActivities(from, to, limit)
    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }
    
    // Return JSON
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(activities)
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
    conn, err := s.upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    defer conn.Close()
    
    s.clients[conn] = true
    defer delete(s.clients, conn)
    
    // Send updates when new activities are captured
    for {
        select {
        case activity := <-s.activityChan:
            s.broadcast(activity)
        }
    }
}
```

### 6.2 REST API Endpoints

```yaml
# API Specification
endpoints:
  /api/activities:
    GET:
      params:
        - from: datetime
        - to: datetime
        - limit: int
        - category: string
      response: Activity[]
    
  /api/stats:
    GET:
      params:
        - period: "hour|day|week|month"
        - date: date
      response: Stats
    
  /api/current:
    GET:
      response: CurrentWorkspace
    
  /api/patterns:
    GET:
      response: Pattern[]
    
  /api/export:
    GET:
      params:
        - format: "json|csv"
        - from: datetime
        - to: datetime
      response: file
    
  /ws:
    WebSocket:
      events:
        - activity_captured
        - stats_updated
        - pattern_detected
```

## 7. Dashboard Architecture

### 7.1 Frontend Structure

```
static/
├── index.html          # Main dashboard
├── css/
│   └── dashboard.css   # Styles
├── js/
│   ├── app.js         # Main application
│   ├── charts.js      # Chart rendering
│   ├── websocket.js   # Real-time updates
│   └── api.js         # API client
└── assets/
    └── logo.svg       # Compass logo
```

### 7.2 Dashboard Components

```javascript
// Real-time activity feed
class ActivityFeed {
    constructor() {
        this.ws = new WebSocket('ws://localhost:8080/ws');
        this.ws.onmessage = this.handleUpdate.bind(this);
    }
    
    handleUpdate(event) {
        const activity = JSON.parse(event.data);
        this.addActivity(activity);
        this.updateStats(activity);
    }
}

// Workspace visualization
class WorkspaceView {
    render(windows) {
        // Visual representation of all open windows
        // Show active vs background
        // Group by category
    }
}

// Time tracking charts
class TimeChart {
    constructor(canvasId) {
        this.chart = new Chart(canvasId, {
            type: 'bar',
            data: this.data,
            options: this.options
        });
    }
    
    update(stats) {
        this.chart.data = this.transformStats(stats);
        this.chart.update();
    }
}
```

## 8. Privacy & Security

### 8.1 Privacy Filter

```go
type PrivacyFilter struct {
    excludeApps    []string
    excludeTitles  []string
    blurPasswords  bool
    redactPatterns []*regexp.Regexp
}

func (f *PrivacyFilter) FilterWindows(windows []Window) []Window {
    filtered := []Window{}
    
    for _, w := range windows {
        // Skip excluded apps
        if f.isExcluded(w.AppName) {
            continue
        }
        
        // Redact sensitive titles
        w.Title = f.redactSensitive(w.Title)
        
        filtered = append(filtered, w)
    }
    
    return filtered
}

func (f *PrivacyFilter) BlurSensitive(screenshot []byte) []byte {
    if !f.blurPasswords {
        return screenshot
    }
    
    // Detect password fields via OCR
    // Blur those regions
    return f.blurRegions(screenshot, sensitiveRegions)
}
```

### 8.2 Data Security

```go
// All data stored locally
// Optional encryption at rest
type SecureStorage struct {
    db         *sql.DB
    encryption *Encryption
}

func (s *SecureStorage) SaveActivity(a *Activity) error {
    // Encrypt sensitive fields
    if s.encryption != nil {
        a.WindowTitle = s.encryption.Encrypt(a.WindowTitle)
        a.Screenshot = s.encryption.Encrypt(a.Screenshot)
    }
    
    // Store in local SQLite
    return s.db.Insert(a)
}
```

## 9. Configuration System

### 9.1 Configuration File

```yaml
# ~/.config/compass/config.yaml
tracking:
  interval: 10s
  capture_screenshots: true
  track_all_windows: true
  
privacy:
  exclude_apps:
    - "1Password"
    - "Bitwarden"
    - "Banking App"
  exclude_titles:
    - "incognito"
    - "private"
  blur_sensitive: true
  auto_delete_after: 30d
  
categorization:
  mode: rules  # rules | ai | hybrid
  
server:
  port: 8080
  host: localhost
  
storage:
  path: ~/.compass/compass.db
  max_size: 1GB
  
ai:  # Optional future feature
  enabled: false
  provider: ollama
  model: llama2
```

### 9.2 CLI Configuration

```go
type Config struct {
    Tracking      TrackingConfig
    Privacy       PrivacyConfig
    Server        ServerConfig
    Storage       StorageConfig
    AI            AIConfig
}

func LoadConfig() (*Config, error) {
    // 1. Default configuration
    config := DefaultConfig()
    
    // 2. Load from config file
    if file, err := os.Open(ConfigPath()); err == nil {
        yaml.NewDecoder(file).Decode(&config)
    }
    
    // 3. Override with environment variables
    config.ApplyEnvVars()
    
    // 4. Override with CLI flags
    config.ApplyFlags()
    
    return config, nil
}
```

## 10. Performance Considerations

### 10.1 Resource Usage

```go
// Optimize capture frequency based on activity
type AdaptiveCapturer struct {
    baseInterval   time.Duration
    currentInterval time.Duration
    activityLevel  float64
}

func (c *AdaptiveCapturer) AdjustInterval() {
    if c.activityLevel > 0.8 {
        // High activity - capture more frequently
        c.currentInterval = 5 * time.Second
    } else if c.activityLevel < 0.2 {
        // Low activity - reduce frequency
        c.currentInterval = 30 * time.Second
    } else {
        // Normal activity
        c.currentInterval = c.baseInterval
    }
}
```

### 10.2 Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_timestamp ON activities(timestamp);
CREATE INDEX idx_app_category ON activities(app_name, category);
CREATE INDEX idx_date_hour ON activities(date(timestamp), strftime('%H', timestamp));

-- Periodic aggregation
INSERT INTO hourly_stats 
SELECT 
    strftime('%Y-%m-%d %H:00:00', timestamp) as hour_bucket,
    app_name,
    category,
    COUNT(*) * 10 as total_seconds,
    SUM(CASE WHEN is_active THEN 10 ELSE 0 END) as active_seconds
FROM activities
WHERE timestamp > datetime('now', '-1 hour')
GROUP BY hour_bucket, app_name, category;

-- Cleanup old detailed data
DELETE FROM activities 
WHERE timestamp < datetime('now', '-30 days')
AND id NOT IN (SELECT activity_id FROM important_events);
```

## 11. Deployment & Distribution

### 11.1 Build Pipeline

```makefile
# Makefile
VERSION := $(shell git describe --tags --always --dirty)
LDFLAGS := -X main.Version=$(VERSION)

.PHONY: build
build:
	go build -ldflags "$(LDFLAGS)" -o compass cmd/compass/main.go

.PHONY: build-all
build-all:
	GOOS=darwin GOARCH=amd64 go build -o compass-darwin-amd64
	GOOS=darwin GOARCH=arm64 go build -o compass-darwin-arm64
	GOOS=linux GOARCH=amd64 go build -o compass-linux-amd64
	GOOS=windows GOARCH=amd64 go build -o compass-windows-amd64.exe

.PHONY: install
install: build
	cp compass /usr/local/bin/
	mkdir -p ~/.config/compass
	cp config.yaml.example ~/.config/compass/config.yaml
```

### 11.2 Distribution

```yaml
# GitHub Release
release:
  artifacts:
    - compass-darwin-amd64    # macOS Intel
    - compass-darwin-arm64    # macOS Apple Silicon
    - compass-linux-amd64     # Linux
    - compass-windows-amd64   # Windows
  
  install_scripts:
    - install.sh             # Unix-like systems
    - install.ps1            # Windows PowerShell
```

## 12. Future Enhancements Pipeline

### Phase 1: MVP (Week 1)
- ✅ Basic window tracking
- ✅ SQLite storage
- ✅ Web dashboard
- ✅ Rule-based categorization

### Phase 2: Enhanced Tracking (Week 2)
- Browser tab extraction (extension)
- Terminal command tracking
- Git integration (branch/project)
- IDE plugin support

### Phase 3: Intelligence (Week 3-4)
- Local AI integration (Ollama)
- Pattern recognition
- Productivity scoring
- Automated insights

### Phase 4: Advanced Features (Month 2+)
- Multi-device sync (optional)
- Team features (optional)
- API for integrations
- Mobile companion app
- Export to standard formats

## 13. Error Handling & Recovery

```go
type ErrorHandler struct {
    logger *Logger
    recovery *Recovery
}

func (h *ErrorHandler) Handle(err error) {
    switch err := err.(type) {
    case *PermissionError:
        h.logger.Error("Permission denied. Please grant accessibility access.")
        h.showPermissionDialog()
    
    case *StorageError:
        h.logger.Error("Storage error:", err)
        h.recovery.AttemptRecovery()
    
    case *CaptureError:
        h.logger.Warn("Capture failed, retrying:", err)
        h.recovery.RetryCapture()
    
    default:
        h.logger.Error("Unexpected error:", err)
    }
}
```

## 14. Testing Strategy

```go
// Unit tests
func TestCategorizer(t *testing.T) {
    windows := []Window{
        {AppName: "VS Code", Title: "main.go"},
        {AppName: "Chrome", Title: "localhost:3000"},
    }
    
    category := categorizer.Categorize(windows)
    assert.Equal(t, "Development", category)
}

// Integration tests
func TestCaptureEngine(t *testing.T) {
    engine := NewCaptureEngine(mockWindowManager, mockStorage)
    err := engine.CaptureOnce()
    assert.NoError(t, err)
    assert.Equal(t, 1, mockStorage.SaveCount)
}

// E2E tests
func TestFullPipeline(t *testing.T) {
    // Start compass
    // Simulate window changes
    // Verify dashboard shows correct data
}
```

---

This system design provides a complete blueprint for building Compass from MVP to full implementation, with clear separation of concerns, scalability considerations, and a practical development path.