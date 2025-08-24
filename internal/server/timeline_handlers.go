package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"
)

// TimelineRequest represents a timeline data request
type TimelineRequest struct {
	From        time.Time `json:"from"`
	To          time.Time `json:"to"`
	Granularity string    `json:"granularity"`
}

// TimelineResponse represents the response for timeline data
type TimelineResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Meta    interface{} `json:"meta,omitempty"`
}

// HandleTimelineRouting routes timeline requests to appropriate handlers
func (s *Server) HandleTimelineRouting(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	if !strings.HasPrefix(path, "/api/timeline/") {
		s.writeErrorResponse(w, http.StatusNotFound, "Invalid timeline endpoint")
		return
	}

	pathSuffix := path[len("/api/timeline/"):]
	parts := strings.Split(pathSuffix, "/")
	if len(parts) == 0 || parts[0] == "" {
		s.writeErrorResponse(w, http.StatusBadRequest, "Granularity is required")
		return
	}

	granularity := parts[0]

	// Route to specific handlers based on sub-path
	if len(parts) == 1 {
		// /api/timeline/{granularity}
		s.handleTimelineData(w, r, granularity)
	} else if len(parts) == 2 {
		switch parts[1] {
		case "matrix":
			// /api/timeline/{granularity}/matrix
			s.handleTimelineMatrix(w, r, granularity)
		case "heatmap":
			// /api/timeline/{granularity}/heatmap
			s.handleHeatmapData(w, r, granularity)
		case "stats":
			// /api/timeline/{granularity}/stats
			s.handleAggregatedStats(w, r, granularity)
		default:
			s.writeErrorResponse(w, http.StatusNotFound, "Invalid timeline sub-endpoint")
		}
	} else {
		s.writeErrorResponse(w, http.StatusNotFound, "Invalid timeline endpoint")
	}
}

// handleTimelineData returns aggregated timeline data
func (s *Server) handleTimelineData(w http.ResponseWriter, r *http.Request, granularity string) {

	// Validate granularity
	validGranularities := map[string]bool{
		"minute": true, "hour": true, "day": true,
		"week": true, "month": true, "year": true,
	}
	if !validGranularities[granularity] {
		s.writeErrorResponse(w, http.StatusBadRequest, "Invalid granularity. Must be one of: minute, hour, day, week, month, year")
		return
	}

	// Parse query parameters
	from, to, err := s.parseTimeRange(r)
	if err != nil {
		s.writeErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid time range: %v", err))
		return
	}

	// Get timeline data from database
	timelineData, err := s.db.GetTimelineData(from, to, granularity)
	if err != nil {
		s.writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get timeline data: %v", err))
		return
	}

	// Return response with data count (handle interface{} type)
	dataPointCount := 0
	if timelineData != nil {
		// Try to get length if it's a slice
		if reflect.ValueOf(timelineData).Kind() == reflect.Slice {
			dataPointCount = reflect.ValueOf(timelineData).Len()
		}
	}

	response := TimelineResponse{
		Success: true,
		Data:    timelineData,
		Meta: map[string]interface{}{
			"granularity": granularity,
			"date_range":  map[string]string{"from": from.Format(time.RFC3339), "to": to.Format(time.RFC3339)},
			"data_points": dataPointCount,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleTimelineMatrix returns a matrix of time slots and apps for visualization
func (s *Server) handleTimelineMatrix(w http.ResponseWriter, r *http.Request, granularity string) {

	from, to, err := s.parseTimeRange(r)
	if err != nil {
		s.writeErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid time range: %v", err))
		return
	}

	matrix, err := s.db.GetTimeSlotMatrix(from, to, granularity)
	if err != nil {
		s.writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get timeline matrix: %v", err))
		return
	}

	// Get time slot count directly since matrix is a typed map
	timeSlotCount := len(matrix)

	response := TimelineResponse{
		Success: true,
		Data:    matrix,
		Meta: map[string]interface{}{
			"granularity": granularity,
			"date_range":  map[string]string{"from": from.Format(time.RFC3339), "to": to.Format(time.RFC3339)},
			"time_slots":  timeSlotCount,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleHeatmapData returns heatmap visualization data
func (s *Server) handleHeatmapData(w http.ResponseWriter, r *http.Request, granularity string) {

	from, to, err := s.parseTimeRange(r)
	if err != nil {
		s.writeErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid time range: %v", err))
		return
	}

	heatmapData, err := s.db.GetHeatmapData(from, to, granularity)
	if err != nil {
		s.writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get heatmap data: %v", err))
		return
	}

	response := TimelineResponse{
		Success: true,
		Data:    heatmapData,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleAggregatedStats returns statistics using aggregated data
func (s *Server) handleAggregatedStats(w http.ResponseWriter, r *http.Request, granularity string) {

	from, to, err := s.parseTimeRange(r)
	if err != nil {
		s.writeErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Invalid time range: %v", err))
		return
	}

	stats, err := s.db.GetAggregatedStats(from, to, granularity)
	if err != nil {
		s.writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get stats: %v", err))
		return
	}

	response := TimelineResponse{
		Success: true,
		Data:    stats,
		Meta: map[string]interface{}{
			"granularity": granularity,
			"date_range":  map[string]string{"from": from.Format(time.RFC3339), "to": to.Format(time.RFC3339)},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HandleBackfillAggregations triggers aggregation backfill
func (s *Server) HandleBackfillAggregations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		s.writeErrorResponse(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Run backfill in background
	go func() {
		if err := s.db.BackfillAggregations(); err != nil {
			fmt.Printf("Backfill failed: %v\n", err)
		} else {
			fmt.Println("Aggregation backfill completed successfully")
		}
	}()

	response := TimelineResponse{
		Success: true,
		Data:    map[string]string{"message": "Aggregation backfill started"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// HandleAggregationStatus returns the status of aggregation tables
func (s *Server) HandleAggregationStatus(w http.ResponseWriter, r *http.Request) {
	status, err := s.db.GetAggregationStatus()
	if err != nil {
		s.writeErrorResponse(w, http.StatusInternalServerError, fmt.Sprintf("Failed to get aggregation status: %v", err))
		return
	}

	response := TimelineResponse{
		Success: true,
		Data:    status,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// parseTimeRange parses time range from query parameters
func (s *Server) parseTimeRange(r *http.Request) (time.Time, time.Time, error) {
	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")

	var from, to time.Time
	var err error

	if fromStr != "" {
		from, err = time.Parse(time.RFC3339, fromStr)
		if err != nil {
			// Try parsing as Unix timestamp
			if unixTime, err2 := strconv.ParseInt(fromStr, 10, 64); err2 == nil {
				from = time.Unix(unixTime, 0)
			} else {
				return time.Time{}, time.Time{}, fmt.Errorf("invalid 'from' timestamp: %v", err)
			}
		}
	} else {
		// Default to 24 hours ago
		from = time.Now().Add(-24 * time.Hour)
	}

	if toStr != "" {
		to, err = time.Parse(time.RFC3339, toStr)
		if err != nil {
			// Try parsing as Unix timestamp
			if unixTime, err2 := strconv.ParseInt(toStr, 10, 64); err2 == nil {
				to = time.Unix(unixTime, 0)
			} else {
				return time.Time{}, time.Time{}, fmt.Errorf("invalid 'to' timestamp: %v", err)
			}
		}
	} else {
		// Default to now
		to = time.Now()
	}

	if to.Before(from) {
		return time.Time{}, time.Time{}, fmt.Errorf("'to' timestamp cannot be before 'from' timestamp")
	}

	return from, to, nil
}

// writeErrorResponse writes an error response
func (s *Server) writeErrorResponse(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	response := TimelineResponse{
		Success: false,
		Error:   message,
	}

	json.NewEncoder(w).Encode(response)
}
