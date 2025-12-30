import { TimerMode, TimerSettings } from '../types';

// Format seconds to MM:SS
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Get duration in seconds for a mode
export const getDurationForMode = (mode: TimerMode, settings: TimerSettings): number => {
  switch (mode) {
    case 'focus':
      return settings.focusDuration * 60;
    case 'shortBreak':
      return settings.shortBreakDuration * 60;
    case 'longBreak':
      return settings.longBreakDuration * 60;
  }
};

// Get next mode after current completes
export const getNextMode = (
  currentMode: TimerMode,
  completedFocusSessions: number,
  settings: TimerSettings
): TimerMode => {
  if (currentMode === 'focus') {
    // Check if it's time for a long break
    if ((completedFocusSessions + 1) % settings.longBreakInterval === 0) {
      return 'longBreak';
    }
    return 'shortBreak';
  }
  // After any break, go back to focus
  return 'focus';
};

// Get mode label
export const getModeLabel = (mode: TimerMode): string => {
  switch (mode) {
    case 'focus':
      return 'Focus Time';
    case 'shortBreak':
      return 'Short Break';
    case 'longBreak':
      return 'Long Break';
  }
};

// Get today's date in YYYY-MM-DD format
export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Calculate XP for completing a session
export const calculateSessionXP = (mode: TimerMode, durationMinutes: number): number => {
  const baseXP = mode === 'focus' ? 10 : 2;
  const durationBonus = Math.floor(durationMinutes / 5);
  return baseXP + durationBonus;
};

// Calculate level from XP
export const calculateLevel = (xp: number): number => {
  // Level formula: each level needs 100 * level XP
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

// Calculate streak
export const calculateStreak = (dates: string[]): number => {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));
  const today = getToday();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Check if last activity was today or yesterday
  if (sortedDates[0] !== today && sortedDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expectedDate = sortedDates[0] === today ? today : yesterdayStr;

  const uniqueDates = [...new Set(sortedDates)];

  for (const date of uniqueDates) {
    if (date === expectedDate) {
      streak++;
      const prevDate = new Date(expectedDate + 'T00:00:00');
      prevDate.setDate(prevDate.getDate() - 1);
      expectedDate = prevDate.toISOString().split('T')[0];
    } else if (date < expectedDate) {
      break;
    }
  }

  return streak;
};

// Format minutes to human readable
export const formatMinutes = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};
