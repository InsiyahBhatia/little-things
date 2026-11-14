import { Item, InventorySlot, InventoryState } from './types';

const DEFAULT_MAX_STACK = 99;

export type InventoryResult = { success: true } | { success: false; reason: string };

export class InventoryService {
  private slots: InventorySlot[];
  private readonly maxCapacity: number;

  constructor(maxCapacity = 24, initialSlots: InventorySlot[] = []) {
    this.maxCapacity = maxCapacity;
    this.slots = [];
    for (const slot of initialSlots) {
      this.addItem(slot.item, slot.quantity);
    }
  }

  /** A deep copy, safe to hand to the interface. */
  getState(): InventoryState {
    return {
      slots: this.slots.map((s) => ({ item: { ...s.item }, quantity: s.quantity })),
      maxCapacity: this.maxCapacity,
    };
  }

  /** Replace the contents with a state previously returned by `getState`. */
  restore(state: InventoryState): void {
    this.slots = state.slots.map((s) => ({ item: { ...s.item }, quantity: s.quantity }));
  }

  /** How many more of `item` fit, counting part-filled stacks and empty slots. */
  getFreeSpaceFor(item: Item): number {
    const maxStack = item.maxStack ?? DEFAULT_MAX_STACK;
    const inStacks = this.slots
      .filter((s) => s.item.id === item.id)
      .reduce((sum, s) => sum + Math.max(0, maxStack - s.quantity), 0);
    return inStacks + (this.maxCapacity - this.slots.length) * maxStack;
  }

  /** Adds all of `quantity` or nothing. */
  addItem(item: Item, quantity = 1): InventoryResult {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { success: false, reason: 'Invalid quantity' };
    }
    if (this.getFreeSpaceFor(item) < quantity) {
      return { success: false, reason: 'Inventory full' };
    }

    const maxStack = item.maxStack ?? DEFAULT_MAX_STACK;
    let remaining = quantity;

    for (const slot of this.slots) {
      if (remaining === 0) break;
      if (slot.item.id !== item.id) continue;
      const added = Math.min(remaining, maxStack - slot.quantity);
      if (added > 0) {
        slot.quantity += added;
        remaining -= added;
      }
    }

    while (remaining > 0) {
      const added = Math.min(remaining, maxStack);
      this.slots.push({ item: { ...item }, quantity: added });
      remaining -= added;
    }

    return { success: true };
  }

  /** Removes all of `quantity` or nothing. */
  removeItem(itemId: string, quantity = 1): InventoryResult {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { success: false, reason: 'Invalid quantity' };
    }
    if (this.getItemCount(itemId) < quantity) {
      return { success: false, reason: 'Insufficient quantity in inventory' };
    }

    let remaining = quantity;
    for (let i = this.slots.length - 1; i >= 0 && remaining > 0; i--) {
      const slot = this.slots[i];
      if (slot.item.id !== itemId) continue;
      if (slot.quantity <= remaining) {
        remaining -= slot.quantity;
        this.slots.splice(i, 1);
      } else {
        slot.quantity -= remaining;
        remaining = 0;
      }
    }

    return { success: true };
  }

  getItemCount(itemId: string): number {
    return this.slots.filter((s) => s.item.id === itemId).reduce((sum, s) => sum + s.quantity, 0);
  }

  hasItem(itemId: string, quantity = 1): boolean {
    return this.getItemCount(itemId) >= quantity;
  }
}
