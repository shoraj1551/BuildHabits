import { useState } from 'react';
import { AppLayout, Page } from './components/AppLayout';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import './App.css';

function App() {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'analytics' && <Analytics />}
      {activePage === 'settings' && <Settings />}
    </AppLayout>
  );
}

export default App;
