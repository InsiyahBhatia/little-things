import { Recipe } from './types';
import { InventoryService } from '../inventory/InventoryService';
import type { Item } from '../inventory/types';

/** Most ingredients that fit in the cauldron at once. */
export const CAULDRON_SLOTS = 3;

export type BrewResult =
  | { outcome: 'potion'; recipe: Recipe; item: Item }
  /** The ingredients do not make anything. Nothing is used up. */
  | { outcome: 'fizzle' }
  /** The potion would not fit in the bag. Nothing is used up. */
  | { outcome: 'full' }
  /** The bag does not hold the ingredients that were put in. */
  | { outcome: 'missing' };

/** Sorted ingredient ids, so ingredient order never matters. */
function signature(itemIds: string[]): string {
  return [...itemIds].sort().join('+');
}

/**
 * Brewing works by experiment: put up to three ingredients in the cauldron
 * and stir. If they match a recipe exactly, out comes the potion.
 */
export class CraftingService {
  private readonly recipes: Recipe[];
  private readonly bySignature: Map<string, Recipe>;

  constructor(recipes: Recipe[] = []) {
    this.recipes = [...recipes];
    this.bySignature = new Map();
    for (const recipe of recipes) {
      const ids = recipe.ingredients.flatMap((ing) => Array<string>(ing.quantity).fill(ing.itemId));
      this.bySignature.set(signature(ids), recipe);
    }
  }

  getRecipes(): Recipe[] {
    return [...this.recipes];
  }

  /** The recipe made by exactly these ingredients, if any. */
  findRecipe(itemIds: string[]): Recipe | null {
    if (itemIds.length === 0 || itemIds.length > CAULDRON_SLOTS) return null;
    return this.bySignature.get(signature(itemIds)) ?? null;
  }

  /** Whether the bag holds every ingredient in `itemIds` (counting repeats). */
  hasIngredients(itemIds: string[], inventory: InventoryService): boolean {
    const needed = new Map<string, number>();
    for (const id of itemIds) needed.set(id, (needed.get(id) ?? 0) + 1);
    for (const [id, count] of needed) {
      if (inventory.getItemCount(id) < count) return false;
    }
    return true;
  }

  /**
   * Stir the cauldron. Ingredients are only used up when a potion is made,
   * so a failed experiment costs nothing.
   */
  brew(itemIds: string[], inventory: InventoryService): BrewResult {
    if (!this.hasIngredients(itemIds, inventory)) return { outcome: 'missing' };
    const recipe = this.findRecipe(itemIds);
    if (!recipe) return { outcome: 'fizzle' };

    const before = inventory.getState();
    for (const id of itemIds) inventory.removeItem(id, 1);
    if (!inventory.addItem(recipe.resultItem, recipe.resultQuantity).success) {
      inventory.restore(before);
      return { outcome: 'full' };
    }
    return { outcome: 'potion', recipe, item: recipe.resultItem };
  }
}
