/** Shared types matching Flask API (numbers, no bigint in JSON). */

export type StockView = {
  name: string;
  price: number;
  priceHistory: number[];
  industry?: string;
};

export type TeamView = {
  name: string;
  cash: number;
  portfolio: [string, number][];
  shortPositions?: [string, number][];
  totalValue: number;
};

export type News = {
  headline: string;
  description: string;
  isFlashed: boolean;
};

export type UserProfile = {
  name: string;
  teamName: string | null;
};

export type MarketState = {
  roundNumber: number;
  isOpen: boolean;
  breakMode?: boolean;
  roundDurationMinutes?: number;
  roundEndAt?: number | null; // Unix timestamp when round timer ends (for countdown)
};
