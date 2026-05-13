import type { Habit } from '../../backend/models/habitModels';

export const DEFAULT_CATEGORY = 'General';

export interface HabitCategoryTheme {
  key: string;
  label: string;
  aliases: string[];
  icon: string;
  cardClass: string;
  badgeClass: string;
  progressClass: string;
  ambientClass: string;
  animation: 'pulse' | 'float' | 'bounce' | 'glow' | 'steady';
}

const CATEGORY_THEMES: HabitCategoryTheme[] = [
  {
    key: 'health',
    label: 'Health',
    aliases: ['health', 'fitness', 'wellness'],
    icon: 'favorite',
    cardClass: 'from-emerald-100/90 to-teal-100/70 border-emerald-200/70',
    badgeClass: 'bg-emerald-500/15 text-emerald-700',
    progressClass: 'bg-emerald-500',
    ambientClass: 'from-emerald-500/8 to-transparent',
    animation: 'pulse'
  },
  {
    key: 'finance',
    label: 'Finance',
    aliases: ['finance', 'money', 'budget', 'investment'],
    icon: 'payments',
    cardClass: 'from-amber-100/90 to-yellow-100/70 border-amber-200/70',
    badgeClass: 'bg-amber-500/15 text-amber-700',
    progressClass: 'bg-amber-500',
    ambientClass: 'from-amber-500/10 to-transparent',
    animation: 'glow'
  },
  {
    key: 'self_healing',
    label: 'Self Healing',
    aliases: ['self healing', 'self-healing', 'mindfulness', 'mental health', 'healing'],
    icon: 'spa',
    cardClass: 'from-fuchsia-100/90 to-violet-100/70 border-fuchsia-200/70',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-700',
    progressClass: 'bg-fuchsia-500',
    ambientClass: 'from-fuchsia-500/10 to-transparent',
    animation: 'float'
  },
  {
    key: 'study',
    label: 'Study',
    aliases: ['study', 'learning', 'education', 'reading'],
    icon: 'school',
    cardClass: 'from-sky-100/90 to-indigo-100/70 border-sky-200/70',
    badgeClass: 'bg-sky-500/15 text-sky-700',
    progressClass: 'bg-sky-500',
    ambientClass: 'from-sky-500/10 to-transparent',
    animation: 'bounce'
  }
];

export const normalizeCategory = (category?: string): string => {
  const value = category?.trim();
  return value ? value : DEFAULT_CATEGORY;
};

export const getCategoryTheme = (category?: string): HabitCategoryTheme => {
  const normalized = normalizeCategory(category).toLowerCase();
  return CATEGORY_THEMES.find((theme) => theme.aliases.some((alias) => normalized.includes(alias))) ?? {
    key: 'general',
    label: DEFAULT_CATEGORY,
    aliases: ['general'],
    icon: 'track_changes',
    cardClass: 'from-slate-100/90 to-blue-100/60 border-slate-200/70',
    badgeClass: 'bg-slate-500/15 text-slate-700',
    progressClass: 'bg-primary',
    ambientClass: 'from-blue-500/10 to-transparent',
    animation: 'steady'
  };
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
