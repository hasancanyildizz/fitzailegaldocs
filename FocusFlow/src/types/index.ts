// Timer States
export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

// Timer Settings
export interface TimerSettings {
  focusDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // number of focus sessions before long break
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Session record
export interface PomodoroSession {
  id: string;
  mode: TimerMode;
  duration: number; // seconds
  completedAt: string; // ISO timestamp
  date: string; // YYYY-MM-DD
  taskId?: string;
}

// Task
export interface Task {
  id: string;
  name: string;
  estimatedPomodoros: number;
  completedPomodoros: number;
  isCompleted: boolean;
  createdAt: string;
}

// Daily stats
export interface DailyStats {
  date: string; // YYYY-MM-DD
  focusSessions: number;
  totalFocusMinutes: number;
  tasksCompleted: number;
}

// User progress (gamification)
export interface UserProgress {
  xp: number;
  level: number;
  totalFocusSessions: number;
  totalFocusMinutes: number;
  currentStreak: number; // consecutive days
  longestStreak: number;
}

// Timer state
export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  remainingSeconds: number;
  completedFocusSessions: number; // in current cycle
  currentTaskId: string | null;
}

// Navigation types
export type RootStackParamList = {
  Timer: undefined;
  Tasks: undefined;
  Statistics: undefined;
  Settings: undefined;
};

// Default settings
export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  soundEnabled: true,
  vibrationEnabled: true,
};
