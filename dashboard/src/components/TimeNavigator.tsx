import { ArrowLeft, ArrowRight, Calendar, ChevronDown, Clock, Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { Activity } from '../types';

interface TimeNavigatorProps {
  onTimeSelect: (timestamp: Date, activities: Activity[]) => void;
  activities: Activity[] | undefined;
  isLoading: boolean;
}

const TimeNavigator: React.FC<TimeNavigatorProps> = ({
  onTimeSelect,
  activities = [],
  isLoading
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000)); // Yesterday
  const [selectedTime, setSelectedTime] = useState('22:30'); // Default to 10:30 PM
  const [showTimeDetails, setShowTimeDetails] = useState(false);
  const [quickNavDate, setQuickNavDate] = useState('');

  // Find activities around the selected time
  const findActivitiesAtTime = (targetTime: Date) => {
    const targetTimestamp = targetTime.getTime();
    const hourBefore = targetTimestamp - (60 * 60 * 1000);
    const hourAfter = targetTimestamp + (60 * 60 * 1000);

    return activities.filter(activity => {
      const activityTime = new Date(activity.timestamp).getTime();
      return activityTime >= hourBefore && activityTime <= hourAfter;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  // Get the closest activity to the selected time
  const getClosestActivity = (targetTime: Date): Activity | null => {
    if (!activities.length) return null;

    const targetTimestamp = targetTime.getTime();
    let closest = activities[0];
    let minDiff = Math.abs(new Date(closest.timestamp).getTime() - targetTimestamp);

    activities.forEach(activity => {
      const diff = Math.abs(new Date(activity.timestamp).getTime() - targetTimestamp);
      if (diff < minDiff) {
        closest = activity;
        minDiff = diff;
      }
    });

    return closest;
  };

  const handleTimeTravel = () => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const targetTime = new Date(selectedDate);
    targetTime.setHours(hours, minutes, 0, 0);

    const contextActivities = findActivitiesAtTime(targetTime);
    onTimeSelect(targetTime, contextActivities);
    setShowTimeDetails(true);
  };

  const navigateTime = (direction: 'prev' | 'next', unit: 'hour' | 'day') => {
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours, minutes, 0, 0);

    if (unit === 'hour') {
      newDate.setHours(newDate.getHours() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }

    setSelectedDate(newDate);
    setSelectedTime(`${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}`);
    
    const contextActivities = findActivitiesAtTime(newDate);
    onTimeSelect(newDate, contextActivities);
  };

  const handleQuickNavigation = (preset: string) => {
    const now = new Date();
    let targetDate = new Date();

    switch (preset) {
      case 'yesterday-morning':
        targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        setSelectedTime('09:00');
        break;
      case 'yesterday-afternoon':
        targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        setSelectedTime('14:00');
        break;
      case 'yesterday-evening':
        targetDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        setSelectedTime('19:00');
        break;
      case 'this-morning':
        setSelectedTime('09:00');
        break;
      case 'week-ago':
        targetDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setSelectedTime('14:00');
        break;
      default:
        return;
    }

    setSelectedDate(targetDate);
    setQuickNavDate(preset);
  };

  useEffect(() => {
    // Auto-trigger time travel when date/time changes
    if (activities?.length) {
      handleTimeTravel();
    }
  }, [selectedDate, selectedTime, activities?.length]);

  const targetTime = new Date(selectedDate);
  const [hours, minutes] = selectedTime.split(':').map(Number);
  targetTime.setHours(hours, minutes, 0, 0);
  
  const closestActivity = getClosestActivity(targetTime);
  const contextActivities = findActivitiesAtTime(targetTime);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-900">🕰️ Time Navigator</h2>
        <div className="ml-auto text-sm text-gray-500">
          {contextActivities.length} activities found
        </div>
      </div>

      {/* Quick Navigation Presets */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Navigation</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'yesterday-morning', label: 'Yesterday Morning', time: '9 AM' },
            { key: 'yesterday-afternoon', label: 'Yesterday Afternoon', time: '2 PM' },
            { key: 'yesterday-evening', label: 'Yesterday Evening', time: '7 PM' },
            { key: 'this-morning', label: 'This Morning', time: '9 AM' },
            { key: 'week-ago', label: 'Week Ago', time: '2 PM' },
          ].map((preset) => (
            <button
              key={preset.key}
              onClick={() => handleQuickNavigation(preset.key)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                quickNavDate === preset.key
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {preset.label}
              <span className="block text-xs text-gray-500">{preset.time}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Time Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-1" />
            Date
          </label>
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Time
          </label>
          <input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={handleTimeTravel}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {isLoading ? 'Searching...' : 'Time Travel'}
          </button>
        </div>
      </div>

      {/* Time Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateTime('prev', 'day')}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Previous day"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateTime('prev', 'hour')}
            className="p-2 hover:bg-gray-100 rounded-lg text-sm"
            title="Previous hour"
          >
            -1h
          </button>
        </div>

        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {targetTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {targetTime.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true
            })}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateTime('next', 'hour')}
            className="p-2 hover:bg-gray-100 rounded-lg text-sm"
            title="Next hour"
          >
            +1h
          </button>
          <button
            onClick={() => navigateTime('next', 'day')}
            className="p-2 hover:bg-gray-100 rounded-lg"
            title="Next day"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context Summary */}
      {closestActivity && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <ChevronDown 
              className={`w-4 h-4 text-indigo-600 transition-transform ${showTimeDetails ? 'rotate-180' : ''}`}
            />
            <h4 className="font-medium text-indigo-900">Activity Context</h4>
          </div>
          
          <div className="text-sm text-indigo-700 mb-3">
            At this time, you were using <strong>{closestActivity.app_name}</strong>
            {closestActivity.window_title && (
              <span> - {closestActivity.window_title}</span>
            )}
          </div>

          {showTimeDetails && contextActivities.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-indigo-600 font-medium">
                Timeline (±1 hour context)
              </div>
              {contextActivities.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 text-xs">
                  <div className="text-indigo-500 min-w-[50px]">
                    {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">{activity.app_name}</span>
                    {activity.window_title && (
                      <span className="text-indigo-600"> - {activity.window_title.slice(0, 30)}...</span>
                    )}
                  </div>
                  <div className="text-indigo-500">
                    {Math.round(activity.focus_duration / 60)}m
                  </div>
                </div>
              ))}
              {contextActivities.length > 5 && (
                <div className="text-xs text-indigo-500 italic">
                  ... and {contextActivities.length - 5} more activities
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!closestActivity && !isLoading && (
        <div className="text-center py-6 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No activity data found for this time period.</p>
          <p className="text-sm">Try selecting a different date or time.</p>
        </div>
      )}
    </div>
  );
};

export default TimeNavigator;
