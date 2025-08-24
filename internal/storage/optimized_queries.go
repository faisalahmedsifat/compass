package storage

import (
	"fmt"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

// TimelineDataPoint represents a single point in the timeline
type TimelineDataPoint struct {
	TimeSlot     time.Time             `json:"time_slot"`
	Granularity  string                `json:"granularity"`
	TotalTime    int                   `json:"total_time"` // seconds
	AppBreakdown map[string]AppSummary `json:"app_breakdown"`
	Metadata     TimelineMetadata      `json:"metadata"`
}

// AppSummary represents aggregated app data for a time slot
type AppSummary struct {
	AppName       string  `json:"app_name"`
	TotalTime     int     `json:"total_time"`  // seconds
	ActiveTime    int     `json:"active_time"` // seconds
	ActivityCount int     `json:"activity_count"`
	Category      string  `json:"category"`
	Percentage    float64 `json:"percentage"`
}

// TimelineMetadata contains additional timeline information
type TimelineMetadata struct {
	TotalActivities int `json:"total_activities"`
	TotalApps       int `json:"total_apps"`
	TotalCategories int `json:"total_categories"`
	ScreenshotCount int `json:"screenshot_count"`
}

// GetTimelineData efficiently retrieves pre-aggregated timeline data
func (d *Database) GetTimelineData(from, to time.Time, granularity string) (interface{}, error) {
	// Map granularity string to TimeGranularity
	var timeGranularity TimeGranularity
	switch granularity {
	case "minute":
		timeGranularity = GranularityMinute
	case "hour":
		timeGranularity = GranularityHour
	case "day":
		timeGranularity = GranularityDay
	case "week":
		timeGranularity = GranularityWeek
	case "month":
		timeGranularity = GranularityMonth
	case "year":
		timeGranularity = GranularityYear
	default:
		timeGranularity = GranularityHour // default to hour
		granularity = "hour"
	}

	// Create aggregation engine to get data
	engine := NewAggregationEngine(d)
	records, err := engine.GetAggregatedData(from, to, timeGranularity)
	if err != nil {
		return nil, fmt.Errorf("failed to get aggregated data: %w", err)
	}

	// Group records by time bucket
	bucketMap := make(map[time.Time]*TimelineDataPoint)

	for _, record := range records {
		// Get or create timeline data point
		dataPoint, exists := bucketMap[record.TimeBucket]
		if !exists {
			dataPoint = &TimelineDataPoint{
				TimeSlot:     record.TimeBucket,
				Granularity:  granularity,
				TotalTime:    0,
				AppBreakdown: make(map[string]AppSummary),
				Metadata:     TimelineMetadata{},
			}
			bucketMap[record.TimeBucket] = dataPoint
		}

		// Add app summary
		dataPoint.AppBreakdown[record.AppName] = AppSummary{
			AppName:       record.AppName,
			TotalTime:     record.TotalSeconds,
			ActiveTime:    record.ActiveSeconds,
			ActivityCount: record.ActivityCount,
			Category:      record.Category,
		}

		// Update totals
		dataPoint.TotalTime += record.TotalSeconds
		dataPoint.Metadata.TotalActivities += record.ActivityCount
		dataPoint.Metadata.ScreenshotCount += record.ScreenshotCount
		dataPoint.Metadata.TotalApps++
	}

	// Calculate percentages and count categories
	for _, dataPoint := range bucketMap {
		categorySet := make(map[string]bool)
		for appName := range dataPoint.AppBreakdown {
			appSummary := dataPoint.AppBreakdown[appName]
			if dataPoint.TotalTime > 0 {
				appSummary.Percentage = float64(appSummary.TotalTime) / float64(dataPoint.TotalTime) * 100
			}
			categorySet[appSummary.Category] = true
			dataPoint.AppBreakdown[appName] = appSummary
		}
		dataPoint.Metadata.TotalCategories = len(categorySet)
	}

	// Convert map to sorted slice
	dataPoints := make([]*TimelineDataPoint, 0, len(bucketMap))
	for _, dataPoint := range bucketMap {
		dataPoints = append(dataPoints, dataPoint)
	}

	return interface{}(dataPoints), nil
}

// GetTimeSlotActivities gets detailed activities for a specific time slot
func (d *Database) GetTimeSlotActivities(timeSlot time.Time, granularity string, includeScreenshots bool) ([]*types.Activity, error) {
	var from, to time.Time

	switch granularity {
	case "minute":
		from = timeSlot
		to = timeSlot.Add(time.Minute)
	case "hour":
		from = timeSlot
		to = timeSlot.Add(time.Hour)
	case "day":
		from = timeSlot
		to = timeSlot.Add(24 * time.Hour)
	case "week":
		from = timeSlot
		to = timeSlot.Add(7 * 24 * time.Hour)
	case "month":
		from = timeSlot
		to = timeSlot.AddDate(0, 1, 0)
	case "year":
		from = timeSlot
		to = timeSlot.AddDate(1, 0, 0)
	default:
		from = timeSlot
		to = timeSlot.Add(time.Hour)
	}

	return d.GetActivities(from, to, 10000) // Increased limit for larger time windows
}

// GetAppTotalsForPeriod efficiently gets total time per app for a period using aggregated data
func (d *Database) GetAppTotalsForPeriod(from, to time.Time) (map[string]AppSummary, error) {
	// Determine best granularity based on time range
	duration := to.Sub(from)
	var granularity TimeGranularity

	if duration <= 24*time.Hour {
		granularity = GranularityHour
	} else if duration <= 7*24*time.Hour {
		granularity = GranularityDay
	} else if duration <= 30*24*time.Hour {
		granularity = GranularityDay
	} else if duration <= 365*24*time.Hour {
		granularity = GranularityWeek
	} else {
		granularity = GranularityMonth
	}

	engine := NewAggregationEngine(d)
	records, err := engine.GetAggregatedData(from, to, granularity)
	if err != nil {
		return nil, fmt.Errorf("failed to get aggregated data: %w", err)
	}

	// Aggregate by app (sum across time buckets)
	appTotals := make(map[string]AppSummary)
	var grandTotal int

	for _, record := range records {
		existing, exists := appTotals[record.AppName]
		if !exists {
			existing = AppSummary{
				AppName:  record.AppName,
				Category: record.Category,
			}
		}

		existing.TotalTime += record.TotalSeconds
		existing.ActiveTime += record.ActiveSeconds
		existing.ActivityCount += record.ActivityCount

		appTotals[record.AppName] = existing
		grandTotal += record.TotalSeconds
	}

	// Calculate percentages
	for appName, summary := range appTotals {
		if grandTotal > 0 {
			summary.Percentage = float64(summary.TotalTime) / float64(grandTotal) * 100
		}
		appTotals[appName] = summary
	}

	return appTotals, nil
}

// OptimizeDatabase adds additional indexes for timeline queries
func (d *Database) OptimizeDatabase() error {
	optimizations := []string{
		// Compound indexes for efficient time-based queries
		`CREATE INDEX IF NOT EXISTS idx_activities_timestamp_app ON activities(timestamp, app_name);`,
		`CREATE INDEX IF NOT EXISTS idx_activities_timestamp_category ON activities(timestamp, category);`,
		`CREATE INDEX IF NOT EXISTS idx_activities_date_hour ON activities(date(timestamp), strftime('%H', timestamp));`,

		// Index for screenshot queries
		`CREATE INDEX IF NOT EXISTS idx_activities_screenshot_timestamp ON activities(timestamp) WHERE screenshot IS NOT NULL;`,

		// Partial indexes for active activities
		`CREATE INDEX IF NOT EXISTS idx_activities_active_timestamp ON activities(timestamp) WHERE is_active = 1;`,

		// Index for focus duration queries
		`CREATE INDEX IF NOT EXISTS idx_activities_focus_timestamp ON activities(focus_duration, timestamp);`,
	}

	for _, optimization := range optimizations {
		if _, err := d.db.Exec(optimization); err != nil {
			return fmt.Errorf("failed to apply optimization: %w", err)
		}
	}

	// Update table statistics for better query planning
	if _, err := d.db.Exec("ANALYZE activities;"); err != nil {
		return fmt.Errorf("failed to analyze activities table: %w", err)
	}

	return nil
}

// GetTimeSlotMatrix generates a complete time slot matrix for visualization
func (d *Database) GetTimeSlotMatrix(from, to time.Time, granularity string) (map[time.Time]map[string]int, error) {
	timelineDataRaw, err := d.GetTimelineData(from, to, granularity)
	if err != nil {
		return nil, err
	}

	// Type assert the interface{} back to the expected type
	timelineData, ok := timelineDataRaw.([]*TimelineDataPoint)
	if !ok {
		return nil, fmt.Errorf("unexpected type for timeline data")
	}

	matrix := make(map[time.Time]map[string]int)

	for _, dataPoint := range timelineData {
		if matrix[dataPoint.TimeSlot] == nil {
			matrix[dataPoint.TimeSlot] = make(map[string]int)
		}

		for appName, appSummary := range dataPoint.AppBreakdown {
			matrix[dataPoint.TimeSlot][appName] = appSummary.TotalTime
		}
	}

	return matrix, nil
}

// GetAggregatedStats returns aggregated statistics using pre-computed data
func (d *Database) GetAggregatedStats(from, to time.Time, granularity string) (*types.Stats, error) {
	appTotals, err := d.GetAppTotalsForPeriod(from, to)
	if err != nil {
		return nil, fmt.Errorf("failed to get app totals: %w", err)
	}

	stats := &types.Stats{
		Period:     granularity,
		ByApp:      make(map[string]time.Duration),
		ByCategory: make(map[string]time.Duration),
	}

	categoryTotals := make(map[string]time.Duration)
	var totalTime time.Duration

	// Convert app totals to duration maps
	for _, appSummary := range appTotals {
		appDuration := time.Duration(appSummary.TotalTime) * time.Second
		stats.ByApp[appSummary.AppName] = appDuration
		categoryTotals[appSummary.Category] += appDuration
		totalTime += appDuration
	}

	stats.ByCategory = categoryTotals
	stats.TotalTime = totalTime

	// Get additional stats from raw activities if needed
	stats.ContextSwitches, _ = d.getContextSwitches(from, to)
	stats.LongestFocus, _ = d.getLongestFocus(from, to)
	stats.Patterns, _ = d.getPatterns(from, to)

	return stats, nil
}

// GetHeatmapData generates heatmap data using aggregated data
func (d *Database) GetHeatmapData(from, to time.Time, granularity string) (map[string]interface{}, error) {
	timelineDataRaw, err := d.GetTimelineData(from, to, granularity)
	if err != nil {
		return nil, err
	}

	// Type assert the interface{} back to the expected type
	timelineData, ok := timelineDataRaw.([]*TimelineDataPoint)
	if !ok {
		return nil, fmt.Errorf("unexpected type for timeline data")
	}

	heatmapData := map[string]interface{}{
		"granularity": granularity,
		"data":        []map[string]interface{}{},
		"summary": map[string]interface{}{
			"total_periods": len(timelineData),
			"date_range": map[string]string{
				"from": from.Format("2006-01-02T15:04:05Z"),
				"to":   to.Format("2006-01-02T15:04:05Z"),
			},
		},
	}

	for _, dataPoint := range timelineData {
		point := map[string]interface{}{
			"time_slot":   dataPoint.TimeSlot.Format("2006-01-02T15:04:05Z"),
			"total_time":  dataPoint.TotalTime,
			"apps":        len(dataPoint.AppBreakdown),
			"categories":  dataPoint.Metadata.TotalCategories,
			"activities":  dataPoint.Metadata.TotalActivities,
			"screenshots": dataPoint.Metadata.ScreenshotCount,
			"top_apps":    []map[string]interface{}{},
		}

		// Add top 3 apps for this time slot
		topApps := make([]AppSummary, 0, len(dataPoint.AppBreakdown))
		for _, appSummary := range dataPoint.AppBreakdown {
			topApps = append(topApps, appSummary)
		}

		// Sort by total time (simplified)
		topAppsData := make([]map[string]interface{}, 0, 3)
		count := 0
		for _, app := range topApps {
			if count >= 3 {
				break
			}
			topAppsData = append(topAppsData, map[string]interface{}{
				"app_name":   app.AppName,
				"total_time": app.TotalTime,
				"percentage": app.Percentage,
				"category":   app.Category,
			})
			count++
		}

		point["top_apps"] = topAppsData
		heatmapData["data"] = append(heatmapData["data"].([]map[string]interface{}), point)
	}

	return heatmapData, nil
}
