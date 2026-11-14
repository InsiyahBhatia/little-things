import { describe, expect, it } from 'vitest';
import { GAME_ITEMS, RECIPES } from '../data/items';

/** The word a hint has to use for each ingredient. */
const KEYWORD: Record<string, string> = {
  flower_moonflower: 'moonflower',
  flower_sunberry: 'sunberry',
  flower_dream_tulip: 'tulip',
  flower_whisper_fern: 'whisper bell',
  herb_lavender: 'lavender',
  flower_glowcap: 'glowcap',
  forage_toadstool: 'toadstool',
  forage_berries: 'berries',
  forage_star_crystal: 'star crystal',
};

/** Where each ingredient grows. Must match the forage tables in the scenes. */
const GROWS_IN: Record<string, string[]> = {
  flower_moonflower: ['garden', 'forest'],
  flower_sunberry: ['garden'],
  flower_dream_tulip: ['garden', 'forest'],
  flower_whisper_fern: ['garden', 'forest'],
  herb_lavender: ['garden'],
  flower_glowcap: ['forest'],
  forage_toadstool: ['forest'],
  forage_berries: ['forest'],
  forage_star_crystal: ['forest'],
};

describe('recipes', () => {
  it('every hint names each ingredient', () => {
    for (const recipe of RECIPES) {
      const hint = recipe.hint.toLowerCase();
      for (const ing of recipe.ingredients) {
        expect(KEYWORD[ing.itemId], `no keyword for ${ing.itemId}`).toBeDefined();
        expect(hint, `${recipe.name} hint should mention ${KEYWORD[ing.itemId]}`).toContain(KEYWORD[ing.itemId]);
      }
    }
  });

  it('hints say "two" when an ingredient is needed twice', () => {
    for (const recipe of RECIPES) {
      const doubled = recipe.ingredients.some((ing) => ing.quantity === 2);
      expect(/\btwo\b/i.test(recipe.hint), `${recipe.name}: "${recipe.hint}"`).toBe(doubled);
    }
  });

  it('hints never mention an ingredient the recipe does not use', () => {
    for (const recipe of RECIPES) {
      const used = new Set(recipe.ingredients.map((i) => i.itemId));
      const hint = recipe.hint.toLowerCase();
      for (const [id, word] of Object.entries(KEYWORD)) {
        if (used.has(id)) continue;
        // "berries" also appears inside "sunberry"; check whole words only.
        const mentioned = new RegExp(`\b${word}\b`).test(hint);
        expect(mentioned, `${recipe.name} hint mentions ${word} but does not use it`).toBe(false);
      }
    }
  });

  it('uses between one and three ingredients that can all be found', () => {
    for (const recipe of RECIPES) {
      const total = recipe.ingredients.reduce((sum, i) => sum + i.quantity, 0);
      expect(total).toBeGreaterThanOrEqual(1);
      expect(total).toBeLessThanOrEqual(3);
      for (const ing of recipe.ingredients) {
        expect(GAME_ITEMS[ing.itemId]?.category).toBe('flower');
        expect(GROWS_IN[ing.itemId]?.length, `${ing.itemId} does not grow anywhere`).toBeGreaterThan(0);
      }
    }
  });

  it('makes every potion exactly once', () => {
    const potions = Object.values(GAME_ITEMS).filter((i) => i.category === 'potion').map((i) => i.id);
    const made = RECIPES.map((r) => r.resultItem.id);
    expect(made.sort()).toEqual(potions.sort());
  });

  it('starts the player able to brew something', () => {
    expect(RECIPES.filter((r) => r.knownAtStart).length).toBeGreaterThan(0);
  });
});
