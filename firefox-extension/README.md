# Compass Firefox Extension

🦊 **Firefox-Optimized Activity Tracker** - Track your browser tab activities with precision in Firefox! This extension captures every tab switch, URL change, and page interaction, sending detailed data to your Compass daemon for comprehensive activity tracking.

## ✨ Features Optimized for Firefox

- **🔥 Real-time tab tracking** - Captures tab switches instantly with Firefox's WebExtensions API
- **📊 Page interaction analysis** - Tracks scrolling, clicks, reading time, and engagement
- **🛡️ Privacy-focused** - Respects Firefox's privacy philosophy and user control
- **💾 Offline resilience** - Stores events locally when Compass daemon is unavailable
- **🦊 Firefox-native UI** - Designed specifically for Firefox's interface and behavior
- **📈 Live statistics** - See real-time stats in the extension popup

## 🚀 Installation

### Method 1: Temporary Installation (Developer Mode)

1. **Open Firefox** and navigate to `about:debugging`
2. **Click "This Firefox"** in the left sidebar
3. **Click "Load Temporary Add-on..."**
4. **Navigate to the `firefox-extension` folder**
5. **Select `manifest.json`**
6. **Click "Open"**

The extension will be loaded temporarily and will be removed when Firefox restarts.

### Method 2: Permanent Installation (Advanced)

For permanent installation, you can pack the extension:

1. **Install web-ext tool**:
   ```bash
   npm install -g web-ext
   ```

2. **Build the extension**:
   ```bash
   cd firefox-extension
   web-ext build
   ```

3. **Install the generated .xpi file** in Firefox

## 🔧 Configuration

The Firefox extension uses the same configuration as the Chrome version:

- **API URL**: `http://localhost:8080/api/v1` (Compass daemon endpoint)
- **Event tracking**: All tab switches, page navigations, and interactions
- **Offline storage**: Local storage with automatic retry when connection is restored
- **Privacy controls**: Respects Firefox's tracking protection settings

## 📊 What Gets Tracked

### Tab Events (Firefox-Specific)
- **Tab activation** - When you switch between open tabs
- **Tab creation** - When you open new tabs (Ctrl+T, middle-click, etc.)
- **Tab closure** - When you close tabs
- **URL navigation** - When you navigate to different pages
- **Window focus changes** - When you switch between Firefox windows

### Page Interactions
- **Scroll behavior** - How far you scroll on each page
- **Click tracking** - User interaction with page elements
- **Keystroke counting** - Text input and form interactions
- **Reading time estimation** - Based on scroll patterns and page content
- **Activity detection** - Distinguishes active vs idle browsing

### Firefox-Specific Metadata
- **Tab context** - Position, pinned status, window association
- **Navigation timing** - Page load and interaction timing
- **Session information** - Firefox session and window management
- **Privacy mode detection** - Respects private browsing (no tracking in private mode)

## 🦊 Firefox-Specific Features

### **1. WebExtensions API Compatibility**
- Uses Firefox's native `browser.tabs` API for optimal performance
- Supports Firefox's permission model and security sandbox
- Compatible with Firefox's multi-process architecture

### **2. Privacy-First Design**
- **No tracking in private browsing** - Automatically disabled in private windows
- **Respects tracking protection** - Works with Firefox's Enhanced Tracking Protection
- **Local data control** - All data stored locally, syncs only with your Compass daemon

### **3. Firefox UI Integration**
- **Native toolbar button** - Integrates seamlessly with Firefox's toolbar
- **Context menu integration** - Right-click options for quick access
- **Keyboard shortcuts** - Firefox-compatible shortcuts for common actions

### **4. Performance Optimized**
- **Lightweight background script** - Minimal impact on Firefox performance
- **Efficient event handling** - Uses Firefox's optimized event system
- **Smart batching** - Groups events to reduce overhead

## 🎛️ Using the Extension

### Extension Popup

Click the Compass icon (🧭) in Firefox's toolbar to see:

- **🟢 Connection Status** - Green: Connected to Compass daemon
- **📊 Daily Statistics** - Tabs tracked, events sent, pending events
- **⏱️ Current Session** - Time spent on current tab
- **🔗 Quick Actions** - Open dashboard, manage settings

### Browser Integration

The extension provides:
- **Real-time tracking** visible in the Compass dashboard
- **Tab title display** with domain and page information
- **Activity categorization** as "Browser" activities
- **Seamless workflow tracking** integrated with other Compass extensions

## 🔧 Troubleshooting

### Extension shows "Disconnected"

1. **Check Compass daemon**: Visit `http://localhost:8080/api/health` in Firefox
2. **Verify ports**: Ensure port 8080 is not blocked
3. **Check permissions**: Make sure the extension has necessary permissions
4. **Restart Firefox**: Reload the extension if needed

### Events not appearing in dashboard

1. **Check extension popup**: Look for pending events count
2. **Verify API endpoint**: Ensure Compass daemon is running on correct port
3. **Check browser console**: Look for error messages in developer tools
4. **Test connection**: Try opening dashboard directly

### Performance issues

1. **Check event frequency**: Extension is optimized for minimal impact
2. **Review permissions**: Ensure only necessary permissions are granted
3. **Monitor memory usage**: Extension uses efficient event handling
4. **Update Firefox**: Use recent Firefox version for best performance

## 🔄 Dashboard Integration

Once installed, you'll see in your Compass dashboard:

- **🌐 Firefox tab activities** clearly labeled with browser type
- **⏱️ Accurate timing** for each tab and website
- **📈 Website usage patterns** showing your browsing habits
- **🔄 Context switches** between browser tabs and other applications
- **📊 Productivity insights** based on browsing vs work activities

### Example Dashboard Data

```json
{
  "app_name": "Firefox",
  "window_title": "Compass Documentation - GitHub",
  "focus_duration": 127,
  "category": "Browser",
  "browser": "firefox",
  "url": "https://github.com/user/compass",
  "domain": "github.com"
}
```

## 🆚 Firefox vs Chrome Extension

| Feature | Firefox Extension | Chrome Extension |
|---------|------------------|------------------|
| **Manifest Version** | v2 (stable) | v3 (modern) |
| **API Compatibility** | `browser.*` API | `chrome.*` API |
| **Privacy Focus** | Enhanced privacy controls | Standard privacy |
| **Performance** | Firefox-optimized | Chrome-optimized |
| **Permissions** | Granular control | Standard permissions |
| **Installation** | about:debugging | chrome://extensions |

## 🔗 Integration with Compass Ecosystem

This Firefox extension works seamlessly with:

- **🖥️ Compass Daemon** - Window-level activity tracking
- **💻 VS Code Extension** - File-level development tracking  
- **🌐 Chrome Extension** - Multi-browser support
- **📊 Dashboard Analytics** - Unified activity insights

Together, these provide **complete digital workflow visibility**:

1. **Firefox tab switch** → Firefox extension captures
2. **Switch to VS Code** → Daemon captures window switch
3. **File change in editor** → VS Code extension captures
4. **Back to Firefox** → Complete transition tracked

## 🎯 Perfect Firefox Workflow Tracking

**Scenario**: Research → Documentation → Coding

1. **🔍 Firefox research tabs** → Extension tracks each page and time spent
2. **📖 Read documentation** → Page interaction and scroll depth captured
3. **💻 Switch to VS Code** → Daemon captures application switch
4. **📝 Edit code files** → VS Code extension tracks file-level activity
5. **🌐 Back to Firefox for reference** → Complete workflow captured

**Result**: Perfect visibility into your research and development workflow with Firefox as your primary browser.

## 📥 Installation Summary

```bash
# 1. Ensure Compass daemon is running
./compass-daemon

# 2. Install Firefox extension
# - Open about:debugging in Firefox
# - Load Temporary Add-on
# - Select firefox-extension/manifest.json

# 3. Verify connection
# - Click Compass icon in Firefox toolbar
# - Check for green "Connected" status
# - Visit http://localhost:8080 to see dashboard

# 4. Start browsing!
# - All tab switches now tracked
# - View activity in real-time dashboard
```

## 🦊 Why Firefox?

If Firefox is your primary browser, this extension ensures:
- **🎯 Perfect compatibility** with Firefox's architecture
- **🛡️ Enhanced privacy** respecting Firefox's privacy philosophy  
- **⚡ Optimal performance** using Firefox-native APIs
- **🔧 Better integration** with Firefox's developer tools
- **📊 Complete activity coverage** for your primary browsing environment

Install this Firefox extension to complete your Compass activity tracking setup and gain unprecedented insights into your Firefox-based digital workflow!
