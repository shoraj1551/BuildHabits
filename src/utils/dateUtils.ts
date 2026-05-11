import { subDays } from 'date-fns';

/**
 * Returns a local timezone-adjusted ISO date string (YYYY-MM-DD)
 */
export const toISOLocal = (date: Date = new Date()): string => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

export interface DayContext {
  date: Date;
  iso: string;
}

/**
 * Generates an array of dates looking backwards from today
 * @param range Number of days to include (e.g. 7 for past week including today)
 * @returns Array of { date: Date, iso: string } ordered chronologically (oldest to today)
 */
export const generateDateRange = (range: number): DayContext[] => {
  return Array.from({ length: range }).map((_, i) => {
    const d = subDays(new Date(), (range - 1) - i);
    return { date: d, iso: toISOLocal(d) };
  });
};
