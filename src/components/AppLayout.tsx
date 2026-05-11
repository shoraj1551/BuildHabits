import React, { useState } from 'react';
import { Home, BarChart, Settings, Plus } from 'lucide-react';
import { AddHabitModal } from './AddHabitModal';
import { motion } from 'framer-motion';
import { useHabitStore } from '../store/useHabitStore';

export type Page = 'dashboard' | 'analytics' | 'settings';

interface AppLayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, activePage, onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const userProfile = useHabitStore((state) => state.userProfile);

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'analytics', icon: BarChart, label: 'Analytics' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-20 flex-col bg-white border-r border-slate-200/60 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 sm:w-[260px]">
        <div className="flex h-20 items-center justify-center sm:justify-start sm:px-8 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 text-white">
              <span className="font-bold text-sm tracking-tighter">HB</span>
            </div>
            <span className="hidden text-xl font-bold tracking-tight text-slate-900 sm:block">HabitBuilder</span>
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
                    ? 'text-blue-600 bg-blue-50/50' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebarActiveIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`hidden sm:block text-sm transition-all duration-200 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
        
        {/* User Profile */}
        <div className="mb-6 mx-4 sm:mx-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center sm:justify-start gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
            <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="hidden sm:flex flex-col text-left overflow-hidden">
            <span className="text-xs font-bold text-slate-800 truncate">{userProfile.displayName || 'User'}</span>
            <span className="text-[10px] font-semibold text-slate-500 truncate">Premium Plan</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-20 flex-1 overflow-y-auto sm:ml-[260px] bg-slate-50/50">
        <div className="max-w-[1600px] mx-auto p-4 sm:p-8 h-full flex flex-col">
          {children}
        </div>
      </main>

      {/* FAB - Add New Habit */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-slate-900/30 hover:bg-slate-800 active:translate-y-0 active:scale-95 z-50 group"
        aria-label="Add New Habit"
        title="Add New Habit"
      >
        <Plus className="h-6 w-6 transition-transform duration-300 group-hover:rotate-90" strokeWidth={2.5} />
      </button>

      <AddHabitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};
