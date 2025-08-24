// Compass VS Code Extension - Main Logic
// Tracks file-level activity and sends to Compass daemon

const vscode = require('vscode');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class CompassTracker {
    constructor(context) {
        this.context = context;
        this.config = vscode.workspace.getConfiguration('compass');
        this.apiUrl = this.config.get('apiUrl', 'http://localhost:8080/api/v1');
        this.enabled = this.config.get('enabled', true);
        
        // Current file tracking
        this.currentFile = null;
        this.fileStartTime = null;
        this.sessionStats = {
            filesOpened: 0,
            totalKeystrokes: 0,
            totalSelections: 0,
            activeTime: 0
        };
        
        // Activity tracking
        this.keystrokeCount = 0;
        this.selectionCount = 0;
        this.lastActivity = Date.now();
        
        // Status bar
        this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBar.command = 'compass.showStats';
        this.updateStatusBar();
        
        this.setupEventListeners();
        this.startPeriodicUpdates();
        
        console.log('Compass Activity Tracker initialized');
    }

    setupEventListeners() {
        // Track active editor changes (file switches)
        this.context.subscriptions.push(
            vscode.window.onDidChangeActiveTextEditor(editor => {
                this.handleFileChange(editor);
            })
        );

        // Track document opens
        this.context.subscriptions.push(
            vscode.workspace.onDidOpenTextDocument(document => {
                this.handleFileOpen(document);
            })
        );

        // Track document closes
        this.context.subscriptions.push(
            vscode.workspace.onDidCloseTextDocument(document => {
                this.handleFileClose(document);
            })
        );

        // Track text changes (keystrokes)
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeTextDocument(event => {
                this.handleTextChange(event);
            })
        );

        // Track cursor position changes (selections)
        this.context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(event => {
                this.handleSelectionChange(event);
            })
        );

        // Track workspace changes
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeWorkspaceFolders(event => {
                this.handleWorkspaceChange(event);
            })
        );

        // Configuration changes
        this.context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(event => {
                if (event.affectsConfiguration('compass')) {
                    this.config = vscode.workspace.getConfiguration('compass');
                    this.apiUrl = this.config.get('apiUrl');
                    this.enabled = this.config.get('enabled');
                }
            })
        );
    }

    async handleFileChange(editor) {
        if (!this.enabled) return;

        // Record activity for previous file
        if (this.currentFile && this.fileStartTime) {
            await this.recordFileActivity(this.currentFile, true);
        }

        if (editor && editor.document) {
            this.currentFile = {
                fileName: editor.document.fileName,
                languageId: editor.document.languageId,
                lineCount: editor.document.lineCount,
                isUntitled: editor.document.isUntitled,
                workspaceFolder: this.getWorkspaceFolder(editor.document.uri)
            };
            
            this.fileStartTime = Date.now();
            this.keystrokeCount = 0;
            this.selectionCount = 0;
            this.lastActivity = Date.now();

            console.log(`Switched to file: ${this.currentFile.fileName}`);
            
            // Send file switch event
            await this.sendFileEvent('switch', this.currentFile);
            this.updateStatusBar();
        } else {
            this.currentFile = null;
            this.fileStartTime = null;
        }
    }

    handleFileOpen(document) {
        if (!this.enabled) return;
        
        this.sessionStats.filesOpened++;
        
        const fileInfo = {
            fileName: document.fileName,
            languageId: document.languageId,
            lineCount: document.lineCount,
            isUntitled: document.isUntitled,
            workspaceFolder: this.getWorkspaceFolder(document.uri)
        };

        console.log(`Opened file: ${fileInfo.fileName}`);
        this.sendFileEvent('open', fileInfo);
    }

    handleFileClose(document) {
        if (!this.enabled) return;
        
        const fileInfo = {
            fileName: document.fileName,
            languageId: document.languageId,
            lineCount: document.lineCount,
            isUntitled: document.isUntitled,
            workspaceFolder: this.getWorkspaceFolder(document.uri)
        };

        console.log(`Closed file: ${fileInfo.fileName}`);
        this.sendFileEvent('close', fileInfo);

        // If this was the current file, record final activity
        if (this.currentFile && this.currentFile.fileName === document.fileName) {
            this.recordFileActivity(this.currentFile, true);
            this.currentFile = null;
            this.fileStartTime = null;
        }
    }

    handleTextChange(event) {
        if (!this.enabled || !this.config.get('trackKeystrokes')) return;
        
        if (event.contentChanges.length > 0) {
            this.keystrokeCount += event.contentChanges.reduce((total, change) => {
                return total + change.text.length;
            }, 0);
            this.sessionStats.totalKeystrokes += this.keystrokeCount;
            this.lastActivity = Date.now();
        }
    }

    handleSelectionChange(event) {
        if (!this.enabled || !this.config.get('trackSelections')) return;
        
        if (event.selections && event.selections.length > 0) {
            this.selectionCount++;
            this.sessionStats.totalSelections++;
            this.lastActivity = Date.now();
        }
    }

    handleWorkspaceChange(event) {
        if (!this.enabled) return;
        
        console.log('Workspace changed:', event);
        this.sendWorkspaceEvent('change', {
            added: event.added.map(folder => folder.uri.toString()),
            removed: event.removed.map(folder => folder.uri.toString())
        });
    }

    async recordFileActivity(fileInfo, isFileSwitch = false) {
        if (!fileInfo || !this.fileStartTime) return;

        const duration = Date.now() - this.fileStartTime;
        const minTime = this.config.get('minFileTime', 5) * 1000;

        // Only record if spent enough time in file
        if (duration < minTime && !isFileSwitch) return;

        const activity = {
            type: 'file_activity',
            timestamp: new Date().toISOString(),
            file: fileInfo,
            duration_ms: duration,
            keystrokes: this.keystrokeCount,
            selections: this.selectionCount,
            lines: fileInfo.lineCount,
            last_activity: new Date(this.lastActivity).toISOString(),
            editor: this.getEditorInfo()
        };

        await this.sendToCompass('/events/editor', activity);
        this.sessionStats.activeTime += duration;
    }

    async sendFileEvent(eventType, fileInfo, extra = {}) {
        const event = {
            type: 'file_event',
            timestamp: new Date().toISOString(),
            event_type: eventType,
            file: fileInfo,
            editor: this.getEditorInfo(),
            ...extra
        };

        await this.sendToCompass('/events/editor', event);
    }

    async sendWorkspaceEvent(eventType, workspaceInfo) {
        const event = {
            type: 'workspace_event',
            timestamp: new Date().toISOString(),
            event_type: eventType,
            workspace: workspaceInfo,
            editor: this.getEditorInfo()
        };

        await this.sendToCompass('/events/editor', event);
    }

    async sendToCompass(endpoint, data) {
        try {
            const url = new URL(endpoint, this.apiUrl);
            const requestData = JSON.stringify(data);
            
            const options = {
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(requestData)
                }
            };

            const client = url.protocol === 'https:' ? https : http;
            
            await new Promise((resolve, reject) => {
                const req = client.request(options, (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve();
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });

                req.on('error', reject);
                req.write(requestData);
                req.end();
            });

        } catch (error) {
            console.error('Failed to send to Compass:', error.message);
            // Store locally for retry if needed
            this.storeEventLocally(data);
        }
    }

    storeEventLocally(event) {
        // Store in workspace state for retry later
        const stored = this.context.workspaceState.get('pendingEvents', []);
        stored.push(event);
        
        // Keep only last 50 events to prevent storage bloat
        if (stored.length > 50) {
            stored.splice(0, stored.length - 50);
        }
        
        this.context.workspaceState.update('pendingEvents', stored);
    }

    async retryPendingEvents() {
        const stored = this.context.workspaceState.get('pendingEvents', []);
        if (stored.length === 0) return;

        console.log(`Retrying ${stored.length} pending events`);
        
        for (const event of stored) {
            try {
                await this.sendToCompass('/events/editor', event);
            } catch (error) {
                // Stop retrying on first failure
                break;
            }
        }
        
        // Clear successfully sent events
        await this.context.workspaceState.update('pendingEvents', []);
    }

    getEditorInfo() {
        const editor = vscode.window.activeTextEditor;
        return {
            name: vscode.env.appName,
            version: vscode.version,
            language: editor ? editor.document.languageId : null,
            theme: vscode.workspace.getConfiguration('workbench').get('colorTheme'),
            platform: process.platform
        };
    }

    getWorkspaceFolder(uri) {
        const folder = vscode.workspace.getWorkspaceFolder(uri);
        return folder ? {
            name: folder.name,
            uri: folder.uri.toString()
        } : null;
    }

    updateStatusBar() {
        if (!this.enabled) {
            this.statusBar.text = "$(compass) Disabled";
            this.statusBar.tooltip = "Compass tracking is disabled";
            this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        } else if (this.currentFile) {
            const duration = this.fileStartTime ? Math.floor((Date.now() - this.fileStartTime) / 1000) : 0;
            const fileName = this.currentFile.fileName.split(/[\\/]/).pop();
            this.statusBar.text = `$(compass) ${fileName} (${duration}s)`;
            this.statusBar.tooltip = `Compass: Tracking ${fileName} for ${duration} seconds`;
            this.statusBar.backgroundColor = undefined;
        } else {
            this.statusBar.text = "$(compass) Ready";
            this.statusBar.tooltip = "Compass: Ready to track file activity";
            this.statusBar.backgroundColor = undefined;
        }
        this.statusBar.show();
    }

    startPeriodicUpdates() {
        // Update status bar every second
        setInterval(() => {
            this.updateStatusBar();
        }, 1000);

        // Retry pending events every 30 seconds
        setInterval(() => {
            this.retryPendingEvents();
        }, 30000);

        // Record current file activity every 30 seconds
        setInterval(() => {
            if (this.currentFile && this.fileStartTime) {
                this.recordFileActivity(this.currentFile);
            }
        }, 30000);
    }

    async showStats() {
        const activeTime = Math.floor(this.sessionStats.activeTime / 1000);
        const currentFileTime = this.fileStartTime ? Math.floor((Date.now() - this.fileStartTime) / 1000) : 0;
        
        const message = `Compass Session Stats:
📁 Files opened: ${this.sessionStats.filesOpened}
⌨️  Keystrokes: ${this.sessionStats.totalKeystrokes}
📝 Selections: ${this.sessionStats.totalSelections}
⏱️  Active time: ${activeTime}s
🔄 Current file: ${currentFileTime}s`;

        await vscode.window.showInformationMessage(message, 'Open Dashboard', 'Close');
    }

    async openDashboard() {
        const dashboardUrl = this.apiUrl.replace('/api/v1', '');
        await vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
    }

    toggleTracking() {
        this.enabled = !this.enabled;
        vscode.workspace.getConfiguration('compass').update('enabled', this.enabled, true);
        this.updateStatusBar();
        
        const status = this.enabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`Compass tracking ${status}`);
    }

    dispose() {
        // Record final activity before disposing
        if (this.currentFile && this.fileStartTime) {
            this.recordFileActivity(this.currentFile, true);
        }
        this.statusBar.dispose();
    }
}

// Extension activation
function activate(context) {
    console.log('Activating Compass Activity Tracker extension');
    
    const tracker = new CompassTracker(context);
    
    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('compass.showStats', () => tracker.showStats())
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('compass.openDashboard', () => tracker.openDashboard())
    );
    
    context.subscriptions.push(
        vscode.commands.registerCommand('compass.toggleTracking', () => tracker.toggleTracking())
    );

    // Store tracker for disposal
    context.subscriptions.push(tracker);
    
    console.log('Compass Activity Tracker extension activated');
}

// Extension deactivation
function deactivate() {
    console.log('Deactivating Compass Activity Tracker extension');
}

module.exports = {
    activate,
    deactivate
};
