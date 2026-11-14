import * as Phaser from 'phaser';
import { EventBus } from '../events/EventBus';
import { BaseWorldScene, Interaction } from './BaseWorldScene';
import { COLORS } from '../config';
import { ForageSystem } from '../systems/ForageSystem';
import { useGameStore } from '@/store/gameStore';
import { GAME_ITEMS } from '../data/items';

const DOOR = { x: 266, y: 152 };
const NOTICE_BOARD = { x: 222, y: 174 };
const PICKLES = { x: 316, y: 170 };
const POND = { x: 168, y: 404 };
const LAMP = { x: 302, y: 214 };
const WATER_FRAMES = [4, 20, 52];

/** The dirt path from the cottage door to the bridge, with a branch to the pond. */
const PATH_MAIN = [
  { x: 266, y: 150 },
  { x: 266, y: 196 },
  { x: 276, y: 236 },
  { x: 312, y: 262 },
  { x: 420, y: 270 },
  { x: 520, y: 260 },
  { x: 600, y: 264 },
];
const PATH_POND = [
  { x: 272, y: 228 },
  { x: 236, y: 276 },
  { x: 214, y: 330 },
  { x: 196, y: 372 },
];

function distanceToPath(points: Array<{ x: number; y: number }>, x: number, y: number): number {
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t)));
  }
  return best;
}

/** Paths and water, which ground cover and flowers keep off. */
function onPathOrWater(x: number, y: number): boolean {
  return distanceToPath(PATH_MAIN, x, y) < 22 || distanceToPath(PATH_POND, x, y) < 18 || x >= 570;
}

export class CottageGardenScene extends BaseWorldScene {
  protected readonly sceneKey = 'CottageGardenScene' as const;
  protected readonly locationName = 'Cottage garden';
  protected readonly mood = 'garden' as const;
  protected readonly mapWidth = 640;
  protected readonly mapHeight = 480;
  protected readonly defaultSpawn = { x: 266, y: 212 };

  private forage!: ForageSystem;
  private waterTiles: Phaser.GameObjects.Image[] = [];
  private waterFrame = -1;

  constructor() {
    super('CottageGardenScene');
  }

  protected buildWorld() {
    this.waterTiles = [];
    this.waterFrame = -1;

    // Ground: grass, a cobbled path from the door to a lane, the river and its bridge
    for (let x = 0; x < this.mapWidth; x += 16) {
      for (let y = 0; y < this.mapHeight; y += 16) {
        const isBridge = x >= 576 && x <= 624 && y >= 240 && y <= 288;
        const isWater = x >= 592 && (y < 240 || y > 288);
        const isBank = x === 576 && (y < 240 || y > 288);

        let frame: number;
        if (isBridge) frame = 53;
        else if (isWater) frame = WATER_FRAMES[0];
        else if (isBank) frame = 37;
        else {
          const noise = this.noiseAt(x, y);
          frame = noise < 10 ? 1 : noise < 14 ? 17 : 0;
        }

        const image = this.tile(x, y, frame);
        if (isWater) this.waterTiles.push(image);
      }
    }

    // The cottage, with Mimi's shop inside. Its windows glow at night.
    this.prop('cottage', 264, 152);
    this.addWall(265, 96, 150, 96);
    this.addLight(232, 112, 22);
    this.addLight(300, 112, 22);
    this.addLight(DOOR.x, DOOR.y - 20, 30, 0xffd27a, 0.6);

    this.drawPath(PATH_MAIN, 28, 5);
    this.drawPath(PATH_POND, 20, 9);

    // Trees around the edges
    this.prop('tree_wisteria', 128, 108, { width: 26, height: 12 });
    this.prop('tree_willow', 50, 178, { width: 26, height: 12 });
    this.prop('tree_apple', 420, 96, { width: 24, height: 12 });
    this.prop('tree_blossom', 488, 168, { width: 26, height: 12 });
    this.prop('tree_autumn', 60, 476, { width: 24, height: 12 });
    this.prop('tree_apple', 528, 474, { width: 24, height: 12 });

    // Bushes, a barrel and the notice board by the cottage
    this.prop('bush_hydrangea', 184, 158, { width: 32, height: 10 });
    this.prop('bush_rose', 354, 156, { width: 26, height: 10 });
    this.prop('barrel', 376, 172, { width: 16, height: 8 });
    this.prop('bush_marigold', 530, 230, { width: 22, height: 8 });
    this.prop('bush_daisy', 36, 326, { width: 24, height: 8 });
    this.prop('bush_berry', 560, 120, { width: 20, height: 8 });
    this.prop('signpost', NOTICE_BOARD.x, NOTICE_BOARD.y, { width: 12, height: 8 });

    // A lamppost by the path that lights up after dark
    this.prop('lamppost', LAMP.x, LAMP.y, { width: 8, height: 6 });
    this.addLight(LAMP.x + 6, LAMP.y - 34, 46);

    // A lily pond and some rocks in the meadow
    this.prop('pond', POND.x, POND.y + 22, undefined, 3);
    this.addWall(POND.x, POND.y + 4, 112, 30);
    this.prop('rock_mossy', 430, 396, { width: 36, height: 12 });
    this.prop('rocks_small', 340, 444, { width: 22, height: 8 });
    this.prop('stump', 504, 344, { width: 24, height: 10 });
    this.prop('rocks_cluster', 40, 240, { width: 30, height: 10 });

    // River, with a gap for the bridge to the forest
    this.addWall(608, 120, 32, 240);
    this.addWall(608, 384, 32, 192);
    this.prop('signpost', 556, 248, { width: 12, height: 8 });
    this.addSign(540, 210, 'Enchanted forest');

    // Pickles the cat dozes by the door.
    const pickles = this.prop('pickles', PICKLES.x, PICKLES.y, { width: 18, height: 8 });
    this.tweens.add({ targets: pickles, scaleY: 0.96, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Grass tufts, clover and little wildflowers all over the meadow
    const blocked = (x: number, y: number) =>
      onPathOrWater(x, y) ||
      (x > 170 && x < 362 && y < 176) ||
      Math.hypot(x - POND.x, y - POND.y) < 70 ||
      this.obstacles.getChildren().some((child) => {
        const body = (child as Phaser.GameObjects.Zone).body as Phaser.Physics.Arcade.StaticBody;
        return x > body.x - 4 && x < body.right + 4 && y > body.y - 2 && y < body.bottom + 8;
      });
    const meadow = { x: 8, y: 20, width: 560, height: 452 };
    this.scatter(['grass_tuft', 'grass_tuft', 'sprout_clover', 'pebbles'], 90, meadow, blocked, 7);
    this.scatter(['flower_daisies', 'flower_lily', 'flower_lavender', 'flower_foxglove'], 26, meadow, blocked, 11);

    // Fireflies
    for (let i = 0; i < 16; i++) {
      const x = Phaser.Math.Between(40, 600);
      const y = Phaser.Math.Between(40, 440);
      const firefly = this.add.rectangle(x, y, 1, 1, COLORS.honey).setDepth(940);
      this.tweens.add({
        targets: firefly,
        x: x + Phaser.Math.Between(-25, 25),
        y: y + Phaser.Math.Between(-20, 20),
        alpha: { from: 0.1, to: 0.95 },
        duration: Phaser.Math.Between(2000, 3800),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Ingredients grow wherever there is open grass, never on the paths.
    this.forage = new ForageSystem(this, {
      areas: [
        { x: 24, y: 184, width: 216, height: 56 },
        { x: 304, y: 184, width: 256, height: 56 },
        { x: 24, y: 304, width: 540, height: 156 },
        { x: 376, y: 40, width: 184, height: 56 },
      ],
      weights: { flower_moonflower: 3, flower_sunberry: 3, flower_dream_tulip: 2, flower_whisper_fern: 2, herb_lavender: 2 },
      count: 9,
      obstacles: this.obstacles,
      keepClear: [
        { x: DOOR.x, y: DOOR.y, radius: 36 },
        { x: 600, y: 264, radius: 44 },
        { x: this.defaultSpawn.x, y: this.defaultSpawn.y, radius: 20 },
        { x: POND.x, y: POND.y, radius: 76 },
        { x: NOTICE_BOARD.x, y: NOTICE_BOARD.y, radius: 20 },
      ],
      soil: false,
    });
  }

  protected updateWorld(time: number, delta: number) {
    const frame = Math.floor(time / 450) % WATER_FRAMES.length;
    if (frame !== this.waterFrame) {
      this.waterFrame = frame;
      this.waterTiles.forEach((tile) => tile.setFrame(WATER_FRAMES[frame]));
    }

    // A puff of chimney smoke every 1.4 seconds
    if (Math.floor(time / 1400) !== Math.floor((time - delta) / 1400)) {
      const puff = this.add.circle(286, 40, 3, COLORS.paper, 0.55).setDepth(200);
      this.tweens.add({
        targets: puff,
        x: 286 + Phaser.Math.Between(6, 18),
        y: 8,
        scale: 2.4,
        alpha: 0,
        duration: 2000,
        ease: 'Sine.easeOut',
        onComplete: () => puff.destroy(),
      });
    }

    this.forage.update(time);
  }

  protected findInteraction(time: number): Interaction | null {
    // Picking comes first so a flower next to the cat can still be picked.
    const plant = this.forage.plantNear(this.player.x, this.player.y);
    if (plant) {
      const name = GAME_ITEMS[plant.itemId].name;
      return {
        id: `plant:${plant.id}`,
        text: `Pick ${name.toLowerCase()}`,
        run: () => {
          if (useGameStore.getState().harvestFlower(plant.itemId) !== 'ok') return;
          this.forage.pick(plant.id, time);
          this.floatText(plant.x, plant.y - 14, `+1 ${name}`);
        },
      };
    }

    if (this.distanceToPlayer(DOOR.x, DOOR.y) < 28) {
      return { id: 'shop_door', text: 'Enter the potion shop', run: () => this.travelTo('PotionShopScene', 240, 210) };
    }

    if (this.distanceToPlayer(NOTICE_BOARD.x, NOTICE_BOARD.y + 6) < 26) {
      return {
        id: 'notice_board',
        text: 'Read the notice board',
        run: () =>
          EventBus.emit('OPEN_DIALOGUE', {
            speakerName: 'A note from Mayor Bramble',
            avatar: 'approved/props/signpost.png',
            text: 'Dear Mimi, the whole village loves your little shop! Bring flowers in from the garden and the forest, and experiment at the cauldron. Who knows what you will discover?',
            closeLabel: 'Lovely',
          }),
      };
    }

    if (this.distanceToPlayer(PICKLES.x, PICKLES.y) < 30) {
      return {
        id: 'pickles',
        text: 'Pet Pickles',
        run: () => {
          this.floatText(PICKLES.x, PICKLES.y - 28, '♥', COLORS.rose);
          EventBus.emit('OPEN_DIALOGUE', {
            speakerName: 'Pickles',
            avatar: 'approved/characters/pickles.png',
            text: 'Purr-meow. Flowers pop up all over the garden, never in the same place twice. Glowcaps only grow in the forest, over the bridge to the east.',
            closeLabel: 'Good kitty',
          });
        },
      };
    }

    return null;
  }

  protected checkExits() {
    // East over the bridge
    if (this.player.x > 620 && this.player.y >= 240 && this.player.y <= 296) {
      this.travelTo('EnchantedForestScene', 50, 264);
    }
  }
}
