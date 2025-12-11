import React, { useEffect, useState } from 'react';
import { GameHistoryRecord, User } from '../types';
import { getGameHistory } from '../services/storage';

interface HistoryProps {
  user: User;
  onBack: () => void;
}

export const History: React.FC<HistoryProps> = ({ user, onBack }) => {
  const [history, setHistory] = useState<GameHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const data = await getGameHistory(user.username);
      setHistory(data);
      setIsLoading(false);
    };
    fetchData();
  }, [user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分${secs}秒`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-orange-400">我的对局历史</h2>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm"
          >
            返回主菜单
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
             <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mb-2"></div>
             <div className="text-slate-500">正在加载战绩...</div>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700 text-slate-500">
            暂无对局记录。快去开始一把游戏吧！
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((game) => (
              <div key={game.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-slate-900/50 p-4 flex flex-wrap justify-between items-center border-b border-slate-700 gap-2">
                  <div className="flex gap-4 text-sm text-slate-400">
                    <span>📅 {new Date(game.date).toLocaleString()}</span>
                    <span>⏱️ 总时长: {formatTime(game.duration)}</span>
                  </div>
                  <div className="text-sm font-bold">
                    获胜者: <span className="text-emerald-400">{game.winnerName}</span>
                  </div>
                </div>
                
                <div className="p-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-700">
                        <th className="pb-2">名次</th>
                        <th className="pb-2">玩家</th>
                        <th className="pb-2">得分</th>
                        <th className="pb-2">思考用时</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game.players.sort((a, b) => a.rank - b.rank).map((player) => (
                        <tr key={player.name} className={`
                          border-b border-slate-700/50 last:border-0 
                          ${player.isUser ? 'bg-orange-500/10' : ''}
                        `}>
                          <td className="py-2 pl-2 font-mono">
                            {player.rank === 1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : player.rank}
                          </td>
                          <td className={`py-2 ${player.isUser ? 'text-orange-400 font-bold' : 'text-slate-300'}`}>
                            {player.name} {player.isUser && '(我)'}
                          </td>
                          <td className="py-2 font-bold text-white">{player.score}</td>
                          <td className="py-2 text-slate-400">{formatTime(player.timeUsed)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};