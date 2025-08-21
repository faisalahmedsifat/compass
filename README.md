
# 🧭 Compass

**The time tracker that actually understands what you're doing.**

Compass doesn't just track that you used "Chrome" for 4 hours. It understands you spent 47 minutes debugging a React hook, 23 minutes reading documentation, 15 minutes on Stack Overflow finding the solution, and yes, 8 minutes on Twitter when you got frustrated.

## 🚀 Current Status: Building MVP

- [ ] Basic screen capture and window tracking
- [ ] Real-time dashboard
- [ ] Intelligent activity recognition (Week 1)
- [ ] AI-powered summarization (Week 2)
- [ ] Pattern insights and productivity analytics (Week 3)

## 🎯 The Problem

Every time tracker today is fundamentally broken. They tell you:
```
VS Code     - 6 hours
Chrome      - 3 hours  
Slack       - 1 hour
```

But what you actually need to know is:
```
Implementing payment processing - 2h 35m
├── Writing payment service - 1h 20m
├── Debugging Stripe webhook - 45m
├── Reading Stripe documentation - 20m
└── Writing integration tests - 10m

Researching React performance - 1h 15m
├── Reading React docs - 30m
├── Watching YouTube tutorial - 25m
└── Testing optimizations locally - 20m
```

## 🎨 What Makes Compass Different

### 1. **Context-Aware Tracking**
Compass understands the relationship between your windows. When you have VS Code open with `payment_service.go`, Chrome tabs with Stripe docs, and a terminal running tests - it knows you're implementing payment processing, not just "using 3 apps."

### 2. **Intelligent Categorization**
Using local AI (your data never leaves your machine), Compass understands:
- The difference between debugging and developing
- When you're learning vs. implementing
- If you're in deep work or context-switching
- Whether that YouTube video is procrastination or a tutorial

### 3. **Full Workspace Intelligence**
- **Active Window**: What you're directly working on
- **Background Context**: All open apps and their states
- **Browser Intelligence**: All 47 tabs and which ones actually matter
- **Hidden Services**: Docker containers, dev servers, build processes

### 4. **Privacy First**
- 100% local processing - your data never leaves your machine
- Automatic redaction of sensitive information
- User-defined privacy rules
- Screenshots stay on your device

## 📸 What Compass Captures

Every 10-30 seconds (adaptive based on activity), Compass captures:

```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "active_window": {
    "app": "VS Code",
    "title": "dashboard.tsx - my-project",
    "project": "my-project",
    "file": "components/dashboard.tsx",
    "git_branch": "feature/user-dashboard"
  },
  "browser_context": {
    "total_tabs": 47,
    "active_tabs": [
      "localhost:3000 - Dashboard",
      "React Hooks documentation",
      "Stack Overflow - useEffect cleanup"
    ]
  },
  "background_apps": [
    "Docker - 3 containers running",
    "Node.js - dev server on :3000",
    "Spotify - Coding playlist"
  ],
  "activity_classification": "Development: Frontend Implementation"
}
```

## 🛠 Installation

### Quick Start (MVP)

```bash
# Clone the repository
git clone https://github.com/yourusername/compass.git
cd compass

# Install dependencies
go mod download

# Run Compass
go run main.go

# Open dashboard
open http://localhost:8080
```

### Requirements

- Go 1.21+
- macOS, Linux, or Windows
- Screen recording permissions (you'll be prompted)

### Platform-Specific Setup

**macOS:**
```bash
# No additional setup needed
# Grant screen recording permission when prompted
```

**Linux:**
```bash
sudo apt-get install xdotool xprop wmctrl
```

**Windows:**
```bash
# Run as administrator for best results
```

## 🗺 Roadmap

### Phase 1: Foundation (Week 1) ✅
- [x] Screen capture system
- [x] Window and app tracking  
- [x] SQLite storage
- [x] Basic web dashboard
- [ ] Cross-platform window detection

### Phase 2: Intelligence (Week 2)
- [ ] OCR for text extraction
- [ ] Activity categorization engine
- [ ] Browser tab tracking (via extension)
- [ ] Project detection from git/file paths
- [ ] Basic pattern recognition

### Phase 3: Understanding (Week 3)
- [ ] Local LLM integration (Ollama)
- [ ] Intelligent activity summarization
- [ ] Context relationship mapping
- [ ] Productivity scoring algorithm
- [ ] Distraction detection

### Phase 4: Insights (Week 4)
- [ ] Daily/weekly reports
- [ ] Pattern insights ("You debug faster after reading docs")
- [ ] Productivity recommendations
- [ ] Focus time analysis
- [ ] Time prediction ("This task usually takes you 2 hours")

### Phase 5: Advanced Features (Month 2)
- [ ] Multi-monitor support
- [ ] Team features (optional sharing)
- [ ] IDE plugins for deeper integration
- [ ] API for other tools
- [ ] Mobile app for reviews
- [ ] Export to standard time tracking formats

## 📊 What You'll See

### Daily Summary
```
Today: January 15, 2024

Deep Work Sessions: 3 (Total: 4h 23m)
- Morning: Payment implementation (2h 15m)
- Afternoon: Bug fixing (1h 20m)  
- Evening: Code review (48m)

Context Switches: 12 (23% less than average)

Most Productive Period: 9:00 AM - 11:15 AM
Biggest Time Sink: Debugging connection pool issue (1h 10m)

Insights:
- You spent 40% less time on documentation today
- Your commit frequency increased after coffee at 2 PM
- Consider batching Slack checks (checked 18 times)
```

### Weekly Patterns
```
Your Work DNA:

Peak Performance: Tuesday/Thursday mornings
Deep Work Sweet Spot: 2-3 hour blocks
Optimal Break Pattern: Every 47 minutes
Best Focus Music: Lo-fi hip hop (2.3x longer sessions)

Recommendations:
- Schedule complex work for Tuesday mornings
- Block Slack during your 9-11 AM peak time
- Your "quick checks" average 12 minutes, not 2
```

## 🔒 Privacy & Security

- **100% Local**: All processing happens on your machine
- **No Cloud**: Your data never leaves your device
- **Automatic Redaction**: Passwords, keys, and sensitive data are automatically blurred
- **User Control**: Define custom privacy rules
- **Open Source**: Audit the code yourself

## 🤝 Contributing

Compass is open source and welcomes contributions! 

```bash
# Fork the repo
# Create your feature branch
git checkout -b feature/amazing-feature

# Commit your changes
git commit -m 'Add some amazing feature'

# Push to the branch
git push origin feature/amazing-feature

# Open a Pull Request
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 🚦 Getting Started

1. **Install Compass** (2 minutes)
2. **Let it run for a day** (passive)
3. **Check your dashboard** (prepare to be surprised)
4. **See where your time actually goes** (enlightening)
5. **Make informed changes** (life-changing)

## 💭 Philosophy

We believe that understanding how you actually work - not how you think you work - is the first step to meaningful productivity improvements. Compass shows you the truth about your work patterns, without judgment, so you can make informed decisions about your time.

## 🎯 Vision

Imagine if your computer could tell you:
- "You're about to make the same mistake you made last Tuesday"
- "Based on your patterns, this task will take 2 hours, not 30 minutes"
- "You focus 3x better with that specific playlist"
- "You should take a break now - your error rate is climbing"
- "This is exactly how you solved this problem 3 months ago"

That's where Compass is heading.

## 📧 Contact

- Issues: [GitHub Issues](https://github.com/yourusername/compass/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/compass/discussions)
- Twitter: [@compass_app](https://twitter.com/compass_app)

---

**🧭 Compass: Navigate your time with intention.**

*Currently tracking: 0 developers*  
*Time saved: 0 hours*  
*Insights generated: 0*

[Install Compass](#-getting-started) | [View Demo](https://compass-demo.com) | [Read Docs](https://docs.compass-app.com)