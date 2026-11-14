'use client';

import { useEffect } from 'react';

/** Shown if the interface crashes. Progress is saved as you play, so a reload is safe. */
export default function GameError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Little Things] interface error', error);
  }, [error]);

  return (
    <main className="flex h-dvh items-center justify-center p-6">
      <div className="panel max-w-md p-6">
        <h1 className="font-display text-xl">The game stopped unexpectedly</h1>
        <p className="mt-3">
          Your progress is saved as you play, so nothing is lost. Reload to carry on from where you were.
        </p>
        <div className="mt-5 flex flex-wrap gap-4">
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload the game
          </button>
          <button className="btn" onClick={reset}>
            Try again without reloading
          </button>
        </div>
      </div>
    </main>
  );
}
