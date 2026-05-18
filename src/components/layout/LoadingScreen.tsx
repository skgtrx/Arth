export default function LoadingScreen() {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-surface">
      <h1 className="text-3xl font-bold tracking-tight text-text-primary">Arth</h1>
      <div className="h-1 w-24 overflow-hidden rounded-full bg-surface-overlay">
        <div className="h-full w-1/2 animate-[shimmer_1s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>
      <p className="text-sm text-text-muted">Loading your finances…</p>
    </div>
  );
}
