import type { Item } from '@/domain/inventory/types';
import type { Recipe } from '@/domain/crafting/types';

function ingredient(id: string, name: string, price: number, desc: string, icon = `flowers/${id}.png`): Item {
  return { id, name, category: 'flower', price, stardust: 0, desc, icon };
}

/**
 * `tier` is the reputation level at which customers start asking for it.
 * `price` is what a customer pays.
 */
function potion(id: string, name: string, tier: number, price: number, desc: string, icon = `items/${id}.png`): Item {
  return { id, name, category: 'potion', tier, price, stardust: 0, desc, icon };
}

function decor(id: string, name: string, price: number, desc: string): Item {
  return { id, name, category: 'decor', price, stardust: 0, desc, icon: `decor/${id}.png` };
}

/** Every item in the game, keyed by id. `icon` is a path under assets/approved. */
export const GAME_ITEMS: Record<string, Item> = {
  // Garden ingredients
  flower_moonflower: ingredient('flower_moonflower', 'Moonflower', 10, 'Velvety purple petals that only open under the moon.'),
  flower_sunberry: ingredient('flower_sunberry', 'Sunberry bloom', 12, 'Golden puffs that glow softly, like tiny suns.'),
  flower_dream_tulip: ingredient('flower_dream_tulip', 'Dream tulip', 15, 'Pink petals that whisper fairy lullabies.'),
  flower_whisper_fern: ingredient('flower_whisper_fern', 'Whisper bell', 10, 'Blue bells that ring too quietly for anyone but fairies to hear.'),
  herb_lavender: ingredient('herb_lavender', 'Lavender sprig', 10, 'Smells like clean sheets and quiet afternoons.'),

  // Forest ingredients
  flower_glowcap: ingredient('flower_glowcap', 'Glowcap mushroom', 16, 'A forest mushroom that shines blue in the dark.'),
  forage_toadstool: ingredient('forage_toadstool', 'Toadstool', 14, 'Spotty, bouncy and loved by frogs. Do not eat it raw.'),
  forage_berries: ingredient('forage_berries', 'Wild berries', 12, 'Sweet red berries from the forest brambles.'),
  forage_star_crystal: ingredient('forage_star_crystal', 'Star crystal', 30, 'A rare pink crystal that fell from the night sky.'),

  // Potions
  potion_dream: potion('potion_dream', 'Dream blossom potion', 1, 30, 'A sweet, floral potion that brings calm and good dreams.'),
  potion_moonberry: potion('potion_moonberry', 'Moonberry jam', 1, 30, 'A rich, velvety preserve loved by foxes, gnomes and witches.'),
  potion_lavender_tea: potion('potion_lavender_tea', 'Lavender tea', 1, 30, 'A calming brew for nervous nerves and busy minds.'),
  potion_berry_jam: potion('potion_berry_jam', 'Wild berry jam', 1, 32, 'Spread it on toast, or eat it straight from the jar.'),
  potion_sunny: potion('potion_sunny', 'Sunny energy tonic', 1, 35, 'A fizzy golden tonic that fills anyone with joyful vigour.'),
  potion_glow: potion('potion_glow', 'Glow mist potion', 2, 45, 'A shimmering brew that sparkles like fireflies at dusk.'),
  potion_toadstool: potion('potion_toadstool', 'Toadstool tonic', 2, 45, 'One sip and you can jump as high as a frog.'),
  potion_cloud: potion('potion_cloud', 'Cloud in a jar', 2, 50, 'A little rain cloud for gardens that need a drink.'),
  potion_love: potion('potion_love', 'Love potion', 3, 60, 'Makes your heart flutter like a moth near a lantern.'),
  potion_starlight: potion('potion_starlight', 'Starlight elixir', 3, 65, 'A rare potion holding the warmth of fallen shooting stars.'),
  potion_ember: potion('potion_ember', 'Ember jar', 3, 65, 'Keeps paws and toes toasty all winter long.'),
  potion_frost: potion('potion_frost', 'Frost jar', 4, 80, 'A pinch of winter for the hottest summer day.'),
  potion_rainbow: potion('potion_rainbow', 'Rainbow elixir', 4, 95, 'Every sip tastes like a different colour.'),
  potion_fairy_dust: potion('potion_fairy_dust', 'Fairy dust', 5, 110, 'Sprinkle a little and float off the ground for a moment.'),

  // Decorations, bought with coins and placed in the shop
  decor_rose_barrel: decor('decor_rose_barrel', 'Rose barrel', 40, 'A little barrel of roses for beside the door.'),
  decor_fairy_lantern: decor('decor_fairy_lantern', 'Fairy lantern', 50, 'A birdcage lantern lit by a friendly pixie.'),
  decor_crystal_ball: decor('decor_crystal_ball', 'Crystal ball', 65, 'A glass orb swirling with starlight mist.'),
  decor_star_globe: decor('decor_star_globe', 'Star globe', 80, 'A brass globe of the night sky that turns by itself.'),
  decor_gramophone: decor('decor_gramophone', 'Enchanted gramophone', 90, 'Plays warm, crackly tunes for your visitors.'),
  decor_magic_mirror: decor('decor_magic_mirror', 'Magic mirror', 120, 'It only ever says nice things about your hat.'),
};

/** Decorations offered in the decor catalogue, cheapest first. */
export const DECOR_CATALOG: Item[] = Object.values(GAME_ITEMS)
  .filter((item) => item.category === 'decor')
  .sort((a, b) => a.price - b.price);

/** The first five recipes keep the ids that existing saves already record. */
const ORIGINAL_RECIPE_IDS: Record<string, string> = {
  potion_dream: 'craft_dream_potion',
  potion_moonberry: 'craft_moonberry_jam',
  potion_sunny: 'craft_sunny_tonic',
  potion_glow: 'craft_glow_potion',
  potion_starlight: 'craft_starlight_elixir',
};

function recipe(potionId: string, ingredients: string[], knownAtStart: boolean, hint: string): Recipe {
  const counts = new Map<string, number>();
  for (const id of ingredients) counts.set(id, (counts.get(id) ?? 0) + 1);
  const item = GAME_ITEMS[potionId];
  return {
    id: ORIGINAL_RECIPE_IDS[potionId] ?? `craft_${potionId.replace(/^potion_/, '')}`,
    name: item.name,
    resultItem: item,
    resultQuantity: 1,
    ingredients: Array.from(counts, ([itemId, quantity]) => ({ itemId, quantity })),
    knownAtStart,
    hint,
  };
}

/**
 * Recipes, in the order they appear in the recipe book. No two share the
 * same ingredients, and ingredient order never matters.
 */
export const RECIPES: Recipe[] = [
  recipe('potion_dream', ['flower_dream_tulip', 'flower_moonflower'], true,
    'A dream tulip and a moonflower, stirred together, bring the sweetest sleep.'),
  recipe('potion_moonberry', ['flower_moonflower', 'flower_moonflower'], true,
    'Two moonflowers and nothing else. Simple things are often the sweetest.'),
  recipe('potion_lavender_tea', ['herb_lavender', 'herb_lavender'], true,
    'Two sprigs of lavender make a cup of calm.'),
  recipe('potion_berry_jam', ['forage_berries', 'forage_berries'], false,
    'Two handfuls of wild berries from the forest, and you have jam.'),
  recipe('potion_sunny', ['flower_sunberry', 'flower_whisper_fern'], false,
    'Sunshine needs a whisper to wake it: a sunberry bloom with a whisper bell.'),
  recipe('potion_glow', ['flower_glowcap', 'flower_moonflower'], false,
    'Light from below and light from above: a glowcap mushroom from the forest and a moonflower.'),
  recipe('potion_toadstool', ['forage_toadstool', 'flower_whisper_fern'], false,
    'A toadstool for the bounce and a whisper bell to make it land softly.'),
  recipe('potion_cloud', ['flower_whisper_fern', 'flower_whisper_fern', 'herb_lavender'], false,
    'Two whisper bells and a sprig of lavender, light as the sky.'),
  recipe('potion_love', ['flower_dream_tulip', 'flower_dream_tulip', 'flower_sunberry'], false,
    'Two dream tulips and a sunberry bloom, for a warm and silly heart.'),
  recipe('potion_starlight', ['flower_sunberry', 'flower_dream_tulip', 'flower_glowcap'], false,
    'Starlight takes three: a sunberry bloom, a dream tulip and a glowcap mushroom from the forest.'),
  recipe('potion_ember', ['forage_toadstool', 'flower_sunberry', 'forage_berries'], false,
    'Something spotty, something sunny and something red: a toadstool, a sunberry bloom and wild berries.'),
  recipe('potion_frost', ['forage_star_crystal', 'flower_whisper_fern'], false,
    'A cold star crystal and a whisper bell to carry the chill.'),
  recipe('potion_rainbow', ['forage_star_crystal', 'herb_lavender', 'flower_sunberry'], false,
    'A star crystal splits the light, with lavender for purple and a sunberry bloom for gold.'),
  recipe('potion_fairy_dust', ['forage_star_crystal', 'flower_glowcap', 'flower_dream_tulip'], false,
    'The rarest brew: a star crystal, a glowcap and a dream tulip, ground fine.'),
];

/** What a brand-new game starts with. */
export const STARTING_STATE = {
  petals: 45,
  stardust: 1,
  inventory: [
    { itemId: 'flower_moonflower', quantity: 2 },
    { itemId: 'herb_lavender', quantity: 2 },
    { itemId: 'potion_dream', quantity: 1 },
  ],
  placedDecor: ['decor_fairy_lantern'],
  inventoryCapacity: 24,
} as const;
