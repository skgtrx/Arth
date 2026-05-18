import { useState } from 'react';
import { useSync } from '@/hooks/useSync';
import Button from '@/components/ui/Button';

export default function SignInScreen() {
  const { signIn } = useSync();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-8 bg-surface px-6 safe-top safe-bottom">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary">Arth</h1>
        <p className="text-sm text-text-muted">Personal finance, simplified</p>
      </div>

      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <p className="text-center text-sm text-text-secondary">
          Sign in with Google to sync your financial data securely via Google Drive.
        </p>
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSignIn}
          disabled={loading}
        >
          {loading ? 'Connecting…' : 'Sign in with Google'}
        </Button>
        {error && (
          <p className="text-center text-xs text-danger">{error}</p>
        )}
      </div>

      <p className="text-xs text-text-muted">
        Your data stays in your Google Drive — only you can access it.
      </p>
    </div>
  );
}
