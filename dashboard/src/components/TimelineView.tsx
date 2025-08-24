import { Calendar, Camera, ChevronLeft, ChevronRight, Clock, ExternalLink, Eye, Monitor, X } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useTimelinePeriodSummary, useTimelineSlots } from '../hooks/useOptimizedTimelineApi';
import type { Activity } from '../types';

interface TimelineViewProps {
  activities?: Activity[];
  isLoading?: boolean;
  selectedPeriod: string;
}

interface TimelineEntry {
  time: string;
  fullTime: Date;
  app: string;
  title: string;
  category: string;
  duration: number;
  intensity: number;
}

interface HoverData {
  time: string;
  apps: Array<{
    app: string;
    duration: number;
    percentage: number;
    category: string;
    titles: string[];
    activities: Activity[];
  }>;
  totalTime: number;
  dominantApp: string;
  productivity: number;
  screenshots: Activity[];
  activitiesCount: number;
}

interface DetailedTimeData {
  timeKey: string;
  fullTimeRange: string;
  apps: Array<{
    app: string;
    duration: number;
    percentage: number;
    category: string;
    titles: string[];
    activities: Activity[];
  }>;
  allActivities: Activity[];
  screenshots: Activity[];
  totalTime: number;
  productivity: number;
  contextSwitches: number;
}

const TimelineView: React.FC<TimelineViewProps> = ({ isLoading }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'minute' | 'hour' | 'day' | 'week' | 'month' | 'year'>('day');
  const [hoveredEntry, setHoveredEntry] = useState<HoverData | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<DetailedTimeData | null>(null);

  // Get time range for the selected date and view mode
  const getTimeRange = () => {
    const date = selectedDate;
    switch (viewMode) {
      case 'minute':
        return {
          from: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), 0),
          to: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes() + 1, 0),
          granularity: 'minute' as const
        };
      case 'hour':
        return {
          from: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0),
          to: new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours() + 1, 0, 0),
          granularity: 'minute' as const // Use minute granularity for hour view
        };
      case 'day': {
        // Focus on the selected day only
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        
        console.log('📅 Day view time range:', {
          from: dayStart.toISOString(),
          to: dayEnd.toISOString(),
          isToday: date.toDateString() === new Date().toDateString()
        });
        
        return {
          from: dayStart,
          to: dayEnd,
          granularity: 'hour' as const
        };
      }
      case 'week': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59);
        return {
          from: weekStart,
          to: weekEnd,
          granularity: 'day' as const
        };
      }
      case 'month':
        return {
          from: new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0),
          to: new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59),
          granularity: 'day' as const
        };
      case 'year':
        return {
          from: new Date(date.getFullYear(), 0, 1, 0, 0, 0),
          to: new Date(date.getFullYear(), 11, 31, 23, 59, 59),
          granularity: 'month' as const
        };
      default:
        return {
          from: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0),
          to: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59),
          granularity: 'hour' as const
        };
    }
  };

  const timeRange = getTimeRange();

  // Use new timeline hooks
  const timelineSlotsQuery = useTimelineSlots(timeRange.from, timeRange.to, timeRange.granularity);
  const periodSummaryQuery = useTimelinePeriodSummary(timeRange.from, timeRange.to, timeRange.granularity);

  const getAppIcon = (appName: string): string => {
    const name = appName.toLowerCase();
    if (name.includes('code') || name.includes('cursor') || name.includes('vim')) return '💻';
    if (name.includes('chrome') || name.includes('firefox') || name.includes('safari')) return '🌐';
    if (name.includes('terminal') || name.includes('iterm')) return '⚡';
    if (name.includes('slack') || name.includes('discord')) return '💬';
    if (name.includes('spotify') || name.includes('music')) return '🎵';
    if (name.includes('figma') || name.includes('sketch')) return '🎨';
    if (name.includes('notion') || name.includes('obsidian')) return '📝';
    return '🔧';
  };

  const getAppColor = (appName: string): string => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];
    let hash = 0;
    for (let i = 0; i < appName.length; i++) {
      hash = appName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Helper function to format time slot keys consistently
  const formatTimeSlotKey = (timeSlot: string, viewMode: string): string => {
    const date = new Date(timeSlot);
    
    switch (viewMode) {
      case 'minute':
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      case 'hour': {
        const minute = Math.floor(date.getMinutes() / 5) * 5;
        return `${date.getHours().toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      }
      case 'day':
        return `${date.getHours().toString().padStart(2, '0')}:00`;
      case 'week':
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      case 'month':
        return date.getDate().toString();
      case 'year':
        return date.toLocaleDateString('en-US', { month: 'short' });
      default:
        return timeSlot;
    }
  };

  // Convert timeline data to the format expected by existing UI components
  const timelineData = useMemo(() => {
    console.log('🔍 TimelineView Debug:', {
      hasData: !!timelineSlotsQuery.data,
      success: timelineSlotsQuery.data?.success,
      dataLength: timelineSlotsQuery.data?.data?.length,
      rawData: timelineSlotsQuery.data,
      viewMode,
      timeRange
    });

    if (!timelineSlotsQuery.data?.success || !timelineSlotsQuery.data?.data) {
      console.log('❌ No timeline data available');
      return {};
    }

    const data: { [key: string]: TimelineEntry[] } = {};
    
    timelineSlotsQuery.data.data.forEach(slot => {
      const timeKey = formatTimeSlotKey(slot.time_slot, viewMode);
      console.log('🕐 Processing slot:', { slot, timeKey, viewMode });
      
      if (!data[timeKey]) {
        data[timeKey] = [];
      }

      // Convert app breakdown to timeline entries
      Object.entries(slot.app_breakdown).forEach(([appName, appData]) => {
        data[timeKey].push({
          time: timeKey,
          fullTime: new Date(slot.time_slot),
          app: appName,
          title: appName, // We don't have individual window titles in aggregated data
          category: appData.category,
          duration: appData.total_time,
          intensity: Math.min(100, (appData.total_time / 600) * 100) // 10 min = 100%
        });
      });
    });

    console.log('✅ Processed timeline data:', data);
    return data;
  }, [timelineSlotsQuery.data, viewMode, timeRange]);

  // This is now handled by the timelineData computed value above

  const generateTimeSlots = () => {
    const slots = [];
    
    switch (viewMode) {
      case 'minute':
        // For minute view, show seconds within the minute (every 10 seconds)
        for (let second = 0; second < 60; second += 10) {
          slots.push(`${selectedDate.getHours().toString().padStart(2, '0')}:${selectedDate.getMinutes().toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`);
        }
        break;
      case 'hour':
        for (let minute = 0; minute < 60; minute += 5) {
          slots.push(`${selectedDate.getHours().toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
        break;
      case 'day':
        for (let hour = 0; hour < 24; hour++) {
          slots.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        break;
      case 'week':
        slots.push('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
        break;
      case 'month': {
        const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          slots.push(day.toString());
        }
        break;
      }
      case 'year': {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        slots.push(...months);
        break;
      }
    }
    
    return slots;
  };

  const generateHoverData = (timeKey: string): HoverData => {
    const entries = timelineData[timeKey] || [];
    const appStats: { [key: string]: { 
      duration: number; 
      titles: Set<string>; 
      category: string; 
      activities: Activity[];
    } } = {};
    
    let totalTime = 0;
    const timeSlotActivities: Activity[] = [];

    // Use the already processed timeline entries to build app stats
    // For aggregated data, we'll construct mock activities from the timeline entries
    
    // Create mock activities from timeline entries for compatibility
    const activitiesForTimeKey: Activity[] = entries.map((entry, index) => ({
      id: index,
      timestamp: entry.fullTime.toISOString(),
      app_name: entry.app,
      window_title: entry.title,
      category: entry.category,
      focus_duration: entry.duration,
      has_screenshot: false, // We don't have this info in aggregated data
      total_windows: 1 // Default value for compatibility
    }));
    
    activitiesForTimeKey.forEach(activity => {
      timeSlotActivities.push(activity);
      
      if (!appStats[activity.app_name]) {
        appStats[activity.app_name] = { 
          duration: 0, 
          titles: new Set(), 
          category: activity.category,
          activities: []
        };
      }
      appStats[activity.app_name].duration += activity.focus_duration;
      appStats[activity.app_name].titles.add(activity.window_title);
      appStats[activity.app_name].activities.push(activity);
      totalTime += activity.focus_duration;
    });

    const apps = Object.entries(appStats)
      .map(([app, stats]) => ({
        app,
        duration: stats.duration,
        percentage: totalTime > 0 ? (stats.duration / totalTime) * 100 : 0,
        category: stats.category,
        titles: Array.from(stats.titles),
        activities: stats.activities
      }))
      .sort((a, b) => b.duration - a.duration);

    const dominantApp = apps[0]?.app || 'No Activity';
    const productivity = entries.reduce((sum, entry) => sum + entry.intensity, 0) / Math.max(1, entries.length);
    const screenshots = timeSlotActivities.filter(activity => activity.has_screenshot);

    return {
      time: timeKey,
      apps,
      totalTime,
      dominantApp,
      productivity,
      screenshots,
      activitiesCount: timeSlotActivities.length
    };
  };

  const handleMouseEnter = (timeKey: string, event: React.MouseEvent) => {
    const hoverData = generateHoverData(timeKey);
    setHoveredEntry(hoverData);
    setHoverPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setHoveredEntry(null);
  };

  const handleTimeSlotClick = (timeKey: string) => {
    const detailedData = generateDetailedTimeData(timeKey);
    setSelectedTimeSlot(detailedData);
  };

  const generateDetailedTimeData = (timeKey: string): DetailedTimeData => {
    const hoverData = generateHoverData(timeKey);
    
    // Generate a more detailed time range description
    const getFullTimeRange = (timeKey: string): string => {
      switch (viewMode) {
        case 'hour': {
          const [hour, minute] = timeKey.split(':');
          const startTime = new Date(selectedDate);
          startTime.setHours(parseInt(hour), parseInt(minute), 0, 0);
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 5);
          return `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        case 'day': {
          const hourNum = parseInt(timeKey.split(':')[0]);
          const dayStart = new Date(selectedDate);
          dayStart.setHours(hourNum, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(dayEnd.getHours() + 1);
          return `${dayStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${dayEnd.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }
        case 'week':
          return `${timeKey} (Full Day)`;
        case 'month': {
          const date = new Date(selectedDate);
          date.setDate(parseInt(timeKey));
          return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          });
        }
        default:
          return timeKey;
      }
    };

    // Calculate context switches within the time period
    let contextSwitches = 0;
    const sortedActivities = hoverData.apps.flatMap(app => app.activities)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    for (let i = 1; i < sortedActivities.length; i++) {
      if (sortedActivities[i].app_name !== sortedActivities[i - 1].app_name) {
        contextSwitches++;
      }
    }

    return {
      timeKey,
      fullTimeRange: getFullTimeRange(timeKey),
      apps: hoverData.apps,
      allActivities: hoverData.apps.flatMap(app => app.activities)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      screenshots: hoverData.screenshots,
      totalTime: hoverData.totalTime,
      productivity: hoverData.productivity,
      contextSwitches
    };
  };

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    
    switch (viewMode) {
      case 'minute':
        newDate.setMinutes(selectedDate.getMinutes() + direction);
        break;
      case 'hour':
        newDate.setHours(selectedDate.getHours() + direction);
        break;
      case 'day':
        newDate.setDate(selectedDate.getDate() + direction);
        break;
      case 'week':
        newDate.setDate(selectedDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(selectedDate.getMonth() + direction);
        break;
      case 'year':
        newDate.setFullYear(selectedDate.getFullYear() + direction);
        break;
    }
    
    setSelectedDate(newDate);
  };

  const formatDateHeader = () => {
    switch (viewMode) {
              case 'minute':
          return `${selectedDate.toLocaleDateString()} - ${selectedDate.getHours()}:${selectedDate.getMinutes().toString().padStart(2, '0')}`;
        case 'hour':
          return `${selectedDate.toLocaleDateString()} - ${selectedDate.getHours()}:00`;
        case 'day':
          return selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'week': {
          const weekStart = new Date(selectedDate);
          weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
          return `Week of ${weekStart.toLocaleDateString()}`;
        }
        case 'month':
          return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        case 'year':
          return selectedDate.getFullYear().toString();
        default:
          return selectedDate.toLocaleDateString();
    }
  };

  const renderTimeSlot = (timeKey: string) => {
    const entries = timelineData[timeKey] || [];
    const hasActivity = entries.length > 0;
    
    if (!hasActivity) {
      return (
        <div 
          className="h-12 border border-gray-200 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-xs cursor-pointer hover:bg-gray-100 transition-colors duration-200"
          onMouseEnter={(e) => handleMouseEnter(timeKey, e)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleTimeSlotClick(timeKey)}
          title="Click for detailed view"
        >
          No Activity
        </div>
      );
    }

    // Group by app and calculate dominant app
    const appDurations: { [key: string]: number } = {};
    entries.forEach(entry => {
      appDurations[entry.app] = (appDurations[entry.app] || 0) + entry.duration;
    });

    const dominantApp = Object.entries(appDurations)
      .sort(([, a], [, b]) => b - a)[0]?.[0];

    const totalDuration = Object.values(appDurations).reduce((sum, duration) => sum + duration, 0);
    const intensity = entries.reduce((sum, entry) => sum + entry.intensity, 0) / entries.length;

    const getIntensityColor = (intensity: number) => {
      if (intensity > 80) return 'bg-green-500';
      if (intensity > 60) return 'bg-blue-500';
      if (intensity > 40) return 'bg-yellow-500';
      if (intensity > 20) return 'bg-orange-500';
      return 'bg-red-500';
    };

    return (
      <div 
        className={`h-12 border border-gray-200 rounded cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 ${getIntensityColor(intensity)}`}
        style={{ backgroundColor: getAppColor(dominantApp) + '20', borderColor: getAppColor(dominantApp) }}
        onMouseEnter={(e) => handleMouseEnter(timeKey, e)}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleTimeSlotClick(timeKey)}
        title="Click for detailed view"
      >
        <div className="h-full p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-800">{getAppIcon(dominantApp)}</span>
            <span className="text-xs text-gray-600">{Math.round(totalDuration / 60)}m</span>
          </div>
          <div className="text-xs text-gray-700 truncate font-medium">
            {dominantApp}
          </div>
          {Object.keys(appDurations).length > 1 && (
            <div className="text-xs text-gray-500">
              +{Object.keys(appDurations).length - 1} more
            </div>
          )}
        </div>
      </div>
    );
  };

  // Debug information
  console.log('🔍 Timeline Query State:', {
    isLoading: timelineSlotsQuery.isLoading,
    error: timelineSlotsQuery.error,
    hasData: !!timelineSlotsQuery.data,
    dataCount: timelineSlotsQuery.data?.data?.length || 0
  });

  // Show error states
  if (timelineSlotsQuery.error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-red-900">Timeline Error</h3>
        </div>
        <div className="text-red-700 mb-4">
          Failed to load timeline data: {timelineSlotsQuery.error.message}
        </div>
        <button
          onClick={() => timelineSlotsQuery.refetch()}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || timelineSlotsQuery.isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const timeSlots = generateTimeSlots();

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">Activity Timeline</h3>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Hover for preview • Click for details</span>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['minute', 'hour', 'day', 'week', 'month', 'year'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-900 min-w-[200px] text-center">
              {formatDateHeader()}
            </span>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Timeline Grid */}
        <div className="space-y-4">
          <div className={`grid gap-2 ${
            viewMode === 'minute' ? 'grid-cols-6' :
            viewMode === 'hour' ? 'grid-cols-6 md:grid-cols-12' :
            viewMode === 'day' ? 'grid-cols-6 md:grid-cols-12' :
            viewMode === 'week' ? 'grid-cols-7' :
            viewMode === 'month' ? 'grid-cols-7 md:grid-cols-10' :
            'grid-cols-6 md:grid-cols-12'
          }`}>
            {timeSlots.map((timeKey) => (
              <div key={timeKey} className="space-y-1">
                <div className="text-xs font-medium text-gray-600 text-center p-1">
                  {timeKey}
                </div>
                {renderTimeSlot(timeKey)}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-gray-600">Low Focus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">Medium Focus</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-gray-600">High Focus</span>
              </div>
            </div>
            <div className="text-gray-500">
              {viewMode === 'minute' ? '10-second intervals' :
               viewMode === 'hour' ? '5-minute intervals' :
               viewMode === 'day' ? 'Hourly view' :
               viewMode === 'week' ? 'Daily view' :
               viewMode === 'month' ? 'Daily view' :
               'Monthly view'}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredEntry && (
        <div 
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md pointer-events-none"
          style={{ 
            left: hoverPosition.x + 10, 
            top: hoverPosition.y - 10,
            transform: hoverPosition.x > window.innerWidth - 400 ? 'translateX(-100%)' : undefined
          }}
        >
          <div className="mb-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {hoveredEntry.time}
            </h4>
            <div className="text-sm text-gray-600 flex items-center justify-between">
              <span>Slot: {Math.round(hoveredEntry.totalTime / 60)} minutes</span>
              <span>{hoveredEntry.activitiesCount} activities</span>
            </div>
          </div>

          {/* Period Totals in Hover */}
          {(() => {
            if (!periodSummaryQuery.data) return null;
            const appTotals = periodSummaryQuery.data.app_totals;
            const totalPeriodTime = periodSummaryQuery.data.summary.total_time;

            const sortedPeriodTotals = Object.entries(appTotals)
              .sort(([,a], [,b]) => b.total_time - a.total_time)
              .slice(0, 3)
              .map(([app, data]) => [app, data.total_time] as [string, number]);

            if (totalPeriodTime > 0) {
              return (
                <div className="mb-3 p-2 bg-gray-50 rounded border-t border-gray-200">
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    📊 Period Totals ({formatDateHeader()})
                  </div>
                  <div className="space-y-1">
                    {sortedPeriodTotals.map(([app, duration]) => (
                      <div key={app} className="flex justify-between text-xs">
                        <span className="flex items-center gap-1">
                          {getAppIcon(app)} {app}
                        </span>
                        <span className="font-medium">
                          {duration >= 3600 
                            ? `${Math.round(duration / 3600)}h ${Math.round((duration % 3600) / 60)}m`
                            : `${Math.round(duration / 60)}m`
                          }
                        </span>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 border-t pt-1">
                      Total: {totalPeriodTime >= 3600 
                        ? `${Math.round(totalPeriodTime / 3600)}h ${Math.round((totalPeriodTime % 3600) / 60)}m`
                        : `${Math.round(totalPeriodTime / 60)}m`
                      }
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {hoveredEntry.apps.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Applications:</div>
              {hoveredEntry.apps.slice(0, 4).map((app, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{getAppIcon(app.app)}</span>
                    <span className="font-medium">{app.app}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{Math.round(app.duration / 60)}m</div>
                    <div className="text-xs text-gray-500">{app.percentage.toFixed(0)}%</div>
                  </div>
                </div>
              ))}
              {hoveredEntry.apps.length > 4 && (
                <div className="text-xs text-gray-500 text-center">
                  +{hoveredEntry.apps.length - 4} more apps
                </div>
              )}

              {/* Screenshots Section */}
              {hoveredEntry.screenshots.length > 0 && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Camera className="w-4 h-4" />
                    {hoveredEntry.screenshots.length} screenshot{hoveredEntry.screenshots.length > 1 ? 's' : ''}
                  </div>
                  <div className="flex gap-1 overflow-x-auto">
                    {hoveredEntry.screenshots.slice(0, 3).map((screenshot) => (
                      <div key={screenshot.id} className="flex-shrink-0">
                        <img
                          src={`http://localhost:8080/api/screenshot/${screenshot.id}`}
                          alt={`Screenshot from ${screenshot.app_name}`}
                          className="w-12 h-8 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Productivity:</span>
                  <span className={`font-medium ${
                    hoveredEntry.productivity > 70 ? 'text-green-600' :
                    hoveredEntry.productivity > 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {hoveredEntry.productivity.toFixed(0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1 text-center">
                  Click for detailed view
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-2">
              <div>No activity recorded</div>
              <div className="text-xs mt-1">Click to see time details</div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Time Slot Modal */}
      {selectedTimeSlot && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                  {selectedTimeSlot.fullTimeRange}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>{Math.round(selectedTimeSlot.totalTime / 60)} minutes total</span>
                  <span>{selectedTimeSlot.allActivities.length} activities</span>
                  <span>{selectedTimeSlot.contextSwitches} context switches</span>
                  {selectedTimeSlot.screenshots.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Camera className="w-4 h-4" />
                      {selectedTimeSlot.screenshots.length} screenshots
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTimeSlot(null)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-900">{Math.round(selectedTimeSlot.totalTime / 60)}m</div>
                    <div className="text-sm text-blue-700">Slot Time</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-900">{selectedTimeSlot.productivity.toFixed(0)}%</div>
                    <div className="text-sm text-green-700">Productivity</div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-900">{selectedTimeSlot.contextSwitches}</div>
                    <div className="text-sm text-orange-700">Context Switches</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-900">{selectedTimeSlot.apps.length}</div>
                    <div className="text-sm text-purple-700">Applications</div>
                  </div>
                </div>

                {/* Period Summary in Modal */}
                {(() => {
                  if (!periodSummaryQuery.data) return null;
                  
                  const appTotals = periodSummaryQuery.data.app_totals;
                  const totalPeriodTime = periodSummaryQuery.data.summary.total_time;

                  const sortedPeriodTotals = Object.entries(appTotals)
                    .map(([app, data]) => [app, {
                      duration: data.total_time,
                      sessions: data.activity_count,
                      category: data.category
                    }] as [string, { duration: number; sessions: number; category: string }])
                    .sort(([,a], [,b]) => b.duration - a.duration);

                  if (totalPeriodTime > 0) {
                    return (
                      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          📊 Total Period Summary: {formatDateHeader()}
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Top Applications for Period */}
                          <div>
                            <h5 className="text-sm font-medium text-indigo-800 mb-2">Top Applications</h5>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {sortedPeriodTotals.slice(0, 6).map(([app, data]) => (
                                <div key={app} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                                  <div className="flex items-center gap-2 flex-1">
                                    <span>{getAppIcon(app)}</span>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium truncate">{app}</div>
                                      <div className="text-xs text-gray-500">{data.sessions} sessions</div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-indigo-900">
                                      {data.duration >= 3600 
                                        ? `${Math.round(data.duration / 3600)}h ${Math.round((data.duration % 3600) / 60)}m`
                                        : `${Math.round(data.duration / 60)}m`
                                      }
                                    </div>
                                    <div className="text-xs text-indigo-600">
                                      {Math.round((data.duration / totalPeriodTime) * 100)}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Period Overview */}
                          <div>
                            <h5 className="text-sm font-medium text-indigo-800 mb-2">Period Overview</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white p-3 rounded text-center">
                                <div className="text-lg font-bold text-indigo-900">
                                  {totalPeriodTime >= 3600 
                                    ? `${Math.round(totalPeriodTime / 3600)}h ${Math.round((totalPeriodTime % 3600) / 60)}m`
                                    : `${Math.round(totalPeriodTime / 60)}m`
                                  }
                                </div>
                                <div className="text-xs text-indigo-700">Total Time</div>
                              </div>
                              <div className="bg-white p-3 rounded text-center">
                                <div className="text-lg font-bold text-indigo-900">{periodSummaryQuery.data?.summary.unique_apps || 0}</div>
                                <div className="text-xs text-indigo-700">Apps Used</div>
                              </div>
                              <div className="bg-white p-3 rounded text-center">
                                <div className="text-lg font-bold text-indigo-900">
                                  {Object.values(appTotals).reduce((sum, app) => sum + app.activity_count, 0)}
                                </div>
                                <div className="text-xs text-indigo-700">Sessions</div>
                              </div>
                              <div className="bg-white p-3 rounded text-center">
                                <div className="text-lg font-bold text-indigo-900">
                                  {periodSummaryQuery.data?.summary.unique_categories || 0}
                                </div>
                                <div className="text-xs text-indigo-700">Categories</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Applications Used */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Applications Used
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {selectedTimeSlot.apps.map((app, index) => (
                        <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getAppIcon(app.app)}</span>
                              <span className="font-medium text-gray-900">{app.app}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{Math.round(app.duration / 60)}m</div>
                              <div className="text-xs text-gray-500">{app.percentage.toFixed(1)}%</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            <div className="mb-1">Category: <span className="font-medium">{app.category}</span></div>
                            <div>Activities: <span className="font-medium">{app.activities.length}</span></div>
                            {app.titles.length > 0 && (
                              <div className="mt-1 max-w-full">
                                <span className="font-medium">Recent: </span>
                                <span className="truncate">{app.titles[0]}</span>
                                {app.titles.length > 1 && <span className="text-gray-500"> (+{app.titles.length - 1} more)</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity Feed */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Activity Feed
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedTimeSlot.allActivities.slice(0, 10).map((activity) => (
                        <div key={activity.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-1">
                              <span>{getAppIcon(activity.app_name)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {activity.app_name}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {activity.window_title}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="text-xs text-gray-500">
                                {new Date(activity.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                              <div className="text-xs text-gray-600">
                                {activity.focus_duration}s
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="bg-gray-100 px-2 py-1 rounded">{activity.category}</span>
                            {activity.has_screenshot && (
                              <span className="text-purple-600 flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                Screenshot
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      {selectedTimeSlot.allActivities.length > 10 && (
                        <div className="text-xs text-gray-500 text-center p-2">
                          +{selectedTimeSlot.allActivities.length - 10} more activities
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Screenshots Gallery */}
                {selectedTimeSlot.screenshots.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Camera className="w-5 h-5" />
                      Screenshots ({selectedTimeSlot.screenshots.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedTimeSlot.screenshots.map((screenshot) => (
                        <div key={screenshot.id} className="group relative">
                          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                            <img
                              src={`http://localhost:8080/api/screenshot/${screenshot.id}`}
                              alt={`Screenshot from ${screenshot.app_name}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                    <span class="text-2xl">${getAppIcon(screenshot.app_name)}</span>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 rounded-lg flex items-end">
                            <div className="p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <div className="text-xs font-medium">{screenshot.app_name}</div>
                              <div className="text-xs opacity-90">
                                {new Date(screenshot.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                          <a
                            href={`http://localhost:8080/api/screenshot/${screenshot.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            title="Open full size"
                          >
                            <ExternalLink className="w-3 h-3 text-gray-700" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TimelineView;
