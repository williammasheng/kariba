import { AnimalType } from './types';

export const ANIMAL_DATA: Record<AnimalType, { name: string; emoji: string; color: string; textColor: string }> = {
  [AnimalType.Mouse]: { name: "老鼠", emoji: "🐭", color: "bg-gray-400", textColor: "text-gray-900" },
  [AnimalType.Meerkat]: { name: "狐猴", emoji: "🐿️", color: "bg-yellow-400", textColor: "text-yellow-900" },
  [AnimalType.Zebra]: { name: "斑马", emoji: "🦓", color: "bg-white", textColor: "text-black" },
  [AnimalType.Giraffe]: { name: "长颈鹿", emoji: "🦒", color: "bg-orange-300", textColor: "text-orange-900" },
  [AnimalType.Ostrich]: { name: "鸵鸟", emoji: "🐦", color: "bg-blue-400", textColor: "text-blue-900" },
  [AnimalType.Cheetah]: { name: "猎豹", emoji: "🐆", color: "bg-red-500", textColor: "text-white" },
  [AnimalType.Rhino]: { name: "犀牛", emoji: "🦏", color: "bg-emerald-700", textColor: "text-emerald-100" },
  [AnimalType.Elephant]: { name: "大象", emoji: "🐘", color: "bg-purple-600", textColor: "text-purple-100" },
};

export const TOTAL_CARDS_PER_ANIMAL = 8;
export const HAND_SIZE = 5;
export const MAX_PLAYERS = 4;