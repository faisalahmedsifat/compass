//go:build linux

package capture

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

// LinuxWindowManager implements WindowManager for Linux using X11 tools
type LinuxWindowManager struct {
	lastActiveWindow *types.Window
	focusStartTime   time.Time
	// Track focus sessions to prevent runaway time accumulation
	focusSessions map[string]time.Time // key: "appname:title:pid"

	// Event-driven fields
	eventListenerActive bool
	eventChan           chan<- *types.WindowEvent
	stopEventChan       chan struct{}
}

// NewLinuxWindowManager creates a new Linux window manager
func NewLinuxWindowManager() *LinuxWindowManager {
	return &LinuxWindowManager{
		focusStartTime: time.Now(),
		focusSessions:  make(map[string]time.Time),
	}
}

// GetActiveWindow gets the currently active window
func (m *LinuxWindowManager) GetActiveWindow() (*types.Window, error) {
	// Get active window ID using xprop
	cmd := exec.Command("xprop", "-root", "_NET_ACTIVE_WINDOW")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get active window: %w", err)
	}

	// Parse window ID from output like "_NET_ACTIVE_WINDOW(WINDOW): window id # 0x3200004"
	parts := strings.Fields(strings.TrimSpace(string(output)))
	if len(parts) < 5 {
		return nil, fmt.Errorf("invalid xprop output format")
	}

	windowID := parts[len(parts)-1]
	if windowID == "0x0" || windowID == "0" {
		return nil, fmt.Errorf("no active window found")
	}

	// Get detailed window information
	window, err := m.getWindowInfo(windowID, true)
	if err != nil {
		return nil, fmt.Errorf("failed to get window info: %w", err)
	}

	// Track focus time for active window with improved session management
	windowKey := fmt.Sprintf("%s:%s:%d", window.AppName, window.Title, window.ProcessID)

	if m.lastActiveWindow != nil &&
		m.lastActiveWindow.AppName == window.AppName &&
		m.lastActiveWindow.Title == window.Title &&
		m.lastActiveWindow.ProcessID == window.ProcessID {
		// Same window still active - no need to reset timer
	} else {
		// New active window - reset the focus timer
		m.lastActiveWindow = window
		m.focusStartTime = time.Now()

		// Clean up old focus sessions (keep only last 10 to prevent memory leaks)
		if len(m.focusSessions) > 10 {
			// Keep only the most recent sessions
			m.focusSessions = make(map[string]time.Time)
		}

		// Record this session start time
		m.focusSessions[windowKey] = time.Now()
	}

	return window, nil
}

// GetAllWindows gets all visible windows
func (m *LinuxWindowManager) GetAllWindows() ([]*types.Window, error) {
	// Use wmctrl to get window list with process IDs
	cmd := exec.Command("wmctrl", "-lp")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get window list: %w", err)
	}

	lines := strings.Split(strings.TrimSpace(string(output)), "\n")
	windows := make([]*types.Window, 0, len(lines))

	// Get active window info for comparison
	activeWindow, _ := m.GetActiveWindow()

	for _, line := range lines {
		if line == "" {
			continue
		}

		// Parse wmctrl output: "0x03200004  1 4719   pop-os compass - Cursor"
		parts := strings.Fields(line)
		if len(parts) < 5 {
			continue // Skip invalid lines
		}

		windowID := parts[0]
		processID, err := strconv.Atoi(parts[2])
		if err != nil {
			processID = 0 // fallback
		}

		// The title is everything after the hostname (parts[3])
		titleParts := parts[4:]
		title := strings.Join(titleParts, " ")

		// Skip desktop/panel windows
		if strings.Contains(title, "@!") || title == "" {
			continue
		}

		// Get detailed window information
		window, err := m.getWindowInfo(windowID, false)
		if err != nil {
			// Create basic window info if detailed info fails
			window = &types.Window{
				AppName:    "Unknown",
				Title:      title,
				ProcessID:  processID,
				IsActive:   false,
				LastActive: time.Now(),
				Position:   types.Rectangle{},
				Monitor:    0,
			}
		}

		// Mark active window
		if activeWindow != nil &&
			window.AppName == activeWindow.AppName &&
			window.Title == activeWindow.Title &&
			window.ProcessID == activeWindow.ProcessID {
			window.IsActive = true
			window.LastActive = time.Now()
		}

		windows = append(windows, window)
	}

	return windows, nil
}

// TakeScreenshot captures a screenshot using ImageMagick import
func (m *LinuxWindowManager) TakeScreenshot() ([]byte, error) {
	tmpFile := "/tmp/compass_screenshot.png"

	// Use ImageMagick import command (available on the system)
	cmd := exec.Command("import", "-window", "root", tmpFile)
	err := cmd.Run()
	if err != nil {
		return nil, fmt.Errorf("failed to take screenshot: %w", err)
	}

	// Read the file
	data, err := os.ReadFile(tmpFile)
	if err != nil {
		return nil, fmt.Errorf("failed to read screenshot: %w", err)
	}

	// Clean up temp file
	os.Remove(tmpFile)

	return data, nil
}

// getWindowInfo gets detailed information about a specific window
func (m *LinuxWindowManager) getWindowInfo(windowID string, isActive bool) (*types.Window, error) {
	// Get window properties using xprop
	cmd := exec.Command("xprop", "-id", windowID, "WM_CLASS", "_NET_WM_NAME", "WM_NAME", "_NET_WM_PID")
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get window properties: %w", err)
	}

	properties := make(map[string]string)
	lines := strings.Split(strings.TrimSpace(string(output)), "\n")

	for _, line := range lines {
		if strings.Contains(line, " = ") {
			parts := strings.SplitN(line, " = ", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				value := strings.TrimSpace(parts[1])
				// Remove quotes and extract the actual value
				if strings.HasPrefix(value, "\"") && strings.HasSuffix(value, "\"") {
					value = value[1 : len(value)-1]
				}
				properties[key] = value
			}
		}
	}

	// Extract app name from WM_CLASS
	appName := "Unknown"
	if wmClass, exists := properties["WM_CLASS(STRING)"]; exists {
		// WM_CLASS format: "instance", "class" - we want the class (second part)
		parts := strings.Split(wmClass, "\", \"")
		if len(parts) >= 2 {
			appName = strings.Trim(parts[1], "\"")
		} else if len(parts) == 1 {
			appName = strings.Trim(parts[0], "\"")
		}
	}

	// Extract title
	title := ""
	if netWmName, exists := properties["_NET_WM_NAME(UTF8_STRING)"]; exists {
		title = netWmName
	} else if wmName, exists := properties["WM_NAME(UTF8_STRING)"]; exists {
		title = wmName
	}

	// Extract process ID
	processID := 0
	if pidStr, exists := properties["_NET_WM_PID(CARDINAL)"]; exists {
		if pid, err := strconv.Atoi(pidStr); err == nil {
			processID = pid
		}
	}

	// Get window geometry using xwininfo
	rect, err := m.getWindowGeometry(windowID)
	if err != nil {
		// Use default geometry if we can't get it
		rect = types.Rectangle{X: 0, Y: 0, Width: 0, Height: 0}
	}

	window := &types.Window{
		AppName:    appName,
		Title:      title,
		ProcessID:  processID,
		IsActive:   isActive,
		LastActive: time.Now(),
		Position:   rect,
		Monitor:    0, // TODO: Add multi-monitor support
	}

	return window, nil
}

// getWindowGeometry gets window position and size using xwininfo
func (m *LinuxWindowManager) getWindowGeometry(windowID string) (types.Rectangle, error) {
	cmd := exec.Command("xwininfo", "-id", windowID)
	output, err := cmd.Output()
	if err != nil {
		return types.Rectangle{}, fmt.Errorf("failed to get window geometry: %w", err)
	}

	rect := types.Rectangle{}
	lines := strings.Split(string(output), "\n")

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "Absolute upper-left X:") {
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				if x, err := strconv.Atoi(parts[3]); err == nil {
					rect.X = x
				}
			}
		} else if strings.HasPrefix(line, "Absolute upper-left Y:") {
			parts := strings.Fields(line)
			if len(parts) >= 4 {
				if y, err := strconv.Atoi(parts[3]); err == nil {
					rect.Y = y
				}
			}
		} else if strings.HasPrefix(line, "Width:") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				if w, err := strconv.Atoi(parts[1]); err == nil {
					rect.Width = w
				}
			}
		} else if strings.HasPrefix(line, "Height:") {
			parts := strings.Fields(line)
			if len(parts) >= 2 {
				if h, err := strconv.Atoi(parts[1]); err == nil {
					rect.Height = h
				}
			}
		}
	}

	return rect, nil
}

// GetFocusDuration returns how long the current window has been in focus
func (m *LinuxWindowManager) GetFocusDuration() time.Duration {
	if m.lastActiveWindow == nil {
		return 0
	}

	// Calculate duration for current focus session
	duration := time.Since(m.focusStartTime)

	// Cap focus duration to prevent unrealistic values
	// Maximum of 6 hours per session (reasonable for deep work)
	maxDuration := 6 * time.Hour
	if duration > maxDuration {
		// Reset the timer to prevent further accumulation
		m.focusStartTime = time.Now()
		return maxDuration
	}

	// Additional safeguard: if duration is unreasonably long (>12 hours),
	// this indicates a bug or system sleep/resume, so reset
	if duration > 12*time.Hour {
		m.focusStartTime = time.Now()
		return 0
	}

	return duration
}

// ResetFocusTracking resets focus tracking for all applications
// This helps prevent accumulated time from long-running processes
func (m *LinuxWindowManager) ResetFocusTracking() {
	m.lastActiveWindow = nil
	m.focusStartTime = time.Now()
	m.focusSessions = make(map[string]time.Time)
}

// StartEventListener starts listening for window focus events using X11
func (m *LinuxWindowManager) StartEventListener(ctx context.Context, eventChan chan<- *types.WindowEvent) error {
	if m.eventListenerActive {
		return fmt.Errorf("event listener is already active")
	}

	m.eventChan = eventChan
	m.stopEventChan = make(chan struct{})
	m.eventListenerActive = true

	go m.eventListenerLoop(ctx)
	return nil
}

// StopEventListener stops the event listener
func (m *LinuxWindowManager) StopEventListener() error {
	if !m.eventListenerActive {
		return nil
	}

	close(m.stopEventChan)
	m.eventListenerActive = false
	return nil
}

// eventListenerLoop runs the main event listening loop
func (m *LinuxWindowManager) eventListenerLoop(ctx context.Context) {
	// Use adaptive polling: faster when changes detected, slower when stable
	fastTicker := time.NewTicker(100 * time.Millisecond)  // Fast: 100ms for rapid changes
	slowTicker := time.NewTicker(1000 * time.Millisecond) // Slow: 1s for stable periods
	defer fastTicker.Stop()
	defer slowTicker.Stop()

	var lastActiveWindow *types.Window
	var stableCount int
	useFastPolling := true

	for {
		select {
		case <-ctx.Done():
			return
		case <-m.stopEventChan:
			return
		case <-fastTicker.C:
			if useFastPolling {
				m.checkWindowChange(&lastActiveWindow, &stableCount, &useFastPolling)
			}
		case <-slowTicker.C:
			if !useFastPolling {
				m.checkWindowChange(&lastActiveWindow, &stableCount, &useFastPolling)
			}
		}
	}
}

// checkWindowChange checks for window changes and sends events
func (m *LinuxWindowManager) checkWindowChange(lastActiveWindow **types.Window, stableCount *int, useFastPolling *bool) {
	// Get current active window
	currentWindow, err := m.GetActiveWindow()
	if err != nil {
		return // Skip on error
	}

	// Check if window changed
	if *lastActiveWindow == nil || !m.windowsEqual(*lastActiveWindow, currentWindow) {
		// Window changed - send event
		event := &types.WindowEvent{
			Type:       "switch",
			Timestamp:  time.Now(),
			Window:     currentWindow,
			PrevWindow: *lastActiveWindow,
		}

		// Non-blocking send
		select {
		case m.eventChan <- event:
		default:
			// Channel full, skip this event
		}

		*lastActiveWindow = currentWindow
		*stableCount = 0       // Reset stable count
		*useFastPolling = true // Switch to fast polling when changes occur
	} else {
		// No change detected
		*stableCount++

		// Switch to slow polling after 10 stable checks (1 second of no changes)
		if *stableCount >= 10 {
			*useFastPolling = false
		}
	}
}

// windowsEqual checks if two windows are the same
func (m *LinuxWindowManager) windowsEqual(w1, w2 *types.Window) bool {
	if w1 == nil || w2 == nil {
		return w1 == w2
	}
	return w1.AppName == w2.AppName &&
		w1.Title == w2.Title &&
		w1.ProcessID == w2.ProcessID
}

// GetIdleState returns the current user idle state
func (m *LinuxWindowManager) GetIdleState() (*types.IdleState, error) {
	// Try xprintidle first (most accurate)
	if idleTime, err := m.getIdleTimeXprintidle(); err == nil {
		isIdle := idleTime > 5*time.Minute // Consider idle after 5 minutes
		return &types.IdleState{
			IsIdle:     isIdle,
			IdleTime:   idleTime,
			LastActive: time.Now().Add(-idleTime),
		}, nil
	}

	// Fallback to xscreensaver-command
	if idleTime, err := m.getIdleTimeXScreensaver(); err == nil {
		isIdle := idleTime > 5*time.Minute
		return &types.IdleState{
			IsIdle:     isIdle,
			IdleTime:   idleTime,
			LastActive: time.Now().Add(-idleTime),
		}, nil
	}

	// Final fallback - assume active
	return &types.IdleState{
		IsIdle:     false,
		IdleTime:   0,
		LastActive: time.Now(),
	}, nil
}

// getIdleTimeXprintidle gets idle time using xprintidle command
func (m *LinuxWindowManager) getIdleTimeXprintidle() (time.Duration, error) {
	cmd := exec.Command("xprintidle")
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("xprintidle not available: %w", err)
	}

	idleMs := strings.TrimSpace(string(output))
	ms, err := strconv.ParseInt(idleMs, 10, 64)
	if err != nil {
		return 0, fmt.Errorf("failed to parse idle time: %w", err)
	}

	return time.Duration(ms) * time.Millisecond, nil
}

// getIdleTimeXScreensaver gets idle time using xscreensaver-command
func (m *LinuxWindowManager) getIdleTimeXScreensaver() (time.Duration, error) {
	cmd := exec.Command("xscreensaver-command", "-time")
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("xscreensaver-command not available: %w", err)
	}

	// Parse output like "XScreenSaver 5.44: screen blanked since Mon Oct 21 15:30:45 2024 (00:05:23)"
	line := strings.TrimSpace(string(output))
	if strings.Contains(line, "screen non-blanked") {
		return 0, nil // Screen is active
	}

	// Extract time in parentheses
	if idx := strings.LastIndex(line, "("); idx >= 0 {
		timeStr := line[idx+1:]
		if idx2 := strings.Index(timeStr, ")"); idx2 >= 0 {
			timeStr = timeStr[:idx2]
			// Parse format like "00:05:23"
			parts := strings.Split(timeStr, ":")
			if len(parts) == 3 {
				hours, _ := strconv.Atoi(parts[0])
				minutes, _ := strconv.Atoi(parts[1])
				seconds, _ := strconv.Atoi(parts[2])
				return time.Duration(hours)*time.Hour +
					time.Duration(minutes)*time.Minute +
					time.Duration(seconds)*time.Second, nil
			}
		}
	}

	return 0, fmt.Errorf("could not parse xscreensaver output")
}

// newPlatformWindowManager creates a platform-specific window manager (Linux)
func newPlatformWindowManager() types.WindowManager {
	return NewLinuxWindowManager()
}
