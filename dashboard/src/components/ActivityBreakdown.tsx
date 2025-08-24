import { Activity, BarChart3, Clock, TrendingUp } from 'lucide-react';
import React from 'react';

interface ActivityBreakdownProps {
  stats: any;
}

const ActivityBreakdown: React.FC<ActivityBreakdownProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0.0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };

  // Get top categories and apps
  const topCategories = stats.by_category ? 
    Object.entries(stats.by_category)
      .map(([category, time]: [string, any]) => ({ category, time: Number(time) }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 8) : [];

  const topApps = stats.by_app ? 
    Object.entries(stats.by_app)
      .map(([app, time]: [string, any]) => ({ app, time: Number(time) }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 10) : [];

  const totalTime = stats.total_time || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gray-100 rounded-lg">
          <BarChart3 className="h-5 w-5 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Breakdown</h3>
          <p className="text-gray-600">Detailed time analysis by category and application</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Categories */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
            Top Categories
          </h4>
          
          {topCategories.length > 0 ? (
            <div className="space-y-3">
              {topCategories.map(({ category, time }, index) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' :
                      index === 4 ? 'bg-red-500' :
                      index === 5 ? 'bg-pink-500' :
                      index === 6 ? 'bg-indigo-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {category || 'Uncategorized'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercentage(time, totalTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration(time)}
                    </p>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-purple-500' :
                          index === 3 ? 'bg-orange-500' :
                          index === 4 ? 'bg-red-500' :
                          index === 5 ? 'bg-pink-500' :
                          index === 6 ? 'bg-indigo-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${Math.min(100, (time / topCategories[0]?.time || 1) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No category data available</p>
            </div>
          )}
        </div>

        {/* Applications */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-4 w-4 mr-2 text-green-600" />
            Top Applications
          </h4>
          
          {topApps.length > 0 ? (
            <div className="space-y-3">
              {topApps.map(({ app, time }, index) => (
                <div key={app} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-blue-500' :
                      index === 2 ? 'bg-purple-500' :
                      index === 3 ? 'bg-orange-500' :
                      index === 4 ? 'bg-red-500' :
                      index === 5 ? 'bg-pink-500' :
                      index === 6 ? 'bg-indigo-500' :
                      index === 7 ? 'bg-yellow-500' :
                      index === 8 ? 'bg-cyan-500' :
                      'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {app || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPercentage(time, totalTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {formatDuration(time)}
                    </p>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          index === 0 ? 'bg-green-500' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-purple-500' :
                          index === 3 ? 'bg-orange-500' :
                          index === 4 ? 'bg-red-500' :
                          index === 5 ? 'bg-pink-500' :
                          index === 6 ? 'bg-indigo-500' :
                          index === 7 ? 'bg-yellow-500' :
                          index === 8 ? 'bg-cyan-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${Math.min(100, (time / topApps[0]?.time || 1) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <Activity className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No application data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Total Active Time</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{formatDuration(totalTime)}</p>
          </div>
          
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Categories Tracked</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{topCategories.length}</p>
          </div>
          
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Activity className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Apps Used</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{topApps.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityBreakdown;
