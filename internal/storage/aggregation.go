package storage

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

// TimeGranularity represents different time aggregation levels
type TimeGranularity string

const (
	GranularityMinute TimeGranularity = "minute"
	GranularityHour   TimeGranularity = "hour"
	GranularityDay    TimeGranularity = "day"
	GranularityWeek   TimeGranularity = "week"
	GranularityMonth  TimeGranularity = "month"
	GranularityYear   TimeGranularity = "year"
)

// AggregationRecord represents a time-bucketed aggregation
type AggregationRecord struct {
	TimeBucket      time.Time `json:"time_bucket"`
	AppName         string    `json:"app_name"`
	Category        string    `json:"category"`
	TotalSeconds    int       `json:"total_seconds"`
	ActiveSeconds   int       `json:"active_seconds"`
	ActivityCount   int       `json:"activity_count"`
	SwitchCount     int       `json:"switch_count"`
	WindowCountAvg  float64   `json:"window_count_avg"`
	FirstActivityID *int64    `json:"first_activity_id"`
	LastActivityID  *int64    `json:"last_activity_id"`
	ScreenshotCount int       `json:"screenshot_count"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// AggregationEngine handles time-series data aggregation
type AggregationEngine struct {
	db *Database
}

// NewAggregationEngine creates a new aggregation engine
func NewAggregationEngine(db *Database) *AggregationEngine {
	return &AggregationEngine{db: db}
}

// ProcessNewActivity processes a new activity and updates all relevant aggregations
func (ae *AggregationEngine) ProcessNewActivity(activity *types.Activity) error {
	// Get the timestamp for bucketing
	timestamp := activity.Timestamp

	// Update aggregations for all granularities
	granularities := []TimeGranularity{
		GranularityMinute,
		GranularityHour,
		GranularityDay,
		GranularityWeek,
		GranularityMonth,
		GranularityYear,
	}

	for _, granularity := range granularities {
		timeBucket := ae.calculateTimeBucket(timestamp, granularity)
		if err := ae.upsertAggregation(activity, timeBucket, granularity); err != nil {
			log.Printf("Failed to update %s aggregation for activity %d: %v", granularity, activity.ID, err)
			// Continue processing other granularities even if one fails
		}
	}

	return nil
}

// calculateTimeBucket calculates the appropriate time bucket for a given timestamp and granularity
func (ae *AggregationEngine) calculateTimeBucket(timestamp time.Time, granularity TimeGranularity) time.Time {
	switch granularity {
	case GranularityMinute:
		// Truncate to minute
		return timestamp.Truncate(time.Minute)
	case GranularityHour:
		// Truncate to hour
		return timestamp.Truncate(time.Hour)
	case GranularityDay:
		// Truncate to day
		return timestamp.Truncate(24 * time.Hour)
	case GranularityWeek:
		// Start of week (Monday)
		days := int(timestamp.Weekday())
		if days == 0 { // Sunday
			days = 7
		}
		return timestamp.AddDate(0, 0, -(days - 1)).Truncate(24 * time.Hour)
	case GranularityMonth:
		// First day of month
		return time.Date(timestamp.Year(), timestamp.Month(), 1, 0, 0, 0, 0, timestamp.Location())
	case GranularityYear:
		// First day of year
		return time.Date(timestamp.Year(), 1, 1, 0, 0, 0, 0, timestamp.Location())
	default:
		return timestamp.Truncate(time.Hour)
	}
}

// upsertAggregation updates or inserts aggregation data for a specific time bucket
func (ae *AggregationEngine) upsertAggregation(activity *types.Activity, timeBucket time.Time, granularity TimeGranularity) error {
	tableName := ae.getTableName(granularity)

	var screenshotCount int
	if activity.Screenshot != nil {
		screenshotCount = 1
	}

	var totalSeconds int
	if activity.IsActive {
		totalSeconds = activity.FocusDuration
	}

	// Use UPSERT (INSERT OR REPLACE in SQLite) to handle incremental updates
	query := fmt.Sprintf(`
		INSERT INTO %s (
			time_bucket, app_name, category, total_seconds, active_seconds,
			activity_count, switch_count, window_count_avg,
			first_activity_id, last_activity_id, screenshot_count, updated_at
		) VALUES (?, ?, ?, ?, ?, 1, 0, ?, ?, ?, ?, datetime('now'))
		ON CONFLICT(time_bucket, app_name, category) 
		DO UPDATE SET
			total_seconds = total_seconds + excluded.total_seconds,
			active_seconds = active_seconds + excluded.active_seconds,
			activity_count = activity_count + 1,
			window_count_avg = ((window_count_avg * activity_count) + excluded.window_count_avg) / (activity_count + 1),
			last_activity_id = excluded.last_activity_id,
			screenshot_count = screenshot_count + excluded.screenshot_count,
			updated_at = datetime('now')
	`, tableName)

	_, err := ae.db.db.Exec(query,
		ae.formatTimeBucket(timeBucket, granularity),
		activity.AppName,
		activity.Category,
		totalSeconds,
		totalSeconds, // active_seconds is same as total_seconds for active activities
		float64(activity.TotalWindows),
		activity.ID, // first_activity_id
		activity.ID, // last_activity_id
		screenshotCount,
	)

	return err
}

// getTableName returns the appropriate table name for a granularity
func (ae *AggregationEngine) getTableName(granularity TimeGranularity) string {
	switch granularity {
	case GranularityMinute:
		return "activity_minutes"
	case GranularityHour:
		return "activity_hours"
	case GranularityDay:
		return "activity_days"
	case GranularityWeek:
		return "activity_weeks"
	case GranularityMonth:
		return "activity_months"
	case GranularityYear:
		return "activity_years"
	default:
		return "activity_hours"
	}
}

// formatTimeBucket formats time bucket appropriately for different granularities
// Always stores time buckets in UTC to ensure consistent queries
func (ae *AggregationEngine) formatTimeBucket(timeBucket time.Time, granularity TimeGranularity) interface{} {
	utcTime := timeBucket.UTC()
	switch granularity {
	case GranularityYear:
		return utcTime.Year()
	case GranularityWeek, GranularityMonth, GranularityDay:
		return utcTime.Format("2006-01-02")
	default:
		return utcTime.Format("2006-01-02 15:04:05")
	}
}

// BackfillAggregations processes existing activities to populate aggregation tables
func (ae *AggregationEngine) BackfillAggregations(from, to time.Time) error {
	log.Printf("Starting aggregation backfill from %v to %v", from, to)

	// Process activities in batches to avoid memory issues
	batchSize := 1000
	offset := 0

	for {
		activities, err := ae.getActivitiesBatch(from, to, batchSize, offset)
		if err != nil {
			return fmt.Errorf("failed to get activities batch: %w", err)
		}

		if len(activities) == 0 {
			break // No more activities to process
		}

		log.Printf("Processing batch of %d activities (offset %d)", len(activities), offset)

		for _, activity := range activities {
			if err := ae.ProcessNewActivity(activity); err != nil {
				log.Printf("Failed to process activity %d during backfill: %v", activity.ID, err)
				// Continue processing other activities
			}
		}

		offset += batchSize
	}

	// Update last aggregation run timestamp
	_, err := ae.db.db.Exec(
		"UPDATE settings SET value = datetime('now'), updated_at = datetime('now') WHERE key = 'last_aggregation_run'",
	)
	if err != nil {
		log.Printf("Failed to update last aggregation run timestamp: %v", err)
	}

	log.Printf("Aggregation backfill completed")
	return nil
}

// getActivitiesBatch retrieves a batch of activities for processing
func (ae *AggregationEngine) getActivitiesBatch(from, to time.Time, limit, offset int) ([]*types.Activity, error) {
	query := `
		SELECT id, timestamp, app_name, window_title, process_id, is_active,
		       focus_duration, total_windows, window_list, category, confidence,
		       CASE WHEN screenshot IS NOT NULL THEN 1 ELSE 0 END as has_screenshot
		FROM activities
		WHERE timestamp BETWEEN ? AND ?
		ORDER BY timestamp ASC
		LIMIT ? OFFSET ?
	`

	rows, err := ae.db.db.Query(query, from, to, limit, offset)
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
		if hasScreenshot == 1 {
			activity.Screenshot = []byte{} // Placeholder - we don't need actual screenshot data for aggregation
		}

		activities = append(activities, activity)
	}

	return activities, rows.Err()
}

// GetAggregatedData retrieves aggregated data for a specific time range and granularity
func (ae *AggregationEngine) GetAggregatedData(from, to time.Time, granularity TimeGranularity) ([]*AggregationRecord, error) {
	tableName := ae.getTableName(granularity)

	query := fmt.Sprintf(`
		SELECT time_bucket, app_name, category, total_seconds, active_seconds,
		       activity_count, switch_count, window_count_avg, first_activity_id,
		       last_activity_id, screenshot_count, created_at, updated_at
		FROM %s
		WHERE time_bucket BETWEEN ? AND ?
		ORDER BY time_bucket ASC, total_seconds DESC
	`, tableName)

	rows, err := ae.db.db.Query(query,
		ae.formatTimeBucket(from, granularity),
		ae.formatTimeBucket(to, granularity),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to query aggregated data: %w", err)
	}
	defer rows.Close()

	records := make([]*AggregationRecord, 0)

	for rows.Next() {
		record := &AggregationRecord{}
		var timeBucketStr string
		var firstActivityID, lastActivityID sql.NullInt64

		err := rows.Scan(
			&timeBucketStr,
			&record.AppName,
			&record.Category,
			&record.TotalSeconds,
			&record.ActiveSeconds,
			&record.ActivityCount,
			&record.SwitchCount,
			&record.WindowCountAvg,
			&firstActivityID,
			&lastActivityID,
			&record.ScreenshotCount,
			&record.CreatedAt,
			&record.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan aggregation record: %w", err)
		}

		// Parse time bucket based on granularity
		record.TimeBucket, err = ae.parseTimeBucket(timeBucketStr, granularity)
		if err != nil {
			log.Printf("Failed to parse time bucket %s: %v", timeBucketStr, err)
			continue
		}

		// Handle nullable foreign keys
		if firstActivityID.Valid {
			id := firstActivityID.Int64
			record.FirstActivityID = &id
		}
		if lastActivityID.Valid {
			id := lastActivityID.Int64
			record.LastActivityID = &id
		}

		records = append(records, record)
	}

	return records, rows.Err()
}

// parseTimeBucket parses a time bucket string based on granularity
// Assumes time buckets are stored in UTC and parses them accordingly
func (ae *AggregationEngine) parseTimeBucket(timeBucketStr string, granularity TimeGranularity) (time.Time, error) {
	switch granularity {
	case GranularityYear:
		// Parse year as integer, convert to time in UTC
		year := 0
		if _, err := fmt.Sscanf(timeBucketStr, "%d", &year); err != nil {
			return time.Time{}, err
		}
		return time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC), nil
	case GranularityMonth, GranularityWeek, GranularityDay:
		// Parse date formats as UTC
		formats := []string{"2006-01-02", "2006-01-02T15:04:05Z", "2006-01-02T00:00:00Z"}
		for _, format := range formats {
			if parsed, err := time.Parse(format, timeBucketStr); err == nil {
				// If no timezone in format, treat as UTC
				if format == "2006-01-02" {
					return time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 0, 0, 0, 0, time.UTC), nil
				}
				return parsed, nil
			}
		}
		parsed, err := time.Parse("2006-01-02", timeBucketStr)
		if err != nil {
			return time.Time{}, err
		}
		return time.Date(parsed.Year(), parsed.Month(), parsed.Day(), 0, 0, 0, 0, time.UTC), nil
	default:
		// Parse datetime formats as UTC
		formats := []string{
			"2006-01-02 15:04:05",
			"2006-01-02T15:04:05Z",
			time.RFC3339,
			"2006-01-02T15:04:05",
		}
		for _, format := range formats {
			if parsed, err := time.Parse(format, timeBucketStr); err == nil {
				// If no timezone in format, treat as UTC
				if format == "2006-01-02 15:04:05" || format == "2006-01-02T15:04:05" {
					return time.Date(parsed.Year(), parsed.Month(), parsed.Day(),
						parsed.Hour(), parsed.Minute(), parsed.Second(), parsed.Nanosecond(), time.UTC), nil
				}
				return parsed, nil
			}
		}
		parsed, err := time.Parse("2006-01-02 15:04:05", timeBucketStr)
		if err != nil {
			return time.Time{}, err
		}
		return time.Date(parsed.Year(), parsed.Month(), parsed.Day(),
			parsed.Hour(), parsed.Minute(), parsed.Second(), parsed.Nanosecond(), time.UTC), nil
	}
}

// CleanupOldAggregations removes old aggregation data based on retention policy
func (ae *AggregationEngine) CleanupOldAggregations(retentionPolicy map[TimeGranularity]time.Duration) error {
	for granularity, retention := range retentionPolicy {
		tableName := ae.getTableName(granularity)
		cutoff := time.Now().Add(-retention)

		query := fmt.Sprintf("DELETE FROM %s WHERE time_bucket < ?", tableName)
		result, err := ae.db.db.Exec(query, ae.formatTimeBucket(cutoff, granularity))
		if err != nil {
			log.Printf("Failed to cleanup old %s aggregations: %v", granularity, err)
			continue
		}

		if rowsAffected, _ := result.RowsAffected(); rowsAffected > 0 {
			log.Printf("Cleaned up %d old %s aggregation records", rowsAffected, granularity)
		}
	}

	return nil
}

// GetAggregationStats returns statistics about aggregation tables
func (ae *AggregationEngine) GetAggregationStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	granularities := []TimeGranularity{
		GranularityMinute, GranularityHour, GranularityDay,
		GranularityWeek, GranularityMonth, GranularityYear,
	}

	for _, granularity := range granularities {
		tableName := ae.getTableName(granularity)

		var count int
		var minBucket, maxBucket sql.NullString

		query := fmt.Sprintf("SELECT COUNT(*), MIN(time_bucket), MAX(time_bucket) FROM %s", tableName)
		err := ae.db.db.QueryRow(query).Scan(&count, &minBucket, &maxBucket)
		if err != nil {
			log.Printf("Failed to get stats for %s: %v", tableName, err)
			continue
		}

		granularityStats := map[string]interface{}{
			"count": count,
		}

		if minBucket.Valid {
			granularityStats["min_bucket"] = minBucket.String
		}
		if maxBucket.Valid {
			granularityStats["max_bucket"] = maxBucket.String
		}

		stats[string(granularity)] = granularityStats
	}

	return stats, nil
}
