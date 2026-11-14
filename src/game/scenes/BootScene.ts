import * as Phaser from 'phaser';
import { assetUrl } from '@/lib/assets';
import { EventBus } from '../events/EventBus';
import { CUSTOMERS } from '@/domain/customer/CustomerService';
import { SPRITE_FILES } from '../data/sprites';
import { GAME_ITEMS } from '../data/items';
import { COLORS, VIEW_HEIGHT, VIEW_WIDTH, fitCameraToWindow } from '../config';

const IMAGES: Record<string, string> = {
  // Scenery, furniture, decorations, ingredients and potion art
  ...SPRITE_FILES,

  // Village characters
  pickles: 'characters/pickles.png',
  pip: 'characters/pip.png',
  willow_deer: 'characters/willow_deer.png',

  // Customers
  ...Object.fromEntries(CUSTOMERS.map((c) => [`customer_${c.id}`, `customers/customer_${c.id}.png`])),

  // Every item keyed by its id, so the world can show a potion or plant by id
  ...Object.fromEntries(Object.values(GAME_ITEMS).map((item) => [item.id, item.icon])),
};

const SPRITESHEETS: Record<string, { file: string; frameWidth: number; frameHeight: number }> = {
  mimi_walk: { file: 'characters/mimi_walk_sheet.png', frameWidth: 32, frameHeight: 48 },
  tileset: { file: 'tiles/tileset_mallowmere.png', frameWidth: 16, frameHeight: 16 },
};

/** Downloads every game asset, showing a progress bar, then opens the title. */
export class BootScene extends Phaser.Scene {
  private failedFiles: string[] = [];

  constructor() {
    super('BootScene');
  }

  preload() {
    this.failedFiles = [];
    fitCameraToWindow(this, (camera) => camera.centerOn(VIEW_WIDTH / 2, VIEW_HEIGHT / 2));

    const barWidth = 160;
    const barX = (VIEW_WIDTH - barWidth) / 2;
    const barY = VIEW_HEIGHT / 2;
    this.add.rectangle(barX - 2, barY - 2, barWidth + 4, 10, COLORS.paper).setOrigin(0, 0);
    this.add.rectangle(barX - 1, barY - 1, barWidth + 2, 8, COLORS.night).setOrigin(0, 0);
    const fill = this.add.rectangle(barX, barY, 0, 6, COLORS.honey).setOrigin(0, 0);

    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      fill.width = Math.round(barWidth * progress);
    });
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.failedFiles.push(file.key);
    });

    this.load.setPath(assetUrl('approved/'));
    for (const [key, file] of Object.entries(IMAGES)) {
      this.load.image(key, file);
    }
    for (const [key, sheet] of Object.entries(SPRITESHEETS)) {
      this.load.spritesheet(key, sheet.file, { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight });
    }
  }

  create() {
    if (this.failedFiles.length > 0) {
      // Without its art the game cannot run; let the interface explain.
      console.error('[Boot] failed to load:', this.failedFiles.join(', '));
      EventBus.emit('BOOT_ERROR', { file: this.failedFiles[0] });
      return;
    }

    const directions = ['down', 'right', 'up', 'left'] as const;
    directions.forEach((direction, row) => {
      const first = row * 4;
      if (!this.anims.exists(`mimi_walk_${direction}`)) {
        this.anims.create({
          key: `mimi_walk_${direction}`,
          frames: this.anims.generateFrameNumbers('mimi_walk', { start: first, end: first + 3 }),
          frameRate: 6,
          repeat: -1,
        });
        this.anims.create({
          key: `mimi_idle_${direction}`,
          frames: [{ key: 'mimi_walk', frame: first }],
          frameRate: 1,
        });
      }
    });

    this.scene.start('TitleScene');
  }
}
