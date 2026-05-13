import React, { useState } from 'react';
import { useHabitStore, HabitStore, Habit } from '../../backend/store/useHabitStore';

export const Settings: React.FC = () => {
  const habits = useHabitStore((state: HabitStore) => state.habits);
  const clearAllData = useHabitStore((state: HabitStore) => state.clearAllData);
  const [exportState, setExportState] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = () => {
    const data = JSON.stringify(habits, null, 2);
    navigator.clipboard.writeText(data)
      .then(() => {
        setExportState('success');
        setTimeout(() => setExportState('idle'), 3000);
      })
      .catch(() => setExportState('error'));
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to completely wipe all habit data? This action cannot be undone.")) {
      clearAllData();
    }
  };

  const userProfile = useHabitStore((state: HabitStore) => state.userProfile);
  const updateUserProfile = useHabitStore((state: HabitStore) => state.updateUserProfile);

  // Convert habits to the format shown in the UI JSON preview
  const jsonPreviewStr = JSON.stringify({
    "user": userProfile.displayName,
    "habits": habits.slice(0, 3).map((h: Habit) => ({
      id: h.id.substring(0, 8),
      name: h.title,
      streak: h.completedDates.length,
      completion_rate: h.completedDates.length > 0 ? 0.95 : 0.0
    })),
    "exported_at": new Date().toISOString()
  }, null, 2);

  const handleAvatarChange = () => {
    const url = window.prompt("Enter new avatar image URL:", userProfile.avatarUrl);
    if (url) {
      updateUserProfile({ avatarUrl: url });
    }
  };

  return (
    <div className="w-full pb-12 text-on-background font-body-md">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        {/* Profile Section */}
        <div className="md:col-span-12 lg:col-span-8">
          <div className="bg-slate-900/40 backdrop-blur-xl p-xl rounded-[24px] shadow-2xl border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-lg mb-xl">
              <div className="relative shrink-0 w-24 h-24">
                <img 
                  alt="Profile Large" 
                  className="w-full h-full rounded-2xl object-cover border-4 border-slate-800 shadow-2xl" 
                  src={userProfile.avatarUrl}
                />
                <button onClick={handleAvatarChange} className="absolute -bottom-2 -right-2 bg-primary text-on-primary p-xs rounded-lg shadow-lg hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
              <div className="break-all">
                <h3 className="font-display-lg text-headline-md text-on-surface">{userProfile.displayName || 'Set Display Name'}</h3>
                <p className="font-body-md text-on-surface-variant">{userProfile.email || 'Set Email'}</p>
                <span className="inline-block mt-sm px-sm py-xs bg-secondary-container/10 text-secondary text-label-sm rounded-full font-bold">PRO MEMBER</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant">Display Name</label>
                <input 
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-md py-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-body-md" 
                  type="text" 
                  value={userProfile.displayName}
                  onChange={(e) => updateUserProfile({ displayName: e.target.value })}
                />
              </div>
              <div className="space-y-xs">
                <label className="font-label-md text-label-md text-on-surface-variant">Email Address</label>
                <input 
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg px-md py-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none font-body-md" 
                  type="email" 
                  value={userProfile.email}
                  onChange={(e) => updateUserProfile({ email: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Small Info Cards */}
        <div className="md:col-span-12 lg:col-span-4 space-y-lg">
          <div className="bg-primary-container/10 p-lg rounded-xl border border-primary/10 backdrop-blur-sm">
            <div className="flex items-center gap-md mb-md">
              <div className="bg-primary text-on-primary p-sm rounded-lg">
                <span className="material-symbols-outlined">workspace_premium</span>
              </div>
              <h4 className="font-headline-md text-on-surface-variant text-[18px]">Subscription</h4>
            </div>
            <p className="font-body-md text-on-surface-variant mb-md">Your next billing date is Oct 24, 2023.</p>
            <button className="w-full font-label-md text-primary font-bold hover:underline text-left">Manage Plan →</button>
          </div>
          <div className="bg-surface-container-lowest p-lg rounded-xl border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-md mb-md">
              <div className="bg-secondary text-on-secondary p-sm rounded-lg">
                <span className="material-symbols-outlined">security</span>
              </div>
              <h4 className="font-headline-md text-on-surface-variant text-[18px]">Security</h4>
            </div>
            <button className="w-full text-left font-body-md text-on-surface hover:text-primary transition-colors py-sm border-b border-outline-variant/10">Change Password</button>
            <button className="w-full text-left font-body-md text-on-surface hover:text-primary transition-colors py-sm">Two-Factor Auth</button>
          </div>
        </div>

        {/* Desktop App Download Section */}
        <div className="md:col-span-12 lg:col-span-12">
          <div className="bg-blue-600/10 backdrop-blur-xl p-xl rounded-[24px] shadow-2xl border border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-lg">
            <div className="flex items-center gap-lg">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                <span className="material-symbols-outlined text-[32px]">desktop_windows</span>
              </div>
              <div>
                <h3 className="font-display-lg text-headline-md text-on-surface">HabitBuilder for Desktop</h3>
                <p className="font-body-md text-on-surface-variant max-w-md">Experience HabitBuilder with native performance, system notifications, and offline support.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-md">
              <a 
                href="#" 
                className="flex items-center gap-sm bg-white text-slate-900 px-lg py-md rounded-xl font-bold hover:bg-slate-100 transition-all active:scale-95 shadow-lg"
              >
                <span className="material-symbols-outlined">download</span>
                Download for Windows
              </a>
              <a 
                href="#" 
                className="flex items-center gap-sm bg-slate-800 text-white px-lg py-md rounded-xl font-bold hover:bg-slate-700 transition-all active:scale-95 shadow-lg border border-white/10"
              >
                <span className="material-symbols-outlined">apple</span>
                Download for Mac
              </a>
            </div>
          </div>
        </div>

        {/* Data Export Section */}
        <div className="md:col-span-12 lg:col-span-12">
          <div className="bg-slate-900/40 backdrop-blur-xl p-xl rounded-[24px] shadow-2xl border border-white/10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg mb-xl">
              <div>
                <h3 className="font-display-lg text-headline-md text-on-surface">Data Export</h3>
                <p className="font-body-md text-on-surface-variant">Download a full archive of your habit history and performance metrics in JSON format.</p>
              </div>
              <button 
                onClick={handleExport}
                className="flex items-center justify-center gap-sm bg-surface-container text-on-surface-variant px-lg py-md rounded-xl font-bold hover:bg-primary hover:text-on-primary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">{exportState === 'success' ? 'check' : 'content_copy'}</span>
                {exportState === 'success' ? 'Copied to Clipboard!' : 'Copy JSON to Clipboard'}
              </button>
            </div>
            <div className="relative bg-slate-950 rounded-xl p-lg overflow-hidden group">
              <div className="absolute top-4 right-4">
                <span className="text-blue-400/30 text-label-sm font-mono uppercase tracking-widest">HABIT_DATA.JSON</span>
              </div>
              <pre className="text-slate-300 font-mono text-[13px] leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {jsonPreviewStr}
              </pre>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent pointer-events-none opacity-50"></div>
            </div>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="md:col-span-12 lg:col-span-12">
          <div className="border-2 border-error/20 bg-error-container/10 p-xl rounded-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-lg">
              <div className="z-10">
                <div className="flex items-center gap-sm text-error mb-sm">
                  <span className="material-symbols-outlined">warning</span>
                  <h3 className="font-display-lg text-headline-md">Danger Zone</h3>
                </div>
                <p className="font-body-md text-on-surface-variant max-w-2xl">
                  Permanently delete all your habit data, history, and account settings. This action is irreversible and will immediately terminate your subscription.
                </p>
              </div>
              <div className="z-10">
                <button 
                  onClick={handleClear}
                  className="w-full md:w-auto bg-error text-on-error px-xl py-md rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-error/20"
                >
                  Wipe All Data
                </button>
              </div>
            </div>
            {/* Abstract Background Decoration for Danger Zone */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-error/5 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
