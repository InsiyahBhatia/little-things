'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { audio } from '@/lib/audio';
import { sounds } from '@/lib/sound';
import { ControlsList } from './hud/ControlsList';

/**
 * The title screen. The animated meadow behind it is drawn by Phaser; this
 * overlay holds the name and the menu.
 */
export function TitleScreen({ ready }: { ready: boolean }) {
  const hasSave = useGameStore((s) => s.hasSave);
  const saveSummary = useGameStore((s) => s.saveSummary);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const [confirmingNew, setConfirmingNew] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const begin = (action: () => void) => {
    audio.unlock();
    sounds.playClick();
    action();
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(6vh,env(safe-area-inset-top))]">
      <h1 className="title-mark text-center">
        Little
        <br />
        Things
      </h1>
      <p className="mt-3 max-w-sm text-center text-paper/90 [@media(max-height:420px)]:hidden">
        A tiny potion shop at the edge of Mallowmere, and a witch-in-training to run it.
      </p>

      <div className="mt-auto flex w-full max-w-xs flex-col gap-4 pt-4">
        {!ready ? (
          <p className="text-center font-display text-lg" role="status">
            Opening the shop…
          </p>
        ) : confirmingNew ? (
          <div className="panel panel-in p-4">
            <p className="font-display text-lg">Start over?</p>
            <p className="mt-1 text-sm">
              Your saved game{saveSummary ? ` on day ${saveSummary.day}` : ''} will be replaced.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="btn btn-primary" autoFocus onClick={() => begin(startNewGame)}>
                Start a new game
              </button>
              <button className="btn" onClick={() => setConfirmingNew(false)}>
                Keep my save
              </button>
            </div>
          </div>
        ) : (
          <>
            {hasSave && (
              <button className="btn btn-primary w-full !text-xl" autoFocus onClick={() => begin(() => continueGame())}>
                Continue
                {saveSummary && <span className="text-base opacity-75">day {saveSummary.day}</span>}
              </button>
            )}
            <button
              className={`btn w-full !text-xl ${hasSave ? '' : 'btn-primary'}`}
              autoFocus={!hasSave}
              onClick={() => (hasSave ? setConfirmingNew(true) : begin(startNewGame))}
            >
              New game
            </button>
            <button className="btn btn-dark btn-sm w-full" onClick={() => setShowControls((v) => !v)} aria-expanded={showControls}>
              {showControls ? 'Hide controls' : 'How to play'}
            </button>
            {showControls && (
              <div className="panel panel-in p-4">
                <p className="mb-3 text-sm">
                  Gather flowers, mix them in the cauldron to discover potions, and serve the villagers who come into your shop.
                </p>
                <ControlsList />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
