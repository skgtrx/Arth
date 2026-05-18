import { useState, useMemo, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { useSync } from '@/hooks/useSync';
import { Button } from '@/components/ui';
import {
  getBalanceMatrix, getAllAccounts, getAllFunds,
  getAccountTotals, getFundTotals, getLendBorrowBalances,
} from '@/db/queries';
import ByAccountView from './balance/ByAccountView';
import ByFundView from './balance/ByFundView';
import MatrixView from './balance/MatrixView';
import LendBorrowView from './balance/LendBorrowView';

const TABS = ['By Account', 'By Fund', 'Matrix', 'Lend/Borrow'] as const;
type Tab = (typeof TABS)[number];

export default function Balance() {
  const { db, isLoading, persistDatabase } = useDatabase();
  const { scheduleUpload } = useSync();
  const [activeTab, setActiveTab] = useState<Tab>('By Account');

  const persistAndSync = useCallback(async () => {
    await persistDatabase();
    scheduleUpload();
  }, [persistDatabase, scheduleUpload]);

  if (isLoading || !db) {
    return (
      <div className="space-y-4 py-4">
        <h2 className="text-2xl font-bold">Balance</h2>
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return <BalanceContent db={db} persistDatabase={persistAndSync} activeTab={activeTab} setActiveTab={setActiveTab} />;
}

function BalanceContent({
  db,
  persistDatabase,
  activeTab,
  setActiveTab,
}: {
  db: import('sql.js').Database;
  persistDatabase: () => Promise<void>;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}) {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const matrixCells = useMemo(() => getBalanceMatrix(db), [db, refreshKey]);
  const accounts = useMemo(() => getAllAccounts(db), [db, refreshKey]);
  const funds = useMemo(() => getAllFunds(db), [db, refreshKey]);
  const lendBorrowEntries = useMemo(() => getLendBorrowBalances(db), [db, refreshKey]);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);
  const fundMap = useMemo(() => new Map(funds.map((f) => [f.id, f])), [funds]);

  const accountTotals = useMemo(() => {
    const raw = getAccountTotals(db);
    return new Map(raw.map((r) => [r.accountId, r.total]));
  }, [db, refreshKey]);

  const fundTotals = useMemo(() => {
    const raw = getFundTotals(db);
    return new Map(raw.map((r) => [r.fundId, r.total]));
  }, [db, refreshKey]);

  return (
    <div className="space-y-4 py-4">
      <h2 className="text-2xl font-bold">Balance</h2>

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

      {activeTab === 'By Account' && (
        <ByAccountView
          accounts={accounts}
          funds={funds}
          accountMap={accountMap}
          fundMap={fundMap}
          accountTotals={accountTotals}
          matrixCells={matrixCells}
          db={db}
          persistDatabase={persistDatabase}
          onRefresh={refresh}
        />
      )}
      {activeTab === 'By Fund' && (
        <ByFundView
          fundMap={fundMap}
          accountMap={accountMap}
          fundTotals={fundTotals}
          matrixCells={matrixCells}
        />
      )}
      {activeTab === 'Matrix' && (
        <MatrixView
          accountMap={accountMap}
          fundMap={fundMap}
          accountTotals={accountTotals}
          fundTotals={fundTotals}
          matrixCells={matrixCells}
        />
      )}
      {activeTab === 'Lend/Borrow' && <LendBorrowView entries={lendBorrowEntries} />}
    </div>
  );
}
