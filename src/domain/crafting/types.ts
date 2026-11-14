import { Item } from '../inventory/types';

export interface IngredientRequirement {
  itemId: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  resultItem: Item;
  resultQuantity: number;
  ingredients: IngredientRequirement[];
  stardustCost?: number;
  /** Known from the start; others are discovered by experimenting. */
  knownAtStart: boolean;
  /** A riddle that points at the ingredients, for recipes not yet discovered. */
  hint: string;
}

export interface CraftingValidationResult {
  canCraft: boolean;
  missingIngredients?: { itemId: string; required: number; available: number }[];
  reason?: string;
}
