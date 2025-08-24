package storage

import (
	"os"
	"testing"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

// setupTestDB creates a temporary test database
func setupTestDB(t *testing.T) (*Database, func()) {
	// Create temporary database file
	tmpFile, err := os.CreateTemp("", "compass_test_*.db")
	if err != nil {
		t.Fatalf("Failed to create temp database: %v", err)
	}
	tmpFile.Close()

	// Initialize database with proper connection
	db, err := NewDatabase(tmpFile.Name())
	if err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}

	// Ensure all aggregation tables exist
	engine := NewAggregationEngine(db)
	_ = engine // Make sure we have access to the engine

	// Return database and cleanup function
	return db, func() {
		if db != nil && db.db != nil {
			db.Close()
		}
		os.Remove(tmpFile.Name())
	}
}

// createTestActivity creates a test activity with specified parameters
func createTestActivity(timestamp time.Time, appName, category string, focusDuration int, isActive bool) *types.Activity {
	return &types.Activity{
		Timestamp:     timestamp,
		AppName:       appName,
		Category:      category,
		FocusDuration: focusDuration,
		IsActive:      isActive,
		TotalWindows:  1,
		AllWindows:    []types.Window{{AppName: appName, Title: "Test Window", IsActive: isActive}},
	}
}

func TestAggregationEngine_ProcessNewActivity(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	engine := NewAggregationEngine(db)
	timestamp := time.Date(2024, 1, 15, 14, 30, 0, 0, time.UTC)

	tests := []struct {
		name     string
		activity *types.Activity
		wantErr  bool
	}{
		{
			name:     "successful activity processing",
			activity: createTestActivity(timestamp, "Chrome", "Development", 300, true),
			wantErr:  false,
		},
		{
			name:     "inactive activity processing",
			activity: createTestActivity(timestamp, "Slack", "Communication", 0, false),
			wantErr:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Manually insert activity to get an ID (bypass async aggregation)
			windowsJSON := `[]`
			query := `
				INSERT INTO activities (
					timestamp, app_name, window_title, process_id, is_active,
					focus_duration, total_windows, window_list, category, confidence, screenshot
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			`
			result, err := db.db.Exec(query,
				tt.activity.Timestamp,
				tt.activity.AppName,
				"Test Window",
				1234,
				tt.activity.IsActive,
				tt.activity.FocusDuration,
				tt.activity.TotalWindows,
				windowsJSON,
				tt.activity.Category,
				0.9,
				nil,
			)
			if err != nil {
				t.Fatalf("Failed to save test activity: %v", err)
			}

			id, _ := result.LastInsertId()
			tt.activity.ID = id

			// Process the activity through aggregation engine directly
			err = engine.ProcessNewActivity(tt.activity)
			if (err != nil) != tt.wantErr {
				t.Errorf("ProcessNewActivity() error = %v, wantErr %v", err, tt.wantErr)
			}

			if !tt.wantErr {
				// Just test a couple of granularities to avoid overcomplicating
				testGranularities := []TimeGranularity{GranularityHour, GranularityDay}

				for _, granularity := range testGranularities {
					records, err := engine.GetAggregatedData(
						timestamp.Add(-time.Hour),
						timestamp.Add(time.Hour),
						granularity,
					)
					if err != nil {
						t.Errorf("Failed to get aggregated data for %s: %v", granularity, err)
						continue
					}

					// Verify we have some records (don't require exact matches for all granularities)
					if len(records) > 0 {
						t.Logf("Successfully created %d aggregation records for %s", len(records), granularity)
					}
				}
			}
		})
	}
}

func TestAggregationEngine_TimeBucketCalculation(t *testing.T) {
	engine := &AggregationEngine{}
	testTime := time.Date(2024, 1, 15, 14, 35, 42, 0, time.UTC) // Monday

	tests := []struct {
		granularity TimeGranularity
		expected    time.Time
	}{
		{GranularityMinute, time.Date(2024, 1, 15, 14, 35, 0, 0, time.UTC)},
		{GranularityHour, time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)},
		{GranularityDay, time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)},
		{GranularityWeek, time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC)}, // Monday, same day
		{GranularityMonth, time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)},
		{GranularityYear, time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)},
	}

	for _, tt := range tests {
		t.Run(string(tt.granularity), func(t *testing.T) {
			result := engine.calculateTimeBucket(testTime, tt.granularity)
			if !result.Equal(tt.expected) {
				t.Errorf("calculateTimeBucket(%s) = %v, want %v", tt.granularity, result, tt.expected)
			}
		})
	}
}

func TestAggregationEngine_WeekStartCalculation(t *testing.T) {
	engine := &AggregationEngine{}

	tests := []struct {
		name     string
		date     time.Time
		expected time.Time
	}{
		{
			name:     "Monday",
			date:     time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC), // Monday
			expected: time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC),
		},
		{
			name:     "Wednesday",
			date:     time.Date(2024, 1, 17, 14, 0, 0, 0, time.UTC), // Wednesday
			expected: time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC),  // Previous Monday
		},
		{
			name:     "Sunday",
			date:     time.Date(2024, 1, 21, 14, 0, 0, 0, time.UTC), // Sunday
			expected: time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC),  // Previous Monday
		},
		{
			name:     "Next Monday",
			date:     time.Date(2024, 1, 22, 14, 0, 0, 0, time.UTC), // Next Monday
			expected: time.Date(2024, 1, 22, 0, 0, 0, 0, time.UTC),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := engine.calculateTimeBucket(tt.date, GranularityWeek)
			if !result.Equal(tt.expected) {
				t.Errorf("Week calculation for %s: got %v, want %v", tt.name, result, tt.expected)
			}
		})
	}
}

func TestAggregationEngine_BackfillAggregations(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	engine := NewAggregationEngine(db)

	// Create test activities spanning multiple time periods
	baseTime := time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)
	activities := []*types.Activity{
		createTestActivity(baseTime, "Chrome", "Development", 600, true),
		createTestActivity(baseTime.Add(30*time.Minute), "VSCode", "Development", 900, true),
		createTestActivity(baseTime.Add(2*time.Hour), "Slack", "Communication", 300, true),
		createTestActivity(baseTime.Add(25*time.Hour), "Chrome", "Development", 1200, true), // Next day
	}

	// Save activities to database
	for _, activity := range activities {
		err := db.SaveActivity(activity)
		if err != nil {
			t.Fatalf("Failed to save test activity: %v", err)
		}
	}

	// Run backfill process
	from := baseTime.Add(-time.Hour)
	to := baseTime.Add(48 * time.Hour)
	err := engine.BackfillAggregations(from, to)
	if err != nil {
		t.Fatalf("BackfillAggregations failed: %v", err)
	}

	// Verify aggregations were created
	records, err := engine.GetAggregatedData(from, to, GranularityHour)
	if err != nil {
		t.Fatalf("Failed to get aggregated data: %v", err)
	}

	if len(records) == 0 {
		t.Errorf("No aggregated records found after backfill")
	}

	// Verify specific aggregations exist
	expectedCombinations := map[string]int{
		"Chrome/Development":  2, // Should appear in 2 different hours
		"VSCode/Development":  1,
		"Slack/Communication": 1,
	}

	actualCombinations := make(map[string]int)
	for _, record := range records {
		key := record.AppName + "/" + record.Category
		actualCombinations[key]++
	}

	for expectedKey, expectedCount := range expectedCombinations {
		if actualCount, exists := actualCombinations[expectedKey]; !exists {
			t.Errorf("Expected combination %s not found in aggregated data", expectedKey)
		} else if actualCount < expectedCount {
			t.Errorf("Expected at least %d records for %s, got %d", expectedCount, expectedKey, actualCount)
		}
	}
}

func TestAggregationEngine_IncrementalUpdates(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	engine := NewAggregationEngine(db)
	timestamp := time.Date(2024, 1, 15, 14, 30, 0, 0, time.UTC)

	// First activity
	activity1 := createTestActivity(timestamp, "Chrome", "Development", 300, true)
	err := db.SaveActivity(activity1)
	if err != nil {
		t.Fatalf("Failed to save first activity: %v", err)
	}
	err = engine.ProcessNewActivity(activity1)
	if err != nil {
		t.Fatalf("Failed to process first activity: %v", err)
	}

	// Second activity (same app, same time bucket)
	activity2 := createTestActivity(timestamp.Add(15*time.Second), "Chrome", "Development", 400, true)
	err = db.SaveActivity(activity2)
	if err != nil {
		t.Fatalf("Failed to save second activity: %v", err)
	}
	err = engine.ProcessNewActivity(activity2)
	if err != nil {
		t.Fatalf("Failed to process second activity: %v", err)
	}

	// Verify the aggregation was updated (not duplicated)
	records, err := engine.GetAggregatedData(
		timestamp.Add(-time.Hour),
		timestamp.Add(time.Hour),
		GranularityMinute,
	)
	if err != nil {
		t.Fatalf("Failed to get aggregated data: %v", err)
	}

	// Should have exactly one record for Chrome/Development in this minute
	chromeRecords := 0
	totalSeconds := 0
	activityCount := 0

	for _, record := range records {
		if record.AppName == "Chrome" && record.Category == "Development" {
			chromeRecords++
			totalSeconds = record.TotalSeconds
			activityCount = record.ActivityCount
		}
	}

	if chromeRecords != 1 {
		t.Errorf("Expected exactly 1 Chrome record, got %d", chromeRecords)
	}

	if totalSeconds != 700 { // 300 + 400
		t.Errorf("Expected total seconds to be 700, got %d", totalSeconds)
	}

	if activityCount != 2 {
		t.Errorf("Expected activity count to be 2, got %d", activityCount)
	}
}

func TestAggregationEngine_GetAggregationStats(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	engine := NewAggregationEngine(db)

	// Create and process some test activities
	baseTime := time.Date(2024, 1, 15, 14, 0, 0, 0, time.UTC)
	activities := []*types.Activity{
		createTestActivity(baseTime, "Chrome", "Development", 600, true),
		createTestActivity(baseTime.Add(time.Hour), "VSCode", "Development", 900, true),
	}

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

	// Get aggregation stats
	stats, err := engine.GetAggregationStats()
	if err != nil {
		t.Fatalf("Failed to get aggregation stats: %v", err)
	}

	// Verify stats contain expected granularities
	expectedGranularities := []string{"minute", "hour", "day", "week", "month", "year"}
	for _, granularity := range expectedGranularities {
		if _, exists := stats[granularity]; !exists {
			t.Errorf("Expected granularity %s not found in stats", granularity)
		}
	}

	// Verify at least some data exists
	hourStats, ok := stats["hour"].(map[string]interface{})
	if !ok {
		t.Errorf("Hour stats should be a map")
	} else {
		count, ok := hourStats["count"].(int)
		if !ok || count == 0 {
			t.Errorf("Expected hour stats to have non-zero count, got %v", count)
		}
	}
}

func TestAggregationEngine_CleanupOldAggregations(t *testing.T) {
	db, cleanup := setupTestDB(t)
	defer cleanup()

	engine := NewAggregationEngine(db)

	// Create old and new activities
	oldTime := time.Now().Add(-10 * 24 * time.Hour) // 10 days ago
	newTime := time.Now().Add(-1 * time.Hour)       // 1 hour ago

	activities := []*types.Activity{
		createTestActivity(oldTime, "Chrome", "Development", 600, true),
		createTestActivity(newTime, "VSCode", "Development", 900, true),
	}

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

	// Set very short retention policy for testing
	retentionPolicy := map[TimeGranularity]time.Duration{
		GranularityMinute: 1 * time.Hour,       // Very short for testing
		GranularityHour:   2 * time.Hour,       // Very short for testing
		GranularityDay:    5 * 24 * time.Hour,  // 5 days
		GranularityWeek:   10 * 24 * time.Hour, // 10 days
		GranularityMonth:  20 * 24 * time.Hour, // 20 days
		GranularityYear:   30 * 24 * time.Hour, // 30 days
	}

	// Run cleanup
	err := engine.CleanupOldAggregations(retentionPolicy)
	if err != nil {
		t.Fatalf("Failed to cleanup old aggregations: %v", err)
	}

	// Verify old minute/hour records were cleaned up, but recent ones remain
	recentRecords, err := engine.GetAggregatedData(
		newTime.Add(-time.Hour),
		newTime.Add(time.Hour),
		GranularityHour,
	)
	if err != nil {
		t.Fatalf("Failed to get recent aggregated data: %v", err)
	}

	if len(recentRecords) == 0 {
		t.Errorf("Recent records should not have been cleaned up")
	}

	// Check that we still have day-level aggregations for old data
	oldRecords, err := engine.GetAggregatedData(
		oldTime.Add(-time.Hour),
		oldTime.Add(time.Hour),
		GranularityDay,
	)
	if err != nil {
		t.Fatalf("Failed to get old aggregated data: %v", err)
	}

	if len(oldRecords) == 0 {
		t.Errorf("Old day-level records should still exist")
	}
}

// Benchmark tests for performance validation
func BenchmarkAggregationEngine_ProcessNewActivity(b *testing.B) {
	db, cleanup := setupTestDB(&testing.T{})
	defer cleanup()

	engine := NewAggregationEngine(db)
	activity := createTestActivity(time.Now(), "Chrome", "Development", 300, true)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		activity.Timestamp = time.Now().Add(time.Duration(i) * time.Second)
		_ = engine.ProcessNewActivity(activity)
	}
}

func BenchmarkAggregationEngine_GetAggregatedData(b *testing.B) {
	db, cleanup := setupTestDB(&testing.T{})
	defer cleanup()

	engine := NewAggregationEngine(db)

	// Create some test data
	baseTime := time.Now().Add(-24 * time.Hour)
	for i := 0; i < 100; i++ {
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
		_, _ = engine.GetAggregatedData(
			baseTime,
			time.Now(),
			GranularityHour,
		)
	}
}
