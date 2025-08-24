import {
    Camera,
    ChevronDown,
    ChevronRight,
    Clock,
    Eye,
    Monitor,
    Target,
    Zap
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { Activity } from '../types';

interface ActivitySessionContextProps {
  activities: Activity[] | undefined;
  targetTime?: Date;
  isLoading: boolean;
}

interface WorkSession {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in seconds
  activities: Activity[];
  dominantApp: string;
  dominantCategory: string;
  appBreakdown: { app: string; duration: number; percentage: number }[];
  categoryBreakdown: { category: string; duration: number; percentage: number }[];
  productivityScore: number;
  contextSwitches: number;
  screenshots: Activity[];
  focusQuality: 'high' | 'medium' | 'low';
  sessionType: 'deep-work' | 'collaboration' | 'browsing' | 'mixed';
  isTargetSession: boolean;
}

const ActivitySessionContext: React.FC<ActivitySessionContextProps> = ({
  activities = [],
  targetTime,
  isLoading
}) => {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionLimit, setSessionLimit] = useState(5);

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

  // Group activities into work sessions
  const workSessions = useMemo(() => {
    if (!activities.length) return [];

    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const sessions: WorkSession[] = [];
    let currentSessionActivities: Activity[] = [];
    let sessionStartTime = new Date(sortedActivities[0].timestamp);
    
    const SESSION_GAP_THRESHOLD = 15 * 60 * 1000; // 15 minutes gap = new session

    sortedActivities.forEach((activity, index) => {
      const activityTime = new Date(activity.timestamp);
      const prevActivity = sortedActivities[index - 1];
      
      // Start a new session if there's a significant gap or it's the first activity
      const shouldStartNewSession = prevActivity && 
        (activityTime.getTime() - new Date(prevActivity.timestamp).getTime()) > SESSION_GAP_THRESHOLD;

      if (shouldStartNewSession && currentSessionActivities.length > 0) {
        // Close current session
        const session = createWorkSession(currentSessionActivities, sessionStartTime);
        if (session) sessions.push(session);
        
        // Start new session
        currentSessionActivities = [activity];
        sessionStartTime = activityTime;
      } else {
        currentSessionActivities.push(activity);
      }
    });

    // Don't forget the last session
    if (currentSessionActivities.length > 0) {
      const session = createWorkSession(currentSessionActivities, sessionStartTime);
      if (session) sessions.push(session);
    }

    return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }, [activities, targetTime]);

  const createWorkSession = (sessionActivities: Activity[], startTime: Date): WorkSession | null => {
    if (sessionActivities.length === 0) return null;

    const endTime = new Date(sessionActivities[sessionActivities.length - 1].timestamp);
    const duration = sessionActivities.reduce((sum, act) => sum + act.focus_duration, 0);

    // Calculate app breakdown
    const appDurations: { [key: string]: number } = {};
    sessionActivities.forEach(activity => {
      appDurations[activity.app_name] = (appDurations[activity.app_name] || 0) + activity.focus_duration;
    });

    const appBreakdown = Object.entries(appDurations)
      .map(([app, duration]) => ({
        app,
        duration,
        percentage: (duration / duration) * 100
      }))
      .sort((a, b) => b.duration - a.duration);

    const dominantApp = appBreakdown[0]?.app || 'Unknown';

    // Calculate category breakdown
    const categoryDurations: { [key: string]: number } = {};
    sessionActivities.forEach(activity => {
      categoryDurations[activity.category] = (categoryDurations[activity.category] || 0) + activity.focus_duration;
    });

    const categoryBreakdown = Object.entries(categoryDurations)
      .map(([category, duration]) => ({
        category,
        duration,
        percentage: (duration / Object.values(categoryDurations).reduce((sum, d) => sum + d, 0)) * 100
      }))
      .sort((a, b) => b.duration - a.duration);

    const dominantCategory = categoryBreakdown[0]?.category || 'Uncategorized';

    // Calculate productivity metrics
    const avgFocusDuration = duration / sessionActivities.length;
    const productivityScore = Math.min(100, (avgFocusDuration / 300) * 100); // 5 minutes = 100%

    // Count context switches
    let contextSwitches = 0;
    for (let i = 1; i < sessionActivities.length; i++) {
      if (sessionActivities[i].app_name !== sessionActivities[i - 1].app_name) {
        contextSwitches++;
      }
    }

    // Get screenshots
    const screenshots = sessionActivities.filter(activity => activity.has_screenshot);

    // Determine focus quality
    const focusQuality: 'high' | 'medium' | 'low' = 
      avgFocusDuration > 600 ? 'high' :
      avgFocusDuration > 180 ? 'medium' : 'low';

    // Determine session type based on dominant category and apps
    const sessionType: 'deep-work' | 'collaboration' | 'browsing' | 'mixed' = (() => {
      if (dominantCategory.toLowerCase().includes('development') || 
          dominantApp.toLowerCase().includes('code') ||
          dominantApp.toLowerCase().includes('cursor')) {
        return 'deep-work';
      }
      if (dominantCategory.toLowerCase().includes('communication') ||
          dominantApp.toLowerCase().includes('slack') ||
          dominantApp.toLowerCase().includes('zoom')) {
        return 'collaboration';
      }
      if (dominantApp.toLowerCase().includes('browser') ||
          dominantApp.toLowerCase().includes('chrome') ||
          dominantApp.toLowerCase().includes('firefox')) {
        return 'browsing';
      }
      return 'mixed';
    })();

    // Check if this session includes the target time
    const isTargetSession = targetTime ? 
      startTime <= targetTime && endTime >= targetTime : false;

    return {
      id: `session-${startTime.getTime()}`,
      startTime,
      endTime,
      duration,
      activities: sessionActivities,
      dominantApp,
      dominantCategory,
      appBreakdown,
      categoryBreakdown,
      productivityScore,
      contextSwitches,
      screenshots,
      focusQuality,
      sessionType,
      isTargetSession
    };
  };

  const getSessionIcon = (sessionType: string): string => {
    switch (sessionType) {
      case 'deep-work': return '🔥';
      case 'collaboration': return '👥';
      case 'browsing': return '🌐';
      case 'mixed': return '🔄';
      default: return '💼';
    }
  };

  const getSessionColor = (sessionType: string): string => {
    switch (sessionType) {
      case 'deep-work': return 'border-red-200 bg-red-50';
      case 'collaboration': return 'border-blue-200 bg-blue-50';
      case 'browsing': return 'border-green-200 bg-green-50';
      case 'mixed': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getFocusQualityColor = (quality: string): string => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const displayedSessions = workSessions.slice(0, sessionLimit);
  const targetSession = targetTime ? workSessions.find(session => session.isTargetSession) : null;

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Sessions</h3>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 h-24 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Target className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold text-gray-900">🎯 Work Sessions</h2>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
            {workSessions.length} sessions found
          </span>
        </div>
        
        {targetTime && (
          <div className="text-sm text-gray-600">
            Looking for: {targetTime.toLocaleString()}
          </div>
        )}
      </div>

      {/* Target Session Highlight */}
      {targetSession && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-900">Target Time Session Found!</span>
          </div>
          <div className="text-sm text-yellow-800">
            You were in a <strong>{targetSession.sessionType.replace('-', ' ')}</strong> session from{' '}
            <strong>{targetSession.startTime.toLocaleTimeString()}</strong> to{' '}
            <strong>{targetSession.endTime.toLocaleTimeString()}</strong>, primarily using{' '}
            <strong>{targetSession.dominantApp}</strong>.
          </div>
        </div>
      )}

      {workSessions.length === 0 ? (
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Work Sessions Found</h3>
          <p className="text-gray-600">
            Sessions are automatically detected based on activity patterns and time gaps.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedSessions.map((session) => (
            <div
              key={session.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${
                getSessionColor(session.sessionType)
              } ${session.isTargetSession ? 'ring-2 ring-yellow-300 shadow-lg' : ''}`}
            >
              {/* Session Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getSessionIcon(session.sessionType)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {session.sessionType.replace('-', ' ')} Session
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFocusQualityColor(session.focusQuality)}`}>
                        {session.focusQuality} focus
                      </span>
                      {session.isTargetSession && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                          🎯 Target Session
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {session.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {Math.round(session.duration / 60)} minutes
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setExpandedSession(
                    expandedSession === session.id ? null : session.id
                  )}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  {expandedSession === session.id ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Session Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {getAppIcon(session.dominantApp)}
                  </div>
                  <div className="text-xs text-gray-600">{session.dominantApp}</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {session.productivityScore.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600">Productivity</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {session.contextSwitches}
                  </div>
                  <div className="text-xs text-gray-600">Switches</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">
                    {session.screenshots.length}
                  </div>
                  <div className="text-xs text-gray-600">Screenshots</div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedSession === session.id && (
                <div className="border-t pt-4 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Applications Used */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        Applications Used
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {session.appBreakdown.slice(0, 5).map((app) => (
                          <div key={app.app} className="flex items-center justify-between text-sm">
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
                      </div>
                    </div>

                    {/* Activity Timeline */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Activity Timeline
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {session.activities.slice(-5).map((activity) => (
                          <div key={activity.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span>{getAppIcon(activity.app_name)}</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{activity.app_name}</div>
                                <div className="text-xs text-gray-500 truncate">
                                  {activity.window_title}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs text-gray-500">
                                {new Date(activity.timestamp).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Category Breakdown
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {session.categoryBreakdown.map((category) => (
                        <div key={category.category} className="bg-white px-3 py-1 rounded-full text-sm border">
                          <span className="font-medium">{category.category}</span>
                          <span className="text-gray-500 ml-1">({category.percentage.toFixed(0)}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Screenshots */}
                  {session.screenshots.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        Screenshots from Session ({session.screenshots.length})
                      </h4>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {session.screenshots.slice(0, 6).map((screenshot) => (
                          <div key={screenshot.id} className="flex-shrink-0">
                            <img
                              src={`http://localhost:8080/api/screenshot/${screenshot.id}`}
                              alt={`Screenshot from ${screenshot.app_name}`}
                              className="w-20 h-12 object-cover rounded border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.parentElement!.innerHTML = `
                                  <div class="w-20 h-12 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded border border-gray-200">
                                    <span class="text-sm">${getAppIcon(screenshot.app_name)}</span>
                                  </div>
                                `;
                              }}
                              onClick={() => {
                                window.open(`http://localhost:8080/api/screenshot/${screenshot.id}`, '_blank');
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session Insights */}
                  <div className="mt-4 p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-gray-900">Session Insights</span>
                    </div>
                    <div className="text-sm text-gray-700">
                      {session.focusQuality === 'high' && (
                        <p>🎯 <strong>Great focus session!</strong> You maintained long periods of concentration with minimal context switching.</p>
                      )}
                      {session.focusQuality === 'medium' && (
                        <p>📝 <strong>Productive session.</strong> Good balance of focus time with some necessary context switching.</p>
                      )}
                      {session.focusQuality === 'low' && (
                        <p>⚡ <strong>Fast-paced session.</strong> Lots of quick interactions - possibly responding to messages or doing research.</p>
                      )}
                      
                      {session.contextSwitches > 10 && (
                        <p className="mt-1">🔄 High context switching detected - consider batching similar tasks together for better focus.</p>
                      )}
                      
                      {session.screenshots.length > 0 && (
                        <p className="mt-1">📸 Visual evidence captured - great for remembering what you worked on during this session.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Load More Button */}
          {workSessions.length > sessionLimit && (
            <div className="text-center pt-4">
              <button
                onClick={() => setSessionLimit(prev => prev + 5)}
                className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium"
              >
                Show {Math.min(5, workSessions.length - sessionLimit)} More Sessions
              </button>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-900">
                  {workSessions.reduce((sum, session) => sum + Math.round(session.duration / 60), 0)}m
                </div>
                <div className="text-sm text-blue-700">Total Active Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-900">
                  {Math.round(workSessions.reduce((sum, session) => sum + session.productivityScore, 0) / workSessions.length) || 0}%
                </div>
                <div className="text-sm text-green-700">Avg Productivity</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-900">
                  {workSessions.filter(s => s.sessionType === 'deep-work').length}
                </div>
                <div className="text-sm text-purple-700">Deep Work Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {workSessions.reduce((sum, session) => sum + session.screenshots.length, 0)}
                </div>
                <div className="text-sm text-orange-700">Screenshots Captured</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitySessionContext;
