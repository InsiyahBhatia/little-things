'use client';

import { useIsTouch } from '@/hooks/useIsTouch';

const KEYBOARD: Array<{ keys: string[]; action: string }> = [
  { keys: ['W', 'A', 'S', 'D'], action: 'Walk (or arrow keys)' },
  { keys: ['E'], action: 'Pick, talk, brew, serve' },
  { keys: ['I'], action: 'Open the bag' },
  { keys: ['B'], action: 'Recipe book' },
  { keys: ['M'], action: 'Buy decorations' },
  { keys: ['Esc'], action: 'Pause or close' },
];

const TOUCH: Array<{ control: string; action: string }> = [
  { control: 'Stick', action: 'Drag the stick in the bottom corner to walk' },
  { control: 'Action', action: 'Tap the yellow button to pick, talk, brew or serve' },
  { control: 'Menus', action: 'Bag, recipes, decor and pause are in the corner' },
];

/** How to play, shown as keys on a computer and as gestures on a phone or tablet. */
export function ControlsList({ className = '' }: { className?: string }) {
  const isTouch = useIsTouch();

  if (isTouch) {
    return (
      <dl className={`grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm ${className}`}>
        {TOUCH.map(({ control, action }) => (
          <div key={control} className="contents">
            <dt className="keycap !bg-paper-shade">{control}</dt>
            <dd>{action}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={`grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 text-sm ${className}`}>
      {KEYBOARD.map(({ keys, action }) => (
        <div key={action} className="contents">
          <dt className="flex gap-1">
            {keys.map((key) => (
              <kbd key={key} className="keycap !bg-paper-shade">
                {key}
              </kbd>
            ))}
          </dt>
          <dd>{action}</dd>
        </div>
      ))}
    </dl>
  );
}
