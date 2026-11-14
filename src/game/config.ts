import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { CottageGardenScene } from './scenes/CottageGardenScene';
import { PotionShopScene } from './scenes/PotionShopScene';
import { EnchantedForestScene } from './scenes/EnchantedForestScene';

/** The world is authored on a 480x270 grid of 16px tiles. */
export const VIEW_WIDTH = 480;
export const VIEW_HEIGHT = 270;

/** Text is rasterised at this multiple so it stays sharp when the camera zooms in. */
export const TEXT_RESOLUTION = 4;

/** Narrowest slice of the world that should stay visible, for portrait phones. */
const MIN_VISIBLE_WIDTH = 320;

/**
 * The canvas always fills the window. Cameras zoom so that about
 * VIEW_HEIGHT world pixels are visible top to bottom; wider windows see more
 * to the sides. On tall, narrow screens the zoom is capped so at least
 * MIN_VISIBLE_WIDTH pixels stay visible across.
 */
export function fitZoom(viewportWidth: number, viewportHeight: number): number {
  return Math.max(1, Math.min(viewportHeight / VIEW_HEIGHT, viewportWidth / MIN_VISIBLE_WIDTH));
}

/**
 * Zoom the scene's main camera to fit the window now and whenever the window
 * changes size. `onFit` runs after each change, e.g. to re-centre the camera.
 */
export function fitCameraToWindow(scene: Phaser.Scene, onFit?: (camera: Phaser.Cameras.Scene2D.Camera) => void): void {
  const apply = () => {
    const camera = scene.cameras.main;
    camera.setZoom(fitZoom(scene.scale.width, scene.scale.height));
    onFit?.(camera);
  };
  apply();
  scene.scale.on(Phaser.Scale.Events.RESIZE, apply);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.scale.off(Phaser.Scale.Events.RESIZE, apply));
}

export const COLORS = {
  night: 0x1b1424,
  plum: 0x3a2a47,
  ink: 0x2a1b2e,
  paper: 0xf4e6c8,
  honey: 0xe8b341,
  rose: 0xc9647f,
  mist: 0xb9a8c9,
} as const;

/** Registry key holding the CSS font-family used for in-world text. */
export const REGISTRY_FONT = 'fontFamily';

export const createGameConfig = (parent: HTMLElement, fontFamily: string): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  parent,
  width: '100%',
  height: '100%',
  pixelArt: true,
  render: {
    antialias: false,
    pixelArt: true,
    roundPixels: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
  },
  // The React interface sits on top of the canvas and owns the mouse.
  input: { mouse: false, touch: false, gamepad: false },
  audio: { noAudio: true },
  banner: false,
  backgroundColor: '#1b1424',
  callbacks: {
    preBoot: (game) => {
      game.registry.set(REGISTRY_FONT, fontFamily);
    },
  },
  scene: [BootScene, TitleScene, CottageGardenScene, PotionShopScene, EnchantedForestScene],
});
