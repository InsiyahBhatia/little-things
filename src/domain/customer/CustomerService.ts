/** A villager who visits the shop. */
export interface CustomerDefinition {
  id: string;
  name: string;
  /** Said when they reach the counter, before asking for a potion. */
  greeting: string;
  /** Said when they get what they came for. */
  thanks: string;
  /** Potions this villager likes, by item id. They only ask for ones the shop is famous enough for. */
  wants: string[];
}

/** One visit: a villager plus what they want this time. */
export interface CustomerProfile {
  id: string;
  name: string;
  /** Image path under `public/assets`. */
  avatar: string;
  spriteKey: string;
  desiredItemId: string;
  /** What they say while waiting. */
  quote: string;
  completionQuote: string;
  paymentCoins: number;
}

/** What the customer service needs to know about each potion. */
export interface PotionInfo {
  name: string;
  price: number;
  tier?: number;
}

export const CUSTOMERS: CustomerDefinition[] = [
  {
    id: 'bunny',
    name: 'Clover the bunny',
    greeting: 'Hi Mimi! I hopped all the way here.',
    thanks: 'Thank you! I will tell all my brothers and sisters. All forty of them.',
    wants: ['potion_dream', 'potion_berry_jam', 'potion_cloud', 'potion_love'],
  },
  {
    id: 'frog',
    name: 'Barnaby the frog',
    greeting: 'Ribbit! What a lovely damp morning.',
    thanks: 'Ribbit! Exquisite! Keep the change!',
    wants: ['potion_sunny', 'potion_toadstool', 'potion_cloud', 'potion_frost'],
  },
  {
    id: 'fox',
    name: 'Reynard the fox',
    greeting: 'I have heard you drive a hard bargain, little witch.',
    thanks: 'A pleasure doing business with you.',
    wants: ['potion_moonberry', 'potion_berry_jam', 'potion_love', 'potion_rainbow'],
  },
  {
    id: 'mushroom',
    name: 'Sporey the mushroom',
    greeting: 'Uhh… what did I come here for again? Oh, right.',
    thanks: 'My cap feels much better. Thank you!',
    wants: ['potion_lavender_tea', 'potion_glow', 'potion_toadstool', 'potion_fairy_dust'],
  },
  {
    id: 'bear',
    name: 'Bruno the bear',
    greeting: 'Winter is coming and I have so much to get ready.',
    thanks: 'Mmm… perfect. I feel a long nap coming on.',
    wants: ['potion_dream', 'potion_berry_jam', 'potion_lavender_tea', 'potion_ember'],
  },
  {
    id: 'ghost',
    name: 'Boo the friendly ghost',
    greeting: 'Ooooh… sorry, I did not mean to float through your wall.',
    thanks: 'Oooh, I am glowing from the inside! Here, have some ancient coins.',
    wants: ['potion_lavender_tea', 'potion_starlight', 'potion_frost', 'potion_fairy_dust'],
  },
  {
    id: 'cat',
    name: 'Smoky the cat',
    greeting: 'Your cat Pickles told me about this place.',
    thanks: 'Purr-fect. The mice will not know what hit them.',
    wants: ['potion_moonberry', 'potion_glow', 'potion_ember'],
  },
  {
    id: 'fairy',
    name: 'Twinkle the fairy',
    greeting: 'Sparkles! The flower fairies sent me.',
    thanks: 'Yay! Glitter all around!',
    wants: ['potion_sunny', 'potion_lavender_tea', 'potion_rainbow', 'potion_fairy_dust'],
  },
  {
    id: 'bird',
    name: 'Pippin the bluebird',
    greeting: 'Tweet! My chicks have been chirping all morning.',
    thanks: 'Tweet tweet! They will sing your name all day.',
    wants: ['potion_moonberry', 'potion_sunny', 'potion_cloud'],
  },
  {
    id: 'hedgehog',
    name: 'Hazel the hedgehog',
    greeting: 'My prickles are all droopy today.',
    thanks: 'Ooh, every prickle is standing tall again!',
    wants: ['potion_sunny', 'potion_lavender_tea', 'potion_ember'],
  },
  {
    id: 'deer',
    name: 'Fern the deer',
    greeting: 'The path through the woods is so dark at night.',
    thanks: 'Now I can light the way for the little ones too.',
    wants: ['potion_dream', 'potion_glow', 'potion_starlight'],
  },
  {
    id: 'unicorn',
    name: 'Stella the unicorn',
    greeting: 'A real witch! I have been looking for one everywhere.',
    thanks: 'Look at my horn shine! You are wonderful, Mimi.',
    wants: ['potion_lavender_tea', 'potion_love', 'potion_starlight', 'potion_rainbow'],
  },
];

/** Deterministic pseudo-random number generator, so visits can be saved as one number. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledRound(round: number): number[] {
  const rng = mulberry32(round * 7919 + 17);
  const order = CUSTOMERS.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * The villager who arrives as visitor number `index`. Every round of visits
 * includes each villager once, shuffled, and nobody visits twice in a row.
 */
export function visitorAt(index: number): CustomerDefinition {
  const count = CUSTOMERS.length;
  const round = Math.floor(index / count);
  const order = shuffledRound(round);
  if (round > 0 && order[0] === shuffledRound(round - 1)[count - 1]) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return CUSTOMERS[order[index % count]];
}

/**
 * Visit number `index` in full: who comes and what they ask for. They pick
 * from their favourites that the shop's reputation `level` has unlocked.
 */
export function customerAt(index: number, level: number, potions: Record<string, PotionInfo>): CustomerProfile {
  const who = visitorAt(index);
  const known = who.wants.filter((id) => potions[id]);
  const unlocked = known.filter((id) => (potions[id].tier ?? 1) <= level);
  const choices = unlocked.length > 0 ? unlocked : known.slice(0, 1);
  const desiredItemId = choices[Math.floor(mulberry32(index * 31 + 7)() * choices.length)];
  const potion = potions[desiredItemId];
  return {
    id: who.id,
    name: who.name,
    avatar: `approved/customers/customer_${who.id}.png`,
    spriteKey: `customer_${who.id}`,
    desiredItemId,
    quote: `${who.greeting} Could I have a ${potion.name.toLowerCase()}, please?`,
    completionQuote: who.thanks,
    paymentCoins: potion.price,
  };
}

/** Customers visit one at a time. */
export class CustomerService {
  private activeCustomer: CustomerProfile | null = null;
  /** Visitor number of the next customer to arrive. */
  private queueIndex: number;

  constructor(
    queueIndex: number,
    private readonly potions: Record<string, PotionInfo>,
    /** The shop's current reputation level. */
    private readonly level: () => number = () => 1
  ) {
    this.queueIndex = Math.max(0, Math.floor(queueIndex));
    this.spawnNextCustomer();
  }

  getActiveCustomer(): CustomerProfile | null {
    return this.activeCustomer;
  }

  spawnNextCustomer(): CustomerProfile {
    this.activeCustomer = customerAt(this.queueIndex, this.level(), this.potions);
    this.queueIndex++;
    return this.activeCustomer;
  }

  /** The current customer leaves; the counter is empty until the next spawn. */
  dismissCustomer(): void {
    this.activeCustomer = null;
  }

  /**
   * The value to save so that a new service created with it starts with the
   * same customer at the counter (or the next one, if the counter is empty).
   */
  getResumeIndex(): number {
    return this.activeCustomer ? this.queueIndex - 1 : this.queueIndex;
  }
}
