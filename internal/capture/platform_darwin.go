//go:build darwin

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

// DarwinWindowManager implements WindowManager for macOS
type DarwinWindowManager struct {
	lastActiveWindow *types.Window
	focusStartTime   time.Time
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

// newPlatformWindowManager creates a platform-specific window manager (macOS)
func newPlatformWindowManager() types.WindowManager {
	return NewDarwinWindowManager()
}
