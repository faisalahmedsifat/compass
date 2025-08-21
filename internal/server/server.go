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

// Server provides the web interface for Compass
type Server struct {
	db       Database
	addr     string
	upgrader websocket.Upgrader
	clients  map[*websocket.Conn]bool
	clientMu sync.RWMutex
	
	activityChan chan *types.Activity
	server       *http.Server
}

// Database interface for the server
type Database interface {
	GetActivities(from, to time.Time, limit int) ([]*types.Activity, error)
	GetCurrentWorkspace() (*types.CurrentWorkspace, error)
	GetStats(period string, date time.Time) (*types.Stats, error)
	GetDatabaseStats() (map[string]interface{}, error)
}

// NewServer creates a new web server
func NewServer(config *types.ServerConfig, db Database, activityChan chan *types.Activity) *Server {
	addr := fmt.Sprintf("%s:%s", config.Host, config.Port)
	
	return &Server{
		db:           db,
		addr:         addr,
		clients:      make(map[*websocket.Conn]bool),
		activityChan: activityChan,
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

	// API endpoints
	mux.HandleFunc("/api/activities", s.handleActivities)
	mux.HandleFunc("/api/stats", s.handleStats)
	mux.HandleFunc("/api/current", s.handleCurrent)
	mux.HandleFunc("/api/export", s.handleExport)
	mux.HandleFunc("/api/health", s.handleHealth)

	// WebSocket for real-time updates
	mux.HandleFunc("/ws", s.handleWebSocket)

	// Static files
	mux.HandleFunc("/", s.handleDashboard)

	s.server = &http.Server{
		Addr:    s.addr,
		Handler: mux,
	}

	// Start WebSocket broadcaster
	go s.startBroadcaster(ctx)

	log.Printf("Dashboard available at http://%s", s.addr)
	
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
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
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

	current, err := s.db.GetCurrentWorkspace()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to get current workspace: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	
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
	w.Header().Set("Access-Control-Allow-Origin", "*")

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

// handleDashboard serves the main dashboard HTML
func (s *Server) handleDashboard(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}

	// For MVP, serve a simple embedded HTML dashboard
	html := getDashboardHTML()
	w.Header().Set("Content-Type", "text/html")
	w.Write([]byte(html))
}
