import { subDays } from 'date-fns';

/**
 * Returns a local timezone-adjusted ISO date string (YYYY-MM-DD)
 */
export const toISOLocal = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentDateIso = (): string => toISOLocal(new Date());


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

export const generateCurrentWeekRange = (): DayContext[] => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 Sunday
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  return Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d, iso: toISOLocal(d) };
  });
};

export const generateCurrentMonthRange = (): DayContext[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }).map((_, i) => {
    const d = new Date(year, month, i + 1);
    return { date: d, iso: toISOLocal(d) };
  });
};

export const getMonthKey = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const isLastDayOfMonth = (date: Date = new Date()): boolean => {
  return date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const isInCurrentWeek = (isoDate: string, now: Date = new Date()): boolean => {
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return false;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return target >= start && target <= end;
};

export const isInCurrentMonth = (isoDate: string, now: Date = new Date()): boolean => {
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return false;
  return target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth();
};

export const isDateEditable = (isoDate: string, monthValidation: Record<string, boolean>, now: Date = new Date()): boolean => {
  const monthKey = isoDate.slice(0, 7);
  const monthLocked = monthValidation[monthKey] === true;
  return isInCurrentMonth(isoDate, now) && isInCurrentWeek(isoDate, now) && !monthLocked;
};

