package config

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/faisalahmedsifat/compass/pkg/types"
	"github.com/spf13/viper"
	"gopkg.in/yaml.v3"
)

// Default configuration values
const (
	DefaultInterval           = 10 * time.Second
	DefaultPort              = "8080"
	DefaultHost              = "localhost"
	DefaultAutoDeleteDays    = 30
	DefaultMaxSize           = "1GB"
)

// Load loads configuration from file, environment, and defaults
func Load() (*types.Config, error) {
	config := DefaultConfig()

	// Set up viper
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(getConfigDir())
	viper.AddConfigPath(".")

	// Set environment variable prefix
	viper.SetEnvPrefix("COMPASS")
	viper.AutomaticEnv()

	// Try to read config file
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
		// Config file not found is OK, we'll use defaults
	}

	// Unmarshal into struct
	if err := viper.Unmarshal(config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	// Validate configuration
	if err := ValidateConfig(config); err != nil {
		return nil, fmt.Errorf("invalid configuration: %w", err)
	}

	return config, nil
}

// DefaultConfig returns a configuration with sensible defaults
func DefaultConfig() *types.Config {
	return &types.Config{
		Tracking: &types.TrackingConfig{
			Interval:           DefaultInterval,
			CaptureScreenshots: true,
			TrackAllWindows:    true,
		},
		Privacy: &types.PrivacyConfig{
			ExcludeApps: []string{
				"1Password",
				"Bitwarden", 
				"Banking",
				"Wallet",
				"Password",
			},
			ExcludeTitles: []string{
				"incognito",
				"private",
				"password",
				"secure",
			},
			BlurSensitive:  true,
			AutoDeleteDays: DefaultAutoDeleteDays,
		},
		Server: &types.ServerConfig{
			Port: DefaultPort,
			Host: DefaultHost,
		},
		Storage: &types.StorageConfig{
			Path:    getDefaultDatabasePath(),
			MaxSize: DefaultMaxSize,
		},
		AI: &types.AIConfig{
			Enabled:  false,
			Provider: "ollama",
			Model:    "llama2",
		},
	}
}

// Save saves the configuration to file
func Save(config *types.Config) error {
	configPath := filepath.Join(getConfigDir(), "config.yaml")
	
	// Ensure config directory exists
	if err := os.MkdirAll(getConfigDir(), 0755); err != nil {
		return fmt.Errorf("failed to create config directory: %w", err)
	}
	
	// Marshal to YAML
	data, err := yaml.Marshal(config)
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}
	
	// Write to file
	if err := os.WriteFile(configPath, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}
	
	return nil
}

// ValidateConfig validates the configuration
func ValidateConfig(config *types.Config) error {
	if config.Tracking.Interval < time.Second {
		return fmt.Errorf("tracking interval must be at least 1 second")
	}
	
	if config.Privacy.AutoDeleteDays < 1 {
		return fmt.Errorf("auto delete days must be at least 1")
	}
	
	if config.Server.Port == "" {
		return fmt.Errorf("server port cannot be empty")
	}
	
	if config.Storage.Path == "" {
		return fmt.Errorf("storage path cannot be empty")
	}
	
	return nil
}

// getConfigDir returns the configuration directory path
func getConfigDir() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return ".compass"
	}
	return filepath.Join(homeDir, ".config", "compass")
}

// getDefaultDatabasePath returns the default database file path
func getDefaultDatabasePath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "./compass.db"
	}
	compassDir := filepath.Join(homeDir, ".compass")
	return filepath.Join(compassDir, "compass.db")
}

// EnsureDatabaseDir ensures the database directory exists
func EnsureDatabaseDir(dbPath string) error {
	dir := filepath.Dir(dbPath)
	return os.MkdirAll(dir, 0755)
}

// GetConfigPath returns the path to the config file
func GetConfigPath() string {
	return filepath.Join(getConfigDir(), "config.yaml")
}

// CreateDefaultConfigFile creates a default config file if it doesn't exist
func CreateDefaultConfigFile() error {
	configPath := GetConfigPath()
	
	// Check if config file already exists
	if _, err := os.Stat(configPath); err == nil {
		return nil // File already exists
	}
	
	// Create default config
	config := DefaultConfig()
	return Save(config)
}

