import { useState } from 'react';
import type { TransactionFilters, Account, Fund, Category, TransactionType } from '@/types';
import { Button, Modal, DatePicker } from '@/components/ui';
import { getMonthRange, getFYRange } from '@/utils/date';

interface FilterBarProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  accounts: Account[];
  funds: Fund[];
  categories: Category[];
}

type DatePreset = 'this-month' | 'last-month' | 'this-fy' | 'all-time' | 'custom';

function getDatePreset(filters: TransactionFilters): DatePreset {
  const thisMonth = getMonthRange();
  if (filters.startDate === thisMonth.start && filters.endDate === thisMonth.end) return 'this-month';

  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = getMonthRange(lastMonthDate);
  if (filters.startDate === lastMonth.start && filters.endDate === lastMonth.end) return 'last-month';

  const fy = getFYRange();
  if (filters.startDate === fy.start && filters.endDate === fy.end) return 'this-fy';

  if (!filters.startDate && !filters.endDate) return 'all-time';

  return 'custom';
}

const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  'this-month': 'This Month',
  'last-month': 'Last Month',
  'this-fy': 'This FY',
  'all-time': 'All Time',
  'custom': 'Custom',
};

export default function FilterBar({ filters, onFiltersChange, accounts, funds, categories }: FilterBarProps) {
  const [datePreset, setDatePreset] = useState<DatePreset>(() => getDatePreset(filters));
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  function applyDatePreset(preset: DatePreset) {
    setDatePreset(preset);
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (preset === 'this-month') {
      const r = getMonthRange();
      startDate = r.start; endDate = r.end;
    } else if (preset === 'last-month') {
      const now = new Date();
      const r = getMonthRange(new Date(now.getFullYear(), now.getMonth() - 1, 1));
      startDate = r.start; endDate = r.end;
    } else if (preset === 'this-fy') {
      const r = getFYRange();
      startDate = r.start; endDate = r.end;
    } else if (preset === 'all-time') {
      startDate = undefined; endDate = undefined;
    } else {
      return;
    }

    onFiltersChange({ ...filters, startDate, endDate });
  }

  function setCustomDate(field: 'startDate' | 'endDate', value: string) {
    setDatePreset('custom');
    onFiltersChange({ ...filters, [field]: value || undefined });
  }

  function setTypeFilter(type: TransactionType | undefined) {
    onFiltersChange({ ...filters, transactionType: type });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto py-1">
        {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((preset) => (
          <Button
            key={preset}
            variant={datePreset === preset ? 'primary' : 'secondary'}
            size="sm"
            className="whitespace-nowrap"
            onClick={() => applyDatePreset(preset)}
          >
            {DATE_PRESET_LABELS[preset]}
          </Button>
        ))}
      </div>

      {datePreset === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <DatePicker label="From" value={filters.startDate ?? ''} onChange={(v) => setCustomDate('startDate', v)} />
          <DatePicker label="To" value={filters.endDate ?? ''} onChange={(v) => setCustomDate('endDate', v)} />
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto py-1">
        <Button
          variant={!filters.transactionType ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTypeFilter(undefined)}
        >
          All
        </Button>
        <Button
          variant={filters.transactionType === 'credit' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTypeFilter('credit')}
        >
          Credit
        </Button>
        <Button
          variant={filters.transactionType === 'debit' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setTypeFilter('debit')}
        >
          Debit
        </Button>

        <MultiSelectButton
          label="Category"
          count={filters.categoryIds?.length}
          onClick={() => setShowCategoryModal(true)}
        />
        <MultiSelectButton
          label="Fund"
          count={filters.fundIds?.length}
          onClick={() => setShowFundModal(true)}
        />
        <MultiSelectButton
          label="Account"
          count={filters.accountIds?.length}
          onClick={() => setShowAccountModal(true)}
        />
      </div>

      <MultiSelectModal
        open={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Filter by Category"
        items={categories.map((c) => ({ id: c.id, name: c.name }))}
        selected={filters.categoryIds ?? []}
        onChange={(ids) => onFiltersChange({ ...filters, categoryIds: ids.length ? ids : undefined })}
      />
      <MultiSelectModal
        open={showFundModal}
        onClose={() => setShowFundModal(false)}
        title="Filter by Fund"
        items={funds.map((f) => ({ id: f.id, name: f.name }))}
        selected={filters.fundIds ?? []}
        onChange={(ids) => onFiltersChange({ ...filters, fundIds: ids.length ? ids : undefined })}
      />
      <MultiSelectModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title="Filter by Account"
        items={accounts.map((a) => ({ id: a.id, name: a.name }))}
        selected={filters.accountIds ?? []}
        onChange={(ids) => onFiltersChange({ ...filters, accountIds: ids.length ? ids : undefined })}
      />
    </div>
  );
}

function MultiSelectButton({ label, count, onClick }: { label: string; count?: number; onClick: () => void }) {
  return (
    <Button variant="secondary" size="sm" className="whitespace-nowrap" onClick={onClick}>
      {label}{count ? ` (${count})` : ''}
    </Button>
  );
}

function MultiSelectModal({
  open,
  onClose,
  title,
  items,
  selected,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  items: { id: number; name: string }[];
  selected: number[];
  onChange: (ids: number[]) => void;
}) {
  function toggle(id: number) {
    onChange(
      selected.includes(id)
        ? selected.filter((s) => s !== id)
        : [...selected, id],
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex h-touch cursor-pointer items-center gap-3 rounded-lg px-3 transition-colors hover:bg-surface-overlay"
          >
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => toggle(item.id)}
              className="h-4 w-4 rounded border-border-default accent-accent"
            />
            <span className="text-text-primary">{item.name}</span>
          </label>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-text-muted">No items</p>}
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1"
          onClick={() => onChange([])}
        >
          Clear
        </Button>
        <Button variant="primary" size="sm" className="flex-1" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
