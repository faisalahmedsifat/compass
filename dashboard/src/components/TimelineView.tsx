import React, { useState, useMemo } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
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
  }>;
  totalTime: number;
  dominantApp: string;
  productivity: number;
}

const TimelineView: React.FC<TimelineViewProps> = ({ activities, isLoading }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [hoveredEntry, setHoveredEntry] = useState<HoverData | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

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

  const processActivities = (activities: Activity[], viewMode: string, date: Date) => {
    if (!activities) return [];

    const filteredActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      
      switch (viewMode) {
        case 'hour':
          return activityDate.toDateString() === date.toDateString() &&
                 activityDate.getHours() === date.getHours();
        case 'day':
          return activityDate.toDateString() === date.toDateString();
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return activityDate >= weekStart && activityDate <= weekEnd;
        }
        case 'month':
          return activityDate.getMonth() === date.getMonth() &&
                 activityDate.getFullYear() === date.getFullYear();
        default:
          return false;
      }
    });

    return filteredActivities;
  };

  const generateTimelineData = useMemo(() => {
    const processedActivities = processActivities(activities || [], viewMode, selectedDate);
    const timelineData: { [key: string]: TimelineEntry[] } = {};

    processedActivities.forEach(activity => {
      const activityDate = new Date(activity.timestamp);
      let timeKey: string;

      switch (viewMode) {
        case 'hour':
          timeKey = `${activityDate.getHours().toString().padStart(2, '0')}:${activityDate.getMinutes().toString().padStart(2, '0')}`;
          break;
        case 'day':
          timeKey = `${activityDate.getHours().toString().padStart(2, '0')}:00`;
          break;
        case 'week':
          timeKey = activityDate.toLocaleDateString('en-US', { weekday: 'short' });
          break;
        case 'month':
          timeKey = activityDate.getDate().toString();
          break;
        default:
          timeKey = activityDate.toISOString();
      }

      if (!timelineData[timeKey]) {
        timelineData[timeKey] = [];
      }

      timelineData[timeKey].push({
        time: timeKey,
        fullTime: activityDate,
        app: activity.app_name,
        title: activity.window_title,
        category: activity.category,
        duration: activity.focus_duration,
        intensity: Math.min(100, (activity.focus_duration / 600) * 100) // 10 min = 100%
      });
    });

    return timelineData;
  }, [activities, viewMode, selectedDate]);

  const generateTimeSlots = () => {
    const slots = [];
    
    switch (viewMode) {
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
    }
    
    return slots;
  };

  const generateHoverData = (timeKey: string): HoverData => {
    const entries = generateTimelineData[timeKey] || [];
    const appStats: { [key: string]: { duration: number; titles: Set<string>; category: string } } = {};
    
    let totalTime = 0;
    entries.forEach(entry => {
      if (!appStats[entry.app]) {
        appStats[entry.app] = { duration: 0, titles: new Set(), category: entry.category };
      }
      appStats[entry.app].duration += entry.duration;
      appStats[entry.app].titles.add(entry.title);
      totalTime += entry.duration;
    });

    const apps = Object.entries(appStats)
      .map(([app, stats]) => ({
        app,
        duration: stats.duration,
        percentage: totalTime > 0 ? (stats.duration / totalTime) * 100 : 0,
        category: stats.category,
        titles: Array.from(stats.titles)
      }))
      .sort((a, b) => b.duration - a.duration);

    const dominantApp = apps[0]?.app || 'No Activity';
    const productivity = entries.reduce((sum, entry) => sum + entry.intensity, 0) / Math.max(1, entries.length);

    return {
      time: timeKey,
      apps,
      totalTime,
      dominantApp,
      productivity
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

  const navigateDate = (direction: number) => {
    const newDate = new Date(selectedDate);
    
    switch (viewMode) {
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
    }
    
    setSelectedDate(newDate);
  };

  const formatDateHeader = () => {
    switch (viewMode) {
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
      default:
        return selectedDate.toLocaleDateString();
    }
  };

  const renderTimeSlot = (timeKey: string) => {
    const entries = generateTimelineData[timeKey] || [];
    const hasActivity = entries.length > 0;
    
    if (!hasActivity) {
      return (
        <div 
          className="h-12 border border-gray-200 bg-gray-50 rounded flex items-center justify-center text-gray-400 text-xs"
          onMouseEnter={(e) => handleMouseEnter(timeKey, e)}
          onMouseLeave={handleMouseLeave}
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
        className={`h-12 border border-gray-200 rounded cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${getIntensityColor(intensity)}`}
        style={{ backgroundColor: getAppColor(dominantApp) + '20', borderColor: getAppColor(dominantApp) }}
        onMouseEnter={(e) => handleMouseEnter(timeKey, e)}
        onMouseLeave={handleMouseLeave}
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

  if (isLoading) {
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
            <span className="text-sm text-gray-600">Hover for details</span>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {(['hour', 'day', 'week', 'month'] as const).map((mode) => (
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
            viewMode === 'hour' ? 'grid-cols-6 md:grid-cols-12' :
            viewMode === 'day' ? 'grid-cols-6 md:grid-cols-12' :
            viewMode === 'week' ? 'grid-cols-7' :
            'grid-cols-7 md:grid-cols-10'
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
              {viewMode === 'hour' ? '5-minute intervals' :
               viewMode === 'day' ? 'Hourly view' :
               viewMode === 'week' ? 'Daily view' :
               'Daily view'}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredEntry && (
        <div 
          className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm pointer-events-none"
          style={{ 
            left: hoverPosition.x + 10, 
            top: hoverPosition.y - 10,
            transform: hoverPosition.x > window.innerWidth - 300 ? 'translateX(-100%)' : undefined
          }}
        >
          <div className="mb-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {hoveredEntry.time}
            </h4>
            <div className="text-sm text-gray-600">
              Total: {Math.round(hoveredEntry.totalTime / 60)} minutes
            </div>
          </div>

          {hoveredEntry.apps.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Applications:</div>
              {hoveredEntry.apps.slice(0, 5).map((app, index) => (
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
              {hoveredEntry.apps.length > 5 && (
                <div className="text-xs text-gray-500 text-center">
                  +{hoveredEntry.apps.length - 5} more apps
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
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-2">
              No activity recorded
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default TimelineView;
