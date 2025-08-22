import { useQuery } from '@tanstack/react-query';
import type { CurrentWorkspace, Activity, Stats, ApiInfo, AdvancedAnalytics, AppTransition, FocusPattern, EnergyMetrics } from '../types';

const API_BASE = 'http://localhost:8080';

export const useApiInfo = () => {
  return useQuery<ApiInfo>({
    queryKey: ['apiInfo'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/`);
      if (!response.ok) {
        throw new Error('Failed to fetch API info');
      }
      return response.json();
    },
  });
};

export const useCurrentWorkspace = () => {
  return useQuery<CurrentWorkspace>({
    queryKey: ['currentWorkspace'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/current`);
      if (!response.ok) {
        throw new Error('Failed to fetch current workspace');
      }
      return response.json();
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
};

export const useActivities = (limit: number = 50) => {
  return useQuery<Activity[]>({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/activities?limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useStats = (period: string = 'day') => {
  return useQuery<Stats>({
    queryKey: ['stats', period],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/stats?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
};

export const useHealth = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/health`);
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      return response.json();
    },
    refetchInterval: 30000,
  });
};

// Enhanced Analytics Hooks
export const useAdvancedAnalytics = (period: string = 'week') => {
  return useQuery<AdvancedAnalytics>({
    queryKey: ['advancedAnalytics', period],
    queryFn: async () => {
      // Since the backend doesn't have this endpoint yet, we'll derive it from existing data
      const [activities, stats] = await Promise.all([
        fetch(`${API_BASE}/api/activities?limit=1000`).then(r => r.json()),
        fetch(`${API_BASE}/api/stats?period=${period}`).then(r => r.json())
      ]);
      
      return deriveAdvancedAnalytics(activities, stats);
    },
    refetchInterval: 300000, // 5 minutes
  });
};

export const useFocusPatterns = (days: number = 7) => {
  return useQuery<FocusPattern[]>({
    queryKey: ['focusPatterns', days],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/activities?limit=${days * 100}`);
      if (!response.ok) {
        throw new Error('Failed to fetch focus patterns');
      }
      const activities = await response.json();
      return deriveFocusPatterns(activities);
    },
    refetchInterval: 300000,
  });
};

export const useAppTransitions = (period: string = 'day') => {
  return useQuery<AppTransition[]>({
    queryKey: ['appTransitions', period],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/activities?limit=500`);
      if (!response.ok) {
        throw new Error('Failed to fetch app transitions');
      }
      const activities = await response.json();
      return deriveAppTransitions(activities);
    },
    refetchInterval: 300000,
  });
};

export const useRealTimeMetrics = () => {
  return useQuery({
    queryKey: ['realTimeMetrics'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/current`);
      if (!response.ok) {
        throw new Error('Failed to fetch real-time metrics');
      }
      const current = await response.json();
      return deriveRealTimeMetrics(current);
    },
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });
};

// WebSocket hook for real-time updates
export const useWebSocket = () => {
  return useQuery({
    queryKey: ['websocket'],
    queryFn: () => {
      return new Promise((resolve) => {
        const ws = new WebSocket('ws://localhost:8080/ws');
        ws.onopen = () => resolve(ws);
        ws.onerror = () => resolve(null);
      });
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

// Helper functions to derive analytics from existing API data
const deriveAdvancedAnalytics = (activities: Activity[], stats: Stats): AdvancedAnalytics => {
  const focusPatterns = deriveFocusPatterns(activities);
  const appTransitions = deriveAppTransitions(activities);
  const energyMetrics = deriveEnergyMetrics(activities);
  const appEfficiency = deriveAppEfficiency(activities);
  const weeklyTrend = deriveWeeklyTrend(activities);
  const insights = deriveInsights(activities, stats);

  return {
    focusPatterns,
    appTransitions,
    energyMetrics,
    appEfficiency,
    weeklyTrend,
    insights
  };
};

const deriveFocusPatterns = (activities: Activity[]): FocusPattern[] => {
  const patterns: { [key: string]: FocusPattern } = {};
  
  activities.forEach(activity => {
    const date = new Date(activity.timestamp);
    const hour = date.getHours();
    const day = date.toLocaleDateString('en-US', { weekday: 'short' });
    const key = `${day}-${hour}`;
    
    if (!patterns[key]) {
      patterns[key] = {
        hour,
        day,
        focusScore: 0,
        productivity: 0,
        contextSwitches: 0,
        activeTime: 0
      };
    }
    
    // Calculate focus score based on focus duration
    const focusScore = Math.min(100, (activity.focus_duration / 600) * 100); // 10 minutes = 100%
    patterns[key].focusScore = (patterns[key].focusScore + focusScore) / 2;
    patterns[key].activeTime += activity.focus_duration;
    patterns[key].productivity = Math.min(100, patterns[key].activeTime / 3600 * 50); // 1 hour = 50%
  });
  
  return Object.values(patterns);
};

const deriveAppTransitions = (activities: Activity[]): AppTransition[] => {
  const transitions: { [key: string]: AppTransition } = {};
  
  for (let i = 1; i < activities.length; i++) {
    const fromApp = activities[i - 1].app_name;
    const toApp = activities[i].app_name;
    
    if (fromApp !== toApp) {
      const key = `${fromApp}->${toApp}`;
      
      if (!transitions[key]) {
        transitions[key] = {
          fromApp,
          toApp,
          frequency: 0,
          avgDuration: 0,
          category: activities[i].category
        };
      }
      
      transitions[key].frequency++;
      transitions[key].avgDuration = (transitions[key].avgDuration + activities[i].focus_duration) / 2;
    }
  }
  
  return Object.values(transitions).sort((a, b) => b.frequency - a.frequency).slice(0, 10);
};

const deriveEnergyMetrics = (activities: Activity[]): EnergyMetrics[] => {
  const hourlyMetrics: { [key: string]: EnergyMetrics } = {};
  
  activities.forEach(activity => {
    const hour = new Date(activity.timestamp).toISOString().slice(0, 14) + '00:00';
    
    if (!hourlyMetrics[hour]) {
      hourlyMetrics[hour] = {
        timestamp: hour,
        energyLevel: 50,
        productivity: 0,
        contextSwitches: 0,
        flowState: 0
      };
    }
    
    // Derive energy level from focus duration patterns
    const focusQuality = Math.min(100, (activity.focus_duration / 600) * 100);
    hourlyMetrics[hour].energyLevel = (hourlyMetrics[hour].energyLevel + focusQuality) / 2;
    hourlyMetrics[hour].productivity = Math.min(100, hourlyMetrics[hour].energyLevel * 0.8);
    hourlyMetrics[hour].flowState = Math.min(1, focusQuality / 100);
  });
  
  return Object.values(hourlyMetrics).slice(-24); // Last 24 hours
};

const deriveAppEfficiency = (activities: Activity[]): AdvancedAnalytics['appEfficiency'] => {
  const appMetrics: { [key: string]: {
    app: string;
    totalTime: number;
    totalFocus: number;
    sessionCount: number;
    efficiency: number;
    timeSpent: number;
    outputScore: number;
    avgFocusDuration: number;
  } } = {};
  
  activities.forEach(activity => {
    if (!appMetrics[activity.app_name]) {
      appMetrics[activity.app_name] = {
        app: activity.app_name,
        totalTime: 0,
        totalFocus: 0,
        sessionCount: 0,
        efficiency: 0,
        timeSpent: 0,
        outputScore: 0,
        avgFocusDuration: 0
      };
    }
    
    appMetrics[activity.app_name].totalTime += activity.focus_duration;
    appMetrics[activity.app_name].totalFocus += Math.min(600, activity.focus_duration);
    appMetrics[activity.app_name].sessionCount++;
  });
  
  return Object.values(appMetrics).map((app) => ({
    app: app.app,
    efficiency: Math.round((app.totalFocus / app.totalTime) * 100) || 0,
    timeSpent: Math.round(app.totalTime / 60), // minutes
    outputScore: Math.min(100, (app.totalFocus / 3600) * 50), // based on focused time
    avgFocusDuration: Math.round(app.totalTime / app.sessionCount) || 0
  })).sort((a, b) => b.efficiency - a.efficiency).slice(0, 8);
};

const deriveWeeklyTrend = (activities: Activity[]): AdvancedAnalytics['weeklyTrend'] => {
  const weekData: { [key: string]: {
    day: string;
    planned: number;
    actual: number;
    efficiency: number;
    mood: number;
  } } = {};
  
  activities.forEach(activity => {
    const day = new Date(activity.timestamp).toLocaleDateString('en-US', { weekday: 'short' });
    
    if (!weekData[day]) {
      weekData[day] = {
        day,
        planned: 8, // Default 8 hours planned
        actual: 0,
        efficiency: 0,
        mood: 7 // Default neutral mood
      };
    }
    
    weekData[day].actual += activity.focus_duration / 3600; // hours
  });
  
  return Object.values(weekData).map((day) => ({
    ...day,
    actual: Math.round(day.actual * 10) / 10,
    efficiency: Math.round((day.actual / day.planned) * 100)
  }));
};

const deriveInsights = (activities: Activity[], stats: Stats): AdvancedAnalytics['insights'] => {
  const insights: AdvancedAnalytics['insights'] = [];
  
  // High context switching insight
  if (stats.context_switches > 50) {
    insights.push({
      type: 'optimization' as const,
      title: 'Reduce Context Switching',
      description: `You switched contexts ${stats.context_switches} times today. Try blocking similar tasks together.`,
      impact: 'high' as const,
      category: 'Focus'
    });
  }
  
  // Productivity pattern insight
  const morningActivities = activities.filter(a => {
    const hour = new Date(a.timestamp).getHours();
    return hour >= 9 && hour <= 11;
  });
  
  if (morningActivities.length > 5) {
    const avgMorningFocus = morningActivities.reduce((sum, a) => sum + a.focus_duration, 0) / morningActivities.length;
    
    if (avgMorningFocus > 300) { // 5 minutes
      insights.push({
        type: 'pattern' as const,
        title: 'Morning Productivity Peak',
        description: 'Your focus is strongest between 9-11 AM. Schedule complex tasks during this window.',
        impact: 'medium' as const,
        category: 'Optimization'
      });
    }
  }
  
  // App efficiency recommendation
  const devApps = activities.filter(a => 
    a.app_name.toLowerCase().includes('cursor') || 
    a.app_name.toLowerCase().includes('code') ||
    a.app_name.toLowerCase().includes('terminal')
  );
  
  if (devApps.length > 0) {
    const avgDevFocus = devApps.reduce((sum, a) => sum + a.focus_duration, 0) / devApps.length;
    
    if (avgDevFocus < 180) { // Less than 3 minutes average
      insights.push({
        type: 'recommendation' as const,
        title: 'Extend Development Sessions',
        description: 'Your coding sessions are quite short. Try 25-minute focused blocks for better flow.',
        impact: 'high' as const,
        category: 'Development'
      });
    }
  }
  
  return insights;
};

const deriveRealTimeMetrics = (current: CurrentWorkspace) => {
  const focusTimeMinutes = parseInt(current.focus_time?.replace(/[^\d]/g, '') || '0');
  const isHighFocus = focusTimeMinutes > 10;
  const contextSwitchRate = current.context_switches / Math.max(1, focusTimeMinutes);
  
  return {
    currentFocusStreak: focusTimeMinutes,
    isInFlowState: isHighFocus && contextSwitchRate < 0.5,
    contextSwitchRate,
    currentProductivity: Math.min(100, (focusTimeMinutes / 25) * 100), // 25 min = 100%
    energyLevel: Math.max(20, 100 - (contextSwitchRate * 20)), // Lower energy with more switches
    qualityScore: isHighFocus ? (contextSwitchRate < 0.3 ? 90 : 70) : 40
  };
};