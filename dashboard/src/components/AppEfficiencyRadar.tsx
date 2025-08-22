import { Award, Clock, Zap } from 'lucide-react';
import React from 'react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { AdvancedAnalytics } from '../types';

interface AppEfficiencyRadarProps {
  data?: AdvancedAnalytics['appEfficiency'];
  isLoading?: boolean;
}

const AppEfficiencyRadar: React.FC<AppEfficiencyRadarProps> = ({ data, isLoading }) => {
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

  const getEfficiencyColor = (efficiency: number): string => {
    if (efficiency >= 90) return 'text-green-600 bg-green-50';
    if (efficiency >= 75) return 'text-blue-600 bg-blue-50';
    if (efficiency >= 60) return 'text-yellow-600 bg-yellow-50';
    if (efficiency >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getEfficiencyGrade = (efficiency: number): string => {
    if (efficiency >= 90) return 'A+';
    if (efficiency >= 80) return 'A';
    if (efficiency >= 70) return 'B';
    if (efficiency >= 60) return 'C';
    if (efficiency >= 50) return 'D';
    return 'F';
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">App Efficiency Analysis</h3>
        </div>
        <div className="animate-pulse">
          <div className="w-full h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">App Efficiency Analysis</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📊</div>
          <p className="text-gray-500">No efficiency data available yet</p>
          <p className="text-sm text-gray-400 mt-2">Use apps for a while to see efficiency patterns</p>
        </div>
      </div>
    );
  }

  // Prepare data for radar chart - top 6 apps only
  const radarData = data.slice(0, 6).map(app => ({
    app: app.app.length > 10 ? app.app.substring(0, 10) + '...' : app.app,
    fullName: app.app,
    efficiency: app.efficiency,
    timeSpent: Math.min(100, (app.timeSpent / 120) * 100), // Normalize to 0-100 (2 hours = 100%)
    outputScore: app.outputScore,
    avgFocus: Math.min(100, (app.avgFocusDuration / 600) * 100) // 10 min = 100%
  }));

  const topPerformer = data[0];
  const avgEfficiency = data.reduce((sum, app) => sum + app.efficiency, 0) / data.length;
  const totalProductiveTime = data.reduce((sum, app) => sum + app.timeSpent, 0);

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; dataKey: string; color: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const appData = radarData.find(app => app.app === label);
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{appData?.fullName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">Efficiency: {payload[0]?.value}%</p>
            <p className="text-green-600">Time Spent: {payload[1]?.value.toFixed(0)}%</p>
            <p className="text-purple-600">Output Score: {payload[2]?.value}%</p>
            <p className="text-orange-600">Avg Focus: {payload[3]?.value.toFixed(0)}%</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900">App Efficiency Analysis</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Award className="w-4 h-4" />
          <span>Performance Radar</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <div className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="app" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fontSize: 10 }}
                tickCount={5}
              />
              <Radar 
                name="Efficiency" 
                dataKey="efficiency" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Radar 
                name="Time Usage" 
                dataKey="timeSpent" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar 
                name="Output Score" 
                dataKey="outputScore" 
                stroke="#8b5cf6" 
                fill="#8b5cf6" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Radar 
                name="Avg Focus" 
                dataKey="avgFocus" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Efficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Time Usage</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Output Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Avg Focus</span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getAppIcon(topPerformer.app)}</span>
              <div>
                <div className="text-sm font-medium text-green-800">Top Performer</div>
                <div className="text-lg font-bold text-green-900">{topPerformer.app}</div>
              </div>
            </div>
            <div className="text-sm text-green-700">
              {topPerformer.efficiency}% efficiency • {topPerformer.timeSpent}m used
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <div className="text-sm font-medium text-blue-800">Total Productive Time</div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {Math.round(totalProductiveTime / 60)}h {totalProductiveTime % 60}m
            </div>
            <div className="text-sm text-blue-700">
              Avg efficiency: {avgEfficiency.toFixed(0)}%
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-800 mb-3">App Grades</div>
            <div className="space-y-2">
              {data.slice(0, 4).map(app => (
                <div key={app.app} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getAppIcon(app.app)}</span>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {app.app.length > 12 ? app.app.substring(0, 12) + '...' : app.app}
                    </span>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${getEfficiencyColor(app.efficiency)}`}>
                    {getEfficiencyGrade(app.efficiency)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">💡 Efficiency Tip</span>
          </div>
          <p className="text-sm text-amber-700">
            {topPerformer.efficiency > 80 
              ? `Great efficiency with ${topPerformer.app}! Try applying similar focus patterns to other apps.`
              : `Consider longer focus sessions with ${topPerformer.app} to boost efficiency beyond ${topPerformer.efficiency}%.`
            }
          </p>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">📊 Pattern Analysis</span>
          </div>
          <p className="text-sm text-indigo-700">
            {avgEfficiency > 70 
              ? `Excellent overall efficiency at ${avgEfficiency.toFixed(0)}%. You're in the top productivity tier!`
              : `Room for improvement: ${(80 - avgEfficiency).toFixed(0)}% boost potential across all apps.`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppEfficiencyRadar;
