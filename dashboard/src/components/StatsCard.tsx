import React from 'react';
import { BarChart3, Clock, Shuffle, Target } from 'lucide-react';
import type { Stats } from '../types';

interface StatsCardProps {
  data?: Stats;
  isLoading: boolean;
}

const formatDuration = (duration: number | string): string => {
  if (!duration) return '0s';
  
  if (typeof duration === 'string') {
    return duration;
  }
  
  if (duration === 0) return '0s';
  
  const seconds = Math.floor(duration / 1000000000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
};

const StatsCard: React.FC<StatsCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Today's Summary</h2>
        </div>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Today's Summary</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">No data available yet</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Clock,
      label: 'Total Active',
      value: formatDuration(data.total_time),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Shuffle,
      label: 'Context Switches',
      value: data.context_switches?.toString() || '0',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      icon: Target,
      label: 'Longest Focus',
      value: formatDuration(data.longest_focus),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BarChart3 className="h-6 w-6 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Today's Summary</h2>
      </div>

      <div className="space-y-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{stat.label}</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{stat.value}</span>
            </div>
          );
        })}
      </div>

      {/* Additional Insights */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          {data.context_switches > 20 && (
            <p className="mb-2">💡 High context switching detected. Consider longer focus sessions.</p>
          )}
          {data.longest_focus > 3600000000000 && ( // 1 hour in nanoseconds
            <p className="mb-2">🎯 Great deep work session detected!</p>
          )}
          <p>Data updates every minute</p>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;