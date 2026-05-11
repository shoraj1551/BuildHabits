import React, { useState, useMemo } from 'react';
import { useHabitStore } from '../store/useHabitStore';
import { format } from 'date-fns';
import { toISOLocal, generateCurrentMonthRange, generateCurrentWeekRange } from '../utils/dateUtils';
import { getCompletionsPerDay, calculateConsistencyScore, getHabitCompletionCount } from '../utils/analyticsUtils';
import { filterHabitsByCategory, getActiveHabits, getHabitCategories } from '../utils/habitUtils';

export const Analytics: React.FC = () => {
  const habits = useHabitStore((state) => state.habits);
  const toggleHabitCompletion = useHabitStore((state) => state.toggleHabitCompletion);

  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const activeHabits = useMemo(() => getActiveHabits(habits), [habits]);
  const categories = useMemo(() => getHabitCategories(activeHabits), [activeHabits]);
  const scopedHabits = useMemo(() => filterHabitsByCategory(activeHabits, selectedCategory), [activeHabits, selectedCategory]);

  // Generate days based on selected period
  const days = useMemo(
    () => (period === 'week' ? generateCurrentWeekRange() : generateCurrentMonthRange()),
    [period]
  );

  const completionsPerDay = useMemo(() => {
    return getCompletionsPerDay(scopedHabits, days);
  }, [scopedHabits, days]);

  const maxCompletions = Math.max(...completionsPerDay, 1);
  const reliability = calculateConsistencyScore(scopedHabits, days.length, days);
  const avgCompletionsPerHabit = scopedHabits.length > 0
    ? (completionsPerDay.reduce((sum, value) => sum + value, 0) / scopedHabits.length).toFixed(1)
    : '0.0';

  const weekdayPerformance = useMemo(() => {
    const buckets = [
      { label: 'Mon', completions: 0, samples: 0 },
      { label: 'Tue', completions: 0, samples: 0 },
      { label: 'Wed', completions: 0, samples: 0 },
      { label: 'Thu', completions: 0, samples: 0 },
      { label: 'Fri', completions: 0, samples: 0 },
      { label: 'Sat', completions: 0, samples: 0 },
      { label: 'Sun', completions: 0, samples: 0 }
    ];

    days.forEach((day, index) => {
      const weekdayIndex = (day.date.getDay() + 6) % 7;
      buckets[weekdayIndex].completions += completionsPerDay[index] || 0;
      buckets[weekdayIndex].samples += 1;
    });

    return buckets.map((item) => ({
      ...item,
      avg: item.samples > 0 ? item.completions / item.samples : 0
    }));
  }, [days, completionsPerDay]);

  const aiInsight = useMemo(() => {
    if (scopedHabits.length === 0) {
      return 'No active habits in this category yet. Add one and start building momentum.';
    }

    const bestDay = [...weekdayPerformance].sort((a, b) => b.avg - a.avg)[0];
    const worstDay = [...weekdayPerformance].sort((a, b) => a.avg - b.avg)[0];
    const intensity = reliability >= 75 ? 'strong' : reliability >= 45 ? 'developing' : 'early';

    return `Your ${selectedCategory} routine is ${intensity}. Best execution happens on ${bestDay.label}, while ${worstDay.label} is the lowest. Schedule lighter versions of habits on ${worstDay.label} to protect consistency.`;
  }, [scopedHabits.length, weekdayPerformance, reliability, selectedCategory]);

  const renderMatrixRows = (habitList: typeof habits, isArchivedSection: boolean) => {
    if (habitList.length === 0) return null;
    
    return habitList.map((habit) => {
      // Calculate habit specific reliability
      const habitCompletions = getHabitCompletionCount(habit, days);
      const habitReliability = days.length > 0 ? Math.round((habitCompletions / days.length) * 100) : 0;
      
      let badgeLabel = 'Building';
      if (habitReliability > 80) badgeLabel = 'High Consistency';
      else if (habitReliability < 30) badgeLabel = 'Needs Focus';
      else badgeLabel = 'Steady';

      return (
        <div key={habit.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: `minmax(140px, 2fr) repeat(${days.length}, minmax(36px, 1fr)) minmax(120px, 3fr)` }}>
          <div className={`font-label-md truncate pr-md ${isArchivedSection ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
            {habit.title}
          </div>
          
          {days.map((day, i) => {
            const isCompleted = habit.completedDates.includes(day.iso);
            return (
              <button
                key={i}
                onClick={() => toggleHabitCompletion(habit.id, day.iso)}
                disabled={isArchivedSection}
                className={`h-10 rounded-lg transition-all ${
                  isCompleted 
                    ? 'bg-primary shadow-sm border border-white/50 hover:bg-primary/90' 
                    : 'bg-primary/10 hover:bg-primary/20'
                } ${isArchivedSection ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={`${format(day.date, 'MMM d, yyyy')} - ${isCompleted ? 'Completed' : 'Missed'}`}
              />
            );
          })}
          
          <div className="pl-md flex items-center hidden sm:flex">
            <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded whitespace-nowrap overflow-hidden text-ellipsis">
              {isArchivedSection ? 'Archived' : badgeLabel}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <section className="p-lg lg:p-xl space-y-lg flex-1 bg-background text-on-background font-body-md">
      {/* Filters & Overview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md">
        <div>
          <h3 className="font-display-lg text-headline-lg text-on-surface">Weekly Progress</h3>
          <p className="font-body-md text-on-surface-variant">You've completed {reliability}% of your goals tracked. Keep it up!</p>
        </div>
        <div className="flex items-center gap-sm">
          <label className="text-sm text-on-surface-variant">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-lg border border-outline-variant/30 bg-surface px-sm py-xs text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <div className="bg-surface-container-low p-base rounded-xl flex items-center border border-outline-variant/30 shadow-sm shrink-0">
          <button 
            onClick={() => setPeriod('week')}
            className={`px-lg py-sm rounded-lg font-bold transition-all text-label-md ${period === 'week' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Current Week
          </button>
          <button 
            onClick={() => setPeriod('month')}
            className={`px-lg py-sm rounded-lg font-bold transition-all text-label-md ${period === 'month' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Current Month
          </button>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-12 gap-lg">
        
        {/* Total Output Chart (Large) */}
        <div className="col-span-12 lg:col-span-8 bg-white/70 backdrop-blur-md border border-white/30 shadow-[0px_20px_40px_rgba(92,36,179,0.08)] p-lg rounded-[24px] flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-xl">
            <div>
              <h4 className="font-headline-md text-on-surface">Total Output</h4>
              <p className="font-label-sm text-on-surface-variant">Avg {avgCompletionsPerHabit} completions per active habit</p>
            </div>
            <div className="flex gap-sm">
              <span className="flex items-center gap-xs font-label-md text-green-600">
                <span className="material-symbols-outlined text-[18px]" data-icon="trending_up">trending_up</span>
                Active
              </span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2 px-1 sm:px-md overflow-x-auto hide-scrollbar">
            {days.map((day, i) => {
              const val = completionsPerDay[i];
              const pct = maxCompletions > 0 ? (val / maxCompletions) * 100 : 0;
              const isToday = format(day.date, 'yyyy-MM-dd') === toISOLocal(new Date());
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-sm min-w-[24px]">
                  <div 
                    className={`w-full rounded-t-lg transition-all relative group ${isToday ? 'bg-primary shadow-lg shadow-primary/20' : 'bg-primary/10 hover:bg-primary/30'}`}
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      {val}
                    </div>
                  </div>
                  <span className={`text-[10px] sm:font-label-sm whitespace-nowrap ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
                    {period === 'week' ? format(day.date, 'E') : format(day.date, 'd')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekday Consistency Chart */}
        <div className="col-span-12 lg:col-span-6 bg-white/70 backdrop-blur-md border border-white/30 shadow-[0px_20px_40px_rgba(92,36,179,0.08)] p-lg rounded-[24px]">
          <div className="flex justify-between items-center mb-md">
            <h4 className="font-headline-md text-on-surface">Weekday Consistency</h4>
            <span className="text-xs text-on-surface-variant">Average completions</span>
          </div>
          <div className="space-y-sm">
            {weekdayPerformance.map((day) => {
              const pct = maxCompletions > 0 ? Math.min((day.avg / maxCompletions) * 100, 100) : 0;
              return (
                <div key={day.label} className="flex items-center gap-sm">
                  <span className="w-10 text-xs text-on-surface-variant">{day.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(pct, 4)}%` }}></div>
                  </div>
                  <span className="w-12 text-right text-xs font-semibold text-on-surface">{day.avg.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Habit Reliability Ranking */}
        <div className="col-span-12 lg:col-span-6 bg-white/70 backdrop-blur-md border border-white/30 shadow-[0px_20px_40px_rgba(92,36,179,0.08)] p-lg rounded-[24px]">
          <div className="flex justify-between items-center mb-md">
            <h4 className="font-headline-md text-on-surface">Habit Reliability Ranking</h4>
            <span className="text-xs text-on-surface-variant">Top performers</span>
          </div>
          <div className="space-y-sm">
            {scopedHabits
              .map((habit) => ({
                habit,
                score: days.length > 0 ? Math.round((getHabitCompletionCount(habit, days) / days.length) * 100) : 0
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map(({ habit, score }) => (
                <div key={habit.id} className="rounded-lg border border-outline-variant/20 px-sm py-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-on-surface truncate pr-2">{habit.title}</span>
                    <span className="font-semibold text-primary">{score}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(score, 3)}%` }}></div>
                  </div>
                </div>
              ))}
            {scopedHabits.length === 0 && <p className="text-sm text-on-surface-variant">No habits to rank in this scope.</p>}
          </div>
        </div>

        {/* Active Habits Card (Small) */}
        <div className="col-span-12 lg:col-span-4 bg-white/70 backdrop-blur-md border border-white/30 shadow-[0px_20px_40px_rgba(92,36,179,0.08)] p-lg rounded-[24px] flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10">
            <h4 className="font-headline-md text-on-surface">Active Habits</h4>
            <p className="font-label-sm text-on-surface-variant">Currently tracking</p>
            
            <div className="mt-xl">
              <div className="text-[64px] font-display-lg font-bold text-primary leading-none">{scopedHabits.length}</div>
              <div className="flex items-center gap-sm mt-sm">
                <div className="flex -space-x-2">
                  {scopedHabits.slice(0, 3).map((h, i) => {
                    const colors = ['bg-tertiary-container', 'bg-secondary', 'bg-primary'];
                    return (
                      <div key={h.id} className={`w-8 h-8 rounded-full ${colors[i%3]} text-white flex items-center justify-center text-[10px] border-2 border-white font-bold uppercase`}>
                        {h.title.substring(0, 2)}
                      </div>
                    );
                  })}
                </div>
                {scopedHabits.length > 3 && (
                  <span className="font-label-sm text-on-surface-variant">+{scopedHabits.length - 3} more</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-lg z-10">
            <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${reliability}%` }}></div>
            </div>
            <div className="flex justify-between mt-sm">
              <span className="font-label-sm text-on-surface-variant">{reliability}% Streak Reliability</span>
            </div>
          </div>
          
          {/* Decorative background glow */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 blur-[60px] rounded-full pointer-events-none"></div>
        </div>

        {/* Habit Trajectory Matrix (Heatmap - Full Width) */}
        <div className="col-span-12 bg-white/70 backdrop-blur-md border border-white/30 shadow-[0px_20px_40px_rgba(92,36,179,0.08)] p-lg rounded-[24px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-xl gap-md">
            <div>
              <h4 className="font-headline-md text-on-surface">Habit Trajectory Matrix</h4>
              <p className="font-label-sm text-on-surface-variant">Density of completion across your routine stack</p>
            </div>
            <div className="flex items-center gap-md">
              <div className="flex items-center gap-sm">
                <span className="font-label-sm text-on-surface-variant">Missed</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded-sm bg-primary/10"></div>
                  <div className="w-4 h-4 rounded-sm bg-primary border border-white/50"></div>
                </div>
                <span className="font-label-sm text-on-surface-variant">Done</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto pb-md hide-scrollbar">
            <div className={`min-w-[${period === 'month' ? '1200px' : '600px'}]`}>
              
              {/* Matrix Labels */}
              <div className="grid gap-2 mb-sm text-center" style={{ gridTemplateColumns: `minmax(140px, 2fr) repeat(${days.length}, minmax(36px, 1fr)) minmax(120px, 3fr)` }}>
                <div></div>
                {days.map((day, i) => (
                  <div key={i} className="font-label-sm text-on-surface-variant flex flex-col items-center">
                    <span className="text-[10px]">{period === 'week' ? format(day.date, 'EEE') : format(day.date, 'MMM')}</span>
                    <span className={`text-xs ${format(day.date, 'yyyy-MM-dd') === toISOLocal(new Date()) ? 'text-primary font-bold' : ''}`}>{format(day.date, 'd')}</span>
                  </div>
                ))}
                <div className="hidden sm:block"></div>
              </div>

              {/* Matrix Rows */}
              <div className="space-y-2">
                {habits.length === 0 && (
                   <div className="text-center p-8 text-on-surface-variant font-medium">No habits configured yet.</div>
                )}
                {renderMatrixRows(scopedHabits, false)}
                
                {/* Archived */}
                {habits.filter(h => h.isArchived).length > 0 && (
                  <>
                    <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-8 mb-2 border-b border-outline-variant/20 pb-2">Archived Habits</div>
                    {renderMatrixRows(habits.filter(h => h.isArchived), true)}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Contextual Insight Footer */}
      <div className="bg-primary/5 border border-primary/10 p-lg rounded-[24px] flex flex-col md:flex-row items-center gap-lg">
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
          <span className="material-symbols-outlined" data-icon="lightbulb" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
        </div>
        <div>
          <h5 className="font-label-md text-primary font-bold">AI Insight: Consistency Analysis</h5>
          <p className="font-body-md text-on-surface-variant">{aiInsight}</p>
        </div>
      </div>
    </section>
  );
};
