import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import { getPatternIcon } from '@/utils/pattern';
import {
  Undo2,
  Redo2,
  AlertTriangle,
  History,
  Play,
  RotateCcw,
  Plus,
  Minus,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Layers,
} from 'lucide-react';

export default function UndoPage() {
  const navigate = useNavigate();
  const { operations, history, historyIndex, undo, redo, cards, getStats } = useGameStore();
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const stats = getStats();

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'init':
        return <Play className="w-4 h-4" />;
      case 'play':
        return <Plus className="w-4 h-4" />;
      case 'playBatch':
        return <Layers className="w-4 h-4" />;
      case 'unplay':
        return <Minus className="w-4 h-4" />;
      case 'setHand':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'init':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'play':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'playBatch':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'unplay':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'setHand':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleUndoSteps = (steps: number) => {
    if (historyIndex - steps >= 0) {
      undo(steps);
      setSelectedStep(null);
    }
  };

  const handleJumpToStep = (index: number) => {
    if (index < historyIndex) {
      const steps = historyIndex - index;
      undo(steps);
    } else if (index > historyIndex) {
      const steps = index - historyIndex;
      for (let i = 0; i < steps; i++) {
        redo();
      }
    }
    setSelectedStep(null);
  };

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

  const reversedOperations = [...operations].reverse();
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <History className="w-8 h-8" />
          <h2 className="text-2xl font-bold">操作历史</h2>
        </div>
        <p className="text-indigo-100">
          查看所有操作记录，支持多步撤销和重做
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800">快速操作</h3>
            <p className="text-sm text-slate-500">当前位置：第 {historyIndex + 1} / {history.length} 步</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => undo(1)}
              disabled={!canUndo}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                canUndo
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/30'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <Undo2 className="w-4 h-4" />
              撤销一步
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                canRedo
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/30'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <Redo2 className="w-4 h-4" />
              重做一步
            </button>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">历史进度</span>
            <span className="text-sm text-slate-500">
              共 {history.length} 条历史记录
            </span>
          </div>
          <div className="relative">
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                style={{ width: `${((historyIndex + 1) / history.length) * 100}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-500">
              <span>开始</span>
              <span className="font-medium text-indigo-600">当前</span>
              <span>最新</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-emerald-50 rounded-xl p-4 text-center border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-600">{stats.totalPlayed}</div>
            <div className="text-xs text-emerald-700">已出牌数</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
            <div className="text-3xl font-bold text-slate-600">{stats.totalRemaining}</div>
            <div className="text-xs text-slate-700">剩余牌数</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
            <div className="text-3xl font-bold text-blue-600">{operations.length}</div>
            <div className="text-xs text-blue-700">操作次数</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-200">
            <div className="text-3xl font-bold text-purple-600">{history.length}</div>
            <div className="text-xs text-purple-700">历史记录</div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium text-slate-700 mb-3">批量撤销</h4>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 20, 50].map((steps) => (
              <button
                key={steps}
                onClick={() => handleUndoSteps(steps)}
                disabled={historyIndex < steps}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  historyIndex >= steps
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-200'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                )}
              >
                <Undo2 className="w-3 h-3 inline mr-1" />
                撤销 {steps} 步
              </button>
            ))}
            <button
              onClick={() => {
                if (window.confirm('确定要撤销所有操作，回到开局状态吗？')) {
                  handleJumpToStep(0);
                }
              }}
              disabled={historyIndex <= 0}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                historyIndex > 0
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <RotateCcw className="w-3 h-3 inline mr-1" />
              回到开局
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-500" />
          操作记录（倒序）
        </h3>

        {reversedOperations.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>暂无操作记录</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reversedOperations.map((op, reverseIndex) => {
              const actualIndex = operations.length - 1 - reverseIndex;
              const isCurrent = actualIndex === historyIndex;
              const isPast = actualIndex < historyIndex;

              return (
                <div
                  key={op.id}
                  onClick={() => setSelectedStep(selectedStep === actualIndex ? null : actualIndex)}
                  className={cn(
                    'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    isCurrent
                      ? 'bg-indigo-50 border-indigo-300 shadow-md'
                      : isPast
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                  )}
                >
                  <div className="flex-shrink-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center border-2',
                        getOperationColor(op.type)
                      )}
                    >
                      {getOperationIcon(op.type)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 truncate">
                        {op.description}
                      </span>
                      {op.pattern && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          <span>{getPatternIcon(op.pattern.type)}</span>
                          <span>{op.pattern.name}</span>
                        </span>
                      )}
                      {op.cardIds.length > 1 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                          {op.cardIds.length}张
                        </span>
                      )}
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs rounded-full flex-shrink-0">
                          当前
                        </span>
                      )}
                      {isPast && (
                        <span className="px-2 py-0.5 bg-slate-400 text-white text-xs rounded-full flex-shrink-0">
                          已撤销
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(op.timestamp)}
                      <span className="text-slate-300">•</span>
                      <span>第 {actualIndex + 1} 步</span>
                      {op.pattern && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-indigo-600">{op.pattern.description}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedStep === actualIndex && !isCurrent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            isPast
                              ? window.confirm(`确定要重做 ${Math.abs(actualIndex - historyIndex)} 步吗？`)
                              : window.confirm(`确定要撤销 ${Math.abs(actualIndex - historyIndex)} 步吗？`)
                          ) {
                            handleJumpToStep(actualIndex);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                          isPast
                            ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        )}
                      >
                        {isPast ? (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            跳转到此处
                          </>
                        ) : (
                          <>
                            <ArrowLeft className="w-3 h-3" />
                            撤销到此
                          </>
                        )}
                      </button>
                    )}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                        isCurrent
                          ? 'bg-indigo-500 text-white'
                          : isPast
                          ? 'bg-slate-300 text-slate-600'
                          : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {actualIndex + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">撤销说明</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>点击操作记录可以展开跳转按钮，快速跳转到指定历史位置</li>
              <li>撤销后可以通过「重做」功能恢复到撤销前的状态</li>
              <li>最多保留 50 条历史记录，超出后会自动删除最早的记录</li>
              <li>撤销操作会同时恢复所有牌的状态（已出/手牌等）</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
