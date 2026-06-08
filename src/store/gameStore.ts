import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import {
  GameStore,
  GameState,
  Rank,
  Card,
  CardState,
  Operation,
  GameStats,
  SuitStats,
  RankStats,
  BombPossibility,
  SUITS,
  RANKS,
} from '@/types/game';
import { generateDeck, generateId } from '@/utils/cards';
import { recognizePattern } from '@/utils/pattern';

const STORAGE_KEY = 'guandan-memorizer-game';

const MAX_HISTORY = 50;

function createInitialState(): GameState {
  return {
    initialized: false,
    levelCard: '2',
    playerCount: 4,
    cards: [],
    operations: [],
    history: [],
    historyIndex: -1,
    createdAt: Date.now(),
  };
}

function saveToHistory(state: GameState): GameState {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  const stateCopy = JSON.parse(JSON.stringify({
    cards: state.cards,
    operations: state.operations,
    levelCard: state.levelCard,
    playerCount: state.playerCount,
    initialized: state.initialized,
    createdAt: state.createdAt,
  }));
  newHistory.push(stateCopy);

  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
}

function calculateStats(state: GameState): GameStats {
  const { cards, levelCard } = state;

  const totalCards = cards.length;
  const totalPlayed = cards.filter((c) => c.played).length;
  const totalRemaining = cards.filter((c) => !c.played && !c.inHand).length;
  const totalInHand = cards.filter((c) => c.inHand).length;

  const jokers = {
    small: { total: 0, played: 0, remaining: 0 },
    big: { total: 0, played: 0, remaining: 0 },
  };

  cards.forEach((c) => {
    if (c.card.isJoker) {
      const type = c.card.rank as 'small' | 'big';
      jokers[type].total++;
      if (c.played) jokers[type].played++;
      else if (!c.inHand) jokers[type].remaining++;
    }
  });

  const levelCards = { total: 0, played: 0, remaining: 0 };
  cards.forEach((c) => {
    if (!c.card.isJoker && c.card.rank === levelCard) {
      levelCards.total++;
      if (c.played) levelCards.played++;
      else if (!c.inHand) levelCards.remaining++;
    }
  });

  const suits: SuitStats[] = SUITS.map((suit) => {
    const suitCards = cards.filter((c) => !c.card.isJoker && c.card.suit === suit);
    return {
      suit,
      total: suitCards.length,
      played: suitCards.filter((c) => c.played).length,
      remaining: suitCards.filter((c) => !c.played && !c.inHand).length,
    };
  });

  const ranks: RankStats[] = [];
  RANKS.forEach((rank) => {
    const rankCards = cards.filter((c) => !c.card.isJoker && c.card.rank === rank);
    ranks.push({
      rank,
      total: rankCards.length,
      played: rankCards.filter((c) => c.played).length,
      remaining: rankCards.filter((c) => !c.played && !c.inHand).length,
      isLevel: rank === levelCard,
      isJoker: false,
    });
  });
  ranks.push({
    rank: 'small',
    total: jokers.small.total,
    played: jokers.small.played,
    remaining: jokers.small.remaining,
    isLevel: false,
    isJoker: true,
  });
  ranks.push({
    rank: 'big',
    total: jokers.big.total,
    played: jokers.big.played,
    remaining: jokers.big.remaining,
    isLevel: false,
    isJoker: true,
  });

  const bombPossibilities: BombPossibility[] = [];

  const jokerRemaining = jokers.small.remaining + jokers.big.remaining;
  if (jokerRemaining >= 2) {
    bombPossibilities.push({
      rank: 'joker',
      remaining: jokerRemaining,
      required: 2,
      probability: jokerRemaining >= 4 ? 'high' : jokerRemaining >= 3 ? 'medium' : 'low',
      description: `王炸剩余${jokerRemaining}张${jokerRemaining >= 4 ? '，天王炸可能' : jokerRemaining >= 3 ? '，三王可能' : ''}`,
    });
  }

  RANKS.forEach((rank) => {
    const rankStat = ranks.find((r) => r.rank === rank)!;
    if (rankStat.remaining >= 4) {
      bombPossibilities.push({
        rank,
        remaining: rankStat.remaining,
        required: 4,
        probability: rankStat.remaining >= 6 ? 'high' : rankStat.remaining >= 5 ? 'medium' : 'low',
        description: `${rank === levelCard ? '级牌' : ''}${rank}剩余${rankStat.remaining}张${rankStat.remaining >= 6 ? '，六张炸可能' : rankStat.remaining >= 5 ? '，五张炸可能' : '，四张炸可能'}`,
      });
    }
  });

  const keyCardsRemaining = cards.filter((c) => !c.played && !c.inHand && (c.card.isJoker || c.card.rank === levelCard));

  return {
    totalCards,
    totalPlayed,
    totalRemaining,
    totalInHand,
    levelCard,
    jokers,
    levelCards,
    suits,
    ranks,
    bombPossibilities,
    keyCardsRemaining,
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...createInitialState(),

      initGame: (levelCard: Rank, playerCount: 2 | 3 | 4, handCardIds: string[]) => {
        set((state) => {
          const deck = generateDeck(levelCard);
          const cards: CardState[] = deck.map((card) => ({
            card,
            played: false,
            inHand: handCardIds.includes(card.id),
          }));

          const operation: Operation = {
            id: generateId(),
            type: 'init',
            timestamp: Date.now(),
            description: `开局：级牌${levelCard}，${playerCount}人局，手牌${handCardIds.length}张`,
            cardIds: handCardIds,
          };

          const newState: GameState = {
            ...state,
            initialized: true,
            levelCard,
            playerCount,
            cards,
            operations: [operation],
            history: [],
            historyIndex: -1,
            createdAt: Date.now(),
          };

          return saveToHistory(newState);
        });
      },

      playCard: (cardId: string) => {
        const state = get();
        const cardState = state.cards.find((c) => c.card.id === cardId);
        if (!cardState || cardState.played) return;
        const totalPlayed = state.cards.filter((c) => c.played).length;
        if (totalPlayed >= state.cards.length) return;

        set((state) => {
          const newState = produce(state, (draft) => {
            const card = draft.cards.find((c) => c.card.id === cardId);
            if (card) {
              card.played = true;
              card.inHand = false;

              const operation: Operation = {
                id: generateId(),
                type: 'play',
                timestamp: Date.now(),
                description: `出牌：${card.card.display}`,
                cardIds: [cardId],
              };
              draft.operations.push(operation);
            }
          });
          return saveToHistory(newState);
        });
      },

      unplayCard: (cardId: string) => {
        const state = get();
        const cardState = state.cards.find((c) => c.card.id === cardId);
        if (!cardState || !cardState.played) return;

        set((state) => {
          const newState = produce(state, (draft) => {
            const card = draft.cards.find((c) => c.card.id === cardId);
            if (card) {
              card.played = false;

              const operation: Operation = {
                id: generateId(),
                type: 'unplay',
                timestamp: Date.now(),
                description: `撤销出牌：${card.card.display}`,
                cardIds: [cardId],
              };
              draft.operations.push(operation);
            }
          });
          return saveToHistory(newState);
        });
      },

      playCards: (cardIds: string[]) => {
        const state = get();

        const playedCards = cardIds.filter((id) => {
          const cs = state.cards.find((c) => c.card.id === id);
          return cs?.played;
        });
        if (playedCards.length > 0) {
          return {
            success: false,
            error: `所选牌中有${playedCards.length}张已出牌，无法重复标记`,
          };
        }

        const totalPlayed = state.cards.filter((c) => c.played).length;
        const maxPlayable = state.cards.length - state.cards.filter((c) => c.inHand).length;
        if (totalPlayed + cardIds.length > maxPlayable) {
          return {
            success: false,
            error: `出牌数超出上限，最多还能出${maxPlayable - totalPlayed}张`,
          };
        }

        const cards = cardIds
          .map((id) => state.cards.find((c) => c.card.id === id)?.card)
          .filter(Boolean) as Card[];

        const pattern = recognizePattern(cards, state.levelCard);
        const cardDisplay = cards.slice(0, 3).map((c) => c.display).join('、');
        const moreText = cards.length > 3 ? `等${cards.length}张` : '';

        set((state) => {
          const newState = produce(state, (draft) => {
            cardIds.forEach((cardId) => {
              const card = draft.cards.find((c) => c.card.id === cardId);
              if (card) {
                card.played = true;
                card.inHand = false;
              }
            });

            const operation: Operation = {
              id: generateId(),
              type: 'playBatch',
              timestamp: Date.now(),
              description: `批量出牌：${cardDisplay}${moreText}（${pattern.name}）`,
              cardIds,
              pattern,
            };
            draft.operations.push(operation);
          });
          return saveToHistory(newState);
        });

        return { success: true };
      },

      undo: (steps: number = 1) => {
        set((state) => {
          if (state.historyIndex <= 0) return state;
          const newIndex = Math.max(0, state.historyIndex - steps);
          const historyState = state.history[newIndex];
          return {
            ...state,
            cards: historyState.cards,
            operations: historyState.operations,
            levelCard: historyState.levelCard,
            playerCount: historyState.playerCount,
            initialized: historyState.initialized,
            createdAt: historyState.createdAt,
            historyIndex: newIndex,
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;
          const newIndex = state.historyIndex + 1;
          const historyState = state.history[newIndex];
          return {
            ...state,
            cards: historyState.cards,
            operations: historyState.operations,
            levelCard: historyState.levelCard,
            playerCount: historyState.playerCount,
            initialized: historyState.initialized,
            createdAt: historyState.createdAt,
            historyIndex: newIndex,
          };
        });
      },

      resetGame: () => {
        set(createInitialState());
      },

      getRemainingCards: () => {
        return get().cards.filter((c) => !c.played && !c.inHand);
      },

      getPlayedCards: () => {
        return get().cards.filter((c) => c.played);
      },

      getHandCards: () => {
        return get().cards.filter((c) => c.inHand);
      },

      getStats: () => {
        return calculateStats(get());
      },

      exportGame: () => {
        const state = get();
        const exportData = {
          version: '1.0',
          exportedAt: Date.now(),
          game: {
            levelCard: state.levelCard,
            playerCount: state.playerCount,
            createdAt: state.createdAt,
            cards: state.cards.map((c) => ({
              id: c.card.id,
              suit: c.card.suit,
              rank: c.card.rank,
              played: c.played,
              inHand: c.inHand,
            })),
            operations: state.operations,
          },
          stats: calculateStats(state),
        };
        return JSON.stringify(exportData, null, 2);
      },

      loadGame: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          if (!parsed.game || !parsed.game.cards) {
            throw new Error('无效的对局数据');
          }

          const deck = generateDeck(parsed.game.levelCard);
          const cards: CardState[] = parsed.game.cards.map((c: any) => {
            const card = deck.find((d) => d.id === c.id);
            if (!card) {
              throw new Error(`找不到牌：${c.id}`);
            }
            return {
              card,
              played: c.played,
              inHand: c.inHand,
            };
          });

          set((state) => ({
            ...state,
            initialized: true,
            levelCard: parsed.game.levelCard,
            playerCount: parsed.game.playerCount,
            cards,
            operations: parsed.game.operations || [],
            history: [],
            historyIndex: -1,
            createdAt: parsed.game.createdAt || Date.now(),
          }));
        } catch (e) {
          console.error('加载对局失败:', e);
          throw e;
        }
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        initialized: state.initialized,
        levelCard: state.levelCard,
        playerCount: state.playerCount,
        cards: state.cards,
        operations: state.operations,
        history: state.history,
        historyIndex: state.historyIndex,
        createdAt: state.createdAt,
      }),
    }
  )
);
