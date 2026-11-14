import { describe, expect, it } from 'vitest';
import { DAY_DURATION_MS, GameClock, lightingAt, timeOfDayAt } from '../systems/GameClock';

describe('GameClock', () => {
  it('starts a new game at 06:00 on day 1', () => {
    const clock = new GameClock();
    clock.reset();
    expect(clock.snapshot()).toEqual({ day: 1, hour: 6, minute: 0, phase: 'dawn' });
  });

  it('rolls over to the next day', () => {
    const clock = new GameClock();
    clock.reset(1, 0.99);
    for (let i = 0; i < DAY_DURATION_MS / 1000; i++) clock.tick(1000);
    expect(clock.getDay()).toBe(2);
  });

  it('ignores huge frame gaps so time does not jump after a pause', () => {
    const clock = new GameClock();
    clock.reset(1, 0.25);
    clock.tick(60 * 60 * 1000);
    expect(clock.getProgress()).toBeLessThan(0.26);
  });

  it('names the parts of the day', () => {
    expect(timeOfDayAt(6)).toBe('dawn');
    expect(timeOfDayAt(12)).toBe('day');
    expect(timeOfDayAt(19)).toBe('dusk');
    expect(timeOfDayAt(23)).toBe('night');
    expect(timeOfDayAt(2)).toBe('night');
  });

  it('has no tint at midday and darkens smoothly into the night', () => {
    expect(lightingAt(12).alpha).toBe(0);
    expect(lightingAt(20.99).alpha).toBeCloseTo(lightingAt(21).alpha, 1);
    expect(lightingAt(5).alpha).toBeCloseTo(lightingAt(4.99).alpha, 1);
  });
});
