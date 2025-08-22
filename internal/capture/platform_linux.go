//go:build linux

package capture

import (
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

// newPlatformWindowManager creates a platform-specific window manager (Linux)
func newPlatformWindowManager() types.WindowManager {
	return NewLinuxWindowManager()
}
