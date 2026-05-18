import { useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { useSync } from '@/hooks/useSync';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import AccountsSection from './settings/AccountsSection';
import FundsSection from './settings/FundsSection';
import CategoriesSection from './settings/CategoriesSection';
import SubCategoriesSection from './settings/SubCategoriesSection';
import PinSection from './settings/PinSection';

const TABS = ['Accounts', 'Funds', 'Categories', 'Sub-Categories'] as const;
type Tab = (typeof TABS)[number];

export default function Settings() {
  const { db, isLoading, persistDatabase } = useDatabase();
  const { syncState, syncNow } = useSync();
  const [activeTab, setActiveTab] = useState<Tab>('Accounts');

  if (isLoading || !db) {
    return (
      <div className="space-y-4 py-4">
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <h2 className="text-2xl font-bold">Settings</h2>

      <SyncSection syncState={syncState} syncNow={syncNow} />

      <PinSection db={db} />

      <div className="flex gap-2 overflow-x-auto py-1">
        {TABS.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'primary' : 'secondary'}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === 'Accounts' && <AccountsSection db={db} persistDatabase={persistDatabase} />}
      {activeTab === 'Funds' && <FundsSection db={db} persistDatabase={persistDatabase} />}
      {activeTab === 'Categories' && <CategoriesSection db={db} persistDatabase={persistDatabase} />}
      {activeTab === 'Sub-Categories' && <SubCategoriesSection db={db} persistDatabase={persistDatabase} />}

      <p className="pt-4 text-center text-xs text-text-muted">
        Arth v{__APP_VERSION__} · Built {new Date(__BUILD_TIME__).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
    </div>
  );
}

function SyncSection({
  syncState,
  syncNow,
}: {
  syncState: import('@/types').SyncState;
  syncNow: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    setLoading(true);
    try {
      await syncNow();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Google Drive Sync
        </h3>

        <p className="text-sm text-text-secondary">
          Sync your local database with Google Drive. Signs in automatically if needed.
        </p>

        {syncState.lastSyncedAt && (
          <p className="text-xs text-text-muted">
            Last synced: {new Date(syncState.lastSyncedAt).toLocaleString('en-IN')}
          </p>
        )}
        {syncState.error && (
          <p className="text-xs text-danger">{syncState.error}</p>
        )}

        <Button
          size="sm"
          variant="primary"
          className="w-full"
          onClick={handleSync}
          disabled={loading || syncState.status === 'syncing' || !navigator.onLine}
        >
          {syncState.status === 'syncing' ? 'Syncing…' : loading ? 'Connecting…' : 'Sync Now'}
        </Button>

        {!navigator.onLine && (
          <Badge variant="warning">Offline — sync unavailable</Badge>
        )}
      </div>
    </Card>
  );
}
