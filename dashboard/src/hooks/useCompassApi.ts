import { useQuery } from '@tanstack/react-query';
import type { CurrentWorkspace, Activity, Stats, ApiInfo } from '../types';

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