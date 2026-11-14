import { describe, expect, it } from 'vitest';
import { InventoryService } from '../inventory/InventoryService';
import { CraftingService } from '../crafting/CraftingService';
import { EconomyService } from '../economy/EconomyService';
import { CustomerService, CUSTOMERS, customerAt, visitorAt } from '../customer/CustomerService';
import { ProgressionService } from '../progression/ProgressionService';
import { GAME_ITEMS, RECIPES } from '@/game/data/items';

describe('CraftingService', () => {
  const crafting = new CraftingService(RECIPES);
  const bag = (...stacks: Array<[string, number]>) =>
    new InventoryService(24, stacks.map(([id, quantity]) => ({ item: GAME_ITEMS[id], quantity })));

  it('makes a potion when the mix matches a recipe, in any order', () => {
    const inv = bag(['flower_dream_tulip', 1], ['flower_moonflower', 1]);
    const result = crafting.brew(['flower_moonflower', 'flower_dream_tulip'], inv);
    expect(result.outcome).toBe('potion');
    expect(inv.getItemCount('potion_dream')).toBe(1);
    expect(inv.getItemCount('flower_moonflower')).toBe(0);
  });

  it('counts repeated ingredients', () => {
    expect(crafting.findRecipe(['flower_moonflower', 'flower_moonflower'])?.id).toBe('craft_moonberry_jam');
    expect(crafting.findRecipe(['flower_moonflower'])).toBeNull();
  });

  it('fizzles on a wrong mix without using anything up', () => {
    const inv = bag(['flower_sunberry', 2]);
    expect(crafting.brew(['flower_sunberry', 'flower_sunberry'], inv).outcome).toBe('fizzle');
    expect(inv.getItemCount('flower_sunberry')).toBe(2);
  });

  it('refuses ingredients that are not in the bag', () => {
    const inv = bag(['flower_moonflower', 1]);
    expect(crafting.brew(['flower_moonflower', 'flower_moonflower'], inv).outcome).toBe('missing');
  });

  it('keeps the ingredients when the potion does not fit in the bag', () => {
    // One slot holding a full stack: using two moonflowers frees no slot.
    const inv = new InventoryService(1, [{ item: { ...GAME_ITEMS.flower_moonflower, maxStack: 5 }, quantity: 5 }]);
    expect(crafting.brew(['flower_moonflower', 'flower_moonflower'], inv).outcome).toBe('full');
    expect(inv.getItemCount('flower_moonflower')).toBe(5);
  });

  it('has no two recipes with the same ingredients', () => {
    const signatures = RECIPES.map((r) =>
      r.ingredients.flatMap((i) => Array(i.quantity).fill(i.itemId)).sort().join('+')
    );
    expect(new Set(signatures).size).toBe(RECIPES.length);
  });

  it('every recipe uses items that exist and has a hint', () => {
    for (const recipe of RECIPES) {
      expect(recipe.hint.length).toBeGreaterThan(10);
      for (const ing of recipe.ingredients) expect(GAME_ITEMS[ing.itemId]).toBeDefined();
    }
  });
});

describe('EconomyService', () => {
  it('refuses to overspend', () => {
    const eco = new EconomyService(10, 0);
    expect(eco.spend(11).success).toBe(false);
    expect(eco.getCurrencies().petals).toBe(10);
  });

  it('refuses negative amounts', () => {
    const eco = new EconomyService(10, 0);
    expect(eco.earn(-5).success).toBe(false);
    expect(eco.spend(-5).success).toBe(false);
  });
});

describe('CustomerService', () => {
  const tierOf = (id: string) => GAME_ITEMS[id].tier ?? 1;

  it('brings every villager once per round, in a shuffled order', () => {
    const round = Array.from({ length: CUSTOMERS.length }, (_, i) => visitorAt(i).id);
    expect(new Set(round).size).toBe(CUSTOMERS.length);
  });

  it('never sends the same villager twice in a row', () => {
    for (let i = 1; i < CUSTOMERS.length * 20; i++) {
      expect(visitorAt(i).id).not.toBe(visitorAt(i - 1).id);
    }
  });

  it('is the same visit every time, so it can be saved', () => {
    expect(customerAt(37, 3, GAME_ITEMS)).toEqual(customerAt(37, 3, GAME_ITEMS));
  });

  it('only asks for potions the shop is famous enough for', () => {
    for (let level = 1; level <= 5; level++) {
      for (let i = 0; i < 200; i++) {
        expect(tierOf(customerAt(i, level, GAME_ITEMS).desiredItemId)).toBeLessThanOrEqual(level);
      }
    }
  });

  it('asks for more kinds of potion as reputation grows', () => {
    const kinds = (level: number) =>
      new Set(Array.from({ length: 300 }, (_, i) => customerAt(i, level, GAME_ITEMS).desiredItemId)).size;
    expect(kinds(5)).toBeGreaterThan(kinds(1));
  });

  it('pays the price of the potion and asks for it by name', () => {
    const visit = customerAt(3, 5, GAME_ITEMS);
    const potion = GAME_ITEMS[visit.desiredItemId];
    expect(visit.paymentCoins).toBe(potion.price);
    expect(visit.quote.toLowerCase()).toContain(potion.name.toLowerCase());
  });

  it('every villager has a first-tier favourite and only wants brewable potions', () => {
    const brewable = new Set(RECIPES.map((r) => r.resultItem.id));
    for (const villager of CUSTOMERS) {
      expect(villager.wants.some((id) => tierOf(id) === 1)).toBe(true);
      for (const id of villager.wants) expect(brewable.has(id)).toBe(true);
    }
  });

  it('every potion is wanted by someone', () => {
    const wanted = new Set(CUSTOMERS.flatMap((c) => c.wants));
    for (const recipe of RECIPES) expect(wanted.has(recipe.resultItem.id)).toBe(true);
  });

  it('resumes with the same customer at the counter', () => {
    const service = new CustomerService(0, GAME_ITEMS);
    service.spawnNextCustomer();
    const current = service.getActiveCustomer()!;
    expect(new CustomerService(service.getResumeIndex(), GAME_ITEMS).getActiveCustomer()).toEqual(current);
  });

  it('resumes with the next customer when the counter is empty', () => {
    const service = new CustomerService(0, GAME_ITEMS);
    service.dismissCustomer();
    expect(new CustomerService(service.getResumeIndex(), GAME_ITEMS).getActiveCustomer()!.id).toBe(visitorAt(1).id);
  });
});

describe('ProgressionService', () => {
  it('levels up when crossing a tier', () => {
    const progression = new ProgressionService(90);
    expect(progression.recordPetalsEarned(5).leveledUp).toBe(false);
    const result = progression.recordPetalsEarned(10);
    expect(result.leveledUp).toBe(true);
    expect(progression.getSnapshot().level).toBe(2);
  });

  it('reports no next tier at the top', () => {
    expect(new ProgressionService(100_000).getSnapshot().nextTierAt).toBeNull();
  });
});
