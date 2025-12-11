import React from 'react';
import { BoardSlot, Card as CardType } from '../types';
import { ANIMAL_DATA } from '../constants';
import { Card } from './Card';

interface WaterholeProps {
  board: BoardSlot[];
}

export const Waterhole: React.FC<WaterholeProps> = ({ board }) => {
  // We need to position 8 items in a circle.
  // Angle per item = 360 / 8 = 45 degrees.
  // We want 1 at the top. Top is -90 deg in CSS usually, or we use calculated coords.
  
  const radius = 140; // px
  const centerX = 160;
  const centerY = 160;

  return (
    <div className="relative w-[320px] h-[320px] md:w-[450px] md:h-[450px] mx-auto rounded-full bg-slate-800 border-4 border-slate-700 shadow-2xl overflow-visible">
      
      {/* Center Water */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 md:w-32 md:h-32 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-slate-500 font-bold opacity-20 text-4xl">
        水源
      </div>

      {board.map((slot, index) => {
        // Correct rotation so 1 is at top (index 0). 
        // Index 0 (Animal 1) should be at -90deg (Top).
        // Each step adds 45deg.
        const angleDeg = (index * 45) - 90; 
        const angleRad = (angleDeg * Math.PI) / 180;
        
        // Responsive radius calculation for positioning
        const isMobile = window.innerWidth < 768;
        const r = isMobile ? 120 : 170;
        const cX = isMobile ? 160 : 225;
        const cY = isMobile ? 160 : 225;

        const left = cX + r * Math.cos(angleRad);
        const top = cY + r * Math.sin(angleRad);

        const animalData = ANIMAL_DATA[slot.animal];
        const count = slot.cards.length;
        const isDanger = count >= 3;

        return (
          <div
            key={slot.animal}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
            style={{ left: `${left}px`, top: `${top}px` }}
          >
            {/* Slot Container */}
            <div className={`
              relative flex flex-col items-center justify-center
              w-16 h-16 md:w-20 md:h-20
              rounded-full border-2 
              ${isDanger ? 'border-red-500 bg-red-500/20 animate-pulse' : 'border-slate-600 bg-slate-900/80'}
            `}>
              {/* Number Label */}
              <div className={`absolute -top-3 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-white border border-slate-600 z-20`}>
                {slot.animal} {animalData.emoji}
              </div>

              {/* Stack of Cards */}
              <div className="relative w-full h-full flex items-center justify-center">
                {count === 0 && (
                  <div className="text-slate-600 text-xs">空</div>
                )}
                {slot.cards.map((card, idx) => (
                  <div 
                    key={card.id}
                    className="absolute transition-all duration-300"
                    style={{ 
                      transform: `translateY(-${idx * 4}px) rotate(${idx * 2 - (count * 1)}deg)`,
                      zIndex: idx
                    }}
                  >
                    <Card card={card} isSmall={true} />
                  </div>
                ))}
              </div>

              {/* Count Badge */}
              {count > 0 && (
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white text-slate-900 rounded-full flex items-center justify-center font-bold text-xs shadow-md border border-slate-300 z-30">
                  {count}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};