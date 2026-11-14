export interface Item {
  id: string;
  name: string;
  category: 'flower' | 'potion' | 'ingredient' | 'decor';
  price: number;
  stardust: number;
  desc: string;
  icon: string;
  maxStack?: number;
  /** Potions only: the reputation level at which customers start asking for it. */
  tier?: number;
}

export interface InventorySlot {
  item: Item;
  quantity: number;
}

export interface InventoryState {
  slots: InventorySlot[];
  maxCapacity: number;
}
