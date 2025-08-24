package storage

import (
	"database/sql"
	"fmt"
)

// initSchema initializes the database schema
func (d *Database) initSchema() error {
	// Enable foreign keys
	if _, err := d.db.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	// Create tables
	for _, migration := range migrations {
		if _, err := d.db.Exec(migration); err != nil {
			return fmt.Errorf("failed to run migration: %w", err)
		}
	}

	return nil
}

// migrations contains all database migrations
var migrations = []string{
	// Main activities table
	`CREATE TABLE IF NOT EXISTS activities (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
		
		-- Window information
		app_name TEXT NOT NULL,
		window_title TEXT,
		process_id INTEGER,
		
		-- Window state
		is_active BOOLEAN DEFAULT FALSE,
		focus_duration INTEGER DEFAULT 0,
		
		-- Workspace context
		total_windows INTEGER DEFAULT 0,
		window_list TEXT, -- JSON array of all windows
		
		-- Categorization
		category TEXT DEFAULT 'Uncategorized',
		confidence REAL DEFAULT 0.0,
		
		-- Optional screenshot
		screenshot BLOB
	);`,

	// Indexes for performance
	`CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);`,
	`CREATE INDEX IF NOT EXISTS idx_activities_app_name ON activities(app_name);`,
	`CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);`,
	`CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active);`,
	`CREATE INDEX IF NOT EXISTS idx_activities_app_category ON activities(app_name, category);`,

	// Multi-granular time-series aggregation tables

	// 1-minute aggregations
	`CREATE TABLE IF NOT EXISTS activity_minutes (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		time_bucket DATETIME NOT NULL,
		app_name TEXT NOT NULL,
		category TEXT NOT NULL,
		
		total_seconds INTEGER DEFAULT 0,
		active_seconds INTEGER DEFAULT 0,
		activity_count INTEGER DEFAULT 0,
		switch_count INTEGER DEFAULT 0,
		window_count_avg REAL DEFAULT 0.0,
		
		first_activity_id INTEGER,
		last_activity_id INTEGER,
		screenshot_count INTEGER DEFAULT 0,
		
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		
		UNIQUE(time_bucket, app_name, category)
	);`,

	// 1-hour aggregations
	`CREATE TABLE IF NOT EXISTS activity_hours (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		time_bucket DATETIME NOT NULL,
		app_name TEXT NOT NULL,
		category TEXT NOT NULL,
		
		total_seconds INTEGER DEFAULT 0,
		active_seconds INTEGER DEFAULT 0,
		activity_count INTEGER DEFAULT 0,
		switch_count INTEGER DEFAULT 0,
		window_count_avg REAL DEFAULT 0.0,
		
		first_activity_id INTEGER,
		last_activity_id INTEGER,
		screenshot_count INTEGER DEFAULT 0,
		
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		
		UNIQUE(time_bucket, app_name, category)
	);`,

	// Daily aggregations
	`CREATE TABLE IF NOT EXISTS activity_days (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		time_bucket DATE NOT NULL,
		app_name TEXT NOT NULL,
		category TEXT NOT NULL,
		
		total_seconds INTEGER DEFAULT 0,
		active_seconds INTEGER DEFAULT 0,
		activity_count INTEGER DEFAULT 0,
		switch_count INTEGER DEFAULT 0,
		window_count_avg REAL DEFAULT 0.0,
		
		first_activity_id INTEGER,
		last_activity_id INTEGER,
		screenshot_count INTEGER DEFAULT 0,
		
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		
		UNIQUE(time_bucket, app_name, category)
	);`,

	// Weekly aggregations (week starting Monday)
	`CREATE TABLE IF NOT EXISTS activity_weeks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		time_bucket DATE NOT NULL, -- First day of the week (Monday)
		app_name TEXT NOT NULL,
		category TEXT NOT NULL,
		
		total_seconds INTEGER DEFAULT 0,
		active_seconds INTEGER DEFAULT 0,
		activity_count INTEGER DEFAULT 0,
		switch_count INTEGER DEFAULT 0,
		window_count_avg REAL DEFAULT 0.0,
		
		first_activity_id INTEGER,
		last_activity_id INTEGER,
		screenshot_count INTEGER DEFAULT 0,
		
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		
		UNIQUE(time_bucket, app_name, category)
	);`,

	// Monthly aggregations
	`CREATE TABLE IF NOT EXISTS activity_months (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		time_bucket DATE NOT NULL, -- First day of the month
		app_name TEXT NOT NULL,
		category TEXT NOT NULL,
		
		total_seconds INTEGER DEFAULT 0,
		active_seconds INTEGER DEFAULT 0,
		activity_count INTEGER DEFAULT 0,
		switch_count INTEGER DEFAULT 0,
		window_count_avg REAL DEFAULT 0.0,
		
		first_activity_id INTEGER,
		last_activity_id INTEGER,
		screenshot_count INTEGER DEFAULT 0,
		
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		
		UNIQUE(time_bucket, app_name, category)
	);`,

	// Yearly aggregations
	`CREATE TABLE IF NOT EXISTS activity_years (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		time_bucket INTEGER NOT NULL, -- Year as integer
		app_name TEXT NOT NULL,
		category TEXT NOT NULL,
		
		total_seconds INTEGER DEFAULT 0,
		active_seconds INTEGER DEFAULT 0,
		activity_count INTEGER DEFAULT 0,
		switch_count INTEGER DEFAULT 0,
		window_count_avg REAL DEFAULT 0.0,
		
		first_activity_id INTEGER,
		last_activity_id INTEGER,
		screenshot_count INTEGER DEFAULT 0,
		
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		
		UNIQUE(time_bucket, app_name, category)
	);`,

	// Indexes for aggregation tables
	`CREATE INDEX IF NOT EXISTS idx_activity_minutes_time_bucket ON activity_minutes(time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_minutes_app ON activity_minutes(app_name, time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_minutes_category ON activity_minutes(category, time_bucket);`,

	`CREATE INDEX IF NOT EXISTS idx_activity_hours_time_bucket ON activity_hours(time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_hours_app ON activity_hours(app_name, time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_hours_category ON activity_hours(category, time_bucket);`,

	`CREATE INDEX IF NOT EXISTS idx_activity_days_time_bucket ON activity_days(time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_days_app ON activity_days(app_name, time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_days_category ON activity_days(category, time_bucket);`,

	`CREATE INDEX IF NOT EXISTS idx_activity_weeks_time_bucket ON activity_weeks(time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_weeks_app ON activity_weeks(app_name, time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_weeks_category ON activity_weeks(category, time_bucket);`,

	`CREATE INDEX IF NOT EXISTS idx_activity_months_time_bucket ON activity_months(time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_months_app ON activity_months(app_name, time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_months_category ON activity_months(category, time_bucket);`,

	`CREATE INDEX IF NOT EXISTS idx_activity_years_time_bucket ON activity_years(time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_years_app ON activity_years(app_name, time_bucket);`,
	`CREATE INDEX IF NOT EXISTS idx_activity_years_category ON activity_years(category, time_bucket);`,

	// Legacy hourly stats table (kept for backward compatibility but will be deprecated)
	`CREATE TABLE IF NOT EXISTS hourly_stats (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		hour_bucket DATETIME NOT NULL,
		app_name TEXT NOT NULL,
		category TEXT NOT NULL,
		
		total_seconds INTEGER DEFAULT 0,
		active_seconds INTEGER DEFAULT 0,
		background_seconds INTEGER DEFAULT 0,
		
		switch_count INTEGER DEFAULT 0,
		window_count_avg REAL DEFAULT 0,
		
		UNIQUE(hour_bucket, app_name, category)
	);`,

	// Window patterns table
	`CREATE TABLE IF NOT EXISTS window_patterns (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
		
		active_app TEXT NOT NULL,
		background_apps TEXT, -- JSON array
		
		pattern_name TEXT,
		frequency INTEGER DEFAULT 1,
		productivity_score REAL DEFAULT 0.0
	);`,

	// User sessions table
	`CREATE TABLE IF NOT EXISTS sessions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		start_time DATETIME NOT NULL,
		end_time DATETIME,
		
		total_activities INTEGER DEFAULT 0,
		total_apps INTEGER DEFAULT 0,
		total_categories INTEGER DEFAULT 0,
		
		summary_json TEXT -- JSON summary
	);`,

	// Settings table for runtime configuration
	`CREATE TABLE IF NOT EXISTS settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`,

	// Insert default settings
	`INSERT OR IGNORE INTO settings (key, value) VALUES 
		('schema_version', '2'),
		('created_at', datetime('now')),
		('last_cleanup', datetime('now')),
		('last_aggregation_run', datetime('now')),
		('aggregation_enabled', 'true');`,
}

// GetSchemaVersion returns the current schema version
func (d *Database) GetSchemaVersion() (int, error) {
	var version int
	err := d.db.QueryRow("SELECT value FROM settings WHERE key = 'schema_version'").Scan(&version)
	if err != nil {
		return 0, err
	}
	return version, nil
}

// UpdateSchemaVersion updates the schema version
func (d *Database) UpdateSchemaVersion(version int) error {
	_, err := d.db.Exec("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'schema_version'", version)
	return err
}

// Vacuum optimizes the database
func (d *Database) Vacuum() error {
	_, err := d.db.Exec("VACUUM;")
	return err
}

// GetDatabaseStats returns basic database statistics
func (d *Database) GetDatabaseStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Count activities
	var activityCount int
	err := d.db.QueryRow("SELECT COUNT(*) FROM activities").Scan(&activityCount)
	if err != nil {
		return nil, err
	}
	stats["total_activities"] = activityCount

	// Get date range
	var firstActivity, lastActivity sql.NullString
	err = d.db.QueryRow("SELECT MIN(timestamp), MAX(timestamp) FROM activities").Scan(&firstActivity, &lastActivity)
	if err != nil {
		return nil, err
	}

	if firstActivity.Valid {
		stats["first_activity"] = firstActivity.String
	}
	if lastActivity.Valid {
		stats["last_activity"] = lastActivity.String
	}

	// Get unique apps count
	var uniqueApps int
	err = d.db.QueryRow("SELECT COUNT(DISTINCT app_name) FROM activities").Scan(&uniqueApps)
	if err != nil {
		return nil, err
	}
	stats["unique_apps"] = uniqueApps

	// Get database size (approximation)
	var pageCount, pageSize int
	d.db.QueryRow("PRAGMA page_count").Scan(&pageCount)
	d.db.QueryRow("PRAGMA page_size").Scan(&pageSize)
	stats["database_size_bytes"] = pageCount * pageSize

	return stats, nil
}
