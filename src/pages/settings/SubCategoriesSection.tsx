import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Database } from 'sql.js';
import type { SubCategory, Category } from '@/types';
import { getSubCategories, getAllCategories, createSubCategory, updateSubCategory } from '@/db/queries';
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

export default function SubCategoriesSection({ db, persistDatabase }: Props) {
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubCategory | null>(null);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [nameError, setNameError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const activeCategories = useMemo(
    () => categories.filter((c) => c.isActive),
    [categories],
  );

  const refresh = useCallback(() => {
    setSubCategories(getSubCategories(db));
    setCategories(getAllCategories(db));
  }, [db]);

  useEffect(() => { refresh(); }, [refresh]);

  function openAdd() {
    setEditing(null);
    setName('');
    setCategoryId('');
    setIsActive(true);
    setNameError('');
    setCategoryError('');
    setModalOpen(true);
  }

  function openEdit(sub: SubCategory) {
    setEditing(sub);
    setName(sub.name);
    setCategoryId(sub.categoryId);
    setIsActive(sub.isActive);
    setNameError('');
    setCategoryError('');
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
      const duplicate = subCategories.some(
        (s) => s.name.toLowerCase() === trimmed.toLowerCase() && s.id !== editing?.id
      );
      if (duplicate) {
        setNameError('A sub-category with this name already exists');
        valid = false;
      } else {
        setNameError('');
      }
    }

    if (!categoryId) {
      setCategoryError('Parent category is required');
      valid = false;
    } else {
      setCategoryError('');
    }

    return valid;
  }

  async function handleSave() {
    if (!validate()) return;
    const trimmed = name.trim();

    if (editing) {
      updateSubCategory(db, editing.id, { name: trimmed, categoryId: categoryId as number, isActive });
    } else {
      createSubCategory(db, { name: trimmed, categoryId: categoryId as number });
    }

    await persistDatabase();
    refresh();
    closeModal();
  }

  return (
    <>
      <EntityList
        items={subCategories}
        getId={(s) => s.id}
        getName={(s) => s.name}
        getIsActive={(s) => s.isActive}
        getSubtitle={(s) => categoryMap.get(s.categoryId)}
        onEdit={openEdit}
        onAdd={openAdd}
        addLabel="Add Sub-Category"
      />

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Edit Sub-Category' : 'Add Sub-Category'}>
        <div className="space-y-4">
          <Select
            label="Parent Category"
            options={activeCategories.map((c) => ({ value: c.id, label: c.name }))}
            value={categoryId}
            onChange={(v) => { setCategoryId(Number(v)); setCategoryError(''); }}
            placeholder="Select category"
            error={categoryError}
          />
          <Input
            label="Sub-Category Name"
            value={name}
            onChange={(v) => { setName(v); setNameError(''); }}
            error={nameError}
            placeholder="e.g. Vegetables"
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
