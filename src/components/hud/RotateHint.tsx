'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { RotateCcw } from 'lucide-react';
import { useIsTouch } from '@/hooks/useIsTouch';

const QUERY = '(orientation: portrait) and (max-width: 700px)';
const DISMISS_KEY = 'littlethings_rotate_dismissed';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

/** On a phone held upright, suggests turning it sideways. Can be dismissed. */
export function RotateHint() {
  const isTouch = useIsTouch();
  const portrait = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!isTouch || !portrait || dismissed) return null;

  return (
    <div className="plaque panel-in absolute inset-x-3 top-[calc(6.5rem+env(safe-area-inset-top))] z-40 flex items-center gap-3 px-3 py-2">
      <RotateCcw className="h-5 w-5 shrink-0" aria-hidden />
      <p className="flex-1 text-sm">Turn your phone sideways to see more of Mallowmere.</p>
      <button
        className="btn btn-dark btn-sm"
        onClick={() => {
          setDismissed(true);
          try {
            sessionStorage.setItem(DISMISS_KEY, '1');
          } catch {
            /* fine, it just shows again next time */
          }
        }}
      >
        OK
      </button>
    </div>
  );
}
