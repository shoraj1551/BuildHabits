import { Habit } from '../../backend/models/habitModels';
import { DayContext } from './dateUtils';

/**
 * Returns an array representing the number of habits completed for each day in the provided range
 */
export const getCompletionsPerDay = (habits: Habit[], dateRange: DayContext[]): number[] => {
  return dateRange.map(({ iso }) => {
    return habits.reduce((acc, habit) => acc + (habit.completedDates.includes(iso) ? 1 : 0), 0);
  });
};

/**
 * Calculates a 0-100 score of how many active habits were completed across a date range
 */
export const calculateConsistencyScore = (habits: Habit[], rangeDays: number, dateRange: DayContext[]): number => {
  if (habits.length === 0 || rangeDays === 0) return 0;
  const completionsPerDay = getCompletionsPerDay(habits, dateRange);
  const totalCompletions = completionsPerDay.reduce((a, b) => a + b, 0);
  const totalPossible = habits.length * rangeDays;
  return Math.round((totalCompletions / totalPossible) * 100);
};

/**
 * Returns how many times a specific habit was completed in a given date range
 */
export const getHabitCompletionCount = (habit: Habit, dateRange: DayContext[]): number => {
  return dateRange.filter(d => habit.completedDates.includes(d.iso)).length;
};
