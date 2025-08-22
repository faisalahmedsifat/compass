import React from 'react';
import { Activity, Compass, BarChart3, Clock } from 'lucide-react';
import { useCurrentWorkspace, useActivities, useStats, useHealth } from '../hooks/useCompassApi';
import CurrentWorkspaceCard from './CurrentWorkspaceCard';
import StatsCard from './StatsCard';
import ActivitiesCard from './ActivitiesCard';
import CategoriesCard from './CategoriesCard';
import ConnectionStatus from './ConnectionStatus';

const Dashboard: React.FC = () => {
  const { data: currentWorkspace, isLoading: workspaceLoading } = useCurrentWorkspace();
  const { data: activities, isLoading: activitiesLoading } = useActivities();
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: health, isError: healthError } = useHealth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Compass className="h-8 w-8 text-primary-600" />
              <h1 className="text-2xl font-bold text-gray-900">Compass Dashboard</h1>
            </div>
            <ConnectionStatus isConnected={!healthError} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Workspace - Takes 2 columns */}
          <div className="lg:col-span-2">
            <CurrentWorkspaceCard data={currentWorkspace} isLoading={workspaceLoading} />
          </div>

          {/* Today's Summary */}
          <div>
            <StatsCard data={stats} isLoading={statsLoading} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Top Categories */}
          <CategoriesCard data={stats?.by_category} isLoading={statsLoading} />

          {/* Recent Activities */}
          <ActivitiesCard data={activities} isLoading={activitiesLoading} />
        </div>

        {/* API Status Footer */}
        {health && (
          <div className="mt-12 p-4 bg-white rounded-lg shadow-soft border border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-2">System Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Activities:</span>
                <span className="ml-2 font-medium">{health.database?.total_activities || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Unique Apps:</span>
                <span className="ml-2 font-medium">{health.database?.unique_apps || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Database Size:</span>
                <span className="ml-2 font-medium">
                  {health.database?.database_size_bytes 
                    ? `${(health.database.database_size_bytes / 1024 / 1024).toFixed(1)} MB`
                    : 'N/A'
                  }
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2 font-medium text-green-600">{health.status}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;