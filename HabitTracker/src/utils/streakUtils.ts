import { CheckIn, HabitStats, Habit } from '../types';
import { getToday, getYesterday, formatDate, parseDate } from './dateUtils';

// Helper: Check if a date is a target day for weekly habits
const isTargetDay = (dateStr: string, targetDays?: number[]): boolean => {
  if (!targetDays || targetDays.length === 0) return true; // Daily habit
  const date = parseDate(dateStr);
  return targetDays.includes(date.getDay());
};

// Helper: Get previous target day for weekly habits
const getPreviousTargetDay = (fromDate: string, targetDays?: number[]): string => {
  if (!targetDays || targetDays.length === 0) {
    // Daily habit: just return yesterday
    const date = parseDate(fromDate);
    date.setDate(date.getDate() - 1);
    return formatDate(date);
  }

  // Weekly habit: find the most recent target day before fromDate
  let date = parseDate(fromDate);
  date.setDate(date.getDate() - 1);

  // Look back up to 7 days to find a target day
  for (let i = 0; i < 7; i++) {
    if (targetDays.includes(date.getDay())) {
      return formatDate(date);
    }
    date.setDate(date.getDate() - 1);
  }

  return formatDate(date); // Fallback
};

// Calculate current streak for a habit (supports weekly frequency)
export const calculateStreak = (
  checkIns: CheckIn[],
  habitId: string,
  frequency: 'daily' | 'weekly' = 'daily',
  targetDays?: number[]
): number => {
  const habitCheckIns = checkIns
    .filter(c => c.habitId === habitId)
    .map(c => c.date)
    .sort((a, b) => b.localeCompare(a)); // Sort descending

  if (habitCheckIns.length === 0) return 0;

  const today = getToday();
  const yesterday = getYesterday();

  // For weekly habits, check if today is a target day
  const isTodayTarget = isTargetDay(today, frequency === 'weekly' ? targetDays : undefined);
  const isYesterdayTarget = isTargetDay(yesterday, frequency === 'weekly' ? targetDays : undefined);

  // Check if the last check-in was recent enough
  const lastCheckIn = habitCheckIns[0];

  if (frequency === 'daily') {
    // Daily habit: must have checked in today or yesterday
    if (lastCheckIn !== today && lastCheckIn !== yesterday) {
      return 0; // Streak broken
    }
  } else {
    // Weekly habit: more flexible - find the most recent target day
    const previousTargetDay = getPreviousTargetDay(today, targetDays);
    const hasCheckedInRecently = lastCheckIn === today ||
      (isTodayTarget && lastCheckIn === previousTargetDay) ||
      (!isTodayTarget && parseDate(lastCheckIn) >= parseDate(previousTargetDay));

    if (!hasCheckedInRecently) {
      return 0; // Streak broken
    }
  }

  let streak = 0;
  let expectedDate = lastCheckIn;

  for (const date of habitCheckIns) {
    if (date === expectedDate) {
      streak++;
      // Move to previous target day
      expectedDate = getPreviousTargetDay(expectedDate, frequency === 'weekly' ? targetDays : undefined);
    } else if (date < expectedDate) {
      // Gap found, streak ends
      break;
    }
  }

  return streak;
};

// Calculate longest streak ever
export const calculateLongestStreak = (checkIns: CheckIn[], habitId: string): number => {
  const habitCheckIns = checkIns
    .filter(c => c.habitId === habitId)
    .map(c => c.date)
    .sort((a, b) => a.localeCompare(b)); // Sort ascending

  if (habitCheckIns.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < habitCheckIns.length; i++) {
    const prevDate = parseDate(habitCheckIns[i - 1]);
    const currDate = parseDate(habitCheckIns[i]);

    const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
    // diffDays === 0 means same day, ignore
  }

  return longestStreak;
};

// Calculate full stats for a habit
export const calculateHabitStats = (
  checkIns: CheckIn[],
  habitId: string,
  createdAt: string
): HabitStats => {
  const habitCheckIns = checkIns.filter(c => c.habitId === habitId);
  const totalCompletions = habitCheckIns.length;
  const currentStreak = calculateStreak(checkIns, habitId);
  const longestStreak = calculateLongestStreak(checkIns, habitId);

  // Calculate completion rate (last 30 days)
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const createdDate = parseDate(createdAt);
  const startDate = createdDate > thirtyDaysAgo ? createdDate : thirtyDaysAgo;

  const daysSinceStart = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const completionsInPeriod = habitCheckIns.filter(c => parseDate(c.date) >= startDate).length;
  const completionRate = Math.round((completionsInPeriod / daysSinceStart) * 100);

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionRate: Math.min(100, completionRate),
  };
};

// Check if habit is completed today
export const isCompletedToday = (checkIns: CheckIn[], habitId: string): boolean => {
  const today = getToday();
  return checkIns.some(c => c.habitId === habitId && c.date === today);
};

// Calculate XP for completing a habit
export const calculateXP = (streak: number): number => {
  const baseXP = 10;
  const streakBonus = Math.min(streak * 2, 50); // Max 50 bonus XP
  return baseXP + streakBonus;
};

// Calculate level from XP
export const calculateLevel = (xp: number): number => {
  // Level formula: each level needs 100 * level XP
  // Level 1: 0-99, Level 2: 100-299, Level 3: 300-599, etc.
  let level = 1;
  let requiredXP = 0;

  while (xp >= requiredXP + (level * 100)) {
    requiredXP += level * 100;
    level++;
  }

  return level;
};

// Get XP progress to next level
export const getXPProgress = (xp: number): { current: number; required: number; percentage: number } => {
  const level = calculateLevel(xp);
  let totalXPForCurrentLevel = 0;

  for (let i = 1; i < level; i++) {
    totalXPForCurrentLevel += i * 100;
  }

  const xpInCurrentLevel = xp - totalXPForCurrentLevel;
  const xpRequiredForNextLevel = level * 100;

  return {
    current: xpInCurrentLevel,
    required: xpRequiredForNextLevel,
    percentage: Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100),
  };
};
