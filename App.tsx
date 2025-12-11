import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Card as CardType } from './types';
import { initializeGame, playTurn, getBotMove } from './services/gameEngine';
import { Waterhole } from './components/Waterhole';
import { PlayerHand } from './components/PlayerHand';
import { Card } from './components/Card';
import { ANIMAL_DATA } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [humanName, setHumanName] = useState('Explorer');
  
  // Ref to scroll logs
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.logs]);

  // --- Initial Setup ---
  const startGame = () => {
    setGameState(initializeGame(humanName));
    setSelectedCardIds(new Set());
  };

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
        // Fallback (shouldn't happen with correct logic, but prevents stuck state)
        // Pass turn logic if we implemented passing (Game doesn't allow passing if you have cards)
        // But for Kariba, you always have cards until end.
        console.warn('Bot could not find move', currentPlayer);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameState]);

  // --- Human Interaction ---
  const handleToggleCard = (cardId: string, animal: number) => {
    const newSelection = new Set(selectedCardIds);
    
    // Logic: In Kariba, you must play cards of the SAME number.
    // If selecting a new number, clear previous selection.
    // Check if we already have cards selected
    if (newSelection.size > 0) {
      const firstId = Array.from(newSelection)[0];
      const firstCard = gameState?.players.find(p => p.isHuman)?.hand.find(c => c.id === firstId);
      
      if (firstCard && firstCard.animal !== animal) {
        // Selected a different animal, reset selection to just this one
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

  // --- Renders ---

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-xl shadow-2xl p-8 border border-slate-700 text-center space-y-6">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            KARIBA
          </h1>
          <p className="text-slate-300">
            Animals are gathering at the waterhole. Can you scare away the smaller ones?
          </p>
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500 uppercase">Enter Name</label>
            <input
              type="text"
              value={humanName}
              onChange={(e) => setHumanName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Your Name"
            />
          </div>
          <button
            onClick={startGame}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105"
          >
            START GAME
          </button>
          
          <div className="text-xs text-slate-500 pt-4 border-t border-slate-700">
             <p className="font-bold mb-1">Rules:</p>
             <ul className="text-left space-y-1 list-disc pl-4">
               <li>Play cards of the same number.</li>
               <li>If a pile has 3+ cards, it chases the closest lower number.</li>
               <li>Exception: 🐭 (1) chases 🐘 (8).</li>
               <li>Most cards collected wins!</li>
             </ul>
          </div>
        </div>
      </div>
    );
  }

  const humanPlayer = gameState.players.find(p => p.isHuman)!;
  const isHumanTurn = gameState.players[gameState.currentPlayerIndex].id === humanPlayer.id;

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-900 overflow-hidden">
      
      {/* Sidebar (Score & Logs) */}
      <div className="w-full md:w-64 md:h-full bg-slate-800 border-b md:border-b-0 md:border-r border-slate-700 flex flex-col z-10">
        <div className="p-4 bg-slate-900/50">
          <h2 className="text-xl font-bold text-orange-400">Scoreboard</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
           {gameState.players.map((p, idx) => (
             <div 
                key={p.id} 
                className={`
                  p-3 rounded-lg flex items-center justify-between border
                  ${gameState.currentPlayerIndex === idx ? 'bg-slate-700 border-orange-500/50 ring-1 ring-orange-500' : 'bg-slate-800 border-slate-700'}
                `}
             >
               <div>
                 <div className={`font-bold text-sm ${p.isHuman ? 'text-blue-400' : 'text-slate-300'}`}>
                   {p.name}
                 </div>
                 <div className="text-xs text-slate-500">
                    {p.id === humanPlayer.id ? 'You' : 'Bot'} • {p.hand.length} cards left
                 </div>
               </div>
               <div className="text-2xl font-black text-emerald-500">
                 {p.score}
               </div>
             </div>
           ))}
        </div>

        {/* Game Log */}
        <div className="h-48 bg-black/40 border-t border-slate-700 flex flex-col">
          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Activity Log</div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 text-sm scrollbar-hide">
            {gameState.logs.slice().reverse().map((log) => (
               <div key={log.id} className={`
                 ${log.type === 'capture' ? 'text-red-300 font-bold' : ''}
                 ${log.type === 'action' ? 'text-slate-300' : ''}
                 ${log.type === 'info' ? 'text-yellow-400 italic' : ''}
               `}>
                 <span className="opacity-50 text-xs mr-2">[{new Date(parseInt(log.id) || Date.now()).toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}]</span>
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
             {isHumanTurn ? "YOUR TURN" : `${gameState.players[gameState.currentPlayerIndex].name}'s Turn...`}
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
                <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
                <p className="text-xl text-orange-400 mb-6">
                  Winner: <span className="font-black">{gameState.winner?.name}</span>
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
                         <div className="font-bold text-white">{p.score} cards</div>
                      </div>
                  ))}
                </div>

                <button 
                  onClick={startGame}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-full transition-all"
                >
                  Play Again
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;