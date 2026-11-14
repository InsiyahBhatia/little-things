'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Sprite } from '@/components/ui/Sprite';

/** Conversation box along the bottom of the screen, like a storybook caption. */
export function DialogueBox() {
  const dialogue = useGameStore((s) => s.dialogue);
  const closeDialogue = useGameStore((s) => s.closeDialogue);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (dialogue) buttonRef.current?.focus({ preventScroll: true });
  }, [dialogue]);

  if (!dialogue) return null;

  return (
    <div
      className="absolute inset-0 z-40 flex items-end justify-center bg-night/30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) closeDialogue();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={dialogue.speakerName}
        className="panel panel-in flex w-full max-w-2xl items-start gap-4 p-4"
      >
        <div className="well flex h-16 w-16 shrink-0 items-center justify-center sm:h-20 sm:w-20">
          <Sprite src={dialogue.avatar} alt="" size={56} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg">{dialogue.speakerName}</h2>
          <p className="mt-1 max-w-[60ch]">{dialogue.text}</p>
          <div className="mt-3 flex justify-end">
            <button ref={buttonRef} className="btn btn-primary" onClick={closeDialogue}>
              {dialogue.closeLabel ?? 'Continue'}
              <span className="keycap !bg-paper/70 !shadow-none">E</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
