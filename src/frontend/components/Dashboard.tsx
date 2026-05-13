import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useHabitStore, HabitStore } from '../../backend/store/useHabitStore';
import { format } from 'date-fns';
import { toISOLocal, generateDateRange, getMonthKey, isLastDayOfMonth } from '../../shared/utils/dateUtils';
import { getCompletionsPerDay, calculateConsistencyScore, getHabitCompletionCount } from '../../shared/utils/analyticsUtils';
import { filterHabitsByCategory, getActiveHabits, getCategoryTheme, getHabitCategories, getHabitCategorySummary } from '../../shared/utils/habitUtils';
import type { DayLogEvidence } from '../../backend/store/useHabitStore';
import { motionTokens } from '../../design-system/tokens/motion';
import { DayLogPanel } from './DayLogPanel';

interface DashboardProps {
  onOpenHabit: (habitId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenHabit }) => {
  const habits = useHabitStore((state: HabitStore) => state.habits);
  const userProfile = useHabitStore((state: HabitStore) => state.userProfile);
  const toggleHabitCompletion = useHabitStore((state: HabitStore) => state.toggleHabitCompletion);
  const dayLogs = useHabitStore((state: HabitStore) => state.dayLogs);
  const addDayLog = useHabitStore((state: HabitStore) => state.addDayLog);
  const monthValidation = useHabitStore((state: HabitStore) => state.monthValidation);
  const validateCurrentMonthData = useHabitStore((state: HabitStore) => state.validateCurrentMonthData);
  const canModifyDate = useHabitStore((state: HabitStore) => state.canModifyDate);
  const archiveOldLogsToCloud = useHabitStore((state: HabitStore) => state.archiveOldLogsToCloud);
  const retrieveArchivedLogsForDate = useHabitStore((state: HabitStore) => state.retrieveArchivedLogsForDate);

  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const activeHabits = useMemo(() => getActiveHabits(habits), [habits]);
  const categories = useMemo(() => getHabitCategories(activeHabits), [activeHabits]);
  const scopedHabits = useMemo(() => filterHabitsByCategory(activeHabits, selectedCategory), [activeHabits, selectedCategory]);

  const todayIso = toISOLocal(new Date());
  const currentMonthKey = getMonthKey(new Date());
  const isCurrentMonthValidated = monthValidation[currentMonthKey] === true;
  const isMonthEnd = isLastDayOfMonth(new Date());

  // Generate last 7 days for the table and mini chart
  const last7Days = useMemo(() => generateDateRange(7), []);

  const completionsPerDay = useMemo(() => {
    return getCompletionsPerDay(scopedHabits, last7Days);
  }, [scopedHabits, last7Days]);

  const totalCompletionsThisWeek = completionsPerDay.reduce((a, b) => a + b, 0);
  const consistencyScore = calculateConsistencyScore(scopedHabits, 7, last7Days);
  const bestHabitThisWeek = useMemo(() => {
    if (scopedHabits.length === 0) return null;
    return [...scopedHabits]
      .map((habit) => ({ habit, count: getHabitCompletionCount(habit, last7Days) }))
      .sort((a, b) => b.count - a.count)[0];
  }, [scopedHabits, last7Days]);

  const [activeMood, setActiveMood] = useState<string | null>(null);
  const categorySummary = useMemo(() => getHabitCategorySummary(activeHabits, todayIso), [activeHabits, todayIso]);


  const moods = [
    { emoji: '😔', label: 'Sad' },
    { emoji: '😐', label: 'Meh' },
    { emoji: '😊', label: 'Good' },
    { emoji: '🤩', label: 'Great' },
    { emoji: '🔥', label: 'Elite' },
  ];

  useEffect(() => {
    archiveOldLogsToCloud();
  }, [archiveOldLogsToCloud]);

  const handleSaveDayLog = (activity: string, evidences: DayLogEvidence[]) => {
    if (!canModifyDate(todayIso)) return;
    addDayLog(activity, todayIso, evidences);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: motionTokens.spring.soft }
  };

  return (
    <div className={`px-lg md:px-xxl py-xl max-w-[1400px] mx-auto w-full pb-32 bg-background min-h-screen relative`}>
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-600/5 to-transparent pointer-events-none" />
      {isMonthEnd && !isCurrentMonthValidated && (
        <div className="mb-lg rounded-xl border border-amber-300 bg-amber-50 px-md py-sm flex items-center justify-between gap-md">
          <p className="text-sm text-amber-900 font-medium">Month-end validation required. Validate now; after validation, this month is locked from edits.</p>
          <button onClick={validateCurrentMonthData} className="rounded-lg bg-amber-500 text-white px-md py-xs text-sm font-semibold hover:bg-amber-600">Validate Data</button>
        </div>
      )}
      
      {/* Welcome Section & Mood Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg mb-xxl">
        <div className="lg:col-span-2 flex flex-col justify-center">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-sm tracking-tight leading-tight glow-text">Good morning, <span className="text-blue-400">{userProfile.displayName?.split(' ')[0] || 'User'}</span>.</h2>
          <p className="font-body-lg text-lg text-slate-400 max-w-2xl mt-2">You're maintaining a great streak! Keep the momentum going and build those better days.</p>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: motionTokens.duration.medium, ease: motionTokens.ease.standard }}
          className="bg-slate-900/40 backdrop-blur-xl border border-white/10 p-lg rounded-[24px] shadow-2xl flex flex-col justify-between"
        >
          <p className="font-label-md text-label-md text-slate-400 mb-md uppercase tracking-wider">How are you feeling?</p>
          <div className="flex justify-between items-center px-sm">
            {moods.map(m => (
              <motion.button 
                key={m.label} 
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveMood(m.label)}
                className="group flex flex-col items-center gap-xs outline-none"
              >
                <span className={`text-3xl transition-all transform group-hover:scale-125 ${activeMood === m.label ? 'grayscale-0 scale-125' : 'grayscale group-hover:grayscale-0'}`}>
                  {m.emoji}
                </span>
                <span className={`text-[10px] font-bold ${activeMood === m.label ? 'text-primary' : 'text-outline-variant'}`}>
                  {m.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Summary Bento Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg mb-xxl"
      >
        {/* Daily Steps */}
        <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-xl p-lg rounded-[24px] border border-white/10 flex flex-col items-center text-center shadow-xl">
          <p className="w-full text-left font-label-md text-label-md text-slate-400 mb-lg uppercase tracking-wider">Consistency</p>
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
        </motion.div>

        {/* Active Habits stat */}
        <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-xl p-lg rounded-[24px] border border-white/10 flex flex-col justify-between shadow-xl">
          <div>
            <p className="font-label-md text-label-md text-slate-400 mb-lg uppercase tracking-wider">Active Habits</p>
            <span className="font-display-lg text-[48px] text-blue-400 leading-none glow-text">{scopedHabits.length}</span>
          </div>
          <div className="flex gap-sm mt-md">
            {scopedHabits.slice(0,3).map(h => (
              <div key={h.id} className="h-2 flex-1 rounded-full bg-secondary"></div>
            ))}
          </div>
        </motion.div>

        {/* Habits Trend */}
        <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-xl p-lg rounded-[24px] md:col-span-2 border border-white/10 flex flex-col shadow-xl">
          <div className="flex justify-between items-center mb-lg">
            <p className="font-label-md text-label-md text-slate-400 uppercase tracking-wider">Weekly Completion</p>
            <span className="font-label-sm text-label-sm text-primary font-bold">Total: {totalCompletionsThisWeek}</span>
          </div>
          <div className="flex-1 flex items-end justify-between gap-sm px-sm pb-sm">
            {last7Days.map((day, i) => {
              const val = completionsPerDay[i];
              const pct = scopedHabits.length > 0 ? (val / scopedHabits.length) * 100 : 0;
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
        </motion.div>
      </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/30 backdrop-blur-xl p-lg rounded-[24px] md:col-span-2 lg:col-span-4 border border-white/5 mb-xxl"
        >
          <div className="flex items-center justify-between mb-md">
            <p className="font-label-md text-white glow-text">Category Performance Snapshot</p>
            <span className="text-xs text-slate-400 uppercase tracking-widest">Today</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm">
            {categorySummary.map((item) => {
              const pct = item.totalHabits > 0 ? Math.round((item.completedToday / item.totalHabits) * 100) : 0;
              return (
                <button
                  key={item.category}
                  onClick={() => setSelectedCategory(item.category)}
                  className="rounded-lg border border-outline-variant/20 p-sm text-left hover:border-primary/30"
                >
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-200">{item.category}</span>
                    <span className="text-blue-400 font-semibold">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-primary/10 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(pct, 3)}%` }}></div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

      {/* Wellness Habits Section (Today's Quick Checklist) */}
      <section className="mb-xxl">
        <div className="flex flex-wrap justify-between items-center gap-sm mb-lg">
          <h3 className="font-headline-md text-headline-md text-white glow-text">Today's Habits</h3>
          <div className="flex gap-sm items-center">
            <label htmlFor="dashboard-category-filter" className="text-sm text-on-surface-variant">Category</label>
            <select
              id="dashboard-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-outline-variant/30 bg-surface px-sm py-xs text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <span className="text-primary font-label-md text-label-md flex items-center gap-xs">
            {format(new Date(), 'EEEE, MMMM d')}
          </span>
        </div>

        {selectedCategory === 'All Categories' && categorySummary.length > 0 && (
          <div className="mb-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-sm">
            {categorySummary.map((item) => (
              <button
                key={item.category}
                onClick={() => setSelectedCategory(item.category)}
                className={`text-left rounded-xl border border-white/5 bg-slate-800/40 backdrop-blur-md p-md hover:bg-slate-800/60 transition-colors shadow-lg`}
              >
                <p className="text-sm font-semibold text-white">{item.category}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {item.completedToday}/{item.totalHabits} habits completed today
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {scopedHabits.length === 0 && (
            <p className="text-on-surface-variant">No active habits. Click 'New Habit' to start.</p>
          )}
          {scopedHabits.map((habit) => {
            const isCompleted = habit.completedDates.includes(todayIso);
            const theme = getCategoryTheme(habit.category);
            const motionByCategory = theme.animation === 'pulse'
              ? { scale: [1, 1.015, 1] }
              : theme.animation === 'float'
              ? { y: [0, -3, 0] }
              : theme.animation === 'bounce'
              ? { y: [0, -4, 0], scale: [1, 1.01, 1] }
              : theme.animation === 'glow'
              ? { boxShadow: ['0 10px 20px rgba(0,0,0,0.02)', '0 16px 28px rgba(251,191,36,0.18)', '0 10px 20px rgba(0,0,0,0.02)'] }
              : {};
            return (
              <motion.div 
                whileHover={{ y: -2, backgroundColor: 'rgba(30, 41, 59, 0.6)' }}
                animate={motionByCategory}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                key={habit.id} 
                className={`p-md rounded-xl shadow-lg border border-white/5 flex items-center justify-between group transition-all bg-slate-900/40 backdrop-blur-md`}
              >
                <div className="flex items-center gap-md">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isCompleted ? 'bg-white text-slate-800 shadow-lg shadow-white/40' : theme.badgeClass}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {isCompleted ? 'check_circle' : theme.icon}
                    </span>
                  </div>
                  <div>
                    <h4 className={`font-label-md text-label-md transition-colors ${isCompleted ? 'text-primary font-bold' : 'text-on-surface group-hover:text-primary'}`}>{habit.title}</h4>
                    <p className="text-label-sm text-on-surface-variant opacity-70 truncate max-w-[200px]">{habit.description || 'Daily Tracker'}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${theme.badgeClass}`}>{theme.label}</span>
                  </div>
                </div>
                <button 
                  onClick={() => canModifyDate(todayIso) && toggleHabitCompletion(habit.id, todayIso)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'border-primary bg-primary text-on-primary' : 'border-primary/20 text-primary hover:bg-primary hover:text-on-primary'}`}
                >
                  <span className="material-symbols-outlined">check</span>
                </button>
                <button
                  onClick={() => onOpenHabit(habit.id)}
                  className="ml-2 rounded-lg border border-outline-variant/30 px-3 py-2 text-xs font-semibold text-on-surface-variant hover:text-primary hover:border-primary/40"
                >
                  Open
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      <DayLogPanel
        todayIso={todayIso}
        canModifyToday={canModifyDate(todayIso)}
        dayLogs={dayLogs}
        archivedLogsLookup={retrieveArchivedLogsForDate}
        onSaveLog={handleSaveDayLog}
      />

      {/* 7-Day Data Table Container */}
      <section className="bg-slate-900/40 backdrop-blur-xl rounded-[24px] shadow-2xl border border-white/10 overflow-hidden mb-xxl">
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
              {scopedHabits.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-on-surface-variant">No data to display.</td>
                </tr>
              )}
              {scopedHabits.map((habit) => {
                const habitCompletionsThisWeek = getHabitCompletionCount(habit, last7Days);
                const progressPct = (habitCompletionsThisWeek / 7) * 100;
                
                return (
                  <tr key={habit.id} className="group hover:bg-slate-800/30 transition-colors">
                    <td className="p-lg border-b border-white/5 sticky left-0 bg-slate-900/90 group-hover:bg-slate-800/90 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.2)]">
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
                              onClick={() => canModifyDate(day.iso) && toggleHabitCompletion(habit.id, day.iso)}
                              className={`w-8 h-8 mx-auto rounded-full border-2 transition-colors ${canModifyDate(day.iso) ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'} ${isToday ? 'border-primary text-primary hover:bg-primary hover:text-on-primary' : 'border-outline-variant/40 hover:border-primary/50'}`}
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

      <section className="mt-lg rounded-xl border border-primary/10 bg-primary/5 p-lg">
        <h4 className="font-semibold text-primary mb-2">AI Coach Insight</h4>
        <p className="text-sm text-on-surface-variant">
          {bestHabitThisWeek
            ? `Top performer: ${bestHabitThisWeek.habit.title} completed ${bestHabitThisWeek.count}/7 days. Keep this cue pattern and replicate it to lower-performing habits.`
            : 'No habits tracked yet for this scope. Add habits and complete at least one to unlock personalized coaching.'}
        </p>
      </section>

    </div>
  );
};
