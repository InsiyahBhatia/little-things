import * as Phaser from 'phaser';
import { EventBus } from '../events/EventBus';
import { COLORS, REGISTRY_FONT, TEXT_RESOLUTION, fitCameraToWindow } from '../config';
import { gameClock, lightingAt } from '../systems/GameClock';

const NIGHT_ALPHA = 0.55;
import { consumeInteract, getVirtualAxis } from '../input/virtualInput';
import { isUiBlocking, setPositionProvider, useGameStore } from '@/store/gameStore';
import { music, MusicMood } from '@/lib/music';
import { sounds } from '@/lib/sound';
import type { PlayableScene } from '@/lib/SaveManager';

export interface SpawnData {
  spawnX?: number | null;
  spawnY?: number | null;
}

/** Something Mimi can do right now by pressing the interact key. */
export interface Interaction {
  id: string;
  /** Shown in the prompt, e.g. "Pick moonflower". */
  text: string;
  run: () => void;
}

type Facing = 'down' | 'right' | 'up' | 'left';

const WALK_SPEED = 105;
const FADE_COLOR = [27, 20, 36] as const;
/** After a panel closes, ignore the interact key briefly so the key press
 *  that closed the panel does not immediately trigger the world again. */
const INTERACT_COOLDOWN_MS = 220;

/**
 * Shared behaviour for every place Mimi can walk around: the player sprite,
 * movement from keyboard and touch, interactions, moving between places,
 * the day/night tint, and pausing while a panel is open.
 */
export abstract class BaseWorldScene extends Phaser.Scene {
  protected abstract readonly sceneKey: PlayableScene;
  protected abstract readonly locationName: string;
  protected abstract readonly mood: MusicMood;
  protected abstract readonly mapWidth: number;
  protected abstract readonly mapHeight: number;
  protected abstract readonly defaultSpawn: { x: number; y: number };
  protected readonly initialFacing: Facing = 'down';
  /** How strongly the time of day tints this place (0 = not at all). */
  protected readonly lightingStrength: number = 1;

  protected player!: Phaser.Physics.Arcade.Sprite;
  protected obstacles!: Phaser.Physics.Arcade.StaticGroup;

  private keys!: Record<'up' | 'down' | 'left' | 'right' | 'w' | 'a' | 's' | 'd' | 'interact', Phaser.Input.Keyboard.Key>;
  private facing: Facing = 'down';
  private lighting?: Phaser.GameObjects.Rectangle;
  private lamps: Array<{ glow: Phaser.GameObjects.Image; base: number }> = [];
  private transitioning = false;
  private wasBlocked = false;
  private interactAllowedAt = 0;
  private lastPromptId: string | null = null;

  /** Build the map: tiles, props, colliders (add them to `this.obstacles`). */
  protected abstract buildWorld(): void;
  /** Per-frame ambient updates (water, smoke, respawns). Runs even when paused by a panel. */
  protected updateWorld(_time: number, _delta: number): void {}
  /** The interaction available at the player's current position, if any. */
  protected abstract findInteraction(time: number): Interaction | null;
  /** Called every frame while the player has control, e.g. to check map exits. */
  protected checkExits(): void {}

  create(data?: SpawnData) {
    this.transitioning = false;
    this.wasBlocked = false;
    this.interactAllowedAt = 0;
    this.lastPromptId = null;
    this.lamps = [];
    this.facing = this.initialFacing;
    this.ensureLightTexture();

    EventBus.emit('SCENE_LOADED', { sceneKey: this.sceneKey, locationName: this.locationName });
    music.play(this.mood);

    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.obstacles = this.physics.add.staticGroup();

    this.buildWorld();

    // Player
    const spawn = this.resolveSpawn(data);
    const idleFrame = { down: 0, right: 4, up: 8, left: 12 }[this.facing];
    this.player = this.physics.add.sprite(spawn.x, spawn.y, 'mimi_walk', idleFrame);
    this.player.setSize(16, 20).setOffset(8, 28);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, this.obstacles);

    // Camera
    const camera = this.cameras.main;
    fitCameraToWindow(this);
    camera.setBounds(0, 0, this.mapWidth, this.mapHeight);
    camera.startFollow(this.player, true, 0.12, 0.12);
    camera.fadeIn(350, ...FADE_COLOR);

    // Time-of-day tint, drawn over the world but under floating labels.
    if (this.lightingStrength > 0) {
      this.lighting = this.add
        .rectangle(0, 0, this.mapWidth, this.mapHeight, 0xffffff, 0)
        .setOrigin(0, 0)
        .setDepth(900)
        .setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    // Keys are not "captured" so the browser and the interface still get them.
    const keyboard = this.input.keyboard!;
    const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
    const key = (code: number) => keyboard.addKey(code, false);
    this.keys = {
      up: key(KeyCodes.UP),
      down: key(KeyCodes.DOWN),
      left: key(KeyCodes.LEFT),
      right: key(KeyCodes.RIGHT),
      w: key(KeyCodes.W),
      a: key(KeyCodes.A),
      s: key(KeyCodes.S),
      d: key(KeyCodes.D),
      interact: key(KeyCodes.E),
    };

    setPositionProvider(() => ({ scene: this.sceneKey, x: Math.round(this.player.x), y: Math.round(this.player.y) }));
    const offReturn = EventBus.on('RETURN_TO_TITLE', () => this.scene.start('TitleScene'));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offReturn();
      setPositionProvider(null);
      this.onShutdown();
    });
  }

  /** Override to release anything created in `buildWorld` that Phaser does not own. */
  protected onShutdown(): void {}

  update(time: number, delta: number) {
    if (!this.player) return;

    const state = useGameStore.getState();
    const blocked = isUiBlocking(state);

    // Time stands still on the pause menu, but not while browsing the bag.
    if (!state.isPauseOpen && state.phase === 'playing') {
      gameClock.tick(delta);
    }
    this.updateLighting();
    this.updateWorld(time, delta);
    this.player.setDepth(this.player.y);

    if (this.transitioning || blocked) {
      this.player.setVelocity(0, 0);
      this.player.anims.play(`mimi_idle_${this.facing}`, true);
      this.wasBlocked = this.wasBlocked || blocked;
      consumeInteract();
      return;
    }

    if (this.wasBlocked) {
      this.wasBlocked = false;
      this.interactAllowedAt = time + INTERACT_COOLDOWN_MS;
    }

    this.movePlayer();

    const interactPressed =
      (Phaser.Input.Keyboard.JustDown(this.keys.interact) || consumeInteract()) && time >= this.interactAllowedAt;

    const interaction = this.findInteraction(time);
    this.setPrompt(interaction);
    if (interaction && interactPressed) {
      interaction.run();
    }

    this.checkExits();
  }

  private movePlayer() {
    const k = this.keys;
    const axis = getVirtualAxis();
    let dx = (k.right.isDown || k.d.isDown ? 1 : 0) - (k.left.isDown || k.a.isDown ? 1 : 0) + axis.x;
    let dy = (k.down.isDown || k.s.isDown ? 1 : 0) - (k.up.isDown || k.w.isDown ? 1 : 0) + axis.y;

    const length = Math.hypot(dx, dy);
    if (length > 1) {
      dx /= length;
      dy /= length;
    }
    if (length < 0.15) {
      dx = 0;
      dy = 0;
    }

    this.player.setVelocity(dx * WALK_SPEED, dy * WALK_SPEED);

    if (dx === 0 && dy === 0) {
      this.player.anims.play(`mimi_idle_${this.facing}`, true);
      return;
    }
    if (Math.abs(dx) >= Math.abs(dy)) {
      this.facing = dx < 0 ? 'left' : 'right';
    } else {
      this.facing = dy < 0 ? 'up' : 'down';
    }
    this.player.anims.play(`mimi_walk_${this.facing}`, true);
  }

  private updateLighting() {
    const { color, alpha } = lightingAt(gameClock.getHours());
    this.lighting?.setFillStyle(color, alpha * this.lightingStrength);
    // Lamps fade in as it gets dark; indoors they always give a little glow.
    const darkness = Math.min(1, alpha / NIGHT_ALPHA);
    const strength = this.lightingStrength < 1 ? Math.max(0.35, darkness) : darkness;
    for (const light of this.lamps) light.glow.setAlpha(light.base * strength);
  }

  /** A soft round glow texture shared by every light. */
  private ensureLightTexture() {
    if (this.textures.exists('light')) return;
    const size = 64;
    const canvas = this.textures.createCanvas('light', size, size);
    if (!canvas) return;
    const ctx = canvas.getContext();
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.45)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    canvas.refresh();
  }

  /** A warm light (lamp, window, cauldron) that shows up as night falls. */
  protected addLight(x: number, y: number, radius: number, color: number = 0xffc76b, strength = 0.75) {
    const glow = this.add
      .image(x, y, 'light')
      .setDisplaySize(radius * 2, radius * 2)
      .setTint(color)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(901)
      .setAlpha(0);
    this.lamps.push({ glow, base: strength });
    // A gentle flicker.
    this.tweens.add({
      targets: glow,
      scale: glow.scale * 1.06,
      duration: 900 + Math.random() * 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** Only tell the interface when the prompt actually changes. */
  private setPrompt(interaction: Interaction | null) {
    const id = interaction ? `${interaction.id}:${interaction.text}` : null;
    if (id === this.lastPromptId) return;
    this.lastPromptId = id;
    EventBus.emit(
      'PROMPT_CHANGE',
      interaction ? { active: true, text: interaction.text, targetId: interaction.id } : { active: false }
    );
  }

  private resolveSpawn(data?: SpawnData): { x: number; y: number } {
    const x = data?.spawnX;
    const y = data?.spawnY;
    const valid =
      typeof x === 'number' &&
      typeof y === 'number' &&
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      x >= 0 &&
      x <= this.mapWidth &&
      y >= 0 &&
      y <= this.mapHeight;
    return valid ? { x, y } : this.defaultSpawn;
  }

  /** Walk through a door or off the map edge into another place. */
  protected travelTo(scene: PlayableScene, spawnX: number, spawnY: number) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.setPrompt(null);
    sounds.playDoor();
    useGameStore.getState().saveGame({ scene, x: spawnX, y: spawnY });
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(scene, { spawnX, spawnY });
    });
    this.cameras.main.fadeOut(250, ...FADE_COLOR);
  }

  // --- Helpers for building maps ---------------------------------------------

  protected distanceToPlayer(x: number, y: number): number {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
  }

  protected tile(x: number, y: number, frame: number, depth = 0): Phaser.GameObjects.Image {
    return this.add.image(x, y, 'tileset', frame).setOrigin(0, 0).setDepth(depth);
  }

  /**
   * A soft, winding dirt path through `points`, drawn on top of the grass.
   * Built from overlapping 2px-snapped blobs so its edge stays pixel-crisp
   * and slightly uneven, like a path worn by feet.
   */
  protected drawPath(points: Array<{ x: number; y: number }>, width = 26, seed = 3) {
    const rng = new Phaser.Math.RandomDataGenerator([String(seed)]);
    const g = this.add.graphics().setDepth(1);
    const stamp = (color: number, radius: number, jitter: number) => {
      g.fillStyle(color, 1);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const steps = Math.max(1, Math.ceil(Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) / 4));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const r = radius + rng.between(-jitter, jitter);
          const x = Math.round((a.x + (b.x - a.x) * t) / 2) * 2;
          const y = Math.round((a.y + (b.y - a.y) * t) / 2) * 2;
          // A chunky octagon reads as pixel art where a true circle would not.
          g.fillRect(x - r, y - r * 0.6, r * 2, r * 1.2);
          g.fillRect(x - r * 0.6, y - r, r * 1.2, r * 2);
        }
      }
    };
    stamp(0x9a7b55, width / 2 + 1, 2); // worn edge
    stamp(0xc9a874, width / 2 - 1, 2); // packed earth
    stamp(0xd8bb88, width / 2 - 6, 1); // lighter middle where most feet go

    // Little stones in the dirt
    g.fillStyle(0x8f7a62, 1);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const length = Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y);
      for (let n = 0; n < length / 10; n++) {
        const t = rng.frac();
        const x = Math.round(a.x + (b.x - a.x) * t + rng.between(-width / 3, width / 3));
        const y = Math.round(a.y + (b.y - a.y) * t + rng.between(-width / 3, width / 3));
        g.fillRect(x, y, 2, 2);
      }
    }
    return g;
  }

  /**
   * A round pond with a mossy bank and gently shimmering water, drawn as
   * pixel-snapped rings so its edge is smooth instead of tile-stepped.
   */
  protected drawPond(cx: number, cy: number, radius: number) {
    const g = this.add.graphics().setDepth(1);
    const ring = (r: number, color: number, squash = 0.82) => {
      g.fillStyle(color, 1);
      for (let y = -r * squash; y <= r * squash; y += 2) {
        const half = Math.sqrt(Math.max(0, 1 - (y / (r * squash)) ** 2)) * r;
        const w = Math.round(half / 2) * 2;
        g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 2);
      }
    };
    ring(radius + 12, 0x6f8f4e); // grassy bank
    ring(radius + 6, 0x8a7a5a); // muddy edge
    ring(radius + 2, 0x3f6f8f); // deep water
    ring(radius - 6, 0x4f86a8);
    ring(radius - 18, 0x5d97b8); // shallow middle catches the light

    // Glints that come and go on the surface
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2 + i;
      const dist = ((i * 37) % 10) / 10 * (radius - 12);
      const glint = this.add
        .rectangle(Math.round(cx + Math.cos(angle) * dist), Math.round(cy + Math.sin(angle) * dist * 0.82), 4, 1, 0xdff4ff)
        .setDepth(2)
        .setAlpha(0);
      this.tweens.add({
        targets: glint,
        alpha: { from: 0, to: 0.9 },
        duration: 700 + (i % 5) * 200,
        delay: i * 260,
        yoyo: true,
        repeat: -1,
        repeatDelay: 1200,
      });
    }
    return g;
  }

  /** Stable pseudo-random 0..99 for a map position, used to vary the ground tiles. */
  protected noiseAt(x: number, y: number): number {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) % 100;
  }

  /**
   * A standing object drawn from its base, so things further down the screen
   * are drawn in front. `footprint` is the solid area around the base.
   */
  protected prop(
    key: string,
    x: number,
    y: number,
    footprint?: { width: number; height: number },
    depth = y
  ): Phaser.GameObjects.Image {
    const image = this.add.image(Math.round(x), Math.round(y), key).setOrigin(0.5, 1).setDepth(depth);
    if (footprint) this.addWall(x, y - footprint.height / 2, footprint.width, footprint.height);
    return image;
  }

  /**
   * Sprinkle small decorations (tufts, pebbles, little flowers) over the
   * ground. Uses a fixed seed so the map looks the same every visit.
   */
  protected scatter(
    keys: string[],
    count: number,
    area: { x: number; y: number; width: number; height: number },
    avoid: (x: number, y: number) => boolean,
    seed = 1
  ) {
    const rng = new Phaser.Math.RandomDataGenerator([String(seed)]);
    let placed = 0;
    for (let attempt = 0; attempt < count * 6 && placed < count; attempt++) {
      const x = Math.round(area.x + rng.frac() * area.width);
      const y = Math.round(area.y + rng.frac() * area.height);
      if (avoid(x, y)) continue;
      this.add.image(x, y, rng.pick(keys)).setOrigin(0.5, 1).setDepth(2);
      placed++;
    }
  }

  /** An invisible solid rectangle, positioned by its centre. */
  protected addWall(x: number, y: number, width: number, height: number) {
    const zone = this.add.zone(x, y, width, height);
    this.physics.add.existing(zone, true);
    this.obstacles.add(zone);
  }

  /** Crisp in-world text. */
  protected addText(x: number, y: number, text: string, color: number = COLORS.paper, size = 8): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: this.registry.get(REGISTRY_FONT) as string,
        fontSize: `${size}px`,
        color: `#${color.toString(16).padStart(6, '0')}`,
      })
      .setResolution(TEXT_RESOLUTION)
      .setOrigin(0.5, 0.5);
  }

  /** A small wooden signboard with text, positioned by its centre. */
  protected addSign(x: number, y: number, text: string, depth = 950): Phaser.GameObjects.Container {
    const label = this.addText(0, 0, text);
    const width = Math.ceil(label.width) + 10;
    const height = 13;
    const outline = this.add.rectangle(0, 0, width + 2, height + 2, COLORS.ink);
    const board = this.add.rectangle(0, 0, width, height, COLORS.plum);
    return this.add.container(Math.round(x), Math.round(y), [outline, board, label]).setDepth(depth);
  }

  /** Text that floats up from a spot and fades, e.g. "+1 Moonflower". */
  protected floatText(x: number, y: number, text: string, color: number = COLORS.paper) {
    const label = this.addText(x, y, text, color, 10).setDepth(960).setStroke('#2a1b2e', 3);
    this.tweens.add({
      targets: label,
      y: y - 22,
      alpha: { from: 1, to: 0 },
      duration: 1100,
      ease: 'Sine.easeOut',
      onComplete: () => label.destroy(),
    });
  }
}
