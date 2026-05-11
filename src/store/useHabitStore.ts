import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toISOLocal } from '../utils/dateUtils';

export interface Habit {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  isPremium: boolean;
  completedDates: string[]; // ISO date strings
  isArchived?: boolean; // Added for soft delete
}

export interface UserProfile {
  displayName: string;
  email: string;
  avatarUrl: string;
}

interface HabitStore {
  habits: Habit[];
  userProfile: UserProfile;
  isAddModalOpen: boolean;
  setAddModalOpen: (isOpen: boolean) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'isArchived'>) => void;
  deleteHabit: (id: string) => void; // Hard delete
  archiveHabit: (id: string) => void; // Soft delete
  toggleHabitCompletion: (id: string, targetDate?: string) => void;
  clearAllData: () => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
}

export const useHabitStore = create<HabitStore>()(
  persist(
    (set) => ({
      habits: [],
      userProfile: {
        displayName: "Alex Rivera",
        email: "alex.rivera@habitbuilder.io",
        avatarUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgXeV2ntA8q2b0Y6ro68eoPLXIEgIdu4olVB1JkjvAW5UGz_eAGGyRsRx-dq2QaWwOo1Rufvt4uWCfjZDZC2HdhHjjGaYEqHnGUwGKKaX_LZuSx5ZVKUHvylMQDoXr8s8hxuVJAWaKtB-2uIVSCxcjSq_IWZlV1ium2ryEff6j4guDcOMtIVrK_oXQBXLDPX0BRBravBk_-yqtMB6hxgkkMW6h-KR8eRgk3zx6dmsNO8WAKPFnRUxExtp6Pbw6y8EsAEApnByGSeLV"
      },
      isAddModalOpen: false,
      setAddModalOpen: (isOpen) => set({ isAddModalOpen: isOpen }),
      
      addHabit: (habitData) => set((state) => ({
        habits: [
          ...state.habits,
          {
            ...habitData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            completedDates: [],
            isArchived: false,
          }
        ]
      })),

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
          
          // Use centralized date utility
          const dateStr = targetDate || toISOLocal(new Date());
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

      clearAllData: () => set({ habits: [] })
    }),
    {
      name: 'habit-tracker-local-storage',
      // Custom deserialization to ensure createdAt is restored as a Date object
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        
        return {
          ...currentState,
          ...persistedState,
          habits: persistedState.habits?.map((habit: any) => ({
            ...habit,
            createdAt: new Date(habit.createdAt),
            // completedDates is already an array of strings, handled perfectly by JSON
            completedDates: habit.completedDates || []
          })) || []
        };
      }
    }
  )
);
