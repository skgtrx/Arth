import { useState, useEffect, useCallback } from 'react';
import type { Database } from 'sql.js';
import type { Category } from '@/types';
import { getAllCategories, createCategory, updateCategory } from '@/db/queries';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import EntityList from './EntityList';

interface Props {
  db: Database;
  persistDatabase: () => Promise<void>;
}

export default function CategoriesSection({ db, persistDatabase }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [nameError, setNameError] = useState('');

  const refresh = useCallback(() => {
    setCategories(getAllCategories(db));
  }, [db]);

  useEffect(() => { refresh(); }, [refresh]);

  function openAdd() {
    setEditing(null);
    setName('');
    setIsActive(true);
    setNameError('');
    setModalOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setIsActive(category.isActive);
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
    const duplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editing?.id
    );
    if (duplicate) {
      setNameError('A category with this name already exists');
      return false;
    }
    setNameError('');
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    const trimmed = name.trim();

    if (editing) {
      updateCategory(db, editing.id, { name: trimmed, isActive });
    } else {
      createCategory(db, { name: trimmed });
    }

    await persistDatabase();
    refresh();
    closeModal();
  }

  return (
    <>
      <EntityList
        items={categories}
        getId={(c) => c.id}
        getName={(c) => c.name}
        getIsActive={(c) => c.isActive}
        onEdit={openEdit}
        onAdd={openAdd}
        addLabel="Add Category"
      />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={name}
            onChange={(v) => { setName(v); setNameError(''); }}
            error={nameError}
            placeholder="e.g. Groceries"
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
