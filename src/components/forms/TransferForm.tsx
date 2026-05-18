import { useState, useMemo } from 'react';
import type { Account, Fund, Category, SubCategory, CreateTransactionInput } from '@/types';
import { Button, Select, Input, DatePicker } from '@/components/ui';
import { today } from '@/utils/date';
import { parseAmountToPaisa } from '@/utils/currency';

export interface TransferLeg {
  sourceFundId: string;
  sourceAccountId: string;
  destFundId: string;
  destAccountId: string;
  amount: string;
  comments: string;
}

interface TransferFormProps {
  accounts: Account[];
  funds: Fund[];
  categories: Category[];
  subCategories: SubCategory[];
  initialLegs?: TransferLeg[];
  initialDate?: string;
  transferId?: string;
  onSave: (inputs: CreateTransactionInput[]) => void;
  onCancel: () => void;
}

function emptyLeg(): TransferLeg {
  return { sourceFundId: '', sourceAccountId: '', destFundId: '', destAccountId: '', amount: '', comments: '' };
}

export default function TransferForm({
  accounts,
  funds,
  categories,
  subCategories,
  initialLegs,
  initialDate,
  onSave,
  onCancel,
}: TransferFormProps) {
  const [date, setDate] = useState(initialDate ?? today());
  const [legs, setLegs] = useState<TransferLeg[]>(initialLegs?.length ? initialLegs : [emptyLeg()]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const transferCategory = useMemo(
    () => categories.find((c) => c.name === 'Transfer'),
    [categories],
  );
  const transferSubCategory = useMemo(
    () => transferCategory
      ? subCategories.find((s) => s.categoryId === transferCategory.id)
      : undefined,
    [subCategories, transferCategory],
  );

  function updateLeg(index: number, field: keyof TransferLeg, value: string) {
    setLegs((prev) => prev.map((leg, i) => i === index ? { ...leg, [field]: value } : leg));
  }

  function addLeg() {
    setLegs((prev) => [...prev, emptyLeg()]);
  }

  function removeLeg(index: number) {
    setLegs((prev) => prev.filter((_, i) => i !== index));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!date) e.date = 'Required';
    if (!transferCategory) e.category = 'No "Transfer" category found';
    if (!transferSubCategory) e.category = 'No sub-category found for Transfer';

    legs.forEach((leg, i) => {
      if (!leg.sourceFundId) e[`${i}-sourceFundId`] = 'Required';
      if (!leg.sourceAccountId) e[`${i}-sourceAccountId`] = 'Required';
      if (!leg.destFundId) e[`${i}-destFundId`] = 'Required';
      if (!leg.destAccountId) e[`${i}-destAccountId`] = 'Required';
      if (!leg.amount.trim()) {
        e[`${i}-amount`] = 'Required';
      } else {
        try {
          const paisa = parseAmountToPaisa(leg.amount);
          if (paisa <= 0) e[`${i}-amount`] = 'Must be > 0';
        } catch {
          e[`${i}-amount`] = 'Invalid amount';
        }
      }
    });

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const newTransferId = crypto.randomUUID();
    const inputs: CreateTransactionInput[] = [];

    for (const leg of legs) {
      const paisa = parseAmountToPaisa(leg.amount);
      inputs.push({
        date,
        categoryId: transferCategory!.id,
        subCategoryId: transferSubCategory!.id,
        transactionType: 'debit',
        fundId: Number(leg.sourceFundId),
        accountId: Number(leg.sourceAccountId),
        amount: paisa,
        comments: leg.comments.trim() || undefined,
        transferId: newTransferId,
      });
      inputs.push({
        date,
        categoryId: transferCategory!.id,
        subCategoryId: transferSubCategory!.id,
        transactionType: 'credit',
        fundId: Number(leg.destFundId),
        accountId: Number(leg.destAccountId),
        amount: paisa,
        comments: leg.comments.trim() || undefined,
        transferId: newTransferId,
      });
    }

    onSave(inputs);
  }

  const fundOptions = funds.map((f) => ({ value: f.id, label: f.name }));
  const accountOptions = accounts.map((a) => ({ value: a.id, label: a.name }));

  return (
    <div className="space-y-4">
      <DatePicker label="Date" value={date} onChange={setDate} error={errors.date} />

      {errors.category && <p className="text-xs text-danger">{errors.category}</p>}

      {legs.map((leg, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border-default p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">
              Leg {i + 1}
            </span>
            {legs.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeLeg(i)} type="button">
                Remove
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="From Fund"
              placeholder="Fund"
              options={fundOptions}
              value={leg.sourceFundId}
              onChange={(v) => updateLeg(i, 'sourceFundId', v)}
              error={errors[`${i}-sourceFundId`]}
            />
            <Select
              label="From Account"
              placeholder="Account"
              options={accountOptions}
              value={leg.sourceAccountId}
              onChange={(v) => updateLeg(i, 'sourceAccountId', v)}
              error={errors[`${i}-sourceAccountId`]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="To Fund"
              placeholder="Fund"
              options={fundOptions}
              value={leg.destFundId}
              onChange={(v) => updateLeg(i, 'destFundId', v)}
              error={errors[`${i}-destFundId`]}
            />
            <Select
              label="To Account"
              placeholder="Account"
              options={accountOptions}
              value={leg.destAccountId}
              onChange={(v) => updateLeg(i, 'destAccountId', v)}
              error={errors[`${i}-destAccountId`]}
            />
          </div>

          <Input
            label="Amount"
            prefix="₹"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={leg.amount}
            onChange={(v) => updateLeg(i, 'amount', v)}
            error={errors[`${i}-amount`]}
          />

          <Input
            label="Comments"
            placeholder="Optional"
            value={leg.comments}
            onChange={(v) => updateLeg(i, 'comments', v)}
          />
        </div>
      ))}

      <Button variant="ghost" size="sm" className="w-full" onClick={addLeg} type="button">
        + Add another leg
      </Button>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" className="flex-1" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleSubmit} type="button">
          Save Transfer
        </Button>
      </div>
    </div>
  );
}
