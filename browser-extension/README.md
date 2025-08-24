# Compass Browser Extension

Track your browser tab activities with precision! This extension captures every tab switch, URL change, and page interaction, sending detailed data to your Compass daemon for comprehensive activity tracking.

## ✨ Features

- **Real-time tab tracking** - Captures tab switches instantly (no more missed activities!)
- **Page interaction analysis** - Tracks scrolling, clicks, reading time, and engagement
- **Idle detection** - Only counts active browsing time
- **Offline resilience** - Stores events locally when Compass daemon is unavailable
- **Privacy-focused** - Only tracks what you configure, respects private/incognito modes
- **Live statistics** - See real-time stats in the extension popup

## 🚀 Installation

### 1. Build the Extension

No build step needed - the extension is ready to use as-is.

### 2. Install in Chrome/Chromium

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The Compass extension should now appear in your extensions list

### 3. Install in Firefox

1. Open Firefox and go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select any file in the `browser-extension` folder
5. The extension will be loaded temporarily

### 4. Install in Edge

1. Open Edge and go to `edge://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `browser-extension` folder

## 🔧 Setup & Configuration

### 1. Start Compass Daemon

Make sure your Compass daemon is running:

```bash
cd /path/to/compass
./compass-daemon
```

The daemon should be accessible at `http://localhost:8080`

### 2. Test Connection

1. Click the Compass extension icon in your browser toolbar
2. You should see a green dot and "Connected to Compass"
3. If you see "Disconnected", check that your Compass daemon is running

### 3. Verify Data Flow

1. Switch between a few tabs
2. Check the extension popup to see live statistics
3. Open the Compass dashboard at `http://localhost:8080` to see browser activities

## 📊 What Gets Tracked

### Tab Events
- **Tab switches** - When you change from one tab to another
- **Tab opens** - When you open new tabs
- **Tab closes** - When you close tabs
- **URL changes** - When you navigate to different pages

### Page Interactions
- **Scroll depth** - How far you scroll on each page
- **Click tracking** - Number of clicks per page
- **Keystroke counting** - Text input activity
- **Reading time estimation** - Based on page content and scroll behavior
- **Active vs idle time** - Only counts when you're actively using the page

### Metadata Captured
- Page title and URL
- Domain information
- Time spent on each tab
- Browser type (Chrome, Firefox, etc.)
- Tab position and window information

## 🔒 Privacy & Security

- **No sensitive data** - Passwords, private browsing content, and sensitive forms are never captured
- **Local storage** - Failed requests are stored locally and retried later
- **Configurable filtering** - You can exclude specific sites or patterns
- **No external servers** - All data goes directly to your local Compass daemon

## 🎛️ Extension Popup

Click the extension icon to see:

- **Connection status** - Green (connected) or red (disconnected)
- **Daily statistics** - Tabs tracked, events sent, pending events
- **Current session** - Time spent on current tab
- **Quick actions** - Open dashboard, settings

## 🔧 Troubleshooting

### Extension shows "Disconnected"

1. Check if Compass daemon is running: `http://localhost:8080/api/health`
2. Verify the daemon is listening on port 8080
3. Check browser console for error messages

### Events not appearing in dashboard

1. Check extension popup for pending events
2. Look at Compass daemon logs for error messages
3. Verify API endpoints are responding

### High CPU usage

1. The extension is designed to be lightweight
2. Events are throttled and batched to minimize performance impact
3. If issues persist, check for JavaScript errors in browser console

## 🛠️ Development

### File Structure

```
browser-extension/
├── manifest.json          # Extension configuration
├── background.js          # Main tracking logic
├── content.js            # Page interaction tracking  
├── popup.html            # Extension popup UI
├── popup.js              # Popup functionality
└── README.md             # This file
```

### Adding New Features

1. **New event types**: Add to `background.js` event handlers
2. **UI changes**: Modify `popup.html` and `popup.js`
3. **Page tracking**: Update `content.js` for new interactions
4. **API changes**: Update server endpoints in `/internal/server/`

### Testing

1. Load the extension in developer mode
2. Open browser developer tools
3. Check Console tab for extension logs
4. Use Network tab to verify API calls

## 🔄 Integration with Compass

The extension sends data to these API endpoints:

- `POST /api/v1/events/browser` - Tab switch events
- `POST /api/v1/events/page-activity` - Page interaction data  
- `GET /api/v1/health` - Connection health check

## 📈 Analytics

Once installed, you'll see:

- **Accurate tab timing** - Down to the second
- **Website usage patterns** - Most visited sites, time per domain
- **Browsing productivity** - Reading vs browsing time
- **Context switches** - How often you switch between sites
- **Deep work sessions** - Extended focus periods on single sites

## 🎯 Next Steps

1. Install the extension following the steps above
2. Test with your normal browsing patterns
3. Check the Compass dashboard for browser activity data
4. Consider installing the VS Code/Cursor extension for complete coverage

This extension is part of the comprehensive Compass activity tracking system. Combined with the daemon's window tracking and optional editor extensions, you'll have complete visibility into your digital work patterns!
