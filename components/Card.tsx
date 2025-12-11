import React from 'react';
import { Card as CardType } from '../types';
import { ANIMAL_DATA } from '../constants';

interface CardProps {
  card: CardType;
  isSelected?: boolean;
  onClick?: () => void;
  isSmall?: boolean;
  isFaceDown?: boolean;
}

export const Card: React.FC<CardProps> = ({ card, isSelected, onClick, isSmall, isFaceDown }) => {
  if (isFaceDown) {
    return (
      <div 
        className={`
          ${isSmall ? 'w-8 h-12' : 'w-16 h-24'} 
          bg-slate-700 border-2 border-slate-500 rounded-md shadow-md
          flex items-center justify-center
        `}
      >
        <span className="text-slate-500 font-bold">K</span>
      </div>
    );
  }

  const data = ANIMAL_DATA[card.animal];

  return (
    <div
      onClick={onClick}
      className={`
        relative
        ${isSmall ? 'w-8 h-12 text-xs' : 'w-20 h-28 text-sm'}
        ${data.color} ${data.textColor}
        rounded-lg shadow-lg border-2
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-400 -translate-y-4' : 'border-black/20'}
        flex flex-col items-center justify-between p-1
        cursor-pointer transition-all duration-200 select-none
        hover:scale-105 hover:z-10
      `}
    >
      <div className="w-full flex justify-between px-1 font-bold">
        <span>{card.animal}</span>
        <span>{card.animal}</span>
      </div>
      <div className={`${isSmall ? 'text-lg' : 'text-3xl'}`}>
        {data.emoji}
      </div>
      <div className="w-full flex justify-between px-1 font-bold rotate-180">
        <span>{card.animal}</span>
        <span>{card.animal}</span>
      </div>
    </div>
  );
};