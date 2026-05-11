import type { Habit } from '../store/useHabitStore';

export const DEFAULT_CATEGORY = 'General';

export const normalizeCategory = (category?: string): string => {
  const value = category?.trim();
  return value ? value : DEFAULT_CATEGORY;
};

export const getActiveHabits = (habits: Habit[]): Habit[] => habits.filter((habit) => !habit.isArchived);

export const getHabitCategories = (habits: Habit[]): string[] => {
  const categories = new Set(habits.map((habit) => normalizeCategory(habit.category)));
  return [
    'All Categories',
    ...Array.from(categories).sort((a, b) => a.localeCompare(b))
  ];
};

export const filterHabitsByCategory = (habits: Habit[], selectedCategory: string): Habit[] => {
  if (selectedCategory === 'All Categories') return habits;
  return habits.filter((habit) => normalizeCategory(habit.category) === selectedCategory);
};

export interface HabitCategorySummary {
  category: string;
  totalHabits: number;
  completedToday: number;
}

export const getHabitCategorySummary = (habits: Habit[], targetIsoDate: string): HabitCategorySummary[] => {
  const summaryMap = new Map<string, HabitCategorySummary>();

  habits.forEach((habit) => {
    const category = normalizeCategory(habit.category);
    const existing = summaryMap.get(category) ?? {
      category,
      totalHabits: 0,
      completedToday: 0
    };

    existing.totalHabits += 1;
    if (habit.completedDates.includes(targetIsoDate)) {
      existing.completedToday += 1;
    }

    summaryMap.set(category, existing);
  });

  return Array.from(summaryMap.values()).sort((a, b) => a.category.localeCompare(b.category));
};
