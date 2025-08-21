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
                
                // Also initialize context switches display
                document.getElementById('context-switches').innerHTML = '<div class="stat-item"><div class="stat-value">Loading...</div><div class="stat-label">Context switches being tracked</div></div>';
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

