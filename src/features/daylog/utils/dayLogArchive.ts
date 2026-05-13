import type { DayLogEntry } from '../../../store/useHabitStore';

export const DAY_LOG_ARCHIVE_STORAGE_KEY = 'habit-tracker-cloud-archive';
export const ACTIVE_DAY_LOG_RANGE_DAYS = 300;

export const readArchiveMap = (): Record<string, DayLogEntry[]> => {
  try {
    const raw = localStorage.getItem(DAY_LOG_ARCHIVE_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, DayLogEntry[]>;
  } catch {
    return {};
  }
};

export const writeArchiveMap = (archiveMap: Record<string, DayLogEntry[]>): void => {
  try {
    localStorage.setItem(DAY_LOG_ARCHIVE_STORAGE_KEY, JSON.stringify(archiveMap));
  } catch {
    // noop
  }
};
