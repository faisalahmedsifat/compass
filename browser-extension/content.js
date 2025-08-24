// Compass Browser Extension - Content Script
// Tracks user interactions within web pages

class PageActivityTracker {
  constructor() {
    this.isActive = true;
    this.lastActivity = Date.now();
    this.scrollDepth = 0;
    this.totalScrolls = 0;
    this.clicks = 0;
    this.keystrokes = 0;
    this.setupEventListeners();
    this.startIdleDetection();
  }

  setupEventListeners() {
    // Track user interactions
    document.addEventListener('click', () => {
      this.recordActivity('click');
      this.clicks++;
    }, true);

    document.addEventListener('keydown', () => {
      this.recordActivity('keydown');
      this.keystrokes++;
    }, true);

    document.addEventListener('scroll', () => {
      this.recordActivity('scroll');
      this.totalScrolls++;
      this.updateScrollDepth();
    }, true);

    // Track mouse movement (throttled)
    let mouseTimeout;
    document.addEventListener('mousemove', () => {
      if (mouseTimeout) return;
      mouseTimeout = setTimeout(() => {
        this.recordActivity('mousemove');
        mouseTimeout = null;
      }, 1000); // Throttle to once per second
    }, true);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendPageActivitySummary();
      } else {
        this.recordActivity('visible');
      }
    });

    // Track focus/blur events
    window.addEventListener('focus', () => {
      this.recordActivity('focus');
    });

    window.addEventListener('blur', () => {
      this.sendPageActivitySummary();
    });
  }

  recordActivity(type) {
    this.lastActivity = Date.now();
    this.isActive = true;
  }

  updateScrollDepth() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const currentDepth = Math.min(100, Math.round((scrollTop + windowHeight) / documentHeight * 100));
    this.scrollDepth = Math.max(this.scrollDepth, currentDepth);
  }

  startIdleDetection() {
    setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastActivity;
      
      // Consider idle after 30 seconds of no activity
      if (timeSinceActivity > 30000 && this.isActive) {
        this.isActive = false;
        this.sendPageActivitySummary();
      }
    }, 5000); // Check every 5 seconds
  }

  async sendPageActivitySummary() {
    try {
      const summary = {
        type: 'page_activity',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        title: document.title,
        domain: window.location.hostname,
        activity: {
          scrollDepth: this.scrollDepth,
          totalScrolls: this.totalScrolls,
          clicks: this.clicks,
          keystrokes: this.keystrokes,
          timeActive: Date.now() - this.lastActivity,
          readingTime: this.estimateReadingTime()
        }
      };

      // Send to background script
      chrome.runtime.sendMessage({
        action: 'pageActivity',
        data: summary
      });

      // Reset counters
      this.resetCounters();
    } catch (error) {
      console.error('Failed to send page activity:', error);
    }
  }

  resetCounters() {
    this.scrollDepth = 0;
    this.totalScrolls = 0;
    this.clicks = 0;
    this.keystrokes = 0;
  }

  estimateReadingTime() {
    const text = document.body.innerText || '';
    const words = text.split(/\s+/).length;
    const averageReadingSpeed = 200; // words per minute
    return Math.round(words / averageReadingSpeed * 60); // seconds
  }
}

// Initialize page activity tracker
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PageActivityTracker();
  });
} else {
  new PageActivityTracker();
}
