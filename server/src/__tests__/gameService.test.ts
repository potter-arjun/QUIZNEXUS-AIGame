import { gameService } from '../services/gameService';

describe('Navodaya Quiz Battle Game Service', () => {
  let roomCode: string;

  beforeEach(() => {
    // Reset rooms mapping by deleting all properties
    const rooms = (gameService as any).rooms || {};
    Object.keys(rooms).forEach(key => delete rooms[key]);
  });

  test('should create a room and join player as host', () => {
    const room = gameService.createRoom('classic', 'medium', 'en', 5, 4, false);
    roomCode = room.code;

    expect(room).toBeDefined();
    expect(room.mode).toBe('classic');
    expect(room.difficulty).toBe('medium');
    expect(room.players).toEqual({});

    const joinResult = gameService.joinRoom(roomCode, 'socket_1', {
      userId: 'user_123',
      username: 'Champ1',
      avatarUrl: 'avatar_1'
    });

    expect(joinResult.player).toBeDefined();
    expect(joinResult.player?.isHost).toBe(true);
    expect(joinResult.player?.username).toBe('Champ1');
    expect(joinResult.room.players['socket_1']).toBeDefined();
  });

  test('should toggle ready state for non-hosts', () => {
    const room = gameService.createRoom('classic', 'medium', 'en', 5, 4, false);
    gameService.joinRoom(room.code, 'socket_1', { userId: 'user_1', username: 'HostUser', avatarUrl: 'avatar_1' });
    gameService.joinRoom(room.code, 'socket_2', { userId: 'user_2', username: 'GuestUser', avatarUrl: 'avatar_2' });

    expect(room.players['socket_2'].isReady).toBe(false);
    gameService.toggleReady(room.code, 'socket_2');
    expect(room.players['socket_2'].isReady).toBe(true);
  });

  test('should start game and generate questions', async () => {
    const room = gameService.createRoom('classic', 'medium', 'en', 5, 4, false);
    gameService.joinRoom(room.code, 'socket_1', { userId: 'user_1', username: 'HostUser', avatarUrl: 'avatar_1' });
    
    await gameService.startGame(room.code);
    
    expect(room.status).toBe('playing');
    expect(room.questions).toHaveLength(5);
    expect(room.currentQuestionIndex).toBe(0);
  });

  test('should allocate scores correctly based on JNVST rules', async () => {
    const room = gameService.createRoom('classic', 'medium', 'en', 5, 4, false);
    gameService.joinRoom(room.code, 'socket_host', { userId: 'u1', username: 'P1', avatarUrl: 'avatar_1' });
    gameService.joinRoom(room.code, 'socket_p2', { userId: 'u2', username: 'P2', avatarUrl: 'avatar_2' });

    await gameService.startGame(room.code);

    // Let's set a fixed question for testing
    room.questions[0] = {
      question: "Sample Question",
      type: "Math",
      difficulty: "medium",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
      explanation: "Test",
      category: "Mathematics"
    };

    // P1 answers correct first (+10 base + 5 fastest = +15 pts)
    const result1 = gameService.submitAnswer(room.code, 'socket_host', 'A');
    expect(result1.isCorrect).toBe(true);
    expect(result1.pointsEarned).toBe(15);
    expect(room.players['socket_host'].score).toBe(15);

    // P2 answers correct second (+7 pts)
    const result2 = gameService.submitAnswer(room.code, 'socket_p2', 'A');
    expect(result2.isCorrect).toBe(true);
    expect(result2.pointsEarned).toBe(7);
    expect(room.players['socket_p2'].score).toBe(7);
  });

  test('should handle tiebreaker sort rules correctly', () => {
    const room = gameService.createRoom('classic', 'medium', 'en', 5, 4, false);
    
    // Create mock players manually in room
    room.players['p1'] = {
      id: 'p1', userId: 'u1', username: 'Alice', avatarUrl: 'avatar_1',
      isHost: true, score: 50, correctAnswers: 5, totalAnswers: 5,
      totalResponseTime: 5000, streak: 5, isReady: true
    }; // 100% acc, 1.0s avg response

    room.players['p2'] = {
      id: 'p2', userId: 'u2', username: 'Bob', avatarUrl: 'avatar_2',
      isHost: false, score: 50, correctAnswers: 5, totalAnswers: 5,
      totalResponseTime: 8000, streak: 5, isReady: true
    }; // 100% acc, 1.6s avg response

    room.players['p3'] = {
      id: 'p3', userId: 'u3', username: 'Charlie', avatarUrl: 'avatar_3',
      isHost: false, score: 40, correctAnswers: 4, totalAnswers: 5,
      totalResponseTime: 2000, streak: 4, isReady: true
    };

    const leaderboard = gameService.getLeaderboard(room.code);
    
    expect(leaderboard[0].player.username).toBe('Alice'); // Alice wins due to faster avg speed (1s < 1.6s)
    expect(leaderboard[1].player.username).toBe('Bob');
    expect(leaderboard[2].player.username).toBe('Charlie');
  });

});
