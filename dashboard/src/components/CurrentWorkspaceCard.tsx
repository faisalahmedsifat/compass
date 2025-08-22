import React from 'react';
import { Monitor, Clock, Hash } from 'lucide-react';
import type { CurrentWorkspace } from '../types';

interface CurrentWorkspaceCardProps {
  data?: CurrentWorkspace;
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

const CurrentWorkspaceCard: React.FC<CurrentWorkspaceCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Monitor className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Current Workspace</h2>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!data || !data.active_window) {
    return (
      <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Monitor className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Current Workspace</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔍</div>
          <p className="text-gray-500">Initializing workspace tracking...</p>
        </div>
      </div>
    );
  }

  const { active_window, all_windows, category, focus_time, window_count } = data;

  return (
    <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Monitor className="h-6 w-6 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Current Workspace</h2>
      </div>

      {/* Active Application */}
      <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
        <div className="flex items-start space-x-4">
          <div className="text-4xl">{getAppIcon(active_window.app_name)}</div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate">
              {active_window.app_name}
            </h3>
            <p className="text-gray-600 text-sm mt-1 break-words">
              {active_window.title}
            </p>
            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Focus: {focus_time}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Hash className="h-4 w-4" />
                <span>Category: {category}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Monitor className="h-4 w-4" />
                <span>{window_count} windows</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Windows */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          All Windows ({all_windows.length})
        </h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {all_windows.slice(0, 8).map((window, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg ${
                window.is_active
                  ? 'bg-primary-50 border border-primary-200'
                  : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="text-lg">{getAppIcon(window.app_name)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm text-gray-900">
                    {window.app_name}
                  </span>
                  {window.is_active && (
                    <span className="px-2 py-1 bg-primary-600 text-white text-xs rounded-full">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {window.title}
                </p>
              </div>
            </div>
          ))}
          {all_windows.length > 8 && (
            <div className="text-center text-sm text-gray-500 py-2">
              + {all_windows.length - 8} more windows
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentWorkspaceCard;