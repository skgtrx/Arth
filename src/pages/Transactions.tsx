import { useState, useCallback } from 'react';
import { useDatabase } from '@/hooks/useDatabase';
import { useSync } from '@/hooks/useSync';
import { useTransactions, pairTransferLegs } from '@/hooks/useTransactions';
import type { Transaction, CreateTransactionInput } from '@/types';
import { Button, Modal } from '@/components/ui';
import TransactionForm from '@/components/forms/TransactionForm';
import TransferForm, { type TransferLeg } from '@/components/forms/TransferForm';
import TransactionCard from '@/components/forms/TransactionCard';
import FilterBar from '@/components/forms/FilterBar';
import { paisaToRupees } from '@/utils/currency';

export default function Transactions() {
  const { db, isLoading, persistDatabase } = useDatabase();
  const { scheduleUpload } = useSync();

  const persistAndSync = useCallback(async () => {
    await persistDatabase();
    scheduleUpload();
  }, [persistDatabase, scheduleUpload]);

  if (isLoading || !db) {
    return (
      <div className="space-y-4 py-4">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <p className="text-text-muted">Loading...</p>
      </div>
    );
  }

  return <TransactionsContent db={db} persistDatabase={persistAndSync} />;
}

function TransactionsContent({
  db,
  persistDatabase,
}: {
  db: import('sql.js').Database;
  persistDatabase: () => Promise<void>;
}) {
  const txns = useTransactions(db, persistDatabase);

  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<{
    transferId: string;
    legs: TransferLeg[];
    date: string;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{
    type: 'transaction' | 'transfer';
    id: number | string;
    count: number;
  } | null>(null);

  const handleSaveTransaction = useCallback(async (input: CreateTransactionInput) => {
    if (editingTransaction) {
      await txns.editTransaction(editingTransaction.id, input);
    } else {
      await txns.addTransaction(input);
    }
    setShowTransactionForm(false);
    setEditingTransaction(null);
  }, [editingTransaction, txns]);

  const handleSaveTransfer = useCallback(async (inputs: CreateTransactionInput[]) => {
    if (editingTransfer) {
      await txns.editTransferGroup(editingTransfer.transferId, inputs);
    } else {
      await txns.addTransferGroup(inputs);
    }
    setShowTransferForm(false);
    setEditingTransfer(null);
  }, [editingTransfer, txns]);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'transaction') {
      await txns.removeTransaction(confirmDelete.id as number);
    } else {
      await txns.removeTransferGroup(confirmDelete.id as string);
    }
    setConfirmDelete(null);
  }, [confirmDelete, txns]);

  function startEditTransaction(t: Transaction) {
    setEditingTransaction(t);
    setShowTransactionForm(true);
  }

  function startEditTransfer(transferId: string) {
    const group = txns.loadTransferGroup(transferId);
    const legs: TransferLeg[] = pairTransferLegs(group).map(({ debit: dt, credit: ct }) => ({
      sourceFundId: dt.fundId.toString(),
      sourceAccountId: dt.accountId.toString(),
      destFundId: ct?.fundId.toString() ?? '',
      destAccountId: ct?.accountId.toString() ?? '',
      amount: paisaToRupees(dt.amount).toString(),
      comments: dt.comments ?? '',
    }));
    setEditingTransfer({ transferId, legs, date: group[0]?.date ?? '' });
    setShowTransferForm(true);
  }

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setEditingTransaction(null); setShowTransactionForm(true); }}>
            + Add
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setEditingTransfer(null); setShowTransferForm(true); }}>
            Transfer
          </Button>
        </div>
      </div>

      <FilterBar
        filters={txns.filters}
        onFiltersChange={txns.setFilters}
        accounts={txns.allAccounts}
        funds={txns.allFunds}
        categories={txns.allCategories}
      />

      <p className="text-sm text-text-muted">
        {txns.transactions.length} transaction{txns.transactions.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-2">
        {txns.groups.map((group) => (
          <TransactionCard
            key={group.key}
            transactions={group.transactions}
            accountMap={txns.accountMap}
            fundMap={txns.fundMap}
            categoryMap={txns.categoryMap}
            subCategoryMap={txns.subCategoryMap}
            onEdit={() => {
              if (group.transferId) {
                startEditTransfer(group.transferId);
              } else {
                startEditTransaction(group.transactions[0]);
              }
            }}
            onDelete={() => {
              if (group.transferId) {
                setConfirmDelete({
                  type: 'transfer',
                  id: group.transferId,
                  count: group.transactions.length,
                });
              } else {
                setConfirmDelete({
                  type: 'transaction',
                  id: group.transactions[0].id,
                  count: 1,
                });
              }
            }}
          />
        ))}
        {txns.groups.length === 0 && (
          <p className="py-8 text-center text-text-muted">No transactions found.</p>
        )}
      </div>

      <Modal
        open={showTransactionForm}
        onClose={() => { setShowTransactionForm(false); setEditingTransaction(null); }}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          accounts={txns.activeAccounts}
          funds={txns.activeFunds}
          categories={txns.activeCategories}
          subCategories={txns.activeSubCategories}
          initialData={editingTransaction ?? undefined}
          onSave={handleSaveTransaction}
          onCancel={() => { setShowTransactionForm(false); setEditingTransaction(null); }}
        />
      </Modal>

      <Modal
        open={showTransferForm}
        onClose={() => { setShowTransferForm(false); setEditingTransfer(null); }}
        title={editingTransfer ? 'Edit Transfer' : 'New Transfer'}
      >
        <TransferForm
          accounts={txns.activeAccounts}
          funds={txns.activeFunds}
          categories={txns.allCategories}
          subCategories={txns.allSubCategories}
          initialLegs={editingTransfer?.legs}
          initialDate={editingTransfer?.date}
          transferId={editingTransfer?.transferId}
          onSave={handleSaveTransfer}
          onCancel={() => { setShowTransferForm(false); setEditingTransfer(null); }}
        />
      </Modal>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Confirm Delete"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            {confirmDelete?.type === 'transfer'
              ? `Delete this transfer with all ${confirmDelete.count} legs?`
              : 'Delete this transaction?'}
            {' '}This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
