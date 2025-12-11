export enum Rarity {
  COMMON = 'Common',
  RARE = 'Rare',
  EPIC = 'Epic',
  LEGENDARY = 'Legendary',
  MYTHICAL = 'Mythical'
}

export enum EggTier {
  BASIC = 'Basic',
  SILVER = 'Silver',
  GOLD = 'Gold',
  DIAMOND = 'Diamond'
}

export interface Trait {
  name: string;
  value: number;
  max: number;
}

export interface Animal {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: Rarity;
  dailyYield: number; // $ZOO per day
  marketValue: number; // Simulated market value
  isHybrid: boolean;
  parents?: [string, string]; // Names of parents
  hatchedAt: number;
  traits: Trait[];
}

export interface Egg {
  id: string;
  tier: EggTier;
  purchasePrice: number;
  isHatching: boolean;
  purchaseDate: number;
}

export type ViewState = 'MARKET' | 'ZOO' | 'LAB';

export interface GameState {
  balance: number;
  animals: Animal[];
  eggs: Egg[];
  yieldRate: number; // Calculated derived state
}