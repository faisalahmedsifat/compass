import {
    Activity,
    BarChart3,
    Calendar,
    Clock,
    Code,
    Eye,
    Globe,
    Heart,
    Monitor,
    MousePointer,
    Zap
} from 'lucide-react';
import React, { useState } from 'react';
import { useActivities, useCurrentWorkspace, useHealth, useStats } from '../hooks/useCompassApi';
import ActivityBreakdown from './ActivityBreakdown';
import AggregationAdminPanel from './AggregationAdminPanel';
import BrowserActivityPanel from './BrowserActivityPanel';
import DevelopmentActivityPanel from './DevelopmentActivityPanel';
import FocusAnalytics from './FocusAnalytics';
import ProductivityMetrics from './ProductivityMetrics';
import RealTimeActivityStream from './RealTimeActivityStream';
import SystemHealthPanel from './SystemHealthPanel';
import TimelineView from './TimelineView';

type ViewType = 'realtime' | 'timeline' | 'browser' | 'development' | 'analytics' | 'health' | 'admin';

const EnhancedDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewType>('realtime');
  const [timePeriod, setTimePeriod] = useState('today');

  // API hooks
  const { data: currentWorkspace, isLoading: workspaceLoading } = useCurrentWorkspace();
  const { data: activities, isLoading: activitiesLoading } = useActivities(100);
  const { data: stats, isLoading: statsLoading } = useStats(timePeriod);
  const { data: health, isError: healthError } = useHealth();

  const navigation = [
    { 
      id: 'realtime', 
      label: 'Live Activity', 
      icon: Zap, 
      description: 'Real-time activity stream',
      color: 'text-green-600 bg-green-50 hover:bg-green-100' 
    },
    { 
      id: 'timeline', 
      label: 'Timeline', 
      icon: Calendar, 
      description: 'Chronological activity with screenshots',
      color: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100' 
    },
    { 
      id: 'browser', 
      label: 'Browser Tracking', 
      icon: Globe, 
      description: 'Tab switches & web browsing',
      color: 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
    },
    { 
      id: 'development', 
      label: 'Code & Files', 
      icon: Code, 
      description: 'File switches & development',
      color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      description: 'Focus patterns & insights',
      color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
    },
    { 
      id: 'health', 
      label: 'System Health', 
      icon: Heart, 
      description: 'Buffer status & performance',
      color: 'text-red-600 bg-red-50 hover:bg-red-100' 
    },
    { 
      id: 'admin', 
      label: 'Admin Panel', 
      icon: Monitor, 
      description: 'Database and aggregation management',
      color: 'text-gray-600 bg-gray-50 hover:bg-gray-100' 
    }
  ];

  const timePeriods = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  const renderQuickStats = () => {
    if (statsLoading || !stats) return null;

    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Active Time</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Math.round(stats.total_time / 3600)}h {Math.round((stats.total_time % 3600) / 60)}m
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-2">
            <MousePointer className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Context Switches</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.context_switches}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Longest Focus</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {Math.round(stats.longest_focus / 60)}m
          </p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Activities</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activities?.length || 0}</p>
        </div>
      </div>
    );
  };

  const renderCurrentActivity = () => {
    if (workspaceLoading || !currentWorkspace) return null;

    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Currently Active</h2>
            <div className="flex items-center space-x-4">
              <Monitor className="h-5 w-5" />
              <div>
                <p className="font-semibold">{currentWorkspace.active_window.app_name}</p>
                <p className="text-blue-100 text-sm">{currentWorkspace.active_window.title}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{currentWorkspace.focus_time}</p>
            <p className="text-blue-100 text-sm">Focus Time</p>
          </div>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (activeView) {
      case 'realtime':
        return <RealTimeActivityStream activities={activities} loading={activitiesLoading} />;
      case 'timeline':
        return <TimelineView activities={activities} isLoading={activitiesLoading} selectedPeriod={timePeriod} />;
      case 'browser':
        return <BrowserActivityPanel activities={activities} />;
      case 'development':
        return <DevelopmentActivityPanel activities={activities} />;
      case 'analytics':
        return (
          <div className="space-y-6">
            <FocusAnalytics stats={stats} loading={statsLoading} />
            <ProductivityMetrics stats={stats} activities={activities} />
            <ActivityBreakdown stats={stats} />
          </div>
        );
      case 'health':
        return <SystemHealthPanel health={health} healthError={healthError} />;
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Monitor className="w-6 h-6 text-gray-600" />
                <h2 className="text-xl font-semibold text-gray-900">Database Administration</h2>
              </div>
              <p className="text-gray-800">
                Manage the multi-granular aggregation system that powers optimized timeline queries.
                Monitor system status, rebuild aggregations, and optimize database performance.
              </p>
            </div>
            
            <AggregationAdminPanel />
          </div>
        );
      default:
        return <RealTimeActivityStream activities={activities} loading={activitiesLoading} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Monitor className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Compass</h1>
                <p className="text-sm text-gray-500">Complete Activity Tracker</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Time Period Selector */}
              <select 
                value={timePeriod} 
                onChange={(e) => setTimePeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {timePeriods.map(period => (
                  <option key={period.id} value={period.id}>{period.label}</option>
                ))}
              </select>
              
              {/* Health Indicator */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${
                healthError ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  healthError ? 'bg-red-500' : 'bg-green-500'
                }`} />
                <span>{healthError ? 'Offline' : 'Live'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Current Activity Banner */}
        {renderCurrentActivity()}
        
        {/* Quick Stats */}
        {renderQuickStats()}

        <div className="flex gap-6">
          {/* Navigation Sidebar */}
          <div className="w-64 space-y-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Activity Views
            </h3>
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  activeView === item.id
                    ? item.color + ' font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderMainContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
