# Product Requirements Document: Multi-Granular Timeline System

## Overview

**Product Name**: Compass Multi-Granular Timeline System  
**Version**: 2.0  
**Status**: Development  
**Last Updated**: 2024

### Executive Summary

The Multi-Granular Timeline System is a comprehensive enhancement to Compass that transforms it from a reactive activity tracker into a high-performance time-series analytics platform. This system enables users to visualize and analyze their productivity patterns across multiple time granularities (minutes to years) with lightning-fast query performance.

## Business Objectives

### Primary Goals
1. **Performance**: Achieve 100-300x faster timeline queries compared to the current system
2. **Scalability**: Support years of historical data without performance degradation  
3. **User Experience**: Enable smooth, responsive timeline interactions at any zoom level
4. **Data Insights**: Provide multi-granular analytics for better productivity understanding

### Success Metrics
- Timeline query response time < 50ms (vs 500-15000ms currently)
- Support for 10M+ activities without performance impact
- Zero UI lag when switching between timeline granularities
- 99.9% system uptime during data aggregation

## Target Users

### Primary Users
- **Knowledge Workers**: Developers, designers, researchers, analysts
- **Freelancers**: Individual contributors tracking billable hours
- **Team Leads**: Managers analyzing team productivity patterns

### Secondary Users  
- **Data Analysts**: Users performing deep productivity analytics
- **Researchers**: Academic users studying work patterns
- **Enterprise Teams**: Organizations tracking collective productivity

## Feature Requirements

### Core Features

#### 1. Multi-Granular Data Storage
- **Description**: Store pre-computed aggregations at 6 time granularities
- **Granularities**: Minute, Hour, Day, Week, Month, Year
- **Data Points**: Activity counts, time totals, app breakdowns, categories
- **Storage**: SQLite with optimized indexing strategy

#### 2. Real-Time Aggregation Engine
- **Description**: Process new activities into all relevant time buckets
- **Performance**: < 5ms processing time per activity
- **Reliability**: Asynchronous processing to prevent blocking
- **Recovery**: Automatic backfill for missed aggregations

#### 3. Timeline Query API
- **Description**: RESTful endpoints for timeline data retrieval
- **Response Time**: < 50ms for any time range
- **Format**: JSON with rich metadata
- **Caching**: Intelligent caching for frequently accessed ranges

#### 4. Data Visualization Support
- **Heatmaps**: Time x App usage matrices
- **Charts**: Breakdown by applications and categories  
- **Statistics**: Aggregated metrics with percentages
- **Filtering**: By app, category, time range

### Technical Features

#### 5. Intelligent Granularity Selection
- **Auto-Selection**: Optimal granularity based on time range
- **Performance**: Minimize data transfer and processing
- **Rules**: 
  - ≤ 24 hours → Hour granularity
  - ≤ 7 days → Day granularity  
  - ≤ 30 days → Day granularity
  - ≤ 365 days → Week granularity
  - > 365 days → Month granularity

#### 6. Data Retention Management
- **Configurable**: Different retention periods per granularity
- **Storage Optimization**: Automatic cleanup of old data
- **Policies**:
  - Minutes: 7 days
  - Hours: 30 days  
  - Days: 1 year
  - Weeks: 2 years
  - Months: 5 years
  - Years: 100 years

#### 7. Historical Data Migration
- **Backfill**: Process existing activities into aggregations
- **Progress Tracking**: Monitor migration status
- **Validation**: Ensure data consistency and accuracy
- **Performance**: Batch processing to minimize resource impact

## API Specifications

### Timeline Data Endpoints

#### GET /api/timeline/{granularity}
- **Purpose**: Retrieve aggregated timeline data
- **Parameters**: 
  - `granularity`: minute|hour|day|week|month|year
  - `from`: ISO 8601 timestamp (optional, defaults to -24h)
  - `to`: ISO 8601 timestamp (optional, defaults to now)
- **Response**: Array of timeline data points with app breakdowns
- **Example**: `GET /api/timeline/hour?from=2024-01-15T00:00:00Z&to=2024-01-16T00:00:00Z`

#### GET /api/timeline/{granularity}/matrix
- **Purpose**: Get time x app matrix for heatmap visualization
- **Response**: Nested object with time slots as keys, apps as values
- **Use Case**: Heatmap components, activity pattern analysis

#### GET /api/timeline/{granularity}/heatmap
- **Purpose**: Structured heatmap data with visualization metadata
- **Response**: Formatted data ready for visualization libraries
- **Features**: Top apps per slot, intensity calculations

#### GET /api/timeline/{granularity}/stats
- **Purpose**: Aggregated statistics using pre-computed data
- **Response**: Statistics object with app/category breakdowns
- **Performance**: Leverages aggregations for instant results

### Administration Endpoints

#### POST /api/admin/backfill
- **Purpose**: Trigger historical data aggregation
- **Response**: Status message indicating background processing started
- **Usage**: Initial setup, data recovery

#### GET /api/admin/aggregation-status
- **Purpose**: Monitor aggregation table status
- **Response**: Table sizes, date ranges, last update timestamps
- **Usage**: System monitoring, health checks

## Data Model

### Timeline Data Point Structure
```json
{
  "time_slot": "2024-01-15T14:00:00Z",
  "granularity": "hour",
  "total_time": 3600,
  "app_breakdown": {
    "Chrome": {
      "app_name": "Chrome",
      "total_time": 2400,
      "active_time": 2100,
      "activity_count": 45,
      "category": "Development",
      "percentage": 66.7
    }
  },
  "metadata": {
    "total_activities": 67,
    "total_apps": 5,
    "total_categories": 3,
    "screenshot_count": 12
  }
}
```

### Database Schema Changes

#### New Aggregation Tables (6 total)
- `activity_minutes`, `activity_hours`, `activity_days`
- `activity_weeks`, `activity_months`, `activity_years`
- Each with consistent schema: time_bucket, app_name, category, metrics
- Comprehensive indexing for optimal query performance

## Performance Requirements

### Response Time Requirements
| Operation | Current | Target | Improvement |
|-----------|---------|--------|-------------|
| Daily timeline | 500ms | 5ms | 100x |
| Weekly timeline | 2000ms | 15ms | 133x |
| Monthly timeline | 5000ms | 25ms | 200x |
| Yearly timeline | 15000ms | 50ms | 300x |

### Throughput Requirements
- **Activity Processing**: 1000+ activities/second
- **Concurrent Users**: 50+ simultaneous timeline requests
- **Data Volume**: Support for 10M+ activities
- **Storage Growth**: <10% overhead for aggregation tables

### Scalability Requirements
- **Historical Data**: 5+ years of activity history
- **Real-time Processing**: Zero impact on activity capture
- **Memory Usage**: <100MB additional RAM for aggregation engine
- **Disk Space**: <20% increase in total database size

## User Experience Requirements

### Timeline Visualization
- **Smooth Zooming**: Seamless granularity transitions
- **Interactive Elements**: Click to drill down, hover for details
- **Loading States**: Sub-second loading for all timeline operations
- **Responsive Design**: Works on desktop, tablet, mobile

### Data Exploration
- **Filter Capabilities**: By app, category, productivity score
- **Search Functionality**: Find specific apps or time periods
- **Export Options**: CSV, JSON data export
- **Bookmark Views**: Save frequently accessed time ranges

### Error Handling
- **Graceful Degradation**: Fallback to raw data if aggregations fail
- **User Feedback**: Clear error messages and recovery options
- **Retry Logic**: Automatic retry for temporary failures
- **Data Validation**: Prevent invalid time ranges and parameters

## Technical Requirements

### Infrastructure
- **Database**: SQLite 3.35+ with optimized configuration
- **Memory**: 2GB+ RAM for smooth aggregation processing
- **CPU**: Multi-core processor for parallel aggregation
- **Storage**: SSD recommended for optimal I/O performance

### Compatibility
- **Operating Systems**: Linux, macOS, Windows
- **Go Version**: 1.19+
- **Dependencies**: Minimal external dependencies
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+

### Security & Privacy
- **Local Data**: All processing remains local to user's machine
- **No Cloud Sync**: Zero external data transmission
- **Encryption**: Optional database encryption
- **Access Control**: File-system level permissions

## Implementation Phases

### Phase 1: Core Infrastructure ✅
- Multi-granular aggregation table schema
- Real-time aggregation engine
- Basic timeline query APIs
- Database migration system

### Phase 2: API & Integration ✅  
- Complete timeline API endpoints
- Server integration and routing
- Error handling and validation
- Performance optimization

### Phase 3: Data Migration
- Historical data backfill implementation
- Data consistency validation
- Performance testing and tuning
- Documentation completion

### Phase 4: Frontend Integration
- Update React components for new APIs
- Implement granularity switching
- Add heatmap visualizations
- Performance monitoring

### Phase 5: Production Deployment
- Comprehensive testing
- User acceptance testing
- Performance benchmarking
- Production rollout

## Success Criteria

### Technical Success
- [ ] All timeline queries respond in < 50ms
- [ ] 100% data consistency between raw and aggregated data
- [ ] Zero performance impact on activity capture
- [ ] Successful processing of 10M+ historical activities

### User Experience Success  
- [ ] Smooth timeline interactions with no perceived lag
- [ ] Intuitive granularity switching
- [ ] Comprehensive data visualization capabilities
- [ ] Positive user feedback on performance improvements

### Business Success
- [ ] 90%+ user adoption of new timeline features
- [ ] 50%+ reduction in support queries about slow performance
- [ ] Enable new use cases (long-term trend analysis)
- [ ] Foundation for advanced analytics features

## Risk Assessment

### Technical Risks
- **Data Migration**: Complex backfill process for large datasets
- **Mitigation**: Incremental processing, progress tracking, rollback capability

- **Storage Growth**: Aggregation tables increasing disk usage
- **Mitigation**: Configurable retention policies, data compression

- **Consistency**: Potential discrepancies between raw and aggregated data
- **Mitigation**: Automated validation, reconciliation processes

### Performance Risks
- **Memory Usage**: Aggregation engine consuming excessive RAM
- **Mitigation**: Streaming processing, garbage collection optimization

- **Query Complexity**: Complex aggregation queries impacting performance
- **Mitigation**: Query optimization, selective indexing

### User Experience Risks
- **Learning Curve**: Users confused by new granularity options
- **Mitigation**: Intuitive UI, contextual help, gradual feature rollout

- **Data Loss**: Perception of missing data during transition
- **Mitigation**: Clear communication, data validation reports

## Future Enhancements

### Advanced Analytics (Phase 6)
- Productivity trend prediction
- Anomaly detection in work patterns
- Comparative analysis between time periods
- Custom productivity metrics

### Collaboration Features (Phase 7)
- Team timeline aggregations
- Productivity benchmarking
- Shared dashboard capabilities
- Export formats for reporting

### AI Integration (Phase 8)
- Intelligent productivity insights
- Automatic categorization improvements
- Work pattern recommendations
- Focus optimization suggestions

## Conclusion

The Multi-Granular Timeline System represents a significant evolution in Compass's capabilities, transforming it from a simple activity tracker into a powerful productivity analytics platform. By implementing pre-computed aggregations and intelligent query optimization, we can deliver unprecedented performance while enabling rich data exploration capabilities.

The system is designed to scale with users' needs, from individual productivity tracking to long-term trend analysis, while maintaining the privacy and local-first approach that defines Compass.

Success will be measured not just in technical metrics, but in enabling users to gain deeper insights into their work patterns and make data-driven decisions about their productivity and focus.

