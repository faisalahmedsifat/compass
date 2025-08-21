package server

// getDashboardHTML returns the embedded dashboard HTML
func getDashboardHTML() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧭 Compass - Workspace Tracker</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8f9fa;
            color: #333;
            line-height: 1.6;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header h1 {
            font-size: 1.8rem;
            font-weight: 600;
        }

        .header p {
            opacity: 0.9;
            margin-top: 0.5rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            border: 1px solid #e9ecef;
        }

        .card h2 {
            color: #495057;
            margin-bottom: 1rem;
            font-size: 1.2rem;
            font-weight: 600;
        }

        .current-activity {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .current-activity h2 {
            color: white;
        }

        .activity-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .app-icon {
            width: 48px;
            height: 48px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }

        .activity-details h3 {
            font-size: 1.4rem;
            margin-bottom: 0.25rem;
        }

        .activity-meta {
            opacity: 0.9;
            font-size: 0.9rem;
        }

        .windows-list {
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 1rem;
        }

        .window-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .window-item:last-child {
            border-bottom: none;
        }

        .window-status {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #28a745;
        }

        .window-status.inactive {
            background: rgba(255,255,255,0.3);
        }

        .stat-item {
            padding: 1rem;
            text-align: center;
            border-radius: 8px;
            background: #f8f9fa;
            margin-bottom: 1rem;
        }

        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #495057;
            margin-bottom: 0.25rem;
        }

        .stat-label {
            font-size: 0.9rem;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .category-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid #e9ecef;
        }

        .category-item:last-child {
            border-bottom: none;
        }

        .category-color {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .category-info {
            flex: 1;
        }

        .category-name {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }

        .category-time {
            font-size: 0.9rem;
            color: #6c757d;
        }

        .loading {
            text-align: center;
            padding: 2rem;
            color: #6c757d;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }

        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #28a745;
            margin-right: 0.5rem;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .timestamp {
            font-size: 0.85rem;
            color: #6c757d;
            margin-top: 0.5rem;
        }

        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
            .container {
                padding: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧭 Compass Workspace Tracker</h1>
        <p><span class="status-indicator"></span>Real-time workspace monitoring</p>
    </div>

    <div class="container">
        <!-- Current Activity -->
        <div class="grid">
            <div class="card current-activity">
                <h2>Current Activity</h2>
                <div id="current-activity-content" class="loading">
                    Loading current workspace...
                </div>
            </div>
        </div>

        <!-- Stats Grid -->
        <div class="grid">
            <div class="card">
                <h2>Today's Summary</h2>
                <div id="daily-stats">
                    <div class="stat-item">
                        <div class="stat-value" id="total-time">--</div>
                        <div class="stat-label">Total Active Time</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="context-switches">--</div>
                        <div class="stat-label">Context Switches</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="longest-focus">--</div>
                        <div class="stat-label">Longest Focus</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <h2>Categories</h2>
                <div id="categories-content" class="loading">
                    Loading categories...
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>🪟 Window Details</h2>
                <div id="window-details" class="loading">
                    Loading window details...
                </div>
            </div>

            <div class="card">
                <h2>📊 Top Applications</h2>
                <div id="apps-content" class="loading">
                    Loading applications...
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>⏱️ Recent Activity</h2>
                <div id="recent-activity" class="loading">
                    Loading recent activity...
                </div>
            </div>

            <div class="card">
                <h2>🔄 Context Switches</h2>
                <div id="context-switches" class="loading">
                    Loading context data...
                </div>
            </div>
        </div>

        <!-- Developer-Focused Enhancements -->
        <div class="grid">
            <div class="card">
                <h2>👨‍💻 Development Flow</h2>
                <div id="dev-flow" class="loading">
                    Analyzing development patterns...
                </div>
            </div>

            <div class="card">
                <h2>🎯 Focus Quality Score</h2>
                <div id="focus-score" class="loading">
                    Calculating focus quality...
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>📁 Project Context</h2>
                <div id="project-context" class="loading">
                    Detecting project context...
                </div>
            </div>

            <div class="card">
                <h2>🧠 Productivity Insights</h2>
                <div id="productivity-insights" class="loading">
                    Generating insights...
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h2>🌐 Research Patterns</h2>
                <div id="research-patterns" class="loading">
                    Analyzing research behavior...
                </div>
            </div>

            <div class="card">
                <h2>⚡ Workflow Health</h2>
                <div id="workflow-health" class="loading">
                    Assessing workflow health...
                </div>
            </div>
        </div>
    </div>

    <script>
        class CompassDashboard {
            constructor() {
                this.ws = null;
                this.reconnectAttempts = 0;
                this.maxReconnectAttempts = 5;
                this.init();
            }

            init() {
                this.connectWebSocket();
                this.loadInitialData();
                
                // Refresh data every 30 seconds as fallback
                setInterval(() => this.loadCurrentWorkspace(), 30000);
                setInterval(() => this.loadStats(), 60000);
            }

            connectWebSocket() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = protocol + '//' + window.location.host + '/ws';
                
                try {
                    this.ws = new WebSocket(wsUrl);
                    
                    this.ws.onopen = () => {
                        console.log('WebSocket connected');
                        this.reconnectAttempts = 0;
                    };
                    
                    this.ws.onmessage = (event) => {
                        const message = JSON.parse(event.data);
                        this.handleWebSocketMessage(message);
                    };
                    
                    this.ws.onclose = () => {
                        console.log('WebSocket disconnected');
                        this.reconnectWebSocket();
                    };
                    
                    this.ws.onerror = (error) => {
                        console.error('WebSocket error:', error);
                    };
                } catch (error) {
                    console.error('Failed to create WebSocket:', error);
                    this.reconnectWebSocket();
                }
            }

            reconnectWebSocket() {
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                    setTimeout(() => this.connectWebSocket(), delay);
                }
            }

            handleWebSocketMessage(message) {
                switch (message.type) {
                    case 'current_workspace':
                        this.updateCurrentWorkspace(message.data);
                        break;
                    case 'activity_update':
                        this.updateCurrentWorkspace(message.data);
                        break;
                }
            }

            async loadInitialData() {
                await Promise.all([
                    this.loadCurrentWorkspace(),
                    this.loadStats(),
                    this.loadRecentActivity()
                ]);
                
                // Initialize context switches display
                this.loadContextSwitchDetails();
                
                // Load developer-focused enhancements
                this.loadDeveloperEnhancements();
            }

            async loadCurrentWorkspace() {
                try {
                    const response = await fetch('/api/current');
                    const data = await response.json();
                    this.updateCurrentWorkspace(data);
                } catch (error) {
                    console.error('Failed to load current workspace:', error);
                    this.showError('current-activity-content', 'Failed to load current workspace');
                }
            }

            async loadStats() {
                try {
                    const response = await fetch('/api/stats?period=day');
                    const stats = await response.json();
                    this.updateStats(stats);
                } catch (error) {
                    console.error('Failed to load stats:', error);
                }
            }

            async loadRecentActivity() {
                try {
                    const response = await fetch('/api/activities?limit=10');
                    const activities = await response.json();
                    this.updateRecentActivity(activities);
                } catch (error) {
                    console.error('Failed to load recent activity:', error);
                    this.showError('recent-activity', 'Failed to load recent activity');
                }
            }

            async loadContextSwitchDetails() {
                try {
                    const response = await fetch('/api/activities?limit=20');
                    const activities = await response.json();
                    this.updateContextSwitchDetails(activities);
                } catch (error) {
                    console.error('Failed to load context switches:', error);
                    this.showError('context-switches', 'Failed to load context switches');
                }
            }

            updateCurrentWorkspace(data) {
                const container = document.getElementById('current-activity-content');
                
                if (!data || !data.active_window || data.window_count === 0) {
                    container.innerHTML = '<div class="loading">No active workspace detected</div>';
                    return;
                }

                const activeWindow = data.active_window;
                const windows = data.all_windows || [];
                
                container.innerHTML = ` + "`" + `
                    <div class="activity-info">
                        <div class="app-icon">🖥️</div>
                        <div class="activity-details">
                            <h3>${this.escapeHtml(activeWindow.app_name)}</h3>
                            <div class="activity-meta">
                                ${this.escapeHtml(activeWindow.title)} • 
                                ${data.category || 'Uncategorized'} • 
                                Focus: ${data.focus_time || '0s'}
                            </div>
                        </div>
                    </div>
                    <div class="windows-list">
                        <h4 style="margin-bottom: 0.75rem; opacity: 0.9;">All Open Windows (${windows.length})</h4>
                        ${windows.map(w => ` + "`" + `
                            <div class="window-item">
                                <div class="window-status ${w.is_active ? '' : 'inactive'}"></div>
                                <div style="flex: 1;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <strong style="color: ${w.is_active ? '#fff' : 'rgba(255,255,255,0.9)'};">${this.escapeHtml(w.app_name)}</strong>
                                        <span style="font-size: 0.75rem; opacity: 0.7; text-transform: uppercase; font-weight: 600;">${w.is_active ? 'ACTIVE' : 'background'}</span>
                                    </div>
                                    ${w.title ? '<div style="margin-top: 0.5rem; font-size: 0.95rem; color: rgba(255,255,255,0.95); font-weight: 500; line-height: 1.3;">' + this.escapeHtml(w.title) + '</div>' : '<div style="margin-top: 0.5rem; font-style: italic; opacity: 0.6;">No window title</div>'}
                                </div>
                            </div>
                        ` + "`" + `).join('')}
                    </div>
                    <div class="timestamp">Last updated: ${new Date(data.timestamp).toLocaleTimeString()}</div>
                ` + "`" + `;
                
                // Also update the dedicated window details section
                this.updateWindowDetails(windows);
            }

            updateStats(stats) {
                // Update summary stats
                document.getElementById('total-time').textContent = this.formatDuration(stats.total_time);
                document.getElementById('context-switches').textContent = stats.context_switches || 0;
                document.getElementById('longest-focus').textContent = this.formatDuration(stats.longest_focus);

                // Update categories
                this.updateCategories(stats.by_category || {});
                
                // Update apps
                this.updateApps(stats.by_app || {});
            }

            updateCategories(categories) {
                const container = document.getElementById('categories-content');
                const sortedCategories = Object.entries(categories)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8);

                if (sortedCategories.length === 0) {
                    container.innerHTML = '<div class="loading">No categories found</div>';
                    return;
                }

                container.innerHTML = sortedCategories.map(([category, duration]) => ` + "`" + `
                    <div class="category-item">
                        <div class="category-color" style="background: ${this.getCategoryColor(category)}"></div>
                        <div class="category-info">
                            <div class="category-name">${category}</div>
                            <div class="category-time">${this.formatDuration(duration)}</div>
                        </div>
                    </div>
                ` + "`" + `).join('');
            }

            updateApps(apps) {
                const container = document.getElementById('apps-content');
                const sortedApps = Object.entries(apps)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8);

                if (sortedApps.length === 0) {
                    container.innerHTML = '<div class="loading">No applications found</div>';
                    return;
                }

                container.innerHTML = sortedApps.map(([app, duration]) => ` + "`" + `
                    <div class="category-item">
                        <div class="category-color" style="background: #6c757d"></div>
                        <div class="category-info">
                            <div class="category-name">${this.escapeHtml(app)}</div>
                            <div class="category-time">${this.formatDuration(duration)}</div>
                        </div>
                    </div>
                ` + "`" + `).join('');
            }

            updateWindowDetails(windows) {
                const container = document.getElementById('window-details');
                
                if (!windows || windows.length === 0) {
                    container.innerHTML = '<div class="loading">No windows detected</div>';
                    return;
                }

                container.innerHTML = windows.map(w => ` + "`" + `
                    <div style="margin-bottom: 1rem; padding: 1rem; background: ${w.is_active ? '#e8f5e8' : '#f8f9fa'}; border-radius: 8px; border-left: 4px solid ${w.is_active ? '#28a745' : '#dee2e6'};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong style="color: ${w.is_active ? '#155724' : '#495057'}; font-size: 1.1rem;">${this.escapeHtml(w.app_name)}</strong>
                            <span style="background: ${w.is_active ? '#28a745' : '#6c757d'}; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">
                                ${w.is_active ? '● ACTIVE' : 'background'}
                            </span>
                        </div>
                        <div style="color: #495057; font-size: 0.95rem; line-height: 1.4; font-weight: 500;">
                            ${w.title ? this.escapeHtml(w.title) : '<em style="opacity: 0.6;">No window title available</em>'}
                        </div>
                        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #6c757d;">
                            PID: ${w.pid} • Last active: ${new Date(w.last_active).toLocaleTimeString()}
                        </div>
                    </div>
                ` + "`" + `).join('');
            }

            updateRecentActivity(activities) {
                const container = document.getElementById('recent-activity');
                
                if (!activities || activities.length === 0) {
                    container.innerHTML = '<div class="loading">No recent activity</div>';
                    return;
                }

                container.innerHTML = activities.slice(0, 8).map(activity => ` + "`" + `
                    <div class="category-item">
                        <div class="category-color" style="background: ${this.getCategoryColor(activity.category)}"></div>
                        <div class="category-info">
                            <div class="category-name">${this.escapeHtml(activity.app_name)}</div>
                            <div style="font-size: 0.85rem; color: #495057; margin: 0.25rem 0; font-weight: 500;">
                                ${activity.window_title ? this.escapeHtml(activity.window_title) : 'No window title'}
                            </div>
                            <div class="category-time">
                                ${activity.category} • ${new Date(activity.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ` + "`" + `).join('');
            }

            updateContextSwitchDetails(activities) {
                const container = document.getElementById('context-switches');
                
                if (!activities || activities.length === 0) {
                    container.innerHTML = '<div class="loading">No context switch data</div>';
                    return;
                }

                // Find context switches (app changes)
                const switches = [];
                for (let i = 1; i < activities.length; i++) {
                    if (activities[i].app_name !== activities[i-1].app_name) {
                        switches.push({
                            from: activities[i-1].app_name,
                            to: activities[i].app_name,
                            fromTitle: activities[i-1].window_title,
                            toTitle: activities[i].window_title,
                            time: new Date(activities[i].timestamp),
                            gap: (new Date(activities[i].timestamp) - new Date(activities[i-1].timestamp)) / 1000
                        });
                    }
                }

                if (switches.length === 0) {
                    container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #28a745;"><div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🎯</div><div style="font-weight: 600;">Great Focus!</div><div style="font-size: 0.9rem; opacity: 0.8;">No context switches detected recently</div></div>';
                    return;
                }

                container.innerHTML = ` + "`" + `
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <span style="font-weight: 600; color: #495057;">Recent Switches</span>
                            <span style="background: ${switches.length > 5 ? '#dc3545' : switches.length > 2 ? '#ffc107' : '#28a745'}; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                                ${switches.length} switches
                            </span>
                        </div>
                        ${switches.slice(0, 5).map(sw => ` + "`" + `
                            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f8f9fa; border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid ${this.getCategoryColor('General')};">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                        <span style="font-weight: 600; color: #6c757d; font-size: 0.85rem;">${this.escapeHtml(sw.from)}</span>
                                        <span style="color: #6c757d;">→</span>
                                        <span style="font-weight: 600; color: #495057; font-size: 0.85rem;">${this.escapeHtml(sw.to)}</span>
                                    </div>
                                    <div style="font-size: 0.75rem; color: #6c757d;">
                                        ${sw.time.toLocaleTimeString()} • Gap: ${sw.gap < 60 ? Math.round(sw.gap) + 's' : Math.round(sw.gap/60) + 'm'}
                                    </div>
                                </div>
                            </div>
                        ` + "`" + `).join('')}
                    </div>
                ` + "`" + `;
            }

            loadDeveloperEnhancements() {
                // Load all developer-focused enhancements
                this.loadDevelopmentFlow();
                this.loadFocusScore();
                this.loadProjectContext();
                this.loadProductivityInsights();
                this.loadResearchPatterns();
                this.loadWorkflowHealth();
            }

            async loadDevelopmentFlow() {
                try {
                    const response = await fetch('/api/activities?limit=50');
                    const activities = await response.json();
                    this.updateDevelopmentFlow(activities);
                } catch (error) {
                    console.error('Failed to load development flow:', error);
                    this.showError('dev-flow', 'Failed to load development flow');
                }
            }

            updateDevelopmentFlow(activities) {
                const container = document.getElementById('dev-flow');
                
                if (!activities || activities.length === 0) {
                    container.innerHTML = '<div class="loading">No development activity detected</div>';
                    return;
                }

                // Detect development patterns
                const devApps = ['Cursor', 'Visual Studio Code', 'vim', 'emacs', 'IntelliJ', 'WebStorm', 'PyCharm', 'Atom', 'Sublime Text'];
                const terminalApps = ['Terminal', 'iTerm', 'Alacritty', 'konsole', 'gnome-terminal', 'xterm'];
                const browserApps = ['firefox', 'chrome', 'safari', 'edge'];

                const devActivities = activities.filter(a => devApps.some(dev => a.app_name.toLowerCase().includes(dev.toLowerCase())));
                const terminalActivities = activities.filter(a => terminalApps.some(term => a.app_name.toLowerCase().includes(term.toLowerCase())));
                const browserActivities = activities.filter(a => browserApps.some(browser => a.app_name.toLowerCase().includes(browser.toLowerCase())));

                const devTime = devActivities.length * 10; // rough estimate in seconds
                const totalTime = activities.length * 10;
                const devPercentage = totalTime > 0 ? Math.round((devTime / totalTime) * 100) : 0;

                // Detect coding language/framework from window titles
                const languages = this.detectLanguages(devActivities);
                
                container.innerHTML = ` + "`" + `
                    <div style="margin-bottom: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <span style="font-weight: 600; color: #495057;">Coding Focus</span>
                            <span style="background: ${devPercentage > 70 ? '#28a745' : devPercentage > 40 ? '#ffc107' : '#6c757d'}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600;">
                                ${devPercentage}% dev time
                            </span>
                        </div>
                        
                        <div style="background: #f8f9fa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; text-align: center;">
                                <div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #28a745;">${devActivities.length}</div>
                                    <div style="font-size: 0.8rem; color: #6c757d;">Editor Sessions</div>
                                </div>
                                <div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #17a2b8;">${terminalActivities.length}</div>
                                    <div style="font-size: 0.8rem; color: #6c757d;">Terminal Use</div>
                                </div>
                                <div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: #6f42c1;">${browserActivities.length}</div>
                                    <div style="font-size: 0.8rem; color: #6c757d;">Research Sessions</div>
                                </div>
                            </div>
                        </div>

                        ${languages.length > 0 ? ` + "`" + `
                            <div style="margin-bottom: 1rem;">
                                <div style="font-weight: 600; color: #495057; margin-bottom: 0.5rem;">Languages/Frameworks Detected:</div>
                                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                    ${languages.map(lang => ` + "`" + `
                                        <span style="background: ${this.getLanguageColor(lang)}; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                                            ${lang}
                                        </span>
                                    ` + "`" + `).join('')}
                                </div>
                            </div>
                        ` + "`" + ` : ''}
                    </div>
                ` + "`" + `;
            }

            loadFocusScore() {
                // Calculate focus quality based on context switches and session length
                fetch('/api/activities?limit=100')
                    .then(response => response.json())
                    .then(activities => {
                        const container = document.getElementById('focus-score');
                        
                        if (!activities || activities.length === 0) {
                            container.innerHTML = '<div class="loading">No data for focus analysis</div>';
                            return;
                        }

                        // Calculate metrics
                        const switches = this.countContextSwitches(activities);
                        const avgSessionLength = this.calculateAvgSessionLength(activities);
                        const multitaskingLevel = this.calculateMultitasking(activities);
                        
                        // Calculate overall focus score (0-100)
                        let focusScore = 100;
                        focusScore -= Math.min(switches * 2, 30); // Penalty for switches
                        focusScore -= Math.min(multitaskingLevel * 10, 40); // Penalty for multitasking
                        focusScore += Math.min(avgSessionLength / 60, 20); // Bonus for long sessions
                        focusScore = Math.max(0, Math.min(100, Math.round(focusScore)));

                        const scoreColor = focusScore > 80 ? '#28a745' : focusScore > 60 ? '#ffc107' : '#dc3545';
                        const scoreEmoji = focusScore > 80 ? '🎯' : focusScore > 60 ? '⚡' : '🔄';

                        container.innerHTML = ` + "`" + `
                            <div style="text-align: center; padding: 1rem;">
                                <div style="font-size: 3rem; margin-bottom: 0.5rem;">${scoreEmoji}</div>
                                <div style="font-size: 2.5rem; font-weight: 700; color: ${scoreColor}; margin-bottom: 0.5rem;">${focusScore}</div>
                                <div style="font-size: 0.9rem; color: #6c757d; margin-bottom: 1rem;">Focus Quality Score</div>
                                
                                <div style="background: #f8f9fa; border-radius: 8px; padding: 1rem; text-align: left;">
                                    <div style="margin-bottom: 0.5rem; font-size: 0.85rem;">
                                        <span style="color: #6c757d;">Context Switches:</span> 
                                        <span style="font-weight: 600; color: ${switches > 10 ? '#dc3545' : '#28a745'};">${switches}</span>
                                    </div>
                                    <div style="margin-bottom: 0.5rem; font-size: 0.85rem;">
                                        <span style="color: #6c757d;">Avg Session:</span> 
                                        <span style="font-weight: 600; color: ${avgSessionLength > 300 ? '#28a745' : '#ffc107'};">${Math.round(avgSessionLength/60)}m</span>
                                    </div>
                                    <div style="font-size: 0.85rem;">
                                        <span style="color: #6c757d;">Multitasking Level:</span> 
                                        <span style="font-weight: 600; color: ${multitaskingLevel < 2 ? '#28a745' : '#dc3545'};">${multitaskingLevel.toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        ` + "`" + `;
                    })
                    .catch(error => {
                        console.error('Failed to load focus score:', error);
                        this.showError('focus-score', 'Failed to calculate focus score');
                    });
            }

            loadProjectContext() {
                fetch('/api/current')
                    .then(response => response.json())
                    .then(data => {
                        const container = document.getElementById('project-context');
                        
                        if (!data || !data.all_windows) {
                            container.innerHTML = '<div class="loading">No project context detected</div>';
                            return;
                        }

                        // Detect project from window titles and paths
                        const projects = this.detectProjects(data.all_windows);
                        const gitRepo = this.detectGitRepo(data.all_windows);
                        const workingFiles = this.getWorkingFiles(data.all_windows);

                        container.innerHTML = ` + "`" + `
                            <div style="margin-bottom: 1rem;">
                                ${gitRepo ? ` + "`" + `
                                    <div style="margin-bottom: 1rem; padding: 1rem; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #28a745;">
                                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                            <span style="font-size: 1.2rem;">📂</span>
                                            <span style="font-weight: 600; color: #155724;">Active Project</span>
                                        </div>
                                        <div style="font-size: 1.1rem; font-weight: 700; color: #155724; margin-bottom: 0.25rem;">${gitRepo}</div>
                                        <div style="font-size: 0.85rem; color: #155724; opacity: 0.8;">Git repository detected</div>
                                    </div>
                                ` + "`" + ` : ''}

                                ${workingFiles.length > 0 ? ` + "`" + `
                                    <div style="margin-bottom: 1rem;">
                                        <div style="font-weight: 600; color: #495057; margin-bottom: 0.75rem;">📝 Active Files</div>
                                        ${workingFiles.slice(0, 5).map(file => ` + "`" + `
                                            <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: #f8f9fa; border-radius: 4px; margin-bottom: 0.25rem;">
                                                <span style="font-size: 0.8rem;">${this.getFileIcon(file.name)}</span>
                                                <span style="font-weight: 500; color: #495057; font-size: 0.9rem;">${this.escapeHtml(file.name)}</span>
                                                <span style="margin-left: auto; font-size: 0.75rem; color: #6c757d;">${file.app}</span>
                                            </div>
                                        ` + "`" + `).join('')}
                                    </div>
                                ` + "`" + ` : ''}

                                ${projects.length > 0 ? ` + "`" + `
                                    <div>
                                        <div style="font-weight: 600; color: #495057; margin-bottom: 0.5rem;">🏗️ Project Stack</div>
                                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                                            ${projects.map(project => ` + "`" + `
                                                <span style="background: #6f42c1; color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">
                                                    ${project}
                                                </span>
                                            ` + "`" + `).join('')}
                                        </div>
                                    </div>
                                ` + "`" + ` : '<div style="text-align: center; padding: 2rem; color: #6c757d;"><div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📄</div><div>No specific project detected</div><div style="font-size: 0.85rem; margin-top: 0.25rem;">Open some project files to see context</div></div>'}
                            </div>
                        ` + "`" + `;
                    })
                    .catch(error => {
                        console.error('Failed to load project context:', error);
                        this.showError('project-context', 'Failed to detect project context');
                    });
            }

            formatDuration(nanoseconds) {
                if (!nanoseconds || nanoseconds === 0) return '0s';
                
                const seconds = Math.floor(nanoseconds / 1000000000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);

                if (hours > 0) {
                    return hours + 'h ' + (minutes % 60) + 'm';
                } else if (minutes > 0) {
                    return minutes + 'm ' + (seconds % 60) + 's';
                } else {
                    return seconds + 's';
                }
            }

            getCategoryColor(category) {
                const colors = {
                    'Development': '#28a745',
                    'Debugging': '#dc3545',
                    'Code Review': '#17a2b8',
                    'Learning': '#6f42c1',
                    'Communication': '#fd7e14',
                    'Deep Work': '#20c997',
                    'Research': '#6c757d',
                    'Meetings': '#007bff',
                    'Email': '#ffc107',
                    'Planning': '#e83e8c',
                    'Browsing': '#6c757d',
                    'Entertainment': '#fd7e14',
                    'General': '#6c757d',
                    'Uncategorized': '#dee2e6',
                    'Idle': '#f8f9fa'
                };
                return colors[category] || '#6c757d';
            }

            loadProductivityInsights() {
                fetch('/api/activities?limit=100')
                    .then(response => response.json())
                    .then(activities => {
                        const container = document.getElementById('productivity-insights');
                        
                        if (!activities || activities.length === 0) {
                            container.innerHTML = '<div class="loading">No data for insights</div>';
                            return;
                        }

                        // Generate insights
                        const insights = this.generateProductivityInsights(activities);
                        
                        container.innerHTML = ` + "`" + `
                            <div style="margin-bottom: 1rem;">
                                ${insights.map(insight => ` + "`" + `
                                    <div style="display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.75rem; background: ${insight.type === 'positive' ? '#e8f5e8' : insight.type === 'warning' ? '#fff3cd' : '#f8d7da'}; border-radius: 8px; margin-bottom: 0.75rem; border-left: 3px solid ${insight.type === 'positive' ? '#28a745' : insight.type === 'warning' ? '#ffc107' : '#dc3545'};">
                                        <div style="font-size: 1.2rem; margin-top: 0.1rem;">${insight.icon}</div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 600; color: ${insight.type === 'positive' ? '#155724' : insight.type === 'warning' ? '#856404' : '#721c24'}; margin-bottom: 0.25rem;">
                                                ${insight.title}
                                            </div>
                                            <div style="font-size: 0.9rem; color: ${insight.type === 'positive' ? '#155724' : insight.type === 'warning' ? '#856404' : '#721c24'}; opacity: 0.9;">
                                                ${insight.description}
                                            </div>
                                        </div>
                                    </div>
                                ` + "`" + `).join('')}
                            </div>
                        ` + "`" + `;
                    })
                    .catch(error => {
                        console.error('Failed to load productivity insights:', error);
                        this.showError('productivity-insights', 'Failed to generate insights');
                    });
            }

            loadResearchPatterns() {
                fetch('/api/activities?limit=50')
                    .then(response => response.json())
                    .then(activities => {
                        const container = document.getElementById('research-patterns');
                        
                        const browserActivities = activities.filter(a => 
                            ['firefox', 'chrome', 'safari', 'edge'].some(browser => 
                                a.app_name.toLowerCase().includes(browser.toLowerCase())
                            )
                        );

                        if (browserActivities.length === 0) {
                            container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6c757d;"><div style="font-size: 1.5rem; margin-bottom: 0.5rem;">🌐</div><div>No browser activity detected</div></div>';
                            return;
                        }

                        const researchSites = this.categorizeResearchSites(browserActivities);
                        
                        container.innerHTML = ` + "`" + `
                            <div style="margin-bottom: 1rem;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #6f42c1;">${browserActivities.length}</div>
                                        <div style="font-size: 0.8rem; color: #6c757d;">Browser Sessions</div>
                                    </div>
                                    <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                                        <div style="font-size: 1.5rem; font-weight: 700; color: #17a2b8;">${Object.keys(researchSites).length}</div>
                                        <div style="font-size: 0.8rem; color: #6c757d;">Research Categories</div>
                                    </div>
                                </div>

                                ${Object.entries(researchSites).map(([category, sites]) => ` + "`" + `
                                    <div style="margin-bottom: 1rem;">
                                        <div style="font-weight: 600; color: #495057; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                                            <span>${this.getResearchIcon(category)}</span>
                                            <span>${category} (${sites.length})</span>
                                        </div>
                                        <div style="padding-left: 1.5rem;">
                                            ${sites.slice(0, 3).map(site => ` + "`" + `
                                                <div style="font-size: 0.85rem; color: #6c757d; margin-bottom: 0.25rem;">
                                                    • ${this.escapeHtml(site.title || site.url)}
                                                </div>
                                            ` + "`" + `).join('')}
                                        </div>
                                    </div>
                                ` + "`" + `).join('')}
                            </div>
                        ` + "`" + `;
                    })
                    .catch(error => {
                        console.error('Failed to load research patterns:', error);
                        this.showError('research-patterns', 'Failed to analyze research patterns');
                    });
            }

            loadWorkflowHealth() {
                fetch('/api/activities?limit=100')
                    .then(response => response.json())
                    .then(activities => {
                        const container = document.getElementById('workflow-health');
                        
                        if (!activities || activities.length === 0) {
                            container.innerHTML = '<div class="loading">No data for workflow analysis</div>';
                            return;
                        }

                        const health = this.analyzeWorkflowHealth(activities);
                        
                        container.innerHTML = ` + "`" + `
                            <div style="margin-bottom: 1rem;">
                                <div style="text-align: center; margin-bottom: 1rem;">
                                    <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${health.emoji}</div>
                                    <div style="font-size: 1.5rem; font-weight: 700; color: ${health.color}; margin-bottom: 0.25rem;">${health.score}%</div>
                                    <div style="font-size: 0.9rem; color: #6c757d;">Workflow Health</div>
                                </div>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                    <div style="background: #f8f9fa; border-radius: 8px; padding: 1rem; text-align: center;">
                                        <div style="font-size: 1.2rem; font-weight: 700; color: ${health.balance > 70 ? '#28a745' : '#ffc107'};">${health.balance}%</div>
                                        <div style="font-size: 0.8rem; color: #6c757d;">Work-Break Balance</div>
                                    </div>
                                    <div style="background: #f8f9fa; border-radius: 8px; padding: 1rem; text-align: center;">
                                        <div style="font-size: 1.2rem; font-weight: 700; color: ${health.consistency > 70 ? '#28a745' : '#ffc107'};">${health.consistency}%</div>
                                        <div style="font-size: 0.8rem; color: #6c757d;">Consistency</div>
                                    </div>
                                </div>

                                <div style="background: ${health.score > 80 ? '#e8f5e8' : health.score > 60 ? '#fff3cd' : '#f8d7da'}; border-radius: 8px; padding: 1rem;">
                                    <div style="font-weight: 600; color: ${health.score > 80 ? '#155724' : health.score > 60 ? '#856404' : '#721c24'}; margin-bottom: 0.5rem;">
                                        ${health.message}
                                    </div>
                                    <div style="font-size: 0.9rem; color: ${health.score > 80 ? '#155724' : health.score > 60 ? '#856404' : '#721c24'}; opacity: 0.9;">
                                        ${health.suggestion}
                                    </div>
                                </div>
                            </div>
                        ` + "`" + `;
                    })
                    .catch(error => {
                        console.error('Failed to load workflow health:', error);
                        this.showError('workflow-health', 'Failed to analyze workflow health');
                    });
            }

            // Helper methods for new features
            detectLanguages(activities) {
                const languages = new Set();
                const langMap = {
                    '.js': 'JavaScript', '.ts': 'TypeScript', '.py': 'Python', '.go': 'Go', '.rs': 'Rust',
                    '.java': 'Java', '.cpp': 'C++', '.c': 'C', '.php': 'PHP', '.rb': 'Ruby',
                    '.swift': 'Swift', '.kt': 'Kotlin', '.scala': 'Scala', '.cs': 'C#', '.sql': 'SQL',
                    '.html': 'HTML', '.css': 'CSS', '.scss': 'SCSS', '.less': 'LESS',
                    '.vue': 'Vue', '.jsx': 'React', '.tsx': 'React', '.svelte': 'Svelte',
                    'package.json': 'Node.js', 'Cargo.toml': 'Rust', 'go.mod': 'Go',
                    'requirements.txt': 'Python', 'Gemfile': 'Ruby', 'Dockerfile': 'Docker'
                };

                activities.forEach(activity => {
                    const title = activity.window_title || '';
                    Object.entries(langMap).forEach(([ext, lang]) => {
                        if (title.includes(ext)) {
                            languages.add(lang);
                        }
                    });
                });

                return Array.from(languages);
            }

            getLanguageColor(language) {
                const colors = {
                    'JavaScript': '#f7df1e', 'TypeScript': '#3178c6', 'Python': '#3776ab',
                    'Go': '#00add8', 'Rust': '#000000', 'Java': '#f89820', 'C++': '#00599c',
                    'React': '#61dafb', 'Vue': '#4fc08d', 'Node.js': '#339933',
                    'HTML': '#e34f26', 'CSS': '#1572b6', 'Docker': '#2496ed'
                };
                return colors[language] || '#6c757d';
            }

            countContextSwitches(activities) {
                let switches = 0;
                for (let i = 1; i < activities.length; i++) {
                    if (activities[i].app_name !== activities[i-1].app_name) {
                        switches++;
                    }
                }
                return switches;
            }

            calculateAvgSessionLength(activities) {
                if (activities.length < 2) return 0;
                const sessions = [];
                let currentSession = 1;
                
                for (let i = 1; i < activities.length; i++) {
                    if (activities[i].app_name === activities[i-1].app_name) {
                        currentSession++;
                    } else {
                        sessions.push(currentSession);
                        currentSession = 1;
                    }
                }
                sessions.push(currentSession);
                
                return sessions.reduce((a, b) => a + b, 0) / sessions.length * 10; // Convert to seconds
            }

            calculateMultitasking(activities) {
                if (activities.length === 0) return 0;
                const timeWindow = 300; // 5 minutes in seconds
                let maxConcurrent = 0;
                
                for (let i = 0; i < activities.length; i++) {
                    const windowStart = new Date(activities[i].timestamp);
                    const windowEnd = new Date(windowStart.getTime() + timeWindow * 1000);
                    
                    const appsInWindow = new Set();
                    for (let j = i; j < activities.length; j++) {
                        const activityTime = new Date(activities[j].timestamp);
                        if (activityTime <= windowEnd) {
                            appsInWindow.add(activities[j].app_name);
                        } else {
                            break;
                        }
                    }
                    maxConcurrent = Math.max(maxConcurrent, appsInWindow.size);
                }
                
                return maxConcurrent;
            }

            generateProductivityInsights(activities) {
                const insights = [];
                const switches = this.countContextSwitches(activities);
                const avgSession = this.calculateAvgSessionLength(activities);
                
                if (switches < 5) {
                    insights.push({
                        type: 'positive',
                        icon: '🎯',
                        title: 'Great Focus!',
                        description: 'Low context switching indicates good concentration and focus.'
                    });
                } else if (switches > 15) {
                    insights.push({
                        type: 'warning',
                        icon: '⚠️',
                        title: 'High Context Switching',
                        description: 'Consider using focus techniques like the Pomodoro method to reduce distractions.'
                    });
                }
                
                if (avgSession > 1200) { // 20 minutes
                    insights.push({
                        type: 'positive',
                        icon: '⏱️',
                        title: 'Long Focus Sessions',
                        description: 'Your average session length shows excellent deep work capability.'
                    });
                }
                
                const devActivities = activities.filter(a => 
                    ['cursor', 'visual studio code', 'vim', 'emacs'].some(dev => 
                        a.app_name.toLowerCase().includes(dev)
                    )
                );
                
                if (devActivities.length > activities.length * 0.7) {
                    insights.push({
                        type: 'positive',
                        icon: '👨‍💻',
                        title: 'High Development Focus',
                        description: 'Most of your time is spent in development tools - great coding focus!'
                    });
                }
                
                return insights.length > 0 ? insights : [{
                    type: 'neutral',
                    icon: '📊',
                    title: 'Gathering Data',
                    description: 'Keep using Compass to get personalized productivity insights!'
                }];
            }

            detectProjects(windows) {
                const projects = new Set();
                windows.forEach(window => {
                    const title = window.title || '';
                    // Look for common project indicators
                    if (title.includes('package.json')) projects.add('Node.js');
                    if (title.includes('Cargo.toml')) projects.add('Rust');
                    if (title.includes('go.mod')) projects.add('Go');
                    if (title.includes('requirements.txt')) projects.add('Python');
                    if (title.includes('Dockerfile')) projects.add('Docker');
                    if (title.includes('.tsx') || title.includes('.jsx')) projects.add('React');
                    if (title.includes('.vue')) projects.add('Vue');
                    if (title.includes('.py')) projects.add('Python');
                });
                return Array.from(projects);
            }

            detectGitRepo(windows) {
                for (const window of windows) {
                    const title = window.title || '';
                    // Look for git repo indicators
                    const match = title.match(/([a-zA-Z0-9_-]+)\s*[—-]\s*(.*)/);
                    if (match && (window.app_name.toLowerCase().includes('cursor') || 
                                 window.app_name.toLowerCase().includes('code'))) {
                        return match[1];
                    }
                }
                return null;
            }

            getWorkingFiles(windows) {
                const files = [];
                windows.forEach(window => {
                    const title = window.title || '';
                    if (window.app_name.toLowerCase().includes('cursor') || 
                        window.app_name.toLowerCase().includes('code')) {
                        const match = title.match(/^([^—-]+)/);
                        if (match) {
                            files.push({
                                name: match[1].trim(),
                                app: window.app_name
                            });
                        }
                    }
                });
                return files;
            }

            getFileIcon(filename) {
                const ext = filename.split('.').pop()?.toLowerCase();
                const icons = {
                    'js': '🟨', 'ts': '🔷', 'py': '🐍', 'go': '🔵', 'rs': '🦀',
                    'html': '🌐', 'css': '🎨', 'json': '📄', 'md': '📝',
                    'jsx': '⚛️', 'tsx': '⚛️', 'vue': '💚'
                };
                return icons[ext] || '📄';
            }

            categorizeResearchSites(activities) {
                const sites = {};
                activities.forEach(activity => {
                    const title = activity.window_title || '';
                    let category = 'General';
                    
                    if (title.includes('Stack Overflow') || title.includes('GitHub')) {
                        category = 'Code Reference';
                    } else if (title.includes('documentation') || title.includes('docs') || title.includes('MDN')) {
                        category = 'Documentation';
                    } else if (title.includes('tutorial') || title.includes('learn') || title.includes('course')) {
                        category = 'Learning';
                    } else if (title.includes('npm') || title.includes('crates.io') || title.includes('PyPI')) {
                        category = 'Package Research';
                    }
                    
                    if (!sites[category]) sites[category] = [];
                    sites[category].push({ title, url: title });
                });
                return sites;
            }

            getResearchIcon(category) {
                const icons = {
                    'Code Reference': '💡',
                    'Documentation': '📚',
                    'Learning': '🎓',
                    'Package Research': '📦',
                    'General': '🌐'
                };
                return icons[category] || '🌐';
            }

            analyzeWorkflowHealth(activities) {
                const switches = this.countContextSwitches(activities);
                const avgSession = this.calculateAvgSessionLength(activities);
                const multitasking = this.calculateMultitasking(activities);
                
                // Calculate workflow health score
                let score = 100;
                score -= Math.min(switches * 1.5, 25); // Penalty for switches
                score -= Math.min(multitasking * 8, 30); // Penalty for multitasking
                score += Math.min(avgSession / 120, 15); // Bonus for longer sessions
                score = Math.max(0, Math.min(100, Math.round(score)));
                
                const balance = Math.max(0, 100 - switches * 3);
                const consistency = avgSession > 300 ? 85 : 60;
                
                let emoji, color, message, suggestion;
                if (score > 80) {
                    emoji = '💪'; color = '#28a745';
                    message = 'Excellent workflow health!';
                    suggestion = 'Your current work patterns show great focus and productivity.';
                } else if (score > 60) {
                    emoji = '⚡'; color = '#ffc107';
                    message = 'Good workflow with room for improvement';
                    suggestion = 'Try to reduce context switching and maintain longer focus sessions.';
                } else {
                    emoji = '🔄'; color = '#dc3545';
                    message = 'Workflow needs attention';
                    suggestion = 'Consider implementing focus techniques and reducing multitasking.';
                }
                
                return { score, balance, consistency, emoji, color, message, suggestion };
            }

            escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text || '';
                return div.innerHTML;
            }

            showError(containerId, message) {
                const container = document.getElementById(containerId);
                container.innerHTML = ` + "`" + `<div class="error">${message}</div>` + "`" + `;
            }
        }

        // Initialize dashboard when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new CompassDashboard();
        });
    </script>
</body>
</html>`
}

