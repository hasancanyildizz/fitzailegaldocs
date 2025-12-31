// Date utility functions

// Format date as YYYY-MM-DD using LOCAL timezone
const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getToday = (): string => {
  return formatLocalDate(new Date());
};

export const getYesterday = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return formatLocalDate(date);
};

export const formatDate = (date: Date): string => {
  return formatLocalDate(date);
};

export const parseDate = (dateStr: string): Date => {
  // Handle both YYYY-MM-DD and ISO timestamp formats
  if (dateStr.includes('T')) {
    // ISO timestamp format - convert to local time
    return new Date(dateStr);
  }
  // YYYY-MM-DD format - create date at local midnight
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
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
