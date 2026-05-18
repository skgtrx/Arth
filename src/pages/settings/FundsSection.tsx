import { useState, useEffect, useCallback } from 'react';
import type { Database } from 'sql.js';
import type { Fund } from '@/types';
import { getAllFunds, createFund, updateFund } from '@/db/queries';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import EntityList from './EntityList';

interface Props {
  db: Database;
  persistDatabase: () => Promise<void>;
}

export default function FundsSection({ db, persistDatabase }: Props) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Fund | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [nameError, setNameError] = useState('');

  const refresh = useCallback(() => {
    setFunds(getAllFunds(db));
  }, [db]);

  useEffect(() => { refresh(); }, [refresh]);

  function openAdd() {
    setEditing(null);
    setName('');
    setIsActive(true);
    setNameError('');
    setModalOpen(true);
  }

  function openEdit(fund: Fund) {
    setEditing(fund);
    setName(fund.name);
    setIsActive(fund.isActive);
    setNameError('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
  }

  function validate(): boolean {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name is required');
      return false;
    }
    const duplicate = funds.some(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase() && f.id !== editing?.id
    );
    if (duplicate) {
      setNameError('A fund with this name already exists');
      return false;
    }
    setNameError('');
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    const trimmed = name.trim();

    if (editing) {
      updateFund(db, editing.id, { name: trimmed, isActive });
    } else {
      createFund(db, { name: trimmed });
    }

    await persistDatabase();
    refresh();
    closeModal();
  }

  return (
    <>
      <EntityList
        items={funds}
        getId={(f) => f.id}
        getName={(f) => f.name}
        getIsActive={(f) => f.isActive}
        onEdit={openEdit}
        onAdd={openAdd}
        addLabel="Add Fund"
      />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Fund' : 'Add Fund'}>
        <div className="space-y-4">
          <Input
            label="Fund Name"
            value={name}
            onChange={(v) => { setName(v); setNameError(''); }}
            error={nameError}
            placeholder="e.g. Emergency Fund"
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
