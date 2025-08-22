import React from 'react';
import { Brain, Zap, Clock, Target, Waves } from 'lucide-react';

interface FlowStateIndicatorProps {
  realTimeMetrics?: {
    currentFocusStreak: number;
    isInFlowState: boolean;
    contextSwitchRate: number;
    currentProductivity: number;
    energyLevel: number;
    qualityScore: number;
  };
  isLoading?: boolean;
}

const FlowStateIndicator: React.FC<FlowStateIndicatorProps> = ({ realTimeMetrics, isLoading }) => {
  const getFlowState = (metrics: {
    isInFlowState?: boolean;
    qualityScore?: number;
    currentFocusStreak?: number;
    contextSwitchRate?: number;
    productivityScore?: number;
    energyLevel?: number;
  } | null) => {
    if (!metrics) return { state: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100', icon: '❓' };
    
    if (metrics.isInFlowState && (metrics.qualityScore ?? 0) > 80) {
      return { state: 'Deep Flow', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: '🧘‍♂️' };
    }
    if (metrics.isInFlowState || (metrics.qualityScore ?? 0) > 70) {
      return { state: 'Flow State', color: 'text-blue-700', bg: 'bg-blue-100', icon: '🎯' };
    }
    if ((metrics.currentFocusStreak ?? 0) > 5 && (metrics.qualityScore ?? 0) > 50) {
      return { state: 'Focused', color: 'text-green-700', bg: 'bg-green-100', icon: '💚' };
    }
    if ((metrics.currentFocusStreak ?? 0) > 2) {
      return { state: 'Getting Focused', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⚡' };
    }
    if ((metrics.contextSwitchRate ?? 0) > 2) {
      return { state: 'Scattered', color: 'text-red-700', bg: 'bg-red-100', icon: '🔄' };
    }
    return { state: 'Starting Up', color: 'text-purple-700', bg: 'bg-purple-100', icon: '🚀' };
  };

  const getProductivityLevel = (score: number) => {
    if (score >= 90) return { level: 'Exceptional', color: 'text-emerald-600' };
    if (score >= 75) return { level: 'High', color: 'text-green-600' };
    if (score >= 60) return { level: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { level: 'Moderate', color: 'text-yellow-600' };
    if (score >= 20) return { level: 'Low', color: 'text-orange-600' };
    return { level: 'Very Low', color: 'text-red-600' };
  };

  const getEnergyLevel = (energy: number) => {
    if (energy >= 90) return { level: 'Peak Energy', color: 'text-emerald-600', icon: '⚡' };
    if (energy >= 75) return { level: 'High Energy', color: 'text-green-600', icon: '🔋' };
    if (energy >= 60) return { level: 'Good Energy', color: 'text-blue-600', icon: '💪' };
    if (energy >= 40) return { level: 'Moderate Energy', color: 'text-yellow-600', icon: '🌤️' };
    if (energy >= 20) return { level: 'Low Energy', color: 'text-orange-600', icon: '🔋' };
    return { level: 'Depleted', color: 'text-red-600', icon: '🪫' };
  };

  const CircularProgress = ({ value, size = 120, strokeWidth = 8, color = "#3b82f6" }: {
    value: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (value / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color }}>{value}%</div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Flow State Monitor</h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!realTimeMetrics) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Flow State Monitor</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🧘‍♂️</div>
          <p className="text-gray-500">Start working to track flow state</p>
        </div>
      </div>
    );
  }

  const flowState = getFlowState(realTimeMetrics);
  const productivityLevel = getProductivityLevel(realTimeMetrics.currentProductivity);
  const energyLevel = getEnergyLevel(realTimeMetrics.energyLevel);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900">Flow State Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${realTimeMetrics.isInFlowState ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>

      {/* Main Flow State Display */}
      <div className={`p-4 rounded-xl ${flowState.bg} border-2 border-opacity-50 mb-6`}>
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl">{flowState.icon}</span>
          <div className="text-center">
            <div className={`text-2xl font-bold ${flowState.color}`}>{flowState.state}</div>
            <div className="text-sm text-gray-600 mt-1">
              Current focus: {realTimeMetrics.currentFocusStreak} min
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="mb-2">
            <CircularProgress 
              value={realTimeMetrics.qualityScore} 
              size={80} 
              strokeWidth={6}
              color="#8b5cf6"
            />
          </div>
          <div className="text-sm font-medium text-gray-700">Quality Score</div>
        </div>

        <div className="text-center">
          <div className="mb-2">
            <CircularProgress 
              value={realTimeMetrics.currentProductivity} 
              size={80} 
              strokeWidth={6}
              color="#3b82f6"
            />
          </div>
          <div className="text-sm font-medium text-gray-700">Productivity</div>
        </div>

        <div className="text-center">
          <div className="mb-2">
            <CircularProgress 
              value={realTimeMetrics.energyLevel} 
              size={80} 
              strokeWidth={6}
              color="#10b981"
            />
          </div>
          <div className="text-sm font-medium text-gray-700">Energy Level</div>
        </div>

        <div className="text-center">
          <div className="mb-2">
            <CircularProgress 
              value={Math.max(0, 100 - (realTimeMetrics.contextSwitchRate * 20))} 
              size={80} 
              strokeWidth={6}
              color="#f59e0b"
            />
          </div>
          <div className="text-sm font-medium text-gray-700">Focus Stability</div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Productivity</span>
          </div>
          <div className={`text-lg font-bold ${productivityLevel.color}`}>
            {productivityLevel.level}
          </div>
          <div className="text-xs text-blue-700">
            {realTimeMetrics.currentProductivity.toFixed(0)}% current level
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Energy</span>
          </div>
          <div className={`text-lg font-bold ${energyLevel.color}`}>
            {energyLevel.level}
          </div>
          <div className="text-xs text-green-700">
            {energyLevel.icon} {realTimeMetrics.energyLevel.toFixed(0)}% capacity
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Focus Streak</span>
          </div>
          <div className="text-lg font-bold text-purple-900">
            {realTimeMetrics.currentFocusStreak} min
          </div>
          <div className="text-xs text-purple-700">
            {realTimeMetrics.contextSwitchRate.toFixed(1)} switches/min
          </div>
        </div>
      </div>

      {/* Flow State Tips */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
        <div className="flex items-center gap-2 mb-2">
          <Waves className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-800">🧘‍♂️ Flow State Tips</span>
        </div>
        <div className="text-sm text-indigo-700">
          {realTimeMetrics.isInFlowState ? (
            "Perfect! You're in flow state. Avoid interruptions and keep the momentum going."
          ) : realTimeMetrics.currentFocusStreak > 10 ? (
            "Great focus streak! You're close to flow state. Minimize distractions."
          ) : realTimeMetrics.contextSwitchRate > 1 ? (
            "High context switching detected. Try closing unnecessary apps and notifications."
          ) : realTimeMetrics.energyLevel < 50 ? (
            "Low energy detected. Consider a short break or change of environment."
          ) : (
            "Building focus... Set a clear intention and eliminate distractions to enter flow state."
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowStateIndicator;
