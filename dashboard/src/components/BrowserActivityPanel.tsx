import {
    Chrome,
    Clock,
    ExternalLink,
    Eye,
    Globe,
    MousePointer,
    Search,
    TrendingUp
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import type { Activity } from '../types';

interface BrowserActivityPanelProps {
  activities: Activity[] | undefined;
}

interface BrowserActivity extends Activity {
  domain?: string;
  url?: string;
  browser?: string;
}

const BrowserActivityPanel: React.FC<BrowserActivityPanelProps> = ({ 
  activities = []
}) => {
  const [filterBrowser, setFilterBrowser] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const browserActivities = useMemo(() => {
    if (!activities) return [];
    
    return activities
      .filter(activity => 
        activity.category?.toLowerCase().includes('browser') ||
        activity.app_name?.toLowerCase().includes('firefox') ||
        activity.app_name?.toLowerCase().includes('chrome') ||
        activity.app_name?.toLowerCase().includes('safari') ||
        activity.app_name?.toLowerCase().includes('edge')
      )
      .map(activity => {
        const urlMatch = activity.window_title?.match(/https?:\/\/[^\s)]+/);
        const url = urlMatch ? urlMatch[0] : null;
        let domain = null;
        
        if (url) {
          try {
            domain = new URL(url).hostname;
          } catch {
            // If URL parsing fails, extract domain from title
            const domainMatch = activity.window_title?.match(/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/);
            domain = domainMatch ? domainMatch[0] : null;
          }
        }
        
        return {
          ...activity,
          domain,
          url,
          browser: activity.app_name?.toLowerCase().includes('firefox') ? 'firefox' :
                  activity.app_name?.toLowerCase().includes('chrome') ? 'chrome' :
                  activity.app_name?.toLowerCase().includes('safari') ? 'safari' :
                  activity.app_name?.toLowerCase().includes('edge') ? 'edge' : 'unknown'
        } as BrowserActivity;
      })
      .filter(activity => {
        if (filterBrowser !== 'all' && activity.browser !== filterBrowser) return false;
        if (searchTerm && !activity.window_title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !activity.domain?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
      });
  }, [activities, filterBrowser, searchTerm]);

  const domainStats = useMemo(() => {
    const domains: { [key: string]: { count: number; totalTime: number; browser: string } } = {};
    
    browserActivities.forEach(activity => {
      if (activity.domain) {
        if (!domains[activity.domain]) {
          domains[activity.domain] = { count: 0, totalTime: 0, browser: activity.browser || 'unknown' };
        }
        domains[activity.domain].count++;
        domains[activity.domain].totalTime += activity.focus_duration;
      }
    });
    
    return Object.entries(domains)
      .map(([domain, stats]) => ({ domain, ...stats }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);
  }, [browserActivities]);

  const browserStats = useMemo(() => {
    const browsers: { [key: string]: { count: number; totalTime: number } } = {};
    
    browserActivities.forEach(activity => {
      const browser = activity.browser || 'unknown';
      if (!browsers[browser]) {
        browsers[browser] = { count: 0, totalTime: 0 };
      }
      browsers[browser].count++;
      browsers[browser].totalTime += activity.focus_duration;
    });
    
    return Object.entries(browsers).map(([browser, stats]) => ({ browser, ...stats }));
  }, [browserActivities]);

  const getBrowserIcon = (browser: string) => {
    switch (browser) {
      case 'firefox':
        return <Globe className="h-4 w-4 text-orange-600" />;
      case 'chrome':
        return <Chrome className="h-4 w-4 text-blue-600" />;
      default:
        return <Globe className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalBrowserTime = browserActivities.reduce((sum, activity) => sum + activity.focus_duration, 0);
  const averageSessionTime = browserActivities.length > 0 ? totalBrowserTime / browserActivities.length : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Browser Activity Tracking</h2>
              <p className="text-gray-600">Tab switches, URLs, and browsing patterns</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <MousePointer className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{browserActivities.length}</p>
            <p className="text-sm text-gray-600">Tab Switches</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatDuration(totalBrowserTime)}</p>
            <p className="text-sm text-gray-600">Total Time</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{formatDuration(Math.round(averageSessionTime))}</p>
            <p className="text-sm text-gray-600">Avg Session</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Eye className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{domainStats.length}</p>
            <p className="text-sm text-gray-600">Unique Domains</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Browser Distribution */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Usage</h3>
          <div className="space-y-3">
            {browserStats.map(({ browser, count, totalTime }) => (
              <div key={browser} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getBrowserIcon(browser)}
                  <span className="font-medium capitalize">{browser}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatDuration(totalTime)}</p>
                  <p className="text-xs text-gray-500">{count} switches</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Domains */}
        <div className="col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Websites</h3>
          <div className="space-y-3">
            {domainStats.slice(0, 8).map(({ domain, count, totalTime, browser }) => (
              <div key={domain} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getBrowserIcon(browser)}
                  <div>
                    <p className="font-medium text-gray-900">{domain}</p>
                    <p className="text-xs text-gray-500">{count} visits</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatDuration(totalTime)}</p>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (totalTime / domainStats[0].totalTime) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters and Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Browser Activity</h3>
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search websites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Browser Filter */}
              <select
                value={filterBrowser}
                onChange={(e) => setFilterBrowser(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Browsers</option>
                <option value="firefox">Firefox</option>
                <option value="chrome">Chrome</option>
                <option value="safari">Safari</option>
                <option value="edge">Edge</option>
              </select>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {browserActivities.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No browser activities found. Install the browser extension to start tracking!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {browserActivities.slice(0, 20).map((activity, index) => (
                <div key={`${activity.timestamp}-${index}`} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {getBrowserIcon(activity.browser || 'unknown')}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                            Tab Switch
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
                      
                      <h4 className="font-medium text-gray-900 mt-1 truncate">{activity.window_title}</h4>
                      
                      {activity.domain && (
                        <div className="flex items-center space-x-1 mt-1">
                          <ExternalLink className="h-3 w-3 text-blue-500" />
                          <span className="text-sm text-blue-600">{activity.domain}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrowserActivityPanel;
