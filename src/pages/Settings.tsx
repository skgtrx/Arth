import { useState } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import Button from '@/components/ui/Button';
import AccountsSection from './settings/AccountsSection';
import FundsSection from './settings/FundsSection';
import CategoriesSection from './settings/CategoriesSection';
import SubCategoriesSection from './settings/SubCategoriesSection';

const TABS = ['Accounts', 'Funds', 'Categories', 'Sub-Categories'] as const;
type Tab = (typeof TABS)[number];

export default function Settings() {
  const { db, isLoading, persistDatabase } = useDatabase();
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

      <div className="flex gap-2 overflow-x-auto py-1" style={{ WebkitOverflowScrolling: 'touch' }}>
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
    </div>
  );
}
