/**
 * Procedural chiptune background music.
 *
 * Each location has its own short pentatonic loop. Notes are scheduled a few
 * seconds ahead on the Web Audio clock; every loop plays through its own gain
 * node so switching location fades the old loop out instead of cutting it.
 */
import { audio } from './audio';

export type MusicMood = 'title' | 'garden' | 'shop' | 'forest';

// C major pentatonic
const NOTES: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.0, A3: 220.0,
  C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99, A5: 880.0,
};

interface Melody {
  /** Note names; '-' is a rest. */
  lead: string[];
  bass: string[];
  /** Beats per minute. */
  tempo: number;
}

const MELODIES: Record<MusicMood, Melody> = {
  title: {
    lead: ['E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'A4', 'G4', 'E4', 'D4'],
    bass: ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'E3', 'E3', 'C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'G3', 'G3'],
    tempo: 180,
  },
  garden: {
    lead: ['C4', 'E4', 'G4', 'E4', 'D4', 'G4', 'A4', 'G4', 'E4', 'A4', 'G4', 'E4', 'D4', 'C4', 'D4', 'E4'],
    bass: ['C3', 'C3', 'E3', 'E3', 'G3', 'G3', 'A3', 'A3', 'C3', 'C3', 'E3', 'E3', 'D3', 'D3', 'G3', 'G3'],
    tempo: 140,
  },
  shop: {
    lead: ['G4', 'A4', 'C5', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'C5', 'A4', 'G4', 'E4'],
    bass: ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'E3', 'E3', 'C3', 'C3', 'G3', 'G3', 'D3', 'D3', 'G3', 'G3'],
    tempo: 120,
  },
  forest: {
    lead: ['E4', '-', 'G4', '-', 'A4', '-', 'G4', 'E4', 'D4', '-', 'E4', '-', 'C4', '-', 'D4', '-'],
    bass: ['A3', 'A3', 'E3', 'E3', 'C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'E3', 'E3', 'D3', 'D3', 'E3', 'E3'],
    tempo: 100,
  },
};

const SCHEDULE_AHEAD_S = 3;
const SCHEDULER_INTERVAL_MS = 1000;
const FADE_S = 0.6;

class MusicSystem {
  private wanted: MusicMood | null = null;
  private playing: MusicMood | null = null;
  private voice: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextNoteTime = 0;
  private step = 0;
  private waitingForUnlock = false;

  /** Switch to the loop for `mood`. Does nothing if it is already playing. */
  play(mood: MusicMood): void {
    this.wanted = mood;
    if (!audio.isUnlocked) {
      if (!this.waitingForUnlock) {
        this.waitingForUnlock = true;
        audio.onUnlock(() => {
          this.waitingForUnlock = false;
          if (this.wanted) this.start(this.wanted);
        });
      }
      return;
    }
    this.start(mood);
  }

  stop(): void {
    this.wanted = null;
    this.halt();
  }

  private start(mood: MusicMood): void {
    const ctx = audio.context;
    const bus = audio.musicBus;
    if (!ctx || !bus) return;
    if (this.playing === mood) return;

    this.halt();

    this.voice = ctx.createGain();
    this.voice.gain.setValueAtTime(0, ctx.currentTime);
    this.voice.gain.linearRampToValueAtTime(1, ctx.currentTime + FADE_S);
    this.voice.connect(bus);

    this.playing = mood;
    this.step = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.schedule();
    this.timer = setInterval(() => this.schedule(), SCHEDULER_INTERVAL_MS);
  }

  /** Fade out and release the current loop. */
  private halt(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const ctx = audio.context;
    const voice = this.voice;
    this.voice = null;
    this.playing = null;
    if (ctx && voice) {
      const now = ctx.currentTime;
      voice.gain.cancelScheduledValues(now);
      voice.gain.setValueAtTime(voice.gain.value, now);
      voice.gain.linearRampToValueAtTime(0, now + FADE_S);
      // Already-scheduled notes keep running into the silent voice; drop it
      // once nothing audible can be left.
      setTimeout(() => voice.disconnect(), (FADE_S + SCHEDULE_AHEAD_S + 1) * 1000);
    }
  }

  private schedule(): void {
    const ctx = audio.context;
    const voice = this.voice;
    if (!ctx || !voice || !this.playing) return;

    const melody = MELODIES[this.playing];
    const beat = 60 / melody.tempo;
    // After the tab was in the background the clock may have run past us.
    if (this.nextNoteTime < ctx.currentTime) this.nextNoteTime = ctx.currentTime + 0.05;

    while (this.nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const i = this.step % melody.lead.length;
      const t = this.nextNoteTime;
      const lead = NOTES[melody.lead[i]];
      const bass = NOTES[melody.bass[i]];

      if (lead) this.note(ctx, voice, 'square', lead, t, beat * 0.8, 0.08);
      if (bass) this.note(ctx, voice, 'triangle', bass, t, beat * 0.9, 0.1);
      // Soft fifth above the lead on every other beat.
      if (lead && i % 2 === 0) this.note(ctx, voice, 'sine', lead * 1.5, t, beat * 0.6, 0.03);
      if (i % 4 === 0) this.tick(ctx, voice, t, beat * 0.1);

      this.nextNoteTime += beat;
      this.step++;
    }
  }

  private note(
    ctx: AudioContext,
    out: GainNode,
    type: OscillatorType,
    freq: number,
    start: number,
    duration: number,
    volume: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.02);
    gain.gain.setValueAtTime(volume, start + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    osc.connect(gain);
    gain.connect(out);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
    osc.start(start);
    osc.stop(start + duration + 0.01);
  }

  /** Short noise burst used as light percussion. */
  private tick(ctx: AudioContext, out: GainNode, start: number, duration: number): void {
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(0.04, start);
    gain.gain.linearRampToValueAtTime(0, start + duration);
    source.connect(gain);
    gain.connect(out);
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
    source.start(start);
    source.stop(start + duration + 0.01);
  }
}

export const music = new MusicSystem();
