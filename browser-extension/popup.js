// Compass Browser Extension - Popup Script

class PopupController {
  constructor() {
    this.compassApiUrl = 'http://localhost:8080/api/v1';
    this.init();
  }

  async init() {
    await this.checkConnection();
    await this.loadStats();
    this.setupEventListeners();
    this.startPeriodicUpdates();
  }

  async checkConnection() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const connectionInfo = document.getElementById('connectionInfo');

    try {
      const response = await fetch(`${this.compassApiUrl}/health`, {
        method: 'GET',
        timeout: 5000
      });

      if (response.ok) {
        statusDot.className = 'dot connected';
        statusText.textContent = 'Connected to Compass';
        connectionInfo.textContent = 'Extension is tracking your browser activity';
      } else {
        throw new Error('Health check failed');
      }
    } catch (error) {
      statusDot.className = 'dot disconnected';
      statusText.textContent = 'Disconnected';
      connectionInfo.textContent = 'Cannot connect to Compass daemon. Make sure it\'s running.';
    }
  }

  async loadStats() {
    try {
      // Get stats from background script
      const response = await chrome.runtime.sendMessage({action: 'getStats'});
      
      if (response) {
        document.getElementById('tabsTracked').textContent = response.tabsTracked || 0;
        document.getElementById('eventsSent').textContent = response.eventsSent || 0;
        document.getElementById('pendingEvents').textContent = response.pendingEvents || 0;
        document.getElementById('currentTabTime').textContent = this.formatDuration(response.currentTabTime || 0);
      }

      // Get pending events from storage
      const stored = await chrome.storage.local.get(['pendingEvents', 'dailyStats']);
      const pendingEvents = stored.pendingEvents || [];
      const dailyStats = stored.dailyStats || {tabsTracked: 0, eventsSent: 0, date: new Date().toDateString()};

      // Reset daily stats if it's a new day
      if (dailyStats.date !== new Date().toDateString()) {
        dailyStats.tabsTracked = 0;
        dailyStats.eventsSent = 0;
        dailyStats.date = new Date().toDateString();
        await chrome.storage.local.set({dailyStats});
      }

      document.getElementById('pendingEvents').textContent = pendingEvents.length;
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  setupEventListeners() {
    document.getElementById('settingsBtn').addEventListener('click', () => {
      // Open settings page or show settings modal
      chrome.tabs.create({url: 'chrome://extensions/?id=' + chrome.runtime.id});
    });
  }

  startPeriodicUpdates() {
    // Update stats every 2 seconds while popup is open
    this.updateInterval = setInterval(() => {
      this.loadStats();
    }, 2000);

    // Update current tab time every second
    this.timeInterval = setInterval(() => {
      this.updateCurrentTabTime();
    }, 1000);

    // Clean up intervals when popup closes
    window.addEventListener('beforeunload', () => {
      if (this.updateInterval) clearInterval(this.updateInterval);
      if (this.timeInterval) clearInterval(this.timeInterval);
    });
  }

  async updateCurrentTabTime() {
    try {
      const response = await chrome.runtime.sendMessage({action: 'getCurrentTabTime'});
      if (response && response.currentTabTime) {
        document.getElementById('currentTabTime').textContent = this.formatDuration(response.currentTabTime);
      }
    } catch (error) {
      // Silently fail - popup might be closing
    }
  }

  formatDuration(milliseconds) {
    if (!milliseconds || milliseconds < 1000) return '0s';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
