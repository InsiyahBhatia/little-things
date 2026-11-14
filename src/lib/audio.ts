/**
 * Shared Web Audio graph for the whole game:
 *
 *   music voices ──► musicBus ─┐
 *                              ├─► master ─► speakers
 *   sound effects ─► sfxBus ───┘
 *
 * One AudioContext is used for everything, so mute and volume apply to both
 * music and sound effects and the browser only has one context to unlock.
 *
 * Browsers refuse to start audio before a user gesture. Nothing here creates
 * the context until `unlock()` has been called from one.
 */
import { AudioSettings, DEFAULT_AUDIO_SETTINGS } from './settings';

type AudioContextCtor = typeof AudioContext;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private settings: AudioSettings = { ...DEFAULT_AUDIO_SETTINGS };
  private unlocked = false;
  private unlockListeners: Array<() => void> = [];

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Run `listener` once audio becomes available (immediately if it already is). */
  onUnlock(listener: () => void): void {
    if (this.unlocked) listener();
    else this.unlockListeners.push(listener);
  }

  /** Call from a user gesture (click, key press, touch). Safe to call often. */
  unlock(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        return;
      }
      this.master = this.ctx.createGain();
      this.music = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.music.connect(this.master);
      this.sfx.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.applySettings(this.settings);

      // Silence the game while the tab is in the background.
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        const change = document.hidden ? this.ctx.suspend() : this.ctx.resume();
        change.catch(() => undefined);
      });
    }

    if (this.ctx.state === 'suspended' && !document.hidden) {
      this.ctx.resume().catch(() => undefined);
    }

    if (!this.unlocked) {
      this.unlocked = true;
      const listeners = this.unlockListeners;
      this.unlockListeners = [];
      listeners.forEach((listener) => listener());
    }
  }

  /** The context, or null until audio has been unlocked. */
  get context(): AudioContext | null {
    return this.unlocked ? this.ctx : null;
  }

  get musicBus(): GainNode | null {
    return this.unlocked ? this.music : null;
  }

  get sfxBus(): GainNode | null {
    return this.unlocked ? this.sfx : null;
  }

  applySettings(settings: AudioSettings): void {
    this.settings = { ...settings };
    if (!this.ctx || !this.master || !this.music || !this.sfx) return;
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(settings.muted ? 0 : 1, now, 0.02);
    // The synth voices are loud; scale so 100% is still comfortable.
    this.music.gain.setTargetAtTime(settings.musicVolume * 0.4, now, 0.02);
    this.sfx.gain.setTargetAtTime(settings.sfxVolume, now, 0.02);
  }
}

export const audio = new AudioEngine();
