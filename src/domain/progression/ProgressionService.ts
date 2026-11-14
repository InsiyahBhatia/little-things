export interface ReputationTier {
  level: number;
  title: string;
  /** Lifetime coins earned from customers needed to reach this tier. */
  requiredPetalsEarned: number;
}

export const REPUTATION_TIERS: ReputationTier[] = [
  { level: 1, title: 'The new keeper', requiredPetalsEarned: 0 },
  { level: 2, title: 'A little magic', requiredPetalsEarned: 100 },
  { level: 3, title: 'Village favourite', requiredPetalsEarned: 250 },
  { level: 4, title: 'Keeper of curiosities', requiredPetalsEarned: 600 },
  { level: 5, title: 'The enchantment keeper', requiredPetalsEarned: 1500 },
];

export interface ReputationSnapshot {
  level: number;
  title: string;
  totalPetalsEarned: number;
  /** Lifetime coins needed for the next tier, or null at the top tier. */
  nextTierAt: number | null;
}

function tierFor(total: number): ReputationTier {
  let current = REPUTATION_TIERS[0];
  for (const tier of REPUTATION_TIERS) {
    if (total >= tier.requiredPetalsEarned) current = tier;
  }
  return current;
}

/** Tracks the shop's reputation, which grows with coins earned from customers. */
export class ProgressionService {
  private totalPetalsEarned: number;

  constructor(totalPetalsEarned = 0) {
    this.totalPetalsEarned = Math.max(0, Math.floor(totalPetalsEarned));
  }

  getSnapshot(): ReputationSnapshot {
    const tier = tierFor(this.totalPetalsEarned);
    const next = REPUTATION_TIERS.find((t) => t.requiredPetalsEarned > this.totalPetalsEarned);
    return {
      level: tier.level,
      title: tier.title,
      totalPetalsEarned: this.totalPetalsEarned,
      nextTierAt: next ? next.requiredPetalsEarned : null,
    };
  }

  recordPetalsEarned(amount: number): { leveledUp: boolean; tier: ReputationTier } {
    const before = tierFor(this.totalPetalsEarned);
    this.totalPetalsEarned += Math.max(0, Math.floor(amount));
    const after = tierFor(this.totalPetalsEarned);
    return { leveledUp: after.level > before.level, tier: after };
  }
}
