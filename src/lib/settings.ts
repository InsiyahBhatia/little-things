import { safeStorage } from './storage';

const SETTINGS_KEY = 'littlethings_settings';

export interface AudioSettings {
  muted: boolean;
  /** 0..1 */
  musicVolume: number;
  /** 0..1 */
  sfxVolume: number;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  musicVolume: 0.6,
  sfxVolume: 0.8,
};

function clamp01(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function loadAudioSettings(): AudioSettings {
  const raw = safeStorage.get(SETTINGS_KEY);
  if (!raw) return { ...DEFAULT_AUDIO_SETTINGS };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_AUDIO_SETTINGS };
    const record = parsed as Record<string, unknown>;
    return {
      muted: typeof record.muted === 'boolean' ? record.muted : DEFAULT_AUDIO_SETTINGS.muted,
      musicVolume: clamp01(record.musicVolume, DEFAULT_AUDIO_SETTINGS.musicVolume),
      sfxVolume: clamp01(record.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume),
    };
  } catch {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  safeStorage.set(SETTINGS_KEY, JSON.stringify(settings));
}
