import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Habit, CheckIn, UserProgress, HabitWithStatus } from '../types';
import { getToday, getYesterday } from '../utils/dateUtils';
import {
    calculateStreak,
    calculateHabitStats,
    isCompletedToday,
    calculateXP,
    calculateLevel,
} from '../utils/streakUtils';
import {
    scheduleHabitReminder,
    cancelHabitReminder,
    requestNotificationPermissions,
} from '../utils/notificationUtils';

interface HabitContextType {
    habits: Habit[];
    checkIns: CheckIn[];
    userProgress: UserProgress;
    isLoading: boolean;
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => Promise<void>;
    deleteHabit: (id: string) => Promise<void>;
    updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
    toggleCheckIn: (habitId: string) => void;
    getHabitsWithStatus: () => HabitWithStatus[];
    getArchivedHabits: () => HabitWithStatus[];
    archiveHabit: (id: string) => Promise<void>;
    unarchiveHabit: (id: string) => Promise<void>;
    requestNotificationPermission: () => Promise<boolean>;
    useStreakFreeze: (habitId: string) => boolean; // Use a freeze to save streak
    canUseStreakFreeze: (habitId: string) => boolean; // Check if freeze can be used
    userName: string;
    updateUserName: (name: string) => void;
    clearAllData: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

const STORAGE_KEY = 'habit-storage';

export const HabitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [userProgress, setUserProgress] = useState<UserProgress>({
        xp: 0,
        level: 1,
        streakFreezes: 1, // Start with 1 free streak freeze
    });
    const [userName, setUserName] = useState('User');
    const [loaded, setLoaded] = useState(false);

    // Load Data
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
                    const { state } = JSON.parse(jsonValue);
                    if (state) {
                        setHabits(state.habits || []);
                        setCheckIns(state.checkIns || []);
                        setUserProgress(state.userProgress || { xp: 0, level: 1, streakFreezes: 1 });
                        setUserName(state.userName || 'User');
                    }
                }
            } catch (e) {
                console.error('Failed to load habits', e);
            } finally {
                setLoaded(true);
            }
        };
        loadData();
    }, []);

    // Save Data
    useEffect(() => {
        if (!loaded) return;

        const saveData = async () => {
            const data = {
                state: {
                    habits,
                    checkIns,
                    userProgress,
                    userName,
                },
                version: 0,
            };

            try {
                const jsonValue = JSON.stringify(data);
                if (Platform.OS === 'web') {
                    localStorage.setItem(STORAGE_KEY, jsonValue);
                } else {
                    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
                }
            } catch (e) {
                console.error('Failed to save habits', e);
            }
        };
        saveData();
    }, [habits, checkIns, userProgress, userName, loaded]);

    const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

    const addHabit = async (habitData: Omit<Habit, 'id' | 'createdAt'>) => {
        const newHabit: Habit = {
            ...habitData,
            id: generateId(),
            createdAt: new Date().toISOString(),
        };
        setHabits((prev) => [...prev, newHabit]);

        // Schedule notification if reminder is set
        if (newHabit.reminderTime) {
            await scheduleHabitReminder(newHabit, newHabit.reminderTime);
        }
    };

    const deleteHabit = async (id: string) => {
        await cancelHabitReminder(id);
        setHabits((prev) => prev.filter((h) => h.id !== id));
        setCheckIns((prev) => prev.filter((c) => c.habitId !== id));
    };

    const updateHabit = async (id: string, updates: Partial<Habit>) => {
        setHabits((prev) =>
            prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
        );

        // Update notification if reminder changed
        const habit = habits.find((h) => h.id === id);
        if (habit) {
            if (habit.notificationId) {
                await cancelHabitReminder(habit.notificationId);
            }
            const updatedHabit = { ...habit, ...updates };
            if (updatedHabit.reminderTime) {
                await scheduleHabitReminder(updatedHabit, updatedHabit.reminderTime);
            }
        }
    };

    const toggleCheckIn = (habitId: string) => {
        const today = getToday();
        const existingCheckIn = checkIns.find(
            (c) => c.habitId === habitId && c.date === today
        );

        if (existingCheckIn) {
            // Remove check-in
            setCheckIns((prev) =>
                prev.filter((c) => !(c.habitId === habitId && c.date === today))
            );
        } else {
            // Add check-in
            const newCheckIn: CheckIn = {
                habitId,
                date: today,
                completedAt: new Date().toISOString(),
            };
            setCheckIns((prev) => [...prev, newCheckIn]);

            // Calculate XP reward
            const habit = habits.find((h) => h.id === habitId);
            if (habit) {
                const currentStreak = calculateStreak(
                    [...checkIns, newCheckIn],
                    habitId,
                    habit.frequency,
                    habit.targetDays
                );
                const xpGained = calculateXP(currentStreak);

                // Earn a streak freeze every 7 days of streak
                const earnedFreeze = currentStreak > 0 && currentStreak % 7 === 0 ? 1 : 0;

                setUserProgress((prev) => {
                    const newXP = prev.xp + xpGained;
                    return {
                        xp: newXP,
                        level: calculateLevel(newXP),
                        streakFreezes: prev.streakFreezes + earnedFreeze,
                    };
                });
            }
        }
    };

    const getHabitsWithStatus = (): HabitWithStatus[] => {
        return habits
            .filter((habit) => !habit.archived) // Only show non-archived habits
            .map((habit) => {
                const completedToday = isCompletedToday(checkIns, habit.id);
                const streak = calculateStreak(checkIns, habit.id, habit.frequency, habit.targetDays);
                const stats = calculateHabitStats(checkIns, habit.id, habit.createdAt, habit.frequency, habit.targetDays);

                return {
                    ...habit,
                    isCompletedToday: completedToday,
                    streak,
                    stats,
                };
            });
    };

    const getArchivedHabits = (): HabitWithStatus[] => {
        return habits
            .filter((habit) => habit.archived)
            .map((habit) => {
                const completedToday = isCompletedToday(checkIns, habit.id);
                const streak = calculateStreak(checkIns, habit.id, habit.frequency, habit.targetDays);
                const stats = calculateHabitStats(checkIns, habit.id, habit.createdAt, habit.frequency, habit.targetDays);

                return {
                    ...habit,
                    isCompletedToday: completedToday,
                    streak,
                    stats,
                };
            });
    };

    const archiveHabit = async (id: string): Promise<void> => {
        const habit = habits.find((h) => h.id === id);
        if (habit?.notificationId) {
            await cancelHabitReminder(habit.notificationId);
        }
        setHabits((prev) =>
            prev.map((h) => (h.id === id ? { ...h, archived: true } : h))
        );
    };

    const unarchiveHabit = async (id: string): Promise<void> => {
        const habit = habits.find((h) => h.id === id);
        setHabits((prev) =>
            prev.map((h) => (h.id === id ? { ...h, archived: false } : h))
        );

        // Reschedule reminder if it was set
        if (habit?.reminderTime) {
            await scheduleHabitReminder({ ...habit, archived: false }, habit.reminderTime);
        }
    };

    const requestNotificationPermission = async (): Promise<boolean> => {
        return await requestNotificationPermissions();
    };

    const canUseStreakFreeze = (habitId: string): boolean => {
        if (userProgress.streakFreezes <= 0) return false;

        const yesterday = getYesterday();
        const today = getToday();

        // Check if yesterday was missed
        const yesterdayCheckIn = checkIns.find(
            (c) => c.habitId === habitId && c.date === yesterday
        );
        if (yesterdayCheckIn) return false; // Yesterday was completed, no need for freeze

        // Check if today is already completed
        const todayCheckIn = checkIns.find(
            (c) => c.habitId === habitId && c.date === today
        );
        if (todayCheckIn) return false; // Today already done

        // Check if there's an existing streak to save
        const habit = habits.find((h) => h.id === habitId);
        if (!habit) return false;

        // Calculate what the streak would be if yesterday was completed
        // to verify there's actually a streak worth saving
        const simulatedCheckIns = [...checkIns, { habitId, date: yesterday, completedAt: '' }];
        const potentialStreak = calculateStreak(simulatedCheckIns, habitId, habit.frequency, habit.targetDays);

        // Only allow freeze if there's a streak of at least 2 to save
        return potentialStreak >= 2;
    };

    const useStreakFreeze = (habitId: string): boolean => {
        if (!canUseStreakFreeze(habitId)) return false;

        const yesterday = getYesterday();

        // Add a "fake" check-in for yesterday to preserve streak
        const freezeCheckIn: CheckIn = {
            habitId,
            date: yesterday,
            completedAt: new Date().toISOString(),
        };

        setCheckIns((prev) => [...prev, freezeCheckIn]);
        setUserProgress((prev) => ({
            ...prev,
            streakFreezes: prev.streakFreezes - 1,
        }));

        return true;
    };

    const updateUserName = (name: string) => {
        setUserName(name);
    };

    const clearAllData = async () => {
        setHabits([]);
        setCheckIns([]);
        setUserProgress({ xp: 0, level: 1, streakFreezes: 1 });
        setUserName('User');

        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                await AsyncStorage.removeItem(STORAGE_KEY);
            }
        } catch (e) {
            console.error('Failed to clear data', e);
        }
    };

    return (
        <HabitContext.Provider
            value={{
                habits,
                checkIns,
                userProgress,
                isLoading: !loaded,
                addHabit,
                deleteHabit,
                updateHabit,
                toggleCheckIn,
                getHabitsWithStatus,
                getArchivedHabits,
                archiveHabit,
                unarchiveHabit,
                requestNotificationPermission,
                useStreakFreeze,
                canUseStreakFreeze,
                userName,
                updateUserName,
                clearAllData,
            }}
        >
            {children}
        </HabitContext.Provider>
    );
};

export const useHabitContext = () => {
    const context = useContext(HabitContext);
    if (!context) {
        throw new Error('useHabitContext must be used within a HabitProvider');
    }
    return context;
};
