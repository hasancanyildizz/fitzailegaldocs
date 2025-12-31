// Habit Types
export interface Habit {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
  frequency: 'daily' | 'weekly';
  targetDays?: number[]; // 0-6 for weekly (0 = Sunday)
  reminderTime?: string; // HH:mm format (e.g., "09:00")
  notificationId?: string; // Expo notification identifier
  archived?: boolean; // If true, habit is archived (hidden from main view)
}

// Check-in record for a specific date
export interface CheckIn {
  habitId: string;
  date: string; // YYYY-MM-DD format
  completedAt: string; // ISO timestamp
}

// Calculated habit stats
export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionRate: number; // 0-100
}

// Combined habit with today's status
export interface HabitWithStatus extends Habit {
  isCompletedToday: boolean;
  streak: number;
  stats: HabitStats;
}

// User XP and Level (Gamification)
export interface UserProgress {
  xp: number;
  level: number;
  streakFreezes: number; // Streak kurtarma hakkı
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  AddHabit: undefined;
  EditHabit: { habitId: string };
  Statistics: undefined;
  Settings: undefined;
  Archive: undefined;
};
