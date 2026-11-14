'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { audio } from '@/lib/audio';

function isTyping(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

/**
 * Global keys for the interface: I bag, B recipe book, M decor, Esc / P pause or close.
 * Movement and E (interact) are read by the Phaser scene directly.
 *
 * Brew and decor used to be C and D, but D is also "walk right", so pressing
 * it opened the catalogue mid-stride.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const unlock = () => audio.unlock();
    const onKeyDown = (e: KeyboardEvent) => {
      audio.unlock();
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;

      const s = useGameStore.getState();
      if (s.phase !== 'playing') return;

      const key = e.key.toLowerCase();

      if (key === 'escape') {
        e.preventDefault();
        if (!s.closeTopPanel()) s.togglePause(true);
        return;
      }

      // Dialogue takes the keyboard: E, Enter or Space close it.
      if (s.dialogue) {
        if (key === 'e' || key === 'enter' || key === ' ') {
          e.preventDefault();
          s.closeDialogue();
        }
        return;
      }

      switch (key) {
        case 'p':
          s.togglePause();
          break;
        case 'i':
          s.toggleInventory();
          break;
        case 'b':
          s.toggleCrafting();
          break;
        case 'm':
          s.toggleDecor();
          break;
        case 'v':
          s.updateAudioSettings({ muted: !s.audioSettings.muted });
          break;
        default:
          return;
      }
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', unlock);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', unlock);
    };
  }, []);
}
