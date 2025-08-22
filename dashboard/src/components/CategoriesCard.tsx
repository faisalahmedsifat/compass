import React from 'react';
import { PieChart } from 'lucide-react';

interface CategoriesCardProps {
  data?: Record<string, number>;
  isLoading: boolean;
}

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'Development': '👨‍💻',
    'Debugging': '🐛',
    'Code Review': '👀',
    'Learning': '📚',
    'Communication': '💬',
    'General': '🌐',
    'Deep Work': '🎯',
  };
  return icons[category] || '⚙️';
};

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'Development': '#10b981', // green
    'Debugging': '#ef4444',   // red
    'Code Review': '#06b6d4', // cyan
    'Learning': '#8b5cf6',    // purple
    'Communication': '#f59e0b', // amber
    'General': '#6b7280',     // gray
    'Deep Work': '#3b82f6',   // blue
  };
  return colors[category] || '#6b7280';
};

const formatDuration = (duration: number): string => {
  if (!duration) return '0s';
  
  const seconds = Math.floor(duration / 1000000000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
};

const CategoriesCard: React.FC<CategoriesCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <PieChart className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
        </div>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <PieChart className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📂</div>
          <p className="text-gray-500">No categories yet</p>
        </div>
      </div>
    );
  }

  const sortedCategories = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  const total = sortedCategories.reduce((sum, [, duration]) => sum + duration, 0);

  return (
    <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <PieChart className="h-6 w-6 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
      </div>

      <div className="space-y-4">
        {sortedCategories.map(([category, duration]) => {
          const percentage = total > 0 ? (duration / total) * 100 : 0;
          const color = getCategoryColor(category);
          
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(category)}</span>
                  <span className="text-sm font-medium text-gray-900">{category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDuration(duration)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(data).length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            + {Object.keys(data).length - 5} more categories
          </p>
        </div>
      )}
    </div>
  );
};

export default CategoriesCard;