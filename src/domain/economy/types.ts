export interface Currencies {
  petals: number;
  stardust: number;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'reward' | 'craft';
  amountPetals: number;
  amountStardust: number;
  description: string;
  timestamp: number;
}
