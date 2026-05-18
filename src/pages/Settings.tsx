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
  const { syncState, isSignedIn, signIn, signOut, syncNow, scheduleUpload } = useSync();
  const [activeTab, setActiveTab] = useState<Tab>('Accounts');

  const handlePersist = async () => {
    await persistDatabase();
    scheduleUpload();
  };

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

      <SyncSection
        isSignedIn={isSignedIn}
        syncState={syncState}
        signIn={signIn}
        signOut={signOut}
        syncNow={syncNow}
      />

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

      {activeTab === 'Accounts' && <AccountsSection db={db} persistDatabase={handlePersist} />}
      {activeTab === 'Funds' && <FundsSection db={db} persistDatabase={handlePersist} />}
      {activeTab === 'Categories' && <CategoriesSection db={db} persistDatabase={handlePersist} />}
      {activeTab === 'Sub-Categories' && <SubCategoriesSection db={db} persistDatabase={handlePersist} />}

      <p className="pt-4 text-center text-xs text-text-muted">
        Arth v{__APP_VERSION__} · Built {new Date(__BUILD_TIME__).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
      </p>
    </div>
  );
}

function SyncSection({
  isSignedIn,
  syncState,
  signIn,
  signOut,
  syncNow,
}: {
  isSignedIn: boolean;
  syncState: import('@/types').SyncState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signIn();
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
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

        {isSignedIn ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">Connected</span>
                <Badge variant="success">Signed in</Badge>
              </div>
              <Button size="sm" variant="ghost" onClick={handleSignOut} disabled={loading}>
                Sign out
              </Button>
            </div>
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
              variant="secondary"
              className="w-full"
              onClick={() => syncNow()}
              disabled={syncState.status === 'syncing'}
            >
              {syncState.status === 'syncing' ? 'Syncing…' : 'Sync Now'}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">
              Back up your database to Google Drive. Only you can access the file.
            </p>
            <Button
              size="sm"
              variant="primary"
              className="w-full"
              onClick={handleSignIn}
              disabled={loading}
            >
              {loading ? 'Connecting…' : 'Sign in with Google'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
