import { Clock, Code, Globe, Monitor, Target, TrendingUp, Zap } from 'lucide-react';
import React, { useMemo } from 'react';
import type { Activity } from '../types';

interface ProductivityMetricsProps {
  stats: any;
  activities: Activity[] | undefined;
}

const ProductivityMetrics: React.FC<ProductivityMetricsProps> = ({ activities = [] }) => {
  const productivityInsights = useMemo(() => {
    if (!activities || activities.length === 0) return null;

    // Categorize activities
    const browserActivities = activities.filter(a => 
      a.category?.toLowerCase().includes('browser') ||
      a.app_name?.toLowerCase().includes('firefox') ||
      a.app_name?.toLowerCase().includes('chrome')
    );

    const developmentActivities = activities.filter(a => 
      a.category?.toLowerCase().includes('development') ||
      a.app_name?.toLowerCase().includes('code') ||
      a.app_name?.toLowerCase().includes('cursor')
    );

    const communicationActivities = activities.filter(a => 
      a.app_name?.toLowerCase().includes('slack') ||
      a.app_name?.toLowerCase().includes('teams') ||
      a.app_name?.toLowerCase().includes('discord') ||
      a.app_name?.toLowerCase().includes('telegram')
    );

    // Calculate time distributions
    const totalTime = activities.reduce((sum, a) => sum + a.focus_duration, 0);
    const browserTime = browserActivities.reduce((sum, a) => sum + a.focus_duration, 0);
    const developmentTime = developmentActivities.reduce((sum, a) => sum + a.focus_duration, 0);
    const communicationTime = communicationActivities.reduce((sum, a) => sum + a.focus_duration, 0);

    // Calculate productivity metrics
    const productiveTime = developmentTime;
    const researchTime = browserTime;
    const socialTime = communicationTime;
    const otherTime = totalTime - productiveTime - researchTime - socialTime;

    const productivityScore = totalTime > 0 ? ((productiveTime + researchTime * 0.7) / totalTime) * 100 : 0;

    // Focus session analysis
    const focusSessions = activities.filter(a => a.focus_duration > 300); // 5+ minutes
    const deepWorkSessions = activities.filter(a => a.focus_duration > 1800); // 30+ minutes

    return {
      totalTime,
      productiveTime,
      researchTime,
      socialTime,
      otherTime,
      productivityScore,
      focusSessions: focusSessions.length,
      deepWorkSessions: deepWorkSessions.length,
      averageFocusTime: focusSessions.length > 0 ? 
        focusSessions.reduce((sum, a) => sum + a.focus_duration, 0) / focusSessions.length : 0
    };
  }, [activities]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600 bg-green-50' };
    if (score >= 60) return { level: 'Good', color: 'text-blue-600 bg-blue-50' };
    if (score >= 40) return { level: 'Fair', color: 'text-yellow-600 bg-yellow-50' };
    return { level: 'Needs Improvement', color: 'text-red-600 bg-red-50' };
  };

  if (!productivityInsights) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-gray-500 py-8">
          <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No data available for productivity analysis</p>
        </div>
      </div>
    );
  }

  const productivityLevel = getProductivityLevel(productivityInsights.productivityScore);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Productivity Metrics</h3>
          <p className="text-gray-600">Activity analysis and productivity insights</p>
        </div>
      </div>

      {/* Productivity Score */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Productivity Score</h4>
            <p className="text-sm text-gray-600">Based on development and research activities</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {productivityInsights.productivityScore.toFixed(0)}%
            </div>
            <div className={`text-sm px-2 py-1 rounded-full ${productivityLevel.color}`}>
              {productivityLevel.level}
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(100, productivityInsights.productivityScore)}%` }}
          />
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Time Distribution</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Code className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-gray-600">Development</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatDuration(productivityInsights.productiveTime)}</span>
                <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full"
                    style={{ width: `${(productivityInsights.productiveTime / productivityInsights.totalTime) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Research/Browsing</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatDuration(productivityInsights.researchTime)}</span>
                <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${(productivityInsights.researchTime / productivityInsights.totalTime) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">Other Activities</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{formatDuration(productivityInsights.otherTime)}</span>
                <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-gray-500 h-1.5 rounded-full"
                    style={{ width: `${(productivityInsights.otherTime / productivityInsights.totalTime) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Focus Sessions</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600">Focus Sessions</span>
              </div>
              <span className="font-medium">{productivityInsights.focusSessions}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-gray-600">Deep Work Sessions</span>
              </div>
              <span className="font-medium">{productivityInsights.deepWorkSessions}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Avg Focus Time</span>
              </div>
              <span className="font-medium">
                {formatDuration(Math.round(productivityInsights.averageFocusTime))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="border-t pt-4">
        <h4 className="text-md font-semibold text-gray-900 mb-3">Insights & Recommendations</h4>
        <div className="space-y-2">
          {productivityInsights.deepWorkSessions === 0 && (
            <div className="flex items-start space-x-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
              <Target className="h-4 w-4 mt-0.5" />
              <span>Consider scheduling longer focus blocks (30+ minutes) for deep work.</span>
            </div>
          )}
          
          {productivityInsights.productivityScore < 50 && (
            <div className="flex items-start space-x-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
              <TrendingUp className="h-4 w-4 mt-0.5" />
              <span>Increase development time and reduce distractions to boost productivity.</span>
            </div>
          )}
          
          {productivityInsights.focusSessions > 10 && (
            <div className="flex items-start space-x-2 text-sm text-green-700 bg-green-50 p-2 rounded">
              <Zap className="h-4 w-4 mt-0.5" />
              <span>Great focus consistency! You had {productivityInsights.focusSessions} productive sessions.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductivityMetrics;
