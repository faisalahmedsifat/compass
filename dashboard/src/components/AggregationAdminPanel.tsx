import { AlertCircle, CheckCircle, Clock, Database, RefreshCw, Settings } from 'lucide-react';
import React, { useState } from 'react';
import { useAggregationStatus, useBackfillAggregations } from '../hooks/useOptimizedTimelineApi';

const AggregationAdminPanel: React.FC = () => {
  const [isBackfilling, setIsBackfilling] = useState(false);
  const statusQuery = useAggregationStatus();
  const backfillMutation = useBackfillAggregations();

  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      await backfillMutation.refetch();
      await statusQuery.refetch();
    } catch (error) {
      console.error('Backfill failed:', error);
    }
    setIsBackfilling(false);
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? 'text-green-600' : 'text-yellow-600';
  };

  const getStatusIcon = (enabled: boolean) => {
    return enabled ? CheckCircle : AlertCircle;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900">Aggregation Management</h3>
      </div>

      {/* Status Overview */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          System Status
        </h4>
        
        {statusQuery.isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : statusQuery.error ? (
          <div className="text-red-600 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Failed to load status: {statusQuery.error.message}
          </div>
        ) : statusQuery.data?.success ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {React.createElement(getStatusIcon(statusQuery.data.data?.enabled || false), {
                  className: `w-4 h-4 ${getStatusColor(statusQuery.data.data?.enabled || false)}`
                })}
                <span className="text-sm font-medium">Aggregation Engine</span>
              </div>
              <span className={`text-sm font-medium ${getStatusColor(statusQuery.data.data?.enabled || false)}`}>
                {statusQuery.data.data?.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            {statusQuery.data.data?.last_run && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Last Aggregation</span>
                </div>
                <span className="text-sm text-gray-600">
                  {new Date(statusQuery.data.data.last_run).toLocaleString()}
                </span>
              </div>
            )}

            {statusQuery.data.data?.statistics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(statusQuery.data.data.statistics).map(([granularity, count]) => (
                  <div key={granularity} className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-900">{count as number}</div>
                    <div className="text-xs text-blue-700 capitalize">{granularity}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500">No status data available</div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-800 mb-3">Actions</h4>
        <div className="space-y-3">
          <button
            onClick={handleBackfill}
            disabled={isBackfilling}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isBackfilling ? 'animate-spin' : ''}`} />
            {isBackfilling ? 'Processing...' : 'Rebuild Aggregations'}
          </button>
          
          <button
            onClick={() => statusQuery.refetch()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h4 className="text-md font-medium text-gray-800 mb-3">Performance Info</h4>
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>Timeline API:</span>
            <span className="font-mono">~100-300x faster</span>
          </div>
          <div className="flex justify-between">
            <span>Data Points:</span>
            <span>Pre-aggregated by time</span>
          </div>
          <div className="flex justify-between">
            <span>Granularities:</span>
            <span>6 levels (min → year)</span>
          </div>
          <div className="text-xs text-gray-500 mt-3 p-2 bg-gray-50 rounded">
            💡 Aggregations are updated automatically when new activities are captured.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AggregationAdminPanel;

