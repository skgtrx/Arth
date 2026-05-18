import type { SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function Select({
  label,
  options,
  placeholder,
  onChange,
  error,
  value,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-touch w-full appearance-none rounded-lg border bg-surface-raised px-3 text-base text-text-primary transition-colors focus:border-accent focus:outline-none ${
          error ? 'border-danger' : 'border-border-default'
        } ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
