import { useState, useEffect, useCallback } from 'react';
import type { Database } from 'sql.js';
import type { Account, AccountType } from '@/types';
import { getAllAccounts, createAccount, updateAccount } from '@/db/queries';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import EntityList from './EntityList';

interface Props {
  db: Database;
  persistDatabase: () => Promise<void>;
}

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: 'bank', label: 'Bank' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'cash', label: 'Cash' },
  { value: 'investment', label: 'Investment' },
];

const TYPE_LABELS = new Map(ACCOUNT_TYPES.map((t) => [t.value, t.label]));

export default function AccountsSection({ db, persistDatabase }: Props) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [nameError, setNameError] = useState('');
  const [typeError, setTypeError] = useState('');

  const refresh = useCallback(() => {
    setAccounts(getAllAccounts(db));
  }, [db]);

  useEffect(() => { refresh(); }, [refresh]);

  function openAdd() {
    setEditing(null);
    setName('');
    setType('');
    setIsActive(true);
    setNameError('');
    setTypeError('');
    setModalOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setName(account.name);
    setType(account.type);
    setIsActive(account.isActive);
    setNameError('');
    setTypeError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function validate(): boolean {
    let valid = true;
    const trimmed = name.trim();

    if (!trimmed) {
      setNameError('Name is required');
      valid = false;
    } else {
      const duplicate = accounts.some(
        (a) => a.name.toLowerCase() === trimmed.toLowerCase() && a.id !== editing?.id
      );
      if (duplicate) {
        setNameError('An account with this name already exists');
        valid = false;
      } else {
        setNameError('');
      }
    }

    if (!type) {
      setTypeError('Type is required');
      valid = false;
    } else {
      setTypeError('');
    }

    return valid;
  }

  async function handleSave() {
    if (!validate()) return;
    const trimmed = name.trim();

    if (editing) {
      updateAccount(db, editing.id, { name: trimmed, type: type as AccountType, isActive });
    } else {
      createAccount(db, { name: trimmed, type: type as AccountType });
    }

    await persistDatabase();
    refresh();
    closeModal();
  }

  return (
    <>
      <EntityList
        items={accounts}
        getId={(a) => a.id}
        getName={(a) => a.name}
        getIsActive={(a) => a.isActive}
        getSubtitle={(a) => TYPE_LABELS.get(a.type)}
        onEdit={openEdit}
        onAdd={openAdd}
        addLabel="Add Account"
      />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Account' : 'Add Account'}>
        <div className="space-y-4">
          <Input
            label="Account Name"
            value={name}
            onChange={(v) => { setName(v); setNameError(''); }}
            error={nameError}
            placeholder="e.g. HDFC Savings"
          />
          <Select
            label="Type"
            options={ACCOUNT_TYPES}
            value={type}
            onChange={(v) => { setType(v as AccountType); setTypeError(''); }}
            placeholder="Select type"
            error={typeError}
          />
          {editing && (
            <Toggle label="Active" checked={isActive} onChange={setIsActive} />
          )}
          <div className="flex gap-2 pt-2">
            <Button variant="primary" className="flex-1" onClick={handleSave}>
              Save
            </Button>
            <Button variant="ghost" className="flex-1" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
