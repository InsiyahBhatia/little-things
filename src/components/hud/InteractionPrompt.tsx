'use client';

import { useGameStore, isUiBlocking } from '@/store/gameStore';
import { queueInteract } from '@/game/input/virtualInput';
import { useIsTouch } from '@/hooks/useIsTouch';

/** Tells the player what pressing E will do. On touch screens it is the button. */
export function InteractionPrompt() {
  const prompt = useGameStore((s) => s.prompt);
  const blocked = useGameStore(isUiBlocking);
  const isTouch = useIsTouch();

  if (!prompt.active || !prompt.text || blocked) return null;

  if (isTouch) {
    return (
      <button
        className="btn btn-primary absolute bottom-[calc(10rem+env(safe-area-inset-bottom))] left-1/2 z-30 max-w-[calc(100vw-2rem)] -translate-x-1/2 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
        onPointerDown={(e) => {
          e.preventDefault();
          queueInteract();
        }}
      >
        {prompt.text}
      </button>
    );
  }

  return (
    <div
      role="status"
      className="plaque pointer-events-none absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap px-3 py-1.5"
    >
      <span className="keycap">E</span>
      <span className="font-display text-lg">{prompt.text}</span>
    </div>
  );
}
