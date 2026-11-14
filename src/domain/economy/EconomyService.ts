import { Currencies, Transaction } from './types';

export class EconomyService {
  private currencies: Currencies;
  private history: Transaction[] = [];

  constructor(initialPetals = 50, initialStardust = 5) {
    this.currencies = {
      petals: Math.max(0, initialPetals),
      stardust: Math.max(0, initialStardust)
    };
  }

  public getCurrencies(): Currencies {
    return { ...this.currencies };
  }

  public getHistory(): Transaction[] {
    return [...this.history];
  }

  public canAfford(petals: number, stardust = 0): boolean {
    return this.currencies.petals >= petals && this.currencies.stardust >= stardust;
  }

  public spend(petals: number, stardust = 0, description = 'Purchase'): { success: boolean; reason?: string } {
    if (petals < 0 || stardust < 0) {
      return { success: false, reason: 'Invalid negative expenditure' };
    }

    if (!this.canAfford(petals, stardust)) {
      return { success: false, reason: 'Insufficient funds' };
    }

    this.currencies.petals -= petals;
    this.currencies.stardust -= stardust;

    this.history.push({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'buy',
      amountPetals: -petals,
      amountStardust: -stardust,
      description,
      timestamp: Date.now()
    });

    return { success: true };
  }

  public earn(petals: number, stardust = 0, description = 'Income'): { success: boolean; reason?: string } {
    if (petals < 0 || stardust < 0) {
      return { success: false, reason: 'Invalid negative income' };
    }

    this.currencies.petals += petals;
    this.currencies.stardust += stardust;

    this.history.push({
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'sell',
      amountPetals: petals,
      amountStardust: stardust,
      description,
      timestamp: Date.now()
    });

    return { success: true };
  }
}
