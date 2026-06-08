import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { generateDeck } from '@/utils/cards';
import { Rank, RANKS, Card, CardState } from '@/types/game';
import CardButton from '@/components/CardButton';
import { Upload, Play, Users, Crown, Hand, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const { initialized, initGame, loadGame, cards, getStats, levelCard: storedLevelCard } = useGameStore();

  const [levelCard, setLevelCard] = useState<Rank>('2');
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [selectedHandCards, setSelectedHandCards] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<'config' | 'hand'>('config');
  const [previewDeck, setPreviewDeck] = useState<Card[]>([]);
  const [error, setError] = useState<string>('');
  const [importData, setImportData] = useState<string>('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    const deck = generateDeck(levelCard);
    setPreviewDeck(deck);
    setSelectedHandCards(new Set());
  }, [levelCard]);

  useEffect(() => {
    if (initialized && cards.length > 0) {
      setLevelCard(storedLevelCard);
    }
  }, [initialized, storedLevelCard]);

  const toggleHandCard = (cardId: string) => {
    setError('');
    setSelectedHandCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        const maxCards = playerCount === 2 ? 27 : playerCount === 3 ? 36 : 27;
        if (next.size >= maxCards) {
          setError(`最多只能选择 ${maxCards} 张手牌（${playerCount}人局）`);
          return prev;
        }
        next.add(cardId);
      }
      return next;
    });
  };

  const handleContinue = () => {
    setError('');
    if (step === 'config') {
      setStep('hand');
    } else {
      if (selectedHandCards.size === 0) {
        setError('请至少选择一张手牌，或确认没有手牌直接开始');
        return;
      }
      const maxCards = playerCount === 2 ? 27 : playerCount === 3 ? 36 : 27;
      if (selectedHandCards.size > maxCards) {
        setError(`手牌数量不能超过 ${maxCards} 张`);
        return;
      }

      initGame(levelCard, playerCount, Array.from(selectedHandCards));
      navigate('/memorize');
    }
  };

  const handleStartWithoutHand = () => {
    initGame(levelCard, playerCount, []);
    navigate('/memorize');
  };

  const handleImport = () => {
    try {
      loadGame(importData);
      navigate('/memorize');
    } catch (e) {
      setError('导入失败：' + (e as Error).message);
    }
  };

  const handleResume = () => {
    navigate('/memorize');
  };

  const stats = initialized ? getStats() : null;

  const sortedDeck = [...previewDeck].sort((a, b) => {
    if (a.isJoker && b.isJoker) {
      return a.rank === 'big' ? 1 : -1;
    }
    if (a.isJoker) return 1;
    if (b.isJoker) return -1;

    const rankOrder: Record<string, number> = {
      '3': 0, '4': 1, '5': 2, '6': 3, '7': 4, '8': 5, '9': 6,
      '10': 7, 'J': 8, 'Q': 9, 'K': 10, 'A': 11, '2': 12,
    };
    const suitOrder: Record<string, number> = {
      spade: 0, heart: 1, club: 2, diamond: 3,
    };

    const rankDiff = rankOrder[a.rank as string] - rankOrder[b.rank as string];
    if (rankDiff !== 0) return rankDiff;
    return suitOrder[a.suit as string] - suitOrder[b.suit as string];
  });

  if (initialized && cards.length > 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl">
          <h2 className="text-2xl font-bold mb-2">发现未完成的对局</h2>
          <p className="text-emerald-100 mb-4">系统检测到本地有未完成的对局记录，是否继续？</p>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-3xl font-bold">{stats.totalRemaining}</div>
                <div className="text-sm text-emerald-100">剩余牌数</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-3xl font-bold">{stats.totalPlayed}</div>
                <div className="text-sm text-emerald-100">已出牌数</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-3xl font-bold">{stats.levelCard}</div>
                <div className="text-sm text-emerald-100">当前级牌</div>
              </div>
              <div className="bg-white/20 rounded-xl p-4">
                <div className="text-3xl font-bold">{useGameStore.getState().playerCount}</div>
                <div className="text-sm text-emerald-100">玩家数</div>
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={handleResume}
              className="flex-1 bg-white text-emerald-600 font-bold py-3 px-6 rounded-xl hover:bg-emerald-50 transition-colors shadow-lg"
            >
              继续对局
            </button>
            <button
              onClick={() => useGameStore.getState().resetGame()}
              className="bg-white/20 text-white font-bold py-3 px-6 rounded-xl hover:bg-white/30 transition-colors"
            >
              重新开始
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-slate-500" />
            导入对局记录
          </h3>
          <div className="space-y-3">
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="在此粘贴导出的对局JSON数据..."
              className="w-full h-32 p-3 border border-slate-200 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <button
              onClick={handleImport}
              disabled={!importData.trim()}
              className="w-full bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导入并开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-bold">
            {step === 'config' ? '1' : '✓'}
          </div>
          <h2 className="text-lg font-bold text-slate-800">
            {step === 'config' ? '游戏设置' : '选择手牌'}
          </h2>
        </div>

        {step === 'config' ? (
          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                <Crown className="w-4 h-4 text-amber-500" />
                选择级牌
              </label>
              <div className="flex flex-wrap gap-2">
                {RANKS.map((rank) => (
                  <button
                    key={rank}
                    onClick={() => setLevelCard(rank)}
                    className={cn(
                      'w-12 h-12 rounded-xl font-bold text-lg transition-all border-2',
                      levelCard === rank
                        ? 'bg-amber-500 text-white border-amber-500 shadow-lg scale-105'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                    )}
                  >
                    {rank}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-3">
                <Users className="w-4 h-4 text-blue-500" />
                玩家人数
              </label>
              <div className="flex gap-3">
                {[2, 3, 4].map((count) => (
                  <button
                    key={count}
                    onClick={() => setPlayerCount(count as 2 | 3 | 4)}
                    className={cn(
                      'flex-1 py-4 rounded-xl font-bold text-lg transition-all border-2',
                      playerCount === count
                        ? 'bg-blue-500 text-white border-blue-500 shadow-lg'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                    )}
                  >
                    {count} 人局
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {playerCount === 2
                  ? '2人对家战，每人27张牌'
                  : playerCount === 3
                  ? '3人斗地主模式，每人36张牌'
                  : '4人搭档战，每人27张牌'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h4 className="font-medium text-slate-700 mb-2">牌组信息</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xl font-bold text-slate-800">108</div>
                  <div className="text-slate-500">总牌数（两副）</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xl font-bold text-amber-600">8</div>
                  <div className="text-slate-500">级牌数量</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xl font-bold text-red-600">4</div>
                  <div className="text-slate-500">王牌数量</div>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <div className="text-xl font-bold text-blue-600">
                    {playerCount === 2 ? 27 : playerCount === 3 ? 36 : 27}
                  </div>
                  <div className="text-slate-500">每人手牌</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hand className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-slate-700">
                  已选择 <span className="text-blue-600 font-bold">{selectedHandCards.size}</span> /{' '}
                  {playerCount === 2 ? 27 : playerCount === 3 ? 36 : 27} 张
                </span>
              </div>
              <button
                onClick={() => setSelectedHandCards(new Set())}
                className="text-sm text-slate-500 hover:text-red-500"
              >
                清空
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-4 max-h-96 overflow-y-auto">
              <div className="flex flex-wrap gap-2">
                {sortedDeck.map((card) => (
                  <CardButton
                    key={card.id}
                    cardState={{
                      card,
                      played: false,
                      inHand: selectedHandCards.has(card.id),
                    }}
                    onClick={() => toggleHandCard(card.id)}
                    size="sm"
                  />
                ))}
              </div>
            </div>

            <div className="text-sm text-slate-500">
              <p>💡 提示：点击卡牌将其标记为你的手牌，系统会自动排除这些牌进行剩余统计。</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
          {step === 'hand' && (
            <button
              onClick={() => setStep('config')}
              className="px-6 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              返回
            </button>
          )}
          <button
            onClick={handleContinue}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30"
          >
            <Play className="w-5 h-5" />
            {step === 'config' ? '继续选择手牌' : '开始记牌'}
          </button>
          {step === 'hand' && (
            <button
              onClick={handleStartWithoutHand}
              className="px-6 py-3 rounded-xl font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              无手牌开始
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-slate-500" />
          导入对局记录
        </h3>
        <button
          onClick={() => setShowImport(!showImport)}
          className="w-full text-left text-sm text-slate-600 hover:text-emerald-600"
        >
          {showImport ? '收起' : '点击展开导入功能 →'}
        </button>
        {showImport && (
          <div className="mt-4 space-y-3">
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="在此粘贴导出的对局JSON数据..."
              className="w-full h-32 p-3 border border-slate-200 rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleImport}
              disabled={!importData.trim()}
              className="w-full bg-slate-100 text-slate-700 font-medium py-2 px-4 rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              导入并开始
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
