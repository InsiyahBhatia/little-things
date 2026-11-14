'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { audio } from '@/lib/audio';
import { sounds } from '@/lib/sound';

export function VolumeButton({ className = '' }: { className?: string }) {
  const audioSettings = useGameStore((s) => s.audioSettings);
  const updateAudioSettings = useGameStore((s) => s.updateAudioSettings);

  const toggle = () => {
    audio.unlock();
    const nextMuted = !audioSettings.muted;
    if (!nextMuted) {
      sounds.playClick();
    }
    updateAudioSettings({ muted: nextMuted });
  };

  const isMuted = audioSettings.muted;

  return (
    <button
      type="button"
      className={`btn btn-icon shrink-0 ${isMuted ? 'opacity-80' : ''} ${className}`}
      onClick={toggle}
      title={isMuted ? 'Turn sound on (V)' : 'Turn sound off (V)'}
      aria-label={isMuted ? 'Turn sound on' : 'Turn sound off'}
      aria-pressed={!isMuted}
    >
      {isMuted ? (
        <VolumeX className="h-5 w-5 text-paper/70" strokeWidth={2.25} aria-hidden />
      ) : (
        <Volume2 className="h-5 w-5 text-paper" strokeWidth={2.25} aria-hidden />
      )}
    </button>
  );
}
