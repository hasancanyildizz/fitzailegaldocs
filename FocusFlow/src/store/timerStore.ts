import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';
export type TimerStatus = 'idle' | 'running' | 'paused';

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
    lastActiveDate: string; // Track last active date for daily reset (YYYY-MM-DD)

    // Actions
    setDuration: (mode: TimerMode, duration: number) => void;
    startTimer: () => void;
    pauseTimer: () => void;
    resetTimer: () => void;
    tick: () => void;
    switchMode: (mode: TimerMode) => void;
    skip: () => void;
    resetDailyStats: () => void;
    checkDailyReset: () => void; // Check and reset daily stats if day changed
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
            lastActiveDate: getTodayDateString(),

            setDuration: (mode, duration) =>
                set((state) => ({
                    [`${mode}Duration`]: duration,
                    timeLeft: state.mode === mode ? duration : state.timeLeft,
                })),

            startTimer: () => set({ status: 'running' }),

            pauseTimer: () => set({ status: 'paused' }),

            resetTimer: () => {
                const { mode, focusDuration, shortBreakDuration, longBreakDuration } = get();
                let duration = focusDuration;
                if (mode === 'shortBreak') duration = shortBreakDuration;
                if (mode === 'longBreak') duration = longBreakDuration;
                set({ status: 'idle', timeLeft: duration });
            },

            tick: () => {
                const { timeLeft, status, mode, autoStartBreaks, autoStartPomodoros,
                    focusDuration, shortBreakDuration, longBreakDuration,
                    pomodorosCompleted, dailyPomodoros } = get();

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

                    set({
                        status: shouldAutoStart ? 'running' : 'idle',
                        mode: result.nextMode,
                        timeLeft: result.nextDuration,
                        pomodorosCompleted: result.newCompleted,
                        dailyPomodoros: result.newDaily,
                    });
                }
            },

            switchMode: (mode) => {
                let duration = get().focusDuration;
                if (mode === 'shortBreak') duration = get().shortBreakDuration;
                if (mode === 'longBreak') duration = get().longBreakDuration;
                set({ mode, timeLeft: duration, status: 'idle' });
            },

            skip: () => {
                const { mode, focusDuration, shortBreakDuration, longBreakDuration,
                    pomodorosCompleted, dailyPomodoros } = get();

                // Calculate next state immediately using shared logic
                const result = determineNextState(
                    mode,
                    pomodorosCompleted,
                    dailyPomodoros,
                    { focus: focusDuration, short: shortBreakDuration, long: longBreakDuration }
                );

                set({
                    mode: result.nextMode,
                    timeLeft: result.nextDuration,
                    pomodorosCompleted: result.newCompleted,
                    dailyPomodoros: result.newDaily,
                    status: 'idle' // Skip always pauses
                });
            },

            resetDailyStats: () => set({ dailyPomodoros: 0, lastActiveDate: getTodayDateString() }),

            checkDailyReset: () => {
                const { lastActiveDate } = get();
                const today = getTodayDateString();

                if (lastActiveDate !== today) {
                    // Day changed, reset daily stats
                    set({ dailyPomodoros: 0, lastActiveDate: today });
                }
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
