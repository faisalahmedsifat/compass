package capture

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

// CaptureEngine orchestrates the data capture process
type CaptureEngine struct {
	windowMgr       types.WindowManager
	storage         Storage
	categorizer     Categorizer
	privacyFilter   *PrivacyFilter
	interval        time.Duration
	config          *types.Config
	activityChan    chan *types.Activity
	lastCapture     time.Time
	lastScreenshot  time.Time  // Track when we last took a screenshot
}

// Storage interface for the capture engine
type Storage interface {
	SaveActivity(activity *types.Activity) error
}

// Categorizer interface for activity categorization
type Categorizer interface {
	Categorize(windows []types.Window) (string, float64)
}

// NewCaptureEngine creates a new capture engine
func NewCaptureEngine(config *types.Config, storage Storage, categorizer Categorizer, activityChan chan *types.Activity) *CaptureEngine {
	var windowMgr types.WindowManager

	// Use platform-specific implementation
	windowMgr = newPlatformWindowManager()

	return &CaptureEngine{
		windowMgr:     windowMgr,
		storage:       storage,
		categorizer:   categorizer,
		privacyFilter: NewPrivacyFilter(config.Privacy),
		interval:      config.Tracking.Interval,
		config:        config,
		activityChan:  activityChan,
	}
}

// Start begins the capture process
func (c *CaptureEngine) Start(ctx context.Context) error {
	log.Printf("Starting capture engine with %v interval", c.interval)
	if c.config.Tracking.CaptureScreenshots {
		log.Printf("Screenshots enabled with %v interval", c.config.Tracking.ScreenshotInterval)
	}

	// Initialize last capture and screenshot times
	c.lastCapture = time.Time{}
	c.lastScreenshot = time.Time{}

	ticker := time.NewTicker(c.interval)
	defer ticker.Stop()

	// Take initial capture
	if err := c.captureWorkspace(); err != nil {
		log.Printf("Initial capture failed: %v", err)
	}

	for {
		select {
		case <-ticker.C:
			if err := c.captureWorkspace(); err != nil {
				log.Printf("Capture failed: %v", err)
			}
		case <-ctx.Done():
			log.Println("Stopping capture engine")
			return nil
		}
	}
}

// CaptureOnce captures the current workspace state once
func (c *CaptureEngine) CaptureOnce() (*types.WorkspaceSnapshot, error) {
	return c.captureWorkspaceSnapshot()
}

// captureWorkspace captures and stores the current workspace state
func (c *CaptureEngine) captureWorkspace() error {
	snapshot, err := c.captureWorkspaceSnapshot()
	if err != nil {
		return err
	}

	// Convert to activity record
	activity := c.snapshotToActivity(snapshot)

	// Store in database
	if err := c.storage.SaveActivity(activity); err != nil {
		return fmt.Errorf("failed to save activity: %w", err)
	}

	// Update last capture time AFTER successful save
	c.lastCapture = snapshot.Timestamp

	// Send to real-time subscribers
	select {
	case c.activityChan <- activity:
	default:
		// Channel full, skip this update
	}

	return nil
}

// captureWorkspaceSnapshot captures the current workspace state
func (c *CaptureEngine) captureWorkspaceSnapshot() (*types.WorkspaceSnapshot, error) {
	// 1. Get all windows
	windows, err := c.windowMgr.GetAllWindows()
	if err != nil {
		return nil, fmt.Errorf("failed to get windows: %w", err)
	}

	if len(windows) == 0 {
		return nil, fmt.Errorf("no windows found")
	}

	// 2. Apply privacy filters
	filteredWindows := c.privacyFilter.FilterWindows(windows)

	// 3. Find active window
	var activeWindow types.Window
	for _, w := range filteredWindows {
		if w.IsActive {
			activeWindow = *w
			break
		}
	}

	// 4. Convert to slice of values for categorization
	windowValues := make([]types.Window, len(filteredWindows))
	for i, w := range filteredWindows {
		windowValues[i] = *w
	}

	// 5. Categorize activity
	category, _ := c.categorizer.Categorize(windowValues)

	// 6. Take screenshot (optional) - based on screenshot interval
	var screenshot []byte
	now := time.Now()
	shouldTakeScreenshot := c.config.Tracking.CaptureScreenshots && 
		(c.lastScreenshot.IsZero() || now.Sub(c.lastScreenshot) >= c.config.Tracking.ScreenshotInterval)
	
	if shouldTakeScreenshot {
		if data, err := c.windowMgr.TakeScreenshot(); err == nil {
			screenshot = c.privacyFilter.BlurSensitive(data)
			c.lastScreenshot = now  // Update last screenshot time
		}
	}

	snapshot := &types.WorkspaceSnapshot{
		Timestamp:    time.Now(),
		ActiveWindow: activeWindow,
		AllWindows:   windowValues,
		WindowCount:  len(windowValues),
		Category:     category,
		Screenshot:   screenshot,
	}

	return snapshot, nil
}

// snapshotToActivity converts a workspace snapshot to an activity record
func (c *CaptureEngine) snapshotToActivity(snapshot *types.WorkspaceSnapshot) *types.Activity {
	// Calculate focus duration since last capture
	var focusDuration int

	if !c.lastCapture.IsZero() {
		// Calculate time since last capture (limited to the interval)
		timeSinceLastCapture := snapshot.Timestamp.Sub(c.lastCapture)

		// Cap at interval duration to prevent accumulation errors
		if timeSinceLastCapture > c.interval {
			timeSinceLastCapture = c.interval
		}

		// Only count time if the same window is still active
		totalFocusTime := c.windowMgr.GetFocusDuration()
		if totalFocusTime >= timeSinceLastCapture {
			focusDuration = int(timeSinceLastCapture.Seconds())
		} else {
			// Window became active during this interval
			focusDuration = int(totalFocusTime.Seconds())
		}
	} else {
		// First capture - use the actual focus duration but cap at interval
		totalFocusTime := c.windowMgr.GetFocusDuration()
		if totalFocusTime > c.interval {
			focusDuration = int(c.interval.Seconds())
		} else {
			focusDuration = int(totalFocusTime.Seconds())
		}
	}

	return &types.Activity{
		Timestamp:     snapshot.Timestamp,
		AppName:       snapshot.ActiveWindow.AppName,
		WindowTitle:   snapshot.ActiveWindow.Title,
		ProcessID:     snapshot.ActiveWindow.ProcessID,
		IsActive:      true,
		FocusDuration: focusDuration,
		TotalWindows:  snapshot.WindowCount,
		AllWindows:    snapshot.AllWindows,
		Category:      snapshot.Category,
		Confidence:    1.0, // Will be set by categorizer
		Screenshot:    snapshot.Screenshot,
	}
}

// PrivacyFilter handles privacy and security filtering
type PrivacyFilter struct {
	config          *types.PrivacyConfig
	excludeApps     map[string]bool
	excludePatterns []*regexp.Regexp
}

// NewPrivacyFilter creates a new privacy filter
func NewPrivacyFilter(config *types.PrivacyConfig) *PrivacyFilter {
	filter := &PrivacyFilter{
		config:      config,
		excludeApps: make(map[string]bool),
	}

	// Build exclude apps map for faster lookup
	for _, app := range config.ExcludeApps {
		filter.excludeApps[strings.ToLower(app)] = true
	}

	// Compile exclude patterns
	for _, pattern := range config.ExcludeTitles {
		if regex, err := regexp.Compile("(?i)" + pattern); err == nil {
			filter.excludePatterns = append(filter.excludePatterns, regex)
		}
	}

	return filter
}

// FilterWindows applies privacy filters to window list
func (f *PrivacyFilter) FilterWindows(windows []*types.Window) []*types.Window {
	filtered := make([]*types.Window, 0, len(windows))

	for _, w := range windows {
		// Skip excluded apps
		if f.isAppExcluded(w.AppName) {
			continue
		}

		// Create a copy to avoid modifying original
		window := *w

		// Redact sensitive titles
		window.Title = f.redactSensitiveTitle(window.Title)

		filtered = append(filtered, &window)
	}

	return filtered
}

// BlurSensitive applies blur to sensitive screenshot regions
func (f *PrivacyFilter) BlurSensitive(screenshot []byte) []byte {
	if !f.config.BlurSensitive || len(screenshot) == 0 {
		return screenshot
	}

	// For MVP, just return the screenshot as-is
	// TODO: Implement OCR-based sensitive content detection and blurring
	return screenshot
}

// isAppExcluded checks if an app should be excluded from tracking
func (f *PrivacyFilter) isAppExcluded(appName string) bool {
	return f.excludeApps[strings.ToLower(appName)]
}

// redactSensitiveTitle redacts sensitive information from window titles
func (f *PrivacyFilter) redactSensitiveTitle(title string) string {
	for _, pattern := range f.excludePatterns {
		if pattern.MatchString(title) {
			return "[PRIVATE]"
		}
	}
	return title
}
