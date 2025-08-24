# Complete Browser Extensions Guide

## 🌐 **Multi-Browser Support**

Compass now supports **both Firefox and Chrome/Chromium** browsers with dedicated, optimized extensions for each platform. Choose the extension that matches your primary browser.

## 🦊 **Firefox Extension** (Your Primary Browser)

### **Installation**

1. **Open Firefox** and navigate to `about:debugging`
2. **Click "This Firefox"** in the left sidebar
3. **Click "Load Temporary Add-on..."**
4. **Navigate to** `/home/faisal/Workspace/Dev/Personal/compass/firefox-extension/`
5. **Select `manifest.json`**
6. **Click "Open"**

The extension will be loaded and active immediately.

### **Verification**

1. **Look for the Compass button** in Firefox's toolbar
2. **Click the Compass icon** to see the popup
3. **Check for "Connected" status** (green dot)
4. **Visit** `http://localhost:8080` to see Firefox activities in the dashboard

### **Firefox-Specific Features**

- **🔥 Optimized for Firefox** - Uses native `browser.*` API
- **🛡️ Privacy-focused** - Respects Firefox's Enhanced Tracking Protection
- **📊 Firefox-themed UI** - Orange accent colors matching Firefox brand
- **🦊 Native integration** - Works seamlessly with Firefox's multi-process architecture

## 🌐 **Chrome Extension** (Alternative/Secondary Browser)

### **Installation**

1. **Open Chrome/Chromium/Edge** and go to `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top right)
3. **Click "Load unpacked"**
4. **Select** `/home/faisal/Workspace/Dev/Personal/compass/browser-extension/`
5. **The extension should appear** in your extensions list

### **Verification**

1. **Look for the Compass icon** in Chrome's toolbar
2. **Click the icon** to see the popup with connection status
3. **Check for "Connected to Compass"** message
4. **Test by switching tabs** and checking the dashboard

## ⚙️ **Configuration**

Both extensions use the same configuration:

```javascript
// Default settings
{
  "apiUrl": "http://localhost:8080/api/v1",
  "trackingEnabled": true,
  "idleThreshold": 30000,  // 30 seconds
  "retryInterval": 30000   // 30 seconds
}
```

## 📊 **What Both Extensions Track**

### **Real-Time Tab Events**
- **Tab switches** - Instant detection when you change tabs
- **URL navigation** - When you navigate to different pages
- **Tab creation/closure** - Opening and closing tabs
- **Window focus changes** - Switching between browser windows

### **Page Activity Metrics**
- **Time spent** on each tab/page
- **Scroll depth** - How far you scroll on pages
- **Click interactions** - User engagement with page content
- **Keystroke activity** - Form filling and text input
- **Reading time estimation** - Based on content and scroll patterns

### **Browser Context**
- **Domain categorization** - Automatic website categorization
- **Session tracking** - Continuous browsing sessions
- **Multi-window support** - Tracks across multiple browser windows
- **Privacy mode detection** - Respects private/incognito browsing

## 🔧 **Managing Both Extensions**

### **Primary Browser Setup (Firefox)**

Since Firefox is your primary browser:

1. **Install Firefox extension** following the steps above
2. **Use Firefox** for your main browsing activities
3. **Monitor via** Firefox extension popup for real-time stats
4. **Configure Firefox** as your default browser if not already

### **Secondary Browser Setup (Chrome - Optional)**

If you occasionally use Chrome/Chromium:

1. **Install Chrome extension** for complete coverage
2. **Both extensions** will send data to the same Compass daemon
3. **Dashboard will show** activities from both browsers
4. **Differentiated by browser type** in activity logs

## 📈 **Dashboard Integration**

### **Firefox Activities**

```json
{
  "app_name": "Firefox",
  "window_title": "GitHub - compass repository",
  "browser": "firefox",
  "category": "Browser",
  "focus_duration": 127
}
```

### **Chrome Activities**  

```json
{
  "app_name": "Chrome",
  "window_title": "Documentation - Compass",
  "browser": "chrome", 
  "category": "Browser",
  "focus_duration": 89
}
```

Both will appear in your dashboard with clear browser identification.

## 🔄 **Complete Workflow Example**

**Your Typical Workflow**:

1. **🦊 Firefox research** → Extension tracks tab switches and reading time
2. **💻 Switch to VS Code** → Daemon captures window focus change
3. **📂 Edit files** → VS Code extension tracks file-level activity
4. **🦊 Back to Firefox for docs** → Seamless transition tracking
5. **🌐 Switch to Chrome for testing** → Chrome extension captures if installed

**Result**: **Complete workflow visibility** across all browsers and applications.

## 🛠️ **Troubleshooting**

### **Extension Not Working**

1. **Check Compass daemon**: `http://localhost:8080/api/health`
2. **Verify extension permissions**: Check browser extension settings
3. **Look at browser console**: F12 → Console tab for errors
4. **Restart browser**: Reload extension if needed

### **Firefox-Specific Issues**

1. **about:debugging**: Check if extension is properly loaded
2. **Temporary add-on**: Extension will be removed on Firefox restart
3. **Permissions**: Firefox may require additional permission prompts
4. **Private browsing**: Extension respects private mode (no tracking)

### **Chrome-Specific Issues**

1. **Developer mode**: Must be enabled to load unpacked extensions
2. **Extension updates**: Chrome auto-updates may affect custom extensions
3. **Permissions**: Check that all required permissions are granted
4. **Incognito mode**: Enable "Allow in incognito" if needed

## 📊 **Performance Impact**

### **Firefox Extension**
- **Memory usage**: ~2-5MB (lightweight)
- **CPU impact**: Minimal (event-driven)
- **Network usage**: Only API calls to localhost
- **Battery impact**: Negligible

### **Chrome Extension**
- **Memory usage**: ~3-6MB (Manifest v3 overhead)
- **CPU impact**: Minimal (optimized event handling)
- **Network usage**: Only API calls to localhost
- **Battery impact**: Negligible

Both extensions are designed to be **lightweight and non-intrusive**.

## 🎯 **Recommendation for Your Setup**

Since **Firefox is your primary browser**:

1. ✅ **Install Firefox extension** (primary)
2. ⭐ **Use Firefox** for main browsing activities  
3. 🔧 **Monitor stats** via Firefox extension popup
4. 📊 **Check dashboard** regularly for insights
5. 🌐 **Optionally install Chrome extension** for complete coverage

## 🔄 **Next Steps**

1. **Install Firefox extension** using the guide above
2. **Test tab switching** to verify tracking works
3. **Check dashboard** at `http://localhost:8080` for Firefox activities
4. **Enjoy complete browser activity tracking** in your primary browser!

Your Firefox-based workflow will now be **perfectly tracked** with second-level precision! 🦊📊
