import { useState } from 'react';
import type { Database } from 'sql.js';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Numpad, { PinDots } from '@/components/auth/Numpad';

interface Props {
  db: Database;
}

type ModalMode = 'set' | 'change' | 'remove' | null;
type SetStep = 'enter' | 'confirm';
type ChangeStep = 'current' | 'new' | 'confirm';

export default function PinSection({ db: _db }: Props) {
  const { isPinSet, setPin, changePin, removePin } = useAuth();
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-text-primary">Security</h3>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text-primary">PIN Lock</p>
            <p className="text-sm text-text-muted">
              {isPinSet ? 'PIN is set' : 'No PIN configured'}
            </p>
          </div>
          <div className="flex gap-2">
            {isPinSet ? (
              <>
                <Button size="sm" variant="secondary" onClick={() => setModalMode('change')}>
                  Change
                </Button>
                <Button size="sm" variant="danger" onClick={() => setModalMode('remove')}>
                  Remove
                </Button>
              </>
            ) : (
              <Button size="sm" variant="primary" onClick={() => setModalMode('set')}>
                Set PIN
              </Button>
            )}
          </div>
        </div>
      </Card>

      {modalMode === 'set' && (
        <SetPinModal onClose={() => setModalMode(null)} onSave={setPin} />
      )}
      {modalMode === 'change' && (
        <ChangePinModal onClose={() => setModalMode(null)} onSave={changePin} />
      )}
      {modalMode === 'remove' && (
        <RemovePinModal onClose={() => setModalMode(null)} onRemove={removePin} />
      )}
    </div>
  );
}

function PinInput({
  value,
  onChange,
  label,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  error?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm font-medium text-text-secondary">{label}</p>
      <PinDots length={value.length} size="sm" />
      {error && <p className="text-xs text-danger">{error}</p>}
      <Numpad value={value} onChange={onChange} size="sm" />
    </div>
  );
}

function SetPinModal({ onClose, onSave }: { onClose: () => void; onSave: (pin: string) => Promise<void> }) {
  const [step, setStep] = useState<SetStep>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  function handlePinChange(value: string) {
    setPin(value);
    setError('');
    if (value.length === 4) {
      setStep('confirm');
    }
  }

  async function handleConfirmChange(value: string) {
    setConfirmPin(value);
    setError('');
    if (value.length === 4) {
      if (value === pin) {
        await onSave(pin);
        onClose();
      } else {
        setError('PINs do not match');
        setConfirmPin('');
      }
    }
  }

  return (
    <Modal open onClose={onClose} title="Set PIN">
      <div className="py-2">
        {step === 'enter' && (
          <PinInput value={pin} onChange={handlePinChange} label="Enter a 4-digit PIN" />
        )}
        {step === 'confirm' && (
          <PinInput value={confirmPin} onChange={handleConfirmChange} label="Confirm your PIN" error={error} />
        )}
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function ChangePinModal({ onClose, onSave }: { onClose: () => void; onSave: (current: string, newPin: string) => Promise<boolean> }) {
  const [step, setStep] = useState<ChangeStep>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  function handleCurrentChange(value: string) {
    setCurrentPin(value);
    setError('');
    if (value.length === 4) {
      setStep('new');
    }
  }

  function handleNewChange(value: string) {
    setNewPin(value);
    setError('');
    if (value.length === 4) {
      setStep('confirm');
    }
  }

  async function handleConfirmChange(value: string) {
    setConfirmPin(value);
    setError('');
    if (value.length === 4) {
      if (value !== newPin) {
        setError('PINs do not match');
        setConfirmPin('');
        return;
      }
      const success = await onSave(currentPin, newPin);
      if (success) {
        onClose();
      } else {
        setError('Current PIN is incorrect');
        setStep('current');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
      }
    }
  }

  return (
    <Modal open onClose={onClose} title="Change PIN">
      <div className="py-2">
        {step === 'current' && (
          <PinInput value={currentPin} onChange={handleCurrentChange} label="Enter current PIN" />
        )}
        {step === 'new' && (
          <PinInput value={newPin} onChange={handleNewChange} label="Enter new PIN" />
        )}
        {step === 'confirm' && (
          <PinInput value={confirmPin} onChange={handleConfirmChange} label="Confirm new PIN" error={error} />
        )}
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function RemovePinModal({ onClose, onRemove }: { onClose: () => void; onRemove: (pin: string) => Promise<boolean> }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  async function handlePinChange(value: string) {
    setPin(value);
    setError('');
    if (value.length === 4) {
      const success = await onRemove(value);
      if (success) {
        onClose();
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    }
  }

  return (
    <Modal open onClose={onClose} title="Remove PIN">
      <div className="py-2">
        <PinInput value={pin} onChange={handlePinChange} label="Enter current PIN to remove" error={error} />
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
