import React from 'react';
import { Activity, Clock } from 'lucide-react';
import type { Activity as ActivityType } from '../types';

interface ActivitiesCardProps {
  data?: ActivityType[];
  isLoading: boolean;
}

const getAppIcon = (appName: string): string => {
  const name = appName.toLowerCase();
  if (name.includes('code') || name.includes('cursor') || name.includes('vim')) return '📝';
  if (name.includes('chrome') || name.includes('firefox') || name.includes('safari')) return '🌐';
  if (name.includes('terminal') || name.includes('iterm')) return '💻';
  if (name.includes('slack')) return '💬';
  if (name.includes('spotify')) return '🎵';
  return '🖥️';
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Development': 'bg-green-100 text-green-800',
    'Debugging': 'bg-red-100 text-red-800',
    'Code Review': 'bg-cyan-100 text-cyan-800',
    'Learning': 'bg-purple-100 text-purple-800',
    'Communication': 'bg-amber-100 text-amber-800',
    'General': 'bg-gray-100 text-gray-800',
    'Deep Work': 'bg-blue-100 text-blue-800',
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

const ActivitiesCard: React.FC<ActivitiesCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
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

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Activity className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⏱️</div>
          <p className="text-gray-500">No recent activity</p>
        </div>
      </div>
    );
  }

  // Group activities by time periods (last 2 hours)
  const recentActivities = data
    .filter(activity => {
      const activityTime = new Date(activity.timestamp);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      return activityTime > twoHoursAgo;
    })
    .slice(0, 10);

  return (
    <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <span className="text-xs text-gray-500">Last 2 hours</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recentActivities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* App Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-200">
              <span className="text-lg">{getAppIcon(activity.app_name)}</span>
            </div>

            {/* Activity Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {activity.app_name}
                </h4>
                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                  {formatTime(activity.timestamp)}
                </span>
              </div>
              
              <p className="text-xs text-gray-600 truncate mb-2">
                {activity.window_title}
              </p>

              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(activity.category)}`}>
                  {activity.category}
                </span>
                
                {activity.total_windows > 1 && (
                  <span className="text-xs text-gray-500">
                    +{activity.total_windows - 1} windows
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {recentActivities.length === 0 && data.length > 0 && (
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No activity in the last 2 hours</p>
          <p className="text-gray-400 text-xs mt-1">
            Total activities recorded: {data.length}
          </p>
        </div>
      )}

      {recentActivities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Showing {recentActivities.length} of {data.length} total activities
          </p>
        </div>
      )}
    </div>
  );
};

export default ActivitiesCard;