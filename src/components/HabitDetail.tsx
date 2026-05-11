import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { useHabitStore } from '../store/useHabitStore';
import { generateDateRange, toISOLocal } from '../utils/dateUtils';
import { normalizeCategory } from '../utils/habitUtils';

interface HabitDetailProps {
  habitId: string;
  onBack: () => void;
}

export const HabitDetail: React.FC<HabitDetailProps> = ({ habitId, onBack }) => {
  const habit = useHabitStore((state) => state.habits.find((item) => item.id === habitId));

  const recentDays = useMemo(() => generateDateRange(14), []);
  const weeklyTarget = 7;

  const completionsLast14 = useMemo(() => {
    if (!habit) return 0;
    return recentDays.filter((day) => habit.completedDates.includes(day.iso)).length;
  }, [habit, recentDays]);

  const completionRate = Math.round((completionsLast14 / recentDays.length) * 100);
  const todayIso = toISOLocal(new Date());
  const isCompletedToday = habit?.completedDates.includes(todayIso);

  const recommendations = useMemo(() => {
    if (!habit) return [];

    const output: string[] = [];
    if (completionRate < 40) {
      output.push('Reduce friction: set a 2-minute starter version of this habit and complete it at the same time each day.');
      output.push('Pair the habit with an existing routine (after coffee, after brushing teeth, or before sleep).');
    } else if (completionRate < 75) {
      output.push('You are building momentum. Keep a fixed cue and track progress daily to avoid breaks.');
      output.push('Add a small reward after completion to reinforce consistency.');
    } else {
      output.push('Great consistency. Raise challenge slightly (time, intensity, or quality) to keep progress meaningful.');
      output.push('Protect streak days with a backup minimum goal for busy days.');
    }

    if (!isCompletedToday) {
      output.push('Today is still open—complete one quick rep now to maintain rhythm.');
    }

    return output;
  }, [habit, completionRate, isCompletedToday]);

  if (!habit) {
    return (
      <div className="p-xl rounded-xl border border-outline-variant/20 bg-surface-container-lowest">
        <p className="text-on-surface-variant">Habit not found. It may have been deleted or archived.</p>
        <button onClick={onBack} className="mt-md px-md py-sm rounded-lg bg-primary text-on-primary">Back to Dashboard</button>
      </div>
    );
  }

  return (
    <section className="space-y-lg">
      <button onClick={onBack} className="text-sm font-semibold text-primary hover:underline">← Back</button>

      <div className="bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant/20">
        <div className="flex flex-wrap items-start justify-between gap-md">
          <div>
            <p className="text-xs uppercase tracking-wide text-on-surface-variant">Habit Deep Dive</p>
            <h2 className="text-2xl font-bold text-on-surface">{habit.title}</h2>
            <p className="text-sm text-on-surface-variant mt-1">{habit.description || 'No description provided.'}</p>
          </div>
          <span className="text-xs px-sm py-xs rounded-full bg-primary/10 text-primary font-semibold">
            {normalizeCategory(habit.category)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="rounded-xl border border-outline-variant/20 p-md bg-surface-container-lowest">
          <p className="text-xs text-on-surface-variant">Completion Rate (14d)</p>
          <p className="text-3xl font-bold text-primary mt-1">{completionRate}%</p>
        </div>
        <div className="rounded-xl border border-outline-variant/20 p-md bg-surface-container-lowest">
          <p className="text-xs text-on-surface-variant">Completions (14d)</p>
          <p className="text-3xl font-bold text-secondary mt-1">{completionsLast14}/{recentDays.length}</p>
        </div>
        <div className="rounded-xl border border-outline-variant/20 p-md bg-surface-container-lowest">
          <p className="text-xs text-on-surface-variant">Weekly Target</p>
          <p className="text-3xl font-bold text-tertiary mt-1">{Math.min(habit.completedDates.length, weeklyTarget)}/{weeklyTarget}</p>
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant/20 p-lg bg-surface-container-lowest">
        <h3 className="font-semibold text-on-surface mb-sm">Recent Activity</h3>
        <div className="flex flex-wrap gap-xs">
          {recentDays.map((day) => {
            const done = habit.completedDates.includes(day.iso);
            return (
              <div key={day.iso} className={`w-9 h-9 rounded-md text-[10px] flex items-center justify-center ${done ? 'bg-primary text-on-primary' : 'bg-primary/10 text-on-surface-variant'}`} title={format(day.date, 'MMM d, yyyy')}>
                {format(day.date, 'd')}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-outline-variant/20 p-lg bg-surface-container-lowest">
        <h3 className="font-semibold text-on-surface mb-sm">Recommendations</h3>
        <ul className="list-disc pl-lg space-y-xs text-sm text-on-surface-variant">
          {recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};
