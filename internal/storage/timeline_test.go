package storage

import (
	"testing"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

func TestDatabase_GetTimelineData(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Create test data
	baseTime := time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)
	activities := []*types.Activity{
		createTestActivity(baseTime, "Chrome", "Development", 600, true),
		createTestActivity(baseTime.Add(30*time.Minute), "VSCode", "Development", 900, true),
		createTestActivity(baseTime.Add(2*time.Hour), "Slack", "Communication", 300, true),
	}

	// Save activities and let aggregation happen
	for _, activity := range activities {
		err := db.SaveActivity(activity)
		if err != nil {
			t.Fatalf("Failed to save activity: %v", err)
		}
	}

	// Wait a moment for async aggregation (in real implementation)
	// For test, we'll manually trigger aggregation
	engine := NewAggregationEngine(db)
	for _, activity := range activities {
		err := engine.ProcessNewActivity(activity)
		if err != nil {
			t.Fatalf("Failed to process activity: %v", err)
		}
	}

	tests := []struct {
		name        string
		from        time.Time
		to          time.Time
		granularity string
		wantErr     bool
		validate    func(t *testing.T, result interface{})
	}{
		{
			name:        "hourly timeline data",
			from:        baseTime.Add(-time.Hour),
			to:          baseTime.Add(4 * time.Hour),
			granularity: "hour",
			wantErr:     false,
			validate: func(t *testing.T, result interface{}) {
				dataPoints, ok := result.([]*TimelineDataPoint)
				if !ok {
					t.Errorf("Expected []*TimelineDataPoint, got %T", result)
					return
				}

				if len(dataPoints) == 0 {
					t.Errorf("Expected timeline data points, got none")
					return
				}

				// Verify we have data for expected apps
				foundChrome := false
				foundVSCode := false
				foundSlack := false

				for _, dp := range dataPoints {
					for appName := range dp.AppBreakdown {
						switch appName {
						case "Chrome":
							foundChrome = true
						case "VSCode":
							foundVSCode = true
						case "Slack":
							foundSlack = true
						}
					}
				}

				if !foundChrome {
					t.Errorf("Expected Chrome in timeline data")
				}
				if !foundVSCode {
					t.Errorf("Expected VSCode in timeline data")
				}
				if !foundSlack {
					t.Errorf("Expected Slack in timeline data")
				}
			},
		},
		{
			name:        "daily timeline data",
			from:        baseTime.Add(-24 * time.Hour),
			to:          baseTime.Add(24 * time.Hour),
			granularity: "day",
			wantErr:     false,
			validate: func(t *testing.T, result interface{}) {
				dataPoints, ok := result.([]*TimelineDataPoint)
				if !ok {
					t.Errorf("Expected []*TimelineDataPoint, got %T", result)
					return
				}

				// Should have at least one data point for the test day
				if len(dataPoints) == 0 {
					t.Errorf("Expected at least one daily data point")
				}

				for _, dp := range dataPoints {
					if dp.Granularity != "day" {
						t.Errorf("Expected granularity 'day', got '%s'", dp.Granularity)
					}

					if dp.TotalTime <= 0 {
						t.Errorf("Expected positive total time, got %d", dp.TotalTime)
					}

					if len(dp.AppBreakdown) == 0 {
						t.Errorf("Expected app breakdown data")
					}
				}
			},
		},
		{
			name:        "invalid granularity",
			from:        baseTime,
			to:          baseTime.Add(time.Hour),
			granularity: "invalid",
			wantErr:     false, // Should default to hour
			validate: func(t *testing.T, result interface{}) {
				// Should not fail, but use default granularity
				dataPoints, ok := result.([]*TimelineDataPoint)
				if !ok {
					t.Errorf("Expected []*TimelineDataPoint even with invalid granularity")
				} else if len(dataPoints) == 0 {
					// This might be expected if no data in the range
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := db.GetTimelineData(tt.from, tt.to, tt.granularity)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetTimelineData() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr && tt.validate != nil {
				tt.validate(t, result)
			}
		})
	}
}

func TestDatabase_GetTimeSlotMatrix(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Create test data
	baseTime := time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)
	activities := []*types.Activity{
		createTestActivity(baseTime, "Chrome", "Development", 600, true),
		createTestActivity(baseTime.Add(time.Hour), "VSCode", "Development", 900, true),
		createTestActivity(baseTime.Add(time.Hour), "Slack", "Communication", 300, true),
	}

	// Save and process activities
	engine := NewAggregationEngine(db)
	for _, activity := range activities {
		err := db.SaveActivity(activity)
		if err != nil {
			t.Fatalf("Failed to save activity: %v", err)
		}
		err = engine.ProcessNewActivity(activity)
		if err != nil {
			t.Fatalf("Failed to process activity: %v", err)
		}
	}

	matrix, err := db.GetTimeSlotMatrix(
		baseTime.Add(-time.Hour),
		baseTime.Add(3*time.Hour),
		"hour",
	)
	if err != nil {
		t.Fatalf("GetTimeSlotMatrix failed: %v", err)
	}

	if len(matrix) == 0 {
		t.Errorf("Expected non-empty matrix")
		return
	}

	// Verify matrix structure
	for timeSlot, apps := range matrix {
		if timeSlot.IsZero() {
			t.Errorf("Invalid time slot in matrix")
		}

		if len(apps) == 0 {
			t.Errorf("Expected apps data for time slot %v", timeSlot)
		}

		for appName, totalTime := range apps {
			if appName == "" {
				t.Errorf("Empty app name in matrix")
			}
			if totalTime <= 0 {
				t.Errorf("Expected positive total time for app %s, got %d", appName, totalTime)
			}
		}
	}

	// Check for expected apps
	foundChrome := false
	foundVSCode := false
	foundSlack := false

	for _, apps := range matrix {
		for appName := range apps {
			switch appName {
			case "Chrome":
				foundChrome = true
			case "VSCode":
				foundVSCode = true
			case "Slack":
				foundSlack = true
			}
		}
	}

	if !foundChrome {
		t.Errorf("Expected Chrome in matrix")
	}
	if !foundVSCode {
		t.Errorf("Expected VSCode in matrix")
	}
	if !foundSlack {
		t.Errorf("Expected Slack in matrix")
	}
}

func TestDatabase_GetHeatmapData(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Create test data
	baseTime := time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)
	activities := []*types.Activity{
		createTestActivity(baseTime, "Chrome", "Development", 600, true),
		createTestActivity(baseTime.Add(30*time.Minute), "VSCode", "Development", 900, true),
		createTestActivity(baseTime.Add(2*time.Hour), "Slack", "Communication", 300, true),
	}

	// Save and process activities
	engine := NewAggregationEngine(db)
	for _, activity := range activities {
		err := db.SaveActivity(activity)
		if err != nil {
			t.Fatalf("Failed to save activity: %v", err)
		}
		err = engine.ProcessNewActivity(activity)
		if err != nil {
			t.Fatalf("Failed to process activity: %v", err)
		}
	}

	heatmapData, err := db.GetHeatmapData(
		baseTime.Add(-time.Hour),
		baseTime.Add(4*time.Hour),
		"hour",
	)
	if err != nil {
		t.Fatalf("GetHeatmapData failed: %v", err)
	}

	// Verify heatmap data structure
	if granularity, ok := heatmapData["granularity"].(string); !ok || granularity != "hour" {
		t.Errorf("Expected granularity 'hour', got %v", heatmapData["granularity"])
	}

	data, ok := heatmapData["data"].([]map[string]interface{})
	if !ok {
		t.Errorf("Expected data to be array of maps")
		return
	}

	if len(data) == 0 {
		t.Errorf("Expected heatmap data points")
		return
	}

	// Verify data point structure
	for _, point := range data {
		requiredFields := []string{"time_slot", "total_time", "apps", "categories", "activities", "screenshots", "top_apps"}
		for _, field := range requiredFields {
			if _, exists := point[field]; !exists {
				t.Errorf("Missing required field '%s' in heatmap data point", field)
			}
		}

		// Verify top_apps structure
		if topApps, ok := point["top_apps"].([]map[string]interface{}); ok {
			for _, app := range topApps {
				requiredAppFields := []string{"app_name", "total_time", "percentage", "category"}
				for _, field := range requiredAppFields {
					if _, exists := app[field]; !exists {
						t.Errorf("Missing required field '%s' in top app data", field)
					}
				}
			}
		}
	}

	// Verify summary structure
	summary, ok := heatmapData["summary"].(map[string]interface{})
	if !ok {
		t.Errorf("Expected summary to be a map")
		return
	}

	if totalPeriods, ok := summary["total_periods"].(int); !ok || totalPeriods <= 0 {
		t.Errorf("Expected positive total_periods, got %v", summary["total_periods"])
	}

	if dateRange, ok := summary["date_range"].(map[string]string); !ok {
		t.Errorf("Expected date_range to be a map of strings")
	} else {
		if _, exists := dateRange["from"]; !exists {
			t.Errorf("Missing 'from' in date_range")
		}
		if _, exists := dateRange["to"]; !exists {
			t.Errorf("Missing 'to' in date_range")
		}
	}
}

func TestDatabase_GetAggregatedStats(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Create test data with different categories
	baseTime := time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)
	activities := []*types.Activity{
		createTestActivity(baseTime, "Chrome", "Development", 1800, true),    // 30 min
		createTestActivity(baseTime, "VSCode", "Development", 2400, true),    // 40 min
		createTestActivity(baseTime, "Slack", "Communication", 600, true),    // 10 min
		createTestActivity(baseTime, "Spotify", "Entertainment", 1200, true), // 20 min
	}

	// Save and process activities
	engine := NewAggregationEngine(db)
	for _, activity := range activities {
		err := db.SaveActivity(activity)
		if err != nil {
			t.Fatalf("Failed to save activity: %v", err)
		}
		err = engine.ProcessNewActivity(activity)
		if err != nil {
			t.Fatalf("Failed to process activity: %v", err)
		}
	}

	stats, err := db.GetAggregatedStats(
		baseTime.Add(-time.Hour),
		baseTime.Add(time.Hour),
		"hour",
	)
	if err != nil {
		t.Fatalf("GetAggregatedStats failed: %v", err)
	}

	// Verify stats structure
	if stats.Period != "hour" {
		t.Errorf("Expected period 'hour', got '%s'", stats.Period)
	}

	if len(stats.ByApp) == 0 {
		t.Errorf("Expected app statistics")
	}

	if len(stats.ByCategory) == 0 {
		t.Errorf("Expected category statistics")
	}

	if stats.TotalTime == 0 {
		t.Errorf("Expected positive total time")
	}

	// Verify specific app data
	expectedApps := []string{"Chrome", "VSCode", "Slack", "Spotify"}
	for _, appName := range expectedApps {
		if duration, exists := stats.ByApp[appName]; !exists {
			t.Errorf("Expected app '%s' in statistics", appName)
		} else if duration == 0 {
			t.Errorf("Expected positive duration for app '%s'", appName)
		}
	}

	// Verify category aggregation
	expectedCategories := []string{"Development", "Communication", "Entertainment"}
	for _, category := range expectedCategories {
		if duration, exists := stats.ByCategory[category]; !exists {
			t.Errorf("Expected category '%s' in statistics", category)
		} else if duration == 0 {
			t.Errorf("Expected positive duration for category '%s'", category)
		}
	}

	// Verify development category includes both Chrome and VSCode
	devDuration := stats.ByCategory["Development"]
	expectedDevDuration := time.Duration(1800+2400) * time.Second
	if devDuration != expectedDevDuration {
		t.Errorf("Expected development duration %v, got %v", expectedDevDuration, devDuration)
	}
}

func TestDatabase_BackfillAggregations(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Create activities without using the aggregation-enabled SaveActivity
	baseTime := time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)
	activities := []*types.Activity{
		createTestActivity(baseTime, "Chrome", "Development", 600, true),
		createTestActivity(baseTime.Add(time.Hour), "VSCode", "Development", 900, true),
		createTestActivity(baseTime.Add(25*time.Hour), "Slack", "Communication", 300, true), // Next day
	}

	// Save activities directly to bypass real-time aggregation
	for _, activity := range activities {
		windowsJSON := `[]`
		query := `
			INSERT INTO activities (
				timestamp, app_name, window_title, process_id, is_active,
				focus_duration, total_windows, window_list, category, confidence, screenshot
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`
		result, err := db.db.Exec(query,
			activity.Timestamp,
			activity.AppName,
			"Test Window",
			1234,
			activity.IsActive,
			activity.FocusDuration,
			activity.TotalWindows,
			windowsJSON,
			activity.Category,
			0.9,
			nil,
		)
		if err != nil {
			t.Fatalf("Failed to save test activity: %v", err)
		}

		id, _ := result.LastInsertId()
		activity.ID = id
	}

	// Verify no aggregations exist initially
	engine := NewAggregationEngine(db)
	initialRecords, err := engine.GetAggregatedData(
		baseTime.Add(-time.Hour),
		baseTime.Add(48*time.Hour),
		GranularityHour,
	)
	if err != nil {
		t.Fatalf("Failed to get initial aggregated data: %v", err)
	}

	if len(initialRecords) > 0 {
		t.Errorf("Expected no initial aggregations, got %d", len(initialRecords))
	}

	// Run backfill
	err = db.BackfillAggregations()
	if err != nil {
		t.Fatalf("BackfillAggregations failed: %v", err)
	}

	// Verify aggregations were created
	finalRecords, err := engine.GetAggregatedData(
		baseTime.Add(-time.Hour),
		baseTime.Add(48*time.Hour),
		GranularityHour,
	)
	if err != nil {
		t.Fatalf("Failed to get final aggregated data: %v", err)
	}

	if len(finalRecords) == 0 {
		t.Errorf("Expected aggregations after backfill, got none")
	}

	// Verify all apps are represented
	foundApps := make(map[string]bool)
	for _, record := range finalRecords {
		foundApps[record.AppName] = true
	}

	expectedApps := []string{"Chrome", "VSCode", "Slack"}
	for _, appName := range expectedApps {
		if !foundApps[appName] {
			t.Errorf("Expected app '%s' in backfilled aggregations", appName)
		}
	}
}

func TestDatabase_GetAggregationStatus(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	// Create some test data
	engine := NewAggregationEngine(db)
	activity := createTestActivity(time.Now(), "Chrome", "Development", 600, true)
	err := db.SaveActivity(activity)
	if err != nil {
		t.Fatalf("Failed to save activity: %v", err)
	}
	err = engine.ProcessNewActivity(activity)
	if err != nil {
		t.Fatalf("Failed to process activity: %v", err)
	}

	status, err := db.GetAggregationStatus()
	if err != nil {
		t.Fatalf("GetAggregationStatus failed: %v", err)
	}

	// Verify status structure
	if enabled, ok := status["enabled"].(bool); !ok || !enabled {
		t.Errorf("Expected aggregation to be enabled")
	}

	if lastRun, ok := status["last_run"].(string); !ok || lastRun == "" {
		t.Errorf("Expected last_run timestamp")
	}

	aggregationTables, ok := status["aggregation_tables"].(map[string]interface{})
	if !ok {
		t.Errorf("Expected aggregation_tables to be a map")
		return
	}

	// Verify all granularities are present
	expectedGranularities := []string{"minute", "hour", "day", "week", "month", "year"}
	for _, granularity := range expectedGranularities {
		if _, exists := aggregationTables[granularity]; !exists {
			t.Errorf("Expected granularity '%s' in aggregation tables status", granularity)
		}
	}

	// Verify at least one table has data
	foundData := false
	for _, tableStats := range aggregationTables {
		if stats, ok := tableStats.(map[string]interface{}); ok {
			if count, ok := stats["count"].(int); ok && count > 0 {
				foundData = true
				break
			}
		}
	}

	if !foundData {
		t.Errorf("Expected at least one aggregation table to have data")
	}
}

// Performance tests
func BenchmarkDatabase_GetTimelineData(b *testing.B) {
	db, cleanup := setupTestDB(&testing.T{})
	defer cleanup()

	// Create test data
	engine := NewAggregationEngine(db)
	baseTime := time.Now().Add(-24 * time.Hour)

	for i := 0; i < 1000; i++ {
		activity := createTestActivity(
			baseTime.Add(time.Duration(i)*time.Minute),
			"Chrome",
			"Development",
			300,
			true,
		)
		_ = db.SaveActivity(activity)
		_ = engine.ProcessNewActivity(activity)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = db.GetTimelineData(
			baseTime,
			time.Now(),
			"hour",
		)
	}
}

func BenchmarkDatabase_GetTimeSlotMatrix(b *testing.B) {
	db, cleanup := setupTestDB(&testing.T{})
	defer cleanup()

	// Create test data
	engine := NewAggregationEngine(db)
	baseTime := time.Now().Add(-24 * time.Hour)

	apps := []string{"Chrome", "VSCode", "Slack", "Spotify", "Terminal"}
	for i := 0; i < 500; i++ {
		activity := createTestActivity(
			baseTime.Add(time.Duration(i)*time.Minute),
			apps[i%len(apps)],
			"Development",
			300,
			true,
		)
		_ = db.SaveActivity(activity)
		_ = engine.ProcessNewActivity(activity)
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = db.GetTimeSlotMatrix(
			baseTime,
			time.Now(),
			"hour",
		)
	}
}

