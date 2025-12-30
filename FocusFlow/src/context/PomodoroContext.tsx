import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import {
  TimerMode,
  TimerStatus,
  TimerSettings,
  TimerState,
  PomodoroSession,
  Task,
  UserProgress,
  DailyStats,
  DEFAULT_SETTINGS,
} from '../types';
import {
  getDurationForMode,
  getNextMode,
  getToday,
  calculateSessionXP,
  calculateLevel,
  calculateStreak,
} from '../utils/timerUtils';

interface PomodoroContextType {
  // Timer state
  timerState: TimerState;
  settings: TimerSettings;

  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  skipToNext: () => void;

  // Settings
  updateSettings: (updates: Partial<TimerSettings>) => void;

  // Tasks
  tasks: Task[];
  addTask: (name: string, estimatedPomodoros: number) => void;
  deleteTask: (id: string) => void;
  selectTask: (id: string | null) => void;
  completeTaskPomodoro: (id: string) => void;

  // Progress
  userProgress: UserProgress;
  sessions: PomodoroSession[];
  dailyStats: DailyStats[];

  // Helpers
  getTodayStats: () => DailyStats;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

const STORAGE_KEY = 'focusflow-storage';

export const PomodoroProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>({
    mode: 'focus',
    status: 'idle',
    remainingSeconds: DEFAULT_SETTINGS.focusDuration * 60,
    completedFocusSessions: 0,
    currentTaskId: null,
  });

  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress>({
    xp: 0,
    level: 1,
    totalFocusSessions: 0,
    totalFocusMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        let jsonValue = null;
        if (Platform.OS === 'web') {
          jsonValue = localStorage.getItem(STORAGE_KEY);
        } else {
          jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        }

        if (jsonValue) {
          const data = JSON.parse(jsonValue);
          if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
          if (data.tasks) setTasks(data.tasks);
          if (data.sessions) setSessions(data.sessions);
          if (data.dailyStats) setDailyStats(data.dailyStats);
          if (data.userProgress) setUserProgress(data.userProgress);

          // Reset timer with loaded settings
          const focusDuration = data.settings?.focusDuration || DEFAULT_SETTINGS.focusDuration;
          setTimerState(prev => ({
            ...prev,
            remainingSeconds: focusDuration * 60,
          }));
        }
      } catch (e) {
        console.error('Failed to load data', e);
      } finally {
        setLoaded(true);
      }
    };
    loadData();
  }, []);

  // Save data
  useEffect(() => {
    if (!loaded) return;

    const saveData = async () => {
      const data = {
        settings,
        tasks,
        sessions,
        dailyStats,
        userProgress,
      };

      try {
        const jsonValue = JSON.stringify(data);
        if (Platform.OS === 'web') {
          localStorage.setItem(STORAGE_KEY, jsonValue);
        } else {
          await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
        }
      } catch (e) {
        console.error('Failed to save data', e);
      }
    };
    saveData();
  }, [settings, tasks, sessions, dailyStats, userProgress, loaded]);

  // Timer tick
  useEffect(() => {
    if (timerState.status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.remainingSeconds <= 1) {
            // Timer completed
            handleTimerComplete(prev);
            return prev;
          }
          return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.status]);

  const handleTimerComplete = useCallback((state: TimerState) => {
    // Haptic feedback
    if (Platform.OS !== 'web' && settings.vibrationEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const today = getToday();
    const durationMinutes = state.mode === 'focus'
      ? settings.focusDuration
      : state.mode === 'shortBreak'
        ? settings.shortBreakDuration
        : settings.longBreakDuration;

    // Record session
    const newSession: PomodoroSession = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      mode: state.mode,
      duration: durationMinutes * 60,
      completedAt: new Date().toISOString(),
      date: today,
      taskId: state.currentTaskId || undefined,
    };
    setSessions(prev => [...prev, newSession]);

    // Update daily stats
    setDailyStats(prev => {
      const todayStats = prev.find(s => s.date === today);
      if (todayStats) {
        return prev.map(s => s.date === today ? {
          ...s,
          focusSessions: s.focusSessions + (state.mode === 'focus' ? 1 : 0),
          totalFocusMinutes: s.totalFocusMinutes + (state.mode === 'focus' ? durationMinutes : 0),
        } : s);
      }
      return [...prev, {
        date: today,
        focusSessions: state.mode === 'focus' ? 1 : 0,
        totalFocusMinutes: state.mode === 'focus' ? durationMinutes : 0,
        tasksCompleted: 0,
      }];
    });

    // Update XP and progress for focus sessions
    if (state.mode === 'focus') {
      const xpEarned = calculateSessionXP('focus', durationMinutes);
      setUserProgress(prev => {
        const newXP = prev.xp + xpEarned;
        const dates = [...sessions.map(s => s.date), today];
        const currentStreak = calculateStreak(dates);
        return {
          ...prev,
          xp: newXP,
          level: calculateLevel(newXP),
          totalFocusSessions: prev.totalFocusSessions + 1,
          totalFocusMinutes: prev.totalFocusMinutes + durationMinutes,
          currentStreak,
          longestStreak: Math.max(prev.longestStreak, currentStreak),
        };
      });

      // Update task pomodoro count
      if (state.currentTaskId) {
        completeTaskPomodoro(state.currentTaskId);
      }
    }

    // Move to next mode
    const newCompletedSessions = state.mode === 'focus'
      ? state.completedFocusSessions + 1
      : state.completedFocusSessions;

    const nextMode = getNextMode(state.mode, state.completedFocusSessions, settings);
    const nextDuration = getDurationForMode(nextMode, settings);

    const shouldAutoStart = (nextMode === 'focus' && settings.autoStartFocus) ||
                           (nextMode !== 'focus' && settings.autoStartBreaks);

    setTimerState({
      mode: nextMode,
      status: shouldAutoStart ? 'running' : 'completed',
      remainingSeconds: nextDuration,
      completedFocusSessions: nextMode === 'longBreak' ? 0 : newCompletedSessions,
      currentTaskId: state.currentTaskId,
    });
  }, [settings, sessions]);

  // Timer controls
  const startTimer = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimerState(prev => ({ ...prev, status: 'running' }));
  }, []);

  const pauseTimer = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimerState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  const resetTimer = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimerState(prev => ({
      ...prev,
      status: 'idle',
      remainingSeconds: getDurationForMode(prev.mode, settings),
    }));
  }, [settings]);

  const skipToNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    const nextMode = getNextMode(timerState.mode, timerState.completedFocusSessions, settings);
    const nextDuration = getDurationForMode(nextMode, settings);

    setTimerState(prev => ({
      mode: nextMode,
      status: 'idle',
      remainingSeconds: nextDuration,
      completedFocusSessions: nextMode === 'longBreak' ? 0 : prev.completedFocusSessions,
      currentTaskId: prev.currentTaskId,
    }));
  }, [timerState.mode, timerState.completedFocusSessions, settings]);

  // Settings
  const updateSettings = useCallback((updates: Partial<TimerSettings>) => {
    setSettings(prev => {
      const newSettings = { ...prev, ...updates };
      // Update timer duration if mode duration changed
      if (timerState.status === 'idle') {
        const newDuration = getDurationForMode(timerState.mode, newSettings);
        setTimerState(ts => ({ ...ts, remainingSeconds: newDuration }));
      }
      return newSettings;
    });
  }, [timerState.mode, timerState.status]);

  // Tasks
  const addTask = useCallback((name: string, estimatedPomodoros: number) => {
    const newTask: Task = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name,
      estimatedPomodoros,
      completedPomodoros: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (timerState.currentTaskId === id) {
      setTimerState(prev => ({ ...prev, currentTaskId: null }));
    }
  }, [timerState.currentTaskId]);

  const selectTask = useCallback((id: string | null) => {
    setTimerState(prev => ({ ...prev, currentTaskId: id }));
  }, []);

  const completeTaskPomodoro = useCallback((id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const newCompleted = t.completedPomodoros + 1;
        const isCompleted = newCompleted >= t.estimatedPomodoros;
        if (isCompleted) {
          // Update daily stats for completed task
          const today = getToday();
          setDailyStats(ds => ds.map(s => s.date === today
            ? { ...s, tasksCompleted: s.tasksCompleted + 1 }
            : s
          ));
        }
        return { ...t, completedPomodoros: newCompleted, isCompleted };
      }
      return t;
    }));
  }, []);

  // Helpers
  const getTodayStats = useCallback((): DailyStats => {
    const today = getToday();
    return dailyStats.find(s => s.date === today) || {
      date: today,
      focusSessions: 0,
      totalFocusMinutes: 0,
      tasksCompleted: 0,
    };
  }, [dailyStats]);

  return (
    <PomodoroContext.Provider
      value={{
        timerState,
        settings,
        startTimer,
        pauseTimer,
        resetTimer,
        skipToNext,
        updateSettings,
        tasks,
        addTask,
        deleteTask,
        selectTask,
        completeTaskPomodoro,
        userProgress,
        sessions,
        dailyStats,
        getTodayStats,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
};

export const usePomodoroContext = () => {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error('usePomodoroContext must be used within a PomodoroProvider');
  }
  return context;
};
