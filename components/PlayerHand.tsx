import React from 'react';
import { Card as CardType, Player } from '../types';
import { Card } from './Card';

interface PlayerHandProps {
  player: Player;
  selectedCardIds: Set<string>;
  onToggleCard: (cardId: string, animal: number) => void;
  onPlay: () => void;
  isTurn: boolean;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ player, selectedCardIds, onToggleCard, onPlay, isTurn }) => {
  const selectedCount = selectedCardIds.size;
  const canPlay = selectedCount > 0 && isTurn;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center gap-4">
      
      {/* Controls */}
      <div className="h-12 flex items-center justify-center gap-4">
        {isTurn ? (
          <button
            onClick={onPlay}
            disabled={!canPlay}
            className={`
              px-8 py-2 rounded-full font-bold text-lg shadow-lg transition-all
              ${canPlay 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:scale-105 active:scale-95' 
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
            `}
          >
            出牌 ({selectedCount})
          </button>
        ) : (
          <div className="text-slate-400 font-medium animate-pulse">
            {player.hand.length === 0 ? "你已出完手牌" : "等待其他玩家..."}
          </div>
        )}
      </div>

      {/* Hand Cards */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 p-2 min-h-[140px]">
        {player.hand.map((card) => (
          <div key={card.id} className="transform transition-transform hover:-translate-y-2">
            <Card
              card={card}
              isSelected={selectedCardIds.has(card.id)}
              onClick={() => isTurn ? onToggleCard(card.id, card.animal) : undefined}
            />
          </div>
        ))}
        {player.hand.length === 0 && (
          <div className="text-slate-500 italic mt-8">你没有手牌了</div>
        )}
      </div>
    </div>
  );
};