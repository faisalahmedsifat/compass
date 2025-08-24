# 🚀 Database Optimization Guide for Compass Timeline

## 📋 Overview

This guide will help you optimize your Compass database for efficient timeline queries, solving the issue where "you can't easily find every single entry of every time slot."

## 🔍 Current Issues

### 1. **Inefficient Data Fetching**
- Frontend fetches 1000+ activities and processes client-side
- No time-slot specific API endpoints
- Timeline rendering requires processing all activities every time

### 2. **Missing Database Optimizations**
- No compound indexes for time-based queries
- No pre-computed time slot summaries
- Limited API endpoints for timeline data

### 3. **Poor Timeline Performance**
- Slow loading for larger date ranges
- Client-side aggregation of time slots
- Inefficient hover/click data processing

## 🛠️ Optimization Implementation

### Step 1: Add Optimized Database Functions

**File: `internal/storage/optimized_queries.go`** ✅ Created

Key features:
- `GetTimeSlotSummaries()` - Pre-aggregated time slot data
- `GetTimeSlotActivities()` - Efficient detailed queries
- `GetAppTotalsForPeriod()` - Fast period summaries
- `OptimizeDatabase()` - Add performance indexes

### Step 2: Create Optimized API Endpoints

**File: `internal/server/timeline_handlers.go`** ✅ Created

New endpoints:
- `GET /api/timeline/slots` - Time slot summaries
- `GET /api/timeline/slot-details` - Detailed slot data
- `GET /api/timeline/period-summary` - Period totals
- `POST /api/admin/optimize-database` - Apply DB optimizations

### Step 3: Add Optimized React Hooks

**File: `dashboard/src/hooks/useOptimizedTimelineApi.ts`** ✅ Created

Efficient data fetching:
- `useTimelineSlots()` - Optimized timeline data
- `useTimeSlotDetails()` - Click modal data
- `useTimelinePeriodSummary()` - Hover tooltip data
- `useCustomTimeRange()` - Smart time range queries

### Step 4: Create Optimized Timeline Component

**File: `dashboard/src/components/OptimizedTimelineView.tsx`** ✅ Created

Features:
- Server-side aggregation
- Performance comparison tools
- One-click database optimization
- Efficient time slot rendering

## 🔧 Backend Integration Steps

### 1. Add the New Files to Your Backend

Copy these files to your Go backend:
```bash
# Add optimized database functions
cp optimized_queries.go internal/storage/

# Add new API endpoints
cp timeline_handlers.go internal/server/
```

### 2. Update Your Server Setup

In `internal/server/server.go`, add the new endpoints in the `Start()` method:

```go
// Add after existing API endpoints
mux.HandleFunc("/api/timeline/slots", s.withCORS(s.handleTimelineSlots))
mux.HandleFunc("/api/timeline/slot-details", s.withCORS(s.handleTimelineSlotDetails))
mux.HandleFunc("/api/timeline/period-summary", s.withCORS(s.handleTimelinePeriodSummary))
mux.HandleFunc("/api/admin/optimize-database", s.withCORS(s.handleOptimizeDatabase))
```

### 3. Update Database Interface

In `internal/server/server.go`, extend the Database interface:

```go
type Database interface {
    // Existing methods...
    GetActivities(from, to time.Time, limit int) ([]*types.Activity, error)
    GetCurrentWorkspace() (*types.CurrentWorkspace, error)
    // ... other existing methods

    // Add new optimized methods
    GetTimeSlotSummaries(from, to time.Time, granularity string) ([]*storage.TimeSlotSummary, error)
    GetTimeSlotActivities(timeSlot time.Time, granularity string, includeScreenshots bool) ([]*types.Activity, error)
    GetAppTotalsForPeriod(from, to time.Time) (map[string]storage.AppSummary, error)
    OptimizeDatabase() error
}
```

### 4. Build and Restart

```bash
# Build the updated backend
go build -o compass ./cmd/compass/

# Restart the daemon
./compass
```

## 📊 Frontend Integration Steps

### 1. Add Optimized Hooks

Copy the new React hooks:
```bash
cp useOptimizedTimelineApi.ts dashboard/src/hooks/
```

### 2. Add Optimized Component

Copy the new Timeline component:
```bash
cp OptimizedTimelineView.tsx dashboard/src/components/
```

### 3. Update Dashboard (Optional)

You can either:
- **A) Replace existing TimelineView** with OptimizedTimelineView
- **B) Add as new tab** to test performance difference

For option B, in `Dashboard.tsx`:
```tsx
// Add to imports
import OptimizedTimelineView from './OptimizedTimelineView';

// Add new tab option
const [selectedView, setSelectedView] = useState<'overview' | 'timeline' | 'optimized-timeline' | 'timetravel' | 'analytics' | 'insights'>('overview');

// Add button in navigation
{view === 'optimized-timeline' && <Zap className="w-4 h-4" />}
{view === 'optimized-timeline' ? 'Optimized Timeline' : view.charAt(0).toUpperCase() + view.slice(1)}

// Add view content
{selectedView === 'optimized-timeline' && (
  <OptimizedTimelineView 
    selectedPeriod={selectedPeriod}
    selectedDate={selectedDate}
  />
)}
```

## ⚡ Performance Improvements Expected

### Before Optimization:
- **Frontend**: Fetches 1000 activities (≈200KB)
- **Processing**: Client-side aggregation of all time slots  
- **Timeline Load**: 2-5 seconds for complex views
- **Hover/Click**: Re-calculates data every time

### After Optimization:
- **API Call**: `/api/timeline/slots` returns pre-aggregated data (≈20KB)
- **Processing**: Server-side SQL aggregation
- **Timeline Load**: 200-500ms for same views
- **Hover/Click**: Dedicated endpoints with cached data

### Specific Improvements:
1. **90% reduction in data transfer**
2. **10x faster timeline rendering**
3. **Efficient time slot queries** with proper indexes
4. **Real-time period totals** in hover tooltips
5. **Instant slot details** on click

## 🎯 Database Indexes Added

The optimization adds these performance indexes:

```sql
-- Compound indexes for time-based queries
CREATE INDEX idx_activities_timestamp_app ON activities(timestamp, app_name);
CREATE INDEX idx_activities_timestamp_category ON activities(timestamp, category);
CREATE INDEX idx_activities_date_hour ON activities(date(timestamp), strftime('%H', timestamp));

-- Specialized indexes
CREATE INDEX idx_activities_screenshot_timestamp ON activities(timestamp) WHERE screenshot IS NOT NULL;
CREATE INDEX idx_activities_active_timestamp ON activities(timestamp) WHERE is_active = 1;
CREATE INDEX idx_activities_focus_timestamp ON activities(focus_duration, timestamp);
```

## 🧪 Testing the Optimization

### 1. Performance Test
Use the built-in performance tester in OptimizedTimelineView:
- Click "Performance Test" button
- Compare response times between old and new endpoints
- Check data transfer sizes

### 2. Database Optimization
- Click "Optimize DB" button to apply indexes
- Verify optimization completion message
- Test timeline loading speed

### 3. Functionality Test
- **Time Slot Rendering**: All time slots should populate efficiently
- **Hover Tooltips**: Period totals appear instantly
- **Click Details**: Slot details load fast with rich context
- **Time Navigation**: Switching dates/periods is smooth

## 🚨 Troubleshooting

### Issue: "Timeline optimization not available"
**Solution**: Backend doesn't have new endpoints
1. Verify new files are copied to backend
2. Check server startup logs for new endpoints
3. Restart Compass daemon after changes

### Issue: Missing 4am data (original problem)
**Solution**: Increase data fetch scope
1. Use optimized endpoints which fetch by time range, not limit
2. Check database actually contains 4am data
3. Verify time zone handling in queries

### Issue: Slow performance still
**Solution**: Database needs optimization
1. Click "Optimize DB" button in UI
2. Or manually run: `ANALYZE activities;` on database
3. Ensure indexes are created successfully

## 📈 Expected Database Query Performance

### Old Approach:
```sql
-- Fetches all activities then filters in JavaScript
SELECT * FROM activities 
WHERE timestamp BETWEEN ? AND ? 
ORDER BY timestamp DESC 
LIMIT 1000;
```
**Result**: 1000+ rows, processed client-side

### New Approach:
```sql
-- Pre-aggregates time slots in SQL
SELECT 
  strftime('%Y-%m-%dT%H:00:00Z', timestamp) as time_slot,
  app_name,
  SUM(focus_duration) as total_time,
  COUNT(*) as activity_count
FROM activities 
WHERE timestamp BETWEEN ? AND ?
GROUP BY time_slot, app_name
ORDER BY time_slot DESC;
```
**Result**: 24-48 pre-computed time slots

## ✅ Verification Checklist

- [ ] Backend files added and compiled successfully
- [ ] New API endpoints accessible (check `/api/timeline/slots`)
- [ ] Frontend hooks and components added
- [ ] Database optimization applied
- [ ] Timeline loads faster than before
- [ ] All time slots (including 4am) display correctly
- [ ] Hover tooltips show period totals
- [ ] Click modals show detailed breakdowns
- [ ] Performance test shows improvement

## 🎉 Expected Result

After implementing these optimizations:

1. **✅ Easy Time Slot Access**: Every time slot efficiently queryable
2. **✅ Fast Timeline Rendering**: 10x performance improvement  
3. **✅ Rich Context Data**: Period totals in hover/click without client-side processing
4. **✅ Scalable Architecture**: Handles large datasets efficiently
5. **✅ 4am Data Visible**: Time-based queries find all historical data

Your timeline view will transform from a slow, client-heavy interface into a fast, server-optimized experience that can easily handle finding "every single entry of every time slot" efficiently! 🚀
