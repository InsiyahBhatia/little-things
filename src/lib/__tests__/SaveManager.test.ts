import { describe, expect, it } from 'vitest';
import { parseSave, SAVE_VERSION } from '../SaveManager';

const validV2 = {
  version: 2,
  timestamp: 1,
  currencies: { petals: 120, stardust: 3 },
  inventory: [{ itemId: 'flower_moonflower', quantity: 4 }],
  placedDecor: ['decor_fairy_lantern'],
  scene: 'PotionShopScene',
  playerX: 200,
  playerY: 180,
  day: 4,
  dayProgress: 0.6,
  totalPetalsEarned: 300,
  customerQueueIndex: 7,
  knownRecipes: ['craft_dream_potion'],
};

describe('parseSave', () => {
  it('accepts a current save unchanged', () => {
    expect(parseSave(validV2)).toEqual(validV2);
  });

  it('migrates a version 1 save', () => {
    const v1 = {
      version: 1,
      timestamp: 5,
      currencies: { petals: 80, stardust: 1 },
      inventorySlots: [{ itemId: 'potion_dream', quantity: 2 }, null],
      placedDecor: ['decor_fairy_lantern', 'decor_fairy_lantern'],
      currentScene: 'EnchantedForestScene',
      playerX: 264,
      playerY: 220,
      dayCounter: 3,
      totalPetalsEarned: 80,
      reputationXP: 10,
    };
    const save = parseSave(v1)!;
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.inventory).toEqual([{ itemId: 'potion_dream', quantity: 2 }]);
    expect(save.placedDecor).toEqual(['decor_fairy_lantern']);
    expect(save.scene).toBe('EnchantedForestScene');
    expect(save.day).toBe(3);
    // v1 positions were unreliable, so the scene's spawn point is used.
    expect(save.playerX).toBeNull();
  });

  it('rejects things that are not saves', () => {
    expect(parseSave(null)).toBeNull();
    expect(parseSave('hello')).toBeNull();
    expect(parseSave([])).toBeNull();
    expect(parseSave({ version: 99 })).toBeNull();
  });

  it('repairs corrupted fields instead of crashing', () => {
    const save = parseSave({
      ...validV2,
      currencies: { petals: -50, stardust: 'lots' },
      inventory: [{ itemId: 5 }, { itemId: 'x', quantity: Infinity }, 'junk', { itemId: 'y', quantity: 2.7 }],
      scene: 'MainMenuScene',
      day: 0,
      dayProgress: 7,
    })!;
    expect(save.currencies).toEqual({ petals: 0, stardust: 0 });
    expect(save.inventory).toEqual([{ itemId: 'y', quantity: 2 }]);
    expect(save.scene).toBe('CottageGardenScene');
    expect(save.playerX).toBeNull();
    expect(save.day).toBe(1);
    expect(save.dayProgress).toBeLessThan(1);
  });
});
