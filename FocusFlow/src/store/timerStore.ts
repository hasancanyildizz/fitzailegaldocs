import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface DailyHistoryEntry {
    date: string; // YYYY-MM-DD
    pomodoros: number;
}

interface TimerState {
    // Config
    focusDuration: number; // in seconds
    shortBreakDuration: number;
    longBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
    soundEnabled: boolean;

    // State
    timeLeft: number;
    mode: TimerMode;
    status: TimerStatus;
    pomodorosCompleted: number; // Total completed
    dailyPomodoros: number; // Today's count
    dailyGoal: number; // Daily pomodoro goal
    lastActiveDate: string; // Track last active date for daily reset (YYYY-MM-DD)
    dailyHistory: DailyHistoryEntry[]; // Historical daily data (last 30 days)
    timerStartedAt: number | null; // Timestamp when timer started (for persistence)

    // Actions
    setDuration: (mode: TimerMode, duration: number) => void;
    setDailyGoal: (goal: number) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    tick: () => void;
    switchMode: (mode: TimerMode) => void;
    skip: () => void;
    resetDailyStats: () => void;
    checkDailyReset: () => void; // Check and reset daily stats if day changed
    restoreTimerState: () => void; // Restore timer state after app resume
    getWeeklyData: () => number[]; // Get last 7 days of pomodoro counts
    getDailyProgress: () => { current: number; goal: number; percentage: number };
}

const DEFAULT_DURATIONS = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
};

// Helper: Get today's date as YYYY-MM-DD string
const getTodayDateString = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Helper: Centralized State Transition Logic
const determineNextState = (
    currentMode: TimerMode,
    currentCompleted: number,
    currentDaily: number,
    config: { focus: number; short: number; long: number }
) => {
    let nextMode: TimerMode = 'focus';
    let nextDuration = config.focus;
    let newCompleted = currentCompleted;
    let newDaily = currentDaily;

    if (currentMode === 'focus') {
        // Finishing a Focus Session
        newCompleted += 1;
        newDaily += 1;

        // Check for Long Break (every 4th pomodoro)
        const isLongBreak = newCompleted > 0 && newCompleted % 4 === 0;

        if (isLongBreak) {
            nextMode = 'longBreak';
            nextDuration = config.long;
        } else {
            nextMode = 'shortBreak';
            nextDuration = config.short;
        }
    } else {
        // Finishing a Break (Short or Long) -> Back to Focus
        nextMode = 'focus';
        nextDuration = config.focus;
    }

    return { nextMode, nextDuration, newCompleted, newDaily };
};

export const useTimerStore = create<TimerState>()(
    persist(
        (set, get) => ({
            focusDuration: DEFAULT_DURATIONS.focus,
            shortBreakDuration: DEFAULT_DURATIONS.shortBreak,
            longBreakDuration: DEFAULT_DURATIONS.longBreak,
            autoStartBreaks: false,
            autoStartPomodoros: false,
            soundEnabled: true,

            timeLeft: DEFAULT_DURATIONS.focus,
            mode: 'focus',
            status: 'idle',
            pomodorosCompleted: 0,
            dailyPomodoros: 0,
            dailyGoal: 8, // Default 8 pomodoros per day
            lastActiveDate: getTodayDateString(),
            dailyHistory: [],
            timerStartedAt: null,

            setDuration: (mode, duration) =>
                set((state) => ({
                    [`${mode}Duration`]: duration,
                    timeLeft: state.mode === mode ? duration : state.timeLeft,
                })),

            setDailyGoal: (goal) => set({ dailyGoal: goal }),

            startTimer: () => set({
                status: 'running',
                timerStartedAt: Date.now(),
            }),

            pauseTimer: () => {
                const { timerStartedAt, timeLeft } = get();
                if (timerStartedAt) {
                    // Calculate elapsed time and update timeLeft
                    const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
                    const newTimeLeft = Math.max(0, timeLeft - elapsed);
                    set({ status: 'paused', timerStartedAt: null, timeLeft: newTimeLeft });
                } else {
                    set({ status: 'paused', timerStartedAt: null });
                }
            },

            resetTimer: () => {
                const { mode, focusDuration, shortBreakDuration, longBreakDuration } = get();
                let duration = focusDuration;
                if (mode === 'shortBreak') duration = shortBreakDuration;
                if (mode === 'longBreak') duration = longBreakDuration;
                set({ status: 'idle', timeLeft: duration, timerStartedAt: null });
            },

            tick: () => {
                const { timeLeft, status, mode, autoStartBreaks, autoStartPomodoros,
                    focusDuration, shortBreakDuration, longBreakDuration,
                    pomodorosCompleted, dailyPomodoros, dailyHistory } = get();

                if (status !== 'running') return;

                if (timeLeft > 0) {
                    set({ timeLeft: timeLeft - 1 });
                } else {
                    // Timer Finished
                    const result = determineNextState(
                        mode,
                        pomodorosCompleted,
                        dailyPomodoros,
                        { focus: focusDuration, short: shortBreakDuration, long: longBreakDuration }
                    );

                    // Auto start logic
                    const isNextFocus = result.nextMode === 'focus';
                    const shouldAutoStart = isNextFocus ? autoStartPomodoros : autoStartBreaks;

                    // Update daily history if a focus session was completed
                    let updatedHistory = dailyHistory;
                    if (mode === 'focus') {
                        const today = getTodayDateString();
                        const todayIndex = dailyHistory.findIndex(h => h.date === today);
                        if (todayIndex >= 0) {
                            updatedHistory = dailyHistory.map((h, i) =>
                                i === todayIndex ? { ...h, pomodoros: result.newDaily } : h
                            );
                        } else {
                            updatedHistory = [...dailyHistory, { date: today, pomodoros: result.newDaily }]
                                .slice(-30); // Keep last 30 days
                        }
                    }

                    set({
                        status: shouldAutoStart ? 'running' : 'idle',
                        mode: result.nextMode,
                        timeLeft: result.nextDuration,
                        pomodorosCompleted: result.newCompleted,
                        dailyPomodoros: result.newDaily,
                        dailyHistory: updatedHistory,
                        timerStartedAt: shouldAutoStart ? Date.now() : null,
                    });
                }
            },

            switchMode: (mode) => {
                let duration = get().focusDuration;
                if (mode === 'shortBreak') duration = get().shortBreakDuration;
                if (mode === 'longBreak') duration = get().longBreakDuration;
                set({ mode, timeLeft: duration, status: 'idle', timerStartedAt: null });
            },

            skip: () => {
                const { mode, focusDuration, shortBreakDuration, longBreakDuration } = get();

                // Skipping behavior:
                // - Skip FOCUS: Move to break WITHOUT counting as completed (user didn't do the work)
                // - Skip BREAK: Move to next focus session (this is fine, user can skip breaks)

                let nextMode: TimerMode;
                let nextDuration: number;

                if (mode === 'focus') {
                    // Skipping focus - go to short break, DON'T count as completed
                    nextMode = 'shortBreak';
                    nextDuration = shortBreakDuration;
                } else {
                    // Skipping break - go back to focus
                    nextMode = 'focus';
                    nextDuration = focusDuration;
                }

                set({
                    mode: nextMode,
                    timeLeft: nextDuration,
                    status: 'idle',
                    timerStartedAt: null,
                    // pomodorosCompleted, dailyPomodoros, dailyHistory remain unchanged when skipping
                });
            },

            resetDailyStats: () => set({ dailyPomodoros: 0, lastActiveDate: getTodayDateString() }),

            checkDailyReset: () => {
                const { lastActiveDate, dailyPomodoros, dailyHistory } = get();
                const today = getTodayDateString();

                if (lastActiveDate !== today) {
                    // Save previous day's data to history before resetting
                    let updatedHistory = dailyHistory;
                    if (dailyPomodoros > 0) {
                        const prevDayIndex = dailyHistory.findIndex(h => h.date === lastActiveDate);
                        if (prevDayIndex >= 0) {
                            updatedHistory = dailyHistory.map((h, i) =>
                                i === prevDayIndex ? { ...h, pomodoros: dailyPomodoros } : h
                            );
                        } else {
                            updatedHistory = [...dailyHistory, { date: lastActiveDate, pomodoros: dailyPomodoros }]
                                .slice(-30);
                        }
                    }
                    // Day changed, reset daily stats
                    set({ dailyPomodoros: 0, lastActiveDate: today, dailyHistory: updatedHistory });
                }
            },

            restoreTimerState: () => {
                const { timerStartedAt, timeLeft, status } = get();
                if (status === 'running' && timerStartedAt) {
                    // Calculate how much time has elapsed since timer started
                    const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
                    const newTimeLeft = timeLeft - elapsed;

                    if (newTimeLeft <= 0) {
                        // Timer should have finished - trigger completion
                        set({ timeLeft: 0 });
                    } else {
                        // Update time left and restart timer tracking
                        set({ timeLeft: newTimeLeft, timerStartedAt: Date.now() });
                    }
                }
            },

            getWeeklyData: (): number[] => {
                const { dailyHistory, dailyPomodoros } = get();
                const today = new Date();
                const weekData: number[] = [];

                // Get data for last 7 days (Mon-Sun format)
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                    if (i === 0) {
                        // Today - use current dailyPomodoros
                        weekData.push(dailyPomodoros);
                    } else {
                        // Past days - look up in history
                        const historyEntry = dailyHistory.find(h => h.date === dateStr);
                        weekData.push(historyEntry?.pomodoros || 0);
                    }
                }

                return weekData;
            },

            getDailyProgress: () => {
                const { dailyPomodoros, dailyGoal } = get();
                return {
                    current: dailyPomodoros,
                    goal: dailyGoal,
                    percentage: Math.min(100, Math.round((dailyPomodoros / dailyGoal) * 100)),
                };
            },
        }),
        {
            name: 'timer-storage',
            storage: createJSONStorage(() =>
                Platform.OS === 'web' ? localStorage : AsyncStorage
            ),
        }
    )
);
