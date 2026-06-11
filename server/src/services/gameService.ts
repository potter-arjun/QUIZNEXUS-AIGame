import { Question, QuestionCategory, generateQuestion } from './questionEngine';
import { hashQuestion, getSeenHashes } from './questionHistory';

export interface Player {
  id: string; // Socket ID
  userId: string; // Database User ID (or guest id)
  username: string;
  avatarUrl: string;
  isHost: boolean;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  totalResponseTime: number; // in ms
  streak: number;
  isReady: boolean;
  team?: 'Red' | 'Blue';
  doublePointsActive?: boolean;
  lives?: number;
  eliminated?: boolean;
}

export interface Room {
  code: string;
  mode: 'classic' | 'rapid' | 'tournament' | 'team' | 'classroom' | 'puzzle' | 'battle_royale';
  customTopic?: string;
  status: 'lobby' | 'playing' | 'ended';
  maxPlayers: number;
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | 'hi' | 'bilingual';
  isPrivate: boolean;
  players: Record<string, Player>;
  spectators: string[]; // Socket IDs
  currentQuestionIndex: number;
  questions: Question[];
  currentQuestionStartTime: number;
  answersReceivedInCurrentRound: Record<string, {
    answer: string;
    responseTime: number;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
}

// In-memory room storage. In a multi-node environment, this can be synced via Redis.
const rooms: Record<string, Room> = {};

// Helper to generate a unique 6-character room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[code]);
  return code;
}

export const gameService = {
  createRoom(
    mode: Room['mode'],
    difficulty: Room['difficulty'],
    language: Room['language'],
    questionCount: number,
    maxPlayers: number,
    isPrivate: boolean,
    customTopic?: string
  ): Room {
    const code = generateRoomCode();
    const room: Room = {
      code,
      mode,
      customTopic: customTopic?.trim() || undefined,
      status: 'lobby',
      maxPlayers: maxPlayers || 10,
      questionCount: questionCount || 10,
      difficulty: difficulty || 'medium',
      language: language || 'en',
      isPrivate: !!isPrivate,
      players: {},
      spectators: [],
      currentQuestionIndex: -1,
      questions: [],
      currentQuestionStartTime: 0,
      answersReceivedInCurrentRound: {}
    };
    rooms[code] = room;
    return room;
  },

  getRoom(code: string): Room | undefined {
    return rooms[code.toUpperCase()];
  },

  getAllPublicRooms(): Room[] {
    return Object.values(rooms).filter(r => !r.isPrivate && r.status === 'lobby');
  },

  getAllRooms(): Room[] {
    return Object.values(rooms);
  },

  joinRoom(
    code: string,
    socketId: string,
    playerInfo: { userId: string; username: string; avatarUrl: string; isSpectator?: boolean }
  ): { room: Room; player?: Player; spectator?: boolean } {
    const room = this.getRoom(code);
    if (!room) {
      throw new Error("Room not found");
    }

    if (playerInfo.isSpectator) {
      room.spectators.push(socketId);
      return { room, spectator: true };
    }

    const playerKeys = Object.keys(room.players);
    if (playerKeys.length >= room.maxPlayers) {
      throw new Error("Room is full");
    }

    // Is this the first player? They are the host.
    const isHost = playerKeys.length === 0;

    const newPlayer: Player = {
      id: socketId,
      userId: playerInfo.userId,
      username: playerInfo.username,
      avatarUrl: playerInfo.avatarUrl,
      isHost,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      totalResponseTime: 0,
      streak: 0,
      isReady: isHost,
      team: room.mode === 'team' ? (playerKeys.length % 2 === 0 ? 'Red' : 'Blue') : undefined,
      lives: room.mode === 'battle_royale' ? 3 : undefined,
      eliminated: false,
    };

    room.players[socketId] = newPlayer;
    return { room, player: newPlayer };
  },

  leaveRoom(code: string, socketId: string): Room | null {
    const room = this.getRoom(code);
    if (!room) return null;

    if (room.players[socketId]) {
      const leavingPlayer = room.players[socketId];
      delete room.players[socketId];

      const remainingPlayers = Object.keys(room.players);
      if (remainingPlayers.length === 0) {
        // Delete room if empty
        delete rooms[room.code];
        return null;
      }

      // If the leaving player was the host, assign a new host
      if (leavingPlayer.isHost) {
        const newHostId = remainingPlayers[0];
        room.players[newHostId].isHost = true;
        room.players[newHostId].isReady = true;
      }
    } else {
      // Check spectators
      room.spectators = room.spectators.filter(id => id !== socketId);
    }

    return room;
  },

  toggleReady(code: string, socketId: string): Room {
    const room = this.getRoom(code);
    if (!room) throw new Error("Room not found");
    const player = room.players[socketId];
    if (player) {
      player.isReady = !player.isReady;
    }
    return room;
  },

  changeTeam(code: string, socketId: string, team: 'Red' | 'Blue'): Room {
    const room = this.getRoom(code);
    if (!room) throw new Error("Room not found");
    const player = room.players[socketId];
    if (player && room.mode === 'team') {
      player.team = team;
    }
    return room;
  },

  async startGame(code: string): Promise<Room> {
    const room = this.getRoom(code);
    if (!room) throw new Error("Room not found");

    // Fetch question hashes already seen by every player across all past games
    const playerUserIds = Object.values(room.players).map(p => p.userId).filter(Boolean);
    const historicallySeen = await getSeenHashes(playerUserIds);

    // Generate questions, rejecting duplicates within this room AND from player history
    const questionsList: Question[] = [];
    const seenThisGame = new Set<string>();

    for (let i = 0; i < room.questionCount; i++) {
      let cat: QuestionCategory;
      if (room.mode === 'puzzle') {
        cat = 'Puzzle';
      } else {
        const pct = (i / room.questionCount) * 100;
        if      (pct < 20) cat = 'Mental Ability';
        else if (pct < 35) cat = 'Figure & Design Reasoning';
        else if (pct < 50) cat = 'Mathematics';
        else if (pct < 62) cat = 'General Knowledge';
        else if (pct < 74) cat = 'Science & Technology';
        else if (pct < 80) cat = 'Sports';
        else if (pct < 87) cat = 'Information Technology';
        else if (pct < 94) cat = 'AI Technology';
        else               cat = 'Current Affairs & Fun Facts';
      }

      // Up to 15 attempts: skip questions seen in this room OR in any player's history
      let q: Question | null = null;
      for (let attempt = 0; attempt < 15; attempt++) {
        const candidate = await generateQuestion(cat, room.difficulty, room.language, room.customTopic);
        const hash = hashQuestion(candidate.question);
        if (!seenThisGame.has(candidate.question) && !historicallySeen.has(hash)) {
          q = candidate;
          break;
        }
      }
      // Pool exhausted — accept a repeat rather than blocking indefinitely
      if (q === null) {
        q = await generateQuestion(cat, room.difficulty, room.language);
      }
      seenThisGame.add(q.question);
      historicallySeen.add(hashQuestion(q.question)); // prevent same question twice this session
      questionsList.push(q);
    }

    room.questions = questionsList;
    room.status = 'playing';
    room.currentQuestionIndex = 0;
    room.currentQuestionStartTime = Date.now();
    room.answersReceivedInCurrentRound = {};

    // Reset player scores for the match
    for (const id in room.players) {
      room.players[id].score = 0;
      room.players[id].correctAnswers = 0;
      room.players[id].totalAnswers = 0;
      room.players[id].totalResponseTime = 0;
      room.players[id].streak = 0;
      room.players[id].lives = room.mode === 'battle_royale' ? 3 : undefined;
      room.players[id].eliminated = false;
    }

    return room;
  },

  submitAnswer(
    code: string,
    socketId: string,
    answer: string
  ): {
    room: Room;
    player: Player;
    isCorrect: boolean;
    pointsEarned: number;
    explanation: string;
    justEliminated: boolean;
  } {
    const room = this.getRoom(code);
    if (!room || room.status !== 'playing') {
      throw new Error("Room is not in active play");
    }

    const player = room.players[socketId];
    if (!player) {
      throw new Error("Player not in room");
    }

    // Prevent double submissions
    if (room.answersReceivedInCurrentRound[socketId]) {
      throw new Error("Answer already submitted for this round");
    }

    // Eliminated players cannot submit in battle royale
    if (room.mode === 'battle_royale' && player.eliminated) {
      throw new Error("Eliminated players cannot submit answers");
    }

    const currentQuestion = room.questions[room.currentQuestionIndex];
    const responseTime = Date.now() - room.currentQuestionStartTime;
    const isCorrect = currentQuestion.correctAnswer === answer.toUpperCase();

    let pointsEarned = 0;
    let justEliminated = false;

    if (isCorrect) {
      // Count how many correct answers were already received in this round
      const correctAnswersThisRound = Object.values(room.answersReceivedInCurrentRound).filter(
        a => a.isCorrect
      ).length;

      // Base scoring:
      // Fastest Correct Answer: +10 points
      // Second Correct: +7 points
      // Third Correct: +5 points
      // Remaining Correct: +3 points
      if (correctAnswersThisRound === 0) {
        pointsEarned += 10;
        // Fastest finger bonus
        pointsEarned += 5;
      } else if (correctAnswersThisRound === 1) {
        pointsEarned += 7;
      } else if (correctAnswersThisRound === 2) {
        pointsEarned += 5;
      } else {
        pointsEarned += 3;
      }

      // Streak tracking: 5 Correct Streak = +20 points
      player.streak += 1;
      player.correctAnswers += 1;
      if (player.streak > 0 && player.streak % 5 === 0) {
        pointsEarned += 20; // Streak Bonus
      }

      // Rapid Fire mode doubles all earned points
      if (room.mode === 'rapid') {
        pointsEarned *= 2;
      }

      // Puzzle mode: +5 bonus to first correct (reward harder thinking)
      if (room.mode === 'puzzle' && correctAnswersThisRound === 0) {
        pointsEarned += 5;
      }

      // Double Points power-up: 2× multiplier on all earned points this answer
      if (player.doublePointsActive) {
        pointsEarned *= 2;
        player.doublePointsActive = false;
      }
    } else {
      player.streak = 0;
      // Battle Royale: wrong answer costs a life
      if (room.mode === 'battle_royale') {
        player.lives = Math.max(0, (player.lives ?? 3) - 1);
        if (player.lives <= 0) {
          player.eliminated = true;
          justEliminated = true;
        }
      }
    }

    player.totalAnswers += 1;
    player.totalResponseTime += responseTime;
    player.score += pointsEarned;

    room.answersReceivedInCurrentRound[socketId] = {
      answer,
      responseTime,
      isCorrect,
      pointsEarned
    };

    return {
      room,
      player,
      isCorrect,
      pointsEarned,
      explanation: currentQuestion.explanation,
      justEliminated
    };
  },

  nextQuestion(code: string): { room: Room; hasMoreQuestions: boolean } {
    const room = this.getRoom(code);
    if (!room) throw new Error("Room not found");

    const nextIndex = room.currentQuestionIndex + 1;
    const hasMoreQuestions = nextIndex < room.questions.length;

    if (hasMoreQuestions) {
      room.currentQuestionIndex = nextIndex;
      room.currentQuestionStartTime = Date.now();
      room.answersReceivedInCurrentRound = {};
    } else {
      room.status = 'ended';
      
      // Calculate Perfect Round Bonus (+10 points) if they got 100% correct answers
      for (const id in room.players) {
        const p = room.players[id];
        if (p.totalAnswers > 0 && p.correctAnswers === p.totalAnswers) {
          p.score += 10; // Perfect Round Bonus
        }
      }
    }

    return { room, hasMoreQuestions };
  },

  getLeaderboard(code: string): { player: Player; accuracy: number; avgResponseTime: number }[] {
    const room = this.getRoom(code);
    if (!room) return [];

    return Object.values(room.players)
      .map(p => {
        const accuracy = p.totalAnswers > 0 ? (p.correctAnswers / p.totalAnswers) * 100 : 0;
        const avgResponseTime = p.totalAnswers > 0 ? (p.totalResponseTime / p.totalAnswers) / 1000 : 0; // seconds
        return {
          player: p,
          accuracy,
          avgResponseTime
        };
      })
      .sort((a, b) => {
        // Battle Royale: survivors outrank eliminated players
        if (a.player.eliminated !== b.player.eliminated) {
          return (a.player.eliminated ? 1 : 0) - (b.player.eliminated ? 1 : 0);
        }
        // Then: highest score → highest accuracy → fastest response
        if (b.player.score !== a.player.score) return b.player.score - a.player.score;
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
        return a.avgResponseTime - b.avgResponseTime;
      });
  }
};
