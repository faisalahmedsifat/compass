import React, { useState } from 'react';
import { Activity, Compass, BarChart3, Brain, Zap, TrendingUp, Calendar } from 'lucide-react';
import { 
  useCurrentWorkspace, 
  useActivities, 
  useStats, 
  useHealth, 
  useAdvancedAnalytics,
  useFocusPatterns,
  useAppTransitions,
  useRealTimeMetrics
} from '../hooks/useCompassApi';
import CurrentWorkspaceCard from './CurrentWorkspaceCard';
import StatsCard from './StatsCard';
import ActivitiesCard from './ActivitiesCard';
import CategoriesCard from './CategoriesCard';
import ConnectionStatus from './ConnectionStatus';
import FocusHeatmap from './FocusHeatmap';
import AppEfficiencyRadar from './AppEfficiencyRadar';
import EnergyProductivityScatter from './EnergyProductivityScatter';
import FlowStateIndicator from './FlowStateIndicator';
import ProductivityInsights from './ProductivityInsights';
import AppTransitionAnalysis from './AppTransitionAnalysis';
import TimePeriodSelector from './TimePeriodSelector';
import ScreenshotGallery from './ScreenshotGallery';
import WelcomeModal from './WelcomeModal';
import TimelineView from './TimelineView';

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [selectedView, setSelectedView] = useState<'overview' | 'analytics' | 'insights' | 'timeline'>('overview');
  const [showWelcome, setShowWelcome] = useState(() => {
    // Show welcome modal if user hasn't seen the latest version
    return !localStorage.getItem('compass-welcome-seen-v2');
  });

  // Basic hooks
  const { data: currentWorkspace, isLoading: workspaceLoading } = useCurrentWorkspace();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: stats, isLoading: statsLoading } = useStats(selectedPeriod);
  const { data: health, isError: healthError } = useHealth();

  // Advanced analytics hooks
  const { data: advancedAnalytics, isLoading: analyticsLoading } = useAdvancedAnalytics(selectedPeriod);
  const { data: focusPatterns, isLoading: focusLoading } = useFocusPatterns();
  const { data: appTransitions, isLoading: transitionsLoading } = useAppTransitions(selectedPeriod);
  const { data: realTimeMetrics, isLoading: realTimeLoading } = useRealTimeMetrics();

  const handleWelcomeClose = () => {
    localStorage.setItem('compass-welcome-seen-v2', 'true');
    setShowWelcome(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Compass className="h-8 w-8 text-primary-600" />
                <h1 className="text-3xl font-bold text-gray-900">🧭 Compass Dashboard</h1>
              </div>
              <ConnectionStatus isConnected={!healthError} />
            </div>
            
            {/* Navigation and Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                {(['overview', 'timeline', 'analytics', 'insights'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setSelectedView(view)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      selectedView === view
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {view === 'overview' && <BarChart3 className="w-4 h-4" />}
                    {view === 'timeline' && <Calendar className="w-4 h-4" />}
                    {view === 'analytics' && <TrendingUp className="w-4 h-4" />}
                    {view === 'insights' && <Brain className="w-4 h-4" />}
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
              
              <TimePeriodSelector 
                selectedPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {selectedView === 'overview' && (
          <div className="space-y-8">
            {/* Hero Section - Current State */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <CurrentWorkspaceCard data={currentWorkspace} isLoading={workspaceLoading} />
              </div>
              <div>
                <FlowStateIndicator 
                  realTimeMetrics={realTimeMetrics} 
                  isLoading={realTimeLoading} 
                />
              </div>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard data={stats} isLoading={statsLoading} />
              <CategoriesCard data={stats?.by_category} isLoading={statsLoading} />
              <ActivitiesCard data={activities} isLoading={activitiesLoading} />
            </div>

            {/* Visual Activity History */}
            <ScreenshotGallery activities={activities} isLoading={activitiesLoading} />

            {/* Quick Analytics Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FocusHeatmap data={focusPatterns} isLoading={focusLoading} />
              <AppTransitionAnalysis data={appTransitions} isLoading={transitionsLoading} />
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {selectedView === 'timeline' && (
          <div className="space-y-8">
            {/* Main Timeline View */}
            <TimelineView 
              activities={activities} 
              isLoading={activitiesLoading}
              selectedPeriod={selectedPeriod}
            />

            {/* Supporting Context */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div>
                <FlowStateIndicator 
                  realTimeMetrics={realTimeMetrics} 
                  isLoading={realTimeLoading} 
                />
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-500" />
                    Timeline Insights
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {stats?.total_time ? Math.round(stats.total_time / 3600000000000) : 0}h
                      </div>
                      <div className="text-sm text-gray-600">Total Active</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats?.context_switches || 0}
                      </div>
                      <div className="text-sm text-gray-600">Context Switches</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Object.keys(stats?.by_app || {}).length}
                      </div>
                      <div className="text-sm text-gray-600">Apps Used</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {activities?.filter(a => a.has_screenshot).length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Screenshots</div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <h4 className="font-medium text-indigo-900 mb-2">📅 Timeline Navigation Tips</h4>
                    <ul className="text-sm text-indigo-700 space-y-1">
                      <li>• <strong>Hour View:</strong> See 5-minute intervals with detailed app usage</li>
                      <li>• <strong>Day View:</strong> 24-hour overview showing dominant apps per hour</li>
                      <li>• <strong>Week View:</strong> Daily patterns across the entire week</li>
                      <li>• <strong>Month View:</strong> High-level daily activity patterns</li>
                      <li>• <strong>Hover any cell</strong> to see detailed app breakdowns and productivity scores</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Analytics for Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoriesCard data={stats?.by_category} isLoading={statsLoading} />
              <ActivitiesCard data={activities} isLoading={activitiesLoading} />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {selectedView === 'analytics' && (
          <div className="space-y-8">
            {/* Primary Analytics - Focus & Energy */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <FocusHeatmap data={focusPatterns} isLoading={focusLoading} />
              </div>
              <div>
                <FlowStateIndicator 
                  realTimeMetrics={realTimeMetrics} 
                  isLoading={realTimeLoading} 
                />
              </div>
            </div>

            {/* Advanced Correlation Analytics */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <AppEfficiencyRadar 
                data={advancedAnalytics?.appEfficiency} 
                isLoading={analyticsLoading} 
              />
              <EnergyProductivityScatter 
                data={advancedAnalytics?.energyMetrics} 
                isLoading={analyticsLoading} 
              />
            </div>

            {/* Behavioral Analysis */}
            <AppTransitionAnalysis data={appTransitions} isLoading={transitionsLoading} />

            {/* Activity Evidence */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">📸 Visual Activity Timeline</h3>
              <p className="text-gray-600 mb-6">Screenshots provide context for your productivity patterns and help identify what you were working on during peak performance periods.</p>
              <ScreenshotGallery activities={activities} isLoading={activitiesLoading} />
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {selectedView === 'insights' && (
          <div className="space-y-8">
            {/* Main AI Insights */}
            <ProductivityInsights 
              insights={advancedAnalytics?.insights} 
              analytics={advancedAnalytics}
              isLoading={analyticsLoading} 
            />

            {/* Supporting Evidence & Context */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Trends & Patterns */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  Weekly Performance Trend
                </h3>
                {advancedAnalytics?.weeklyTrend && (
                  <div className="space-y-3">
                    {advancedAnalytics.weeklyTrend.map((day) => (
                      <div key={day.day} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{day.day}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, day.efficiency)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 min-w-[3rem]">{day.efficiency}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Key Metrics */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-500" />
                  Key Metrics Summary
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Focus Time</span>
                    <span className="font-semibold">{stats?.total_time ? Math.round(stats.total_time / 3600000000000) : 0}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Context Switches</span>
                    <span className="font-semibold">{stats?.context_switches || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Energy Level</span>
                    <span className="font-semibold">
                      {advancedAnalytics?.energyMetrics 
                        ? Math.round(advancedAnalytics.energyMetrics.reduce((sum, m) => sum + m.energyLevel, 0) / advancedAnalytics.energyMetrics.length)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Apps Tracked</span>
                    <span className="font-semibold">{Object.keys(stats?.by_app || {}).length}</span>
                  </div>
                </div>
              </div>

              {/* Real-time State */}
              <div>
                <FlowStateIndicator 
                  realTimeMetrics={realTimeMetrics} 
                  isLoading={realTimeLoading} 
                />
              </div>
            </div>

            {/* Compact Analytics for Context */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-1 rounded-xl">
                <FocusHeatmap data={focusPatterns} isLoading={focusLoading} />
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-1 rounded-xl">
                <AppTransitionAnalysis data={appTransitions} isLoading={transitionsLoading} />
              </div>
            </div>
          </div>
        )}

        {/* System Status Footer */}
        {health && (
          <div className="mt-12 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-sm text-blue-700 mb-1">Total Activities</div>
                <div className="text-2xl font-bold text-blue-900">{health.database?.total_activities || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-sm text-green-700 mb-1">Unique Apps</div>
                <div className="text-2xl font-bold text-green-900">{health.database?.unique_apps || 0}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="text-sm text-purple-700 mb-1">Database Size</div>
                <div className="text-lg font-bold text-purple-900">
                  {health.database?.database_size_bytes 
                    ? `${(health.database.database_size_bytes / 1024 / 1024).toFixed(1)} MB`
                    : 'N/A'
                  }
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-lg">
                <div className="text-sm text-emerald-700 mb-1">Status</div>
                <div className="text-lg font-bold text-emerald-900 capitalize">{health.status}</div>
              </div>
            </div>
            {health.database?.first_activity && (
              <div className="mt-4 text-sm text-gray-600">
                Tracking since {new Date(health.database.first_activity).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Welcome Modal */}
      <WelcomeModal isOpen={showWelcome} onClose={handleWelcomeClose} />
    </div>
  );
};

export default Dashboard;