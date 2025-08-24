package server

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
	"github.com/gorilla/websocket"
)

// Server provides the REST API interface for Compass
type Server struct {
	db            Database
	captureEngine CaptureEngine
	windowManager WindowManager
	addr          string
	upgrader      websocket.Upgrader
	clients       map[*websocket.Conn]bool
	clientMu      sync.RWMutex

	activityChan chan *types.Activity
	server       *http.Server
}

// Database interface for the server
type Database interface {
	GetActivities(from, to time.Time, limit int) ([]*types.Activity, error)
	GetCurrentWorkspace() (*types.CurrentWorkspace, error)
	GetCurrentWorkspaceWithFocusCalculator(focusCalculator func() time.Duration) (*types.CurrentWorkspace, error)
	GetStats(period string, date time.Time) (*types.Stats, error)
	GetDatabaseStats() (map[string]interface{}, error)
	GetScreenshot(activityID int64) ([]byte, error)

	// New timeline and aggregation methods
	GetTimelineData(from, to time.Time, granularity string) (interface{}, error)
	GetTimeSlotMatrix(from, to time.Time, granularity string) (map[time.Time]map[string]int, error)
	GetAggregatedStats(from, to time.Time, granularity string) (*types.Stats, error)
	GetHeatmapData(from, to time.Time, granularity string) (map[string]interface{}, error)
	BackfillAggregations() error
	GetAggregationStatus() (map[string]interface{}, error)
}

// CaptureEngine interface for the server
type CaptureEngine interface {
	GetBufferStats() map[string]interface{}
}

// WindowManager interface for the server
type WindowManager interface {
	GetFocusDuration() time.Duration
}

// NewServer creates a new web server
func NewServer(config *types.ServerConfig, db Database, captureEngine CaptureEngine, windowManager WindowManager, activityChan chan *types.Activity) *Server {
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)

	return &Server{
		db:            db,
		captureEngine: captureEngine,
		windowManager: windowManager,
		addr:          addr,
		clients:       make(map[*websocket.Conn]bool),
		activityChan:  activityChan,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Allow connections from localhost
				return true
			},
		},
	}
}

// Start starts the web server
func (s *Server) Start(ctx context.Context) error {
	mux := http.NewServeMux()

	// API endpoints with CORS wrapper
	mux.HandleFunc("/api/activities", s.withCORS(s.handleActivities))
	mux.HandleFunc("/api/stats", s.withCORS(s.handleStats))
	mux.HandleFunc("/api/current", s.withCORS(s.handleCurrent))
	mux.HandleFunc("/api/export", s.withCORS(s.handleExport))
	mux.HandleFunc("/api/health", s.withCORS(s.handleHealth))
	mux.HandleFunc("/api/buffer-stats", s.withCORS(s.handleBufferStats))
	mux.HandleFunc("/api/screenshot/", s.withCORS(s.handleScreenshot))

	// New timeline and aggregation endpoints
	mux.HandleFunc("/api/timeline/", s.withCORS(s.HandleTimelineRouting))
	mux.HandleFunc("/api/admin/backfill", s.withCORS(s.HandleBackfillAggregations))
	mux.HandleFunc("/api/admin/aggregation-status", s.withCORS(s.HandleAggregationStatus))

	// Browser extension endpoints
	mux.HandleFunc("/api/v1/events/browser", s.withCORS(s.handleBrowserEvent))
	mux.HandleFunc("/api/v1/events/page-activity", s.withCORS(s.handlePageActivity))
	mux.HandleFunc("/api/v1/health", s.withCORS(s.handleHealth))

	// Editor extension endpoints
	mux.HandleFunc("/api/v1/events/editor", s.withCORS(s.handleEditorEvent))

	// WebSocket for real-time updates
	mux.HandleFunc("/ws", s.handleWebSocket)

	// CORS preflight handler and API info
	mux.HandleFunc("/", s.handleCORS)

	s.server = &http.Server{
		Addr:    s.addr,
		Handler: mux,
	}

	// Start WebSocket broadcaster
	go s.startBroadcaster(ctx)

	log.Printf("Compass API server running on http://%s", s.addr)
	log.Printf("Available endpoints:")
	log.Printf("  GET  /api/health           - Server health check")
	log.Printf("  GET  /api/current          - Current workspace state")
	log.Printf("  GET  /api/activities       - Activity history")
	log.Printf("  GET  /api/stats            - Workspace statistics")
	log.Printf("  GET  /api/buffer-stats     - Activity buffer statistics")
	log.Printf("  GET  /api/export           - Export data")
	log.Printf("  GET  /api/screenshot/*     - Activity screenshots")
	log.Printf("  POST /api/v1/events/browser     - Browser tab events")
	log.Printf("  POST /api/v1/events/page-activity - Page activity events")
	log.Printf("  POST /api/v1/events/editor      - Editor file events")
	log.Printf("  WS   /ws                   - Real-time updates")

	// Start server in goroutine
	go func() {
		if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Server error: %v", err)
		}
	}()

	// Wait for context cancellation
	<-ctx.Done()

	// Graceful shutdown
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	return s.server.Shutdown(shutdownCtx)
}

// Stop stops the web server
func (s *Server) Stop() error {
	if s.server != nil {
		return s.server.Close()
	}
	return nil
}

// handleActivities handles GET /api/activities
func (s *Server) handleActivities(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse query parameters
	query := r.URL.Query()

	// Default to last 24 hours
	to := time.Now()
	from := to.Add(-24 * time.Hour)
	limit := 100

	if fromStr := query.Get("from"); fromStr != "" {
		if parsed, err := time.Parse(time.RFC3339, fromStr); err == nil {
			from = parsed
		}
	}

	if toStr := query.Get("to"); toStr != "" {
		if parsed, err := time.Parse(time.RFC3339, toStr); err == nil {
			to = parsed
		}
	}

	if limitStr := query.Get("limit"); limitStr != "" {
		if parsed, err := strconv.Atoi(limitStr); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	// Get activities from database
	activities, err := s.db.GetActivities(from, to, limit)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get activities: %v", err), http.StatusInternalServerError)
		return
	}

	// Return JSON response
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	if err := json.NewEncoder(w).Encode(activities); err != nil {
		log.Printf("Failed to encode activities: %v", err)
	}
}

// handleStats handles GET /api/stats
func (s *Server) handleStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query()
	period := query.Get("period")
	if period == "" {
		period = "day"
	}

	date := time.Now()
	if dateStr := query.Get("date"); dateStr != "" {
		if parsed, err := time.Parse("2006-01-02", dateStr); err == nil {
			date = parsed
		}
	}

	stats, err := s.db.GetStats(period, date)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get stats: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(stats); err != nil {
		log.Printf("Failed to encode stats: %v", err)
	}
}

// handleCurrent handles GET /api/current
func (s *Server) handleCurrent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get current workspace with real-time focus duration
	current, err := s.db.GetCurrentWorkspaceWithFocusCalculator(func() time.Duration {
		if s.windowManager != nil {
			return s.windowManager.GetFocusDuration()
		}
		return 0
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get current workspace: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(current); err != nil {
		log.Printf("Failed to encode current workspace: %v", err)
	}
}

// handleExport handles GET /api/export
func (s *Server) handleExport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query()
	format := query.Get("format")
	if format == "" {
		format = "json"
	}

	// Default to last 7 days
	to := time.Now()
	from := to.Add(-7 * 24 * time.Hour)

	if fromStr := query.Get("from"); fromStr != "" {
		if parsed, err := time.Parse(time.RFC3339, fromStr); err == nil {
			from = parsed
		}
	}

	if toStr := query.Get("to"); toStr != "" {
		if parsed, err := time.Parse(time.RFC3339, toStr); err == nil {
			to = parsed
		}
	}

	// Get all activities in range
	activities, err := s.db.GetActivities(from, to, 10000) // Large limit for export
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get activities: %v", err), http.StatusInternalServerError)
		return
	}

	// Set appropriate headers
	filename := fmt.Sprintf("compass-export-%s.%s", from.Format("2006-01-02"), format)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	switch format {
	case "json":
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(activities)
	case "csv":
		w.Header().Set("Content-Type", "text/csv")
		s.exportCSV(w, activities)
	default:
		http.Error(w, "Unsupported format", http.StatusBadRequest)
	}
}

// handleHealth handles GET /api/health
func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	stats, err := s.db.GetDatabaseStats()
	if err != nil {
		http.Error(w, "Database unavailable", http.StatusServiceUnavailable)
		return
	}

	health := map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().Format(time.RFC3339),
		"database":  stats,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

// handleScreenshot handles GET /api/screenshot/{id}
func (s *Server) handleScreenshot(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract activity ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/screenshot/")
	activityID, err := strconv.ParseInt(path, 10, 64)
	if err != nil {
		http.Error(w, "Invalid activity ID", http.StatusBadRequest)
		return
	}

	// Get screenshot from database
	screenshot, err := s.db.GetScreenshot(activityID)
	if err != nil {
		if strings.Contains(err.Error(), "no screenshot found") {
			http.Error(w, "Screenshot not found", http.StatusNotFound)
		} else {
			http.Error(w, fmt.Sprintf("Failed to get screenshot: %v", err), http.StatusInternalServerError)
		}
		return
	}

	// Set appropriate headers
	w.Header().Set("Content-Type", "image/png") // Assuming PNG format
	w.Header().Set("Content-Length", fmt.Sprintf("%d", len(screenshot)))
	w.Header().Set("Cache-Control", "public, max-age=3600") // Cache for 1 hour
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Write screenshot data
	if _, err := w.Write(screenshot); err != nil {
		log.Printf("Failed to write screenshot: %v", err)
	}
}

// handleWebSocket handles WebSocket connections
func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	s.clientMu.Lock()
	s.clients[conn] = true
	s.clientMu.Unlock()

	defer func() {
		s.clientMu.Lock()
		delete(s.clients, conn)
		s.clientMu.Unlock()
	}()

	log.Printf("WebSocket client connected")

	// Send initial current workspace
	if current, err := s.db.GetCurrentWorkspace(); err == nil {
		s.sendToClient(conn, map[string]interface{}{
			"type": "current_workspace",
			"data": current,
		})
	}

	// Keep connection alive and handle client messages
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if !websocket.IsCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
	}
}

// startBroadcaster starts the WebSocket broadcaster
func (s *Server) startBroadcaster(ctx context.Context) {
	for {
		select {
		case activity := <-s.activityChan:
			s.broadcast(map[string]interface{}{
				"type": "activity_update",
				"data": activity,
			})
		case <-ctx.Done():
			return
		}
	}
}

// broadcast sends a message to all connected WebSocket clients
func (s *Server) broadcast(message interface{}) {
	s.clientMu.RLock()
	defer s.clientMu.RUnlock()

	for client := range s.clients {
		s.sendToClient(client, message)
	}
}

// sendToClient sends a message to a specific WebSocket client
func (s *Server) sendToClient(conn *websocket.Conn, message interface{}) {
	if err := conn.WriteJSON(message); err != nil {
		log.Printf("Failed to send WebSocket message: %v", err)
		conn.Close()
		s.clientMu.Lock()
		delete(s.clients, conn)
		s.clientMu.Unlock()
	}
}

// exportCSV exports activities to CSV format
func (s *Server) exportCSV(w http.ResponseWriter, activities []*types.Activity) {
	// Write CSV header
	fmt.Fprintln(w, "timestamp,app_name,window_title,category,focus_duration,total_windows")

	// Write activities
	for _, activity := range activities {
		fmt.Fprintf(w, "%s,%s,%s,%s,%d,%d\n",
			activity.Timestamp.Format(time.RFC3339),
			csvEscape(activity.AppName),
			csvEscape(activity.WindowTitle),
			csvEscape(activity.Category),
			activity.FocusDuration,
			activity.TotalWindows,
		)
	}
}

// csvEscape escapes CSV values
func csvEscape(value string) string {
	if strings.Contains(value, ",") || strings.Contains(value, "\"") || strings.Contains(value, "\n") {
		return fmt.Sprintf("\"%s\"", strings.ReplaceAll(value, "\"", "\"\""))
	}
	return value
}

// withCORS wraps HTTP handlers with CORS headers
func (s *Server) withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Call the actual handler
		handler(w, r)
	}
}

// handleCORS handles CORS preflight requests and serves API info
func (s *Server) handleCORS(w http.ResponseWriter, r *http.Request) {
	// Set CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	// Serve API information
	info := map[string]interface{}{
		"name":        "Compass API",
		"version":     "1.0.0",
		"description": "Workspace tracking and analytics API",
		"endpoints": map[string]string{
			"/api/health":       "Server health check",
			"/api/current":      "Current workspace state",
			"/api/activities":   "Activity history with optional filters",
			"/api/stats":        "Workspace statistics",
			"/api/export":       "Export data in JSON/CSV format",
			"/api/screenshot/*": "Activity screenshots",
			"/ws":               "WebSocket for real-time updates",
		},
		"websocket": map[string]string{
			"url":      "ws://" + r.Host + "/ws",
			"messages": "Receives current_workspace and activity_update events",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(info)
}

// handleBrowserEvent handles browser tab events from the extension
func (s *Server) handleBrowserEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var event struct {
		Type      string `json:"type"`
		Timestamp string `json:"timestamp"`
		EventType string `json:"event_type"`
		Tab       struct {
			ID         int    `json:"id"`
			URL        string `json:"url"`
			Title      string `json:"title"`
			FavIconURL string `json:"favIconUrl"`
			WindowID   int    `json:"windowId"`
			Index      int    `json:"index"`
			Pinned     bool   `json:"pinned"`
		} `json:"tab"`
		DurationMs int    `json:"duration_ms"`
		Browser    string `json:"browser"`
	}

	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Parse timestamp
	timestamp, err := time.Parse(time.RFC3339, event.Timestamp)
	if err != nil {
		timestamp = time.Now()
	}

	// Create an activity record for the browser tab
	activity := &types.Activity{
		Timestamp:     timestamp,
		AppName:       strings.Title(event.Browser),
		WindowTitle:   event.Tab.Title,
		ProcessID:     0, // Browser extension doesn't have PID
		IsActive:      event.EventType == "switch",
		FocusDuration: event.DurationMs / 1000, // Convert to seconds
		TotalWindows:  1,
		AllWindows: []types.Window{
			{
				AppName:   strings.Title(event.Browser),
				Title:     event.Tab.Title,
				ProcessID: 0,
				IsActive:  event.EventType == "switch",
			},
		},
		Category:   "Browser",
		Confidence: 1.0,
	}

	// Send to activity channel for real-time processing
	select {
	case s.activityChan <- activity:
		log.Printf("Browser event received: %s - %s (%s)", event.EventType, event.Tab.Title, event.Tab.URL)
	default:
		log.Printf("Activity channel full, dropping browser event")
	}

	// Respond with success
	response := map[string]interface{}{
		"status":  "success",
		"message": "Browser event received",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handlePageActivity handles page activity events from the extension
func (s *Server) handlePageActivity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var activity struct {
		Type      string `json:"type"`
		Timestamp string `json:"timestamp"`
		URL       string `json:"url"`
		Title     string `json:"title"`
		Domain    string `json:"domain"`
		Activity  struct {
			ScrollDepth  int `json:"scrollDepth"`
			TotalScrolls int `json:"totalScrolls"`
			Clicks       int `json:"clicks"`
			Keystrokes   int `json:"keystrokes"`
			TimeActive   int `json:"timeActive"`
			ReadingTime  int `json:"readingTime"`
		} `json:"activity"`
	}

	if err := json.NewDecoder(r.Body).Decode(&activity); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	log.Printf("Page activity received: %s - scrolled %d%%, %d clicks, %d keystrokes",
		activity.Domain, activity.Activity.ScrollDepth, activity.Activity.Clicks, activity.Activity.Keystrokes)

	// For now, just log the page activity
	// In the future, this could be stored in a separate table for detailed analytics

	response := map[string]interface{}{
		"status":  "success",
		"message": "Page activity received",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleEditorEvent handles editor file events from VS Code/Cursor extension
func (s *Server) handleEditorEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var event struct {
		Type      string `json:"type"`
		Timestamp string `json:"timestamp"`
		EventType string `json:"event_type,omitempty"`
		File      struct {
			FileName        string `json:"fileName"`
			LanguageID      string `json:"languageId"`
			LineCount       int    `json:"lineCount"`
			IsUntitled      bool   `json:"isUntitled"`
			WorkspaceFolder struct {
				Name string `json:"name"`
				URI  string `json:"uri"`
			} `json:"workspaceFolder"`
		} `json:"file,omitempty"`
		DurationMs int `json:"duration_ms,omitempty"`
		Keystrokes int `json:"keystrokes,omitempty"`
		Selections int `json:"selections,omitempty"`
		Lines      int `json:"lines,omitempty"`
		Editor     struct {
			Name     string `json:"name"`
			Version  string `json:"version"`
			Language string `json:"language"`
			Theme    string `json:"theme"`
			Platform string `json:"platform"`
		} `json:"editor"`
	}

	if err := json.NewDecoder(r.Body).Decode(&event); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Parse timestamp
	timestamp, err := time.Parse(time.RFC3339, event.Timestamp)
	if err != nil {
		timestamp = time.Now()
	}

	// Create an activity record for the editor file
	var activity *types.Activity

	if event.Type == "file_activity" || event.Type == "file_event" {
		// Extract filename for display
		fileName := event.File.FileName
		if event.File.FileName != "" {
			// Get just the filename from the full path
			parts := strings.Split(event.File.FileName, "/")
			if len(parts) > 0 {
				fileName = parts[len(parts)-1]
			}
			// Also try Windows path separator
			parts = strings.Split(fileName, "\\")
			if len(parts) > 0 {
				fileName = parts[len(parts)-1]
			}
		}

		// Create window title with file and editor info
		windowTitle := fileName
		if event.File.LanguageID != "" {
			windowTitle = fmt.Sprintf("%s (%s)", fileName, event.File.LanguageID)
		}

		activity = &types.Activity{
			Timestamp:     timestamp,
			AppName:       event.Editor.Name,
			WindowTitle:   windowTitle,
			ProcessID:     0, // Extension doesn't have access to PID
			IsActive:      event.EventType == "switch" || event.Type == "file_activity",
			FocusDuration: event.DurationMs / 1000, // Convert to seconds
			TotalWindows:  1,
			AllWindows: []types.Window{
				{
					AppName:   event.Editor.Name,
					Title:     windowTitle,
					ProcessID: 0,
					IsActive:  event.EventType == "switch" || event.Type == "file_activity",
				},
			},
			Category:   fmt.Sprintf("Development - %s", strings.Title(event.File.LanguageID)),
			Confidence: 1.0,
		}

		// Send to activity channel for real-time processing
		select {
		case s.activityChan <- activity:
			log.Printf("Editor event received: %s - %s (keystrokes: %d, selections: %d)",
				event.EventType, fileName, event.Keystrokes, event.Selections)
		default:
			log.Printf("Activity channel full, dropping editor event")
		}
	} else {
		// Log other event types (workspace changes, etc.)
		log.Printf("Editor event received: %s - %s", event.Type, event.EventType)
	}

	// Respond with success
	response := map[string]interface{}{
		"status":  "success",
		"message": "Editor event received",
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleBufferStats handles requests for activity buffer statistics
func (s *Server) handleBufferStats(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var stats map[string]interface{}
	if s.captureEngine != nil {
		stats = s.captureEngine.GetBufferStats()
	} else {
		stats = map[string]interface{}{
			"error": "Capture engine not available",
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}
