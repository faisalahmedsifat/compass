// Compass Firefox Extension - Background Script
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
        browser.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabChange(activeInfo.tabId);
        });

        // Track tab updates (URL changes, page loads)
        browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && tab.active) {
                this.handleTabChange(tabId, tab);
            }
        });

        // Track window focus changes
        browser.windows.onFocusChanged.addListener((windowId) => {
            if (windowId !== browser.windows.WINDOW_ID_NONE) {
                browser.tabs.query({active: true, windowId: windowId}).then((tabs) => {
                    if (tabs.length > 0) {
                        this.handleTabChange(tabs[0].id, tabs[0]);
                    }
                });
            }
        });

        // Track tab removal
        browser.tabs.onRemoved.addListener((tabId) => {
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
                const tabs = await browser.tabs.query({active: true, currentWindow: true});
                if (tabs.length > 0) {
                    tabInfo = tabs[0];
                }
            }

            if (tabInfo) {
                this.currentTab = tabInfo;
                this.tabStartTime = Date.now();
                this.stats.tabsTracked++;
                this.saveStats();
                
                console.log(`Switched to tab: ${this.currentTab.title}`);
                
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
                browser: 'firefox'
            };

            // Send to Compass daemon
            const response = await fetch(`${this.compassApiUrl}/events/browser`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            });

            if (response.ok) {
                console.log('Sent tab event:', eventType, tab.title);
                this.stats.eventsSent++;
                this.saveStats();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to send tab event:', error);
            // Store locally if API is unavailable
            this.storeEventLocally(event);
        }
    }

    async sendPageActivity(activityData) {
        try {
            const response = await fetch(`${this.compassApiUrl}/events/page-activity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activityData)
            });

            if (response.ok) {
                console.log('Sent page activity:', activityData.url);
                this.stats.pageActivities++;
                this.saveStats();
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
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
            const stored = await browser.storage.local.get(['pendingEvents']);
            return (stored.pendingEvents || []).length;
        } catch (error) {
            return 0;
        }
    }

    async loadStats() {
        try {
            const stored = await browser.storage.local.get(['dailyStats']);
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
            await browser.storage.local.set({dailyStats});
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    }

    async storeEventLocally(event) {
        try {
            const stored = await browser.storage.local.get(['pendingEvents']);
            const events = stored.pendingEvents || [];
            events.push(event);
            
            // Keep only last 100 events to prevent storage overflow
            if (events.length > 100) {
                events.splice(0, events.length - 100);
            }
            
            await browser.storage.local.set({pendingEvents: events});
        } catch (error) {
            console.error('Failed to store event locally:', error);
        }
    }

    async retryPendingEvents() {
        try {
            const stored = await browser.storage.local.get(['pendingEvents']);
            const events = stored.pendingEvents || [];
            
            if (events.length > 0) {
                console.log(`Retrying ${events.length} pending events`);
                
                const successfulEvents = [];
                for (const event of events) {
                    try {
                        const response = await fetch(`${this.compassApiUrl}/events/browser`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(event)
                        });
                        
                        if (response.ok) {
                            successfulEvents.push(event);
                        } else {
                            break; // Stop on first failure
                        }
                    } catch (error) {
                        break; // Stop on first error
                    }
                }
                
                // Remove successful events
                const remainingEvents = events.filter(e => !successfulEvents.includes(e));
                await browser.storage.local.set({pendingEvents: remainingEvents});
                
                if (successfulEvents.length > 0) {
                    console.log(`Successfully retried ${successfulEvents.length} events`);
                }
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

// Handle messages from content scripts and popup
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

// Handle extension startup
browser.runtime.onStartup.addListener(() => {
    console.log('Compass tracker Firefox extension started');
});

browser.runtime.onInstalled.addListener(() => {
    console.log('Compass tracker Firefox extension installed');
});
