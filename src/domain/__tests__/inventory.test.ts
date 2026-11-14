import { describe, expect, it } from 'vitest';
import { InventoryService } from '../inventory/InventoryService';
import type { Item } from '../inventory/types';

const flower: Item = { id: 'f', name: 'Flower', category: 'flower', price: 1, stardust: 0, desc: '', icon: '' };
const small: Item = { ...flower, id: 's', maxStack: 3 };

describe('InventoryService', () => {
  it('stacks the same item into one slot', () => {
    const inv = new InventoryService(4);
    inv.addItem(flower, 2);
    inv.addItem(flower, 3);
    expect(inv.getState().slots).toHaveLength(1);
    expect(inv.getItemCount('f')).toBe(5);
  });

  it('splits across slots when a stack is full', () => {
    const inv = new InventoryService(4);
    inv.addItem(small, 7);
    expect(inv.getState().slots.map((s) => s.quantity)).toEqual([3, 3, 1]);
  });

  it('adds nothing when the whole amount does not fit', () => {
    const inv = new InventoryService(1);
    inv.addItem(small, 2);
    const result = inv.addItem(small, 2);
    expect(result.success).toBe(false);
    expect(inv.getItemCount('s')).toBe(2);
  });

  it('removes nothing when there is not enough', () => {
    const inv = new InventoryService(4, [{ item: flower, quantity: 2 }]);
    expect(inv.removeItem('f', 3).success).toBe(false);
    expect(inv.getItemCount('f')).toBe(2);
  });

  it('rejects zero, negative and fractional quantities', () => {
    const inv = new InventoryService(4);
    expect(inv.addItem(flower, 0).success).toBe(false);
    expect(inv.addItem(flower, -1).success).toBe(false);
    expect(inv.addItem(flower, 1.5).success).toBe(false);
  });

  it('frees the slot when a stack is used up', () => {
    const inv = new InventoryService(4, [{ item: flower, quantity: 2 }]);
    inv.removeItem('f', 2);
    expect(inv.getState().slots).toHaveLength(0);
  });

  it('hands out copies that cannot change the inventory', () => {
    const inv = new InventoryService(4, [{ item: flower, quantity: 2 }]);
    inv.getState().slots[0].quantity = 99;
    expect(inv.getItemCount('f')).toBe(2);
  });
});
