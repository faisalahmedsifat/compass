import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    Heart,
    RefreshCw,
    Server,
    Shield,
    TrendingUp,
    XCircle,
    Zap
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface SystemHealthPanelProps {
  health: any;
  healthError: boolean;
}

interface BufferStats {
  buffer_size: number;
  max_buffer_size: number;
  failed_activities: number;
  max_retry_attempts: number;
  batch_size: number;
  buffer_usage_pct: number;
}

const SystemHealthPanel: React.FC<SystemHealthPanelProps> = ({ health, healthError }) => {
  const [bufferStats, setBufferStats] = useState<BufferStats | null>(null);
  const [bufferLoading, setBufferLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchBufferStats();
    const interval = setInterval(fetchBufferStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBufferStats = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/buffer-stats');
      if (response.ok) {
        const stats = await response.json();
        setBufferStats(stats);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch buffer stats:', error);
    } finally {
      setBufferLoading(false);
    }
  };

  const getHealthStatus = () => {
    if (healthError || !health) {
      return { status: 'error', label: 'Offline', color: 'text-red-600 bg-red-50' };
    }
    
    if (bufferStats) {
      if (bufferStats.failed_activities > 0) {
        return { status: 'warning', label: 'Issues Detected', color: 'text-yellow-600 bg-yellow-50' };
      }
      if (bufferStats.buffer_usage_pct > 80) {
        return { status: 'warning', label: 'High Load', color: 'text-yellow-600 bg-yellow-50' };
      }
    }
    
    return { status: 'healthy', label: 'Healthy', color: 'text-green-600 bg-green-50' };
  };

  const getBufferHealthIcon = () => {
    if (!bufferStats) return <Heart className="h-5 w-5 text-gray-400" />;
    
    if (bufferStats.failed_activities > 0) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
    
    if (bufferStats.buffer_usage_pct > 80) {
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    }
    
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">System Health</h2>
              <p className="text-gray-600">Monitor performance and data integrity</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchBufferStats}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={bufferLoading}
            >
              <RefreshCw className={`h-4 w-4 ${bufferLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm ${healthStatus.color}`}>
              {healthStatus.status === 'healthy' && <CheckCircle className="h-4 w-4" />}
              {healthStatus.status === 'warning' && <AlertTriangle className="h-4 w-4" />}
              {healthStatus.status === 'error' && <XCircle className="h-4 w-4" />}
              <span className="font-medium">{healthStatus.label}</span>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Server className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {healthError ? 'Offline' : 'Online'}
            </p>
            <p className="text-sm text-gray-600">API Status</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Database className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {health?.database?.total_activities || 0}
            </p>
            <p className="text-sm text-gray-600">Total Activities</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Zap className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {bufferStats?.buffer_size || 0}
            </p>
            <p className="text-sm text-gray-600">Buffered Events</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Shield className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {bufferStats?.failed_activities || 0}
            </p>
            <p className="text-sm text-gray-600">Failed Events</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Activity Buffer Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activity Buffer</h3>
            {getBufferHealthIcon()}
          </div>
          
          {bufferLoading ? (
            <div className="animate-pulse space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : bufferStats ? (
            <div className="space-y-4">
              {/* Buffer Usage */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Buffer Usage</span>
                  <span className="font-medium">{bufferStats.buffer_size}/{bufferStats.max_buffer_size}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      bufferStats.buffer_usage_pct > 80 ? 'bg-red-500' :
                      bufferStats.buffer_usage_pct > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, bufferStats.buffer_usage_pct)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {bufferStats.buffer_usage_pct.toFixed(1)}% utilized
                </p>
              </div>

              {/* Buffer Configuration */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Batch Size</span>
                  <span className="font-medium">{bufferStats.batch_size} events</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Retries</span>
                  <span className="font-medium">{bufferStats.max_retry_attempts}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Failed Events</span>
                  <span className={`font-medium ${bufferStats.failed_activities > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {bufferStats.failed_activities}
                  </span>
                </div>
              </div>

              {/* Buffer Status */}
              <div className="pt-3 border-t">
                <div className={`text-sm p-2 rounded ${
                  bufferStats.failed_activities > 0 ? 'bg-red-50 text-red-700' :
                  bufferStats.buffer_usage_pct > 80 ? 'bg-yellow-50 text-yellow-700' :
                  'bg-green-50 text-green-700'
                }`}>
                  {bufferStats.failed_activities > 0 ? (
                    `⚠️ ${bufferStats.failed_activities} events need retry`
                  ) : bufferStats.buffer_usage_pct > 80 ? (
                    '⚡ High buffer usage - system under load'
                  ) : (
                    '✅ Buffer operating normally'
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
              <p>Unable to load buffer statistics</p>
            </div>
          )}
        </div>

        {/* Database Health */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Database Health</h3>
            <Database className={`h-5 w-5 ${health ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          
          {health?.database ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Activities</span>
                  <span className="font-medium">{health.database.total_activities?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Unique Apps</span>
                  <span className="font-medium">{health.database.unique_apps}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Database Size</span>
                  <span className="font-medium">
                    {health.database.database_size_bytes ? 
                      `${(health.database.database_size_bytes / 1024 / 1024).toFixed(1)} MB` : 
                      'Unknown'}
                  </span>
                </div>
              </div>

              {/* Recent Activity Times */}
              <div className="pt-3 border-t">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">First Activity</div>
                  <div className="text-sm font-medium">
                    {health.database.first_activity ? 
                      new Date(health.database.first_activity).toLocaleString() : 
                      'No data'}
                  </div>
                </div>
                <div className="space-y-1 mt-2">
                  <div className="text-xs text-gray-500">Last Activity</div>
                  <div className="text-sm font-medium">
                    {health.database.last_activity ? 
                      new Date(health.database.last_activity).toLocaleString() : 
                      'No data'}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 text-green-700 text-sm p-2 rounded">
                ✅ Database is healthy and operational
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
              <p>Database connection unavailable</p>
            </div>
          )}
        </div>
      </div>

      {/* System Performance Insights */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-4 bg-blue-50 rounded-lg mb-2">
              <TrendingUp className="h-8 w-8 text-blue-600 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900">Real-time Tracking</h4>
            <p className="text-sm text-gray-600 mt-1">
              Events processed with 100ms precision using adaptive polling and event-driven architecture.
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-green-50 rounded-lg mb-2">
              <Shield className="h-8 w-8 text-green-600 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900">Data Protection</h4>
            <p className="text-sm text-gray-600 mt-1">
              Activity buffering ensures zero data loss with automatic retry and batch processing.
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-4 bg-purple-50 rounded-lg mb-2">
              <Zap className="h-8 w-8 text-purple-600 mx-auto" />
            </div>
            <h4 className="font-medium text-gray-900">Smart Optimization</h4>
            <p className="text-sm text-gray-600 mt-1">
              Idle detection and intelligent focus tracking maximize accuracy while minimizing overhead.
            </p>
          </div>
        </div>
      </div>

      {/* Last Update Info */}
      <div className="text-center text-sm text-gray-500">
        <Clock className="h-4 w-4 inline mr-1" />
        Last updated: {lastUpdate.toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SystemHealthPanel;
