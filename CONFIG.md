# 🔧 Compass Configuration Guide

This document provides comprehensive configuration options for Compass workspace tracker.

## 📍 **Configuration File Location**

**⚠️ CRITICAL**: Compass loads configuration from the system config directory:

```bash
# ✅ CORRECT: Configuration file location
~/.config/compass/config.yaml

# ❌ WRONG: These are examples only
./config.yaml
./config.yaml.example
```

## 🚀 **Quick Setup**

### **First Time Setup**

```bash
# 1. Create config directory
mkdir -p ~/.config/compass

# 2. Copy example config
cp config.yaml.example ~/.config/compass/config.yaml

# 3. Edit the config
nano ~/.config/compass/config.yaml

# 4. Start Compass
./compass start
```

### **Editing Configuration**

```bash
# Method 1: Direct edit
code ~/.config/compass/config.yaml

# Method 2: From project directory
cp config.yaml.example ~/.config/compass/config.yaml
nano ~/.config/compass/config.yaml
```

## 📋 **Complete Configuration Reference**

### **Tracking Configuration**

```yaml
tracking:
  interval: 10s # How often to capture workspace state
  screenshot_interval: 60s # How often to take screenshots
  capture_screenshots: true # Enable/disable screenshot capture
  track_all_windows: true # Track background windows too
```

#### **Interval Settings**

| Setting               | Description                  | Default | Valid Values | Example Use Cases                               |
| --------------------- | ---------------------------- | ------- | ------------ | ----------------------------------------------- |
| `interval`            | Workspace capture frequency  | `10s`   | `1s` - `1h`  | Real-time tracking: `5s`, Battery saving: `30s` |
| `screenshot_interval` | Screenshot capture frequency | `60s`   | `1s` - `24h` | Frequent: `30s`, Storage saving: `300s`         |

#### **Screenshot Configuration Examples**

```yaml
# High-frequency monitoring with reasonable screenshots
tracking:
  interval: 10s                    # Detailed workspace tracking
  screenshot_interval: 300s        # Screenshots every 5 minutes
  capture_screenshots: true

# Battery-optimized configuration
tracking:
  interval: 30s                    # Less frequent capture
  screenshot_interval: 600s        # Screenshots every 10 minutes
  capture_screenshots: true

# Real-time tracking with minimal screenshots
tracking:
  interval: 5s                     # Very frequent workspace capture
  screenshot_interval: 180s        # Screenshots every 3 minutes
  capture_screenshots: true

# Disable screenshots entirely
tracking:
  interval: 10s
  screenshot_interval: 60s         # Ignored when capture_screenshots is false
  capture_screenshots: false
```

### **Privacy Configuration**

```yaml
privacy:
  exclude_apps: # Applications to never track
    - "1Password"
    - "Bitwarden"
    - "Banking"
    - "Wallet"
    - "Password"
    - "Keychain Access"
    - "VPN Client"
    - "Private Browser"

  exclude_titles: # Window titles to filter out
    - "incognito"
    - "private"
    - "password"
    - "secure"
    - "login"
    - "bank"
    - "credit card"

  blur_sensitive: true # Blur sensitive content in screenshots
  auto_delete_after: 30 # Days after which to auto-delete data
```

#### **Privacy Best Practices**

```yaml
# Comprehensive privacy setup
privacy:
  exclude_apps:
    # Password Managers
    - "1Password"
    - "Bitwarden"
    - "LastPass"
    - "Keychain Access"

    # Financial Apps
    - "Banking"
    - "PayPal"
    - "Venmo"
    - "Credit Karma"

    # Communication (optional)
    - "Signal"
    - "WhatsApp"
    - "Telegram"

    # VPN & Security
    - "NordVPN"
    - "ExpressVPN"
    - "VPN Client"

  exclude_titles:
    # Authentication
    - "login"
    - "password"
    - "authentication"
    - "signin"
    - "sign in"

    # Financial
    - "bank"
    - "credit"
    - "payment"
    - "billing"

    # Privacy Modes
    - "incognito"
    - "private"
    - "secure"
    - "confidential"

  blur_sensitive: true
  auto_delete_after: 30
```

### **Server Configuration**

```yaml
server:
  port: "8080" # Web dashboard port
  host: "localhost" # Web dashboard host (change with caution)
```

#### **Server Options**

| Setting | Description            | Default       | Valid Values               | Notes                            |
| ------- | ---------------------- | ------------- | -------------------------- | -------------------------------- |
| `port`  | Dashboard web port     | `"8080"`      | `"1024"` - `"65535"`       | Use quotes for port numbers      |
| `host`  | Dashboard bind address | `"localhost"` | `"localhost"`, `"0.0.0.0"` | `0.0.0.0` allows external access |

**⚠️ Security Warning**: Only use `host: "0.0.0.0"` if you need external access and understand the security implications.

### **Storage Configuration**

```yaml
storage:
  path: "~/.compass/compass.db" # Database file location
  max_size: "1GB" # Maximum database size
```

#### **Storage Options**

| Setting    | Description        | Default                   | Valid Values        | Examples                     |
| ---------- | ------------------ | ------------------------- | ------------------- | ---------------------------- |
| `path`     | Database file path | `"~/.compass/compass.db"` | Any valid file path | `"/custom/path/db.sqlite"`   |
| `max_size` | Maximum DB size    | `"1GB"`                   | Size with units     | `"500MB"`, `"2GB"`, `"10GB"` |

### **AI Configuration (Future)**

```yaml
ai: # Optional AI features
  enabled: false # Enable AI-powered insights
  provider: "ollama" # AI provider (ollama, openai, etc.)
  model: "llama2" # Model to use
```

## 🎯 **Configuration Scenarios**

### **Developer Setup**

```yaml
# High-detail tracking for development workflow analysis
tracking:
  interval: 5s # Capture frequent context switches
  screenshot_interval: 120s # Screenshots every 2 minutes
  capture_screenshots: true
  track_all_windows: true

privacy:
  exclude_apps:
    - "1Password"
    - "Keychain Access"
  exclude_titles:
    - "password"
    - "login"
    - "secure"
  blur_sensitive: true
  auto_delete_after: 7 # Keep data for 1 week

server:
  port: "8080"
  host: "localhost"

storage:
  path: "~/.compass/compass.db"
  max_size: "2GB"
```

### **Privacy-Focused Setup**

```yaml
# Maximum privacy with minimal data collection
tracking:
  interval: 30s # Less frequent capture
  screenshot_interval: 600s # Screenshots every 10 minutes
  capture_screenshots: false # No screenshots
  track_all_windows: false # Only active window

privacy:
  exclude_apps:
    - "1Password"
    - "Bitwarden"
    - "Banking"
    - "Wallet"
    - "Signal"
    - "WhatsApp"
    - "VPN Client"
    - "Private Browser"
  exclude_titles:
    - "incognito"
    - "private"
    - "password"
    - "secure"
    - "login"
    - "bank"
    - "payment"
    - "personal"
  blur_sensitive: true
  auto_delete_after: 3 # Delete data after 3 days

server:
  port: "8080"
  host: "localhost"

storage:
  path: "~/.compass/compass.db"
  max_size: "500MB"
```

### **Performance-Optimized Setup**

```yaml
# Minimal system impact for resource-constrained systems
tracking:
  interval: 20s # Balanced capture frequency
  screenshot_interval: 300s # Screenshots every 5 minutes
  capture_screenshots: true
  track_all_windows: true

privacy:
  exclude_apps:
    - "1Password"
    - "Banking"
  exclude_titles:
    - "password"
    - "login"
  blur_sensitive: false # Disable processing to save CPU
  auto_delete_after: 14

server:
  port: "8080"
  host: "localhost"

storage:
  path: "~/.compass/compass.db"
  max_size: "1GB"
```

## 🔄 **Configuration Management**

### **Applying Changes**

1. **Edit configuration file**:

   ```bash
   nano ~/.config/compass/config.yaml
   ```

2. **Stop Compass** (if running):

   ```bash
   # Press Ctrl+C in terminal or:
   compass stop
   ```

3. **Restart Compass**:

   ```bash
   compass start
   ```

4. **Verify changes**:
   ```bash
   # Check startup logs for confirmation
   [2024-08-22 21:50:44] Starting capture engine with 10s interval
   [2024-08-22 21:50:44] Screenshot interval: 300s (5 minutes)
   ```

### **Configuration Validation**

Compass validates configuration on startup:

```bash
# Valid configuration example:
[2024-08-22 21:50:44] Configuration loaded successfully
[2024-08-22 21:50:44] Starting capture engine...

# Invalid configuration example:
[2024-08-22 21:50:44] ERROR: tracking interval must be at least 1 second
[2024-08-22 21:50:44] Failed to start
```

### **Common Validation Errors**

| Error                                           | Cause                       | Solution                                 |
| ----------------------------------------------- | --------------------------- | ---------------------------------------- |
| `tracking interval must be at least 1 second`   | Invalid interval format     | Use valid time format: `10s`, `1m`, `1h` |
| `screenshot interval must be at least 1 second` | Invalid screenshot interval | Use valid time format: `60s`, `5m`, `1h` |
| `server port cannot be empty`                   | Missing port configuration  | Add `port: "8080"` to server section     |
| `storage path cannot be empty`                  | Missing storage path        | Add valid file path to storage section   |

## 🛠️ **Troubleshooting**

### **Configuration Not Loading**

1. **Check file location**:

   ```bash
   ls -la ~/.config/compass/config.yaml
   ```

2. **Verify file format**:

   ```bash
   # Test YAML syntax
   python3 -c "import yaml; yaml.safe_load(open('~/.config/compass/config.yaml'))"
   ```

3. **Check permissions**:
   ```bash
   chmod 644 ~/.config/compass/config.yaml
   ```

### **Performance Issues**

1. **Increase intervals**:

   ```yaml
   tracking:
     interval: 30s # Instead of 5s or 10s
     screenshot_interval: 600s # Instead of 60s
   ```

2. **Disable screenshots temporarily**:

   ```yaml
   tracking:
     capture_screenshots: false
   ```

3. **Reduce data retention**:
   ```yaml
   privacy:
     auto_delete_after: 7 # Instead of 30 days
   ```

### **Privacy Concerns**

1. **Audit excluded apps**:

   ```bash
   # Check what's being tracked
   grep -A 10 "exclude_apps" ~/.config/compass/config.yaml
   ```

2. **Test privacy filters**:

   ```bash
   # Start Compass and check logs for filtered items
   ./compass start
   ```

3. **Verify screenshot blurring**:
   ```yaml
   privacy:
     blur_sensitive: true # Should be enabled
   ```

## 📚 **Additional Resources**

- **[README.md](README.md)**: General project overview and quick start
- **[CONTRIBUTING.md](CONTRIBUTING.md)**: Development and contribution guidelines
- **[CHANGELOG.md](CHANGELOG.md)**: Version history and feature updates

## 🆘 **Support**

If you encounter configuration issues:

1. **Check logs**: Look for error messages in the terminal output
2. **Validate YAML**: Ensure your config file has valid YAML syntax
3. **Reset to defaults**: Copy `config.yaml.example` to start fresh
4. **Report issues**: [Create an issue](https://github.com/faisalahmedsifat/compass/issues) with your configuration details

---

**🧭 Compass Configuration Guide - Keep your workspace tracking exactly how you want it.**
