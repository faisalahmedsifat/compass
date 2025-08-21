package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"syscall"
	"time"

	"github.com/faisalahmedsifat/compass/internal/capture"
	"github.com/faisalahmedsifat/compass/internal/config"
	"github.com/faisalahmedsifat/compass/internal/processor"
	"github.com/faisalahmedsifat/compass/internal/server"
	"github.com/faisalahmedsifat/compass/internal/storage"
	"github.com/faisalahmedsifat/compass/pkg/types"
	"github.com/spf13/cobra"
)

var (
	Version = "0.1.0"
	cfgFile string
	daemon  bool
)

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

// rootCmd represents the base command
var rootCmd = &cobra.Command{
	Use:   "compass",
	Short: "🧭 Compass - Complete workspace tracker",
	Long: `Compass is a lightweight CLI tool that tracks your complete digital workspace.
	
It captures all open windows, categorizes your activities, and provides insights
through a local web dashboard at http://localhost:8080.

Examples:
  compass start              # Start tracking (foreground)
  compass start --daemon     # Start tracking (background)
  compass stop               # Stop tracking
  compass stats              # View quick stats
  compass dashboard          # Open dashboard in browser`,
	Version: Version,
}

// startCmd starts the tracking system
var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start workspace tracking",
	Long:  "Start tracking your workspace. Use --daemon to run in background.",
	RunE: func(cmd *cobra.Command, args []string) error {
		return runTracker()
	},
}

// stopCmd stops the tracking system
var stopCmd = &cobra.Command{
	Use:   "stop",
	Short: "Stop workspace tracking",
	Long:  "Stop the background tracking process.",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("🧭 Compass tracking stopped")
		// TODO: Implement daemon process management
		return nil
	},
}

// statsCmd shows quick stats
var statsCmd = &cobra.Command{
	Use:   "stats",
	Short: "Show quick statistics",
	Long:  "Display a summary of today's workspace activity.",
	RunE: func(cmd *cobra.Command, args []string) error {
		return showStats()
	},
}

// dashboardCmd opens the dashboard
var dashboardCmd = &cobra.Command{
	Use:   "dashboard",
	Short: "Open dashboard in browser",
	Long:  "Open the Compass dashboard in your default web browser.",
	RunE: func(cmd *cobra.Command, args []string) error {
		return openDashboard()
	},
}

// exportCmd exports data
var exportCmd = &cobra.Command{
	Use:   "export",
	Short: "Export workspace data",
	Long:  "Export your workspace data to JSON or CSV format.",
	RunE: func(cmd *cobra.Command, args []string) error {
		return exportData()
	},
}

// statusCmd shows system status
var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show system status",
	Long:  "Display current system status and configuration.",
	RunE: func(cmd *cobra.Command, args []string) error {
		return showStatus()
	},
}

func init() {
	cobra.OnInitialize(initConfig)

	// Global flags
	rootCmd.PersistentFlags().StringVar(&cfgFile, "config", "", "config file (default is ~/.config/compass/config.yaml)")

	// Start command flags
	startCmd.Flags().BoolVar(&daemon, "daemon", false, "run in background")

	// Add subcommands
	rootCmd.AddCommand(startCmd)
	rootCmd.AddCommand(stopCmd)
	rootCmd.AddCommand(statsCmd)
	rootCmd.AddCommand(dashboardCmd)
	rootCmd.AddCommand(exportCmd)
	rootCmd.AddCommand(statusCmd)
}

// initConfig reads in config file and ENV variables
func initConfig() {
	// Create default config if it doesn't exist
	if err := config.CreateDefaultConfigFile(); err != nil {
		log.Printf("Warning: Could not create default config: %v", err)
	}
}

// runTracker starts the main tracking system
func runTracker() error {
	fmt.Println("🧭 Compass v" + Version + " - Workspace Tracker")
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load configuration: %w", err)
	}

	// Ensure database directory exists
	if err := config.EnsureDatabaseDir(cfg.Storage.Path); err != nil {
		return fmt.Errorf("failed to create database directory: %w", err)
	}

	// Initialize database
	db, err := storage.NewDatabase(cfg.Storage.Path)
	if err != nil {
		return fmt.Errorf("failed to initialize database: %w", err)
	}
	defer db.Close()

	// Create categorizer
	categorizer := processor.NewRuleBasedCategorizer()

	// Create activity channel for real-time updates
	activityChan := make(chan *types.Activity, 100)

	// Create and start web server
	webServer := server.NewServer(cfg.Server, db, activityChan)
	
	// Create capture engine
	captureEngine := capture.NewCaptureEngine(cfg, db, categorizer, activityChan)

	// Setup context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle interrupt signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// Start components
	go func() {
		if err := webServer.Start(ctx); err != nil {
			log.Printf("Web server error: %v", err)
		}
	}()

	go func() {
		if err := captureEngine.Start(ctx); err != nil {
			log.Printf("Capture engine error: %v", err)
		}
	}()

	// Print startup information
	time.Sleep(100 * time.Millisecond) // Brief delay for clean output
	fmt.Printf("[%s] Started tracking\n", time.Now().Format("2006-01-02 15:04:05"))
	fmt.Printf("[%s] Dashboard: http://%s:%s\n", time.Now().Format("2006-01-02 15:04:05"), cfg.Server.Host, cfg.Server.Port)
	fmt.Printf("[%s] Capturing every %v\n", time.Now().Format("2006-01-02 15:04:05"), cfg.Tracking.Interval)
	
	if daemon {
		fmt.Println("Running in daemon mode. Use 'compass stop' to stop.")
		// TODO: Implement proper daemon process management
	} else {
		fmt.Println("Press Ctrl+C to stop tracking")
	}

	// Wait for shutdown signal
	<-sigChan
	fmt.Println("\n🧭 Shutting down Compass...")
	
	// Graceful shutdown
	cancel()
	time.Sleep(500 * time.Millisecond) // Allow components to shut down

	fmt.Println("🧭 Compass stopped")
	return nil
}

// showStats displays quick statistics in the terminal
func showStats() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load configuration: %w", err)
	}

	db, err := storage.NewDatabase(cfg.Storage.Path)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}
	defer db.Close()

	stats, err := db.GetStats("day", time.Now())
	if err != nil {
		return fmt.Errorf("failed to get stats: %w", err)
	}

	fmt.Printf("🧭 Compass Stats - %s\n", time.Now().Format("January 2, 2006"))
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	
	fmt.Printf("Total Active Time: %s\n", formatDurationForDisplay(stats.TotalTime))
	fmt.Printf("Context Switches: %d\n", stats.ContextSwitches)
	fmt.Printf("Longest Focus: %s\n", formatDurationForDisplay(stats.LongestFocus))
	
	if len(stats.ByCategory) > 0 {
		fmt.Println("\nTop Categories:")
		for category, duration := range stats.ByCategory {
			fmt.Printf("  %-15s %s\n", category, formatDurationForDisplay(duration))
		}
	}

	if len(stats.ByApp) > 0 {
		fmt.Println("\nTop Applications:")
		count := 0
		for app, duration := range stats.ByApp {
			if count >= 5 { break }
			fmt.Printf("  %-20s %s\n", app, formatDurationForDisplay(duration))
			count++
		}
	}

	// Show recent window details
	fmt.Println("\nRecent Windows:")
	activities, err := getRecentActivitiesForStats()
	if err == nil && len(activities) > 0 {
		seen := make(map[string]bool)
		count := 0
		for _, activity := range activities {
			key := activity.AppName + "|" + activity.WindowTitle
			if !seen[key] && count < 8 {
				fmt.Printf("  %-20s %s\n", activity.AppName, truncateTitle(activity.WindowTitle, 50))
				seen[key] = true
				count++
			}
		}
	}

	return nil
}

// openDashboard opens the dashboard in the default browser
func openDashboard() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load configuration: %w", err)
	}

	url := fmt.Sprintf("http://%s:%s", cfg.Server.Host, cfg.Server.Port)
	fmt.Printf("Opening dashboard at %s\n", url)

	// Try to open in browser (macOS)
	return exec.Command("open", url).Start()
}

// exportData exports workspace data
func exportData() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load configuration: %w", err)
	}

	url := fmt.Sprintf("http://%s:%s/api/export?format=json", cfg.Server.Host, cfg.Server.Port)
	fmt.Printf("Export available at: %s\n", url)
	fmt.Println("Or visit the dashboard and use the export feature.")

	return nil
}

// showStatus shows the current system status
func showStatus() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("failed to load configuration: %w", err)
	}

	fmt.Printf("🧭 Compass v%s Status\n", Version)
	fmt.Println("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	
	fmt.Printf("Configuration: %s\n", config.GetConfigPath())
	fmt.Printf("Database: %s\n", cfg.Storage.Path)
	fmt.Printf("Dashboard: http://%s:%s\n", cfg.Server.Host, cfg.Server.Port)
	fmt.Printf("Tracking interval: %v\n", cfg.Tracking.Interval)
	fmt.Printf("Screenshots: %v\n", cfg.Tracking.CaptureScreenshots)
	
	// Check if database exists and get stats
	if db, err := storage.NewDatabase(cfg.Storage.Path); err == nil {
		defer db.Close()
		if dbStats, err := db.GetDatabaseStats(); err == nil {
			fmt.Printf("Total activities: %v\n", dbStats["total_activities"])
			if first, ok := dbStats["first_activity"]; ok {
				fmt.Printf("First activity: %v\n", first)
			}
		}
	} else {
		fmt.Println("Database: Not initialized")
	}

	return nil
}

// formatDurationForDisplay formats duration for terminal display
func formatDurationForDisplay(d time.Duration) string {
	if d == 0 {
		return "0s"
	}
	
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60

	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	} else if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	} else {
		return fmt.Sprintf("%ds", seconds)
	}
}

// getRecentActivitiesForStats gets recent activities for stats display
func getRecentActivitiesForStats() ([]*types.Activity, error) {
	cfg, err := config.Load()
	if err != nil {
		return nil, err
	}

	db, err := storage.NewDatabase(cfg.Storage.Path)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	to := time.Now()
	from := to.Add(-2 * time.Hour) // Last 2 hours
	return db.GetActivities(from, to, 20)
}

// truncateTitle truncates window titles for display
func truncateTitle(title string, maxLen int) string {
	if len(title) <= maxLen {
		return title
	}
	return title[:maxLen-3] + "..."
}
