// Compass Browser Extension - Background Script
// Tracks tab activities and sends to Compass daemon

class CompassTracker {
  constructor() {
    this.compassApiUrl = 'http://localhost:8080/api/v1';
    this.currentTab = null;
    this.tabStartTime = null;
    this.stats = {
      tabsTracked: 0,
      eventsSent: 0,
      pageActivities: 0
    };
    this.setupEventListeners();
    this.loadStats();
  }

  setupEventListeners() {
    // Track tab activation (switching to different tab)
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabChange(activeInfo.tabId);
    });

    // Track tab updates (URL changes, page loads)
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        this.handleTabChange(tabId, tab);
      }
    });

    // Track window focus changes
    chrome.windows.onFocusChanged.addListener((windowId) => {
      if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        chrome.tabs.query({active: true, windowId: windowId}, (tabs) => {
          if (tabs.length > 0) {
            this.handleTabChange(tabs[0].id, tabs[0]);
          }
        });
      }
    });

    // Track tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      if (this.currentTab && this.currentTab.id === tabId) {
        this.recordTabActivity(this.currentTab, true); // Mark as closed
        this.currentTab = null;
      }
    });
  }

  async handleTabChange(tabId, tabInfo = null) {
    try {
      // Record activity for previous tab
      if (this.currentTab && this.currentTab.id !== tabId) {
        await this.recordTabActivity(this.currentTab);
      }

      // Get current tab info if not provided
      if (!tabInfo) {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs.length > 0) {
          tabInfo = tabs[0];
        }
      }

      if (tabInfo) {
        this.currentTab = tabInfo;
        this.tabStartTime = Date.now();
        this.stats.tabsTracked++;
        this.saveStats();
        
        // Send tab switch event to Compass
        await this.sendTabEvent('switch', tabInfo);
      }
    } catch (error) {
      console.error('Error handling tab change:', error);
    }
  }

  async recordTabActivity(tab, isClosed = false) {
    if (!tab || !this.tabStartTime) return;

    const duration = Date.now() - this.tabStartTime;
    
    // Only record if user spent more than 1 second on the tab
    if (duration > 1000) {
      await this.sendTabEvent(isClosed ? 'close' : 'blur', tab, duration);
    }
  }

  async sendTabEvent(eventType, tab, duration = 0) {
    try {
      const event = {
        type: 'browser_tab',
        timestamp: new Date().toISOString(),
        event_type: eventType,
        tab: {
          id: tab.id,
          url: tab.url,
          title: tab.title,
          favIconUrl: tab.favIconUrl,
          windowId: tab.windowId,
          index: tab.index,
          pinned: tab.pinned
        },
        duration_ms: duration,
        browser: 'chrome' // Could be detected dynamically
      };

      // Send to Compass daemon
      await fetch(`${this.compassApiUrl}/events/browser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      console.log('Sent tab event:', eventType, tab.title);
      this.stats.eventsSent++;
      this.saveStats();
    } catch (error) {
      console.error('Failed to send tab event:', error);
      // Store locally if API is unavailable
      this.storeEventLocally(event);
    }
  }

  async sendPageActivity(activityData) {
    try {
      await fetch(`${this.compassApiUrl}/events/page-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      });

      console.log('Sent page activity:', activityData.url);
      this.stats.pageActivities++;
      this.saveStats();
    } catch (error) {
      console.error('Failed to send page activity:', error);
      this.storeEventLocally(activityData);
    }
  }

  async getStats() {
    return {
      ...this.stats,
      currentTabTime: this.getCurrentTabTime(),
      pendingEvents: await this.getPendingEventsCount()
    };
  }

  getCurrentTabTime() {
    if (!this.tabStartTime) return 0;
    return Date.now() - this.tabStartTime;
  }

  async getPendingEventsCount() {
    try {
      const stored = await chrome.storage.local.get(['pendingEvents']);
      return (stored.pendingEvents || []).length;
    } catch (error) {
      return 0;
    }
  }

  async loadStats() {
    try {
      const stored = await chrome.storage.local.get(['dailyStats']);
      if (stored.dailyStats && stored.dailyStats.date === new Date().toDateString()) {
        this.stats = {...this.stats, ...stored.dailyStats};
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async saveStats() {
    try {
      const dailyStats = {
        ...this.stats,
        date: new Date().toDateString()
      };
      await chrome.storage.local.set({dailyStats});
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  }

  async storeEventLocally(event) {
    try {
      const stored = await chrome.storage.local.get(['pendingEvents']);
      const events = stored.pendingEvents || [];
      events.push(event);
      
      // Keep only last 100 events to prevent storage overflow
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }
      
      await chrome.storage.local.set({pendingEvents: events});
    } catch (error) {
      console.error('Failed to store event locally:', error);
    }
  }

  async retryPendingEvents() {
    try {
      const stored = await chrome.storage.local.get(['pendingEvents']);
      const events = stored.pendingEvents || [];
      
      if (events.length > 0) {
        console.log(`Retrying ${events.length} pending events`);
        
        for (const event of events) {
          try {
            await fetch(`${this.compassApiUrl}/events/browser`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event)
            });
          } catch (error) {
            // Keep failed events for next retry
            break;
          }
        }
        
        // Clear successfully sent events
        await chrome.storage.local.set({pendingEvents: []});
      }
    } catch (error) {
      console.error('Failed to retry pending events:', error);
    }
  }
}

// Initialize tracker
const tracker = new CompassTracker();

// Retry pending events every 30 seconds
setInterval(() => {
  tracker.retryPendingEvents();
}, 30000);

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Compass tracker extension started');
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Compass tracker extension installed');
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'pageActivity') {
    // Handle page activity from content script
    tracker.sendPageActivity(message.data);
    sendResponse({success: true});
  } else if (message.action === 'getStats') {
    // Handle stats request from popup
    tracker.getStats().then(stats => {
      sendResponse(stats);
    });
    return true; // Indicates async response
  } else if (message.action === 'getCurrentTabTime') {
    // Handle current tab time request
    sendResponse({
      currentTabTime: tracker.getCurrentTabTime()
    });
  }
});
