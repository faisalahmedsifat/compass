import {
    Activity as ActivityIcon,
    Clock,
    Code,
    ExternalLink,
    Globe,
    Monitor,
    MousePointer,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Activity } from '../types';

interface RealTimeActivityStreamProps {
  activities: Activity[] | undefined;
  loading: boolean;
}

interface ActivityEvent extends Activity {
  isNew?: boolean;
}

const RealTimeActivityStream: React.FC<RealTimeActivityStreamProps> = ({ 
  activities = [], 
  loading 
}) => {
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    if (activities && activities.length > 0) {
      // Mark new activities and maintain order
      const newEvents = activities.slice(0, 50).map((activity, index) => ({
        ...activity,
        isNew: index < 5 // Mark first 5 as new for animation
      }));
      
      setActivityEvents(newEvents);
      
      // Remove new flag after animation
      setTimeout(() => {
        setActivityEvents(prev => prev.map(event => ({ ...event, isNew: false })));
      }, 2000);
    }
  }, [activities]);

  const getActivityIcon = (activity: Activity) => {
    if (activity.category?.toLowerCase().includes('browser') || 
        activity.app_name?.toLowerCase().includes('firefox') ||
        activity.app_name?.toLowerCase().includes('chrome')) {
      return <Globe className="h-4 w-4 text-blue-600" />;
    }
    
    if (activity.category?.toLowerCase().includes('development') ||
        activity.app_name?.toLowerCase().includes('code') ||
        activity.app_name?.toLowerCase().includes('cursor')) {
      return <Code className="h-4 w-4 text-purple-600" />;
    }
    
    return <Monitor className="h-4 w-4 text-gray-600" />;
  };

  const getActivityType = (activity: Activity) => {
    if (activity.category?.toLowerCase().includes('browser')) {
      return { type: 'Browser Tab', color: 'text-blue-600 bg-blue-50' };
    }
    if (activity.category?.toLowerCase().includes('development')) {
      return { type: 'Code File', color: 'text-purple-600 bg-purple-50' };
    }
    return { type: 'Application', color: 'text-gray-600 bg-gray-50' };
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getUrlFromTitle = (title: string) => {
    // Extract URL from browser tab titles
    const urlMatch = title.match(/https?:\/\/[^\s)]+/);
    return urlMatch ? urlMatch[0] : null;
  };

  const getDomainFromTitle = (title: string) => {
    const url = getUrlFromTitle(title);
    if (url) {
      try {
        return new URL(url).hostname;
      } catch {
        return null;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Live Activity Stream</h2>
              <p className="text-gray-600">Real-time tracking with 1-second precision</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">Live</span>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Globe className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">Browser Tabs</p>
            <p className="text-xs text-gray-600">Tab switches & URLs</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Code className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">File Switches</p>
            <p className="text-xs text-gray-600">VS Code & Cursor files</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Monitor className="h-6 w-6 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-900">App Changes</p>
            <p className="text-xs text-gray-600">Window focus events</p>
          </div>
        </div>
      </div>

      {/* Activity Stream */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          <p className="text-gray-600">Last {activityEvents.length} activities captured</p>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {activityEvents.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities yet. Start using your computer to see real-time tracking!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {activityEvents.map((activity, index) => {
                const activityType = getActivityType(activity);
                const domain = getDomainFromTitle(activity.window_title);
                
                return (
                  <div
                    key={`${activity.timestamp}-${index}`}
                    className={`p-4 transition-all duration-500 ${
                      activity.isNew ? 'bg-green-50 border-l-4 border-green-500' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getActivityIcon(activity)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${activityType.color}`}>
                              {activityType.type}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(activity.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(activity.focus_duration)}</span>
                          </div>
                        </div>
                        
                        <h4 className="font-medium text-gray-900 mt-1">{activity.app_name}</h4>
                        <p className="text-sm text-gray-600 truncate">{activity.window_title}</p>
                        
                        {domain && (
                          <div className="flex items-center space-x-1 mt-1">
                            <ExternalLink className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600">{domain}</span>
                          </div>
                        )}
                        
                        {activity.category && (
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-gray-500">Category:</span>
                            <span className="text-xs font-medium text-gray-700">{activity.category}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2">
            <MousePointer className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Context Switches</span>
          </div>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {activityEvents.filter((_, i) => i < activityEvents.length - 1).length}
          </p>
          <p className="text-xs text-gray-500">In current session</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Browser Activities</span>
          </div>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {activityEvents.filter(a => getActivityType(a).type === 'Browser Tab').length}
          </p>
          <p className="text-xs text-gray-500">Tab switches tracked</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Development</span>
          </div>
          <p className="text-xl font-bold text-gray-900 mt-1">
            {activityEvents.filter(a => getActivityType(a).type === 'Code File').length}
          </p>
          <p className="text-xs text-gray-500">File switches tracked</p>
        </div>
      </div>
    </div>
  );
};

export default RealTimeActivityStream;
