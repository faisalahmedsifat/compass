package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
	_ "github.com/mattn/go-sqlite3"
)

// Database handles all database operations
type Database struct {
	db *sql.DB
}

// NewDatabase creates a new database connection
func NewDatabase(dbPath string) (*Database, error) {
	db, err := sql.Open("sqlite3", dbPath+"?_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	database := &Database{db: db}

	// Initialize schema
	if err := database.initSchema(); err != nil {
		return nil, fmt.Errorf("failed to initialize schema: %w", err)
	}

	log.Printf("Database initialized at: %s", dbPath)
	return database, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	return d.db.Close()
}

// SaveActivity saves an activity record to the database and updates aggregations
func (d *Database) SaveActivity(activity *types.Activity) error {
	// Serialize windows to JSON
	windowsJSON, err := json.Marshal(activity.AllWindows)
	if err != nil {
		return fmt.Errorf("failed to marshal windows: %w", err)
	}

	query := `
		INSERT INTO activities (
			timestamp, app_name, window_title, process_id, is_active,
			focus_duration, total_windows, window_list, category, confidence, screenshot
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := d.db.Exec(query,
		activity.Timestamp,
		activity.AppName,
		activity.WindowTitle,
		activity.ProcessID,
		activity.IsActive,
		activity.FocusDuration,
		activity.TotalWindows,
		string(windowsJSON),
		activity.Category,
		activity.Confidence,
		activity.Screenshot,
	)

	if err != nil {
		return fmt.Errorf("failed to save activity: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert ID: %w", err)
	}

	activity.ID = id

	// Update aggregations asynchronously to avoid blocking activity capture
	go func() {
		engine := NewAggregationEngine(d)
		if err := engine.ProcessNewActivity(activity); err != nil {
			log.Printf("Failed to update aggregations for activity %d: %v", activity.ID, err)
		}
	}()

	return nil
}

// GetActivities retrieves activities within a time range
func (d *Database) GetActivities(from, to time.Time, limit int) ([]*types.Activity, error) {
	query := `
		SELECT id, timestamp, app_name, window_title, process_id, is_active,
		       focus_duration, total_windows, window_list, category, confidence,
		       CASE WHEN screenshot IS NOT NULL THEN 1 ELSE 0 END as has_screenshot
		FROM activities
		WHERE timestamp BETWEEN ? AND ?
		ORDER BY timestamp DESC
		LIMIT ?
	`

	rows, err := d.db.Query(query, from, to, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to query activities: %w", err)
	}
	defer rows.Close()

	activities := make([]*types.Activity, 0, limit)

	for rows.Next() {
		activity := &types.Activity{}
		var windowsJSON string
		var hasScreenshot int

		err := rows.Scan(
			&activity.ID,
			&activity.Timestamp,
			&activity.AppName,
			&activity.WindowTitle,
			&activity.ProcessID,
			&activity.IsActive,
			&activity.FocusDuration,
			&activity.TotalWindows,
			&windowsJSON,
			&activity.Category,
			&activity.Confidence,
			&hasScreenshot,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan activity: %w", err)
		}

		// Set screenshot flag
		activity.HasScreenshot = hasScreenshot == 1

		// Deserialize windows
		if err := json.Unmarshal([]byte(windowsJSON), &activity.AllWindows); err != nil {
			log.Printf("Failed to unmarshal windows for activity %d: %v", activity.ID, err)
			activity.AllWindows = []types.Window{} // Empty fallback
		}

		activities = append(activities, activity)
	}

	return activities, rows.Err()
}

// GetCurrentWorkspace gets the most recent workspace state with real-time focus duration
func (d *Database) GetCurrentWorkspace() (*types.CurrentWorkspace, error) {
	return d.GetCurrentWorkspaceWithFocusCalculator(nil)
}

// GetCurrentWorkspaceWithFocusCalculator gets current workspace with optional real-time focus calculation
func (d *Database) GetCurrentWorkspaceWithFocusCalculator(focusCalculator func() time.Duration) (*types.CurrentWorkspace, error) {
	query := `
		SELECT app_name, window_title, window_list, category, timestamp, focus_duration
		FROM activities
		ORDER BY timestamp DESC
		LIMIT 1
	`

	var appName, windowTitle, windowsJSON, category string
	var timestamp time.Time
	var focusDuration int

	err := d.db.QueryRow(query).Scan(&appName, &windowTitle, &windowsJSON, &category, &timestamp, &focusDuration)
	if err != nil {
		if err == sql.ErrNoRows {
			// Return empty workspace with helpful message
			return &types.CurrentWorkspace{
				ActiveWindow: types.Window{
					AppName: "No Activity",
					Title:   "Compass is tracking but no activities recorded yet. Please wait a moment...",
				},
				AllWindows:      []types.Window{},
				WindowCount:     0,
				Category:        "Initializing",
				FocusTime:       "0s",
				ContextSwitches: 0,
				Timestamp:       time.Now(),
			}, nil
		}
		return nil, fmt.Errorf("failed to get current workspace: %w", err)
	}

	// Deserialize windows
	var windows []types.Window
	if err := json.Unmarshal([]byte(windowsJSON), &windows); err != nil {
		log.Printf("Failed to unmarshal windows: %v", err)
		windows = []types.Window{}
	}

	// Find active window
	var activeWindow types.Window
	for _, w := range windows {
		if w.IsActive {
			activeWindow = w
			break
		}
	}

	// Calculate context switches for the last hour
	contextSwitches, _ := d.getContextSwitches(time.Now().Add(-time.Hour), time.Now())

	// Use real-time focus duration if calculator is provided, otherwise use stored duration
	var realTimeFocusDuration time.Duration
	if focusCalculator != nil {
		realTimeFocusDuration = focusCalculator()
	} else {
		realTimeFocusDuration = time.Duration(focusDuration) * time.Second
	}

	return &types.CurrentWorkspace{
		ActiveWindow:    activeWindow,
		AllWindows:      windows,
		WindowCount:     len(windows),
		Category:        category,
		FocusTime:       formatDuration(realTimeFocusDuration),
		ContextSwitches: contextSwitches,
		Timestamp:       timestamp,
	}, nil
}

// GetStats retrieves aggregated statistics for a period using pre-computed data
func (d *Database) GetStats(period string, date time.Time) (*types.Stats, error) {
	var from, to time.Time

	switch period {
	case "hour":
		from = date.Truncate(time.Hour)
		to = from.Add(time.Hour)
	case "day":
		from = date.Truncate(24 * time.Hour)
		to = from.Add(24 * time.Hour)
	case "week":
		// Start of week (Sunday)
		days := int(date.Weekday())
		from = date.AddDate(0, 0, -days).Truncate(24 * time.Hour)
		to = from.Add(7 * 24 * time.Hour)
	case "month":
		from = time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, date.Location())
		to = from.AddDate(0, 1, 0)
	default:
		return nil, fmt.Errorf("invalid period: %s", period)
	}

	// Use the new aggregated stats method
	return d.GetAggregatedStats(from, to, period)
}

// GetScreenshot retrieves a screenshot by activity ID
func (d *Database) GetScreenshot(activityID int64) ([]byte, error) {
	query := `SELECT screenshot FROM activities WHERE id = ? AND screenshot IS NOT NULL`

	var screenshot []byte
	err := d.db.QueryRow(query, activityID).Scan(&screenshot)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("no screenshot found for activity %d", activityID)
		}
		return nil, fmt.Errorf("failed to get screenshot: %w", err)
	}

	return screenshot, nil
}

// getContextSwitches counts context switches in a time period
func (d *Database) getContextSwitches(from, to time.Time) (int, error) {
	query := `
		SELECT COUNT(*) FROM (
			SELECT app_name, LAG(app_name) OVER (ORDER BY timestamp) as prev_app
			FROM activities
			WHERE timestamp BETWEEN ? AND ? AND is_active = 1
		) WHERE app_name != prev_app AND prev_app IS NOT NULL
	`

	var count int
	err := d.db.QueryRow(query, from, to).Scan(&count)
	return count, err
}

// getLongestFocus finds the longest continuous focus period
func (d *Database) getLongestFocus(from, to time.Time) (time.Duration, error) {
	query := `
		SELECT MAX(focus_duration) FROM activities
		WHERE timestamp BETWEEN ? AND ? AND is_active = 1
	`

	var maxSeconds sql.NullInt64
	err := d.db.QueryRow(query, from, to).Scan(&maxSeconds)
	if err != nil || !maxSeconds.Valid {
		return 0, err
	}

	return time.Duration(maxSeconds.Int64) * time.Second, nil
}

// getPatterns finds common window patterns
func (d *Database) getPatterns(from, to time.Time) ([]types.Pattern, error) {
	// Simplified pattern detection for MVP
	query := `
		SELECT app_name, category, COUNT(*) as frequency, SUM(focus_duration) as total_seconds
		FROM activities
		WHERE timestamp BETWEEN ? AND ? AND is_active = 1
		GROUP BY app_name, category
		HAVING frequency > 5
		ORDER BY frequency DESC
		LIMIT 10
	`

	rows, err := d.db.Query(query, from, to)
	if err != nil {
		return nil, fmt.Errorf("failed to query patterns: %w", err)
	}
	defer rows.Close()

	patterns := []types.Pattern{}
	for rows.Next() {
		var appName, category string
		var frequency, totalSeconds int

		if err := rows.Scan(&appName, &category, &frequency, &totalSeconds); err != nil {
			continue
		}

		pattern := types.Pattern{
			Name:           fmt.Sprintf("%s (%s)", appName, category),
			ActiveApp:      appName,
			BackgroundApps: []string{}, // TODO: Extract from window_list
			Frequency:      frequency,
			TotalTime:      time.Duration(totalSeconds) * time.Second,
			Category:       category,
		}

		patterns = append(patterns, pattern)
	}

	return patterns, nil
}

// CleanupOldData removes old activities and aggregations based on retention policy
func (d *Database) CleanupOldData(retentionDays int) error {
	cutoff := time.Now().AddDate(0, 0, -retentionDays)

	// Clean up raw activities
	query := `DELETE FROM activities WHERE timestamp < ?`
	result, err := d.db.Exec(query, cutoff)
	if err != nil {
		return fmt.Errorf("failed to cleanup old activities: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("Cleaned up %d old activity records", rowsAffected)

	// Clean up aggregations based on retention policies
	engine := NewAggregationEngine(d)
	retentionPolicy := map[TimeGranularity]time.Duration{
		GranularityMinute: 7 * 24 * time.Hour,         // Keep minutes for 7 days
		GranularityHour:   30 * 24 * time.Hour,        // Keep hours for 30 days
		GranularityDay:    365 * 24 * time.Hour,       // Keep days for 1 year
		GranularityWeek:   2 * 365 * 24 * time.Hour,   // Keep weeks for 2 years
		GranularityMonth:  5 * 365 * 24 * time.Hour,   // Keep months for 5 years
		GranularityYear:   100 * 365 * 24 * time.Hour, // Keep years for 100 years
	}

	return engine.CleanupOldAggregations(retentionPolicy)
}

// BackfillAggregations runs a complete backfill of aggregation tables
func (d *Database) BackfillAggregations() error {
	// Get date range of existing activities
	var firstActivity, lastActivity sql.NullString
	err := d.db.QueryRow("SELECT MIN(timestamp), MAX(timestamp) FROM activities").Scan(&firstActivity, &lastActivity)
	if err != nil {
		return fmt.Errorf("failed to get activity date range: %w", err)
	}

	if !firstActivity.Valid || !lastActivity.Valid {
		log.Println("No activities found, skipping aggregation backfill")
		return nil
	}

	// Try multiple timestamp formats for parsing
	from, err := parseFlexibleTimestamp(firstActivity.String)
	if err != nil {
		return fmt.Errorf("failed to parse first activity timestamp: %w", err)
	}

	to, err := parseFlexibleTimestamp(lastActivity.String)
	if err != nil {
		return fmt.Errorf("failed to parse last activity timestamp: %w", err)
	}

	engine := NewAggregationEngine(d)
	return engine.BackfillAggregations(from, to)
}

// GetAggregationStatus returns the status of aggregation tables
func (d *Database) GetAggregationStatus() (map[string]interface{}, error) {
	engine := NewAggregationEngine(d)
	stats, err := engine.GetAggregationStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get aggregation stats: %w", err)
	}

	// Add last aggregation run timestamp
	var lastRun sql.NullString
	d.db.QueryRow("SELECT value FROM settings WHERE key = 'last_aggregation_run'").Scan(&lastRun)

	status := map[string]interface{}{
		"aggregation_tables": stats,
		"last_run":           lastRun.String,
		"enabled":            true,
	}

	return status, nil
}

// formatDuration formats a duration in a human-readable format
func formatDuration(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%ds", int(d.Seconds()))
	}
	if d < time.Hour {
		return fmt.Sprintf("%dm %ds", int(d.Minutes()), int(d.Seconds())%60)
	}
	return fmt.Sprintf("%dh %dm", int(d.Hours()), int(d.Minutes())%60)
}

// parseFlexibleTimestamp tries multiple timestamp formats
func parseFlexibleTimestamp(timestamp string) (time.Time, error) {
	formats := []string{
		"2006-01-02 15:04:05",
		"2006-01-02 15:04:05+00:00",
		"2006-01-02T15:04:05Z",
		time.RFC3339,
		"2006-01-02T15:04:05",
		"2006-01-02 15:04:05-07:00",
	}

	for _, format := range formats {
		if parsed, err := time.Parse(format, timestamp); err == nil {
			return parsed, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse timestamp: %s", timestamp)
}
