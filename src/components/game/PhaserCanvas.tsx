'use client';

import { useEffect, useRef } from 'react';
import type * as PhaserTypes from 'phaser';
import { EventBus } from '@/game/events/EventBus';

interface PhaserCanvasProps {
  onReady?: () => void;
  onError?: (message: string) => void;
}

/**
 * Hosts the Phaser game. Phaser touches `window` at import time, so it is
 * loaded only in the browser, after this component mounts.
 */
export function PhaserCanvas({ onReady, onError }: PhaserCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };

  useEffect(() => {
    let game: PhaserTypes.Game | null = null;
    let cancelled = false;

    // The menu can only be used once the art has loaded and the title is up.
    const offReady = EventBus.on('TITLE_READY', () => callbacks.current.onReady?.());
    const offBootError = EventBus.on('BOOT_ERROR', ({ file }) => {
      callbacks.current.onError?.(`A game file could not be downloaded (${file}).`);
    });

    (async () => {
      try {
        const [Phaser, { createGameConfig }] = await Promise.all([import('phaser'), import('@/game/config')]);
        if (cancelled || !containerRef.current) return;

        // Make sure the pixel font is ready before Phaser draws any text with it.
        const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
        await document.fonts?.load(`16px ${fontFamily}`).catch(() => undefined);
        if (cancelled || !containerRef.current) return;

        game = new Phaser.Game(createGameConfig(containerRef.current, fontFamily || 'monospace'));
      } catch (err) {
        console.error('[PhaserCanvas] failed to start', err);
        callbacks.current.onError?.('The game engine could not start in this browser.');
      }
    })();

    return () => {
      cancelled = true;
      offReady();
      offBootError();
      game?.destroy(true);
      game = null;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 flex items-center justify-center bg-night" aria-hidden />;
}
