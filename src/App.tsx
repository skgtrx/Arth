import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { AuthProvider } from '@/context/AuthContext';
import { SyncProvider } from '@/context/SyncContext';
import { useDatabase } from '@/hooks/useDatabase';
import { useSync } from '@/hooks/useSync';
import { BottomNav, TopBar, PageContainer, LoadingScreen } from '@/components/layout';
import LockScreen from '@/components/auth/LockScreen';
import SignInScreen from '@/components/auth/SignInScreen';
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

  if (!isSignedIn) {
    return <SignInScreen />;
  }

  const topBarStatus = syncState.status === 'error'
    ? 'synced'
    : syncState.status;

  return (
    <BrowserRouter basename="/Arth/">
      <AuthProvider>
        <LockScreen />
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
      </AuthProvider>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <DatabaseProvider>
      <SyncProvider>
        <AppShell />
      </SyncProvider>
    </DatabaseProvider>
  );
}
