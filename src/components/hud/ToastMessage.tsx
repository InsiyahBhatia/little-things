'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

const TONE_CLASS = {
  info: 'plaque',
  good: 'plaque !bg-moss',
  warn: 'plaque !bg-rose',
} as const;

/** Short notice at the top of the screen that clears itself. */
export function ToastMessage() {
  const toast = useGameStore((s) => s.toast);
  const dismiss = useGameStore((s) => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dismiss(toast.id), 3200);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none absolute inset-x-0 top-24 z-50 flex justify-center px-4">
      {toast && (
        <p key={toast.id} className={`${TONE_CLASS[toast.tone]} panel-in px-4 py-2 font-display text-lg`}>
          {toast.text}
        </p>
      )}
    </div>
  );
}
