import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/context/AuthContext';
import Numpad, { PinDots } from './Numpad';

export default function LockScreen() {
  const { isPinSet, isUnlocked, unlock } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const unlockRef = useRef(unlock);
  unlockRef.current = unlock;

  useEffect(() => {
    if (pin.length !== 4) return;
    setIsChecking(true);
    unlockRef.current(pin).then(success => {
      if (!success) {
        setError('Incorrect PIN');
        setPin('');
      }
      setIsChecking(false);
    });
  }, [pin]);

  const handleChange = useCallback((value: string) => {
    setError('');
    setPin(value);
  }, []);

  if (!isPinSet || isUnlocked) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface safe-top safe-bottom">
      <div className="flex flex-col items-center gap-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary text-center">Arth</h1>
          <p className="mt-2 text-sm text-text-muted text-center">Enter your PIN to unlock</p>
        </div>

        <PinDots length={pin.length} />

        {error && (
          <p className="text-sm text-danger animate-pulse">{error}</p>
        )}

        <Numpad value={pin} onChange={handleChange} disabled={isChecking} />
      </div>
    </div>,
    document.body,
  );
}
