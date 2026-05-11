import React, { useMemo, useState } from 'react';
import { useHabitStore } from '../store/useHabitStore';
import { format } from 'date-fns';
import { toISOLocal, generateDateRange } from '../utils/dateUtils';
import { getCompletionsPerDay, calculateConsistencyScore, getHabitCompletionCount } from '../utils/analyticsUtils';

export const Dashboard: React.FC = () => {
  const habits = useHabitStore((state) => state.habits);
  const userProfile = useHabitStore((state) => state.userProfile);
  const toggleHabitCompletion = useHabitStore((state) => state.toggleHabitCompletion);

  const activeHabits = habits.filter(h => !h.isArchived);

  const todayIso = toISOLocal(new Date());

  // Generate last 7 days for the table and mini chart
  const last7Days = useMemo(() => generateDateRange(7), []);

  const completionsPerDay = useMemo(() => {
    return getCompletionsPerDay(activeHabits, last7Days);
  }, [activeHabits, last7Days]);

  const totalCompletionsThisWeek = completionsPerDay.reduce((a, b) => a + b, 0);
  const consistencyScore = calculateConsistencyScore(activeHabits, 7, last7Days);

  const [activeMood, setActiveMood] = useState<string | null>(null);

  const moods = [
    { emoji: '😔', label: 'Sad' },
    { emoji: '😐', label: 'Meh' },
    { emoji: '😊', label: 'Good' },
    { emoji: '🤩', label: 'Great' },
    { emoji: '🔥', label: 'Elite' },
  ];

  return (
    <div className="px-lg md:px-xxl py-xl max-w-[1400px] mx-auto w-full pb-32">
      
      {/* Welcome Section & Mood Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xxl">
        <div className="lg:col-span-2">
          <h2 className="font-display-lg text-display-lg text-primary mb-sm">Good morning, {userProfile.displayName?.split(' ')[0] || 'User'}.</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">You're maintaining a great streak! Keep the momentum going and build those better days.</p>
        </div>
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-[0px_20px_40px_rgba(92,36,179,0.08)] flex flex-col justify-between">
          <p className="font-label-md text-label-md text-on-surface-variant mb-md">How are you feeling?</p>
          <div className="flex justify-between items-center px-sm">
            {moods.map(m => (
              <button 
                key={m.label} 
                onClick={() => setActiveMood(m.label)}
                className="group flex flex-col items-center gap-xs"
              >
                <span className={`text-3xl transition-all transform group-hover:scale-125 ${activeMood === m.label ? 'grayscale-0 scale-125' : 'grayscale group-hover:grayscale-0'}`}>
                  {m.emoji}
                </span>
                <span className={`text-[10px] font-bold ${activeMood === m.label ? 'text-primary' : 'text-outline-variant'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xxl">
        {/* Daily Steps */}
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-[0px_20px_40px_rgba(92,36,179,0.08)] md:col-span-1 border border-primary/5 flex flex-col items-center text-center">
          <p className="w-full text-left font-label-md text-label-md text-on-surface-variant mb-lg">Consistency</p>
          <div className="relative flex items-center justify-center mb-md">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle className="text-surface-container-highest" cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" strokeWidth="8"></circle>
              <circle 
                className="text-primary transition-all duration-1000 ease-out" 
                cx="64" cy="64" fill="transparent" r="54" stroke="currentColor" 
                strokeDasharray="339.292" 
                strokeDashoffset={339.292 - (339.292 * (consistencyScore / 100))} 
                strokeLinecap="round" strokeWidth="10"
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-display-lg text-headline-lg text-primary">{consistencyScore}%</span>
            </div>
          </div>
          <div className="bg-primary/5 px-md py-xs rounded-full flex items-center gap-xs">
            <span className="material-symbols-outlined text-[16px] text-primary">trending_up</span>
            <span className="font-label-sm text-label-sm text-primary">Active Weekly Target</span>
          </div>
        </div>

        {/* Active Habits stat */}
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-[0px_20px_40px_rgba(92,36,179,0.08)] md:col-span-1 border border-primary/5 flex flex-col justify-between">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant mb-lg">Active Habits</p>
            <span className="font-display-lg text-[48px] text-secondary leading-none">{activeHabits.length}</span>
          </div>
          <div className="flex gap-sm mt-md">
            {activeHabits.slice(0,3).map(h => (
              <div key={h.id} className="h-2 flex-1 rounded-full bg-secondary"></div>
            ))}
          </div>
        </div>

        {/* Habits Trend */}
        <div className="bg-surface-container-lowest p-lg rounded-xl shadow-[0px_20px_40px_rgba(92,36,179,0.08)] md:col-span-2 border border-primary/5 flex flex-col">
          <div className="flex justify-between items-center mb-lg">
            <p className="font-label-md text-label-md text-on-surface-variant">Weekly Completion</p>
            <span className="font-label-sm text-label-sm text-primary font-bold">Total: {totalCompletionsThisWeek}</span>
          </div>
          <div className="flex-1 flex items-end justify-between gap-sm px-sm pb-sm">
            {last7Days.map((day, i) => {
              const val = completionsPerDay[i];
              const pct = activeHabits.length > 0 ? (val / activeHabits.length) * 100 : 0;
              const isToday = day.iso === todayIso;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-sm">
                  <div className="w-full bg-primary/10 rounded-t-full h-32 relative overflow-hidden">
                    <div 
                      className={`absolute bottom-0 w-full transition-all duration-1000 ${isToday ? 'bg-primary' : 'bg-primary/60'}`} 
                      style={{ height: `${Math.max(pct, 5)}%` }}
                    ></div>
                  </div>
                  <span className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {format(day.date, 'E').substring(0, 1)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wellness Habits Section (Today's Quick Checklist) */}
      <section className="mb-xxl">
        <div className="flex justify-between items-center mb-lg">
          <h3 className="font-headline-md text-headline-md text-on-surface">Today's Habits</h3>
          <span className="text-primary font-label-md text-label-md flex items-center gap-xs">
            {format(new Date(), 'EEEE, MMMM d')}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {activeHabits.length === 0 && (
            <p className="text-on-surface-variant">No active habits. Click 'New Habit' to start.</p>
          )}
          {activeHabits.map((habit) => {
            const isCompleted = habit.completedDates.includes(todayIso);
            return (
              <div key={habit.id} className={`p-md rounded-xl shadow-[0px_20px_40px_rgba(92,36,179,0.06)] border flex items-center justify-between group transition-all ${isCompleted ? 'bg-primary/5 border-primary/20' : 'bg-surface-container-lowest border-primary/5 hover:border-primary/20'}`}>
                <div className="flex items-center gap-md">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'bg-tertiary/10 text-tertiary'}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isCompleted ? 'check_circle' : 'self_improvement'}
                    </span>
                  </div>
                  <div>
                    <h4 className={`font-label-md text-label-md transition-colors ${isCompleted ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'}`}>{habit.title}</h4>
                    <p className="text-label-sm text-on-surface-variant opacity-60 truncate max-w-[200px]">{habit.description || 'Daily Tracker'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleHabitCompletion(habit.id, todayIso)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'border-primary bg-primary text-on-primary' : 'border-primary/20 text-primary hover:bg-primary hover:text-on-primary'}`}
                >
                  <span className="material-symbols-outlined">check</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7-Day Data Table Container */}
      <section className="bg-surface-container-lowest rounded-xxl shadow-[0px_20px_40px_rgba(92,36,179,0.08)] border border-outline-variant/10 overflow-hidden">
        <div className="p-lg bg-surface-container-low/50 border-b border-outline-variant/20">
          <h3 className="font-headline-md text-on-surface">Weekly Overview</h3>
        </div>
        <div className="overflow-x-auto hide-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="p-lg font-label-md text-on-surface-variant border-b border-outline-variant/20 sticky left-0 bg-surface-container-low z-10 w-64">Habit Name</th>
                {last7Days.map((day) => {
                  const isToday = day.iso === todayIso;
                  return (
                    <th key={day.iso} className={`p-md text-center font-label-sm uppercase tracking-widest ${isToday ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-on-surface-variant border-b border-outline-variant/20'}`}>
                      {format(day.date, 'E')} <span className={`block text-xs font-normal ${isToday ? '' : 'opacity-50'}`}>{format(day.date, 'd')}</span>
                    </th>
                  );
                })}
                <th className="p-lg font-label-md text-on-surface-variant border-b border-outline-variant/20 text-right">Progress</th>
              </tr>
            </thead>
            <tbody>
              {activeHabits.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-on-surface-variant">No data to display.</td>
                </tr>
              )}
              {activeHabits.map((habit) => {
                const habitCompletionsThisWeek = getHabitCompletionCount(habit, last7Days);
                const progressPct = (habitCompletionsThisWeek / 7) * 100;
                
                return (
                  <tr key={habit.id} className="group hover:bg-surface-container-low/30 transition-colors">
                    <td className="p-lg border-b border-outline-variant/10 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-md">
                        <div className="w-10 h-10 rounded-lg bg-secondary-container/10 flex items-center justify-center text-secondary">
                          <span className="material-symbols-outlined" data-icon="fitness_center">star</span>
                        </div>
                        <div className="truncate pr-4">
                          <p className="font-label-md text-on-surface">{habit.title}</p>
                        </div>
                      </div>
                    </td>
                    
                    {last7Days.map((day) => {
                      const isCompleted = habit.completedDates.includes(day.iso);
                      const isToday = day.iso === todayIso;
                      return (
                        <td key={day.iso} className={`p-md border-b border-outline-variant/10 text-center ${isToday ? 'bg-primary/5' : ''}`}>
                          {isCompleted ? (
                            <div className="w-8 h-8 mx-auto rounded-full bg-primary flex items-center justify-center text-on-primary shadow-sm">
                              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                            </div>
                          ) : (
                            <div 
                              onClick={() => toggleHabitCompletion(habit.id, day.iso)}
                              className={`w-8 h-8 mx-auto rounded-full border-2 cursor-pointer transition-colors ${isToday ? 'border-primary text-primary hover:bg-primary hover:text-on-primary' : 'border-outline-variant/40 hover:border-primary/50'}`}
                            >
                              {isToday && <span className="material-symbols-outlined text-sm flex items-center justify-center h-full">add</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    
                    <td className="p-lg border-b border-outline-variant/10 text-right">
                      <div className="flex flex-col items-end gap-xs">
                        <span className="font-label-sm text-on-surface-variant">{habitCompletionsThisWeek}/7 days</span>
                        <div className="w-32 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};
