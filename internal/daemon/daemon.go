package daemon

import (
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"
)

const (
	PidFileName = "compass.pid"
	LogFileName = "compass.log"
)

// DaemonManager handles daemon process management
type DaemonManager struct {
	PidFile string
	LogFile string
	WorkDir string
}

// NewDaemonManager creates a new daemon manager
func NewDaemonManager() *DaemonManager {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		homeDir = "/tmp"
	}

	workDir := filepath.Join(homeDir, ".compass")
	os.MkdirAll(workDir, 0755)

	return &DaemonManager{
		PidFile: filepath.Join(workDir, PidFileName),
		LogFile: filepath.Join(workDir, LogFileName),
		WorkDir: workDir,
	}
}

// Start starts the daemon process
func (d *DaemonManager) Start(executablePath string, args []string) error {
	// Check if already running
	if d.IsRunning() {
		return fmt.Errorf("compass daemon is already running (PID: %d)", d.GetPid())
	}

	// Prepare command
	cmd := exec.Command(executablePath, args...)

	// Set up log file
	logFile, err := os.OpenFile(d.LogFile, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return fmt.Errorf("failed to open log file: %w", err)
	}
	defer logFile.Close()

	// Redirect stdout and stderr to log file
	cmd.Stdout = logFile
	cmd.Stderr = logFile
	cmd.Stdin = nil

	// Detach from parent process
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Setsid: true, // Create new session
	}

	// Start the process
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start daemon: %w", err)
	}

	// Write PID file
	if err := d.writePidFile(cmd.Process.Pid); err != nil {
		// Kill the process if we can't write PID file
		cmd.Process.Kill()
		return fmt.Errorf("failed to write PID file: %w", err)
	}

	fmt.Printf("🧭 Compass daemon started (PID: %d)\n", cmd.Process.Pid)
	fmt.Printf("📍 PID file: %s\n", d.PidFile)
	fmt.Printf("📄 Log file: %s\n", d.LogFile)
	fmt.Printf("🌐 Dashboard: http://localhost:8080\n")
	fmt.Printf("⚡ Use 'compass stop' to stop the daemon\n")

	return nil
}

// Stop stops the daemon process
func (d *DaemonManager) Stop() error {
	pid := d.GetPid()
	if pid <= 0 {
		return fmt.Errorf("compass daemon is not running (no PID file found)")
	}

	// Find the process
	process, err := os.FindProcess(pid)
	if err != nil {
		d.removePidFile() // Clean up stale PID file
		return fmt.Errorf("failed to find process: %w", err)
	}

	// Try graceful shutdown first (SIGTERM)
	fmt.Printf("🧭 Stopping Compass daemon (PID: %d)...\n", pid)
	if err := process.Signal(syscall.SIGTERM); err != nil {
		// If graceful shutdown fails, check if process is still alive
		if err := process.Signal(syscall.Signal(0)); err != nil {
			// Process doesn't exist, clean up PID file
			d.removePidFile()
			return fmt.Errorf("compass daemon was not running (cleaned up stale PID file)")
		}
		return fmt.Errorf("failed to stop daemon: %w", err)
	}

	// Wait for graceful shutdown (max 10 seconds)
	for i := 0; i < 100; i++ {
		if err := process.Signal(syscall.Signal(0)); err != nil {
			// Process has stopped
			break
		}
		time.Sleep(100 * time.Millisecond)
	}

	// Check if still running, force kill if necessary
	if err := process.Signal(syscall.Signal(0)); err == nil {
		fmt.Println("⚠️  Graceful shutdown timeout, force killing...")
		process.Kill()
	}

	// Clean up PID file
	d.removePidFile()
	fmt.Println("🧭 Compass daemon stopped")

	return nil
}

// Restart restarts the daemon
func (d *DaemonManager) Restart(executablePath string, args []string) error {
	fmt.Println("🧭 Restarting Compass daemon...")

	// Stop if running
	if d.IsRunning() {
		if err := d.Stop(); err != nil {
			log.Printf("Warning: Error stopping daemon: %v", err)
		}
		time.Sleep(1 * time.Second) // Brief pause
	}

	// Start again
	return d.Start(executablePath, args)
}

// Status shows daemon status
func (d *DaemonManager) Status() {
	fmt.Printf("🧭 Compass Daemon Status\n")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	if d.IsRunning() {
		pid := d.GetPid()
		uptime := d.GetUptime()
		fmt.Printf("Status: 🟢 RUNNING (PID: %d)\n", pid)
		if uptime > 0 {
			fmt.Printf("Uptime: %s\n", formatDuration(uptime))
		}
	} else {
		fmt.Printf("Status: 🔴 STOPPED\n")
	}

	fmt.Printf("PID file: %s\n", d.PidFile)
	fmt.Printf("Log file: %s\n", d.LogFile)

	// Show log tail if available
	if d.IsRunning() {
		fmt.Println("\nRecent logs:")
		d.ShowLogTail(5)
	}
}

// IsRunning checks if daemon is running
func (d *DaemonManager) IsRunning() bool {
	pid := d.GetPid()
	if pid <= 0 {
		return false
	}

	// Check if process exists
	process, err := os.FindProcess(pid)
	if err != nil {
		return false
	}

	// Send signal 0 to check if process is alive
	err = process.Signal(syscall.Signal(0))
	return err == nil
}

// GetPid returns the PID from the PID file
func (d *DaemonManager) GetPid() int {
	data, err := os.ReadFile(d.PidFile)
	if err != nil {
		return 0
	}

	pid, err := strconv.Atoi(strings.TrimSpace(string(data)))
	if err != nil {
		return 0
	}

	return pid
}

// GetUptime returns process uptime
func (d *DaemonManager) GetUptime() time.Duration {
	pid := d.GetPid()
	if pid <= 0 {
		return 0
	}

	// Read process start time from /proc/PID/stat
	statFile := fmt.Sprintf("/proc/%d/stat", pid)
	data, err := os.ReadFile(statFile)
	if err != nil {
		return 0 // Not available on non-Linux systems
	}

	fields := strings.Fields(string(data))
	if len(fields) < 22 {
		return 0
	}

	// Field 22 is start time in clock ticks
	startTicks, err := strconv.ParseInt(fields[21], 10, 64)
	if err != nil {
		return 0
	}

	// Get system boot time
	uptimeData, err := os.ReadFile("/proc/uptime")
	if err != nil {
		return 0
	}

	var systemUptime float64
	fmt.Sscanf(string(uptimeData), "%f", &systemUptime)

	// Convert to actual time (approximation)
	clockTick := 100.0 // Usually 100 Hz on Linux
	processStartTime := float64(startTicks) / clockTick
	processUptime := systemUptime - processStartTime

	if processUptime > 0 {
		return time.Duration(processUptime) * time.Second
	}

	return 0
}

// ShowLogTail shows last n lines of log file
func (d *DaemonManager) ShowLogTail(lines int) {
	file, err := os.Open(d.LogFile)
	if err != nil {
		fmt.Printf("No log file available: %v\n", err)
		return
	}
	defer file.Close()

	// Simple tail implementation (not efficient for large files)
	content, err := io.ReadAll(file)
	if err != nil {
		fmt.Printf("Error reading log: %v\n", err)
		return
	}

	allLines := strings.Split(string(content), "\n")
	start := len(allLines) - lines - 1
	if start < 0 {
		start = 0
	}

	for i := start; i < len(allLines)-1; i++ {
		if allLines[i] != "" {
			fmt.Printf("  %s\n", allLines[i])
		}
	}
}

// writePidFile writes the PID to the PID file
func (d *DaemonManager) writePidFile(pid int) error {
	return os.WriteFile(d.PidFile, []byte(fmt.Sprintf("%d\n", pid)), 0644)
}

// removePidFile removes the PID file
func (d *DaemonManager) removePidFile() {
	os.Remove(d.PidFile)
}

// formatDuration formats duration for display
func formatDuration(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%.0fs", d.Seconds())
	} else if d < time.Hour {
		return fmt.Sprintf("%.0fm", d.Minutes())
	} else if d < 24*time.Hour {
		hours := int(d.Hours())
		minutes := int(d.Minutes()) % 60
		return fmt.Sprintf("%dh %dm", hours, minutes)
	} else {
		days := int(d.Hours()) / 24
		hours := int(d.Hours()) % 24
		return fmt.Sprintf("%dd %dh", days, hours)
	}
}
