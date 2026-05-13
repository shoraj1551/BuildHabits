import { useState } from 'react';
import { AppLayout, Page } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { HabitDetail } from './components/HabitDetail';
import { DayLogPanel } from './components/DayLogPanel';
import { useHabitStore, HabitStore } from '../backend/store/useHabitStore';
import { toISOLocal } from '../shared/utils/dateUtils';
import '../design-system/styles/App.css';

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const dayLogs = useHabitStore((state: HabitStore) => state.dayLogs);
  const addDayLog = useHabitStore((state: HabitStore) => state.addDayLog);
  const canModifyDate = useHabitStore((state: HabitStore) => state.canModifyDate);
  const retrieveArchivedLogsForDate = useHabitStore((state: HabitStore) => state.retrieveArchivedLogsForDate);

  const todayIso = toISOLocal(new Date());

  const openHabit = (habitId: string) => {
    setSelectedHabitId(habitId);
    setActivePage('habit-detail');
  };

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' && <Dashboard onOpenHabit={openHabit} />}
      {activePage === 'daylog' && (
        <div className="max-w-4xl mx-auto py-8">
          <DayLogPanel 
            todayIso={todayIso}
            canModifyToday={canModifyDate(todayIso)}
            dayLogs={dayLogs}
            archivedLogsLookup={retrieveArchivedLogsForDate}
            onSaveLog={(activity, evidences) => addDayLog(activity, todayIso, evidences)}
          />
        </div>
      )}
      {activePage === 'analytics' && <Analytics />}
      {activePage === 'settings' && <Settings />}
      {activePage === 'habit-detail' && selectedHabitId && (
        <HabitDetail habitId={selectedHabitId} onBack={() => setActivePage('dashboard')} />
      )}
    </AppLayout>
  );
}

export default App;
