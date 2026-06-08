import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import {
  Play,
  LayoutGrid,
  Lightbulb,
  Undo2,
  Download,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const { initialized, resetGame, getStats } = useGameStore();
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  const stats = initialized ? getStats() : null;

  const navItems = [
    { path: '/', label: '开局', icon: Play, requiresInit: false },
    { path: '/memorize', label: '记牌', icon: LayoutGrid, requiresInit: true },
    { path: '/hints', label: '提示', icon: Lightbulb, requiresInit: true },
    { path: '/undo', label: '撤销', icon: Undo2, requiresInit: true },
    { path: '/export', label: '导出', icon: Download, requiresInit: true },
  ];

  const handleReset = () => {
    if (window.confirm('确定要重新开始吗？当前对局数据将被清除。')) {
      resetGame();
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {showDisclaimer && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <Info className="w-4 h-4" />
              <span>
                <strong>免责声明：</strong>本工具仅供掼蛋记牌练习使用，不联网、不上传数据，严禁用于任何形式的赌博或作弊行为。
              </span>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="text-amber-600 hover:text-amber-800 text-sm"
            >
              知道了
            </button>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                掼
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">掼蛋记牌器</h1>
                <p className="text-xs text-slate-500">纯前端 · 离线使用 · 数据本地存储</p>
              </div>
            </div>

            {stats && (
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-800">{stats.totalRemaining}</div>
                  <div className="text-slate-500">剩余</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{stats.totalPlayed}</div>
                  <div className="text-slate-500">已出</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalInHand}</div>
                  <div className="text-slate-500">手牌</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{stats.levelCard}</div>
                  <div className="text-slate-500">级牌</div>
                </div>
              </div>
            )}

            {initialized && (
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重新开始</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isDisabled = item.requiresInit && !initialized;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={(e) => isDisabled && e.preventDefault()}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all font-medium text-sm',
                      isActive && !isDisabled
                        ? 'bg-emerald-500 text-white shadow-md'
                        : isDisabled
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-600 hover:bg-slate-100'
                    )
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500">
          <p>本工具仅供练习使用，数据保存在本地浏览器中，关闭前请及时导出重要对局记录</p>
        </div>
      </footer>
    </div>
  );
}
