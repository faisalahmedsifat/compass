import { useQuery } from '@tanstack/react-query';

const API_BASE = 'http://localhost:8080';

export interface TimeSlotSummary {
  time_slot: string;
  granularity: string;
  total_time: number;
  app_breakdown: Record<string, AppSummary>;
  metadata: {
    total_activities: number;
    total_apps: number;
    total_categories: number;
    screenshot_count: number;
  };
}

export interface AppSummary {
  app_name: string;
  total_time: number;
  active_time: number;
  activity_count: number;
  category: string;
  percentage: number;
}

export interface TimeSlotDetails {
  time_slot: string;
  granularity: string;
  activities: Activity[];
  summary: {
    total_time: number;
    activity_count: number;
    context_switches: number;
    productivity_score: number;
    app_breakdown: Record<string, number>;
    category_breakdown: Record<string, number>;
    screenshots: number[];
  };
}

export interface PeriodSummary {
  time_range: {
    from: string;
    to: string;
  };
  summary: {
    total_time: number;
    unique_apps: number;
    unique_categories: number;
  };
  app_totals: Record<string, AppSummary>;
  category_totals: Record<string, AppSummary>;
}

import type { Activity } from '../types';

// Helper function to parse Go duration strings (e.g., "1h30m45s") to seconds
const parseDuration = (durationStr: string): number => {
  if (!durationStr || durationStr === '0' || durationStr === '0s') return 0;
  
  const matches = durationStr.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?/);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseFloat(matches[3] || '0');
  
  return hours * 3600 + minutes * 60 + seconds;
};

// Hook to get optimized time slot summaries for timeline rendering
export const useTimelineSlots = (
  from?: Date, 
  to?: Date, 
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' = 'hour'
) => {
  // If no time range provided, use the last 24 hours as a reasonable default
  const now = new Date();
  const defaultFrom = from || new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
  const defaultTo = to || now; // Current time
  return useQuery<{
    success: boolean;
    data: TimeSlotSummary[];
    meta: {
      granularity: string;
      date_range: { from: string; to: string };
      data_points: number;
    };
  }>({
    queryKey: ['timelineSlots', defaultFrom.toISOString(), defaultTo.toISOString(), granularity],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('from', defaultFrom.toISOString());
      params.set('to', defaultTo.toISOString());

      const url = `${API_BASE}/api/timeline/${granularity}?${params}`;
      console.log('🌐 Timeline API Request:', {
        url,
        granularity,
        from: defaultFrom.toISOString(),
        to: defaultTo.toISOString(),
        originalFrom: from?.toISOString(),
        originalTo: to?.toISOString(),
        params: params.toString()
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline data');
      }
      const result = await response.json();
      
      console.log('📊 Timeline API Response:', result);
      
      // Transform the data to match expected format
      return {
        success: result.success,
        data: result.data || [],
        meta: result.meta || { granularity, date_range: { from: defaultFrom.toISOString(), to: defaultTo.toISOString() }, data_points: 0 }
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data fresh for 15 seconds
  });
};

// Hook to get period summary (total app usage for the entire period)
export const useTimelinePeriodSummary = (
  from?: Date, 
  to?: Date,
  granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' = 'day'
) => {
  return useQuery<PeriodSummary>({
    queryKey: ['timelinePeriodSummary', from?.toISOString(), to?.toISOString(), granularity],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set('from', from.toISOString());
      if (to) params.set('to', to.toISOString());

      const response = await fetch(`${API_BASE}/api/timeline/${granularity}/stats?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch period summary');
      }
      const result = await response.json();
      
      // Transform stats to expected period summary format
      const stats = result.data;
      if (!stats) {
        throw new Error('No stats data received');
      }

      // Convert duration maps to app/category totals
      const appTotals: Record<string, AppSummary> = {};
      const categoryTotals: Record<string, AppSummary> = {};
      
      // Convert Go duration strings to seconds (simplified conversion)
      Object.entries(stats.by_app || {}).forEach(([appName, duration]: [string, any]) => {
        const seconds = parseDuration(duration.toString());
        appTotals[appName] = {
          app_name: appName,
          total_time: seconds,
          active_time: seconds,
          activity_count: 1, // Would need additional data
          category: 'Unknown', // Would need additional data
          percentage: 0 // Will calculate below
        };
      });

      Object.entries(stats.by_category || {}).forEach(([categoryName, duration]: [string, any]) => {
        const seconds = parseDuration(duration.toString());
        categoryTotals[categoryName] = {
          app_name: categoryName,
          total_time: seconds,
          active_time: seconds,
          activity_count: 1,
          category: categoryName,
          percentage: 0
        };
      });

      // Calculate percentages
      const totalTime = parseDuration(stats.total_time?.toString() || '0');
      Object.values(appTotals).forEach(app => {
        app.percentage = totalTime > 0 ? (app.total_time / totalTime) * 100 : 0;
      });

      return {
        time_range: {
          from: from?.toISOString() || '',
          to: to?.toISOString() || ''
        },
        summary: {
          total_time: totalTime,
          unique_apps: Object.keys(appTotals).length,
          unique_categories: Object.keys(categoryTotals).length
        },
        app_totals: appTotals,
        category_totals: categoryTotals
      };
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

// Hook to trigger aggregation backfill (admin function)
export const useBackfillAggregations = () => {
  return useQuery<{ success: boolean; data: { message: string } }>({
    queryKey: ['backfillAggregations'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/backfill`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to trigger backfill');
      }
      return response.json();
    },
    enabled: false, // Only run when manually triggered
    retry: false, // Don't auto-retry admin operations
  });
};

// Hook to get aggregation status (admin function)
export const useAggregationStatus = () => {
  return useQuery<{ success: boolean; data: any }>({
    queryKey: ['aggregationStatus'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/admin/aggregation-status`);
      if (!response.ok) {
        throw new Error('Failed to get aggregation status');
      }
      return response.json();
    },
    refetchInterval: 30000, // Check status every 30 seconds
    staleTime: 15000,
  });
};
