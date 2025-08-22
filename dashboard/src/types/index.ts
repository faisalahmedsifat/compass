export interface WindowInfo {
  app_name: string;
  title: string;
  pid: number;
  is_active: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  monitor: number;
  last_active: string;
}

export interface CurrentWorkspace {
  active_window: WindowInfo;
  all_windows: WindowInfo[];
  window_count: number;
  category: string;
  focus_time: string;
  context_switches: number;
  timestamp: string;
}

export interface Activity {
  id: number;
  timestamp: string;
  app_name: string;
  window_title: string;
  category: string;
  focus_duration: number;
  total_windows: number;
  all_windows?: WindowInfo[];
  has_screenshot?: boolean;
}

export interface Pattern {
  name: string;
  active_app: string;
  background_apps: string[];
  frequency: number;
  total_time: number;
  category: string;
}

export interface Stats {
  period: string;
  total_time: number;
  by_app: Record<string, number>;
  by_category: Record<string, number>;
  patterns: Pattern[];
  context_switches: number;
  longest_focus: number;
}

export interface ApiInfo {
  name: string;
  version: string;
  description: string;
  endpoints: Record<string, string>;
  websocket: {
    url: string;
    messages: string;
  };
}

export interface FocusPattern {
  hour: number;
  day: string;
  focusScore: number;
  productivity: number;
  contextSwitches: number;
  activeTime: number;
}

export interface AppTransition {
  fromApp: string;
  toApp: string;
  frequency: number;
  avgDuration: number;
  category: string;
}

export interface EnergyMetrics {
  timestamp: string;
  energyLevel: number;
  productivity: number;
  contextSwitches: number;
  flowState: number;
}

export interface AdvancedAnalytics {
  focusPatterns: FocusPattern[];
  appTransitions: AppTransition[];
  energyMetrics: EnergyMetrics[];
  appEfficiency: {
    app: string;
    efficiency: number;
    timeSpent: number;
    outputScore: number;
    avgFocusDuration: number;
  }[];
  weeklyTrend: {
    day: string;
    planned: number;
    actual: number;
    efficiency: number;
    mood: number;
  }[];
  insights: {
    type: 'optimization' | 'pattern' | 'recommendation';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    category: string;
  }[];
}