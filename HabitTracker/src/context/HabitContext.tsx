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

    // ... (existing functions: addHabit, deleteHabit, updateHabit, toggleCheckIn, getHabitsWithStatus, requestNotificationPermission, canUseStreakFreeze, useStreakFreeze) ...

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
