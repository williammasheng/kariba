import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card as CardType, User, GameHistoryRecord } from './types';
import { initializeGame, playTurn, getBotMove } from './services/gameEngine';
import { saveGameRecord } from './services/storage';
import { Waterhole } from './components/Waterhole';
import { PlayerHand } from './components/PlayerHand';
import { Card } from './components/Card';
import { Auth } from './components/Auth';
import { History } from './components/History';
import { ANIMAL_DATA } from './constants';

const App: React.FC = () => {
  // Views: 'auth', 'menu', 'game', 'history'
  const [view, setView] = useState<'auth' | 'menu' | 'game' | 'history'>('auth');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  
  // Ref to scroll logs
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.logs]);

  // --- Game Timer Logic ---
  useEffect(() => {
    let interval: number;
    if (view === 'game' && gameState && gameState.gameStatus === 'playing') {
      interval = window.setInterval(() => {
        setGameState(prevState => {
          if (!prevState || prevState.gameStatus !== 'playing') return prevState;
          
          const newState = { ...prevState };
          // Increment timeUsed for the current player
          const currentPlayer = newState.players[newState.currentPlayerIndex];
          currentPlayer.timeUsed += 1;
          
          return newState;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, gameState?.gameStatus, gameState?.currentPlayerIndex]);

  // --- Handle Game End & Save ---
  useEffect(() => {
    if (gameState?.gameStatus === 'finished' && currentUser) {
      // Calculate ranks
      const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
      
      const record: GameHistoryRecord = {
        id: gameState.startTime.toString() + '-' + Math.random().toString(36).substr(2, 5), // Unique ID for DB
        date: Date.now(),
        duration: Math.floor((Date.now() - gameState.startTime) / 1000),
        winnerName: gameState.winner?.name || '平局',
        players: gameState.players.map(p => {
          // Find rank
          const rankIndex = sortedPlayers.findIndex(sp => sp.id === p.id);
          return {
            name: p.name,
            score: p.score,
            rank: rankIndex + 1,
            timeUsed: p.timeUsed,
            isUser: p.isHuman
          };
        })
      };
      
      // Call async save function (fire and forget for UX, or could show saving status)
      saveGameRecord(currentUser.username, record);
    }
  }, [gameState?.gameStatus]);


  // --- Bot Turn Logic ---
  useEffect(() => {
    if (!gameState || gameState.gameStatus !== 'playing') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    if (currentPlayer.isHuman) return;

    // It's a bot's turn. Add a small delay for realism.
    const timer = setTimeout(() => {
      const move = getBotMove(gameState);
      if (move) {
        const nextState = playTurn(gameState, currentPlayer.id, move.cards);
        setGameState(nextState);
      } else {
        console.warn('Bot could not find move', currentPlayer);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameState]);

  // --- Interaction Handlers ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('menu');
  };

  const handleStartGame = () => {
    if (!currentUser) return;
    setGameState(initializeGame(currentUser.username));
    setSelectedCardIds(new Set());
    setView('game');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('auth');
    setGameState(null);
  };

  const handleToggleCard = (cardId: string, animal: number) => {
    const newSelection = new Set(selectedCardIds);
    if (newSelection.size > 0) {
      const firstId = Array.from(newSelection)[0];
      const firstCard = gameState?.players.find(p => p.isHuman)?.hand.find(c => c.id === firstId);
      if (firstCard && firstCard.animal !== animal) {
        setSelectedCardIds(new Set([cardId]));
        return;
      }
    }
    if (newSelection.has(cardId)) {
      newSelection.delete(cardId);
    } else {
      newSelection.add(cardId);
    }
    setSelectedCardIds(newSelection);
  };

  const handlePlayCards = () => {
    if (!gameState) return;
    const human = gameState.players.find(p => p.isHuman);
    if (!human) return;
    const cardsToPlay = human.hand.filter(c => selectedCardIds.has(c.id));
    if (cardsToPlay.length === 0) return;
    const nextState = playTurn(gameState, human.id, cardsToPlay);
    setGameState(nextState);
    setSelectedCardIds(new Set());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Render Views ---

  if (view === 'auth') {
    return <Auth onLogin={handleLogin} />;
  }

  if (view === 'history' && currentUser) {
    return <History user={currentUser} onBack={() => setView('menu')} />;
  }

  if (view === 'menu' && currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700 text-center space-y-6">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            KARIBA
          </h1>
          <p className="text-slate-300 text-lg">欢迎回来, <span className="font-bold text-orange-400">{currentUser.username}</span></p>
          
          <div className="space-y-4 pt-4">
            <button
              onClick={handleStartGame}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg"
            >
              开始新游戏
            </button>
            <button
              onClick={() => setView('history')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-lg transition-all shadow-lg"
            >
              我的历史战绩
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-transparent border border-slate-600 text-slate-400 hover:text-white hover:border-slate-400 py-2 rounded-lg transition-all"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Game View ---

  if (!gameState || !currentUser) return null;

  const humanPlayer = gameState.players.find(p => p.isHuman)!;
  const isHumanTurn = gameState.players[gameState.currentPlayerIndex].id === humanPlayer.id;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-900 overflow-hidden">
      
      {/* Sidebar (Score & Logs) */}
      <div className="w-full md:w-64 md:h-full bg-slate-800 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col z-10">
        <div className="p-4 bg-slate-900/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-orange-400">记分板</h2>
          <button onClick={() => setView('menu')} className="text-xs text-slate-500 hover:text-white underline">退出</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {gameState.players.map((p, idx) => (
             <div 
                key={p.id} 
                className={`
                  p-3 rounded-lg flex flex-col border transition-all duration-300
                  ${gameState.currentPlayerIndex === idx ? 'bg-slate-700 border-orange-500/50 ring-1 ring-orange-500' : 'bg-slate-800 border-slate-700'}
                `}
             >
               <div className="flex justify-between items-center mb-1">
                 <div className={`font-bold text-sm ${p.isHuman ? 'text-blue-400' : 'text-slate-300'}`}>
                   {p.name}
                 </div>
                 <div className="text-2xl font-black text-emerald-500">
                   {p.score}
                 </div>
               </div>
               <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>剩余 {p.hand.length} 张</span>
                  <span>⏳ {formatTime(p.timeUsed)}</span>
               </div>
             </div>
           ))}
        </div>

        {/* Game Log */}
        <div className="h-48 bg-black/40 border-t border-slate-700 flex flex-col">
          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">对局日志</div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 text-sm scrollbar-hide">
            {gameState.logs.slice().reverse().map((log) => (
               <div key={log.id} className={`
                 ${log.type === 'capture' ? 'text-red-300 font-bold' : ''}
                 ${log.type === 'action' ? 'text-slate-300' : ''}
                 ${log.type === 'info' ? 'text-yellow-400 italic' : ''}
               `}>
                 <span className="opacity-50 text-xs mr-2">[{new Date(parseInt(log.id.substring(0, 13)) || Date.now()).toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}]</span>
                 {log.message}
               </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Top Info Bar (Turn Indicator) */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-center z-10 pointer-events-none">
          <div className={`
             px-6 py-2 rounded-full backdrop-blur-md border shadow-lg transition-all duration-500
             ${isHumanTurn 
                ? 'bg-blue-600/80 border-blue-400 text-white scale-110' 
                : 'bg-slate-800/80 border-slate-600 text-slate-400'}
          `}>
             {isHumanTurn ? "轮到你了" : `轮到 ${gameState.players[gameState.currentPlayerIndex].name} ...`}
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 flex items-center justify-center p-4 min-h-[400px]">
          <Waterhole board={gameState.board} />
        </div>

        {/* Player Hand Area */}
        <div className="bg-slate-800/50 backdrop-blur-sm border-t border-slate-700">
          <PlayerHand
            player={humanPlayer}
            selectedCardIds={selectedCardIds}
            onToggleCard={handleToggleCard}
            onPlay={handlePlayCards}
            isTurn={isHumanTurn && gameState.gameStatus === 'playing'}
          />
        </div>

        {/* Game Over Modal */}
        {gameState.gameStatus === 'finished' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
             <div className="bg-slate-800 border-2 border-orange-500 p-8 rounded-2xl max-w-lg w-full text-center shadow-[0_0_50px_rgba(249,115,22,0.3)]">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-white mb-2">游戏结束！</h2>
                <p className="text-xl text-orange-400 mb-6">
                  获胜者：<span className="font-black">{gameState.winner?.name}</span>
                </p>
                
                <div className="bg-slate-900 rounded-lg p-4 mb-6">
                  {gameState.players
                    .sort((a,b) => b.score - a.score)
                    .map((p, idx) => (
                      <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0">
                         <div className="flex items-center gap-2">
                            <span className="text-slate-500 font-mono w-6">{idx + 1}.</span>
                            <span className={p.id === humanPlayer.id ? 'text-blue-400 font-bold' : 'text-slate-300'}>{p.name}</span>
                         </div>
                         <div className="text-right">
                           <div className="font-bold text-white">{p.score} 分</div>
                           <div className="text-xs text-slate-500">耗时 {formatTime(p.timeUsed)}</div>
                         </div>
                      </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setView('menu')}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    返回菜单
                  </button>
                  <button 
                    onClick={handleStartGame}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    再来一局
                  </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;