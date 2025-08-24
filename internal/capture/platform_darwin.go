//go:build darwin

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

// DarwinWindowManager implements WindowManager for macOS
type DarwinWindowManager struct {
	lastActiveWindow *types.Window
	focusStartTime   time.Time

	// Event-driven fields
	eventListenerActive bool
	eventChan           chan<- *types.WindowEvent
	stopEventChan       chan struct{}
}

// NewDarwinWindowManager creates a new macOS window manager
func NewDarwinWindowManager() *DarwinWindowManager {
	return &DarwinWindowManager{
		focusStartTime: time.Now(),
	}
}

// GetActiveWindow gets the currently active window
func (m *DarwinWindowManager) GetActiveWindow() (*types.Window, error) {
	script := `
	tell application "System Events"
		try
			set activeApp to name of first application process whose frontmost is true
			set processId to unix id of process activeApp
			try
				tell process activeApp
					if exists window 1 then
						set windowTitle to name of window 1
						return activeApp & "|" & windowTitle & "|" & processId & "|0,0,0,0"
					else
						return activeApp & "|" & "" & "|" & processId & "|0,0,0,0"
					end if
				end tell
			on error
				return activeApp & "|" & "" & "|" & processId & "|0,0,0,0"
			end try
		on error
			return "Unknown||0|0,0,0,0"
		end try
	end tell
	`

	cmd := exec.Command("osascript", "-e", script)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get active window: %w", err)
	}

	return m.parseWindowInfo(strings.TrimSpace(string(output)), true)
}

// GetAllWindows gets all visible windows
func (m *DarwinWindowManager) GetAllWindows() ([]*types.Window, error) {
	script := `
	tell application "System Events"
		try
			set windowList to {}
			repeat with proc in (every application process whose visible is true)
				try
					set procName to name of proc
					set procId to unix id of proc
					try
						repeat with win in windows of proc
							try
								set windowTitle to name of win
								set end of windowList to procName & "|" & windowTitle & "|" & procId & "|0,0,0,0"
							end try
						end repeat
					end try
				end try
			end repeat
			return my list_to_string(windowList, character id 10)
		on error
			return ""
		end try
	end tell
	
	on list_to_string(lst, delim)
		set prevTIDs to text item delimiters of AppleScript
		set text item delimiters of AppleScript to delim
		set str to lst as string
		set text item delimiters of AppleScript to prevTIDs
		return str
	end list_to_string
	`

	cmd := exec.Command("osascript", "-e", script)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("failed to get all windows: %w", err)
	}

	return m.parseAllWindowsInfo(strings.TrimSpace(string(output)))
}

// TakeScreenshot captures a screenshot (basic implementation)
func (m *DarwinWindowManager) TakeScreenshot() ([]byte, error) {
	// Use macOS screencapture command
	tmpFile := "/tmp/compass_screenshot.png"
	cmd := exec.Command("screencapture", "-x", tmpFile)
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

// parseWindowInfo parses window information from AppleScript output
func (m *DarwinWindowManager) parseWindowInfo(output string, isActive bool) (*types.Window, error) {
	parts := strings.Split(output, "|")
	if len(parts) < 4 {
		return nil, fmt.Errorf("invalid window info format: %s", output)
	}

	appName := parts[0]
	title := parts[1]
	processID, err := strconv.Atoi(parts[2])
	if err != nil {
		processID = 0 // fallback
	}

	// Parse bounds
	bounds := strings.Split(parts[3], ",")
	var rect types.Rectangle
	if len(bounds) == 4 {
		if x, err := strconv.Atoi(bounds[0]); err == nil {
			rect.X = x
		}
		if y, err := strconv.Atoi(bounds[1]); err == nil {
			rect.Y = y
		}
		if x2, err := strconv.Atoi(bounds[2]); err == nil {
			rect.Width = x2 - rect.X
		}
		if y2, err := strconv.Atoi(bounds[3]); err == nil {
			rect.Height = y2 - rect.Y
		}
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

	// Track focus time for active window
	if isActive {
		if m.lastActiveWindow != nil && m.lastActiveWindow.AppName == appName && m.lastActiveWindow.Title == title {
			// Same window still active, calculate focus duration
		} else {
			// New active window
			m.lastActiveWindow = window
			m.focusStartTime = time.Now()
		}
	}

	return window, nil
}

// parseAllWindowsInfo parses all windows from AppleScript output
func (m *DarwinWindowManager) parseAllWindowsInfo(output string) ([]*types.Window, error) {
	if output == "" {
		return []*types.Window{}, nil
	}

	lines := strings.Split(output, "\n")
	windows := make([]*types.Window, 0, len(lines))

	// Get active window first to mark it correctly
	activeWindow, err := m.GetActiveWindow()
	if err != nil {
		// Continue without active window info
		activeWindow = nil
	}

	for _, line := range lines {
		if line == "" {
			continue
		}

		window, err := m.parseWindowInfo(line, false)
		if err != nil {
			continue // Skip invalid windows
		}

		// Mark active window
		if activeWindow != nil &&
			window.AppName == activeWindow.AppName &&
			window.Title == activeWindow.Title {
			window.IsActive = true
			window.LastActive = time.Now()
		} else {
			window.IsActive = false
		}

		windows = append(windows, window)
	}

	return windows, nil
}

// GetFocusDuration returns how long the current window has been in focus
func (m *DarwinWindowManager) GetFocusDuration() time.Duration {
	if m.lastActiveWindow == nil {
		return 0
	}
	return time.Since(m.focusStartTime)
}

// StartEventListener starts listening for window focus events on macOS
func (m *DarwinWindowManager) StartEventListener(ctx context.Context, eventChan chan<- *types.WindowEvent) error {
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
func (m *DarwinWindowManager) StopEventListener() error {
	if !m.eventListenerActive {
		return nil
	}

	close(m.stopEventChan)
	m.eventListenerActive = false
	return nil
}

// eventListenerLoop runs the main event listening loop for macOS
func (m *DarwinWindowManager) eventListenerLoop(ctx context.Context) {
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

// checkWindowChange checks for window changes and sends events (macOS)
func (m *DarwinWindowManager) checkWindowChange(lastActiveWindow **types.Window, stableCount *int, useFastPolling *bool) {
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
func (m *DarwinWindowManager) windowsEqual(w1, w2 *types.Window) bool {
	if w1 == nil || w2 == nil {
		return w1 == w2
	}
	return w1.AppName == w2.AppName &&
		w1.Title == w2.Title &&
		w1.ProcessID == w2.ProcessID
}

// GetIdleState returns the current user idle state on macOS
func (m *DarwinWindowManager) GetIdleState() (*types.IdleState, error) {
	// Use ioreg to get idle time on macOS
	idleTime, err := m.getIdleTimeIoreg()
	if err != nil {
		// Fallback - assume active
		return &types.IdleState{
			IsIdle:     false,
			IdleTime:   0,
			LastActive: time.Now(),
		}, nil
	}

	isIdle := idleTime > 5*time.Minute // Consider idle after 5 minutes
	return &types.IdleState{
		IsIdle:     isIdle,
		IdleTime:   idleTime,
		LastActive: time.Now().Add(-idleTime),
	}, nil
}

// getIdleTimeIoreg gets idle time using ioreg command on macOS
func (m *DarwinWindowManager) getIdleTimeIoreg() (time.Duration, error) {
	cmd := exec.Command("ioreg", "-c", "IOHIDSystem")
	output, err := cmd.Output()
	if err != nil {
		return 0, fmt.Errorf("ioreg command failed: %w", err)
	}

	// Look for HIDIdleTime in the output
	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, "HIDIdleTime") {
			// Parse line like: "HIDIdleTime" = 1234567890
			parts := strings.Split(line, "=")
			if len(parts) >= 2 {
				valueStr := strings.TrimSpace(parts[1])
				// Remove any trailing characters
				valueStr = strings.Fields(valueStr)[0]

				idleNanoseconds, err := strconv.ParseInt(valueStr, 10, 64)
				if err != nil {
					continue
				}

				// HIDIdleTime is in nanoseconds since last input
				return time.Duration(idleNanoseconds), nil
			}
		}
	}

	return 0, fmt.Errorf("could not find HIDIdleTime in ioreg output")
}

// newPlatformWindowManager creates a platform-specific window manager (macOS)
func newPlatformWindowManager() types.WindowManager {
	return NewDarwinWindowManager()
}
