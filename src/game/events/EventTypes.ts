import type { PlayableScene } from '@/lib/SaveManager';
import type { ClockSnapshot } from '@/game/systems/GameClock';

export interface InteractionPromptPayload {
  active: boolean;
  /** What pressing the interact key will do, e.g. "Pick moonflower". */
  text?: string;
  targetId?: string;
}

export interface DialoguePayload {
  speakerName: string;
  /** Image path under `public/assets`. */
  avatar: string;
  text: string;
  /** Label for the button that closes the dialogue. */
  closeLabel?: string;
}

/** Events passed between the Phaser game and the React interface. */
export type GameEventMap = {
  SCENE_LOADED: { sceneKey: string; locationName: string };
  PROMPT_CHANGE: InteractionPromptPayload;
  OPEN_DIALOGUE: DialoguePayload;
  OPEN_CRAFTING: void;
  TIME_TICK: ClockSnapshot;
  /** Leave the title screen and enter the world. */
  START_GAME: { scene: PlayableScene; spawnX: number | null; spawnY: number | null };
  RETURN_TO_TITLE: void;
  /** Everything is loaded and the title scene is running, so a game can start. */
  TITLE_READY: void;
  /** A game file failed to download during boot. */
  BOOT_ERROR: { file: string };
};
