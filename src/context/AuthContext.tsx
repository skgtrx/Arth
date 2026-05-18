import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useDatabaseContext } from './DatabaseContext';
import { getAppSetting, setAppSetting, deleteAppSetting } from '@/db/queries';
import { hashPin } from '@/utils/crypto';

interface AuthContextValue {
  isPinSet: boolean;
  isUnlocked: boolean;
  unlock: (pin: string) => Promise<boolean>;
  setPin: (newPin: string) => Promise<void>;
  changePin: (currentPin: string, newPin: string) => Promise<boolean>;
  removePin: (currentPin: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
  isPinSet: false,
  isUnlocked: true,
  unlock: async () => false,
  setPin: async () => {},
  changePin: async () => false,
  removePin: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, isLoading, persistDatabase } = useDatabaseContext();
  const [isPinSet, setIsPinSet] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (isLoading || !db) return;
    const hash = getAppSetting(db, 'pin_hash');
    const pinExists = hash !== null;
    setIsPinSet(pinExists);
    if (!pinExists) {
      setIsUnlocked(true);
    }
  }, [db, isLoading]);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    if (!db) return false;
    const storedHash = getAppSetting(db, 'pin_hash');
    if (!storedHash) return false;
    const inputHash = await hashPin(pin);
    if (inputHash === storedHash) {
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, [db]);

  const setPin = useCallback(async (newPin: string): Promise<void> => {
    if (!db) return;
    const hash = await hashPin(newPin);
    setAppSetting(db, 'pin_hash', hash);
    await persistDatabase();
    setIsPinSet(true);
    setIsUnlocked(true);
  }, [db, persistDatabase]);

  const changePin = useCallback(async (currentPin: string, newPin: string): Promise<boolean> => {
    if (!db) return false;
    const storedHash = getAppSetting(db, 'pin_hash');
    if (!storedHash) return false;
    const currentHash = await hashPin(currentPin);
    if (currentHash !== storedHash) return false;
    const newHash = await hashPin(newPin);
    setAppSetting(db, 'pin_hash', newHash);
    await persistDatabase();
    return true;
  }, [db, persistDatabase]);

  const removePin = useCallback(async (currentPin: string): Promise<boolean> => {
    if (!db) return false;
    const storedHash = getAppSetting(db, 'pin_hash');
    if (!storedHash) return false;
    const currentHash = await hashPin(currentPin);
    if (currentHash !== storedHash) return false;
    deleteAppSetting(db, 'pin_hash');
    await persistDatabase();
    setIsPinSet(false);
    setIsUnlocked(true);
    return true;
  }, [db, persistDatabase]);

  return (
    <AuthContext.Provider value={{ isPinSet, isUnlocked, unlock, setPin, changePin, removePin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
