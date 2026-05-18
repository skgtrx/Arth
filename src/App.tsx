import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { AuthProvider } from '@/context/AuthContext';
import { SyncProvider } from '@/context/SyncContext';
import { useDatabase } from '@/hooks/useDatabase';
import { useSync } from '@/hooks/useSync';
import { BottomNav, TopBar, PageContainer, LoadingScreen } from '@/components/layout';
import LockScreen from '@/components/auth/LockScreen';
import Home from '@/pages/Home';
import Transactions from '@/pages/Transactions';
import Balance from '@/pages/Balance';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

function AppShell() {
  const { isLoading } = useDatabase();
  const { syncState, isSignedIn } = useSync();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const topBarStatus = !isSignedIn
    ? (navigator.onLine ? 'idle' : 'offline')
    : syncState.status === 'error'
      ? 'synced'
      : syncState.status;

  return (
    <div className="min-h-dvh bg-surface text-text-primary">
      <TopBar syncStatus={topBarStatus} />
      <PageContainer>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/balance" element={<Balance />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </PageContainer>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <SyncProvider>
        <AuthProvider>
          <BrowserRouter basename="/Arth/">
            <LockScreen />
            <AppShell />
          </BrowserRouter>
        </AuthProvider>
      </SyncProvider>
    </DatabaseProvider>
  );
}
