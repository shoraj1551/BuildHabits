import React, { useState } from 'react';
import { Home, BarChart, Settings, Plus } from 'lucide-react';
import { AddHabitModal } from './AddHabitModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useHabitStore, HabitStore } from '../../backend/store/useHabitStore';
import { motionTokens } from '../../design-system/tokens/motion';

export type Page = 'dashboard' | 'analytics' | 'daylog' | 'settings' | 'habit-detail';

interface AppLayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activePage, onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userProfile = useHabitStore((state: HabitStore) => state.userProfile);

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'daylog', icon: Plus, label: 'Log Day', highlighted: true },
    { id: 'analytics', icon: BarChart, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-on-surface font-sans selection:bg-blue-500/30 relative">
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/10 blur-[150px] pointer-events-none" />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col bg-slate-900/60 backdrop-blur-3xl border-r border-white/5 shadow-2xl transition-all duration-300 sm:w-[260px]">
        <div className="flex h-20 items-center justify-center sm:justify-start sm:px-8 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 text-white">
              <span className="font-bold text-sm tracking-tighter">HB</span>
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-white sm:block glow-text">HabitBuilder</span>
          </div>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-2 px-4 sm:px-6">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id as Page)}
                className={`relative group flex items-center gap-4 rounded-2xl p-3.5 transition-all duration-200 outline-none ${
                  isActive 
                    ? 'text-blue-400 bg-blue-400/10' 
                    : item.highlighted 
                      ? 'text-purple-400 bg-purple-400/5 hover:bg-purple-400/10 ring-1 ring-purple-400/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebarActiveIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                    transition={motionTokens.spring.snappy}
                  />
                )}
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive || item.highlighted ? 'scale-110' : 'group-hover:scale-110'} ${item.highlighted && !isActive ? 'text-purple-400 animate-pulse' : ''}`} strokeWidth={isActive || item.highlighted ? 2.5 : 2} />
                <span className={`hidden sm:block text-sm transition-all duration-200 ${isActive || item.highlighted ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                  {item.highlighted && !isActive && <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-purple-400 animate-ping" />}
                </span>
              </button>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="mb-6 mx-4 sm:mx-6 p-4 rounded-2xl bg-slate-800/40 backdrop-blur-md border border-white/5 flex items-center justify-center sm:justify-start gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-blue-500/30">
            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:flex flex-col text-left overflow-hidden">
            <span className="text-xs font-bold text-white truncate">{userProfile.displayName || 'User'}</span>
            <span className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-widest">Premium</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-20 flex-1 overflow-y-auto sm:ml-[260px] bg-transparent relative z-10">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-8 h-full flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: motionTokens.duration.medium, ease: motionTokens.ease.standard }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* FAB - Add New Habit */}
      <motion.button 
        whileHover={{ scale: 1.1, y: -4, boxShadow: '0 0 20px rgba(96, 165, 250, 0.4)' }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl z-50 group"
        aria-label="Add New Habit"
        title="Add New Habit"
      >
        <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
      </motion.button>

      <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
