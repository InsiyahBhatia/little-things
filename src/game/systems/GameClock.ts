/**
 * The in-game clock. There is exactly one, shared by every scene, so time
 * carries on when Mimi walks between places and can be saved and restored.
 */
import { EventBus } from '../events/EventBus';

export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night';

export interface ClockSnapshot {
  day: number;
  hour: number;
  /** Rounded down to the nearest 10 so the display does not flicker. */
  minute: number;
  phase: TimeOfDay;
}

/** Real milliseconds for one full in-game day. */
export const DAY_DURATION_MS = 180_000;
export const START_OF_DAY_PROGRESS = 0.25; // 06:00

const TICKS_PER_DAY = 144; // one tick per 10 in-game minutes
const MAX_STEP_MS = 1000;

export function timeOfDayAt(hours: number): TimeOfDay {
  if (hours >= 5 && hours < 8) return 'dawn';
  if (hours >= 8 && hours < 18) return 'day';
  if (hours >= 18 && hours < 21) return 'dusk';
  return 'night';
}

const NIGHT = { color: 0x312450, alpha: 0.55 };
const DAWN_GLOW = 0xffc4b0;
const DUSK_GLOW = 0xb482aa;

function mixColor(from: number, to: number, t: number): number {
  const channel = (shift: number) => {
    const a = (from >> shift) & 0xff;
    const b = (to >> shift) & 0xff;
    return Math.round(a + (b - a) * t) << shift;
  };
  return channel(16) | channel(8) | channel(0);
}

/** Colour and strength of the multiply tint laid over outdoor scenes. */
export function lightingAt(hours: number): { color: number; alpha: number } {
  switch (timeOfDayAt(hours)) {
    case 'dawn': {
      const t = (hours - 5) / 3;
      return { color: mixColor(NIGHT.color, DAWN_GLOW, Math.min(1, t * 2)), alpha: NIGHT.alpha * (1 - t) };
    }
    case 'day':
      return { color: 0xffffff, alpha: 0 };
    case 'dusk': {
      const t = (hours - 18) / 3;
      return { color: mixColor(DUSK_GLOW, NIGHT.color, t), alpha: NIGHT.alpha * t };
    }
    default:
      return NIGHT;
  }
}

export class GameClock {
  private day = 1;
  private progress = START_OF_DAY_PROGRESS;
  private lastTick = -1;

  /** Set the clock, e.g. for a new game or when loading a save. */
  reset(day = 1, progress = START_OF_DAY_PROGRESS): void {
    this.day = Math.max(1, Math.floor(day));
    this.progress = Math.min(0.999999, Math.max(0, progress));
    this.lastTick = -1;
    this.publish();
  }

  /** Advance by `deltaMs` of real time. */
  tick(deltaMs: number): void {
    if (!(deltaMs > 0)) return;
    this.progress += Math.min(deltaMs, MAX_STEP_MS) / DAY_DURATION_MS;
    while (this.progress >= 1) {
      this.progress -= 1;
      this.day++;
    }
    this.publish();
  }

  getDay(): number {
    return this.day;
  }

  getProgress(): number {
    return this.progress;
  }

  /** Hours since midnight, 0..24. */
  getHours(): number {
    return this.progress * 24;
  }

  snapshot(): ClockSnapshot {
    const totalMinutes = Math.floor(this.progress * 24 * 60);
    return {
      day: this.day,
      hour: Math.floor(totalMinutes / 60),
      minute: Math.floor((totalMinutes % 60) / 10) * 10,
      phase: timeOfDayAt(this.getHours()),
    };
  }

  /** Tell the interface about the time, at most once per 10 in-game minutes. */
  private publish(): void {
    const tick = this.day * TICKS_PER_DAY + Math.floor(this.progress * TICKS_PER_DAY);
    if (tick === this.lastTick) return;
    this.lastTick = tick;
    EventBus.emit('TIME_TICK', this.snapshot());
  }
}

export const gameClock = new GameClock();
