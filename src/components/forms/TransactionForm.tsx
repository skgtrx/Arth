import { useState, useMemo } from 'react';
import type { Account, Fund, Category, SubCategory, Transaction, CreateTransactionInput, TransactionType } from '@/types';
import { Button, Select, Input, DatePicker } from '@/components/ui';
import { today } from '@/utils/date';
import { parseAmountToPaisa, paisaToRupees } from '@/utils/currency';

interface TransactionFormProps {
  accounts: Account[];
  funds: Fund[];
  categories: Category[];
  subCategories: SubCategory[];
  initialData?: Transaction;
  onSave: (input: CreateTransactionInput) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  accounts,
  funds,
  categories,
  subCategories,
  initialData,
  onSave,
  onCancel,
}: TransactionFormProps) {
  const [date, setDate] = useState(initialData?.date ?? today());
  const [txnType, setTxnType] = useState<TransactionType>(initialData?.transactionType ?? 'debit');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId?.toString() ?? '');
  const [subCategoryId, setSubCategoryId] = useState(initialData?.subCategoryId?.toString() ?? '');
  const [fundId, setFundId] = useState(initialData?.fundId?.toString() ?? '');
  const [accountId, setAccountId] = useState(initialData?.accountId?.toString() ?? '');
  const [amount, setAmount] = useState(initialData ? paisaToRupees(initialData.amount).toString() : '');
  const [comments, setComments] = useState(initialData?.comments ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredSubCategories = useMemo(
    () => categoryId ? subCategories.filter((s) => s.categoryId === Number(categoryId)) : [],
    [subCategories, categoryId],
  );

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setSubCategoryId('');
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!date) e.date = 'Required';
    if (!categoryId) e.categoryId = 'Required';
    if (!subCategoryId) e.subCategoryId = 'Required';
    if (!fundId) e.fundId = 'Required';
    if (!accountId) e.accountId = 'Required';
    if (!amount.trim()) {
      e.amount = 'Required';
    } else {
      try {
        const paisa = parseAmountToPaisa(amount);
        if (paisa <= 0) e.amount = 'Must be greater than 0';
      } catch {
        e.amount = 'Invalid amount';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSave({
      date,
      categoryId: Number(categoryId),
      subCategoryId: Number(subCategoryId),
      transactionType: txnType,
      fundId: Number(fundId),
      accountId: Number(accountId),
      amount: parseAmountToPaisa(amount),
      comments: comments.trim() || undefined,
    });
  }

  return (
    <div className="space-y-4">
      <DatePicker label="Date" value={date} onChange={setDate} error={errors.date} />

      <div className="space-y-1">
        <label className="block text-sm font-medium text-text-secondary">Type</label>
        <div className="flex gap-2">
          <Button
            variant={txnType === 'debit' ? 'primary' : 'secondary'}
            size="sm"
            className="flex-1"
            onClick={() => setTxnType('debit')}
            type="button"
          >
            Debit
          </Button>
          <Button
            variant={txnType === 'credit' ? 'primary' : 'secondary'}
            size="sm"
            className="flex-1"
            onClick={() => setTxnType('credit')}
            type="button"
          >
            Credit
          </Button>
        </div>
      </div>

      <Select
        label="Category"
        placeholder="Select category"
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        value={categoryId}
        onChange={handleCategoryChange}
        error={errors.categoryId}
      />

      <Select
        label="Sub-Category"
        placeholder="Select sub-category"
        options={filteredSubCategories.map((s) => ({ value: s.id, label: s.name }))}
        value={subCategoryId}
        onChange={setSubCategoryId}
        error={errors.subCategoryId}
        disabled={!categoryId}
      />

      <Select
        label="Fund"
        placeholder="Select fund"
        options={funds.map((f) => ({ value: f.id, label: f.name }))}
        value={fundId}
        onChange={setFundId}
        error={errors.fundId}
      />

      <Select
        label="Account"
        placeholder="Select account"
        options={accounts.map((a) => ({ value: a.id, label: a.name }))}
        value={accountId}
        onChange={setAccountId}
        error={errors.accountId}
      />

      <Input
        label="Amount"
        prefix="₹"
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={setAmount}
        error={errors.amount}
      />

      <Input
        label="Comments"
        placeholder="Optional"
        value={comments}
        onChange={setComments}
      />

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleSubmit} type="button">
          {initialData ? 'Update' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
