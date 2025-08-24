import { Calendar, Clock, TrendingUp, Zap } from 'lucide-react';
import React, { useState } from 'react';
import {
    useBackfillAggregations,
    useCustomTimeRange,
    useTimeSlotDetails,
    useTimelinePerformance
} from '../hooks/useOptimizedTimelineApi';

interface OptimizedTimelineViewProps {
  selectedPeriod?: string;
  selectedDate?: Date;
}

const OptimizedTimelineView: React.FC<OptimizedTimelineViewProps> = ({
  selectedPeriod = 'day',
  selectedDate = new Date()
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showPerformance, setShowPerformance] = useState(false);
  
  // Map selectedPeriod string to our view mode type
  const viewMode = selectedPeriod as 'hour' | 'day' | 'week' | 'month';
  
  // Use optimized timeline data
  const { timeRange, slots, summary, isLoading, error } = useCustomTimeRange(viewMode, selectedDate);
  
  // Get details for selected slot
  const { data: slotDetails } = useTimeSlotDetails(
    selectedSlot, 
    timeRange.granularity, 
    true
  );
  
  // Admin functions
  const backfillAggregations = useBackfillAggregations();
  const performanceTest = useTimelinePerformance();

  const handleBackfill = async () => {
    await backfillAggregations.refetch();
  };

  const formatTime = (seconds: number): string => {
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    return `${Math.floor(seconds / 60)}m`;
  };

  const getAppIcon = (appName: string): string => {
    const name = appName.toLowerCase();
    if (name.includes('code') || name.includes('cursor') || name.includes('vim')) return '💻';
    if (name.includes('chrome') || name.includes('firefox') || name.includes('safari')) return '🌐';
    if (name.includes('terminal') || name.includes('iterm')) return '⚡';
    if (name.includes('slack') || name.includes('discord')) return '💬';
    if (name.includes('spotify') || name.includes('music')) return '🎵';
    if (name.includes('figma') || name.includes('sketch')) return '🎨';
    if (name.includes('notion') || name.includes('obsidian')) return '📝';
    return '🔧';
  };

  if (error) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️ Timeline optimization not available</div>
          <p className="text-gray-600 mb-4">
            Your backend doesn't have the optimized timeline endpoints yet. 
            This component requires the new API endpoints to function efficiently.
          </p>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">To enable optimization:</h4>
            <ol className="text-sm text-yellow-700 text-left space-y-1">
              <li>1. Add the optimized query functions to your backend</li>
              <li>2. Add the new timeline API endpoints</li>
              <li>3. Run database optimizations to add indexes</li>
              <li>4. Restart your Compass daemon</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Performance Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-900">⚡ Optimized Timeline</h2>
            <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-sm font-medium">
              Efficient Queries
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleBackfill}
              disabled={backfillAggregations.isFetching}
              className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              {backfillAggregations.isFetching ? 'Processing...' : 'Rebuild Aggregations'}
            </button>
            <button
              onClick={() => {
                setShowPerformance(!showPerformance);
                if (!showPerformance) performanceTest.refetch();
              }}
              className="px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Performance Test
            </button>
          </div>
        </div>

        {/* Performance Results */}
        {showPerformance && performanceTest.data && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-3">📊 API Performance Comparison</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performanceTest.data.endpoints.map((endpoint) => (
                <div key={endpoint.name} className="bg-white p-3 rounded border">
                  <div className="font-medium text-gray-900 capitalize">{endpoint.name}</div>
                  <div className="text-sm text-gray-600">
                    {endpoint.success ? (
                      <>
                        <div>⏱️ {endpoint.responseTime.toFixed(0)}ms</div>
                        <div>📦 {(endpoint.dataSize / 1024).toFixed(1)}KB</div>
                      </>
                    ) : (
                      <div className="text-red-600">❌ {endpoint.error || 'Failed'}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Total test time: {performanceTest.data.totalTime.toFixed(0)}ms
            </div>
          </div>
        )}
      </div>

      {/* Timeline Grid */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="animate-pulse">
            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View - {selectedDate.toLocaleDateString()}
            </h3>
            <div className="text-sm text-gray-600">
              {slots.data?.meta?.data_points || 0} data points • {timeRange.granularity} intervals
            </div>
          </div>

          {/* Time Slot Grid */}
          <div className={`grid gap-2 ${
            viewMode === 'hour' ? 'grid-cols-6 md:grid-cols-12' :
            viewMode === 'day' ? 'grid-cols-6 md:grid-cols-12' :
            viewMode === 'week' ? 'grid-cols-7' :
            'grid-cols-7 md:grid-cols-10'
          }`}>
            {slots.data?.data?.map((slot: any) => {
              const dominantApp = Object.entries(slot.app_breakdown)
                .sort(([,a], [,b]) => (b as any).total_time - (a as any).total_time)[0];
              
              const intensity = slot.total_time > 0 ? Math.min(100, (slot.total_time / 3600) * 100) : 0;
              
              const getIntensityColor = (intensity: number) => {
                if (intensity > 80) return 'bg-green-500';
                if (intensity > 60) return 'bg-blue-500'; 
                if (intensity > 40) return 'bg-yellow-500';
                if (intensity > 20) return 'bg-orange-500';
                return 'bg-red-500';
              };

              return (
                <div key={slot.time_slot} className="space-y-1">
                  <div className="text-xs font-medium text-gray-600 text-center p-1">
                    {new Date(slot.time_slot).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                  <div
                    className={`h-12 border border-gray-200 rounded cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                      slot.total_time > 0 ? getIntensityColor(intensity) + ' opacity-80' : 'bg-gray-100'
                    }`}
                    onClick={() => setSelectedSlot(slot.time_slot)}
                    title={`Click for details - ${formatTime(slot.total_time)} total`}
                  >
                    {dominantApp ? (
                      <div className="h-full p-2 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-800">
                            {getAppIcon(dominantApp[0])}
                          </span>
                          <span className="text-xs text-gray-600">
                            {formatTime(slot.total_time)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-700 truncate font-medium">
                          {dominantApp[0]}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-xs text-gray-400">No Activity</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Period Summary */}
      {summary.data && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            📊 Optimized Period Summary
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Applications */}
            <div>
              <h4 className="font-medium text-blue-800 mb-3">Top Applications</h4>
              <div className="space-y-2">
                {Object.entries(summary.data.app_totals)
                  .sort(([,a], [,b]) => b.total_time - a.total_time)
                  .slice(0, 6)
                  .map(([app, data]) => (
                    <div key={app} className="flex items-center justify-between bg-white p-3 rounded border">
                      <div className="flex items-center gap-2">
                        <span>{getAppIcon(app)}</span>
                        <div>
                          <div className="font-medium text-gray-900">{app}</div>
                          <div className="text-xs text-gray-500">{data.activity_count} activities</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-900">{formatTime(data.total_time)}</div>
                        <div className="text-xs text-blue-600">{data.percentage.toFixed(0)}%</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Overall Stats */}
            <div>
              <h4 className="font-medium text-blue-800 mb-3">Period Overview</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {formatTime(summary.data.summary.total_time)}
                  </div>
                  <div className="text-sm text-blue-700">Total Active Time</div>
                </div>
                <div className="bg-white p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-900">
                    {summary.data.summary.unique_apps}
                  </div>
                  <div className="text-sm text-blue-700">Applications Used</div>
                </div>
              </div>
              
              <div className="mt-3 bg-white p-4 rounded-lg">
                <h5 className="font-medium text-gray-900 mb-2">Categories</h5>
                <div className="space-y-2">
                  {Object.entries(summary.data.category_totals)
                    .sort(([,a], [,b]) => b.total_time - a.total_time)
                    .map(([category, data]) => (
                      <div key={category} className="flex justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span>{formatTime(data.total_time)} ({data.percentage.toFixed(0)}%)</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Slot Details */}
      {selectedSlot && slotDetails && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-500" />
              Time Slot Details: {new Date(selectedSlot).toLocaleString()}
            </h3>
            <button
              onClick={() => setSelectedSlot(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-purple-900">
                {formatTime(slotDetails.summary.total_time)}
              </div>
              <div className="text-sm text-purple-700">Total Time</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-green-900">
                {slotDetails.summary.productivity_score.toFixed(0)}%
              </div>
              <div className="text-sm text-green-700">Productivity</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-orange-900">
                {slotDetails.summary.context_switches}
              </div>
              <div className="text-sm text-orange-700">Context Switches</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-xl font-bold text-blue-900">
                {slotDetails.summary.activity_count}
              </div>
              <div className="text-sm text-blue-700">Activities</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">App Breakdown</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {Object.entries(slotDetails.summary.app_breakdown)
                  .sort(([,a], [,b]) => b - a)
                  .map(([app, time]) => (
                    <div key={app} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                      <span className="flex items-center gap-2">
                        {getAppIcon(app)} {app}
                      </span>
                      <span className="font-medium">{formatTime(time)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Activities</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {slotDetails.activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="text-sm bg-gray-50 p-2 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{activity.app_name}</div>
                        <div className="text-gray-600 text-xs truncate">{activity.window_title}</div>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Status */}
      {backfillAggregations.data && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-green-800">
            ✅ <strong>{backfillAggregations.data.data?.message || 'Aggregations rebuilt successfully'}</strong>
          </div>
          <div className="text-xs text-green-600 mt-1">
            Aggregations are now up to date
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedTimelineView;
