'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/gameStore';
import { GameHUD } from '@/components/hud/GameHUD';
import { InteractionPrompt } from '@/components/hud/InteractionPrompt';
import { InventoryPanel } from '@/components/hud/InventoryPanel';
import { CauldronPanel } from '@/components/hud/CauldronPanel';
import { DecorPanel } from '@/components/hud/DecorPanel';
import { DialogueBox } from '@/components/hud/DialogueBox';
import { PausePanel } from '@/components/hud/PausePanel';
import { ToastMessage } from '@/components/hud/ToastMessage';
import { TouchJoystick } from '@/components/hud/TouchJoystick';
import { RotateHint } from '@/components/hud/RotateHint';
import { TitleScreen } from '@/components/TitleScreen';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAutosave } from '@/hooks/useAutosave';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { useIsTouch } from '@/hooks/useIsTouch';

const PhaserCanvas = dynamic(() => import('@/components/game/PhaserCanvas').then((m) => m.PhaserCanvas), {
  ssr: false,
});

export default function Home() {
  const phase = useGameStore((s) => s.phase);
  const hydrate = useGameStore((s) => s.hydrate);
  const isTouch = useIsTouch();
  const [ready, setReady] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);

  useKeyboardShortcuts();
  useAutosave();
  useServiceWorker();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <main
      className="relative h-dvh w-screen select-none overflow-hidden bg-night"
      // Long-pressing the game should not open the browser's menu.
      onContextMenu={(e) => e.preventDefault()}
    >
      <PhaserCanvas onReady={() => setReady(true)} onError={setFatal} />

      {fatal ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-night p-6">
          <div className="panel max-w-md p-6" role="alert">
            <h1 className="font-display text-xl">The game could not load</h1>
            <p className="mt-2">{fatal}</p>
            <p className="mt-2 text-sm">Check your connection and reload. Your saved game is safe.</p>
            <button className="btn btn-primary mt-5" onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </div>
      ) : phase === 'title' ? (
        <TitleScreen ready={ready} />
      ) : (
        <>
          <GameHUD />
          {isTouch && <TouchJoystick />}
          <InteractionPrompt />
          <ToastMessage />
          <InventoryPanel />
          <CauldronPanel />
          <DecorPanel />
          <PausePanel />
          <DialogueBox />
        </>
      )}

      {!fatal && <RotateHint />}

      <noscript>
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-night p-6 text-center">
          Little Things needs JavaScript turned on to play.
        </div>
      </noscript>
    </main>
  );
}
