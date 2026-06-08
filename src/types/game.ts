export type Suit = 'spade' | 'heart' | 'club' | 'diamond';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';
export type CardType = 'normal' | 'level' | 'joker';

export interface Card {
  id: string;
  suit: Suit | 'joker';
  rank: Rank | 'small' | 'big';
  type: CardType;
  isJoker: boolean;
  display: string;
}

export interface CardState {
  card: Card;
  played: boolean;
  inHand: boolean;
}

export type OperationType = 'play' | 'unplay' | 'setHand' | 'init' | 'playBatch';

export type PatternType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'tripleWithPair'
  | 'straight'
  | 'flush'
  | 'straightFlush'
  | 'bomb'
  | 'jokerBomb'
  | 'unknown';

export interface PatternInfo {
  type: PatternType;
  name: string;
  description: string;
}

export interface Operation {
  id: string;
  type: OperationType;
  timestamp: number;
  description: string;
  cardIds: string[];
  pattern?: PatternInfo;
}

export interface GameState {
  initialized: boolean;
  levelCard: Rank;
  playerCount: 2 | 3 | 4;
  cards: CardState[];
  operations: Operation[];
  history: GameState[];
  historyIndex: number;
  createdAt: number;
}

export interface GameStore extends GameState {
  initGame: (levelCard: Rank, playerCount: 2 | 3 | 4, handCardIds: string[]) => void;
  playCard: (cardId: string) => void;
  playCards: (cardIds: string[]) => { success: boolean; error?: string };
  unplayCard: (cardId: string) => void;
  undo: (steps?: number) => void;
  redo: () => void;
  resetGame: () => void;
  getRemainingCards: () => CardState[];
  getPlayedCards: () => CardState[];
  getHandCards: () => CardState[];
  getStats: () => GameStats;
  exportGame: () => string;
  loadGame: (data: string) => void;
}

export interface SuitStats {
  suit: Suit;
  total: number;
  played: number;
  remaining: number;
}

export interface RankStats {
  rank: Rank | 'small' | 'big';
  total: number;
  played: number;
  remaining: number;
  isLevel: boolean;
  isJoker: boolean;
}

export interface BombPossibility {
  rank: Rank | 'joker';
  remaining: number;
  required: number;
  probability: 'high' | 'medium' | 'low';
  description: string;
}

export interface GameStats {
  totalCards: number;
  totalPlayed: number;
  totalRemaining: number;
  totalInHand: number;
  levelCard: Rank;
  jokers: {
    small: { total: number; played: number; remaining: number };
    big: { total: number; played: number; remaining: number };
  };
  levelCards: {
    total: number;
    played: number;
    remaining: number;
  };
  suits: SuitStats[];
  ranks: RankStats[];
  bombPossibilities: BombPossibility[];
  keyCardsRemaining: CardState[];
}

export const SUITS: Suit[] = ['spade', 'heart', 'club', 'diamond'];
export const RANKS: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];

export const SUIT_DISPLAY: Record<Suit, string> = {
  spade: '♠',
  heart: '♥',
  club: '♣',
  diamond: '♦',
};

export const SUIT_COLOR: Record<Suit, string> = {
  spade: 'text-gray-900',
  heart: 'text-red-600',
  club: 'text-gray-900',
  diamond: 'text-red-600',
};

export const RANK_DISPLAY: Record<Rank | 'small' | 'big', string> = {
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  'J': 'J',
  'Q': 'Q',
  'K': 'K',
  'A': 'A',
  '2': '2',
  'small': '小王',
  'big': '大王',
};
