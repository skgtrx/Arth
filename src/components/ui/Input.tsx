import type { InputHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  prefix?: string;
  onChange: (value: string) => void;
}

export default function Input({
  label,
  error,
  prefix,
  onChange,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">{prefix}</span>
        )}
        <input
          onChange={(e) => onChange(e.target.value)}
          className={`h-touch w-full rounded-lg border bg-surface-raised text-base text-text-primary transition-colors placeholder:text-text-muted focus:border-accent focus:outline-none ${
            prefix ? 'pl-8 pr-3' : 'px-3'
          } ${error ? 'border-danger' : 'border-border-default'} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
