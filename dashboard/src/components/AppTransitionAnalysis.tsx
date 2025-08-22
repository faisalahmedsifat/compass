import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shuffle, ArrowRight, AlertCircle, TrendingDown, Target, Zap } from 'lucide-react';
import type { AppTransition } from '../types';

interface AppTransitionAnalysisProps {
  data?: AppTransition[];
  isLoading?: boolean;
}

const AppTransitionAnalysis: React.FC<AppTransitionAnalysisProps> = ({ data, isLoading }) => {
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

  const getTransitionColor = (frequency: number, maxFreq: number): string => {
    const intensity = frequency / maxFreq;
    if (intensity > 0.8) return '#ef4444'; // High frequency - problematic
    if (intensity > 0.6) return '#f97316'; // Medium-high
    if (intensity > 0.4) return '#eab308'; // Medium
    if (intensity > 0.2) return '#22c55e'; // Low-medium - good
    return '#3b82f6'; // Low frequency - excellent
  };

  const getTransitionQuality = (frequency: number, maxFreq: number): { label: string; color: string } => {
    const intensity = frequency / maxFreq;
    if (intensity > 0.8) return { label: 'Problematic', color: 'text-red-600' };
    if (intensity > 0.6) return { label: 'High', color: 'text-orange-600' };
    if (intensity > 0.4) return { label: 'Moderate', color: 'text-yellow-600' };
    if (intensity > 0.2) return { label: 'Good', color: 'text-green-600' };
    return { label: 'Excellent', color: 'text-blue-600' };
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Shuffle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">App Transition Analysis</h3>
        </div>
        <div className="animate-pulse">
          <div className="w-full h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
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
          <Shuffle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">App Transition Analysis</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🔄</div>
          <p className="text-gray-500">No transition data available yet</p>
          <p className="text-sm text-gray-400 mt-2">Switch between apps to see patterns</p>
        </div>
      </div>
    );
  }

  // Prepare data for analysis
  const maxFrequency = Math.max(...data.map(t => t.frequency));
  const sortedTransitions = [...data].sort((a, b) => b.frequency - a.frequency);
  const topTransitions = sortedTransitions.slice(0, 10);

  // Calculate metrics
  const totalTransitions = data.reduce((sum, t) => sum + t.frequency, 0);
  const avgDuration = data.reduce((sum, t) => sum + t.avgDuration * t.frequency, 0) / totalTransitions;
  const problematicTransitions = data.filter(t => t.frequency > maxFrequency * 0.6);
  
  // Group by from/to apps for insights
  const fromAppFreq = data.reduce((acc, t) => {
    acc[t.fromApp] = (acc[t.fromApp] || 0) + t.frequency;
    return acc;
  }, {} as Record<string, number>);

  const toAppFreq = data.reduce((acc, t) => {
    acc[t.toApp] = (acc[t.toApp] || 0) + t.frequency;
    return acc;
  }, {} as Record<string, number>);

  const mostDistracting = Object.entries(fromAppFreq).sort(([, a], [, b]) => b - a)[0];
  const mostAttractive = Object.entries(toAppFreq).sort(([, a], [, b]) => b - a)[0];

  // Chart data
  const chartData = topTransitions.map(t => ({
    name: `${t.fromApp} → ${t.toApp}`,
    frequency: t.frequency,
    avgDuration: Math.round(t.avgDuration / 60), // Convert to minutes
    fullTransition: t
  }));

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: { fullTransition: AppTransition } }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload.fullTransition;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-orange-600">Frequency: {data.frequency} times</p>
            <p className="text-blue-600">Avg Duration: {Math.round(data.avgDuration / 60)}m</p>
            <p className="text-purple-600">Category: {data.category}</p>
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
          <Shuffle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">App Transition Analysis</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Target className="w-4 h-4" />
          <span>{totalTransitions} total switches</span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Shuffle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">Total Switches</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">{totalTransitions}</div>
          <div className="text-xs text-orange-700">
            {problematicTransitions.length} problematic
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowRight className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Avg Duration</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {Math.round(avgDuration / 60)}m
          </div>
          <div className="text-xs text-blue-700">Per session</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Most Distracting</span>
          </div>
          <div className="text-lg font-bold text-purple-900 flex items-center gap-1">
            <span>{getAppIcon(mostDistracting[0])}</span>
            <span className="truncate text-sm">{mostDistracting[0]}</span>
          </div>
          <div className="text-xs text-purple-700">{mostDistracting[1]} exits</div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Most Attractive</span>
          </div>
          <div className="text-lg font-bold text-green-900 flex items-center gap-1">
            <span>{getAppIcon(mostAttractive[0])}</span>
            <span className="truncate text-sm">{mostAttractive[0]}</span>
          </div>
          <div className="text-xs text-green-700">{mostAttractive[1]} entries</div>
        </div>
      </div>

      {/* Transition Frequency Chart */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Most Frequent Transitions</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={150}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="frequency" name="Frequency">
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getTransitionColor(entry.frequency, maxFrequency)} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Transition List */}
      <div className="mb-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Transition Details</h4>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {topTransitions.map((transition, index) => {
            const quality = getTransitionQuality(transition.frequency, maxFrequency);
            return (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getAppIcon(transition.fromApp)}</span>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                  <span className="text-lg">{getAppIcon(transition.toApp)}</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {transition.fromApp} → {transition.toApp}
                    </div>
                    <div className="text-sm text-gray-600">
                      {transition.category} • {Math.round(transition.avgDuration / 60)}m avg
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    {transition.frequency}x
                  </div>
                  <div className={`text-sm ${quality.color}`}>
                    {quality.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">⚠️ Context Switch Warning</span>
          </div>
          <p className="text-sm text-amber-700">
            {problematicTransitions.length > 0 
              ? `${problematicTransitions.length} high-frequency transitions detected. Consider batching similar tasks to reduce context switching.`
              : "Great! No problematic transition patterns detected. Your workflow seems efficient."
            }
          </p>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">🎯 Optimization Tip</span>
          </div>
          <p className="text-sm text-indigo-700">
            {avgDuration < 300 
              ? `Short sessions detected (${Math.round(avgDuration / 60)}m avg). Try extending focus periods to 25+ minutes for better productivity.`
              : `Good session length (${Math.round(avgDuration / 60)}m avg). Maintain this rhythm for optimal focus.`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppTransitionAnalysis;
