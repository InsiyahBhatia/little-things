/** Placement maths for foraging, kept free of Phaser so it can be unit tested. */

export interface ForageArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MIN_SPACING = 28;
const PLACEMENT_TRIES = 40;

type Rng = () => number;

/** Pick a key from `weights` with probability proportional to its weight. */
export function pickWeighted(weights: Record<string, number>, rng: Rng = Math.random): string {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}

/**
 * Find a free spot inside one of `areas`, at least `spacing` away from every
 * point in `taken`, for which `isFree` returns true. Returns null if no spot
 * is found after a fixed number of tries.
 */
export function findSpot(
  areas: ForageArea[],
  taken: Array<{ x: number; y: number }>,
  isFree: (x: number, y: number) => boolean,
  rng: Rng = Math.random,
  spacing = MIN_SPACING
): { x: number; y: number } | null {
  const totalArea = areas.reduce((sum, a) => sum + a.width * a.height, 0);
  for (let attempt = 0; attempt < PLACEMENT_TRIES; attempt++) {
    // Choose an area weighted by size so big areas get more plants.
    let roll = rng() * totalArea;
    let area = areas[0];
    for (const candidate of areas) {
      roll -= candidate.width * candidate.height;
      if (roll < 0) {
        area = candidate;
        break;
      }
    }
    const x = Math.round((area.x + rng() * area.width) / 8) * 8;
    const y = Math.round((area.y + rng() * area.height) / 8) * 8;
    const crowded = taken.some((p) => Math.hypot(p.x - x, p.y - y) < spacing);
    if (!crowded && isFree(x, y)) return { x, y };
  }
  return null;
}
