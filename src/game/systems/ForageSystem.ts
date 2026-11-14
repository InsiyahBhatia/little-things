import * as Phaser from 'phaser';
import { ForageArea, findSpot, pickWeighted } from './forageMath';

export type { ForageArea };

export interface ForageConfig {
  /** Rectangles plants may grow in. Positions are snapped to an 8px grid. */
  areas: ForageArea[];
  /** Relative chance of each item appearing, e.g. { flower_moonflower: 3 }. */
  weights: Record<string, number>;
  /** How many plants are out at once. */
  count: number;
  /** Solid things plants must not grow inside. */
  obstacles: Phaser.Physics.Arcade.StaticGroup;
  /** Places plants must keep clear of, such as doors and paths into the map. */
  keepClear?: Array<{ x: number; y: number; radius: number }>;
  /** Draw a patch of soil under each plant. */
  soil?: boolean;
}

export interface ForagePlant {
  id: number;
  itemId: string;
  x: number;
  y: number;
}

/** Real milliseconds before a picked plant grows back somewhere else. */
export const REGROW_MS = { min: 6_000, max: 12_000 };
export const GATHER_REACH = 24;

interface LivePlant extends ForagePlant {
  sprite: Phaser.GameObjects.Image;
  soil?: Phaser.GameObjects.Image;
}

/**
 * Keeps a number of gatherable plants growing at random spots in a scene.
 * Picking one removes it; a new one sprouts somewhere else a little later.
 */
export class ForageSystem {
  private plants: LivePlant[] = [];
  private pending: number[] = []; // times at which a new plant should sprout
  private nextId = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: ForageConfig
  ) {
    for (let i = 0; i < config.count; i++) this.sprout(false);
  }

  /** The closest ready plant within reach of (x, y). */
  plantNear(x: number, y: number): ForagePlant | null {
    let best: LivePlant | null = null;
    let bestDistance = GATHER_REACH;
    for (const plant of this.plants) {
      const d = Math.hypot(plant.x - x, plant.y - y);
      if (d < bestDistance) {
        best = plant;
        bestDistance = d;
      }
    }
    return best;
  }

  /** Remove a picked plant and schedule a replacement. */
  pick(id: number, now: number): void {
    const index = this.plants.findIndex((p) => p.id === id);
    if (index < 0) return;
    const [plant] = this.plants.splice(index, 1);
    this.scene.tweens.add({
      targets: plant.sprite,
      y: plant.y - 10,
      alpha: 0,
      scale: 0.4,
      duration: 260,
      ease: 'Back.easeIn',
      onComplete: () => plant.sprite.destroy(),
    });
    plant.soil?.destroy();
    this.pending.push(now + Phaser.Math.Between(REGROW_MS.min, REGROW_MS.max));
  }

  update(now: number): void {
    if (this.pending.length === 0) return;
    const due = this.pending.filter((t) => t <= now);
    if (due.length === 0) return;
    this.pending = this.pending.filter((t) => t > now);
    due.forEach(() => this.sprout(true));
  }

  private sprout(animate: boolean): void {
    const { areas, weights, obstacles, keepClear = [], soil } = this.config;
    const bodies = obstacles.getChildren().map((child) => (child as Phaser.GameObjects.Zone).body as Phaser.Physics.Arcade.StaticBody);

    const isFree = (x: number, y: number) => {
      const footprint = new Phaser.Geom.Rectangle(x - 9, y - 12, 18, 16);
      const blocked = bodies.some(
        (body) =>
          body &&
          Phaser.Geom.Intersects.RectangleToRectangle(
            footprint,
            new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height)
          )
      );
      return !blocked && keepClear.every((c) => Math.hypot(c.x - x, c.y - y) >= c.radius);
    };

    const spot = findSpot(areas, this.plants, isFree);
    if (!spot) {
      // The map is crowded right now; try again shortly.
      this.pending.push(this.scene.time.now + 2000);
      return;
    }

    const itemId = pickWeighted(weights);
    const plant: LivePlant = {
      id: this.nextId++,
      itemId,
      ...spot,
      soil: soil ? this.scene.add.image(spot.x - 8, spot.y - 4, 'tileset', 18).setOrigin(0, 0).setDepth(1) : undefined,
      sprite: this.scene.add.image(spot.x, spot.y, itemId).setOrigin(0.5, 0.8).setDepth(spot.y),
    };
    this.plants.push(plant);

    // A gentle sway so plants read as "can be picked".
    this.scene.tweens.add({
      targets: plant.sprite,
      angle: { from: -4, to: 4 },
      duration: 1000 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    if (animate) {
      this.scene.tweens.add({ targets: plant.sprite, scale: { from: 0, to: 1 }, duration: 380, ease: 'Back.easeOut' });
    }
  }
}
