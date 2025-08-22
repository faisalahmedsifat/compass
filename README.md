# 🧭 Compass

> **A comprehensive workspace intelligence platform that sees your complete digital environment.**

Tracks your entire digital workspace in real-time: all windows, applications, and context across your desktop. Features an advanced React dashboard with Timeline views, AI-powered insights, productivity analytics, and real-time monitoring.

## 🌟 **What's New: Advanced Dashboard**

🎯 **Timeline View** - Google Calendar-like interface showing activity patterns by hour/day/week/month  
📊 **Advanced Analytics** - Focus heatmaps, app efficiency radar, energy correlations  
🧠 **AI Insights** - Personalized productivity recommendations and pattern analysis  
📸 **Screenshot Gallery** - Visual context of your work sessions  
⚡ **Real-time Updates** - Live flow state monitoring and WebSocket connectivity

---

## 👋 **First time here?**

<div align="center">

| 🎯 **What you want** | ⚡ **Action**                                                                                                                                                                                              | ⏱️ **Time** |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **Just try it**      | [⚡ Quick Start](#-quick-start-30-seconds)                                                                                                                                                                 | 30 seconds  |
| **See it working**   | [📊 Live Demo](#-live-demo-real-data)                                                                                                                                                                      | 2 minutes   |
| **Help improve it**  | [🐛 Report Bug](https://github.com/faisalahmedsifat/compass/issues/new?template=bug_report.md) or [💡 Request Feature](https://github.com/faisalahmedsifat/compass/issues/new?template=feature_request.md) | 5 minutes   |
| **Build features**   | [👨‍💻 Contributing Guide](CONTRIBUTING.md)                                                                                                                                                                   | 10 minutes  |

</div>

---

## 🚀 **Quick Navigation**

| 🎯 **I want to...**   | 📍 **Go here**                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| **Try Compass now**   | [⚡ Quick Start](#-quick-start-30-seconds)                                                               |
| **See what it does**  | [📊 Live Demo](#-live-demo-real-data)                                                                    |
| **Contribute code**   | [👨‍💻 Contributing](CONTRIBUTING.md)                                                                       |
| **Report a bug**      | [🐛 Bug Report](https://github.com/faisalahmedsifat/compass/issues/new?template=bug_report.md)           |
| **Request feature**   | [💡 Feature Request](https://github.com/faisalahmedsifat/compass/issues/new?template=feature_request.md) |
| **Read architecture** | [🏗️ View Source Code](https://github.com/faisalahmedsifat/compass)                                       |

---

## ⚡ **Quick Start (60 seconds)**

> **⚠️ Platform Support**: Compass currently works on **Linux** and **macOS** only. Windows support is not available at this time.

### **🎯 For Users (Just Want to Track):**

```bash
# 1. Clone and build backend
git clone https://github.com/faisalahmedsifat/compass.git
cd compass && make build

# 2. Start the tracking daemon
./compass start

# 3. Run the Frontend Dashboard
cd dashboard && npm install && npm run build && npm run dev
# Then open: http://localhost:5173
```

### **🚀 For Developers (Full Experience):**

```bash
# 🎯 One-Command Setup (Recommended)
git clone https://github.com/faisalahmedsifat/compass.git
cd compass && ./dev-setup.sh && ./dev-start.sh

# 📊 Access dashboards
open http://localhost:5174    # Advanced React dashboard
open http://localhost:8080    # Basic API interface
```

### **⚡ Manual Setup (Alternative):**

```bash
# 1. Start backend (Terminal 1)
cd compass && make build && ./compass start

# 2. Start advanced dashboard (Terminal 2)
cd dashboard && npm install && npm run dev

# 3. Access advanced dashboard
open http://localhost:5174
```

**That's it!** You now have the complete Compass experience with advanced analytics.

### 🔗 **Need Help?**

- 🐛 **Found a bug?** → [Report it here](https://github.com/faisalahmedsifat/compass/issues/new?template=bug_report.md)
- 💡 **Have an idea?** → [Request feature here](https://github.com/faisalahmedsifat/compass/issues/new?template=feature_request.md)
- 👨‍💻 **Want to contribute?** → [Read the guide](CONTRIBUTING.md)

---

## 🚀 **Status: ✅ FULLY WORKING**

- ✅ **Lightweight CLI tool** (single binary - 18MB)
- ✅ **Complete window tracking** (active + all background windows)
- ✅ **Local web dashboard** (http://localhost:8080)
- ✅ **Application state monitoring** (7+ windows tracked simultaneously)
- ✅ **Screenshot capture** with privacy controls
- ✅ **Smart categorization** (Development, Debugging, Communication, etc.)
- ✅ **Real-time WebSocket updates**
- ✅ **Privacy filtering** (sensitive apps/titles excluded)
- ✅ **SQLite data storage** (local, encrypted, exportable)
- ✅ **Tested on macOS** (accessibility permissions working)
- ✅ \*\*Tested on Linux (PopOS!)

## 🏗️ **System Architecture**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           User's Computer                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌──────────────────────┐    ┌─────────────────────────┐│
│  │  Terminal   │    │    Web Browser       │    │    Advanced Dashboard   ││
│  │             │    │                      │    │                         ││
│  │ $ compass   │    │ http://localhost:8080│    │ http://localhost:5174   ││
│  │   start     │    │  (Basic API View)    │    │  (React Dashboard)      ││
│  └─────┬───────┘    └───────────▲──────────┘    └─────────────▲───────────┘│
│        │                        │                            │             │
│        │                        │                            │             │
│  ┌─────▼────────────────────────────────────────────────────────────────┐  │
│  │                     Compass Backend (Go)                             │  │
│  ├──────────────────────────────────────────────────────────────────────┤  │
│  │                                                                      │  │
│  │ ┌──────────┐  ┌──────────┐  ┌─────────────┐  ┌─────────────────────┐│  │
│  │ │ Capture  │  │ Process  │  │ REST API    │  │ WebSocket Server    ││  │
│  │ │ Engine   │──► Engine   │──► Server      │  │ (Real-time Updates) ││  │
│  │ │(macOS/Win│  │(Rules/AI)│  │(:8080)      │  │                     ││  │
│  │ │/Linux)   │  │          │  │             │  │                     ││  │
│  │ └────┬─────┘  └────┬─────┘  └─────▲───────┘  └─────────▲───────────┘│  │
│  │      │             │              │                    │             │  │
│  │      ▼             ▼              │                    │             │  │
│  │ ┌──────────────────────────────────┴────────────────────┴─────────┐  │  │
│  │ │                    SQLite Database                              │  │  │
│  │ │        • Activities • Screenshots • Stats • Analytics          │  │  │
│  │ │               (./compass.db - encrypted, local)                 │  │  │
│  │ └─────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┤
│  │                     Frontend Dashboard (React)                          │
│  ├─────────────────────────────────────────────────────────────────────────┤
│  │                                                                          │
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │ │  Overview   │ │  Timeline   │ │ Analytics   │ │     AI Insights     ││
│  │ │   • Real-   │ │  • Hour/Day │ │ • Heatmaps  │ │ • Recommendations   ││
│  │ │     time    │ │  • Week/Mon │ │ • Radar     │ │ • Pattern Analysis  ││
│  │ │   • Flow    │ │  • Calendar │ │ • Scatter   │ │ • Productivity      ││
│  │ │     State   │ │     View    │ │   Plots     │ │     Optimization    ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│
│  │                                                                          │
│  │      Built with: React + TypeScript + Tailwind + Vite + TanStack        │
│  └─────────────────────────────────────────────────────────────────────────┘
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 **Live Demo (Real Data)**

**🎯 Compass is capturing this RIGHT NOW:**

```
📊 WORKSPACE STATE:
🎯 Active: Cursor → README.md — compass
📁 Category: Development
⏱️ Focus Time: 1m 50s
🔄 Context Switches: 11
🪟 Total Windows: 7

📋 ALL WINDOWS:
  [●] Cursor          📄 README.md — compass
  [○] Google Chrome   📄 🧭 Compass - Workspace Tracker
  [○] Slack           📄 Lotus (DM) - Scaledx - Slack
  [○] Terminal        📄 hello — faisalahmed@Kazis-Mac-mini...
  [○] Preview         📄 mermaid-diagram-2025-07-14-184153.png
  [○] System Settings 📄 Screen & System Audio Recording
```

**Stats after 1+ hours of testing:**

- ✅ **101+ activities** captured automatically
- ✅ **Real window titles** tracked (not just app names)
- ✅ **Smart categorization** (Development, Communication)
- ✅ **Privacy filtering** working
- ✅ **Real-time dashboard** updates

---

## 🎨 **Advanced Dashboard Features**

### **📅 Timeline View - Google Calendar for Productivity**

```
Hour View    │ 09:00  09:05  09:10  09:15  09:20  09:25  ...
            │ [💻]   [💻]   [🌐]   [🌐]   [💻]   [💻]
            │ Cursor Cursor Chrome Chrome Cursor Cursor
            │ 15m    12m    8m     10m    18m    14m

Day View     │ 06:00  07:00  08:00  09:00  10:00  11:00  ...
            │ [☕]   [📧]   [💻]   [💻]   [💻]   [🌐]
            │ Break  Email  Cursor Cursor Cursor Chrome
            │ 0m     25m    45m    58m    52m    35m

Week View    │ Sun    Mon    Tue    Wed    Thu    Fri    Sat
            │ [📱]   [💻]   [💻]   [💻]   [💻]   [💻]   [🎮]
            │ Light  Heavy  Heavy  Peak   Heavy  Med    Fun
            │ 2.5h   6.2h   7.1h   8.3h   6.8h   4.2h   1.5h
```

**Interactive Features:**

- 🖱️ **Hover for Details** - See exact app breakdowns and productivity scores
- 🎯 **Click to Drill Down** - Navigate from month → week → day → hour
- 🎨 **Color Coding** - Intensity-based visualization (red = low focus, green = high focus)
- 📊 **Multi-Granularity** - Switch between 5-minute intervals to monthly patterns

### **📊 Advanced Analytics**

#### **🔥 Focus Heatmap**

```
        Mon  Tue  Wed  Thu  Fri  Sat  Sun
06:00   ██   ██   ██   ██   ██   ░░   ░░
08:00   ███  ███  ███  ███  ███  ██   ░░
10:00   ████ ████ ████ ████ ████ ███  ██
12:00   ██   ██   ██   ██   ██   ██   ██
14:00   ████ ████ ████ ████ ████ ███  ██
16:00   ███  ███  ███  ███  ███  ██   ░░
18:00   ██   ██   ██   ██   ██   ░░   ░░
```

- **Peak Hours:** Automatically identify your most productive times
- **Energy Patterns:** Understand your natural rhythm
- **Weekly Trends:** Spot productivity patterns across days

#### **📡 App Efficiency Radar**

```
         Productivity
              ▲
              │
         ████ │ ████
    Time ◄────┼────► Focus
         ████ │ ████
              │
              ▼
          Efficiency
```

- **Multi-Dimensional Analysis** - Time spent vs productivity vs focus quality
- **App Comparisons** - Which tools make you most productive
- **Context Switching Impact** - Visual representation of distraction costs

#### **⚡ Energy-Productivity Correlation**

```
Productivity ▲
           █ │
           █ │ █
           █ │ █ █   Peak Performance Zone
           █ │ █ █ █
         ████│█████
         ────┼───────► Energy Level
             │
```

- **Sweet Spot Detection** - Find your optimal energy-productivity correlation
- **Burnout Prevention** - Identify when pushing harder reduces output
- **Work-Life Balance** - Visual feedback on sustainable productivity

### **🧠 AI-Powered Insights**

#### **📝 Personalized Recommendations**

```
🎯 OPTIMIZATION OPPORTUNITIES

1. 🕒 Peak Performance
   Your best work happens 10:00-11:30 AM
   → Schedule complex tasks during this window

2. 🔄 Context Switching
   You switch apps 23 times/hour during 2-4 PM
   → Consider time-blocking for deep work

3. 🎵 Environment
   Spotify + VS Code = 40% longer focus sessions
   → Maintain background music for coding

4. 📱 Distraction Patterns
   Slack checks spike before lunch meetings
   → Use notification batching
```

#### **📈 Productivity Insights**

- **Pattern Recognition** - Automatically detect your work habits
- **Efficiency Scoring** - Rate your productivity across different activities
- **Behavioral Triggers** - Understand what leads to flow states
- **Goal Tracking** - Monitor progress toward productivity targets

### **📸 Screenshot Gallery & Context**

```
┌─────────────────────────────────────────────────────────────────┐
│  Visual Timeline - See What You Actually Worked On             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [09:15] [09:30] [09:45] [10:00] [10:15] [10:30] [10:45]      │
│   📸     📸     📸     📸     📸     📸     📸              │
│  React   API    Debug  Deploy Tests  Review Notes             │
│  Component      Error         Pass   PR                       │
│                                                                 │
│  Click any screenshot to see full context and related apps     │
└─────────────────────────────────────────────────────────────────┘
```

**Privacy-First Design:**

- 🔒 **Local Storage** - Screenshots never leave your machine
- 🎭 **Smart Blurring** - Sensitive content automatically obscured
- 🗑️ **Auto-Cleanup** - Configurable retention periods
- 🚫 **Exclude Apps** - Never capture from specified applications

### **⚡ Real-Time Monitoring**

#### **🌊 Flow State Indicator**

```
┌─────────────────────────────────────┐
│          CURRENT FLOW STATE         │
├─────────────────────────────────────┤
│                                     │
│    🟢 DEEP FOCUS                   │
│    ████████████████████░░░  85%     │
│                                     │
│    💻 VS Code • 23m 15s            │
│    🎯 No distractions detected      │
│    ⚡ High productivity zone        │
│                                     │
│    Next break recommended: 7m       │
└─────────────────────────────────────┘
```

#### **📊 Live Metrics Dashboard**

- **Focus Quality** - Real-time assessment of concentration level
- **Productivity Score** - Current session efficiency rating
- **Context Switches** - Live count of app/window changes
- **Session Duration** - Time in current activity
- **Energy Level** - Estimated based on activity patterns

---

## 📚 **Table of Contents**

- [⚡ Quick Start](#-quick-start-30-seconds) - Get running in 30 seconds
- [📊 Live Demo](#-live-demo-real-data) - See real workspace data
- [🛠 Installation](#-installation--quick-start) - Multiple install methods
- [👨‍💻 Contributing](#-want-to-contribute) - How to get involved
- [❓ FAQ](#-faq) - Common questions
- [🗺 Roadmap](#-updated-roadmap) - Future plans

---

## 🎯 The Problem

Current time trackers are blind. They see:

```
Active Window: VS Code (3 hours)
```

But miss the complete picture:

```
Active: VS Code (dashboard.tsx)
Background Windows:
├── Chrome (47 tabs)
│   ├── localhost:3000 (testing)
│   ├── React Documentation (reference)
│   └── Stack Overflow (debugging)
├── Terminal (npm run dev)
├── Another VS Code window (backend/api.go)
├── Postman (API testing)
├── Slack (2 unread messages)
└── Spotify (Focus Playlist)

Context: Full-stack development with active debugging
```

## 🎨 What Makes Compass Different

### Complete Workspace Intelligence

Compass captures **EVERYTHING** running on your computer:

<details>
<summary><strong>📋 Click to see detailed workspace data structure</strong></summary>

```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "workspace": {
    "active_window": {
      "app": "Visual Studio Code",
      "title": "dashboard.tsx — compass-frontend",
      "pid": 1234,
      "focus_time": "12m 34s"
    },
    "all_windows": [
      {
        "app": "Visual Studio Code",
        "title": "dashboard.tsx — compass-frontend",
        "status": "ACTIVE",
        "pid": 1234
      },
      {
        "app": "Google Chrome",
        "title": "localhost:3000 - Dashboard",
        "status": "BACKGROUND",
        "pid": 1235,
        "tabs_open": 47
      },
      {
        "app": "Terminal",
        "title": "npm run dev",
        "status": "BACKGROUND",
        "pid": 1236,
        "last_active": "5m ago"
      },
      {
        "app": "Visual Studio Code",
        "title": "server.go — compass-backend",
        "status": "BACKGROUND",
        "pid": 1237
      },
      {
        "app": "Slack",
        "title": "team-engineering",
        "status": "BACKGROUND",
        "pid": 1238,
        "notifications": 2
      },
      {
        "app": "Spotify",
        "title": "Deep Focus - Playlist",
        "status": "BACKGROUND",
        "pid": 1239,
        "playing": true
      }
    ],
    "window_count": 6,
    "context_switches": 12,
    "workspace_complexity": "HIGH"
  }
}
```

</details>

### Smart Categorization (No AI Required)

Compass understands what you're doing by analyzing your window combinations:

| Active Window    | Background Windows            | = Activity                    |
| ---------------- | ----------------------------- | ----------------------------- |
| VS Code          | Chrome (localhost) + Terminal | = **Development & Testing**   |
| Chrome (docs)    | VS Code + Terminal            | = **Learning & Implementing** |
| Slack            | VS Code (with git diff)       | = **Code Review Discussion**  |
| Terminal (git)   | VS Code + Chrome (GitHub)     | = **Version Control**         |
| Chrome (YouTube) | VS Code paused                | = **Tutorial/Learning**       |

## 📸 MVP Features (Available Day 1)

### 1. Complete Window Tracking

- **Active Window**: What has focus right now
- **All Background Windows**: Every single open window
- **Window Relationships**: Which windows work together
- **Focus Duration**: How long each window was active
- **Switch Patterns**: How you move between windows

### 2. Application Intelligence

```go
type WindowInfo struct {
    AppName       string    // "Visual Studio Code"
    WindowTitle   string    // "server.go — my-project"
    ProcessID     int       // 1234
    Status        string    // "ACTIVE" | "BACKGROUND" | "MINIMIZED"
    FocusTime     Duration  // How long it's been active
    LastActive    Time      // When it was last in focus
    Position      Rectangle // Where on screen
    Monitor       int       // Which monitor (multi-monitor support)
}
```

### 3. Smart Context Detection

Without any AI, Compass identifies:

- **Development Sessions**: IDE + localhost + terminal
- **Debugging**: Error in terminal + Stack Overflow + IDE
- **Learning**: Documentation/Tutorial + IDE + note-taking app
- **Communication**: Slack/Discord + code snippets visible
- **Deep Work**: Single app focus for >25 minutes
- **Context Switching**: Rapid window changes

### 4. Local Web Dashboard

Access your stats at `http://localhost:8080` while Compass runs in your terminal:

```
Terminal 1:
┌────────────────────────────────────────────────┐
│ $ compass start                                 │
│ 🧭 Compass v0.1.0 - Workspace Tracker          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ [2024-01-15 10:30:45] Started tracking         │
│ [2024-01-15 10:30:45] Dashboard: localhost:8080│
│ [2024-01-15 10:30:55] Captured 6 windows       │
│ [2024-01-15 10:31:05] Active: VS Code          │
│ [2024-01-15 10:31:15] Captured 7 windows       │
│ Press Ctrl+C to stop tracking                  │
└────────────────────────────────────────────────┘

Browser:
┌────────────────────────────────────────────────┐
│ http://localhost:8080                          │
├────────────────────────────────────────────────┤
│                                                 │
│  Current Workspace Overview                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                 │
│  ACTIVE: VS Code (dashboard.tsx) - 14m 23s     │
│                                                 │
│  BACKGROUND WINDOWS (6):                       │
│  [Interactive dashboard continues...]          │
│                                                 │
└────────────────────────────────────────────────┘
```

## 🛠 **Installation & Development Setup**

### **📊 Full Experience (Backend + Advanced Dashboard)**

#### **🎯 Automatic Setup (Recommended)**

```bash
# One command does everything!
git clone https://github.com/faisalahmedsifat/compass.git
cd compass
./dev-setup.sh              # Sets up everything automatically

# Start development environment
./dev-start.sh               # Starts both backend and frontend

# Access dashboards
open http://localhost:5174   # Advanced React dashboard
open http://localhost:8080   # Basic API interface
```

#### **🛠️ Manual Setup (For Learning)**

```bash
# 1. Clone and setup
git clone https://github.com/faisalahmedsifat/compass.git
cd compass

# 2. Backend Setup (Go)
make deps                    # Install Go dependencies
make build                   # Build compass binary

# 3. Frontend Setup (Node.js/React)
cd dashboard
npm install                  # Install React dependencies
cd ..

# 4. Start both services
# Terminal 1: Backend
./compass start              # Starts API server on :8080

# Terminal 2: Frontend
cd dashboard && npm run dev  # Starts React dev server on :5174

# 5. Access the dashboard
open http://localhost:5174   # Advanced React dashboard
open http://localhost:8080   # Basic API interface
```

### **⚡ Quick Setup (Backend Only)**

```bash
# For basic functionality without advanced dashboard
git clone https://github.com/faisalahmedsifat/compass.git
cd compass && make build && ./compass start
open http://localhost:8080
```

### **🐳 Docker Setup (Coming Soon)**

```bash
# Full stack with one command
docker-compose up -d
open http://localhost:5174
```

### **📦 Production Deployment**

```bash
# Build optimized dashboard
cd dashboard && npm run build

# Build production binary
make build-prod

# Deploy single binary + static assets
./compass start --prod
```

### ✅ **Platform Support:**

- ✅ **macOS** (Intel & Apple Silicon) - Fully tested with accessibility permissions
- ⏳ **Linux** (X11/Wayland support in progress)
- ⏳ **Windows** (Win32 API implementation planned)

### 🛠️ **Prerequisites:**

- **Backend:** Go 1.21+, Make, SQLite
- **Frontend:** Node.js 18+, npm/yarn
- **Development:** Git, Terminal/Command Prompt
- **macOS:** Accessibility permissions for window tracking

### CLI Usage

```bash
# Start tracking (runs in foreground)
compass start

# Start tracking in background
compass start --daemon

# Stop tracking
compass stop

# View quick stats in terminal
compass stats

# Open dashboard in browser
compass dashboard

# Export data
compass export --format json --output workspace-data.json

# Check status
compass status

# View help
compass --help
```

### Running Compass

Compass is designed to be simple:

1. **One command to start**: `compass start`
2. **Runs in your terminal** (or background with `--daemon`)
3. **View stats at**: http://localhost:8080
4. **No GUI app needed**: Pure CLI + web dashboard
5. **Single binary**: No complex installation

### Platform Requirements

**macOS:**

```bash
# Grant accessibility permissions when prompted
# System Preferences > Security & Privacy > Privacy > Accessibility
```

**Linux:**

```bash
# Install window management tools
sudo apt-get install xdotool wmctrl xprop

# For Wayland (modern Linux)
sudo apt-get install wl-clipboard
```

**Windows:**

```bash
# Run as Administrator for full window access
# Windows Defender may ask for permission - allow it
```

## 🎯 What Data You Get (No AI Needed)

### Workspace Snapshot

Every 10 seconds, Compass captures:

- Active window (app, title, duration)
- ALL background windows with their states
- Window arrangement (which monitor, position)
- Process information (PID, memory, CPU)
- Focus transitions and patterns

### Activity Timeline

```
10:00 AM - VS Code (main.go) [ACTIVE]
           Chrome (docs.golang.org) [BACKGROUND]
           Terminal (go run) [BACKGROUND]
           Category: "Go Development"

10:15 AM - Chrome (Stack Overflow) [ACTIVE]
           VS Code (main.go) [BACKGROUND]
           Terminal (error output) [BACKGROUND]
           Category: "Debugging"

10:22 AM - Slack [ACTIVE]
           VS Code (main.go) [BACKGROUND]
           Chrome (GitHub PR) [BACKGROUND]
           Category: "Code Review Discussion"
```

### Daily Summary (No AI)

```
Workspace Patterns - January 15, 2024
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Windows Tracked: 23 unique windows
Average Open Windows: 7 simultaneously
Peak Complexity: 12 windows at 2:30 PM

Top Window Combinations:
1. VS Code + Chrome + Terminal (2h 45m) - Development
2. Chrome + Notion (1h 20m) - Research/Notes
3. Slack + VS Code + GitHub (45m) - Collaboration
4. Single VS Code (35m) - Deep Focus

Context Switches: 34 (every ~14 minutes)
Longest Focus: 47 minutes (VS Code only)
Most Scattered Period: 2:00-3:00 PM (18 switches)

Background Apps Always Running:
- Spotify: 7h 45m (continuous)
- Docker Desktop: 8h (3 containers)
- Slack: 8h (checked 23 times)
```

<details>
<summary><strong>⚙️ Configuration Options</strong></summary>

```yaml
# config.yaml
tracking:
  interval: 10s # How often to capture
  capture_screenshots: true # Visual record
  track_all_windows: true # Not just active window

privacy:
  blur_screenshots: true # Blur sensitive content
  exclude_apps: # Never track these
    - "1Password"
    - "Banking Apps"
  redact_titles: # Hide window titles containing
    - "password"
    - "private"
    - "incognito"

categorization:
  mode: "rules" # Smart rules, no AI needed

storage:
  local_only: true # Never leaves your machine
  retention_days: 30 # Auto-delete old data
  database: "sqlite" # Simple, fast, local
```

</details>

## 🔒 Privacy & Security

### Everything is Local

- ✅ All data stays on your machine
- ✅ No cloud uploads
- ✅ No account required
- ✅ Open source - audit the code yourself

### Privacy Controls

- Exclude sensitive applications
- Blur/redact window titles
- Auto-delete old data
- Export your data anytime

## 🗺 Roadmap

### ✅ Week 1: Core MVP (Ready Now!)

- [ ] Track all windows (active + background)
- [ ] Capture window relationships
- [ ] Smart categorization via rules
- [ ] Real-time dashboard
- [ ] SQLite local storage
- [ ] Privacy controls

### 📋 Week 2: Enhanced Tracking

- [ ] Browser tab extraction (via extension)
- [ ] Terminal command detection
- [ ] Git branch/project detection
- [ ] Network connection tracking
- [ ] Resource usage per app

### 🤖 Week 3: Optional AI Features

- [ ] Local AI with Ollama (optional)
- [ ] Cloud AI integration (optional)
- [ ] Natural language summaries
- [ ] Productivity insights
- [ ] Pattern recognition

### 🚀 Month 2: Power Features

- [ ] Multi-monitor layouts
- [ ] Window relationship graphs
- [ ] Focus flow visualization
- [ ] Time predictions
- [ ] Team sharing (optional)
- [ ] IDE/Browser plugins

## 💻 **Technical Stack & Architecture**

### **🏗️ Full-Stack Design**

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPASS PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Backend (Go)              Frontend (React)                     │
│  ├── CLI Binary            ├── Advanced Dashboard               │
│  ├── REST API (:8080)      ├── Real-time Updates               │
│  ├── WebSocket Server      ├── Timeline Views                  │
│  ├── Window Capture        ├── Analytics Charts                │
│  ├── Smart Categorizer     ├── AI Insights                     │
│  └── SQLite Database       └── Screenshot Gallery              │
│                                                                 │
│  Technologies:             Technologies:                        │
│  • Go 1.21+               • React 18                           │
│  • Gin Web Framework      • TypeScript                         │
│  • GORM (ORM)             • Tailwind CSS                       │
│  • SQLite                 • Vite (Build Tool)                  │
│  • WebSockets             • TanStack Query                     │
│  • AppleScript (macOS)    • Recharts (Charts)                 │
│                           • Lucide Icons                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **📁 Project Structure**

```
compass/
├── 📁 Backend (Go)
│   ├── cmd/compass/main.go           # CLI entry point
│   ├── internal/
│   │   ├── capture/                  # Platform-specific window tracking
│   │   │   ├── engine.go             # Capture orchestration
│   │   │   ├── platform_darwin.go   # macOS (AppleScript + Accessibility)
│   │   │   ├── platform_linux.go    # Linux (X11/Wayland) [WIP]
│   │   │   └── platform_windows.go  # Windows (Win32 API) [Planned]
│   │   ├── processor/                # Data processing & intelligence
│   │   │   └── categorizer.go        # Smart activity categorization
│   │   ├── storage/                  # Data persistence layer
│   │   │   ├── database.go           # SQLite interface & queries
│   │   │   └── migrations.go         # Schema management
│   │   ├── server/                   # Web server & API
│   │   │   ├── server.go             # HTTP/WebSocket server
│   │   │   └── handlers.go           # API endpoints
│   │   └── config/                   # Configuration management
│   │       └── config.go             # Settings & privacy controls
│   ├── pkg/types/                    # Shared type definitions
│   │   └── types.go                  # Core data structures
│   ├── Makefile                      # Build automation
│   └── go.mod                        # Go dependencies
│
├── 📁 Frontend (React)
│   ├── dashboard/
│   │   ├── src/
│   │   │   ├── components/           # React components
│   │   │   │   ├── Dashboard.tsx     # Main dashboard controller
│   │   │   │   ├── TimelineView.tsx  # Google Calendar-like timeline
│   │   │   │   ├── FocusHeatmap.tsx  # Productivity heatmap
│   │   │   │   ├── AppEfficiencyRadar.tsx # App performance radar
│   │   │   │   ├── FlowStateIndicator.tsx # Real-time focus state
│   │   │   │   ├── ProductivityInsights.tsx # AI recommendations
│   │   │   │   └── ScreenshotGallery.tsx # Visual activity timeline
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   │   └── useCompassApi.ts  # API integration & data fetching
│   │   │   ├── types/                # TypeScript definitions
│   │   │   │   └── index.ts          # Frontend data models
│   │   │   └── utils/                # Helper functions
│   │   ├── package.json              # Node.js dependencies
│   │   ├── tailwind.config.js        # Tailwind CSS configuration
│   │   ├── vite.config.ts            # Vite build configuration
│   │   └── tsconfig.json             # TypeScript configuration
│
├── 📁 Documentation
│   ├── README.md                     # This file
│   ├── CONTRIBUTING.md               # Contribution guidelines
│   └── docs/                         # Additional documentation
│
└── 📁 Configuration
    ├── config.yaml.example           # Example configuration
    ├── install.sh                    # Installation script
    └── docker-compose.yml            # Container orchestration [Planned]
```

### Window Tracking Method

```go
// Every 10 seconds
snapshot := CaptureWorkspace()

// Returns
type Workspace struct {
    Active      WindowInfo
    Windows     []WindowInfo  // ALL windows
    Timestamp   time.Time
    Screenshot  []byte        // Optional
}
```

### Categorization Engine (No AI)

```go
func CategorizeActivity(windows []WindowInfo) string {
    active := windows[0]
    background := windows[1:]

    // Smart rule matching
    if hasIDE(active) && hasLocalhost(background) {
        return "Development"
    }
    if hasTerminalError(background) && hasBrowser(active) {
        return "Debugging"
    }
    // ... more rules
}
```

## 🚀 **Quick Start Guide**

### **🎯 For Users (Just Want to Track)**

1. **Clone and build** (30 seconds)

   ```bash
   git clone https://github.com/faisalahmedsifat/compass.git
   cd compass && make build
   ```

2. **Start tracking**

   ```bash
   ./compass start              # Foreground mode
   # Or: ./compass daemon       # Background mode
   ```

3. **View your workspace**
   ```bash
   open http://localhost:8080   # Basic dashboard
   ./compass stats              # Terminal summary
   ```

### **🚀 For Developers (Full Experience)**

1. **Complete setup** (60 seconds)

   ```bash
   git clone https://github.com/faisalahmedsifat/compass.git
   cd compass && ./dev-setup.sh
   ```

2. **Start development environment**

   ```bash
   ./dev-start.sh               # Starts both backend and frontend
   # Or: make dev-start          # Alternative command
   ```

3. **Access advanced dashboard**

   ```bash
   open http://localhost:5174   # Advanced React dashboard
   open http://localhost:8080   # Backend API
   ```

4. **Development commands**
   ```bash
   ./dev-test.sh                # Run all tests
   make dev-check               # Health check
   make lint                    # Code linting
   ```

### **🛠️ Make Commands**

```bash
make help                      # Show all available commands
make dev-setup                 # Setup development environment
make dev-start                 # Start both services
make dev-test                  # Run comprehensive tests
make build                     # Build backend only
make build-frontend            # Build frontend only
```

## 📊 **Live Example Output (Real Data)**

### **Current Session Stats:**

```bash
🧭 Compass Stats - August 21, 2025
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Active Time: 54m 9s
Context Switches: 7
Longest Focus: 2m 30s

Top Categories:
  Development     54m 9s

Top Applications:
  Cursor               53m 9s
  Google Chrome        1m 0s
  System Settings      0s

Recent Windows:
  Google Chrome        🧭 Compass - Workspace Tracker - Google Chrome...
  Cursor               server.go — compass
```

<details>
<summary><strong>📡 Click to see Real-Time API Response</strong></summary>

```json
{
  "active_window": {
    "app_name": "Cursor",
    "title": "server.go — compass",
    "pid": 24178,
    "is_active": true
  },
  "all_windows": [
    {
      "app_name": "Google Chrome",
      "title": "🧭 Compass - Workspace Tracker - Google Chrome - Faisal (scaledx.com)",
      "is_active": false
    },
    {
      "app_name": "Slack",
      "title": "! Lotus (DM) - Scaledx - 1 new item - Slack",
      "is_active": false
    },
    {
      "app_name": "Terminal",
      "title": "hello — faisalahmed@Kazis-Mac-mini — ..ersonal/hello — -zsh — 80×24",
      "is_active": false
    }
  ],
  "window_count": 7,
  "category": "Development",
  "context_switches": 7
}
```

</details>

### **🎯 What This Shows:**

- **Complete context**: IDE + browser + communication tools
- **Real window titles**: Actual file names, URLs, and content
- **Smart categorization**: "Development" detected from Cursor + Chrome combo
- **Privacy respected**: No sensitive data exposed
- **Live tracking**: Updates every 10 seconds

---

## 👨‍💻 **Want to Contribute?**

<div align="center">

### 🌟 **Compass needs YOU!**

We're looking for contributors to help build the ultimate workspace intelligence tool.

| 🎯 **Skill Level**  | 🔧 **Areas**                        | 🚀 **Impact**                     |
| ------------------- | ----------------------------------- | --------------------------------- |
| **🟢 Beginner**     | Documentation, Testing, Bug Reports | High - Help users succeed         |
| **🟡 Intermediate** | Dashboard UI, Categorization Rules  | High - Improve user experience    |
| **🔴 Advanced**     | Linux/Windows Support, AI Features  | Very High - Expand platform reach |

### 📋 **Quick Contribution Paths:**

1. **🐛 Found a bug?** → [Report it](https://github.com/faisalahmedsifat/compass/issues/new?template=bug_report.md) (5 minutes)
2. **💡 Have an idea?** → [Request feature](https://github.com/faisalahmedsifat/compass/issues/new?template=feature_request.md) (5 minutes)
3. **👨‍💻 Want to code?** → [Read CONTRIBUTING.md](CONTRIBUTING.md) (10 minutes)
4. **🧪 Help test?** → Try on your platform and report results (15 minutes)

**[📖 Full Contributing Guide](CONTRIBUTING.md)** | **[🏗️ Browse Source Code](https://github.com/faisalahmedsifat/compass)**

</div>

---

## ❓ FAQ

**Q: Is this a desktop app?**  
A: No! Compass is a simple CLI tool that runs in your terminal. View your stats through the local web dashboard at localhost:8080.

**Q: Does it need to run in the foreground?**  
A: Your choice! Run with `compass start` (foreground) or `compass start --daemon` (background).

**Q: How do I view my data?**  
A: Two ways: Open http://localhost:8080 for the full dashboard, or use `compass stats` for a quick terminal summary.

**Q: Does this work without AI?**  
A: Yes! The MVP uses smart pattern matching to understand your workspace. AI is completely optional for Week 3+.

**Q: What about performance?**  
A: Minimal impact. ~30MB RAM, <1% CPU. It's just a CLI tool with a lightweight web server.

**Q: Can I exclude private windows?**  
A: Yes! Configure exclusions in config.yaml. Sensitive apps are never tracked.

**Q: How is this different from RescueTime/Toggl?**  
A: We track ALL windows and their relationships, not just the active one. Plus, it's a simple CLI tool, not a heavy desktop app.

**Q: Is my data safe?**  
A: 100% local. No servers, no accounts, no uploads. Your data never leaves your machine.

## 🧪 **Current Test Results (Proven Working)**

```bash
# Real workspace captured (as of testing):
🧭 COMPLETE WORKSPACE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ACTIVE] Google Chrome
Title: 🧭 Compass - Workspace Tracker - Google Chrome - Faisal (scaledx.com)
PID: 798

[BACKGROUND] Slack
Title: ! Lotus (DM) - Scaledx - 1 new item - Slack
PID: 4879

[BACKGROUND] Terminal
Title: hello — faisalahmed@Kazis-Mac-mini — ..ersonal/hello — -zsh — 80×24
PID: 14846

[BACKGROUND] Cursor
Title: server.go — compass
PID: 24178

# Live Stats:
Total Active Time: 54+ minutes
Context Switches: 7 detected
Categories: Development (54m), Communication
Windows Tracked: 7 simultaneously
Database: 20+ activities captured
```

## 👨‍💻 **Contributing**

Compass is **production-ready** but we welcome contributions! Here's how to get started:

### 🚀 **Development Setup**

```bash
# 1. Fork and clone
git clone https://github.com/[your-username]/compass.git
cd compass

# 2. Install dependencies
make deps

# 3. Build and test
make build
./compass start

# 4. Verify everything works
make test                    # Run test suite
./compass stats              # Check data capture
open http://localhost:8080   # Test dashboard
```

### 🎯 **Contribution Areas**

#### **🟢 Ready for Contributions:**

- **Linux support** (`internal/capture/platform_linux.go`)
- **Windows support** (`internal/capture/platform_windows.go`)
- **Browser tab extraction** (Chrome/Firefox extensions)
- **Additional categorization rules** (`internal/processor/categorizer.go`)
- **Dashboard improvements** (`internal/server/dashboard.go`)
- **Performance optimizations**
- **Test coverage** (unit & integration tests)

#### **🟡 Advanced Features:**

- **Local AI integration** (Ollama/local LLMs)
- **Multi-monitor support** (window positioning)
- **IDE plugins** (VS Code, etc.)
- **Data export formats** (Toggl, RescueTime compatible)
- **Mobile companion app**

### 📋 **Development Guidelines**

1. **Test your changes thoroughly** - Compass tracks real user data
2. **Privacy first** - Never compromise user privacy or local data
3. **Performance matters** - Keep resource usage minimal
4. **Cross-platform** - Consider Windows/Linux when adding features
5. **Documentation** - Update README for major changes

### 🐛 **Found a Bug?**

```bash
# Get system info for bug reports
./compass status
./compass stats

# Check logs
tail -f ~/.compass/compass.log  # If logging enabled

# Submit with:
# - OS version and platform
# - Compass version (./compass --version)
# - Steps to reproduce
# - Expected vs actual behavior
```

### 💡 **Feature Requests**

Check the [roadmap](#🗺-roadmap) below and submit GitHub issues for:

- New categorization rules
- Additional privacy controls
- Dashboard enhancements
- Integration requests
- Platform support

## 🗺 **Development Roadmap**

### ✅ **Phase 1: Core Platform (COMPLETED!)**

- ✅ Complete window tracking (macOS with accessibility permissions)
- ✅ Real-time categorization and smart pattern detection
- ✅ Local SQLite storage with privacy controls
- ✅ REST API + WebSocket for real-time updates
- ✅ Basic web dashboard for API testing
- ✅ CLI commands and configuration management

### ✅ **Phase 2: Advanced Dashboard (COMPLETED!)**

- ✅ **React/TypeScript frontend** with modern UI
- ✅ **Timeline View** - Google Calendar-like interface (hour/day/week/month)
- ✅ **Advanced Analytics** - Focus heatmaps, app efficiency radar, energy correlations
- ✅ **AI-Powered Insights** - Personalized productivity recommendations
- ✅ **Screenshot Gallery** - Visual context with privacy controls
- ✅ **Real-time Monitoring** - Live flow state and productivity indicators
- ✅ **Responsive Design** - Mobile-friendly interface

### 🚧 **Phase 3: Cross-Platform Expansion (In Progress)**

- ⏳ **Linux Support** - X11/Wayland window tracking implementation
- ⏳ **Windows Support** - Win32 API integration for window management
- ⏳ **Browser Extensions** - Chrome/Firefox tab tracking for deeper insights
- ⏳ **Performance Optimization** - Memory usage and capture efficiency improvements
- ⏳ **Enhanced Privacy** - More granular control and filtering options

### 🔮 **Phase 4: Intelligence & Integrations (Planned)**

- ⏳ **Local AI Integration** - Ollama/LLM-powered insights without cloud dependency
- ⏳ **Advanced Pattern Recognition** - Machine learning for productivity patterns
- ⏳ **IDE Integrations** - VS Code, IntelliJ plugins for developer workflows
- ⏳ **Export Integrations** - Toggl, RescueTime, Google Calendar compatibility
- ⏳ **Team Features** - Optional collaborative insights and sharing

### 🚀 **Phase 5: Ecosystem (Future)**

- ⏳ **Mobile Companion** - iOS/Android apps for comprehensive tracking
- ⏳ **Advanced Analytics** - Predictive insights and goal tracking
- ⏳ **API Ecosystem** - Third-party integrations and plugin architecture
- ⏳ **Enterprise Features** - Team dashboards and organization insights

## 📝 License

MIT License - see [LICENSE](LICENSE) file

---

**🧭 Compass: A simple CLI tool that sees your complete digital workspace.**

_Not a desktop app. Just a lightweight CLI + local dashboard._

---

## 🤝 **Get Involved**

<div align="center">

| 🎯 **Action**            | 🔗 **Link**                                                                                        | 📝 **Description**                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **🐛 Report Bug**        | [Create Issue](https://github.com/faisalahmedsifat/compass/issues/new?template=bug_report.md)      | Found something broken? Let us know!        |
| **💡 Request Feature**   | [Create Issue](https://github.com/faisalahmedsifat/compass/issues/new?template=feature_request.md) | Have an idea? We'd love to hear it!         |
| **👨‍💻 Contribute Code**   | [Contributing Guide](CONTRIBUTING.md)                                                              | Help build the future of workspace tracking |
| **📖 Read Architecture** | [Browse Source Code](https://github.com/faisalahmedsifat/compass)                                  | Understand how Compass works                |
| **💬 Discuss Ideas**     | [GitHub Discussions](https://github.com/faisalahmedsifat/compass/discussions)                      | Community chat and Q&A                      |

**⭐ Star this repo** if Compass is useful to you!

</div>

---

## 📈 **Project Stats**

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Platform](https://img.shields.io/badge/Platform-macOS-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Go Version](https://img.shields.io/badge/Go-1.21+-blue)

**Currently tracking:** 54+ minutes • 7 windows • 11 context switches • Real-time categorization

---

## 🎯 **Ready to Get Started?**

<div align="center">

### Choose Your Path:

**🚀 [Try Compass Now](⚡-quick-start-30-seconds)** • **🐛 [Report a Bug](https://github.com/faisalahmedsifat/compass/issues/new?template=bug_report.md)** • **💡 [Request Feature](https://github.com/faisalahmedsifat/compass/issues/new?template=feature_request.md)** • **👨‍💻 [Contribute](CONTRIBUTING.md)**

---

### 🌟 **Love Compass? Help us grow!**

- ⭐ **Star this repository** if you find it useful
- 🔄 **Share with colleagues** who track productivity
- 🐛 **Report issues** you encounter
- 💡 **Suggest features** you'd like to see
- 👨‍💻 **Contribute code** for Linux/Windows support

---

_Built with ❤️ for developers who want to understand their digital workspace_

**🧭 Compass: Simple CLI • Complete Intelligence • Total Privacy**

</div>
