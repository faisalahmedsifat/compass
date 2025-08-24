package capture

import (
	"context"
	"fmt"
	"log"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

// ActivityBuffer represents a buffered activity with retry metadata
type ActivityBuffer struct {
	Activity    *types.Activity `json:"activity"`
	Timestamp   time.Time       `json:"timestamp"`
	Attempts    int             `json:"attempts"`
	LastAttempt time.Time       `json:"last_attempt"`
}

// CaptureEngine orchestrates the data capture process
type CaptureEngine struct {
	windowMgr      types.WindowManager
	storage        Storage
	categorizer    Categorizer
	privacyFilter  *PrivacyFilter
	interval       time.Duration
	config         *types.Config
	activityChan   chan *types.Activity
	lastCapture    time.Time
	lastScreenshot time.Time // Track when we last took a screenshot

	// Event-driven fields
	windowEventChan chan *types.WindowEvent
	eventBuffer     []*types.WindowEvent

	// Activity buffering system
	activityBuffer   []*ActivityBuffer
	bufferMutex      sync.RWMutex
	bufferChan       chan *types.Activity
	maxBufferSize    int
	maxRetryAttempts int
	batchSize        int
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
		windowMgr:       windowMgr,
		storage:         storage,
		categorizer:     categorizer,
		privacyFilter:   NewPrivacyFilter(config.Privacy),
		interval:        config.Tracking.Interval,
		config:          config,
		activityChan:    activityChan,
		windowEventChan: make(chan *types.WindowEvent, 100), // Buffer for events
		eventBuffer:     make([]*types.WindowEvent, 0, 50),

		// Initialize activity buffering system
		activityBuffer:   make([]*ActivityBuffer, 0, 500),
		bufferChan:       make(chan *types.Activity, 200),
		maxBufferSize:    500, // Store up to 500 activities
		maxRetryAttempts: 3,   // Retry failed saves 3 times
		batchSize:        10,  // Process activities in batches of 10
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

	// Start event listener for real-time tracking
	if err := c.windowMgr.StartEventListener(ctx, c.windowEventChan); err != nil {
		log.Printf("Failed to start event listener: %v", err)
	} else {
		log.Printf("Event listener started for real-time window tracking")
	}

	// Start activity buffering system
	go c.startActivityProcessor(ctx)
	log.Printf("Activity buffering system started (buffer size: %d, batch size: %d)", c.maxBufferSize, c.batchSize)

	ticker := time.NewTicker(c.interval)
	defer ticker.Stop()

	// Cleanup function
	defer func() {
		c.windowMgr.StopEventListener()
		c.flushActivityBuffer() // Ensure all buffered activities are saved
	}()

	// Take initial capture
	if err := c.captureWorkspace(); err != nil {
		log.Printf("Initial capture failed: %v", err)
	}

	for {
		select {
		case event := <-c.windowEventChan:
			// Handle real-time window events
			c.handleWindowEvent(event)

		case <-ticker.C:
			// Regular polling backup
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
	// Check if user is idle before capturing
	idleState, err := c.windowMgr.GetIdleState()
	if err != nil {
		log.Printf("Failed to get idle state: %v", err)
	} else if idleState.IsIdle {
		log.Printf("User is idle (%v), skipping workspace capture", idleState.IdleTime)
		return nil // Skip capture while user is idle
	}

	snapshot, err := c.captureWorkspaceSnapshot()
	if err != nil {
		return err
	}

	// Convert to activity record
	activity := c.snapshotToActivity(snapshot)

	// Send to buffering system for reliable storage
	c.bufferActivity(activity)

	// Update last capture time
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
			c.lastScreenshot = now // Update last screenshot time
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

// handleWindowEvent processes real-time window focus events
func (c *CaptureEngine) handleWindowEvent(event *types.WindowEvent) {
	if event == nil || event.Window == nil {
		return
	}

	// Check if user is idle before processing
	idleState, err := c.windowMgr.GetIdleState()
	if err != nil {
		log.Printf("Failed to get idle state: %v", err)
	} else if idleState.IsIdle {
		log.Printf("User is idle (%v), skipping window event", idleState.IdleTime)
		return // Skip processing while user is idle
	}

	log.Printf("Window event: %s -> %s (%s)", event.Type, event.Window.AppName, event.Window.Title)

	// Add event to buffer for analysis
	c.eventBuffer = append(c.eventBuffer, event)

	// Keep buffer size manageable
	if len(c.eventBuffer) > 50 {
		c.eventBuffer = c.eventBuffer[len(c.eventBuffer)-50:]
	}

	// Create activity from the event
	activity := c.eventToActivity(event)

	// Send to buffering system for reliable storage
	c.bufferActivity(activity)

	// Send to real-time subscribers
	select {
	case c.activityChan <- activity:
	default:
		// Channel full, skip this update
	}
}

// eventToActivity converts a window event to an activity record
func (c *CaptureEngine) eventToActivity(event *types.WindowEvent) *types.Activity {
	// Calculate focus duration based on previous event
	var focusDuration int

	if event.PrevWindow != nil && len(c.eventBuffer) > 1 {
		// Find previous event timestamp for the same window
		for i := len(c.eventBuffer) - 2; i >= 0; i-- {
			prevEvent := c.eventBuffer[i]
			if prevEvent.Window != nil &&
				prevEvent.Window.AppName == event.PrevWindow.AppName &&
				prevEvent.Window.Title == event.PrevWindow.Title &&
				prevEvent.Window.ProcessID == event.PrevWindow.ProcessID {

				duration := event.Timestamp.Sub(prevEvent.Timestamp)
				// Cap at reasonable limits
				if duration > 0 && duration < time.Hour {
					focusDuration = int(duration.Seconds())
				}
				break
			}
		}
	}

	// Get all windows for context
	allWindows, err := c.windowMgr.GetAllWindows()
	if err != nil {
		allWindows = []*types.Window{event.Window}
	}

	// Convert to slice of values
	windowValues := make([]types.Window, len(allWindows))
	for i, w := range allWindows {
		if w != nil {
			windowValues[i] = *w
		}
	}

	// Categorize activity
	category, _ := c.categorizer.Categorize(windowValues)

	// Only mark as active for focus/switch events, not blur events
	isActive := event.Type == "focus" || event.Type == "switch"

	return &types.Activity{
		Timestamp:     event.Timestamp,
		AppName:       event.Window.AppName,
		WindowTitle:   event.Window.Title,
		ProcessID:     event.Window.ProcessID,
		IsActive:      isActive,
		FocusDuration: focusDuration,
		TotalWindows:  len(windowValues),
		AllWindows:    windowValues,
		Category:      category,
		Confidence:    1.0,
		Screenshot:    nil, // Events don't include screenshots
	}
}

// snapshotToActivity converts a workspace snapshot to an activity record
func (c *CaptureEngine) snapshotToActivity(snapshot *types.WorkspaceSnapshot) *types.Activity {
	// Calculate focus duration with improved logic for rapid switches
	var focusDuration int

	if !c.lastCapture.IsZero() {
		// Calculate time since last capture
		timeSinceLastCapture := snapshot.Timestamp.Sub(c.lastCapture)

		// Get actual focus duration from window manager
		actualFocusTime := c.windowMgr.GetFocusDuration()

		// Improved logic for focus duration calculation
		if actualFocusTime <= timeSinceLastCapture {
			// Window became active during this interval
			// Use the actual focus time (window switched recently)
			focusDuration = int(actualFocusTime.Seconds())
		} else {
			// Window was active for entire interval or longer
			// Use time since last capture to avoid over-counting
			maxTime := timeSinceLastCapture
			if maxTime > c.interval {
				maxTime = c.interval
			}
			focusDuration = int(maxTime.Seconds())
		}

		// Additional check: if focus time is unreasonably small (< 1 second)
		// but time since capture is larger, it likely means rapid switching
		if focusDuration < 1 && timeSinceLastCapture > time.Second {
			// Use a proportional time based on actual vs total
			ratio := float64(actualFocusTime) / float64(timeSinceLastCapture)
			if ratio > 0.1 && ratio < 1.0 {
				focusDuration = int(float64(timeSinceLastCapture.Seconds()) * ratio)
			}
		}
	} else {
		// First capture - use actual focus duration with reasonable cap
		totalFocusTime := c.windowMgr.GetFocusDuration()
		maxFirstCapture := c.interval
		if maxFirstCapture > 30*time.Second {
			maxFirstCapture = 30 * time.Second // Cap first capture at 30s
		}

		if totalFocusTime > maxFirstCapture {
			focusDuration = int(maxFirstCapture.Seconds())
		} else {
			focusDuration = int(totalFocusTime.Seconds())
		}
	}

	// Ensure focus duration is reasonable (between 0 and interval)
	maxDuration := int(c.interval.Seconds())
	if focusDuration < 0 {
		focusDuration = 0
	} else if focusDuration > maxDuration {
		focusDuration = maxDuration
	}

	// Only mark as active if we have a valid active window
	isActive := snapshot.ActiveWindow.AppName != "" && focusDuration > 0

	return &types.Activity{
		Timestamp:     snapshot.Timestamp,
		AppName:       snapshot.ActiveWindow.AppName,
		WindowTitle:   snapshot.ActiveWindow.Title,
		ProcessID:     snapshot.ActiveWindow.ProcessID,
		IsActive:      isActive,
		FocusDuration: focusDuration,
		TotalWindows:  snapshot.WindowCount,
		AllWindows:    snapshot.AllWindows,
		Category:      snapshot.Category,
		Confidence:    1.0, // Will be set by categorizer
		Screenshot:    snapshot.Screenshot,
	}
}

// bufferActivity adds an activity to the buffer for reliable storage
func (c *CaptureEngine) bufferActivity(activity *types.Activity) {
	c.bufferMutex.Lock()
	defer c.bufferMutex.Unlock()

	// Check buffer size limit
	if len(c.activityBuffer) >= c.maxBufferSize {
		// Remove oldest activity to make room
		log.Printf("Activity buffer full (%d), dropping oldest activity", c.maxBufferSize)
		c.activityBuffer = c.activityBuffer[1:]
	}

	// Add new activity to buffer
	bufferedActivity := &ActivityBuffer{
		Activity:    activity,
		Timestamp:   time.Now(),
		Attempts:    0,
		LastAttempt: time.Time{},
	}

	c.activityBuffer = append(c.activityBuffer, bufferedActivity)

	// Notify processor
	select {
	case c.bufferChan <- activity:
	default:
		// Channel full, activity is in buffer anyway
	}
}

// startActivityProcessor runs the main activity processing loop
func (c *CaptureEngine) startActivityProcessor(ctx context.Context) {
	// Process activities every 5 seconds
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	// Retry failed activities every 30 seconds
	retryTicker := time.NewTicker(30 * time.Second)
	defer retryTicker.Stop()

	for {
		select {
		case <-ctx.Done():
			log.Printf("Activity processor shutting down")
			c.flushActivityBuffer()
			return

		case <-ticker.C:
			// Process pending activities in batches
			c.processActivityBatch()

		case <-retryTicker.C:
			// Retry failed activities
			c.retryFailedActivities()

		case <-c.bufferChan:
			// Activity received, will be processed on next tick
		}
	}
}

// processActivityBatch processes activities from the buffer in batches
func (c *CaptureEngine) processActivityBatch() {
	c.bufferMutex.Lock()
	defer c.bufferMutex.Unlock()

	if len(c.activityBuffer) == 0 {
		return
	}

	// Determine batch size
	batchSize := c.batchSize
	if len(c.activityBuffer) < batchSize {
		batchSize = len(c.activityBuffer)
	}

	// Process activities in batch
	processed := 0
	for i := 0; i < len(c.activityBuffer) && processed < batchSize; i++ {
		bufferedActivity := c.activityBuffer[i]

		// Skip activities that are too new (give them time to settle)
		if time.Since(bufferedActivity.Timestamp) < 2*time.Second {
			continue
		}

		// Skip activities that have failed too many times
		if bufferedActivity.Attempts >= c.maxRetryAttempts {
			continue
		}

		// Try to save the activity
		if err := c.storage.SaveActivity(bufferedActivity.Activity); err != nil {
			bufferedActivity.Attempts++
			bufferedActivity.LastAttempt = time.Now()
			log.Printf("Failed to save buffered activity (attempt %d/%d): %v",
				bufferedActivity.Attempts, c.maxRetryAttempts, err)
		} else {
			// Successfully saved, remove from buffer
			c.activityBuffer = append(c.activityBuffer[:i], c.activityBuffer[i+1:]...)
			i-- // Adjust index since we removed an element
			processed++
		}
	}

	if processed > 0 {
		log.Printf("Processed %d buffered activities, %d remaining in buffer", processed, len(c.activityBuffer))
	}
}

// retryFailedActivities attempts to retry activities that have failed before
func (c *CaptureEngine) retryFailedActivities() {
	c.bufferMutex.Lock()
	defer c.bufferMutex.Unlock()

	retried := 0
	for i := 0; i < len(c.activityBuffer); i++ {
		bufferedActivity := c.activityBuffer[i]

		// Only retry activities that have failed and enough time has passed
		if bufferedActivity.Attempts > 0 &&
			bufferedActivity.Attempts < c.maxRetryAttempts &&
			time.Since(bufferedActivity.LastAttempt) > 60*time.Second {

			if err := c.storage.SaveActivity(bufferedActivity.Activity); err != nil {
				bufferedActivity.Attempts++
				bufferedActivity.LastAttempt = time.Now()
				log.Printf("Retry failed for buffered activity (attempt %d/%d): %v",
					bufferedActivity.Attempts, c.maxRetryAttempts, err)
			} else {
				// Successfully saved, remove from buffer
				c.activityBuffer = append(c.activityBuffer[:i], c.activityBuffer[i+1:]...)
				i-- // Adjust index since we removed an element
				retried++
			}
		}
	}

	if retried > 0 {
		log.Printf("Successfully retried %d failed activities", retried)
	}
}

// flushActivityBuffer attempts to save all remaining activities in the buffer
func (c *CaptureEngine) flushActivityBuffer() {
	c.bufferMutex.Lock()
	defer c.bufferMutex.Unlock()

	if len(c.activityBuffer) == 0 {
		return
	}

	log.Printf("Flushing %d activities from buffer", len(c.activityBuffer))

	saved := 0
	failed := 0

	for _, bufferedActivity := range c.activityBuffer {
		if err := c.storage.SaveActivity(bufferedActivity.Activity); err != nil {
			log.Printf("Failed to flush buffered activity: %v", err)
			failed++
		} else {
			saved++
		}
	}

	log.Printf("Buffer flush complete: %d saved, %d failed", saved, failed)

	// Clear buffer
	c.activityBuffer = c.activityBuffer[:0]
}

// GetBufferStats returns statistics about the activity buffer
func (c *CaptureEngine) GetBufferStats() map[string]interface{} {
	c.bufferMutex.RLock()
	defer c.bufferMutex.RUnlock()

	failed := 0
	for _, bufferedActivity := range c.activityBuffer {
		if bufferedActivity.Attempts > 0 {
			failed++
		}
	}

	return map[string]interface{}{
		"buffer_size":        len(c.activityBuffer),
		"max_buffer_size":    c.maxBufferSize,
		"failed_activities":  failed,
		"max_retry_attempts": c.maxRetryAttempts,
		"batch_size":         c.batchSize,
		"buffer_usage_pct":   float64(len(c.activityBuffer)) / float64(c.maxBufferSize) * 100,
	}
}

// GetWindowManager returns the window manager instance for real-time focus duration
func (c *CaptureEngine) GetWindowManager() types.WindowManager {
	return c.windowMgr
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
