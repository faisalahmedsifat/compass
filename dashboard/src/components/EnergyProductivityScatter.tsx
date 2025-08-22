import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Zap, TrendingUp, Brain, Activity } from 'lucide-react';
import type { EnergyMetrics } from '../types';

interface EnergyProductivityScatterProps {
  data?: EnergyMetrics[];
  isLoading?: boolean;
}

const EnergyProductivityScatter: React.FC<EnergyProductivityScatterProps> = ({ data, isLoading }) => {
  const getCorrelationColor = (correlation: number): string => {
    if (correlation > 0.8) return 'text-green-600 bg-green-50';
    if (correlation > 0.6) return 'text-blue-600 bg-blue-50';
    if (correlation > 0.4) return 'text-yellow-600 bg-yellow-50';
    if (correlation > 0.2) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getCorrelationStrength = (correlation: number): string => {
    if (correlation > 0.8) return 'Very Strong';
    if (correlation > 0.6) return 'Strong';
    if (correlation > 0.4) return 'Moderate';
    if (correlation > 0.2) return 'Weak';
    return 'Very Weak';
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Energy-Productivity Correlation</h3>
        </div>
        <div className="animate-pulse">
          <div className="w-full h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Energy-Productivity Correlation</h3>
        </div>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-gray-500">No energy data available yet</p>
          <p className="text-sm text-gray-400 mt-2">Track your activities to see energy patterns</p>
        </div>
      </div>
    );
  }

  // Prepare scatter plot data
  const scatterData = data.map((point) => ({
    energy: point.energyLevel,
    productivity: point.productivity,
    contextSwitches: point.contextSwitches,
    flowState: point.flowState * 100, // Convert to percentage
    timestamp: point.timestamp,
    hour: new Date(point.timestamp).getHours(),
    size: Math.max(20, Math.min(400, point.contextSwitches * 10)) // Bubble size based on context switches
  }));

  // Calculate correlation coefficient
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const energyLevels = scatterData.map(d => d.energy);
  const productivityLevels = scatterData.map(d => d.productivity);
  const correlation = calculateCorrelation(energyLevels, productivityLevels);

  // Find optimal energy range
  const highProductivityPoints = scatterData.filter(d => d.productivity > 75);
  const optimalEnergyRange = highProductivityPoints.length > 0 
    ? {
        min: Math.min(...highProductivityPoints.map(d => d.energy)),
        max: Math.max(...highProductivityPoints.map(d => d.energy))
      }
    : { min: 60, max: 100 };

  // Best performing time
  const bestPoint = scatterData.reduce((best, current) => 
    current.productivity > best.productivity ? current : best
  , scatterData[0]);

  const CustomTooltip = ({ active, payload }: {
    active?: boolean;
    payload?: Array<{ payload: { energy: number; productivity: number; contextSwitches: number; flowState: number; timestamp: string } }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">
            {new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="space-y-1 text-sm">
            <p className="text-purple-600">Energy: {data.energy.toFixed(0)}%</p>
            <p className="text-blue-600">Productivity: {data.productivity.toFixed(0)}%</p>
            <p className="text-orange-600">Context Switches: {data.contextSwitches}</p>
            <p className="text-green-600">Flow State: {data.flowState.toFixed(0)}%</p>
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
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Energy-Productivity Correlation</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>Last 24 hours</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Scatter Chart */}
        <div className="lg:col-span-3">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="energy" 
                name="Energy Level"
                domain={[0, 100]}
                label={{ value: 'Energy Level (%)', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                dataKey="productivity" 
                name="Productivity Score"
                domain={[0, 100]}
                label={{ value: 'Productivity (%)', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Reference lines for optimal zones */}
              <ReferenceLine x={optimalEnergyRange.min} stroke="#10b981" strokeDasharray="2 2" />
              <ReferenceLine x={optimalEnergyRange.max} stroke="#10b981" strokeDasharray="2 2" />
              <ReferenceLine y={75} stroke="#3b82f6" strokeDasharray="2 2" />
              
              <Scatter 
                name="Energy vs Productivity" 
                data={scatterData} 
                fill="#8b5cf6"
                fillOpacity={0.6}
                strokeWidth={2}
                stroke="#7c3aed"
              />
              <Tooltip content={<CustomTooltip />} />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Chart Legend */}
          <div className="mt-4 text-sm text-gray-600">
            <p>Bubble size represents context switches • Green lines mark optimal energy zone • Blue line shows high productivity threshold</p>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border ${getCorrelationColor(correlation)}`}>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Correlation</span>
            </div>
            <div className="text-2xl font-bold">{(correlation * 100).toFixed(0)}%</div>
            <div className="text-xs">{getCorrelationStrength(correlation)}</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Optimal Zone</span>
            </div>
            <div className="text-lg font-bold text-green-900">
              {optimalEnergyRange.min}% - {optimalEnergyRange.max}%
            </div>
            <div className="text-xs text-green-700">Energy sweet spot</div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Peak Performance</span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              {bestPoint.hour}:00
            </div>
            <div className="text-xs text-blue-700">
              {bestPoint.productivity.toFixed(0)}% productivity
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Flow Score</span>
            </div>
            <div className="text-lg font-bold text-purple-900">
              {(data.reduce((sum, d) => sum + d.flowState, 0) / data.length * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-purple-700">Average flow state</div>
          </div>
        </div>
      </div>

      {/* Insights Row */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">⚡ Energy Insight</span>
          </div>
          <p className="text-sm text-amber-700">
            {correlation > 0.6 
              ? `Strong correlation detected! Your productivity increases by ~${(correlation * 100).toFixed(0)}% with higher energy.`
              : `Weak correlation suggests productivity depends on factors beyond energy level.`
            }
          </p>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">🎯 Optimization</span>
          </div>
          <p className="text-sm text-indigo-700">
            {optimalEnergyRange.min > 70 
              ? `Maintain energy above ${optimalEnergyRange.min}% for peak performance. Consider breaks when below 60%.`
              : `Track patterns: High productivity occurs at various energy levels. Focus on consistency.`
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnergyProductivityScatter;
