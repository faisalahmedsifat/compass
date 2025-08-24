# Compass VS Code Extension

Track your coding activity at the file level! This extension captures every file switch, time spent coding, and detailed development patterns, sending data to your Compass daemon for comprehensive productivity insights.

## ✨ Features

- **Real-time file tracking** - Captures every file switch instantly
- **Accurate time measurement** - Precise timing down to the second
- **Language-aware tracking** - Knows what programming languages you're using
- **Keystroke and selection tracking** - Measures actual coding activity
- **Workspace-aware** - Tracks across multiple projects and folders
- **Status bar integration** - See current file time at a glance
- **Offline resilience** - Stores data locally when Compass daemon is unavailable

## 🚀 Installation

### Method 1: Install from Source (Recommended)

1. **Ensure Compass daemon is running**:
   ```bash
   cd /path/to/compass
   ./compass-daemon
   ```

2. **Install the extension**:
   ```bash
   # Copy the extension to VS Code extensions folder
   cp -r vscode-extension ~/.vscode/extensions/compass-activity-tracker
   
   # Restart VS Code
   ```

3. **Alternative installation**:
   - Open VS Code
   - Press `Ctrl+Shift+P` (Cmd+Shift+P on Mac)
   - Type "Extensions: Install from VSIX"
   - Navigate to the `vscode-extension` folder
   - Select `package.json` and install

### Method 2: Developer Mode

1. **Open VS Code**
2. **Go to Extensions** (`Ctrl+Shift+X`)
3. **Click the three dots menu** → "Install from VSIX..."
4. **Navigate to** the `vscode-extension` folder
5. **Click Install**

## 🔧 Configuration

Open VS Code settings (`Ctrl+,`) and search for "compass":

```json
{
  "compass.apiUrl": "http://localhost:8080/api/v1",
  "compass.enabled": true,
  "compass.trackKeystrokes": true,
  "compass.trackSelections": true,
  "compass.minFileTime": 5
}
```

### Settings Explained

- **`compass.apiUrl`** - Compass daemon API endpoint (default: `http://localhost:8080/api/v1`)
- **`compass.enabled`** - Enable/disable activity tracking (default: `true`)
- **`compass.trackKeystrokes`** - Count keystrokes per file (default: `true`)  
- **`compass.trackSelections`** - Track text selections and cursor movements (default: `true`)
- **`compass.minFileTime`** - Minimum seconds in a file before tracking (default: `5`)

## 📊 What Gets Tracked

### File Events
- **File switches** - When you change between open files
- **File opens** - When you open new files
- **File closes** - When you close files
- **Workspace changes** - When you switch projects/folders

### Activity Metrics
- **Time spent** - Precise timing for each file
- **Keystroke count** - Actual typing activity per file
- **Text selections** - Cursor movements and text selection frequency
- **Language detection** - Automatic programming language identification
- **Line count** - File size context

### Metadata Captured
- **File paths** - Full file location information
- **Programming languages** - TypeScript, Python, Go, etc.
- **Workspace context** - Project/folder information
- **Editor details** - VS Code version, theme, platform

## 🎛️ Using the Extension

### Status Bar

Look for the compass icon `$(compass)` in your status bar:

- **"Ready"** - Extension loaded and waiting
- **"filename.js (45s)"** - Currently tracking file with time
- **"Disabled"** - Tracking is turned off

Click the status bar item to see session stats.

### Commands

Access these via Command Palette (`Ctrl+Shift+P`):

- **`Compass: Show Stats`** - Display session statistics
- **`Compass: Open Dashboard`** - Open Compass web dashboard  
- **`Compass: Toggle Tracking`** - Enable/disable tracking

### Session Statistics

```
Compass Session Stats:
📁 Files opened: 12
⌨️ Keystrokes: 1,847
📝 Selections: 234
⏱️ Active time: 2,341s
🔄 Current file: 67s
```

## 🔒 Privacy & Security

- **Local data only** - All data goes to your local Compass daemon
- **No external servers** - No data leaves your machine
- **Configurable tracking** - Turn off keystrokes/selections if desired
- **File content not tracked** - Only metadata and activity patterns
- **Workspace respect** - Only tracks files within your VS Code workspace

## 🔧 Troubleshooting

### Extension shows "Disabled" in status bar

1. Check settings: `"compass.enabled": true`
2. Use Command Palette: `Compass: Toggle Tracking`
3. Restart VS Code

### No data appearing in Compass dashboard

1. **Check connection**: Verify Compass daemon is running at `http://localhost:8080`
2. **Check logs**: Open VS Code Developer Console (`Help` → `Toggle Developer Tools`)
3. **Test API**: Visit `http://localhost:8080/api/v1/health` in browser
4. **Check settings**: Ensure API URL is correct

### High CPU usage

1. **Adjust tracking**: Disable keystroke tracking if not needed
2. **Increase min file time**: Set higher threshold to reduce noise
3. **Check for errors**: Look in VS Code Developer Console

### Events not being sent

1. **Network issues**: Check if Compass daemon is accessible
2. **Pending events**: Extension stores failed events locally and retries
3. **Restart extension**: Use Command Palette → `Developer: Reload Window`

## 📈 Dashboard Integration

Once installed, you'll see in your Compass dashboard:

- **File-level timing** - Exact time spent in each file
- **Language breakdown** - Time per programming language  
- **Project patterns** - Which files/projects you work on most
- **Coding intensity** - Keystrokes and activity levels
- **Context switches** - How often you switch between files
- **Deep work sessions** - Extended focus on single files

### Example Dashboard Data

```json
{
  "app_name": "Visual Studio Code",
  "window_title": "server.go (go)",
  "focus_duration": 127,
  "category": "Development - Go",
  "keystrokes": 89,
  "language": "go"
}
```

## 🔄 Data Flow

```
VS Code File Switch
     ↓
Extension Captures Event
     ↓
Send to Compass API
     ↓
Compass Daemon Processes
     ↓
Store in Database
     ↓
Display in Dashboard
```

## 🛠️ Development

### File Structure

```
vscode-extension/
├── package.json          # Extension manifest
├── extension.js          # Main extension logic
└── README.md             # This file
```

### Adding Features

1. **New tracking events**: Add listeners in `setupEventListeners()`
2. **New data points**: Modify event structures sent to API
3. **UI changes**: Update status bar or add new commands
4. **Settings**: Add new configuration options in `package.json`

### Testing

1. **Load in development**: `F5` to open Extension Development Host
2. **Check logs**: Use Developer Console for debugging
3. **API testing**: Verify data reaches Compass daemon logs
4. **Dashboard verification**: Check data appears correctly

## 🎯 Perfect Integration

This extension works seamlessly with:

- **Browser extension** - Track tab switches + file switches
- **Compass daemon** - Window-level + file-level tracking
- **Dashboard analytics** - Complete development workflow visibility

Together, these provide **complete coverage** of your development workflow:

1. **Switch browser tab** → Browser extension captures
2. **Switch to VS Code** → Daemon captures window switch  
3. **Switch files** → VS Code extension captures file switch
4. **Edit code** → Extension tracks keystrokes and time
5. **Switch back to browser** → Both extensions capture transition

## 📊 Analytics You'll Get

- **File-level productivity** - Which files/languages are most productive
- **Context switching patterns** - How file switches affect productivity  
- **Deep work identification** - Long focus sessions on single files
- **Language preferences** - Time distribution across programming languages
- **Project insights** - Most active projects and files
- **Coding rhythm** - Daily/weekly development patterns

Install this extension to complete your Compass activity tracking setup and gain unprecedented insights into your development workflow!
