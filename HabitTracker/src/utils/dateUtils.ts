// Date utility functions

export const getToday = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getYesterday = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseDate = (dateStr: string): Date => {
  // Handle both YYYY-MM-DD and ISO timestamp formats
  if (dateStr.includes('T')) {
    // ISO timestamp format (e.g., "2025-12-26T14:30:00.000Z")
    return new Date(dateStr);
  }
  // YYYY-MM-DD format
  return new Date(dateStr + 'T00:00:00');
};

export const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = parseDate(date1);
  const d2 = parseDate(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export const getWeekDates = (date: Date = new Date()): string[] => {
  const dates: string[] = [];
  const currentDay = date.getDay();
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - currentDay);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
};

export const getDayName = (date: string): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[parseDate(date).getDay()];
};

export const isToday = (date: string): boolean => {
  return date === getToday();
};
