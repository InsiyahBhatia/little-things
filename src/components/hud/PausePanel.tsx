'use client';

import { useEffect, useState } from 'react';
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { canFullscreen, isFullscreen, toggleFullscreen } from '@/lib/device';
import { useGameStore } from '@/store/gameStore';
import { Panel } from '@/components/ui/Panel';
import { sounds } from '@/lib/sound';
import { ControlsList } from './ControlsList';

/** Pause menu: sound settings, controls, save and leave. The clock stops while it is open. */
export function PausePanel() {
  const isOpen = useGameStore((s) => s.isPauseOpen);
  const togglePause = useGameStore((s) => s.togglePause);
  const settings = useGameStore((s) => s.audioSettings);
  const update = useGameStore((s) => s.updateAudioSettings);
  const saveGame = useGameStore((s) => s.saveGame);
  const returnToTitle = useGameStore((s) => s.returnToTitle);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'failed'>('idle');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const sync = () => setFullscreen(isFullscreen());
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  if (!isOpen) return null;

  return (
    <Panel
      title="Paused"
      subtitle="Time in Mallowmere stops while this menu is open."
      onClose={() => {
        setSaveState('idle');
        togglePause(false);
      }}
      width="max-w-xl"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-labelledby="sound-heading">
          <h3 id="sound-heading" className="font-display text-lg">
            Sound
          </h3>
          <button
            className="btn btn-sm mt-2"
            aria-pressed={settings.muted}
            onClick={() => update({ muted: !settings.muted })}
          >
            {settings.muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
            {settings.muted ? 'Sound is off' : 'Sound is on'}
          </button>
          <label className="mt-4 block text-sm">
            Music volume
            <input
              type="range"
              className="slider mt-1"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) => update({ musicVolume: Number(e.target.value) / 100 })}
            />
          </label>
          <label className="mt-3 block text-sm">
            Effects volume
            <input
              type="range"
              className="slider mt-1"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) => update({ sfxVolume: Number(e.target.value) / 100 })}
              onPointerUp={() => sounds.playCoin()}
              onKeyUp={() => sounds.playCoin()}
            />
          </label>
        </section>

        <section aria-labelledby="controls-heading">
          <h3 id="controls-heading" className="font-display text-lg">
            Controls
          </h3>
          <ControlsList className="mt-2" />
        </section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 border-t-[3px] border-ink pt-5">
        <button className="btn btn-primary" data-autofocus onClick={() => togglePause(false)}>
          Keep playing
        </button>
        <button className="btn" onClick={() => setSaveState(saveGame() ? 'saved' : 'failed')}>
          Save now
        </button>
        <button className="btn" onClick={returnToTitle}>
          Save and quit to title
        </button>
        {canFullscreen() && (
          <button className="btn" onClick={() => void toggleFullscreen()} aria-pressed={fullscreen}>
            {fullscreen ? <Minimize className="h-4 w-4" aria-hidden /> : <Maximize className="h-4 w-4" aria-hidden />}
            {fullscreen ? 'Leave full screen' : 'Full screen'}
          </button>
        )}
        <p className="w-full text-sm" role="status">
          {saveState === 'saved' && 'Saved. Your game also saves by itself as you play.'}
          {saveState === 'failed' &&
            'Could not save. This browser is blocking storage, for example in a private window.'}
        </p>
      </div>
    </Panel>
  );
}
