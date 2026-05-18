import { useState } from 'react';
import type { DateRange } from '@/types';
import { getMonthRange, getYearRange, getFYRange, today } from '@/utils/date';

type TimeScope = 'month' | 'year' | 'fy' | 'custom';

interface TimeScopeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const SCOPES: { key: TimeScope; label: string }[] = [
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'fy', label: 'This FY' },
  { key: 'custom', label: 'Custom' },
];

function getRangeForScope(scope: TimeScope): DateRange {
  const now = new Date();
  switch (scope) {
    case 'month': return getMonthRange(now);
    case 'year': return getYearRange(now);
    case 'fy': return getFYRange(now);
    case 'custom': return { start: getFYRange(now).start, end: today() };
  }
}

export default function TimeScopeSelector({ value, onChange }: TimeScopeSelectorProps) {
  const [activeScope, setActiveScope] = useState<TimeScope>('fy');

  function handleScopeChange(scope: TimeScope) {
    setActiveScope(scope);
    if (scope !== 'custom') {
      onChange(getRangeForScope(scope));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-border-default bg-surface-raised overflow-hidden">
        {SCOPES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleScopeChange(key)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeScope === key
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {activeScope === 'custom' && (
        <div className="flex gap-3">
          <input
            type="date"
            value={value.start}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
            className="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary"
          />
          <input
            type="date"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
            className="flex-1 rounded-lg border border-border-default bg-surface-raised px-3 py-2 text-sm text-text-primary"
          />
        </div>
      )}
    </div>
  );
}
