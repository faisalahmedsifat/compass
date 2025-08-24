package server

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

// MockDatabase implements the Database interface for testing
type MockDatabase struct {
	timelineData    interface{}
	timeSlotMatrix  map[time.Time]map[string]int
	aggregatedStats *types.Stats
	heatmapData     map[string]interface{}
	backfillCalled  bool
	statusData      map[string]interface{}
	shouldError     bool
}

func (m *MockDatabase) GetActivities(from, to time.Time, limit int) ([]*types.Activity, error) {
	if m.shouldError {
		return nil, fmt.Errorf("mock error")
	}
	return []*types.Activity{}, nil
}

func (m *MockDatabase) GetCurrentWorkspace() (*types.CurrentWorkspace, error) {
	return &types.CurrentWorkspace{}, nil
}

func (m *MockDatabase) GetCurrentWorkspaceWithFocusCalculator(calc func() time.Duration) (*types.CurrentWorkspace, error) {
	return &types.CurrentWorkspace{}, nil
}

func (m *MockDatabase) GetStats(period string, date time.Time) (*types.Stats, error) {
	return &types.Stats{}, nil
}

func (m *MockDatabase) GetDatabaseStats() (map[string]interface{}, error) {
	return map[string]interface{}{}, nil
}

func (m *MockDatabase) GetScreenshot(id int64) ([]byte, error) {
	return []byte{}, nil
}

func (m *MockDatabase) GetTimelineData(from, to time.Time, granularity string) (interface{}, error) {
	if m.shouldError {
		return nil, fmt.Errorf("mock timeline error")
	}
	return m.timelineData, nil
}

func (m *MockDatabase) GetTimeSlotMatrix(from, to time.Time, granularity string) (map[time.Time]map[string]int, error) {
	if m.shouldError {
		return nil, fmt.Errorf("mock matrix error")
	}
	return m.timeSlotMatrix, nil
}

func (m *MockDatabase) GetAggregatedStats(from, to time.Time, granularity string) (*types.Stats, error) {
	if m.shouldError {
		return nil, fmt.Errorf("mock stats error")
	}
	return m.aggregatedStats, nil
}

func (m *MockDatabase) GetHeatmapData(from, to time.Time, granularity string) (map[string]interface{}, error) {
	if m.shouldError {
		return nil, fmt.Errorf("mock heatmap error")
	}
	return m.heatmapData, nil
}

func (m *MockDatabase) BackfillAggregations() error {
	if m.shouldError {
		return fmt.Errorf("mock backfill error")
	}
	m.backfillCalled = true
	return nil
}

func (m *MockDatabase) GetAggregationStatus() (map[string]interface{}, error) {
	if m.shouldError {
		return nil, fmt.Errorf("mock status error")
	}
	return m.statusData, nil
}

// Helper function to create a test server
func createTestServer(mockDB *MockDatabase) *Server {
	return &Server{
		db: mockDB,
	}
}

// Helper function to create test request with query parameters
func createTestRequest(method, path string, params map[string]string) *http.Request {
	u, _ := url.Parse(path)
	q := u.Query()
	for key, value := range params {
		q.Add(key, value)
	}
	u.RawQuery = q.Encode()

	req := httptest.NewRequest(method, u.String(), nil)
	return req
}

// Helper function to parse JSON response
func parseTimelineResponse(t *testing.T, body string) TimelineResponse {
	var response TimelineResponse
	err := json.Unmarshal([]byte(body), &response)
	if err != nil {
		t.Fatalf("Failed to parse response JSON: %v", err)
	}
	return response
}

func TestHandleTimelineRouting(t *testing.T) {
	testMatrix := map[time.Time]map[string]int{
		time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC): {
			"Chrome": 2400,
		},
	}

	testHeatmap := map[string]interface{}{
		"granularity": "hour",
		"data": []map[string]interface{}{
			{
				"time_slot":  "2024-01-15T14:00:00Z",
				"total_time": 3600,
			},
		},
	}

	testStats := &types.Stats{
		Period:     "hour",
		TotalTime:  time.Hour,
		ByApp:      map[string]time.Duration{"Chrome": time.Hour},
		ByCategory: map[string]time.Duration{"Development": time.Hour},
	}

	mockDB := &MockDatabase{
		timelineData: []interface{}{
			map[string]interface{}{
				"time_slot":   "2024-01-15T14:00:00Z",
				"granularity": "hour",
				"total_time":  3600,
			},
		},
		timeSlotMatrix:  testMatrix,
		heatmapData:     testHeatmap,
		aggregatedStats: testStats,
	}

	server := createTestServer(mockDB)

	tests := []struct {
		name           string
		path           string
		expectedStatus int
		shouldError    bool
	}{
		{
			name:           "valid timeline data request",
			path:           "/api/timeline/hour",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "valid matrix request",
			path:           "/api/timeline/hour/matrix",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "valid heatmap request",
			path:           "/api/timeline/day/heatmap",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "valid stats request",
			path:           "/api/timeline/week/stats",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid granularity",
			path:           "/api/timeline/invalid",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "invalid sub-endpoint",
			path:           "/api/timeline/hour/invalid",
			expectedStatus: http.StatusNotFound,
		},
		{
			name:           "missing granularity",
			path:           "/api/timeline/",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "too many path segments",
			path:           "/api/timeline/hour/matrix/extra",
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", tt.path, nil)
			w := httptest.NewRecorder()

			server.HandleTimelineRouting(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			// For successful requests, verify response structure
			if w.Code == http.StatusOK {
				response := parseTimelineResponse(t, w.Body.String())
				if !response.Success {
					t.Errorf("Expected successful response")
				}
				if response.Data == nil {
					t.Errorf("Expected data in response")
				}
			}
		})
	}
}

func TestHandleTimelineData(t *testing.T) {
	testData := []map[string]interface{}{
		{
			"time_slot":   "2024-01-15T14:00:00Z",
			"granularity": "hour",
			"total_time":  3600,
			"app_breakdown": map[string]interface{}{
				"Chrome": map[string]interface{}{
					"app_name":   "Chrome",
					"total_time": 2400,
					"category":   "Development",
				},
			},
		},
	}

	tests := []struct {
		name           string
		mockData       interface{}
		granularity    string
		params         map[string]string
		shouldError    bool
		expectedStatus int
		validate       func(t *testing.T, response TimelineResponse)
	}{
		{
			name:        "successful timeline data request",
			mockData:    testData,
			granularity: "hour",
			params: map[string]string{
				"from": "2024-01-15T14:00:00Z",
				"to":   "2024-01-15T15:00:00Z",
			},
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, response TimelineResponse) {
				if !response.Success {
					t.Errorf("Expected successful response")
				}
				if response.Data == nil {
					t.Errorf("Expected data in response")
				}

				meta, ok := response.Meta.(map[string]interface{})
				if !ok {
					t.Errorf("Expected meta to be a map")
					return
				}

				if granularity, ok := meta["granularity"].(string); !ok || granularity != "hour" {
					t.Errorf("Expected granularity 'hour' in meta")
				}
			},
		},
		{
			name:           "invalid granularity",
			mockData:       testData,
			granularity:    "invalid",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:        "invalid time range",
			mockData:    testData,
			granularity: "hour",
			params: map[string]string{
				"from": "invalid-date",
				"to":   "2024-01-15T15:00:00Z",
			},
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "database error",
			mockData:       nil,
			granularity:    "hour",
			shouldError:    true,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockDB := &MockDatabase{
				timelineData: tt.mockData,
				shouldError:  tt.shouldError,
			}
			server := createTestServer(mockDB)

			req := createTestRequest("GET", "/api/timeline/"+tt.granularity, tt.params)
			w := httptest.NewRecorder()

			server.handleTimelineData(w, req, tt.granularity)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d. Body: %s", tt.expectedStatus, w.Code, w.Body.String())
			}

			if w.Code == http.StatusOK && tt.validate != nil {
				response := parseTimelineResponse(t, w.Body.String())
				tt.validate(t, response)
			}
		})
	}
}

func TestHandleTimelineMatrix(t *testing.T) {
	testMatrix := map[time.Time]map[string]int{
		time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC): {
			"Chrome": 2400,
			"VSCode": 1200,
		},
		time.Date(2024, 1, 15, 15, 0, 0, 0, time.UTC): {
			"Slack": 900,
		},
	}

	tests := []struct {
		name           string
		mockMatrix     map[time.Time]map[string]int
		granularity    string
		shouldError    bool
		expectedStatus int
		validate       func(t *testing.T, response TimelineResponse)
	}{
		{
			name:           "successful matrix request",
			mockMatrix:     testMatrix,
			granularity:    "hour",
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, response TimelineResponse) {
				if !response.Success {
					t.Errorf("Expected successful response")
				}

				meta, ok := response.Meta.(map[string]interface{})
				if !ok {
					t.Errorf("Expected meta to be a map")
					return
				}

				if timeSlots, ok := meta["time_slots"].(int); !ok || timeSlots != 2 {
					t.Errorf("Expected 2 time slots, got %v", meta["time_slots"])
				}
			},
		},
		{
			name:           "empty matrix",
			mockMatrix:     map[time.Time]map[string]int{},
			granularity:    "day",
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, response TimelineResponse) {
				meta, ok := response.Meta.(map[string]interface{})
				if !ok {
					t.Errorf("Expected meta to be a map")
					return
				}

				if timeSlots, ok := meta["time_slots"].(int); !ok || timeSlots != 0 {
					t.Errorf("Expected 0 time slots for empty matrix, got %v", meta["time_slots"])
				}
			},
		},
		{
			name:           "database error",
			mockMatrix:     nil,
			granularity:    "hour",
			shouldError:    true,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockDB := &MockDatabase{
				timeSlotMatrix: tt.mockMatrix,
				shouldError:    tt.shouldError,
			}
			server := createTestServer(mockDB)

			req := httptest.NewRequest("GET", "/api/timeline/"+tt.granularity+"/matrix", nil)
			w := httptest.NewRecorder()

			server.handleTimelineMatrix(w, req, tt.granularity)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if w.Code == http.StatusOK && tt.validate != nil {
				response := parseTimelineResponse(t, w.Body.String())
				tt.validate(t, response)
			}
		})
	}
}

func TestHandleHeatmapData(t *testing.T) {
	testHeatmapData := map[string]interface{}{
		"granularity": "hour",
		"data": []map[string]interface{}{
			{
				"time_slot":  "2024-01-15T14:00:00Z",
				"total_time": 3600,
				"apps":       3,
				"categories": 2,
				"top_apps": []map[string]interface{}{
					{
						"app_name":   "Chrome",
						"total_time": 2400,
						"percentage": 66.7,
						"category":   "Development",
					},
				},
			},
		},
		"summary": map[string]interface{}{
			"total_periods": 1,
		},
	}

	tests := []struct {
		name           string
		mockData       map[string]interface{}
		granularity    string
		shouldError    bool
		expectedStatus int
	}{
		{
			name:           "successful heatmap request",
			mockData:       testHeatmapData,
			granularity:    "hour",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "empty heatmap data",
			mockData:       map[string]interface{}{},
			granularity:    "day",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "database error",
			mockData:       nil,
			granularity:    "hour",
			shouldError:    true,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockDB := &MockDatabase{
				heatmapData: tt.mockData,
				shouldError: tt.shouldError,
			}
			server := createTestServer(mockDB)

			req := httptest.NewRequest("GET", "/api/timeline/"+tt.granularity+"/heatmap", nil)
			w := httptest.NewRecorder()

			server.handleHeatmapData(w, req, tt.granularity)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if w.Code == http.StatusOK {
				response := parseTimelineResponse(t, w.Body.String())
				if !response.Success {
					t.Errorf("Expected successful response")
				}
			}
		})
	}
}

func TestHandleAggregatedStats(t *testing.T) {
	testStats := &types.Stats{
		Period:    "hour",
		TotalTime: 2 * time.Hour,
		ByApp: map[string]time.Duration{
			"Chrome": time.Hour,
			"VSCode": time.Hour,
		},
		ByCategory: map[string]time.Duration{
			"Development": 2 * time.Hour,
		},
		ContextSwitches: 15,
		LongestFocus:    45 * time.Minute,
	}

	tests := []struct {
		name           string
		mockStats      *types.Stats
		granularity    string
		shouldError    bool
		expectedStatus int
		validate       func(t *testing.T, response TimelineResponse)
	}{
		{
			name:           "successful stats request",
			mockStats:      testStats,
			granularity:    "hour",
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, response TimelineResponse) {
				if !response.Success {
					t.Errorf("Expected successful response")
				}

				// Verify the data contains expected stats
				if response.Data == nil {
					t.Errorf("Expected stats data in response")
				}
			},
		},
		{
			name:           "database error",
			mockStats:      nil,
			granularity:    "day",
			shouldError:    true,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockDB := &MockDatabase{
				aggregatedStats: tt.mockStats,
				shouldError:     tt.shouldError,
			}
			server := createTestServer(mockDB)

			req := httptest.NewRequest("GET", "/api/timeline/"+tt.granularity+"/stats", nil)
			w := httptest.NewRecorder()

			server.handleAggregatedStats(w, req, tt.granularity)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if w.Code == http.StatusOK && tt.validate != nil {
				response := parseTimelineResponse(t, w.Body.String())
				tt.validate(t, response)
			}
		})
	}
}

func TestHandleBackfillAggregations(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		shouldError    bool
		expectedStatus int
		validate       func(t *testing.T, mockDB *MockDatabase, response TimelineResponse)
	}{
		{
			name:           "successful backfill request",
			method:         "POST",
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, mockDB *MockDatabase, response TimelineResponse) {
				if !response.Success {
					t.Errorf("Expected successful response")
				}
				if !mockDB.backfillCalled {
					t.Errorf("Expected backfill to be called")
				}
			},
		},
		{
			name:           "invalid method",
			method:         "GET",
			expectedStatus: http.StatusMethodNotAllowed,
			validate: func(t *testing.T, mockDB *MockDatabase, response TimelineResponse) {
				if mockDB.backfillCalled {
					t.Errorf("Expected backfill NOT to be called for invalid method")
				}
			},
		},
		{
			name:           "database error",
			method:         "POST",
			shouldError:    true,
			expectedStatus: http.StatusOK, // Still returns OK but logs error
			validate: func(t *testing.T, mockDB *MockDatabase, response TimelineResponse) {
				// Even with database error, the endpoint returns success
				// because it runs in background
				if !response.Success {
					t.Errorf("Expected successful response even with background error")
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockDB := &MockDatabase{
				shouldError: tt.shouldError,
			}
			server := createTestServer(mockDB)

			req := httptest.NewRequest(tt.method, "/api/admin/backfill", nil)
			w := httptest.NewRecorder()

			server.HandleBackfillAggregations(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if tt.validate != nil {
				if w.Code == http.StatusOK {
					response := parseTimelineResponse(t, w.Body.String())
					tt.validate(t, mockDB, response)
				} else {
					tt.validate(t, mockDB, TimelineResponse{})
				}
			}
		})
	}
}

func TestHandleAggregationStatus(t *testing.T) {
	testStatusData := map[string]interface{}{
		"enabled":  true,
		"last_run": "2024-01-15T14:30:00Z",
		"aggregation_tables": map[string]interface{}{
			"hour": map[string]interface{}{
				"count":      100,
				"min_bucket": "2024-01-01T00:00:00Z",
				"max_bucket": "2024-01-15T14:00:00Z",
			},
			"day": map[string]interface{}{
				"count":      15,
				"min_bucket": "2024-01-01",
				"max_bucket": "2024-01-15",
			},
		},
	}

	tests := []struct {
		name           string
		mockStatus     map[string]interface{}
		shouldError    bool
		expectedStatus int
		validate       func(t *testing.T, response TimelineResponse)
	}{
		{
			name:           "successful status request",
			mockStatus:     testStatusData,
			expectedStatus: http.StatusOK,
			validate: func(t *testing.T, response TimelineResponse) {
				if !response.Success {
					t.Errorf("Expected successful response")
				}

				statusData, ok := response.Data.(map[string]interface{})
				if !ok {
					t.Errorf("Expected status data to be a map")
					return
				}

				if enabled, ok := statusData["enabled"].(bool); !ok || !enabled {
					t.Errorf("Expected enabled to be true")
				}

				if _, ok := statusData["aggregation_tables"]; !ok {
					t.Errorf("Expected aggregation_tables in status")
				}
			},
		},
		{
			name:           "database error",
			mockStatus:     nil,
			shouldError:    true,
			expectedStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockDB := &MockDatabase{
				statusData:  tt.mockStatus,
				shouldError: tt.shouldError,
			}
			server := createTestServer(mockDB)

			req := httptest.NewRequest("GET", "/api/admin/aggregation-status", nil)
			w := httptest.NewRecorder()

			server.HandleAggregationStatus(w, req)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			if w.Code == http.StatusOK && tt.validate != nil {
				response := parseTimelineResponse(t, w.Body.String())
				tt.validate(t, response)
			}
		})
	}
}

func TestParseTimeRange(t *testing.T) {
	server := createTestServer(&MockDatabase{})

	tests := []struct {
		name        string
		params      map[string]string
		expectError bool
		validate    func(t *testing.T, from, to time.Time)
	}{
		{
			name: "valid ISO 8601 timestamps",
			params: map[string]string{
				"from": "2024-01-15T14:00:00Z",
				"to":   "2024-01-15T15:00:00Z",
			},
			expectError: false,
			validate: func(t *testing.T, from, to time.Time) {
				expectedFrom := time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)
				expectedTo := time.Date(2024, 1, 15, 15, 0, 0, 0, time.UTC)

				if !from.Equal(expectedFrom) {
					t.Errorf("Expected from %v, got %v", expectedFrom, from)
				}
				if !to.Equal(expectedTo) {
					t.Errorf("Expected to %v, got %v", expectedTo, to)
				}
			},
		},
		{
			name: "unix timestamps",
			params: map[string]string{
				"from": "1705327200", // 2024-01-15T14:00:00Z
				"to":   "1705330800", // 2024-01-15T15:00:00Z
			},
			expectError: false,
			validate: func(t *testing.T, from, to time.Time) {
				expectedFrom := time.Unix(1705327200, 0)
				expectedTo := time.Unix(1705330800, 0)

				if !from.Equal(expectedFrom) {
					t.Errorf("Expected from %v, got %v", expectedFrom, from)
				}
				if !to.Equal(expectedTo) {
					t.Errorf("Expected to %v, got %v", expectedTo, to)
				}
			},
		},
		{
			name:        "no parameters (use defaults)",
			params:      map[string]string{},
			expectError: false,
			validate: func(t *testing.T, from, to time.Time) {
				// Should default to last 24 hours
				if to.Sub(from) != 24*time.Hour {
					t.Errorf("Expected 24 hour range, got %v", to.Sub(from))
				}
			},
		},
		{
			name: "invalid from timestamp",
			params: map[string]string{
				"from": "invalid-date",
				"to":   "2024-01-15T15:00:00Z",
			},
			expectError: true,
		},
		{
			name: "invalid to timestamp",
			params: map[string]string{
				"from": "2024-01-15T14:00:00Z",
				"to":   "invalid-date",
			},
			expectError: true,
		},
		{
			name: "to before from",
			params: map[string]string{
				"from": "2024-01-15T15:00:00Z",
				"to":   "2024-01-15T14:00:00Z",
			},
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := createTestRequest("GET", "/api/timeline/hour", tt.params)

			from, to, err := server.parseTimeRange(req)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
			} else {
				if err != nil {
					t.Errorf("Unexpected error: %v", err)
				} else if tt.validate != nil {
					tt.validate(t, from, to)
				}
			}
		})
	}
}

func TestWriteErrorResponse(t *testing.T) {
	server := createTestServer(&MockDatabase{})

	tests := []struct {
		name           string
		statusCode     int
		message        string
		expectedStatus int
	}{
		{
			name:           "bad request error",
			statusCode:     http.StatusBadRequest,
			message:        "Invalid parameters",
			expectedStatus: http.StatusBadRequest,
		},
		{
			name:           "internal server error",
			statusCode:     http.StatusInternalServerError,
			message:        "Database connection failed",
			expectedStatus: http.StatusInternalServerError,
		},
		{
			name:           "not found error",
			statusCode:     http.StatusNotFound,
			message:        "Endpoint not found",
			expectedStatus: http.StatusNotFound,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			w := httptest.NewRecorder()

			server.writeErrorResponse(w, tt.statusCode, tt.message)

			if w.Code != tt.expectedStatus {
				t.Errorf("Expected status %d, got %d", tt.expectedStatus, w.Code)
			}

			response := parseTimelineResponse(t, w.Body.String())
			if response.Success {
				t.Errorf("Expected error response to have Success=false")
			}

			if response.Error != tt.message {
				t.Errorf("Expected error message '%s', got '%s'", tt.message, response.Error)
			}

			// Verify Content-Type header
			contentType := w.Header().Get("Content-Type")
			if contentType != "application/json" {
				t.Errorf("Expected Content-Type 'application/json', got '%s'", contentType)
			}
		})
	}
}

// Integration test that verifies the complete request flow
func TestTimelineEndpointIntegration(t *testing.T) {
	// Create a more realistic mock with sample data
	timelineData := []map[string]interface{}{
		{
			"time_slot":   "2024-01-15T14:00:00Z",
			"granularity": "hour",
			"total_time":  3600,
			"app_breakdown": map[string]interface{}{
				"Chrome": map[string]interface{}{
					"app_name":    "Chrome",
					"total_time":  2400,
					"active_time": 2100,
					"category":    "Development",
					"percentage":  66.7,
				},
				"VSCode": map[string]interface{}{
					"app_name":    "VSCode",
					"total_time":  1200,
					"active_time": 1200,
					"category":    "Development",
					"percentage":  33.3,
				},
			},
			"metadata": map[string]interface{}{
				"total_activities": 45,
				"total_apps":       2,
				"total_categories": 1,
				"screenshot_count": 12,
			},
		},
	}

	mockDB := &MockDatabase{
		timelineData: timelineData,
	}
	server := createTestServer(mockDB)

	// Test the complete flow from routing to response
	req := createTestRequest("GET", "/api/timeline/hour", map[string]string{
		"from": "2024-01-15T14:00:00Z",
		"to":   "2024-01-15T15:00:00Z",
	})
	w := httptest.NewRecorder()

	server.HandleTimelineRouting(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", w.Code, w.Body.String())
	}

	response := parseTimelineResponse(t, w.Body.String())

	if !response.Success {
		t.Errorf("Expected successful response")
	}

	if response.Data == nil {
		t.Errorf("Expected data in response")
	}

	// Verify metadata structure
	meta, ok := response.Meta.(map[string]interface{})
	if !ok {
		t.Errorf("Expected meta to be a map")
		return
	}

	requiredMetaFields := []string{"granularity", "date_range", "data_points"}
	for _, field := range requiredMetaFields {
		if _, exists := meta[field]; !exists {
			t.Errorf("Expected field '%s' in response metadata", field)
		}
	}

	// Verify date range in metadata
	dateRange, ok := meta["date_range"].(map[string]interface{})
	if !ok {
		t.Errorf("Expected date_range to be a map")
	} else {
		if from, exists := dateRange["from"]; !exists {
			t.Errorf("Expected 'from' in date_range")
		} else if from != "2024-01-15T14:00:00Z" {
			t.Errorf("Expected from timestamp in response metadata")
		}

		if to, exists := dateRange["to"]; !exists {
			t.Errorf("Expected 'to' in date_range")
		} else if to != "2024-01-15T15:00:00Z" {
			t.Errorf("Expected to timestamp in response metadata")
		}
	}
}
