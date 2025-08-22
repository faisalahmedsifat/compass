import React from 'react';
import { Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react';

interface TimePeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  className?: string;
}

const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({ 
  selectedPeriod, 
  onPeriodChange, 
  className = '' 
}) => {
  const periods = [
    { value: 'hour', label: 'Last Hour', icon: Clock, description: 'Real-time view' },
    { value: 'day', label: 'Today', icon: Calendar, description: 'Daily analysis' },
    { value: 'week', label: 'This Week', icon: BarChart3, description: 'Weekly patterns' },
    { value: 'month', label: 'This Month', icon: TrendingUp, description: 'Monthly trends' }
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {periods.map((period) => {
        const Icon = period.icon;
        const isSelected = selectedPeriod === period.value;
        
        return (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              isSelected
                ? 'bg-blue-500 text-white shadow-md scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
            }`}
            title={period.description}
          >
            <Icon className="w-4 h-4" />
            <span>{period.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TimePeriodSelector;
