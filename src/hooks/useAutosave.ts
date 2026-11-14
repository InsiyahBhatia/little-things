'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';

const AUTOSAVE_INTERVAL_MS = 30_000;

/**
 * Saves on a timer and whenever the player leaves or hides the tab. Hiding
 * the game (switching apps on a phone, changing tabs) also opens the pause
 * menu, so the player comes back to a paused game.
 */
export function useAutosave() {
  useEffect(() => {
    const save = () => useGameStore.getState().saveGame();
    const onVisibility = () => {
      if (!document.hidden) return;
      save();
      const s = useGameStore.getState();
      if (s.phase === 'playing' && !s.dialogue && !s.isPauseOpen) s.togglePause(true);
    };

    const timer = setInterval(save, AUTOSAVE_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', save);
    };
  }, []);
}
