import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    Camera,
    ChevronLeft,
    ChevronRight,
    Clock,
    ExternalLink,
    Eye,
    Monitor,
    X,
    Zap
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { Activity } from '../types';

interface ContextualScreenshotViewProps {
  activities: Activity[] | undefined;
  isLoading: boolean;
}

interface ScreenshotContext {
  screenshot: Activity;
  timestamp: Date;
  contextBefore: Activity[];
  contextAfter: Activity[];
  sessionContext: {
    dominantApps: string[];
    totalDuration: number;
    categoryBreakdown: { [key: string]: number };
    productivityScore: number;
    workPattern: string;
  };
  relatedScreenshots: Activity[];
}

const ContextualScreenshotView: React.FC<ContextualScreenshotViewProps> = ({
  activities = [],
  isLoading
}) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotContext | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Get all activities with screenshots
  const screenshotActivities = useMemo(() => {
    return activities
      .filter(activity => activity.has_screenshot)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities]);

  // Group screenshots by date for timeline view
  const screenshotsByDate = useMemo(() => {
    const grouped: { [key: string]: Activity[] } = {};
    screenshotActivities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });
    return grouped;
  }, [screenshotActivities]);

  // Get available dates for filtering
  const availableDates = useMemo(() => {
    return Object.keys(screenshotsByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );
  }, [screenshotsByDate]);

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

  // Generate context for a screenshot
  const generateScreenshotContext = (screenshot: Activity): ScreenshotContext => {
    const screenshotTime = new Date(screenshot.timestamp);
    const contextWindow = 30 * 60 * 1000; // 30 minutes before and after

    // Find activities before and after the screenshot
    const contextBefore = activities
      .filter(activity => {
        const activityTime = new Date(activity.timestamp);
        return activityTime < screenshotTime && 
               (screenshotTime.getTime() - activityTime.getTime()) <= contextWindow;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const contextAfter = activities
      .filter(activity => {
        const activityTime = new Date(activity.timestamp);
        return activityTime > screenshotTime && 
               (activityTime.getTime() - screenshotTime.getTime()) <= contextWindow;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(0, 10);

    // Analyze session context
    const allContext = [...contextBefore, screenshot, ...contextAfter];
    const appDurations: { [key: string]: number } = {};
    const categoryDurations: { [key: string]: number } = {};
    let totalDuration = 0;

    allContext.forEach(activity => {
      appDurations[activity.app_name] = (appDurations[activity.app_name] || 0) + activity.focus_duration;
      categoryDurations[activity.category] = (categoryDurations[activity.category] || 0) + activity.focus_duration;
      totalDuration += activity.focus_duration;
    });

    const dominantApps = Object.entries(appDurations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([app]) => app);

    // Calculate productivity score based on focus durations
    const avgFocusDuration = allContext.reduce((sum, act) => sum + act.focus_duration, 0) / allContext.length;
    const productivityScore = Math.min(100, (avgFocusDuration / 300) * 100); // 5 minutes = 100%

    // Determine work pattern
    const workPattern = (() => {
      const hour = screenshotTime.getHours();
      if (hour >= 6 && hour < 12) return 'Morning Focus';
      if (hour >= 12 && hour < 17) return 'Afternoon Work';
      if (hour >= 17 && hour < 22) return 'Evening Session';
      return 'Late Night';
    })();

    // Find related screenshots (same hour or similar apps)
    const relatedScreenshots = screenshotActivities
      .filter(activity => {
        if (activity.id === screenshot.id) return false;
        const activityTime = new Date(activity.timestamp);
        const timeDiff = Math.abs(activityTime.getTime() - screenshotTime.getTime());
        const sameHour = timeDiff <= 60 * 60 * 1000; // Within 1 hour
        const similarApp = dominantApps.includes(activity.app_name);
        return sameHour || similarApp;
      })
      .slice(0, 6);

    return {
      screenshot,
      timestamp: screenshotTime,
      contextBefore,
      contextAfter,
      sessionContext: {
        dominantApps,
        totalDuration,
        categoryBreakdown: categoryDurations,
        productivityScore,
        workPattern
      },
      relatedScreenshots
    };
  };

  const handleScreenshotClick = (screenshot: Activity, index: number) => {
    const context = generateScreenshotContext(screenshot);
    setSelectedScreenshot(context);
    setCurrentImageIndex(index);
  };

  const navigateScreenshot = (direction: 'prev' | 'next') => {
    if (!selectedScreenshot) return;

    const filteredScreenshots = selectedDate 
      ? screenshotsByDate[selectedDate] || []
      : screenshotActivities;

    const currentIndex = filteredScreenshots.findIndex(
      activity => activity.id === selectedScreenshot.screenshot.id
    );

    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= filteredScreenshots.length) newIndex = 0;
    if (newIndex < 0) newIndex = filteredScreenshots.length - 1;

    if (filteredScreenshots[newIndex]) {
      const context = generateScreenshotContext(filteredScreenshots[newIndex]);
      setSelectedScreenshot(context);
      setCurrentImageIndex(newIndex);
    }
  };

  const filteredScreenshots = selectedDate 
    ? screenshotsByDate[selectedDate] || []
    : screenshotActivities;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Camera className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Contextual Screenshots</h3>
        </div>
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-900">🖼️ Contextual Screenshots</h2>
            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-sm font-medium">
              {filteredScreenshots.length} screenshots
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Timeline
              </button>
            </div>
            
            {/* Date Filter */}
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">All Dates</option>
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                  })} ({screenshotsByDate[date]?.length} screenshots)
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredScreenshots.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Screenshots Found</h3>
            <p className="text-gray-600 mb-4">
              {selectedDate 
                ? `No screenshots available for ${new Date(selectedDate).toLocaleDateString()}`
                : 'No screenshots have been captured yet.'
              }
            </p>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                View all screenshots
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredScreenshots.map((screenshot, index) => (
              <div
                key={screenshot.id}
                className="group relative cursor-pointer"
                onClick={() => handleScreenshotClick(screenshot, index)}
              >
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-purple-300 transition-colors">
                  <img
                    src={`http://localhost:8080/api/screenshot/${screenshot.id}`}
                    alt={`Screenshot from ${screenshot.app_name}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.parentElement!.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                          <span class="text-3xl">${getAppIcon(screenshot.app_name)}</span>
                        </div>
                      `;
                    }}
                  />
                </div>
                
                {/* Overlay with context info */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg flex flex-col justify-between p-2">
                  <div className="flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="bg-white/90 px-2 py-1 rounded text-xs font-medium">
                      {getAppIcon(screenshot.app_name)} {screenshot.app_name}
                    </span>
                    <div className="bg-purple-500/90 text-white px-2 py-1 rounded text-xs">
                      Click for context
                    </div>
                  </div>
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 px-2 py-1 rounded text-xs">
                      {new Date(screenshot.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Timeline View */
          <div className="space-y-6">
            {Object.entries(screenshotsByDate)
              .filter(([date]) => !selectedDate || date === selectedDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, screenshots]) => (
              <div key={date} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  <span className="text-sm text-gray-500">({screenshots.length} screenshots)</span>
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {screenshots.map((screenshot, index) => (
                    <div
                      key={screenshot.id}
                      className="group relative cursor-pointer"
                      onClick={() => handleScreenshotClick(screenshot, index)}
                    >
                      <div className="aspect-video bg-gray-100 rounded overflow-hidden border border-gray-200 group-hover:border-purple-300 transition-colors">
                        <img
                          src={`http://localhost:8080/api/screenshot/${screenshot.id}`}
                          alt={`Screenshot from ${screenshot.app_name}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.parentElement!.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center">
                                <span class="text-lg">${getAppIcon(screenshot.app_name)}</span>
                              </div>
                            `;
                          }}
                        />
                      </div>
                      <div className="text-xs text-center text-gray-600 mt-1">
                        {new Date(screenshot.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contextual Screenshot Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl max-h-[95vh] overflow-hidden flex flex-col w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Camera className="w-6 h-6 text-purple-600" />
                  Screenshot Context
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <span>{selectedScreenshot.timestamp.toLocaleString()}</span>
                  <span>{selectedScreenshot.screenshot.app_name}</span>
                  <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {selectedScreenshot.sessionContext.workPattern}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateScreenshot('prev')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Previous screenshot"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500 min-w-[3rem] text-center">
                  {currentImageIndex + 1} / {filteredScreenshots.length}
                </span>
                <button
                  onClick={() => navigateScreenshot('next')}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Next screenshot"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                {/* Main Screenshot */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <img
                      src={`http://localhost:8080/api/screenshot/${selectedScreenshot.screenshot.id}`}
                      alt={`Screenshot from ${selectedScreenshot.screenshot.app_name}`}
                      className="w-full h-auto max-h-96 object-contain mx-auto"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.innerHTML = `
                          <div class="w-full h-64 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                            <div class="text-center text-purple-700">
                              <div class="text-6xl mb-4">${getAppIcon(selectedScreenshot.screenshot.app_name)}</div>
                              <div class="font-medium">${selectedScreenshot.screenshot.app_name}</div>
                            </div>
                          </div>
                        `;
                      }}
                    />
                    <a
                      href={`http://localhost:8080/api/screenshot/${selectedScreenshot.screenshot.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-colors"
                      title="Open full size"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-700" />
                    </a>
                  </div>

                  {/* Session Context Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">
                        {Math.round(selectedScreenshot.sessionContext.totalDuration / 60)}m
                      </div>
                      <div className="text-sm text-purple-700">Session Time</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">
                        {selectedScreenshot.sessionContext.productivityScore.toFixed(0)}%
                      </div>
                      <div className="text-sm text-blue-700">Productivity</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">
                        {selectedScreenshot.sessionContext.dominantApps.length}
                      </div>
                      <div className="text-sm text-green-700">Main Apps</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-900">
                        {Object.keys(selectedScreenshot.sessionContext.categoryBreakdown).length}
                      </div>
                      <div className="text-sm text-orange-700">Categories</div>
                    </div>
                  </div>
                </div>

                {/* Context Sidebar */}
                <div className="space-y-6">
                  {/* Timeline Context */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Activity Timeline
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {/* Activities Before */}
                      {selectedScreenshot.contextBefore.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 text-sm">
                          <ArrowLeft className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {getAppIcon(activity.app_name)} {activity.app_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} • {Math.round(activity.focus_duration / 60)}m
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Current Screenshot */}
                      <div className="flex items-center gap-3 text-sm bg-purple-50 rounded p-2 border-l-4 border-purple-500">
                        <Camera className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold text-purple-900">
                            {getAppIcon(selectedScreenshot.screenshot.app_name)} Screenshot Taken
                          </div>
                          <div className="text-xs text-purple-700">
                            {selectedScreenshot.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Activities After */}
                      {selectedScreenshot.contextAfter.slice(0, 3).map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3 text-sm">
                          <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {getAppIcon(activity.app_name)} {activity.app_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })} • {Math.round(activity.focus_duration / 60)}m
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dominant Apps */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Monitor className="w-5 h-5" />
                      Session Apps
                    </h3>
                    <div className="space-y-2">
                      {selectedScreenshot.sessionContext.dominantApps.map((app) => (
                        <div key={app} className="flex items-center gap-2 text-sm">
                          <span className="text-lg">{getAppIcon(app)}</span>
                          <span className="font-medium text-gray-900">{app}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Related Screenshots */}
                  {selectedScreenshot.relatedScreenshots.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        Related Screenshots
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedScreenshot.relatedScreenshots.slice(0, 6).map((related) => (
                          <div
                            key={related.id}
                            className="aspect-video bg-gray-200 rounded cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all"
                            onClick={() => {
                              const context = generateScreenshotContext(related);
                              setSelectedScreenshot(context);
                            }}
                          >
                            <img
                              src={`http://localhost:8080/api/screenshot/${related.id}`}
                              alt={`Related screenshot from ${related.app_name}`}
                              className="w-full h-full object-cover rounded"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.parentElement!.innerHTML = `
                                  <div class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded">
                                    <span class="text-sm">${getAppIcon(related.app_name)}</span>
                                  </div>
                                `;
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categories Breakdown */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Categories
                    </h3>
                    <div className="space-y-2">
                      {Object.entries(selectedScreenshot.sessionContext.categoryBreakdown)
                        .sort(([,a], [,b]) => b - a)
                        .map(([category, duration]) => (
                        <div key={category} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-900">{category}</span>
                          <span className="text-gray-600">{Math.round(duration / 60)}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContextualScreenshotView;
