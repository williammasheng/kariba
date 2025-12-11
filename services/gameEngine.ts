import { AnimalType, Card, GameState, Player, BoardSlot, GameLog } from '../types';
import { ANIMAL_DATA, TOTAL_CARDS_PER_ANIMAL, HAND_SIZE } from '../constants';

// --- Helper Functions ---

export const generateDeck = (): Card[] => {
  const deck: Card[] = [];
  const animals = [1, 2, 3, 4, 5, 6, 7, 8] as AnimalType[];
  
  animals.forEach(animal => {
    for (let i = 0; i < TOTAL_CARDS_PER_ANIMAL; i++) {
      deck.push({
        id: `${animal}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        animal: animal
      });
    }
  });

  // Fisher-Yates Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
};

export const initializeGame = (humanName: string): GameState => {
  const deck = generateDeck();
  const players: Player[] = [];
  const playerNames = ["电脑 1", "电脑 2", "电脑 3"];

  // Create Human Player
  players.push({
    id: 'p1',
    name: humanName || '玩家 1',
    isHuman: true,
    hand: [],
    scorePile: [],
    score: 0,
    timeUsed: 0
  });

  // Create Bots (Total 4 players for best balance)
  for (let i = 0; i < 3; i++) {
    players.push({
      id: `bot-${i}`,
      name: playerNames[i],
      isHuman: false,
      hand: [],
      scorePile: [],
      score: 0,
      timeUsed: 0
    });
  }

  // Initial Deal
  players.forEach(player => {
    for (let i = 0; i < HAND_SIZE; i++) {
      if (deck.length > 0) {
        player.hand.push(deck.pop()!);
      }
    }
    // Sort hand for better UX
    player.hand.sort((a, b) => a.animal - b.animal);
  });

  // Initialize Board (1-8)
  const board: BoardSlot[] = [];
  for (let i = 1; i <= 8; i++) {
    board.push({
      animal: i as AnimalType,
      cards: []
    });
  }

  return {
    players,
    currentPlayerIndex: 0,
    board,
    deck,
    gameStatus: 'playing',
    winner: null,
    logs: [{ id: 'init', message: '游戏开始！请努力赢得更多卡牌。', type: 'info' }],
    turnCount: 1,
    startTime: Date.now()
  };
};

// --- Core Game Logic ---

export const playTurn = (state: GameState, playerId: string, cardsToPlay: Card[]): GameState => {
  const newState = { ...state };
  const playerIndex = newState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return state;
  
  const player = newState.players[playerIndex];
  const animalType = cardsToPlay[0].animal;
  const boardSlotIndex = newState.board.findIndex(b => b.animal === animalType);
  const boardSlot = newState.board[boardSlotIndex];

  // 1. Log Action
  newState.logs.unshift({
    id: Date.now().toString(),
    message: `${player.name} 打出了 ${cardsToPlay.length} 张${ANIMAL_DATA[animalType].name}。`,
    type: 'action'
  });

  // 2. Remove cards from hand
  const cardIdsToRemove = new Set(cardsToPlay.map(c => c.id));
  player.hand = player.hand.filter(c => !cardIdsToRemove.has(c.id));

  // 3. Add cards to board
  boardSlot.cards.push(...cardsToPlay);

  // 4. CHECK CAPTURE LOGIC
  // If the pile for this animal is >= 3, it attacks.
  if (boardSlot.cards.length >= 3) {
    let capturedCards: Card[] = [];
    let capturedAnimalName = '';

    // Special Rule: Mouse (1) chases Elephant (8)
    if (animalType === AnimalType.Mouse) {
      // Mouse only chases Elephant.
      const elephantSlot = newState.board.find(b => b.animal === AnimalType.Elephant);
      if (elephantSlot && elephantSlot.cards.length > 0) {
        capturedCards = [...elephantSlot.cards];
        capturedAnimalName = ANIMAL_DATA[AnimalType.Elephant].name;
        elephantSlot.cards = [];
      }
    } else {
      // Standard Rule: Chases closest lower number
      // Look downwards from current animal - 1 down to 1
      for (let i = animalType - 1; i >= 1; i--) {
        const targetSlot = newState.board.find(b => b.animal === i);
        if (targetSlot && targetSlot.cards.length > 0) {
          capturedCards = [...targetSlot.cards];
          capturedAnimalName = ANIMAL_DATA[i].name;
          targetSlot.cards = [];
          break; // Only captures the closest single pile
        }
      }
    }

    if (capturedCards.length > 0) {
      player.scorePile.push(...capturedCards);
      player.score = player.scorePile.length;
      newState.logs.unshift({
        id: Date.now().toString() + 'cap',
        message: `${ANIMAL_DATA[animalType].name} 吓跑了 ${capturedCards.length} 张${capturedAnimalName}！`,
        type: 'capture'
      });
    }
  }

  // 5. Refill Hand
  while (player.hand.length < HAND_SIZE && newState.deck.length > 0) {
    player.hand.push(newState.deck.pop()!);
  }
  player.hand.sort((a, b) => a.animal - b.animal);

  // 6. Check Game End
  const isGameEnd = newState.deck.length === 0 && newState.players.every(p => p.hand.length === 0);

  if (isGameEnd) {
    newState.gameStatus = 'finished';
    // Determine winner
    let maxScore = -1;
    let winners: Player[] = [];
    newState.players.forEach(p => {
      if (p.score > maxScore) {
        maxScore = p.score;
        winners = [p];
      } else if (p.score === maxScore) {
        winners.push(p);
      }
    });
    newState.winner = winners[0]; // Simple tie-break: first player found (could add shared victory logic)
    newState.logs.unshift({
      id: 'end',
      message: `游戏结束！获胜者：${winners.map(w => w.name).join(', ')}，得分：${maxScore} 张卡牌。`,
      type: 'info'
    });
  } else {
    // 7. Advance Turn
    // Logic: Skip players who have no cards (only possible when deck is empty)
    let nextIndex = (newState.currentPlayerIndex + 1) % newState.players.length;
    let loopCount = 0;

    // While the next player has no cards, keep skipping.
    // Safety check: loopCount ensures we don't freeze if logic is wrong, 
    // though isGameEnd check above should prevent infinite loop.
    while (newState.players[nextIndex].hand.length === 0 && loopCount < newState.players.length) {
      newState.logs.unshift({
        id: Date.now().toString() + 'skip',
        message: `${newState.players[nextIndex].name} 没有手牌，跳过回合。`,
        type: 'info'
      });
      nextIndex = (nextIndex + 1) % newState.players.length;
      loopCount++;
    }

    newState.currentPlayerIndex = nextIndex;
    newState.turnCount++;
  }

  return newState;
};

// --- AI Logic ---

export const getBotMove = (state: GameState): { cards: Card[] } | null => {
  const currentPlayer = state.players[state.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.isHuman) return null;

  // Group hand by animal
  const groups: Record<number, Card[]> = {};
  currentPlayer.hand.forEach(c => {
    if (!groups[c.animal]) groups[c.animal] = [];
    groups[c.animal].push(c);
  });

  // Strategy 1: Look for immediate captures
  for (const animalStr in groups) {
    const animal = parseInt(animalStr) as AnimalType;
    const cards = groups[animal];
    
    // Simulate board state
    const boardSlot = state.board.find(b => b.animal === animal);
    if (!boardSlot) continue;

    const futureSize = boardSlot.cards.length + cards.length;
    if (futureSize >= 3) {
      // Would this actually capture something?
      let wouldCapture = false;
      if (animal === AnimalType.Mouse) {
        const elephant = state.board.find(b => b.animal === AnimalType.Elephant);
        if (elephant && elephant.cards.length > 0) wouldCapture = true;
      } else {
         for (let i = animal - 1; i >= 1; i--) {
            const target = state.board.find(b => b.animal === i);
            if (target && target.cards.length > 0) {
              wouldCapture = true;
              break;
            }
         }
      }

      if (wouldCapture) {
        return { cards }; // Play all cards of this type to capture
      }
    }
  }

  // Strategy 2: If no capture, play the largest set to build pressure
  // Or play high numbers (harder to capture)
  let bestMove: Card[] = [];
  let maxLen = -1;

  for (const animalStr in groups) {
    const cards = groups[animalStr];
    if (cards.length > maxLen) {
      maxLen = cards.length;
      bestMove = cards;
    } else if (cards.length === maxLen) {
      // Tie breaker: prefer smaller numbers (defensive) or random
      if (Math.random() > 0.5) bestMove = cards;
    }
  }

  return { cards: bestMove };
};
