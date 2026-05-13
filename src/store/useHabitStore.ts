import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getMonthKey, isInCurrentMonth, isInCurrentWeek, toISOLocal } from '../utils/dateUtils';
import { normalizeCategory } from '../utils/habitUtils';
import { ACTIVE_DAY_LOG_RANGE_DAYS, readArchiveMap, writeArchiveMap } from '../features/daylog/utils/dayLogArchive';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  isPremium: boolean;
  completedDates: string[]; // ISO date strings
  isArchived?: boolean; // Added for soft delete
  category: string;
}

export interface UserProfile {
  displayName: string;
  email: string;
  avatarUrl: string;
}
export interface DayLogEntry {
  id: string;
  date: string;
  createdAt: Date;
  activity: string;
  evidences?: DayLogEvidence[];
}
export interface DayLogEvidence {
  id: string;
  kind: 'finance_bill' | 'food_image' | 'other';
  name: string;
  mimeType: string;
  dataUrl: string;
  addedAt: Date;
}

interface HabitStore {
  archivedDayLogs: Record<string, DayLogEntry[]>;
  habits: Habit[];
  userProfile: UserProfile;
  isAddModalOpen: boolean;
  dayLogs: DayLogEntry[];
  setAddModalOpen: (isOpen: boolean) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'isArchived'>) => void;
  deleteHabit: (id: string) => void; // Hard delete
  archiveHabit: (id: string) => void; // Soft delete
  toggleHabitCompletion: (id: string, targetDate?: string) => void;
  clearAllData: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  addDayLog: (activity: string, targetDate?: string, evidences?: DayLogEvidence[]) => void;
  monthValidation: Record<string, boolean>;
  validateCurrentMonthData: () => void;
  canModifyDate: (dateIso: string) => boolean;
  archiveOldLogsToCloud: () => void;
  retrieveArchivedLogsForDate: (dateIso: string) => DayLogEntry[];
}

const DEFAULT_USER_PROFILE: UserProfile = {
  displayName: "Alex Rivera",
  email: "alex.rivera@habitbuilder.io",
  avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgXeV2ntA8q2b0Y6ro68eoPLXIEgIdu4olVB1JkjvAW5UGz_eAGGyRsRx-dq2QaWwOo1Rufvt4uWCfjZDZC2HdhHjjGaYEqHnGUwGKKaX_LZuSx5ZVKUHvylMQDoXr8s8hxuVJAWaKtB-2uIVSCxcjSq_IWZlV1ium2ryEff6j4guDcOMtIVrK_oXQBXLDPX0BRBravBk_-yqtMB6hxgkkMW6h-KR8eRgk3zx6dmsNO8WAKPFnRUxExtp6Pbw6y8EsAEApnByGSeLV"
};
const MAX_HABITS_PER_CATEGORY = 10;

export const useHabitStore = create<HabitStore>()(
  persist(
    (set) => ({
      habits: [],
      dayLogs: [],
      archivedDayLogs: {},
      monthValidation: {},
      userProfile: DEFAULT_USER_PROFILE,
      isAddModalOpen: false,
      setAddModalOpen: (isOpen) => set({ isAddModalOpen: isOpen }),
      
      addHabit: (habitData) => set((state) => {
        const category = normalizeCategory(habitData.category);
        const categoryCount = state.habits.filter((habit) => !habit.isArchived && habit.category === category).length;
        if (categoryCount >= MAX_HABITS_PER_CATEGORY) {
          return state;
        }

        return {
          habits: [
            ...state.habits,
            {
              ...habitData,
              category,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              completedDates: [],
              isArchived: false,
            }
          ]
        };
      }),

      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter((h) => h.id !== id)
      })),

      archiveHabit: (id) => set((state) => ({
        habits: state.habits.map((habit) => 
          habit.id === id ? { ...habit, isArchived: true } : habit
        )
      })),

      toggleHabitCompletion: (id, targetDate) => set((state) => ({
        habits: state.habits.map((habit) => {
          if (habit.id !== id) return habit;
          
          const dateStr = targetDate || toISOLocal(new Date());
          const monthKey = dateStr.slice(0, 7);
          const monthLocked = state.monthValidation[monthKey] === true;
          const editable = isInCurrentMonth(dateStr) && isInCurrentWeek(dateStr) && !monthLocked;
          if (!editable) return habit;
          const hasCompleted = habit.completedDates.includes(dateStr);
          
          return {
            ...habit,
            completedDates: hasCompleted
              ? habit.completedDates.filter(date => date !== dateStr)
              : [...habit.completedDates, dateStr]
          };
        })
      })),

      updateUserProfile: (updates) => set((state) => ({
        userProfile: { ...state.userProfile, ...updates }
      })),
      addDayLog: (activity, targetDate, evidences = []) => set((state) => {
        const dateStr = targetDate || toISOLocal(new Date());
        const monthKey = dateStr.slice(0, 7);
        const monthLocked = state.monthValidation[monthKey] === true;
        const editable = isInCurrentMonth(dateStr) && isInCurrentWeek(dateStr) && !monthLocked;
        if (!editable) return state;
        const trimmed = activity.trim();
        if (!trimmed && evidences.length === 0) return state;
        return {
          dayLogs: [
            {
              id: crypto.randomUUID(),
              date: dateStr,
              createdAt: new Date(),
              activity: trimmed || 'Evidence-only log entry',
              evidences
            },
            ...state.dayLogs
          ]
        };
      }),
      validateCurrentMonthData: () => set((state) => {
        const key = getMonthKey(new Date());
        return { monthValidation: { ...state.monthValidation, [key]: true } };
      }),

      archiveOldLogsToCloud: () => set((state) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - ACTIVE_DAY_LOG_RANGE_DAYS);
        const cutoffIso = toISOLocal(cutoff);

        const toArchive = state.dayLogs.filter((log) => log.date < cutoffIso);
        if (toArchive.length === 0) return state;

        const archiveMap = { ...state.archivedDayLogs };
        toArchive.forEach((log) => {
          archiveMap[log.date] = [...(archiveMap[log.date] ?? []), log];
        });

        writeArchiveMap(archiveMap);

        return {
          dayLogs: state.dayLogs.filter((log) => log.date >= cutoffIso),
          archivedDayLogs: archiveMap
        };
      }),
      retrieveArchivedLogsForDate: (dateIso) => {
        const state = useHabitStore.getState();
        const inMemory = state.archivedDayLogs[dateIso] ?? [];
        if (inMemory.length > 0) return inMemory;
        const parsed = readArchiveMap();
        return parsed[dateIso] ?? [];
      },
      canModifyDate: (dateIso) => {
        const key = dateIso.slice(0, 7);
        const state = useHabitStore.getState();
        return isInCurrentMonth(dateIso) && isInCurrentWeek(dateIso) && state.monthValidation[key] !== true;
      },

      clearAllData: () => set({
        habits: [],
        dayLogs: [],
        monthValidation: {},
        archivedDayLogs: {},
        userProfile: DEFAULT_USER_PROFILE,
        isAddModalOpen: false
      })
    }),
    {
      name: 'habit-tracker-local-storage',
      // Custom deserialization to ensure createdAt is restored as a Date object
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;

        const safeHabits = Array.isArray(persistedState.habits)
          ? persistedState.habits
              .filter((habit: any) => habit && typeof habit.id === 'string' && typeof habit.title === 'string')
              .map((habit: any) => {
                const createdAt = new Date(habit.createdAt);
                return {
                  ...habit,
                  category: normalizeCategory(habit.category),
                  createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
                  completedDates: Array.isArray(habit.completedDates)
                    ? habit.completedDates.filter((date: unknown) => typeof date === 'string')
                    : []
                };
              })
          : [];
        const safeDayLogs = Array.isArray(persistedState.dayLogs)
          ? persistedState.dayLogs
              .filter((log: any) => log && typeof log.activity === 'string')
              .map((log: any) => {
                const createdAt = new Date(log.createdAt);
                return {
                  id: typeof log.id === 'string' ? log.id : crypto.randomUUID(),
                  date: typeof log.date === 'string' ? log.date : toISOLocal(new Date()),
                  activity: log.activity.trim(),
                  createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
                  evidences: Array.isArray(log.evidences)
                    ? log.evidences
                        .filter((e: any) => e && typeof e.name === 'string' && typeof e.dataUrl === 'string')
                        .map((e: any) => {
                          const addedAt = new Date(e.addedAt);
                          return {
                            id: typeof e.id === 'string' ? e.id : crypto.randomUUID(),
                            kind: e.kind === 'finance_bill' || e.kind === 'food_image' ? e.kind : 'other',
                            name: e.name,
                            mimeType: typeof e.mimeType === 'string' ? e.mimeType : 'application/octet-stream',
                            dataUrl: e.dataUrl,
                            addedAt: Number.isNaN(addedAt.getTime()) ? new Date() : addedAt
                          };
                        })
                    : []
                };
              })
              .filter((log: any) => log.activity.length > 0)
          : [];
        
        const safeArchivedLogs = persistedState.archivedDayLogs && typeof persistedState.archivedDayLogs === 'object' ? persistedState.archivedDayLogs : {};

        return {
          ...currentState,
          ...persistedState,
          habits: safeHabits,
          dayLogs: safeDayLogs,
          archivedDayLogs: safeArchivedLogs
        };
      }
    }
  )
);
