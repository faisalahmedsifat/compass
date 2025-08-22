import React from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import type { FocusPattern } from '../types';

interface FocusHeatmapProps {
  data?: FocusPattern[];
  isLoading?: boolean;
}

const FocusHeatmap: React.FC<FocusHeatmapProps> = ({ data, isLoading }) => {
  const hours = Array.from({ length: 12 }, (_, i) => i + 6); // 6 AM to 6 PM
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getHeatmapData = (hour: number, day: string) => {
    if (!data) return 0;
    
    const pattern = data.find(p => p.hour === hour && p.day === day);
    return pattern?.focusScore || 0;
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity > 80) return 'bg-green-600 text-white';
    if (intensity > 60) return 'bg-green-400 text-white';
    if (intensity > 40) return 'bg-yellow-400 text-gray-800';
    if (intensity > 20) return 'bg-orange-400 text-white';
    if (intensity > 0) return 'bg-red-400 text-white';
    return 'bg-gray-100 text-gray-400';
  };

  const getIntensityText = (intensity: number) => {
    if (intensity > 80) return 'High';
    if (intensity > 60) return 'Good';
    if (intensity > 40) return 'Medium';
    if (intensity > 20) return 'Low';
    if (intensity > 0) return 'Poor';
    return 'None';
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Focus Intensity Heatmap</h3>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-8 gap-1">
            {Array.from({ length: 8 * 13 }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate peak focus insights
  const peakHour = data?.reduce((peak, current) => 
    current.focusScore > peak.focusScore ? current : peak
  , { hour: 9, day: 'Mon', focusScore: 0 });

  const avgFocusByHour = hours.map(hour => {
    const hourData = data?.filter(d => d.hour === hour) || [];
    const avgScore = hourData.length > 0 
      ? hourData.reduce((sum, d) => sum + d.focusScore, 0) / hourData.length 
      : 0;
    return { hour, avgScore };
  });

  const bestHours = avgFocusByHour
    .filter(h => h.avgScore > 0)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900">Focus Intensity Heatmap</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingUp className="w-4 h-4" />
          <span>Last 7 days</span>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-1 text-xs mb-6">
        {/* Header row */}
        <div className="flex items-center justify-center h-8"></div>
        {days.map(day => (
          <div key={day} className="flex items-center justify-center h-8 font-medium text-gray-700">
            {day}
          </div>
        ))}

        {/* Time rows */}
        {hours.map(hour => (
          <React.Fragment key={hour}>
            <div className="flex items-center justify-end pr-2 h-8 text-gray-600 font-medium">
              {hour}:00
            </div>
            {days.map(day => {
              const intensity = getHeatmapData(hour, day);
              return (
                <div 
                  key={`${hour}-${day}`}
                  className={`h-8 rounded cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg flex items-center justify-center text-xs font-medium ${getIntensityColor(intensity)}`}
                  title={`${day} ${hour}:00 - ${intensity.toFixed(0)}% focus (${getIntensityText(intensity)})`}
                >
                  {intensity > 0 ? intensity.toFixed(0) : ''}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Low Focus</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <div className="w-3 h-3 bg-orange-400 rounded"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <div className="w-3 h-3 bg-green-600 rounded"></div>
          </div>
          <span>High Focus</span>
        </div>
      </div>

      {/* Insights */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">Peak Focus</span>
            </div>
            <div className="text-lg font-bold text-blue-900">
              {peakHour?.day} {peakHour?.hour}:00
            </div>
            <div className="text-xs text-blue-700">
              {peakHour?.focusScore.toFixed(0)}% intensity
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-800">Best Hours</span>
            </div>
            <div className="text-sm font-bold text-green-900">
              {bestHours.map(h => `${h.hour}:00`).join(', ')}
            </div>
            <div className="text-xs text-green-700">
              Avg {bestHours[0]?.avgScore.toFixed(0)}% focus
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-purple-800">Pattern</span>
            </div>
            <div className="text-sm font-bold text-purple-900">
              {bestHours.length > 0 ? 'Morning Peak' : 'Building Routine'}
            </div>
            <div className="text-xs text-purple-700">
              {bestHours.length > 0 ? 'Schedule deep work early' : 'Track more data'}
            </div>
          </div>
        </div>

        {bestHours.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">💡 Optimization Tip</span>
            </div>
            <p className="text-sm text-amber-700">
              Your focus peaks around <span className="font-semibold">{bestHours[0]?.hour}:00</span>. 
              Schedule your most challenging tasks during this window for maximum productivity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FocusHeatmap;
