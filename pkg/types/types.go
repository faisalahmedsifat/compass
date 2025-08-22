package types

import (
	"encoding/json"
	"time"
)

// Window represents a single application window
type Window struct {
	AppName    string    `json:"app_name"`
	Title      string    `json:"title"`
	ProcessID  int       `json:"pid"`
	IsActive   bool      `json:"is_active"`
	LastActive time.Time `json:"last_active"`
	Position   Rectangle `json:"position"`
	Monitor    int       `json:"monitor"`
}

// Rectangle represents window position and size
type Rectangle struct {
	X      int `json:"x"`
	Y      int `json:"y"`
	Width  int `json:"width"`
	Height int `json:"height"`
}

// Activity represents a captured workspace state
type Activity struct {
	ID            int64     `json:"id"`
	Timestamp     time.Time `json:"timestamp"`
	AppName       string    `json:"app_name"`
	WindowTitle   string    `json:"window_title"`
	ProcessID     int       `json:"process_id"`
	IsActive      bool      `json:"is_active"`
	FocusDuration int       `json:"focus_duration"`
	TotalWindows  int       `json:"total_windows"`
	AllWindows    []Window  `json:"all_windows"`
	Category      string    `json:"category"`
	Confidence    float64   `json:"confidence"`
	Screenshot    []byte    `json:"-"`              // Don't serialize screenshots in API
	HasScreenshot bool      `json:"has_screenshot"` // Indicate if screenshot exists
}

// WorkspaceSnapshot represents complete workspace state at a point in time
type WorkspaceSnapshot struct {
	Timestamp    time.Time `json:"timestamp"`
	ActiveWindow Window    `json:"active_window"`
	AllWindows   []Window  `json:"all_windows"`
	WindowCount  int       `json:"window_count"`
	Category     string    `json:"category"`
	Screenshot   []byte    `json:"-"`
}

// Stats represents aggregated statistics
type Stats struct {
	Period          string                   `json:"period"`
	TotalTime       time.Duration            `json:"total_time"`
	ByApp           map[string]time.Duration `json:"by_app"`
	ByCategory      map[string]time.Duration `json:"by_category"`
	Patterns        []Pattern                `json:"patterns"`
	ContextSwitches int                      `json:"context_switches"`
	LongestFocus    time.Duration            `json:"longest_focus"`
}

// Pattern represents a common window combination
type Pattern struct {
	Name           string        `json:"name"`
	ActiveApp      string        `json:"active_app"`
	BackgroundApps []string      `json:"background_apps"`
	Frequency      int           `json:"frequency"`
	TotalTime      time.Duration `json:"total_time"`
	Category       string        `json:"category"`
}

// HourlyStats for aggregated data
type HourlyStats struct {
	ID                int64     `json:"id"`
	HourBucket        time.Time `json:"hour_bucket"`
	AppName           string    `json:"app_name"`
	Category          string    `json:"category"`
	TotalSeconds      int       `json:"total_seconds"`
	ActiveSeconds     int       `json:"active_seconds"`
	BackgroundSeconds int       `json:"background_seconds"`
	SwitchCount       int       `json:"switch_count"`
	WindowCountAvg    float64   `json:"window_count_avg"`
}

// Session represents a user session
type Session struct {
	ID              int64     `json:"id"`
	StartTime       time.Time `json:"start_time"`
	EndTime         time.Time `json:"end_time"`
	TotalActivities int       `json:"total_activities"`
	TotalApps       int       `json:"total_apps"`
	TotalCategories int       `json:"total_categories"`
	SummaryJSON     string    `json:"summary_json"`
}

// CurrentWorkspace represents real-time workspace state
type CurrentWorkspace struct {
	ActiveWindow    Window    `json:"active_window"`
	AllWindows      []Window  `json:"all_windows"`
	WindowCount     int       `json:"window_count"`
	Category        string    `json:"category"`
	FocusTime       string    `json:"focus_time"`
	ContextSwitches int       `json:"context_switches"`
	Timestamp       time.Time `json:"timestamp"`
}

// Configuration types
type Config struct {
	Tracking *TrackingConfig `json:"tracking" yaml:"tracking"`
	Privacy  *PrivacyConfig  `json:"privacy" yaml:"privacy"`
	Server   *ServerConfig   `json:"server" yaml:"server"`
	Storage  *StorageConfig  `json:"storage" yaml:"storage"`
	AI       *AIConfig       `json:"ai" yaml:"ai"`
}

type TrackingConfig struct {
	Interval           time.Duration `json:"interval" yaml:"interval"`
	ScreenshotInterval time.Duration `json:"screenshot_interval" yaml:"screenshot_interval"`
	CaptureScreenshots bool          `json:"capture_screenshots" yaml:"capture_screenshots"`
	TrackAllWindows    bool          `json:"track_all_windows" yaml:"track_all_windows"`
}

type PrivacyConfig struct {
	ExcludeApps    []string `json:"exclude_apps" yaml:"exclude_apps"`
	ExcludeTitles  []string `json:"exclude_titles" yaml:"exclude_titles"`
	BlurSensitive  bool     `json:"blur_sensitive" yaml:"blur_sensitive"`
	AutoDeleteDays int      `json:"auto_delete_after" yaml:"auto_delete_after"`
}

type ServerConfig struct {
	Port string `json:"port" yaml:"port"`
	Host string `json:"host" yaml:"host"`
}

type StorageConfig struct {
	Path    string `json:"path" yaml:"path"`
	MaxSize string `json:"max_size" yaml:"max_size"`
}

type AIConfig struct {
	Enabled  bool   `json:"enabled" yaml:"enabled"`
	Provider string `json:"provider" yaml:"provider"`
	Model    string `json:"model" yaml:"model"`
}

// WindowManager interface for platform-specific implementations
type WindowManager interface {
	GetActiveWindow() (*Window, error)
	GetAllWindows() ([]*Window, error)
	TakeScreenshot() ([]byte, error)
	GetFocusDuration() time.Duration
}

// Rule for categorization
type Rule struct {
	Name     string
	Priority int
	Matcher  func(windows []Window) bool
	Category string
}

// Error types
type PermissionError struct {
	Message string
}

func (e *PermissionError) Error() string {
	return e.Message
}

type StorageError struct {
	Message string
	Cause   error
}

func (e *StorageError) Error() string {
	return e.Message + ": " + e.Cause.Error()
}

type CaptureError struct {
	Message string
	Cause   error
}

func (e *CaptureError) Error() string {
	return e.Message + ": " + e.Cause.Error()
}

// JSON marshaling helpers
func (w *Window) MarshalJSON() ([]byte, error) {
	type Alias Window
	return json.Marshal(&struct {
		*Alias
		LastActive string `json:"last_active"`
	}{
		Alias:      (*Alias)(w),
		LastActive: w.LastActive.Format(time.RFC3339),
	})
}

func (a *Activity) MarshalJSON() ([]byte, error) {
	type Alias Activity
	return json.Marshal(&struct {
		*Alias
		Timestamp string `json:"timestamp"`
	}{
		Alias:     (*Alias)(a),
		Timestamp: a.Timestamp.Format(time.RFC3339),
	})
}
