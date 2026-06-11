'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export interface Player {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string;
  isHost: boolean;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  totalResponseTime: number;
  streak: number;
  isReady: boolean;
  team?: 'Red' | 'Blue';
  lives?: number;
  eliminated?: boolean;
}

export interface Question {
  question: string;
  options: string[];
  type: string;
  category: string;
  questionSvg?: string;
}

export interface RoomState {
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
  spectators: string[];
  currentQuestionIndex: number;
  questions?: Question[];
}

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
}

export interface RoundResults {
  correctAnswer: string;
  explanation: string;
  answers: Record<string, {
    answer: string;
    responseTime: number;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
  leaderboard: { player: Player; accuracy: number; avgResponseTime: number }[];
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  roomState: RoomState | null;
  publicRooms: RoomState[];
  chatMessages: ChatMessage[];
  currentQuestion: Question | null;
  questionIndex: number;
  totalQuestions: number;
  timerDuration: number;
  roundResults: RoundResults | null;
  gameOverState: { leaderboard: any[]; winner: any } | null;
  gamePreparing: boolean;
  answerProgress: { answered: number; total: number } | null;
  eliminatedOptions: string[];
  playerEliminated: { socketId: string; username: string; survivorCount: number } | null;
  usePowerup: (type: 'fifty_fifty' | 'double_points') => void;
  rematch: () => void;
  createRoom: (config: {
    mode: string;
    difficulty: string;
    language: string;
    questionCount: number;
    maxPlayers: number;
    isPrivate: boolean;
    customTopic?: string;
  }) => void;
  joinRoom: (roomCode: string, isSpectator?: boolean) => void;
  leaveRoom: () => void;
  toggleReady: () => void;
  switchTeam: (team: 'Red' | 'Blue') => void;
  startGame: () => void;
  submitAnswer: (answer: string) => void;
  sendChat: (message: string) => void;
  nextQuestion: () => void;
  refreshPublicRooms: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [publicRooms, setPublicRooms] = useState<RoomState[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  // Game Play States
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [timerDuration, setTimerDuration] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResults | null>(null);
  const [gameOverState, setGameOverState] = useState<any | null>(null);
  const [gamePreparing, setGamePreparing] = useState(false);
  const [answerProgress, setAnswerProgress] = useState<{ answered: number; total: number } | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<string[]>([]);
  const [playerEliminated, setPlayerEliminated] = useState<{ socketId: string; username: string; survivorCount: number } | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const s = io(SERVER_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      setIsConnected(true);
      console.log('Socket.IO Connected!');
    });

    s.on('disconnect', () => {
      setIsConnected(false);
      setRoomState(null);
      setCurrentQuestion(null);
      setRoundResults(null);
      setChatMessages([]);
      console.log('Socket.IO Disconnected!');
    });

    s.on('room_created', (data: { roomCode: string; roomState: RoomState }) => {
      setRoomState(data.roomState);
      setChatMessages([]);
      setGameOverState(null);
      setRoundResults(null);
      setCurrentQuestion(null);
    });

    s.on('room_updated', (updatedState: RoomState) => {
      setRoomState(updatedState);
      if (updatedState.status === 'lobby') {
        setCurrentQuestion(null);
        setRoundResults(null);
        setGameOverState(null);
      }
    });

    s.on('chat_message', (msg: ChatMessage) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    s.on('game_preparing', () => {
      setGamePreparing(true);
    });

    s.on('game_started', (data: { question: Question; questionIndex: number; totalQuestions: number; duration: number }) => {
      setGamePreparing(false);
      setGameOverState(null);
      setRoundResults(null);
      setAnswerProgress(null);
      setEliminatedOptions([]);
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setTimerDuration(data.duration);
    });

    s.on('question_received', (data: { question: Question; questionIndex: number; totalQuestions: number; duration: number }) => {
      setRoundResults(null);
      setAnswerProgress(null);
      setEliminatedOptions([]);
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setTimerDuration(data.duration);
    });

    s.on('powerup_result', (data: { type: string; eliminatedOptions?: string[] }) => {
      if (data.type === 'fifty_fifty' && data.eliminatedOptions) {
        setEliminatedOptions(data.eliminatedOptions);
      }
    });

    s.on('answer_progress', (data: { answered: number; total: number }) => {
      setAnswerProgress(data);
    });

    s.on('round_results', (results: RoundResults) => {
      setRoundResults(results);
    });

    s.on('game_over', (data: { leaderboard: any[]; winner: any }) => {
      setGameOverState(data);
    });

    s.on('public_rooms', (rooms: RoomState[]) => {
      setPublicRooms(rooms);
    });

    s.on('player_eliminated', (data: { eliminatedSocketId: string; eliminatedUsername: string; survivorCount: number }) => {
      setPlayerEliminated({ socketId: data.eliminatedSocketId, username: data.eliminatedUsername, survivorCount: data.survivorCount });
      setTimeout(() => setPlayerEliminated(null), 3500);
    });

    s.on('error_message', (msg: string) => {
      alert(msg);
    });

    s.connect();
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  const createRoom = useCallback((config: {
    mode: string;
    difficulty: string;
    language: string;
    questionCount: number;
    maxPlayers: number;
    isPrivate: boolean;
    customTopic?: string;
  }) => {
    if (!socket || !user) return;
    socket.emit('create_room', {
      ...config,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl
    });
  }, [socket, user]);

  const joinRoom = useCallback((roomCode: string, isSpectator = false) => {
    if (!socket || !user) return;
    socket.emit('join_room', {
      roomCode: roomCode.toUpperCase(),
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      isSpectator
    });
  }, [socket, user]);

  const leaveRoom = useCallback(() => {
    if (!socket || !roomState) return;
    socket.emit('leave_room', { roomCode: roomState.code });
    // Force recreate state cleanup locally
    setRoomState(null);
    setCurrentQuestion(null);
    setRoundResults(null);
    setGameOverState(null);
    setChatMessages([]);
  }, [socket, roomState]);

  const toggleReady = useCallback(() => {
    if (!socket || !roomState) return;
    socket.emit('toggle_ready', { roomCode: roomState.code });
  }, [socket, roomState]);

  const switchTeam = useCallback((team: 'Red' | 'Blue') => {
    if (!socket || !roomState) return;
    socket.emit('switch_team', { roomCode: roomState.code, team });
  }, [socket, roomState]);

  const startGame = useCallback(() => {
    if (!socket || !roomState) return;
    socket.emit('start_game', { roomCode: roomState.code });
  }, [socket, roomState]);

  const submitAnswer = useCallback((answer: string) => {
    if (!socket || !roomState) return;
    socket.emit('submit_answer', { roomCode: roomState.code, answer });
  }, [socket, roomState]);

  const sendChat = useCallback((message: string) => {
    if (!socket || !roomState || !user) return;
    socket.emit('send_chat', {
      roomCode: roomState.code,
      username: user.username,
      message
    });
  }, [socket, roomState, user]);

  const nextQuestion = useCallback(() => {
    if (!socket || !roomState) return;
    socket.emit('next_question', { roomCode: roomState.code });
  }, [socket, roomState]);

  const refreshPublicRooms = useCallback(() => {
    if (!socket) return;
    socket.emit('get_public_rooms');
  }, [socket]);

  const usePowerup = useCallback((type: 'fifty_fifty' | 'double_points') => {
    if (!socket || !roomState) return;
    socket.emit('use_powerup', { roomCode: roomState.code, type });
  }, [socket, roomState]);

  const rematch = useCallback(() => {
    if (!socket || !roomState || !user) return;
    const settings = {
      mode: roomState.mode,
      difficulty: roomState.difficulty,
      language: roomState.language,
      questionCount: roomState.questionCount,
      maxPlayers: roomState.maxPlayers,
      isPrivate: roomState.isPrivate,
    };
    socket.emit('leave_room', { roomCode: roomState.code });
    setRoomState(null);
    setCurrentQuestion(null);
    setRoundResults(null);
    setGameOverState(null);
    setEliminatedOptions([]);
    setChatMessages([]);
    socket.emit('create_room', { ...settings, userId: user.id, username: user.username, avatarUrl: user.avatarUrl });
  }, [socket, roomState, user]);

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      roomState,
      publicRooms,
      chatMessages,
      currentQuestion,
      questionIndex,
      totalQuestions,
      timerDuration,
      roundResults,
      gameOverState,
      gamePreparing,
      answerProgress,
      eliminatedOptions,
      playerEliminated,
      usePowerup,
      rematch,
      createRoom,
      joinRoom,
      leaveRoom,
      toggleReady,
      switchTeam,
      startGame,
      submitAnswer,
      sendChat,
      nextQuestion,
      refreshPublicRooms
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used within a SocketProvider");
  return context;
};
