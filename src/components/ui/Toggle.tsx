interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <label className={`inline-flex cursor-pointer items-center gap-2 ${disabled ? 'opacity-40' : ''}`}>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div className="h-6 w-11 rounded-full bg-surface-overlay transition-colors peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </div>
      {label && <span className="text-sm text-text-secondary">{label}</span>}
    </label>
  );
}
