import { useState } from 'react';
import { AppLayout, Page } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { HabitDetail } from './components/HabitDetail';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const openHabit = (habitId: string) => {
    setSelectedHabitId(habitId);
    setActivePage('habit-detail');
  };

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' && <Dashboard onOpenHabit={openHabit} />}
      {activePage === 'analytics' && <Analytics />}
      {activePage === 'settings' && <Settings />}
      {activePage === 'habit-detail' && selectedHabitId && (
        <HabitDetail habitId={selectedHabitId} onBack={() => setActivePage('dashboard')} />
      )}
    </AppLayout>
  );
}

export default App;
