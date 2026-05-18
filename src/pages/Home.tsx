import { useState, useMemo, useCallback } from 'react';
import type { Database } from 'sql.js';
import { useDatabase } from '@/hooks/useDatabase';
import { useSync } from '@/hooks/useSync';
import type { CreateTransactionInput } from '@/types';
import { Button, Card, Modal, Badge } from '@/components/ui';
import TransactionForm from '@/components/forms/TransactionForm';
import TransferForm from '@/components/forms/TransferForm';
import {
  getFundTotals,
  getAllFunds,
  getAllAccounts,
  getAllCategories,
  getSubCategories,
  getSpendByCategory,
  createTransaction,
} from '@/db/queries';
import { getMonthRange, formatRelativeTime } from '@/utils/date';
import { formatINR } from '@/utils/currency';

export default function Home() {
  const { db, isLoading, lastModified, persistDatabase } = useDatabase();
  const { syncState, isSignedIn, syncNow, scheduleUpload } = useSync();

  if (isLoading || !db) {
    return (
      <div className="space-y-4 py-4">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <HomeContent
      db={db}
      lastModified={lastModified}
      persistDatabase={persistDatabase}
      syncState={syncState}
      isSignedIn={isSignedIn}
      syncNow={syncNow}
      scheduleUpload={scheduleUpload}
    />
  );
}

function HomeContent({
  db,
  lastModified,
  persistDatabase,
  syncState,
  isSignedIn,
  syncNow,
  scheduleUpload,
}: {
  db: Database;
  lastModified: string | null;
  persistDatabase: () => Promise<void>;
  syncState: import('@/types').SyncState;
  isSignedIn: boolean;
  syncNow: () => Promise<void>;
  scheduleUpload: () => void;
}) {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const allAccounts = useMemo(() => getAllAccounts(db), [db, refreshKey]);
  const allFunds = useMemo(() => getAllFunds(db), [db, refreshKey]);
  const allCategories = useMemo(() => getAllCategories(db), [db, refreshKey]);
  const allSubCategories = useMemo(() => getSubCategories(db), [db, refreshKey]);

  const activeAccounts = useMemo(() => allAccounts.filter((a) => a.isActive), [allAccounts]);
  const activeFunds = useMemo(() => allFunds.filter((f) => f.isActive), [allFunds]);
  const activeCategories = useMemo(() => allCategories.filter((c) => c.isActive), [allCategories]);
  const activeSubCategories = useMemo(() => allSubCategories.filter((s) => s.isActive), [allSubCategories]);

  const fundTotals = useMemo(() => getFundTotals(db), [db, refreshKey]);
  const monthRange = useMemo(() => getMonthRange(), []);
  const categorySpend = useMemo(
    () => getSpendByCategory(db, monthRange.start, monthRange.end),
    [db, monthRange, refreshKey],
  );

  const fundMap = useMemo(
    () => new Map(allFunds.map((f) => [f.id, f.name])),
    [allFunds],
  );

  const nonZeroFundTotals = useMemo(
    () => fundTotals.filter((ft) => ft.total !== 0),
    [fundTotals],
  );

  const totalMonthlySpend = useMemo(
    () => categorySpend.reduce((sum, c) => sum + c.total, 0),
    [categorySpend],
  );

  const currentMonthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleSaveTransaction = useCallback(async (input: CreateTransactionInput) => {
    createTransaction(db, input);
    await persistDatabase();
    scheduleUpload();
    refresh();
    setShowTransactionForm(false);
  }, [db, persistDatabase, scheduleUpload, refresh]);

  const handleSaveTransfer = useCallback(async (inputs: CreateTransactionInput[]) => {
    for (const input of inputs) {
      createTransaction(db, input);
    }
    await persistDatabase();
    scheduleUpload();
    refresh();
    setShowTransferForm(false);
  }, [db, persistDatabase, scheduleUpload, refresh]);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowTransactionForm(true)}>
            + Add
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowTransferForm(true)}>
            Transfer
          </Button>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            {isSignedIn && syncState.lastSyncedAt ? (
              <p className="text-sm font-medium text-text-secondary">
                Last synced: {formatRelativeTime(syncState.lastSyncedAt)}
              </p>
            ) : (
              <p className="text-sm font-medium text-text-secondary">
                Last saved: {lastModified ? formatRelativeTime(lastModified) : 'Not saved yet'}
              </p>
            )}
            <div className="flex gap-2">
              {!navigator.onLine && <Badge variant="warning">Offline</Badge>}
              {syncState.status === 'syncing' && <Badge variant="info">Syncing…</Badge>}
              {syncState.status === 'error' && <Badge variant="danger">{syncState.error ?? 'Sync error'}</Badge>}
            </div>
          </div>
          {isSignedIn ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => syncNow()}
              disabled={syncState.status === 'syncing'}
            >
              {syncState.status === 'syncing' ? 'Syncing…' : 'Sync Now'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => persistDatabase()}
            >
              Save
            </Button>
          )}
        </div>
      </Card>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
          Fund Balances
        </h3>
        {nonZeroFundTotals.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-text-muted">No fund balances yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {nonZeroFundTotals.map((ft) => (
              <Card key={ft.fundId}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-text-primary">
                    {fundMap.get(ft.fundId) ?? `Fund #${ft.fundId}`}
                  </span>
                  <span className={`font-semibold ${ft.total >= 0 ? 'text-credit' : 'text-debit'}`}>
                    {formatINR(ft.total)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
          {currentMonthLabel}
        </h3>
        <Card>
          {categorySpend.length === 0 ? (
            <p className="text-center text-sm text-text-muted">No expenses this month</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total spent</span>
                <span className="text-lg font-semibold text-debit">{formatINR(totalMonthlySpend)}</span>
              </div>
              <div className="border-t border-border-default pt-3 space-y-2">
                {categorySpend.slice(0, 3).map((cs) => (
                  <div key={cs.categoryId} className="flex items-center justify-between">
                    <span className="text-sm text-text-primary">{cs.categoryName}</span>
                    <span className="text-sm font-medium text-text-secondary">{formatINR(cs.total)}</span>
                  </div>
                ))}
                {categorySpend.length > 3 && (
                  <p className="text-xs text-text-muted">
                    +{categorySpend.length - 3} more categor{categorySpend.length - 3 === 1 ? 'y' : 'ies'}
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      </section>

      <Modal
        open={showTransactionForm}
        onClose={() => setShowTransactionForm(false)}
        title="Add Transaction"
      >
        <TransactionForm
          accounts={activeAccounts}
          funds={activeFunds}
          categories={activeCategories}
          subCategories={activeSubCategories}
          onSave={handleSaveTransaction}
          onCancel={() => setShowTransactionForm(false)}
        />
      </Modal>

      <Modal
        open={showTransferForm}
        onClose={() => setShowTransferForm(false)}
        title="New Transfer"
      >
        <TransferForm
          accounts={activeAccounts}
          funds={activeFunds}
          categories={allCategories}
          subCategories={allSubCategories}
          onSave={handleSaveTransfer}
          onCancel={() => setShowTransferForm(false)}
        />
      </Modal>
    </div>
  );
}
