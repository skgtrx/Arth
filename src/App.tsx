import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DatabaseProvider } from '@/context/DatabaseContext';
import { useDatabase } from '@/hooks/useDatabase';
import { BottomNav, TopBar, PageContainer, LoadingScreen } from '@/components/layout';
import Home from '@/pages/Home';
import Transactions from '@/pages/Transactions';
import Balance from '@/pages/Balance';
import Analytics from '@/pages/Analytics';
import Settings from '@/pages/Settings';

function AppShell() {
  const { isLoading } = useDatabase();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-dvh bg-surface text-text-primary">
      <TopBar />
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
      <BrowserRouter basename="/arth/">
        <AppShell />
      </BrowserRouter>
    </DatabaseProvider>
  );
}
