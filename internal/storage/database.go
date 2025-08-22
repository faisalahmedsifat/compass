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

// SaveActivity saves an activity record to the database
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

// GetCurrentWorkspace gets the most recent workspace state
func (d *Database) GetCurrentWorkspace() (*types.CurrentWorkspace, error) {
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

	return &types.CurrentWorkspace{
		ActiveWindow:    activeWindow,
		AllWindows:      windows,
		WindowCount:     len(windows),
		Category:        category,
		FocusTime:       formatDuration(time.Duration(focusDuration) * time.Second),
		ContextSwitches: contextSwitches,
		Timestamp:       timestamp,
	}, nil
}

// GetStats retrieves aggregated statistics for a period
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

	stats := &types.Stats{
		Period:    period,
		ByApp:     make(map[string]time.Duration),
		ByCategory: make(map[string]time.Duration),
	}

	// Get app statistics
	appQuery := `
		SELECT app_name, SUM(focus_duration) as total_seconds
		FROM activities
		WHERE timestamp BETWEEN ? AND ? AND is_active = 1
		GROUP BY app_name
		ORDER BY total_seconds DESC
	`

	rows, err := d.db.Query(appQuery, from, to)
	if err != nil {
		return nil, fmt.Errorf("failed to query app stats: %w", err)
	}
	defer rows.Close()

	var totalTime time.Duration
	for rows.Next() {
		var appName string
		var seconds int
		if err := rows.Scan(&appName, &seconds); err != nil {
			continue
		}
		duration := time.Duration(seconds) * time.Second
		stats.ByApp[appName] = duration
		totalTime += duration
	}

	// Get category statistics
	categoryQuery := `
		SELECT category, SUM(focus_duration) as total_seconds
		FROM activities
		WHERE timestamp BETWEEN ? AND ? AND is_active = 1
		GROUP BY category
		ORDER BY total_seconds DESC
	`

	rows, err = d.db.Query(categoryQuery, from, to)
	if err != nil {
		return nil, fmt.Errorf("failed to query category stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var category string
		var seconds int
		if err := rows.Scan(&category, &seconds); err != nil {
			continue
		}
		duration := time.Duration(seconds) * time.Second
		stats.ByCategory[category] = duration
	}

	stats.TotalTime = totalTime

	// Get context switches
	stats.ContextSwitches, _ = d.getContextSwitches(from, to)

	// Get longest focus period
	stats.LongestFocus, _ = d.getLongestFocus(from, to)

	// Get patterns
	stats.Patterns, _ = d.getPatterns(from, to)

	return stats, nil
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

// CleanupOldData removes old activities based on retention policy
func (d *Database) CleanupOldData(retentionDays int) error {
	cutoff := time.Now().AddDate(0, 0, -retentionDays)
	
	query := `DELETE FROM activities WHERE timestamp < ?`
	result, err := d.db.Exec(query, cutoff)
	if err != nil {
		return fmt.Errorf("failed to cleanup old data: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	log.Printf("Cleaned up %d old activity records", rowsAffected)
	
	return nil
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

