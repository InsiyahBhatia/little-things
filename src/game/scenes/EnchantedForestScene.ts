import * as Phaser from 'phaser';
import { EventBus } from '../events/EventBus';
import { BaseWorldScene, Interaction } from './BaseWorldScene';
import { COLORS } from '../config';
import { ForageSystem } from '../systems/ForageSystem';
import { useGameStore } from '@/store/gameStore';
import { GAME_ITEMS, RECIPES } from '../data/items';

const POND = { x: 400, y: 240, radius: 56 };
const PIP_HOME = { x: 336, y: 172 };
const DEER = { x: 176, y: 150 };

const TREES = [
  { x: 92, y: 116, key: 'tree_willow' },
  { x: 250, y: 96, key: 'tree_lantern', light: { dx: 0, dy: -50 } },
  { x: 488, y: 100, key: 'tree_wisteria' },
  { x: 590, y: 160, key: 'tree_autumn' },
  { x: 110, y: 420, key: 'tree_lantern', light: { dx: 0, dy: -50 } },
  { x: 500, y: 430, key: 'tree_willow' },
  { x: 600, y: 330, key: 'tree_blossom' },
  { x: 30, y: 340, key: 'tree_autumn' },
  { x: 360, y: 470, key: 'tree_wisteria' },
];

/** Smaller woodland things, with how big their solid base is. */
const WOODLAND: Array<{ key: string; x: number; y: number; w?: number; h?: number; glow?: number }> = [
  { key: 'mushroom_giant', x: 300, y: 150, w: 40, h: 14 },
  { key: 'mushroom_pale', x: 196, y: 196, w: 14, h: 8 },
  { key: 'mushroom_purple', x: 540, y: 248, w: 16, h: 8, glow: 0xc58cff },
  { key: 'mushrooms_purple', x: 160, y: 316 },
  { key: 'mushrooms_purple', x: 430, y: 356 },
  { key: 'mushroom_pale', x: 252, y: 404, w: 14, h: 8 },
  { key: 'fungus_shelf', x: 524, y: 404 },
  { key: 'stump', x: 68, y: 210, w: 24, h: 10 },
  { key: 'log_hollow', x: 420, y: 160, w: 24, h: 10 },
  { key: 'log_flowers', x: 200, y: 460, w: 36, h: 10 },
  { key: 'crystals', x: 560, y: 210, w: 26, h: 10, glow: 0xb48cff },
  { key: 'crystal_cluster', x: 330, y: 330, w: 30, h: 12, glow: 0xd59cff },
  { key: 'rock_rune', x: 620, y: 420, w: 40, h: 14, glow: 0xffb347 },
  { key: 'rock_mossy', x: 160, y: 250, w: 36, h: 12 },
  { key: 'bush_hydrangea', x: 40, y: 150, w: 30, h: 10 },
  { key: 'bush_green', x: 380, y: 120, w: 20, h: 8 },
];

export class EnchantedForestScene extends BaseWorldScene {
  protected readonly sceneKey = 'EnchantedForestScene' as const;
  protected readonly locationName = 'Enchanted forest';
  protected readonly mood = 'forest' as const;
  protected readonly mapWidth = 640;
  protected readonly mapHeight = 480;
  protected readonly defaultSpawn = { x: 50, y: 264 };
  protected readonly initialFacing = 'right' as const;

  private forage!: ForageSystem;
  private pip!: Phaser.GameObjects.Image;

  constructor() {
    super('EnchantedForestScene');
  }

  protected buildWorld() {
    // Ground: plain forest floor (moss, plants and pebbles are scattered on top)
    for (let x = 0; x < this.mapWidth; x += 16) {
      for (let y = 0; y < this.mapHeight; y += 16) {
        this.tile(x, y, 55);
      }
    }

    // A woodland trail from the bridge to the pond
    this.drawPath(
      [
        { x: 0, y: 264 },
        { x: 120, y: 268 },
        { x: 210, y: 256 },
        { x: 280, y: 246 },
        { x: 330, y: 240 },
      ],
      24,
      13
    );

    this.drawPond(POND.x, POND.y, 60);

    // The pond is solid
    const pond = this.add.zone(POND.x, POND.y, POND.radius * 2, POND.radius * 2);
    this.physics.add.existing(pond, true);
    (pond.body as Phaser.Physics.Arcade.StaticBody).setCircle(POND.radius);
    this.obstacles.add(pond);
    this.addSign(POND.x, POND.y - 14, 'Starlight pond');

    // A little waterfall tumbles into the pond.
    this.prop('waterfall', POND.x, POND.y - POND.radius + 14, undefined, POND.y - POND.radius + 14);

    TREES.forEach((tree) => {
      this.prop(tree.key, tree.x, tree.y, { width: 26, height: 12 });
      if (tree.light) this.addLight(tree.x + tree.light.dx, tree.y + tree.light.dy, 48);
    });

    WOODLAND.forEach((thing) => {
      this.prop(thing.key, thing.x, thing.y, thing.w && thing.h ? { width: thing.w, height: thing.h } : undefined);
      if (thing.glow) this.addLight(thing.x, thing.y - 12, 34, thing.glow, 0.6);
    });

    // Moss, clover and tiny mushrooms underfoot
    const isTrail = (x: number, y: number) =>
      (y >= 248 && y <= 284 && x <= 228) || (x >= 214 && x <= 336 && Math.abs(y - (264 - (x - 220) * 0.2)) < 20);
    const blocked = (x: number, y: number) =>
      isTrail(x, y) ||
      Phaser.Math.Distance.Between(x, y, POND.x, POND.y) < 82 ||
      this.obstacles.getChildren().some((child) => {
        const body = (child as Phaser.GameObjects.Zone).body as Phaser.Physics.Arcade.StaticBody;
        return x > body.x - 4 && x < body.right + 4 && y > body.y - 2 && y < body.bottom + 8;
      });
    const floor = { x: 8, y: 20, width: 624, height: 452 };
    this.scatter(['grass_tuft', 'sprout_clover', 'sprout_clover', 'pebbles'], 100, floor, blocked, 21);
    this.scatter(['flower_lily', 'mushrooms_purple', 'flower_daisies'], 18, floor, blocked, 23);

    // The old willow deer watches over the forest.
    const deer = this.prop('willow_deer', DEER.x, DEER.y, { width: 26, height: 12 });
    this.tweens.add({ targets: deer, scaleY: 1.03, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Pip the fairy flits around near the pond.
    this.pip = this.add.image(PIP_HOME.x, PIP_HOME.y, 'pip').setDepth(930);
    this.tweens.add({ targets: this.pip, x: PIP_HOME.x + 22, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.pip, y: PIP_HOME.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Drifting spores
    for (let i = 0; i < 22; i++) {
      const x = Phaser.Math.Between(40, 600);
      const y = Phaser.Math.Between(40, 440);
      const spore = this.add.rectangle(x, y, 1, 1, COLORS.mist).setDepth(940);
      this.tweens.add({
        targets: spore,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-30, 30),
        alpha: { from: 0.1, to: 0.95 },
        duration: Phaser.Math.Between(2500, 4500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.addSign(44, 236, 'Cottage garden');

    this.forage = new ForageSystem(this, {
      areas: [{ x: 24, y: 40, width: 576, height: 410 }],
      weights: {
        flower_glowcap: 4,
        forage_toadstool: 3,
        forage_berries: 3,
        flower_whisper_fern: 2,
        flower_moonflower: 1,
        flower_dream_tulip: 1,
        forage_star_crystal: 1,
      },
      count: 10,
      obstacles: this.obstacles,
      keepClear: [
        { x: POND.x, y: POND.y, radius: POND.radius + 22 },
        { x: 30, y: 264, radius: 44 },
        { x: DEER.x, y: DEER.y, radius: 28 },
        { x: POND.x, y: POND.y - POND.radius, radius: 40 },
      ],
    });
  }

  protected updateWorld(time: number) {
    this.forage.update(time);
  }

  protected findInteraction(time: number): Interaction | null {
    const plant = this.forage.plantNear(this.player.x, this.player.y);
    if (plant) {
      const name = GAME_ITEMS[plant.itemId].name;
      return {
        id: `plant:${plant.id}`,
        text: `Forage ${name.toLowerCase()}`,
        run: () => {
          if (useGameStore.getState().harvestFlower(plant.itemId) !== 'ok') return;
          this.forage.pick(plant.id, time);
          this.floatText(plant.x, plant.y - 14, `+1 ${name}`);
        },
      };
    }

    if (this.distanceToPlayer(DEER.x, DEER.y) < 32) {
      return { id: 'deer', text: 'Talk to the willow deer', run: () => this.deerHint() };
    }

    if (this.distanceToPlayer(this.pip.x, this.pip.y + 16) < 30) {
      return {
        id: 'pip',
        text: 'Say hello to Pip',
        run: () =>
          EventBus.emit('OPEN_DIALOGUE', {
            speakerName: 'Pip',
            avatar: 'approved/characters/pip.png',
            text: 'Hee hee! Glowcaps, toadstools and berries grow all over the forest, and they pop up somewhere new after you pick them. If you are very lucky you might find a star crystal!',
            closeLabel: 'Thanks, Pip',
          }),
      };
    }

    if (this.distanceToPlayer(POND.x, POND.y) < POND.radius + 26) {
      return {
        id: 'pond',
        text: 'Dip your toes in the pond',
        run: () =>
          EventBus.emit('OPEN_DIALOGUE', {
            speakerName: 'Starlight pond',
            avatar: 'approved/characters/pip.png',
            text: 'Tiny water sprites splash around your boots. The cool water glimmers with starlight.',
            closeLabel: 'So refreshing',
          }),
      };
    }

    return null;
  }

  /** The deer hints at a recipe the player has not discovered yet. */
  private deerHint() {
    const known = useGameStore.getState().knownRecipes;
    const unknown = RECIPES.find((r) => !known.includes(r.id));
    EventBus.emit('OPEN_DIALOGUE', {
      speakerName: 'The willow deer',
      avatar: 'approved/characters/willow_deer.png',
      text: unknown
        ? `Listen, little witch. ${unknown.hint}`
        : 'You know every brew the forest can teach. The village is lucky to have you.',
      closeLabel: 'I will remember',
    });
  }

  protected checkExits() {
    // West, back over the bridge
    if (this.player.x < 18 && this.player.y >= 235 && this.player.y <= 295) {
      this.travelTo('CottageGardenScene', 580, 264);
    }
  }
}
