import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { cn } from '@/lib/utils';
import {
  Download,
  Copy,
  Check,
  AlertTriangle,
  FileJson,
  Calendar,
  Users,
  Crown,
  Play,
  Clock,
  Share2,
  FileDown,
} from 'lucide-react';

export default function Export() {
  const navigate = useNavigate();
  const { cards, exportGame, getStats, playerCount, levelCard, createdAt } = useGameStore();
  const [copied, setCopied] = useState(false);

  const stats = getStats();
  const exportData = useMemo(() => exportGame(), [cards]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      alert('复制失败，请手动复制');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().slice(0, 10);
    a.download = `掼蛋记牌记录_${levelCard}_${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start: number) => {
    const ms = Date.now() - start;
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${seconds}秒`;
    }
    return `${seconds}秒`;
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

  const dataSize = new Blob([exportData]).size;
  const dataSizeKB = (dataSize / 1024).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <FileJson className="w-8 h-8" />
          <h2 className="text-2xl font-bold">导出对局记录</h2>
        </div>
        <p className="text-cyan-100">
          导出当前对局的完整记录，包含所有操作历史和统计数据
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-500" />
          对局概要
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-slate-600">级牌</span>
            </div>
            <div className="text-3xl font-bold text-emerald-600">{levelCard}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-slate-600">玩家数</span>
            </div>
            <div className="text-3xl font-bold text-blue-600">{playerCount}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-slate-600">已出牌</span>
            </div>
            <div className="text-3xl font-bold text-purple-600">{stats.totalPlayed}</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-slate-600">剩余</span>
            </div>
            <div className="text-3xl font-bold text-amber-600">{stats.totalRemaining}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">开始时间</span>
            </div>
            <div className="text-lg font-bold text-slate-800">{formatDate(createdAt)}</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">对局时长</span>
            </div>
            <div className="text-lg font-bold text-slate-800">{formatDuration(createdAt)}</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Share2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">数据包含内容</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>游戏设置（级牌、玩家数、开始时间）</li>
                <li>所有牌的状态（已出、手牌、剩余）</li>
                <li>完整的操作历史记录</li>
                <li>当前统计数据（剩余牌、炸弹可能性等）</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-slate-500" />
            导出数据
            <span className="text-sm font-normal text-slate-500">({dataSizeKB} KB)</span>
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制到剪贴板
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md shadow-blue-500/30"
            >
              <FileDown className="w-4 h-4" />
              下载文件
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-sm font-mono max-h-96 overflow-y-auto">
            <code>{exportData}</code>
          </pre>
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              title="复制"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              title="下载"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">如何使用导出的数据</h3>
        <div className="space-y-4 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-slate-800">备份对局</p>
              <p>下载JSON文件保存到本地，防止浏览器缓存丢失导致数据丢失。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-slate-800">导入恢复</p>
              <p>在开局页面的「导入对局记录」区域粘贴JSON内容，即可恢复对局。</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold flex-shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-slate-800">分享交流</p>
              <p>将记录分享给好友，一起分析牌局，提升掼蛋技巧。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">数据安全提示</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>本工具所有数据仅保存在您的浏览器本地，不会上传到任何服务器</li>
              <li>清理浏览器缓存或更换设备会导致数据丢失，请及时导出重要对局</li>
              <li>导出的JSON文件包含完整对局信息，请妥善保管</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
