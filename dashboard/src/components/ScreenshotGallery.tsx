import { Camera, Clock, ExternalLink, Eye, X } from 'lucide-react';
import React, { useState } from 'react';
import type { Activity } from '../types';

interface ScreenshotGalleryProps {
  activities?: Activity[];
  isLoading?: boolean;
}

const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({ activities, isLoading }) => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<Activity | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Camera className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Screenshots</h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-video bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const screenshotActivities = activities?.filter(activity => activity.has_screenshot) || [];

  if (screenshotActivities.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Camera className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Activity Screenshots</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📸</div>
          <p className="text-gray-500">No screenshots available</p>
          <p className="text-sm text-gray-400 mt-2">Screenshots will appear here as you work</p>
        </div>
      </div>
    );
  }

  const recentScreenshots = screenshotActivities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 12);

  const formatTime = (timestamp: string) => {
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

  const getAppIcon = (appName: string): string => {
    const name = appName.toLowerCase();
    if (name.includes('code') || name.includes('cursor') || name.includes('vim')) return '💻';
    if (name.includes('chrome') || name.includes('firefox') || name.includes('safari')) return '🌐';
    if (name.includes('terminal') || name.includes('iterm')) return '⚡';
    if (name.includes('slack') || name.includes('discord')) return '💬';
    if (name.includes('figma') || name.includes('sketch')) return '🎨';
    return '🖥️';
  };

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Camera className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Activity Screenshots</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Eye className="w-4 h-4" />
            <span>{recentScreenshots.length} recent captures</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentScreenshots.map((activity) => (
            <div
              key={activity.id}
              className="group relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all duration-200"
              onClick={() => setSelectedScreenshot(activity)}
            >
              {/* Screenshot Image */}
              <img
                src={`http://localhost:8080/api/screenshot/${activity.id}`}
                alt={`Screenshot from ${activity.app_name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              
              {/* Fallback when image fails to load */}
              <div className="hidden w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl">{getAppIcon(activity.app_name)}</span>
                  <div className="text-xs text-gray-600 mt-1">{activity.app_name}</div>
                </div>
              </div>

              {/* Overlay with app info */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-end">
                <div className="w-full p-3 bg-gradient-to-t from-black to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getAppIcon(activity.app_name)}</span>
                      <span className="text-sm font-medium truncate">{activity.app_name}</span>
                    </div>
                    <div className="text-xs opacity-90 truncate">{activity.window_title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{formatTime(activity.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category badge */}
              <div className="absolute top-2 right-2">
                <span className="bg-white/90 text-xs px-2 py-1 rounded-full font-medium text-gray-700">
                  {activity.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        {screenshotActivities.length > 12 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Showing {recentScreenshots.length} of {screenshotActivities.length} screenshots
            </p>
          </div>
        )}
      </div>

      {/* Modal for full-size screenshot */}
      {selectedScreenshot && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl max-h-full overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xl">{getAppIcon(selectedScreenshot.app_name)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedScreenshot.app_name}</h3>
                  <p className="text-sm text-gray-600">{selectedScreenshot.window_title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(selectedScreenshot.timestamp)}
                </div>
                <a
                  href={`http://localhost:8080/api/screenshot/${selectedScreenshot.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setSelectedScreenshot(null)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <img
                src={`http://localhost:8080/api/screenshot/${selectedScreenshot.id}`}
                alt={`Full screenshot from ${selectedScreenshot.app_name}`}
                className="max-w-full h-auto rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.parentElement!.innerHTML = `
                    <div class="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                      <div class="text-center">
                        <div class="text-4xl mb-4">${getAppIcon(selectedScreenshot.app_name)}</div>
                        <p class="text-gray-500">Screenshot not available</p>
                      </div>
                    </div>
                  `;
                }}
              />
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Category:</span>
                  <span className="ml-2 font-medium">{selectedScreenshot.category}</span>
                </div>
                <div>
                  <span className="text-gray-500">Focus Duration:</span>
                  <span className="ml-2 font-medium">{selectedScreenshot.focus_duration}s</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Windows:</span>
                  <span className="ml-2 font-medium">{selectedScreenshot.total_windows}</span>
                </div>
                <div>
                  <span className="text-gray-500">Activity ID:</span>
                  <span className="ml-2 font-medium">#{selectedScreenshot.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScreenshotGallery;
