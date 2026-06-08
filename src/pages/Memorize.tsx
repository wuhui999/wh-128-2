import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import CardButton from '@/components/CardButton';
import { Suit, SUITS, RANKS, SUIT_DISPLAY, RANK_DISPLAY, CardState } from '@/types/game';
import { recognizePattern } from '@/utils/pattern';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  List,
  Filter,
  Undo2,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Layers,
  Check,
  X,
  Info,
  AlertCircle,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'remaining' | 'played' | 'hand' | 'joker' | 'level';

export default function Memorize() {
  const navigate = useNavigate();
  const { cards, playCard, unplayCard, playCards, getStats, undo, historyIndex, history, levelCard } =
    useGameStore();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedSuit, setSelectedSuit] = useState<Suit | 'all'>('all');
  const [batchMode, setBatchMode] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');

  const stats = getStats();

  const selectedCardStates = useMemo(() => {
    return Array.from(selectedCards)
      .map((id) => cards.find((c) => c.card.id === id))
      .filter(Boolean) as CardState[];
  }, [selectedCards, cards]);

  const patternPreview = useMemo(() => {
    if (selectedCardStates.length === 0) return null;
    const cards = selectedCardStates.map((cs) => cs.card);
    return recognizePattern(cards, levelCard);
  }, [selectedCardStates, levelCard]);

  const filteredCards = useMemo(() => {
    let result = [...cards];

    switch (filterMode) {
      case 'remaining':
        result = result.filter((c) => !c.played && !c.inHand);
        break;
      case 'played':
        result = result.filter((c) => c.played);
        break;
      case 'hand':
        result = result.filter((c) => c.inHand);
        break;
      case 'joker':
        result = result.filter((c) => c.card.isJoker);
        break;
      case 'level':
        result = result.filter((c) => !c.card.isJoker && c.card.type === 'level');
        break;
    }

    if (selectedSuit !== 'all') {
      result = result.filter((c) => !c.card.isJoker && c.card.suit === selectedSuit);
    }

    result.sort((a, b) => {
      if (a.card.isJoker && b.card.isJoker) {
        return a.card.rank === 'big' ? 1 : -1;
      }
      if (a.card.isJoker) return 1;
      if (b.card.isJoker) return -1;

      const rankOrder: Record<string, number> = {};
      RANKS.forEach((r, i) => (rankOrder[r] = i));
      const suitOrder: Record<string, number> = {};
      SUITS.forEach((s, i) => (suitOrder[s] = i));

      const rankDiff = rankOrder[a.card.rank as string] - rankOrder[b.card.rank as string];
      if (rankDiff !== 0) return rankDiff;
      return suitOrder[a.card.suit as string] - suitOrder[b.card.suit as string];
    });

    return result;
  }, [cards, filterMode, selectedSuit]);

  const handleCardClick = (cardId: string) => {
    setError('');
    const cardState = cards.find((c) => c.card.id === cardId);
    if (!cardState) return;

    if (batchMode) {
      if (cardState.played) {
        setError('已出牌不能选择');
        return;
      }
      setSelectedCards((prev) => {
        const next = new Set(prev);
        if (next.has(cardId)) {
          next.delete(cardId);
        } else {
          next.add(cardId);
        }
        return next;
      });
    } else {
      if (cardState.played) {
        unplayCard(cardId);
      } else if (!cardState.inHand) {
        if (stats.totalPlayed >= stats.totalCards - stats.totalInHand) {
          alert('所有牌都已出完！');
          return;
        }
        playCard(cardId);
      }
    }
  };

  const handleConfirmBatch = () => {
    if (selectedCards.size === 0) {
      setError('请至少选择一张牌');
      return;
    }

    const result = playCards(Array.from(selectedCards));
    if (result.success) {
      setSelectedCards(new Set());
      setError('');
    } else {
      setError(result.error || '出牌失败');
    }
  };

  const handleCancelBatch = () => {
    setSelectedCards(new Set());
    setError('');
    setBatchMode(false);
  };

  const handleQuickUndo = () => {
    if (historyIndex > 0) {
      undo(1);
    }
  };

  const handleSelectAll = () => {
    const selectable = filteredCards.filter((c) => !c.played);
    if (selectable.length === 0) {
      setError('没有可选择的牌');
      return;
    }
    setSelectedCards(new Set(selectable.map((c) => c.card.id)));
  };

  const handleClearSelection = () => {
    setSelectedCards(new Set());
  };

  const progress = stats.totalCards > 0 ? (stats.totalPlayed / (stats.totalCards - stats.totalInHand)) * 100 : 0;

  const filters: { mode: FilterMode; label: string; icon?: any }[] = [
    { mode: 'all', label: '全部' },
    { mode: 'remaining', label: '剩余' },
    { mode: 'played', label: '已出' },
    { mode: 'hand', label: '手牌' },
    { mode: 'level', label: '级牌', icon: Crown },
    { mode: 'joker', label: '王牌' },
  ];

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">尚未开始对局</h2>
        <p className="text-slate-500 mb-6">请先在开局页面设置游戏参数</p>
        <button
          onClick={() => navigate('/')}
          className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors"
        >
          去设置
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {batchMode && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-6 h-6" />
                <h3 className="text-xl font-bold">批量记牌模式</h3>
              </div>
              <p className="text-indigo-100 text-sm">
                点击选择多张牌（含手牌），然后点击「确认出牌」一次性标记
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-3xl font-bold">{selectedCards.size}</div>
                <div className="text-xs text-indigo-200">已选择</div>
              </div>
              {patternPreview && (
                <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
                  <div className="text-sm">{patternPreview.name}</div>
                  <div className="text-xs opacity-80">{patternPreview.description}</div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 p-3 bg-red-500/20 border border-white/30 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              全选当前筛选
            </button>
            <button
              onClick={handleClearSelection}
              disabled={selectedCards.size === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              清空选择
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCancelBatch}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              取消
            </button>
            <button
              onClick={handleConfirmBatch}
              disabled={selectedCards.size === 0}
              className="flex items-center gap-2 px-6 py-2 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Check className="w-4 h-4" />
              确认出牌
            </button>
          </div>

          {selectedCardStates.length > 0 && (
            <div className="mt-4 p-3 bg-white/10 rounded-xl">
              <div className="text-xs text-indigo-200 mb-2">已选牌：</div>
              <div className="flex flex-wrap gap-1">
                {selectedCardStates.slice(0, 20).map((cs) => (
                  <span
                    key={cs.card.id}
                    className="px-2 py-1 bg-white/20 rounded text-sm"
                  >
                    {cs.card.display}
                  </span>
                ))}
                {selectedCardStates.length > 20 && (
                  <span className="px-2 py-1 bg-white/20 rounded text-sm">
                    +{selectedCardStates.length - 20}张
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">记牌面板</h2>
            <p className="text-sm text-slate-500">
              {batchMode
                ? '批量模式：点击选择多张牌，然后确认出牌'
                : '点击未出的牌标记为已出，点击已出的牌可撤销'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setBatchMode(!batchMode);
                if (batchMode) {
                  setSelectedCards(new Set());
                  setError('');
                }
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors font-medium',
                batchMode
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              <Layers className="w-4 h-4" />
              批量模式{batchMode ? ' (开)' : ''}
            </button>
            <button
              onClick={handleQuickUndo}
              disabled={historyIndex <= 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4" />
              撤销一步
            </button>
          </div>
        </div>

        {!batchMode && error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">出牌进度</span>
            <span className="font-medium text-slate-800">
              {stats.totalPlayed} / {stats.totalCards - stats.totalInHand} 张
            </span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-slate-400 rounded-full" />
              <span className="text-sm text-slate-600">剩余未出</span>
            </div>
            <div className="text-2xl font-bold text-slate-800">{stats.totalRemaining}</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-emerald-700">已出牌</span>
            </div>
            <div className="text-2xl font-bold text-emerald-600">{stats.totalPlayed}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span className="text-sm text-blue-700">我的手牌</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalInHand}</div>
          </div>
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-amber-700">级牌剩余</span>
            </div>
            <div className="text-2xl font-bold text-amber-600">{stats.levelCards.remaining}</div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <h4 className="text-sm font-medium text-slate-700 mb-3">按花色统计</h4>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {stats.suits.map((suit) => (
              <div key={suit.suit} className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">{SUIT_DISPLAY[suit.suit]}</div>
                <div className="text-xl font-bold text-slate-800">{suit.remaining}</div>
                <div className="text-xs text-slate-500">剩余 / 共{suit.total}</div>
              </div>
            ))}
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg mb-1">小王</div>
              <div className="text-xl font-bold text-slate-800">{stats.jokers.small.remaining}</div>
              <div className="text-xs text-slate-500">剩余 / 共{stats.jokers.small.total}</div>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <div className="text-lg mb-1 text-red-600">大王</div>
              <div className="text-xl font-bold text-red-600">{stats.jokers.big.remaining}</div>
              <div className="text-xs text-slate-500">剩余 / 共{stats.jokers.big.total}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'grid' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-md transition-colors',
                  viewMode === 'list' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.mode}
                  onClick={() => setFilterMode(filter.mode)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    filterMode === filter.mode
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        {filterMode !== 'joker' && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => setSelectedSuit('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                selectedSuit === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              全部花色
            </button>
            {SUITS.map((suit) => (
              <button
                key={suit}
                onClick={() => setSelectedSuit(suit)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  selectedSuit === suit
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {SUIT_DISPLAY[suit]} {RANK_DISPLAY[stats.levelCard]}
              </button>
            ))}
          </div>
        )}

        {filteredCards.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>没有符合条件的牌</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="flex flex-wrap gap-2">
            {filteredCards.map((cardState) => (
              <CardButton
                key={cardState.card.id}
                cardState={cardState}
                onClick={() => handleCardClick(cardState.card.id)}
                size="md"
                showStatus
                selected={selectedCards.has(cardState.card.id)}
                disabled={batchMode && cardState.played}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCards.map((cardState) => (
              <div
                key={cardState.card.id}
                onClick={() => handleCardClick(cardState.card.id)}
                className={cn(
                  'flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer',
                  batchMode && selectedCards.has(cardState.card.id)
                    ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500 ring-offset-2'
                    : cardState.played
                    ? 'bg-gray-50 border-gray-200 opacity-50'
                    : cardState.inHand
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    : 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-emerald-50',
                  batchMode && cardState.played && 'opacity-50 cursor-not-allowed'
                )}
              >
                <div className="flex items-center gap-3">
                  {batchMode && (
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0',
                        selectedCards.has(cardState.card.id)
                          ? 'bg-indigo-500 border-indigo-500 text-white'
                          : 'border-slate-300'
                      )}
                    >
                      {selectedCards.has(cardState.card.id) && <Check className="w-3 h-3" />}
                    </div>
                  )}
                  <span
                    className={cn(
                      'text-xl font-bold',
                      cardState.card.isJoker
                        ? cardState.card.rank === 'big'
                          ? 'text-red-600'
                          : 'text-slate-800'
                        : cardState.card.suit === 'heart' || cardState.card.suit === 'diamond'
                        ? 'text-red-600'
                        : 'text-slate-800'
                    )}
                  >
                    {cardState.card.display}
                  </span>
                  {cardState.card.type === 'level' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                      级牌
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {cardState.played && (
                    <span className="text-sm text-slate-500">已出 - 点击撤销</span>
                  )}
                  {cardState.inHand && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                      手牌
                    </span>
                  )}
                  {!cardState.played && !cardState.inHand && !batchMode && (
                    <span className="text-sm text-emerald-600">点击标记已出</span>
                  )}
                  {!cardState.played && batchMode && (
                    <span className="text-sm text-indigo-600">点击选择</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">按点数统计剩余</h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
          {stats.ranks.map((rank) => (
            <div
              key={rank.rank}
              className={cn(
                'text-center p-3 rounded-xl border-2',
                rank.isLevel
                  ? 'bg-amber-50 border-amber-200'
                  : rank.isJoker
                  ? rank.rank === 'big'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-slate-50 border-slate-200'
                  : 'bg-slate-50 border-slate-200'
              )}
            >
              <div
                className={cn(
                  'text-lg font-bold mb-1',
                  rank.isJoker && rank.rank === 'big' ? 'text-red-600' : 'text-slate-800'
                )}
              >
                {RANK_DISPLAY[rank.rank]}
              </div>
              <div className="text-2xl font-bold text-emerald-600">{rank.remaining}</div>
              <div className="text-xs text-slate-500">/ {rank.total}</div>
              {rank.isLevel && <div className="text-xs text-amber-600 font-medium mt-1">级牌</div>}
            </div>
          ))}
        </div>
      </div>

      {batchMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">批量模式说明</p>
              <ul className="list-disc list-inside space-y-1 text-amber-700">
                <li>支持同时选择多张牌（包括手牌），一次性标记为已出</li>
                <li>批量操作在撤销栈中算作一步，可整体撤销</li>
                <li>系统会自动识别牌型（对子、炸弹、顺子等）并记录</li>
                <li>点击「取消」或切换开关可退出批量模式</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
