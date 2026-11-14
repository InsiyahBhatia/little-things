import * as Phaser from 'phaser';
import { EventBus } from '../events/EventBus';
import { GameEventMap } from '../events/EventTypes';
import { COLORS, VIEW_HEIGHT, VIEW_WIDTH, fitCameraToWindow } from '../config';
import { music } from '@/lib/music';

/**
 * The animated backdrop behind the title screen. The title and menu
 * themselves are rendered by React on top of the canvas.
 */
export class TitleScene extends Phaser.Scene {
  private starting = false;

  constructor() {
    super('TitleScene');
  }

  create() {
    this.starting = false;
    const W = VIEW_WIDTH;
    const H = VIEW_HEIGHT;
    const horizon = H - 64;

    fitCameraToWindow(this, (camera) => camera.centerOn(W / 2, H / 2));
    music.play('title');

    const sky = this.add.graphics();
    sky.fillGradientStyle(COLORS.night, COLORS.night, 0x4a3458, 0x4a3458, 1);
    // Drawn well past the edges so wide windows never see the end of the world.
    sky.fillRect(-W, 0, W * 3, H);

    // Stars
    for (let i = 0; i < 90; i++) {
      const star = this.add.rectangle(
        Phaser.Math.Between(-W / 2, W * 1.5),
        Phaser.Math.Between(6, horizon - 30),
        1,
        1,
        COLORS.paper
      );
      this.tweens.add({
        targets: star,
        alpha: { from: 0.15, to: 0.95 },
        duration: Phaser.Math.Between(1400, 3600),
        delay: Phaser.Math.Between(0, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Meadow
    for (let x = -W; x < W * 2; x += 16) {
      for (let row = 0; row < 4; row++) {
        this.add.image(x, horizon + row * 16, 'tileset', row === 0 ? 1 : 0).setOrigin(0, 0);
      }
    }

    // Trees, swaying slightly
    [
      { x: 44, key: 'tree_wisteria' },
      { x: 128, key: 'tree_blossom' },
      { x: 366, key: 'tree_willow' },
      { x: 442, key: 'tree_blossom' },
    ].forEach((tree, i) => {
      const image = this.add.image(tree.x, horizon + 10, tree.key).setOrigin(0.5, 1);
      this.tweens.add({
        targets: image,
        scaleX: 1.02,
        duration: 2200 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    // Some of the village's regulars, gathered either side of the menu
    [
      { key: 'customer_fox', x: 150 },
      { key: 'customer_bunny', x: 176 },
      { key: 'pickles', x: 314 },
      { key: 'customer_frog', x: 338 },
    ].forEach(({ key, x }, i) => {
      const villager = this.add.image(x, horizon + 28, key).setOrigin(0.5, 1);
      // Each one hops now and then, out of step with the others.
      this.tweens.add({
        targets: villager,
        y: horizon + 24,
        duration: 220,
        yoyo: true,
        repeat: -1,
        repeatDelay: 2600 + i * 700,
        delay: i * 900,
        ease: 'Quad.easeOut',
      });
    });

    const pip = this.add.image(W + 20, 46, 'pip').setAlpha(0.9);
    this.tweens.add({ targets: pip, x: -20, duration: 16000, repeat: -1 });
    this.tweens.add({ targets: pip, y: 58, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // Fireflies
    for (let i = 0; i < 14; i++) {
      const x = Phaser.Math.Between(20, W - 20);
      const y = Phaser.Math.Between(horizon - 30, H - 10);
      const firefly = this.add.rectangle(x, y, 1, 1, COLORS.honey);
      this.tweens.add({
        targets: firefly,
        x: x + Phaser.Math.Between(-18, 18),
        y: y + Phaser.Math.Between(-12, 12),
        alpha: { from: 0.1, to: 1 },
        duration: Phaser.Math.Between(2000, 3800),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    this.cameras.main.fadeIn(600, 27, 20, 36);

    const off = EventBus.on('START_GAME', (payload) => this.startGame(payload));
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    EventBus.emit('TITLE_READY');
  }

  private startGame({ scene, spawnX, spawnY }: GameEventMap['START_GAME']) {
    if (this.starting) return;
    this.starting = true;
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(scene, { spawnX, spawnY });
    });
    this.cameras.main.fadeOut(400, 27, 20, 36);
  }
}
