interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export default function DatePicker({ label, value, onChange, error }: DatePickerProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-text-secondary">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-touch w-full rounded-lg border bg-surface-raised px-3 text-base text-text-primary transition-colors focus:border-accent focus:outline-none ${
          error ? 'border-danger' : 'border-border-default'
        }`}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
