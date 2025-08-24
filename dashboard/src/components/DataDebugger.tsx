import { Bug, Calendar, ChevronDown, Clock, Database } from 'lucide-react';
import React, { useState } from 'react';
import { useActivities } from '../hooks/useCompassApi';

const DataDebugger: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activityLimit, setActivityLimit] = useState(50);
  
  const { data: activities, isLoading } = useActivities(activityLimit);

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Debug Data Fetching"
        >
          <Bug className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const getDataStats = () => {
    if (!activities) return null;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    const todayActivities = activities.filter(activity => 
      new Date(activity.timestamp) >= today
    );
    
    const yesterdayActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= yesterday && activityDate < today;
    });

    const earlyMorningActivities = activities.filter(activity => {
      const activityDate = new Date(activity.timestamp);
      const hour = activityDate.getHours();
      return hour >= 0 && hour <= 6; // 12am - 6am
    });

    const oldestActivity = activities.reduce((oldest, activity) => 
      new Date(activity.timestamp) < new Date(oldest.timestamp) ? activity : oldest
    );

    const newestActivity = activities.reduce((newest, activity) => 
      new Date(activity.timestamp) > new Date(newest.timestamp) ? activity : newest
    );

    return {
      total: activities.length,
      today: todayActivities.length,
      yesterday: yesterdayActivities.length,
      earlyMorning: earlyMorningActivities.length,
      oldest: oldestActivity,
      newest: newestActivity,
      timeSpan: {
        from: new Date(oldestActivity.timestamp),
        to: new Date(newestActivity.timestamp)
      }
    };
  };

  const stats = getDataStats();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Data Debugger</h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Fetch Limit Control */}
      <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <label className="block text-sm font-medium text-yellow-800 mb-2">
          Activity Fetch Limit
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={activityLimit}
            onChange={(e) => setActivityLimit(parseInt(e.target.value) || 50)}
            className="flex-1 px-3 py-1 border border-yellow-300 rounded text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
            min="10"
            max="5000"
          />
          <div className="text-xs text-yellow-700 flex items-center">
            Currently: {activityLimit}
          </div>
        </div>
        <div className="text-xs text-yellow-700 mt-1">
          ⚠️ Default limit is 50 - increase if missing older data
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-sm text-gray-600 mt-2">Loading activities...</div>
        </div>
      ) : stats ? (
        <div className="space-y-3">
          {/* Overall Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-900">{stats.total}</div>
              <div className="text-xs text-blue-700">Total Activities</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-green-900">{stats.earlyMorning}</div>
              <div className="text-xs text-green-700">12am-6am Activities</div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Daily Breakdown
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Today:</span>
                <span className="font-medium">{stats.today} activities</span>
              </div>
              <div className="flex justify-between">
                <span>Yesterday:</span>
                <span className="font-medium">{stats.yesterday} activities</span>
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Data Time Range
            </h4>
            <div className="text-xs space-y-1">
              <div>
                <strong>Oldest:</strong> {stats.timeSpan.from.toLocaleString()}
              </div>
              <div>
                <strong>Newest:</strong> {stats.timeSpan.to.toLocaleString()}
              </div>
              <div className="text-purple-700 mt-2">
                Span: {Math.round((stats.timeSpan.to.getTime() - stats.timeSpan.from.getTime()) / (1000 * 60 * 60))} hours
              </div>
            </div>
          </div>

          {/* Early Morning Details */}
          {stats.earlyMorning > 0 && (
            <div className="bg-indigo-50 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-900 mb-2">🌙 Early Morning Activities</h4>
              <div className="text-xs space-y-1">
                {activities
                  ?.filter(activity => {
                    const hour = new Date(activity.timestamp).getHours();
                    return hour >= 0 && hour <= 6;
                  })
                  .slice(0, 3)
                  .map(activity => (
                    <div key={activity.id} className="flex justify-between">
                      <span>{activity.app_name}</span>
                      <span>{new Date(activity.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                }
                {stats.earlyMorning > 3 && (
                  <div className="text-indigo-600 text-center">
                    +{stats.earlyMorning - 3} more activities
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">💡 Recommendations</h4>
            <div className="text-xs text-yellow-800 space-y-1">
              {stats.total >= activityLimit && (
                <div>• Increase limit to {activityLimit + 200} to fetch more data</div>
              )}
              {stats.earlyMorning === 0 && (
                <div>• No early morning (12am-6am) activities found</div>
              )}
              {stats.total < 10 && (
                <div>• Very few activities - check if daemon is running</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-red-600">
          <Database className="w-8 h-8 mx-auto mb-2" />
          <div>No activities data available</div>
        </div>
      )}
    </div>
  );
};

export default DataDebugger;
