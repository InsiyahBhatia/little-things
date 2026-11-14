import { describe, expect, it } from 'vitest';
import { findSpot, pickWeighted } from '../systems/forageMath';

/** Small seeded generator so the tests are repeatable. */
function rng(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('pickWeighted', () => {
  it('follows the weights', () => {
    const random = rng(3);
    const counts: Record<string, number> = { a: 0, b: 0 };
    for (let i = 0; i < 4000; i++) counts[pickWeighted({ a: 3, b: 1 }, random)]++;
    expect(counts.a / counts.b).toBeGreaterThan(2.5);
    expect(counts.a / counts.b).toBeLessThan(3.5);
  });

  it('never picks something with no weight', () => {
    const random = rng(5);
    for (let i = 0; i < 500; i++) expect(pickWeighted({ a: 1, never: 0 }, random)).toBe('a');
  });
});

describe('findSpot', () => {
  const area = [{ x: 0, y: 0, width: 200, height: 200 }];

  it('stays inside the area and on the 8px grid', () => {
    const random = rng(7);
    for (let i = 0; i < 100; i++) {
      const spot = findSpot(area, [], () => true, random)!;
      expect(spot.x % 8).toBe(0);
      expect(spot.y % 8).toBe(0);
      expect(spot.x).toBeGreaterThanOrEqual(0);
      expect(spot.x).toBeLessThanOrEqual(200);
    }
  });

  it('keeps away from plants that are already there', () => {
    const random = rng(11);
    const taken: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 12; i++) {
      const spot = findSpot(area, taken, () => true, random);
      if (spot) taken.push(spot);
    }
    for (const a of taken) {
      for (const b of taken) {
        if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(28);
      }
    }
  });

  it('gives up instead of looping when nowhere is free', () => {
    expect(findSpot(area, [], () => false, rng(13))).toBeNull();
  });

  it('spreads plants around rather than reusing spots', () => {
    const random = rng(17);
    const spots = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const spot = findSpot(area, [], () => true, random)!;
      spots.add(`${spot.x},${spot.y}`);
    }
    expect(spots.size).toBeGreaterThan(20);
  });
});
