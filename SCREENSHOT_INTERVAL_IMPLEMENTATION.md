# Screenshot Interval Configuration Implementation

## 🎯 Feature Summary

This implementation adds configurable screenshot intervals to Compass, allowing users to control how often screenshots are taken independently from the workspace capture interval.

### Problem Solved

Previously, screenshots were tightly coupled with workspace capture - every time the system captured workspace state (every 10s by default), it would also take a screenshot if enabled. This could result in:

- Excessive screenshot frequency (every 10 seconds)
- Large storage usage due to frequent screenshots
- Performance impact from continuous screenshot capture

### Solution

Added a separate `screenshot_interval` configuration that allows users to:

- Capture workspace state frequently (e.g., every 10s) for detailed activity tracking
- Take screenshots less frequently (e.g., every 60s) to reduce storage and performance impact
- Maintain real-time activity monitoring while having appropriate visual documentation

## 📁 Files Modified

### 1. `pkg/types/types.go`

**Changes:** Added `ScreenshotInterval` field to `TrackingConfig` struct

```go
type TrackingConfig struct {
    Interval           time.Duration `json:"interval" yaml:"interval"`
    ScreenshotInterval time.Duration `json:"screenshot_interval" yaml:"screenshot_interval"`
    CaptureScreenshots bool          `json:"capture_screenshots" yaml:"capture_screenshots"`
    TrackAllWindows    bool          `json:"track_all_windows" yaml:"track_all_windows"`
}
```

### 2. `internal/config/config.go`

**Changes:**

- Added `DefaultScreenshotInterval` constant (60 seconds)
- Updated `DefaultConfig()` to include screenshot interval
- Added validation for screenshot interval in `ValidateConfig()`

### 3. `internal/capture/engine.go`

**Changes:**

- Added `lastScreenshot` field to `CaptureEngine` struct to track screenshot timing
- Modified screenshot logic in `captureWorkspaceSnapshot()` to use separate interval
- Updated `Start()` method to initialize screenshot timing

### 4. `config.yaml.example`

**Changes:** Added `screenshot_interval` setting with documentation

### 5. `README.md`

**Changes:** Updated configuration documentation to include the new option

## 🔧 Configuration Usage

### Basic Configuration

```yaml
tracking:
  interval: 10s # Capture workspace state every 10 seconds
  screenshot_interval: 60s # Take screenshots every 60 seconds
  capture_screenshots: true # Enable screenshot capture
  track_all_windows: true # Track all windows
```

### Use Case Examples

#### High-Frequency Monitoring with Reasonable Screenshots

```yaml
tracking:
  interval: 5s # Very detailed activity tracking
  screenshot_interval: 120s # Screenshots every 2 minutes
  capture_screenshots: true
```

#### Battery-Optimized Configuration

```yaml
tracking:
  interval: 30s # Less frequent workspace capture
  screenshot_interval: 300s # Screenshots every 5 minutes
  capture_screenshots: true
```

#### Screenshots Disabled

```yaml
tracking:
  interval: 10s
  screenshot_interval: 60s # Will be ignored when capture_screenshots is false
  capture_screenshots: false
```

## 🧪 Testing

### Build Test

```bash
make build
# ✅ Built: ./compass
```

### Configuration Validation Test

The implementation includes validation to ensure:

- Screenshot interval ≥ 1 second
- Configuration loads correctly
- Default values are applied when not specified

### Behavioral Test

1. **Frequent Workspace Capture + Infrequent Screenshots**

   - `interval: 10s`, `screenshot_interval: 60s`
   - Workspace state captured every 10 seconds
   - Screenshots taken every 60 seconds (every 6th capture)

2. **Equal Intervals**

   - `interval: 30s`, `screenshot_interval: 30s`
   - Both workspace and screenshots captured every 30 seconds

3. **Screenshot Faster Than Workspace** (Edge Case)
   - `interval: 60s`, `screenshot_interval: 30s`
   - Screenshots will be taken at most every 60 seconds (limited by workspace capture frequency)

## 🎯 Benefits

1. **Storage Efficiency**: Reduce screenshot storage by taking them less frequently
2. **Performance Optimization**: Less screenshot overhead while maintaining detailed activity tracking
3. **Flexibility**: Users can customize based on their needs and system capabilities
4. **Backward Compatibility**: Existing configurations continue to work with sensible defaults

## 🔮 Future Enhancements

Potential improvements that could build on this foundation:

- **Adaptive Screenshot Intervals**: Automatically adjust based on activity level
- **Context-Aware Screenshots**: Take screenshots more frequently during certain activities
- **Screenshot Quality Settings**: Configure compression/quality based on interval
- **Smart Screenshot Triggers**: Take screenshots on significant context switches regardless of interval

## 📋 Implementation Notes

- Screenshots are only taken when workspace capture occurs, so `screenshot_interval` cannot be shorter than `interval`
- The first screenshot is taken immediately if screenshots are enabled
- Screenshot timing resets when the capture engine starts
- All existing privacy and blurring features continue to work with the new interval system
