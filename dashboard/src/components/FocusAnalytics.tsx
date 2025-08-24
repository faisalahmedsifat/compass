import { Activity, Clock, Eye, Target, TrendingUp } from 'lucide-react';
import React from 'react';

interface FocusAnalyticsProps {
  stats: any;
  loading: boolean;
}

const FocusAnalytics: React.FC<FocusAnalyticsProps> = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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

  const averageSessionTime = stats.total_time && stats.context_switches > 0 
    ? stats.total_time / stats.context_switches 
    : 0;

  const focusEfficiency = stats.longest_focus && stats.total_time > 0 
    ? (stats.longest_focus / stats.total_time) * 100 
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Eye className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Focus Analytics</h3>
          <p className="text-gray-600">Deep work patterns and concentration insights</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.longest_focus || 0)}</p>
          <p className="text-sm text-gray-600">Longest Focus</p>
        </div>

        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{formatDuration(Math.round(averageSessionTime))}</p>
          <p className="text-sm text-gray-600">Avg Session</p>
        </div>

        <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{focusEfficiency.toFixed(1)}%</p>
          <p className="text-sm text-gray-600">Focus Efficiency</p>
        </div>

        <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
          <Activity className="h-6 w-6 text-orange-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">{stats.context_switches || 0}</p>
          <p className="text-sm text-gray-600">Context Switches</p>
        </div>
      </div>

      {/* Focus Quality Indicator */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Focus Quality Assessment</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Deep Work Periods</span>
              <span className={`font-medium ${stats.longest_focus > 1800 ? 'text-green-600' : stats.longest_focus > 900 ? 'text-yellow-600' : 'text-red-600'}`}>
                {stats.longest_focus > 1800 ? 'Excellent' : stats.longest_focus > 900 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${stats.longest_focus > 1800 ? 'bg-green-500' : stats.longest_focus > 900 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, (stats.longest_focus / 3600) * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Context Switch Frequency</span>
              <span className={`font-medium ${stats.context_switches < 20 ? 'text-green-600' : stats.context_switches < 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {stats.context_switches < 20 ? 'Low' : stats.context_switches < 50 ? 'Moderate' : 'High'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${stats.context_switches < 20 ? 'bg-green-500' : stats.context_switches < 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, (stats.context_switches / 100) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusAnalytics;
