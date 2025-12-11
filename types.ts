export enum AnimalType {
  Mouse = 1,
  Meerkat = 2,
  Zebra = 3,
  Giraffe = 4,
  Ostrich = 5,
  Cheetah = 6,
  Rhino = 7,
  Elephant = 8
}

export interface Card {
  id: string; // Unique ID for React keys
  animal: AnimalType;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  hand: Card[];
  scorePile: Card[];
  score: number;
}

export interface BoardSlot {
  animal: AnimalType;
  cards: Card[];
}

export interface GameLog {
  id: string;
  message: string;
  type: 'info' | 'action' | 'capture' | 'turn';
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  board: BoardSlot[]; // Array of size 8 (indices 0-7, mapping to Animals 1-8)
  deck: Card[];
  gameStatus: 'lobby' | 'playing' | 'finished';
  winner: Player | null;
  logs: GameLog[];
  turnCount: number;
}