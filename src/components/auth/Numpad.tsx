interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'lg';
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

const SIZE_CLASSES = {
  sm: { button: 'h-12 w-12 text-lg', gap: 'gap-3', dot: 'h-3.5 w-3.5', dotGap: 'gap-3', icon: 'h-5 w-5' },
  lg: { button: 'h-16 w-16 text-xl', gap: 'gap-4', dot: 'h-4 w-4', dotGap: 'gap-4', icon: 'h-6 w-6' },
};

export function PinDots({ length, size = 'lg' }: { length: number; size?: 'sm' | 'lg' }) {
  const s = SIZE_CLASSES[size];
  return (
    <div className={`flex ${s.dotGap}`}>
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className={`${s.dot} rounded-full transition-colors ${
            i < length ? 'bg-accent' : 'bg-surface-overlay'
          }`}
        />
      ))}
    </div>
  );
}

export default function Numpad({ value, onChange, disabled = false, size = 'lg' }: NumpadProps) {
  const s = SIZE_CLASSES[size];

  function handleDigit(digit: string) {
    if (value.length < 4) onChange(value + digit);
  }

  return (
    <div className={`grid grid-cols-3 ${s.gap}`}>
      {KEYS.map((key) => {
        if (key === '') return <div key="empty" />;
        if (key === 'back') {
          return (
            <button
              key="back"
              onClick={() => onChange(value.slice(0, -1))}
              disabled={disabled || value.length === 0}
              className={`flex ${s.button} items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-overlay active:bg-surface-overlay disabled:opacity-40`}
              aria-label="Backspace"
            >
              <svg className={s.icon} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75 14.25 12m0 0 2.25 2.25M14.25 12l2.25-2.25M14.25 12 12 14.25m-2.58 4.92-6.374-6.375a1.125 1.125 0 0 1 0-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 0 1 2.25 2.25v10.5a2.25 2.25 0 0 1-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33Z" />
              </svg>
            </button>
          );
        }
        return (
          <button
            key={key}
            onClick={() => handleDigit(key)}
            disabled={disabled || value.length >= 4}
            className={`flex ${s.button} items-center justify-center rounded-full bg-surface-raised font-medium text-text-primary transition-colors hover:bg-surface-overlay active:bg-surface-overlay disabled:opacity-40`}
          >
            {key}
          </button>
        );
      })}
    </div>
  );
}
