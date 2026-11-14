/** Retro synthesised sound effects, routed through the shared audio engine. */
import { audio } from './audio';

interface Tone {
  type: OscillatorType;
  from: number;
  to?: number;
  /** Seconds after "now" at which the tone starts. */
  delay?: number;
  duration: number;
  volume: number;
  /** Jump (instead of glide) to `to` at this offset in seconds. */
  stepAt?: number;
}

function playTones(tones: Tone[]): void {
  const ctx = audio.context;
  const bus = audio.sfxBus;
  if (!ctx || !bus) return;
  const now = ctx.currentTime;

  for (const tone of tones) {
    const start = now + (tone.delay ?? 0);
    const end = start + tone.duration;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tone.type;
    osc.frequency.setValueAtTime(tone.from, start);
    if (tone.to !== undefined) {
      if (tone.stepAt !== undefined) {
        osc.frequency.setValueAtTime(tone.to, start + tone.stepAt);
      } else {
        osc.frequency.exponentialRampToValueAtTime(tone.to, end);
      }
    }

    gain.gain.setValueAtTime(tone.volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain);
    gain.connect(bus);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(start);
    osc.stop(end + 0.01);
  }
}

export const sounds = {
  /** Sweet chime when picking a flower. */
  playHarvest(): void {
    playTones([{ type: 'triangle', from: 523.25, to: 783.99, duration: 0.2, volume: 0.2 }]);
  },

  /** Bubbly rising notes when a potion is brewed. */
  playBrew(): void {
    playTones(
      [400, 520, 680, 850].map((freq, i) => ({
        type: 'sine' as const,
        from: freq,
        to: freq * 1.3,
        delay: i * 0.08,
        duration: 0.08,
        volume: 0.15,
      }))
    );
  },

  /** Cheerful coin clink. */
  playCoin(): void {
    playTones([{ type: 'sine', from: 987.77, to: 1318.51, stepAt: 0.08, duration: 0.3, volume: 0.2 }]);
  },

  /** Door thud for moving between places. */
  playDoor(): void {
    playTones([{ type: 'triangle', from: 300, to: 180, duration: 0.15, volume: 0.2 }]);
  },

  /** Soft low blip when something is not possible. */
  playDenied(): void {
    playTones([{ type: 'square', from: 196, to: 147, duration: 0.14, volume: 0.08 }]);
  },

  /** Short tick for menu buttons. */
  playClick(): void {
    playTones([{ type: 'triangle', from: 660, to: 880, duration: 0.05, volume: 0.1 }]);
  },

  /** Little fanfare when reputation goes up. */
  playLevelUp(): void {
    playTones(
      [523.25, 659.26, 783.99, 1046.5].map((freq, i) => ({
        type: 'triangle' as const,
        from: freq,
        delay: i * 0.09,
        duration: 0.22,
        volume: 0.16,
      }))
    );
  },
};
