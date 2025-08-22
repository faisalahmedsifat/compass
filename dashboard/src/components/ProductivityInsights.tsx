import React from 'react';
import { Brain, Lightbulb, TrendingUp, Target, Clock, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import type { AdvancedAnalytics } from '../types';

interface ProductivityInsightsProps {
  insights?: AdvancedAnalytics['insights'];
  analytics?: AdvancedAnalytics;
  isLoading?: boolean;
}

const ProductivityInsights: React.FC<ProductivityInsightsProps> = ({ insights, analytics, isLoading }) => {
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'medium': return <TrendingUp className="w-4 h-4" />;
      case 'low': return <CheckCircle className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-red-500 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-green-500 bg-green-50 text-green-800';
      default: return 'border-blue-500 bg-blue-50 text-blue-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization': return '🎯';
      case 'pattern': return '📈';
      case 'recommendation': return '💡';
      default: return '🔍';
    }
  };

  // Generate additional insights based on analytics data
  const generateAdditionalInsights = (analytics: AdvancedAnalytics) => {
    const additionalInsights = [];

    // App efficiency insight
    if (analytics.appEfficiency.length > 0) {
      const topApp = analytics.appEfficiency[0];
      const lowEfficiencyApps = analytics.appEfficiency.filter(app => app.efficiency < 50);
      
      if (lowEfficiencyApps.length > 0) {
        additionalInsights.push({
          type: 'optimization' as const,
          title: 'App Efficiency Optimization',
          description: `${lowEfficiencyApps.length} apps have low efficiency. Consider restructuring workflows for ${lowEfficiencyApps[0].app}.`,
          impact: 'medium' as const,
          category: 'Efficiency'
        });
      }

      if (topApp.efficiency > 85) {
        additionalInsights.push({
          type: 'pattern' as const,
          title: 'High-Performance App Identified',
          description: `${topApp.app} shows excellent efficiency (${topApp.efficiency}%). Apply similar usage patterns to other tools.`,
          impact: 'low' as const,
          category: 'Best Practices'
        });
      }
    }

    // Energy-based insights
    if (analytics.energyMetrics.length > 0) {
      const avgEnergy = analytics.energyMetrics.reduce((sum, m) => sum + m.energyLevel, 0) / analytics.energyMetrics.length;
      const lowEnergyPeriods = analytics.energyMetrics.filter(m => m.energyLevel < 40);
      
      if (lowEnergyPeriods.length > analytics.energyMetrics.length * 0.3) {
        additionalInsights.push({
          type: 'recommendation' as const,
          title: 'Energy Management Needed',
          description: `${((lowEnergyPeriods.length / analytics.energyMetrics.length) * 100).toFixed(0)}% of time spent in low energy. Consider breaks and exercise.`,
          impact: 'high' as const,
          category: 'Wellness'
        });
      }

      if (avgEnergy > 75) {
        additionalInsights.push({
          type: 'pattern' as const,
          title: 'Strong Energy Management',
          description: `Excellent average energy level (${avgEnergy.toFixed(0)}%). Your current routine is working well.`,
          impact: 'low' as const,
          category: 'Wellness'
        });
      }
    }

    // Focus patterns insight
    if (analytics.focusPatterns.length > 0) {
      const morningFocus = analytics.focusPatterns.filter(p => p.hour >= 9 && p.hour <= 11);
      const afternoonFocus = analytics.focusPatterns.filter(p => p.hour >= 14 && p.hour <= 16);
      
      const avgMorningFocus = morningFocus.reduce((sum, p) => sum + p.focusScore, 0) / morningFocus.length;
      const avgAfternoonFocus = afternoonFocus.reduce((sum, p) => sum + p.focusScore, 0) / afternoonFocus.length;
      
      if (avgMorningFocus > avgAfternoonFocus + 20) {
        additionalInsights.push({
          type: 'optimization' as const,
          title: 'Morning Focus Advantage',
          description: `Morning focus is ${(avgMorningFocus - avgAfternoonFocus).toFixed(0)}% higher. Schedule complex tasks before noon.`,
          impact: 'medium' as const,
          category: 'Scheduling'
        });
      }
    }

    // Weekly trend insights
    if (analytics.weeklyTrend.length > 0) {
      const weekdays = analytics.weeklyTrend.filter(d => !['Sat', 'Sun'].includes(d.day));
      const avgEfficiency = weekdays.reduce((sum, d) => sum + d.efficiency, 0) / weekdays.length;
      const bestDay = weekdays.reduce((best, current) => current.efficiency > best.efficiency ? current : best);
      const worstDay = weekdays.reduce((worst, current) => current.efficiency < worst.efficiency ? current : worst);
      
      if (bestDay.efficiency - worstDay.efficiency > 30) {
        additionalInsights.push({
          type: 'pattern' as const,
          title: 'Weekly Performance Variance',
          description: `${bestDay.day} outperforms ${worstDay.day} by ${(bestDay.efficiency - worstDay.efficiency).toFixed(0)}%. Analyze what makes ${bestDay.day} effective.`,
          impact: 'medium' as const,
          category: 'Patterns'
        });
      }

      if (avgEfficiency > 90) {
        additionalInsights.push({
          type: 'pattern' as const,
          title: 'Exceptional Weekly Performance',
          description: `Outstanding ${avgEfficiency.toFixed(0)}% average efficiency. You're in the top 5% of performers!`,
          impact: 'low' as const,
          category: 'Achievement'
        });
      }
    }

    return additionalInsights;
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-indigo-900">AI Productivity Insights</h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-4 rounded-lg border border-indigo-200">
              <div className="flex gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allInsights = [
    ...(insights || []),
    ...(analytics ? generateAdditionalInsights(analytics) : [])
  ];

  if (allInsights.length === 0) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-indigo-900">AI Productivity Insights</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-indigo-700">Analyzing your patterns...</p>
          <p className="text-sm text-indigo-600 mt-2">Use the system for a while to generate personalized insights</p>
        </div>
      </div>
    );
  }

  // Sort insights by impact
  const sortedInsights = allInsights.sort((a, b) => {
    const impactOrder = { high: 3, medium: 2, low: 1 };
    return impactOrder[b.impact] - impactOrder[a.impact];
  });

  const highImpactCount = sortedInsights.filter(i => i.impact === 'high').length;
  const totalPotentialGain = highImpactCount * 15; // Estimated 15% gain per high-impact insight

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-indigo-900">AI Productivity Insights</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-indigo-700">
          <Zap className="w-4 h-4" />
          <span>{allInsights.length} insights found</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">High Impact</span>
          </div>
          <div className="text-2xl font-bold text-red-900">
            {sortedInsights.filter(i => i.impact === 'high').length}
          </div>
          <div className="text-xs text-red-700">Immediate attention needed</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">Opportunities</span>
          </div>
          <div className="text-2xl font-bold text-yellow-900">
            {sortedInsights.filter(i => i.impact === 'medium').length}
          </div>
          <div className="text-xs text-yellow-700">Optimization potential</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Potential Gain</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            +{totalPotentialGain}%
          </div>
          <div className="text-xs text-green-700">Estimated improvement</div>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {sortedInsights.map((insight, index) => (
          <div
            key={index}
            className={`bg-white p-4 rounded-lg border-l-4 ${getImpactColor(insight.impact)} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{getTypeIcon(insight.type)}</span>
                {getImpactIcon(insight.impact)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {insight.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      insight.impact === 'high' ? 'bg-red-100 text-red-700' :
                      insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {insight.impact} impact
                    </span>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Items */}
      <div className="mt-6 bg-white p-4 rounded-lg border border-indigo-200">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-indigo-800">🎯 Quick Action Items</span>
        </div>
        <div className="space-y-2 text-sm text-indigo-700">
          {highImpactCount > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Address {highImpactCount} high-impact item{highImpactCount > 1 ? 's' : ''} first</span>
            </div>
          )}
          {sortedInsights.some(i => i.category === 'Focus') && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Implement focus optimization strategies</span>
            </div>
          )}
          {sortedInsights.some(i => i.category === 'Scheduling') && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Adjust schedule based on productivity patterns</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Review insights weekly for continuous improvement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityInsights;
