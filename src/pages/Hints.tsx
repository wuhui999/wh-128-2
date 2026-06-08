import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import CardButton from '@/components/CardButton';
import { cn } from '@/lib/utils';
import { SUIT_DISPLAY, RANK_DISPLAY } from '@/types/game';
import {
  Lightbulb,
  AlertTriangle,
  Bomb,
  Crown,
  TrendingUp,
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react';

export default function Hints() {
  const navigate = useNavigate();
  const { cards, getStats } = useGameStore();

  const stats = getStats();

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

  const getProbabilityColor = (probability: 'high' | 'medium' | 'low') => {
    switch (probability) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'medium':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'low':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
  };

  const getProbabilityLabel = (probability: 'high' | 'medium' | 'low') => {
    switch (probability) {
      case 'high':
        return '高风险';
      case 'medium':
        return '中风险';
      case 'low':
        return '低风险';
    }
  };

  const getProbabilityBg = (probability: 'high' | 'medium' | 'low') => {
    switch (probability) {
      case 'high':
        return 'bg-gradient-to-r from-red-500 to-rose-500';
      case 'medium':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'low':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Lightbulb className="w-8 h-8" />
          <h2 className="text-2xl font-bold">智能提示</h2>
        </div>
        <p className="text-purple-100">
          基于剩余牌型的启发式分析，帮助你判断场上可能存在的炸弹和关键牌分布
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">提示说明</p>
            <p>
              本页面提供的概率分析仅基于已出牌的统计，不考虑玩家手牌分布和出牌策略，仅供记牌练习参考。
              实际对局中请结合具体情况判断。
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Bomb className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-bold text-slate-800">炸弹可能性分析</h3>
        </div>

        {stats.bombPossibilities.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Bomb className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>目前没有足够的剩余牌形成炸弹</p>
            <p className="text-sm mt-1">炸弹需要至少4张同点数牌或2张王牌</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.bombPossibilities.map((possibility, index) => (
              <div
                key={index}
                className={cn(
                  'border-2 rounded-xl p-4 transition-all hover:shadow-md',
                  getProbabilityColor(possibility.probability)
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg',
                        getProbabilityBg(possibility.probability)
                      )}
                    >
                      {possibility.rank === 'joker' ? '王' : possibility.rank}
                    </div>
                    <div>
                      <div className="font-bold text-lg">
                        {possibility.rank === 'joker' ? '王牌炸弹' : `${possibility.rank}炸弹`}
                      </div>
                      <div className="text-sm opacity-80">{possibility.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {possibility.remaining}
                      <span className="text-sm font-normal opacity-70">/{possibility.required}</span>
                    </div>
                    <div
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full inline-block mt-1',
                        possibility.probability === 'high'
                          ? 'bg-red-200 text-red-800'
                          : possibility.probability === 'medium'
                          ? 'bg-amber-200 text-amber-800'
                          : 'bg-emerald-200 text-emerald-800'
                      )}
                    >
                      {getProbabilityLabel(possibility.probability)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', getProbabilityBg(possibility.probability))}
                    style={{
                      width: `${Math.min(100, (possibility.remaining / (possibility.rank === 'joker' ? 4 : 8)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <Crown className="w-6 h-6 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-800">关键牌剩余</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-800">级牌 {stats.levelCard}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600">{stats.levelCards.remaining}</div>
                <div className="text-xs text-amber-700">剩余</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-800">{stats.levelCards.played}</div>
                <div className="text-xs text-amber-700">已出</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-900">{stats.levelCards.total}</div>
                <div className="text-xs text-amber-700">总计</div>
              </div>
              <div className="flex-1">
                <div className="h-3 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${(stats.levelCards.played / stats.levelCards.total) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-amber-700 mt-1 text-right">
                  已出 {((stats.levelCards.played / stats.levelCards.total) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">王牌</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">{stats.jokers.small.remaining}</div>
                <div className="text-xs text-red-700">小王剩余</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.jokers.big.remaining}</div>
                <div className="text-xs text-red-700">大王剩余</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {stats.jokers.small.remaining + stats.jokers.big.remaining}
                </div>
                <div className="text-xs text-red-700">王牌总计</div>
              </div>
              <div className="flex-1">
                <div className="h-3 bg-red-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{
                      width: `${((stats.jokers.small.played + stats.jokers.big.played) / (stats.jokers.small.total + stats.jokers.big.total)) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-xs text-red-700 mt-1 text-right">
                  已出 {(((stats.jokers.small.played + stats.jokers.big.played) / (stats.jokers.small.total + stats.jokers.big.total)) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <h4 className="font-medium text-slate-700 mb-3">未出的关键牌列表</h4>
        {stats.keyCardsRemaining.length === 0 ? (
          <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>所有关键牌（级牌和王牌）都已出完</p>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex flex-wrap gap-2">
              {stats.keyCardsRemaining.map((cardState) => (
                <CardButton
                  key={cardState.card.id}
                  cardState={cardState}
                  size="sm"
                  disabled
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-bold text-slate-800">各花色分布</h3>
        </div>

        <div className="space-y-4">
          {stats.suits.map((suit) => (
            <div key={suit.suit} className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{SUIT_DISPLAY[suit.suit]}</span>
                  <span className="font-medium text-slate-700">{suit.suit === 'spade' ? '黑桃' : suit.suit === 'heart' ? '红桃' : suit.suit === 'club' ? '梅花' : '方块'}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-800">{suit.remaining}</span>
                  <span className="text-sm text-slate-500"> / {suit.total} 张</span>
                </div>
              </div>
              <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${(suit.remaining / suit.total) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>已出 {suit.played} 张</span>
                <span>剩余 {((suit.remaining / suit.total) * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <AlertCircle className="w-6 h-6 text-slate-500" />
          <h3 className="text-lg font-bold text-slate-800">断门预警</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.suits.map((suit) => {
            const isLow = suit.remaining <= 3;
            const isEmpty = suit.remaining === 0;
            return (
              <div
                key={suit.suit}
                className={cn(
                  'rounded-xl p-4 text-center border-2 transition-all',
                  isEmpty
                    ? 'bg-red-50 border-red-300'
                    : isLow
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                )}
              >
                <div className="text-3xl mb-1">{SUIT_DISPLAY[suit.suit]}</div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                  )}
                >
                  {suit.remaining}
                </div>
                <div
                  className={cn(
                    'text-xs font-medium mt-1',
                    isEmpty ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-500'
                  )}
                >
                  {isEmpty ? '已断门' : isLow ? '即将断门' : '正常'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ChevronRight className="w-5 h-5" />
          记牌技巧
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-300">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="font-medium text-white mb-2">🎯 优先记级牌</div>
            <p>级牌是全场最核心的牌，记住已出的级牌数量可以判断是否还有更大的牌。</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="font-medium text-white mb-2">👑 王牌要记清</div>
            <p>大小王各4张，记住剩余王牌可以判断王炸的可能性。</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="font-medium text-white mb-2">📊 关注断门</div>
            <p>某花色剩余≤3张时要注意，可能有人已经断门，可以用单张或对子调主。</p>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="font-medium text-white mb-2">💣 炸弹预警</div>
            <p>某个点数剩余≥4张时要警惕，可能有人持有炸弹。</p>
          </div>
        </div>
      </div>
    </div>
  );
}
