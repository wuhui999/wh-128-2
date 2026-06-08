import { Card, PatternInfo, PatternType, RANKS, Rank } from '@/types/game';

const RANK_ORDER: Record<string, number> = {};
RANKS.forEach((r, i) => (RANK_ORDER[r] = i));

export function recognizePattern(cards: Card[], levelCard: Rank): PatternInfo {
  if (cards.length === 0) {
    return { type: 'unknown', name: '未知', description: '空' };
  }

  const normalCards = cards.filter((c) => !c.isJoker);
  const jokers = cards.filter((c) => c.isJoker);
  const jokerCount = jokers.length;

  if (jokerCount > 0) {
    if (jokerCount === cards.length) {
      if (jokerCount >= 2) {
        if (jokerCount >= 4) {
          return {
            type: 'jokerBomb',
            name: '天王炸',
            description: `${jokerCount}张王牌炸`,
          };
        }
        return {
          type: 'jokerBomb',
          name: '王炸',
          description: `${jokerCount}张王牌炸`,
        };
      }
      if (jokerCount === 1) {
        return {
          type: 'single',
          name: '单张',
          description: `单张${cards[0].display}`,
        };
      }
    }
  }

  if (cards.length === 1) {
    return {
      type: 'single',
      name: '单张',
      description: `单张${cards[0].display}`,
    };
  }

  const rankCounts: Record<string, number> = {};
  const suits: Set<string> = new Set();

  normalCards.forEach((c) => {
    const rank = c.rank as string;
    rankCounts[rank] = (rankCounts[rank] || 0) + 1;
    if (c.suit && c.suit !== 'joker') {
      suits.add(c.suit);
    }
  });

  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const ranks = Object.keys(rankCounts).sort((a, b) => RANK_ORDER[a] - RANK_ORDER[b]);

  if (counts[0] === 2 && counts.length === 1) {
    return {
      type: 'pair',
      name: '对子',
      description: `${ranks[0]}一对`,
    };
  }

  if (counts[0] === 3) {
    if (counts.length === 1) {
      return {
        type: 'triple',
        name: '三张',
        description: `${ranks[0]}三张`,
      };
    }
    if (counts.length === 2 && counts[1] === 2) {
      const tripleRank = Object.keys(rankCounts).find((r) => rankCounts[r] === 3)[0];
      const pairRank = Object.keys(rankCounts).find((r) => rankCounts[r] === 2)[0];
      return {
        type: 'tripleWithPair',
        name: '三带二',
        description: `${tripleRank}三张带${pairRank}一对`,
      };
    }
  }

  if (counts[0] >= 4) {
    const bombRank = Object.keys(rankCounts).find((r) => rankCounts[r] === counts[0])[0];
    const isLevel = bombRank === levelCard;
    return {
      type: 'bomb',
      name: isLevel ? '级牌炸弹' : '炸弹',
      description: `${counts[0]}张${bombRank}${isLevel ? '级牌' : ''}炸`,
    };
  }

  if (cards.length >= 5) {
    const allSingle = counts.every((c) => c === 1);
    if (allSingle && ranks.length >= 5) {
      const isConsecutive = checkConsecutive(ranks);
      const allSameSuit = suits.size === 1;

      if (isConsecutive && allSameSuit) {
        return {
          type: 'straightFlush',
          name: '同花顺',
          description: `${ranks[0]}-${ranks[ranks.length - 1]}同花顺`,
        };
      }
      if (isConsecutive) {
        return {
          type: 'straight',
          name: '顺子',
          description: `${ranks[0]}-${ranks[ranks.length - 1]}顺子`,
        };
      }
      if (allSameSuit) {
        return {
          type: 'flush',
          name: '同花',
          description: `${ranks.length}张同花`,
        };
      }
    }
  }

  const rankNames = ranks.map((r) => {
    const count = rankCounts[r];
    return count > 1 ? `${r}×${count}` : r;
  });

  return {
    type: 'unknown',
    name: '未知牌型',
    description: `${cards.length}张牌（${rankNames.join('、')}${jokerCount > 0 ? `+${jokerCount}王` : ''}）`,
  };
}

function checkConsecutive(ranks: string[]): boolean {
  if (ranks.length < 5) return false;

  const indices = ranks.map((r) => RANK_ORDER[r]).sort((a, b) => a - b);

  for (let i = 1; i < indices.length; i++) {
    if (indices[i] - indices[i - 1] !== 1) {
      return false;
    }
  }

  return true;
}

export function getPatternIcon(type: PatternType): string {
  const icons: Record<PatternType, string> = {
    single: '1️⃣',
    pair: '2️⃣',
    triple: '3️⃣',
    tripleWithPair: '🎴',
    straight: '📈',
    flush: '🎨',
    straightFlush: '🌟',
    bomb: '💣',
    jokerBomb: '👑',
    unknown: '❓',
  };
  return icons[type];
}
