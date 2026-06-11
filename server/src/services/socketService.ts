import { Server, Socket } from 'socket.io';
import { gameService } from './gameService';
import { saveSeenQuestions } from './questionHistory';

export function initializeSockets(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Create Room
    socket.on('create_room', (data: {
      mode: 'classic' | 'rapid' | 'tournament' | 'team' | 'classroom' | 'puzzle' | 'battle_royale';
      difficulty: 'easy' | 'medium' | 'hard';
      language: 'en' | 'hi' | 'bilingual';
      questionCount: number;
      maxPlayers: number;
      isPrivate: boolean;
      userId: string;
      username: string;
      avatarUrl: string;
      customTopic?: string;
    }) => {
      try {
        const room = gameService.createRoom(
          data.mode,
          data.difficulty,
          data.language,
          data.questionCount,
          data.maxPlayers,
          data.isPrivate,
          data.customTopic
        );
        
        gameService.joinRoom(room.code, socket.id, {
          userId: data.userId,
          username: data.username,
          avatarUrl: data.avatarUrl
        });

        socket.join(room.code);
        
        socket.emit('room_created', { roomCode: room.code, roomState: room });
        io.emit('public_rooms', gameService.getAllPublicRooms()); // Update public listings
      } catch (err: any) {
        socket.emit('error_message', err.message || "Failed to create room");
      }
    });

    // Join Room
    socket.on('join_room', (data: {
      roomCode: string;
      userId: string;
      username: string;
      avatarUrl: string;
      isSpectator?: boolean;
    }) => {
      try {
        const { room } = gameService.joinRoom(data.roomCode, socket.id, {
          userId: data.userId,
          username: data.username,
          avatarUrl: data.avatarUrl,
          isSpectator: data.isSpectator
        });

        socket.join(room.code);

        // Notify room about state update
        io.to(room.code).emit('room_updated', room);
        io.emit('public_rooms', gameService.getAllPublicRooms()); // Update public listings
        
        // Send a system message to the chat
        io.to(room.code).emit('chat_message', {
          sender: "System",
          message: `${data.username} has joined the room as a ${data.isSpectator ? 'spectator' : 'player'}.`,
          timestamp: Date.now()
        });
      } catch (err: any) {
        socket.emit('error_message', err.message || "Failed to join room");
      }
    });

    // Toggle Ready State
    socket.on('toggle_ready', (data: { roomCode: string }) => {
      try {
        const room = gameService.toggleReady(data.roomCode, socket.id);
        io.to(room.code).emit('room_updated', room);
      } catch (err: any) {
        socket.emit('error_message', err.message);
      }
    });

    // Switch Team
    socket.on('switch_team', (data: { roomCode: string; team: 'Red' | 'Blue' }) => {
      try {
        const room = gameService.changeTeam(data.roomCode, socket.id, data.team);
        io.to(room.code).emit('room_updated', room);
      } catch (err: any) {
        socket.emit('error_message', err.message);
      }
    });

    // Chat Message
    socket.on('send_chat', (data: { roomCode: string; username: string; message: string }) => {
      io.to(data.roomCode).emit('chat_message', {
        sender: data.username,
        message: data.message,
        timestamp: Date.now()
      });
    });

    // Start Game
    socket.on('start_game', async (data: { roomCode: string }) => {
      try {
        const room = gameService.getRoom(data.roomCode);
        if (!room) throw new Error("Room not found");
        
        // Only host can start
        const player = room.players[socket.id];
        if (!player || !player.isHost) {
          throw new Error("Only the host can start the game");
        }

        // Notify players that AI is generating questions (prevents frozen lobby)
        io.to(room.code).emit('game_preparing', { total: room.questionCount });

        const startedRoom = await gameService.startGame(room.code);

        // Broadcast game started, send the first question
        const firstQuestion = startedRoom.questions[0];
        const duration = startedRoom.mode === 'rapid' ? 10 : startedRoom.mode === 'puzzle' ? 45 : startedRoom.mode === 'classroom' ? 35 : 25;

        io.to(room.code).emit('game_started', {
          question: {
            question: firstQuestion.question,
            options: firstQuestion.options,
            type: firstQuestion.type,
            category: firstQuestion.category,
            questionSvg: firstQuestion.questionSvg
          },
          questionIndex: 0,
          totalQuestions: startedRoom.questionCount,
          duration
        });

        io.to(room.code).emit('room_updated', startedRoom);
        io.emit('public_rooms', gameService.getAllPublicRooms()); // Room goes active
      } catch (err: any) {
        socket.emit('error_message', err.message || "Failed to start game");
      }
    });

    // Submit Answer
    socket.on('submit_answer', (data: { roomCode: string; answer: string }) => {
      try {
        const { room, isCorrect, pointsEarned, explanation, justEliminated } = gameService.submitAnswer(
          data.roomCode,
          socket.id,
          data.answer
        );

        socket.emit('answer_receipt', { isCorrect, pointsEarned, explanation });
        io.to(room.code).emit('room_updated', room);

        // Battle Royale: handle elimination
        if (justEliminated) {
          const elimPlayer = room.players[socket.id];
          const survivors = Object.values(room.players).filter(p => !p.eliminated);
          io.to(room.code).emit('player_eliminated', {
            eliminatedSocketId: socket.id,
            eliminatedUsername: elimPlayer?.username,
            survivorCount: survivors.length
          });

          // End game if only 1 (or 0) survivors remain
          if (survivors.length <= 1) {
            const leaderboard = gameService.getLeaderboard(room.code);
            room.status = 'ended';
            io.to(room.code).emit('game_over', { leaderboard, winner: leaderboard[0] });
            io.to(room.code).emit('room_updated', room);
            saveSeenQuestions(Object.values(room.players).map(p => p.userId).filter(Boolean), room.questions).catch(() => {});
            return;
          }
        }

        // Determine which players must answer before round ends
        // Battle Royale: only non-eliminated players count
        const activePlayers = room.mode === 'battle_royale'
          ? Object.values(room.players).filter(p => !p.eliminated)
          : Object.values(room.players);
        const activeSubmitted = activePlayers.filter(p => room.answersReceivedInCurrentRound[p.id]).length;

        // Classroom mode: broadcast live answer progress
        if (room.mode === 'classroom') {
          io.to(room.code).emit('answer_progress', { answered: activeSubmitted, total: activePlayers.length });
        }

        if (activeSubmitted >= activePlayers.length) {
          const currentQuestion = room.questions[room.currentQuestionIndex];
          const leaderboard = gameService.getLeaderboard(room.code);
          io.to(room.code).emit('round_results', {
            correctAnswer: currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation,
            answers: room.answersReceivedInCurrentRound,
            leaderboard
          });
        }
      } catch (err: any) {
        socket.emit('error_message', err.message || "Failed to submit answer");
      }
    });

    // Power-Up handler
    socket.on('use_powerup', (data: { roomCode: string; type: 'fifty_fifty' | 'double_points' }) => {
      try {
        const room = gameService.getRoom(data.roomCode);
        if (!room || room.status !== 'playing') return;
        const q = room.questions[room.currentQuestionIndex];
        if (!q) return;
        if (data.type === 'fifty_fifty') {
          const wrong = ['A', 'B', 'C', 'D'].filter(l => l !== q.correctAnswer);
          const eliminated = wrong.sort(() => Math.random() - 0.5).slice(0, 2);
          socket.emit('powerup_result', { type: 'fifty_fifty', eliminatedOptions: eliminated });
        } else if (data.type === 'double_points') {
          const player = room.players[socket.id];
          if (player) {
            player.doublePointsActive = true;
            socket.emit('powerup_result', { type: 'double_points', active: true });
          }
        }
      } catch {}
    });

    // Next Question (triggered by host or auto-timer)
    socket.on('next_question', (data: { roomCode: string }) => {
      try {
        const room = gameService.getRoom(data.roomCode);
        if (!room) throw new Error("Room not found");

        // Allow automatic trigger or host action
        const player = room.players[socket.id];
        const isHost = player?.isHost;
        const isSystemTrigger = socket.id === 'system';

        if (!isHost && !isSystemTrigger) {
          throw new Error("Only the host can trigger the next question");
        }

        const { hasMoreQuestions } = gameService.nextQuestion(room.code);

        if (hasMoreQuestions) {
          const nextQuestion = room.questions[room.currentQuestionIndex];
          const duration = room.mode === 'rapid' ? 10 : room.mode === 'puzzle' ? 45 : room.mode === 'classroom' ? 35 : 25;

          io.to(room.code).emit('question_received', {
            question: {
              question: nextQuestion.question,
              options: nextQuestion.options,
              type: nextQuestion.type,
              category: nextQuestion.category,
              questionSvg: nextQuestion.questionSvg
            },
            questionIndex: room.currentQuestionIndex,
            totalQuestions: room.questionCount,
            duration
          });
          io.to(room.code).emit('room_updated', room);
        } else {
          const leaderboard = gameService.getLeaderboard(room.code);
          io.to(room.code).emit('game_over', {
            leaderboard,
            winner: leaderboard[0]
          });
          io.to(room.code).emit('room_updated', room);

          // Persist all questions to each player's history so they never repeat
          const playerUserIds = Object.values(room.players).map(p => p.userId).filter(Boolean);
          saveSeenQuestions(playerUserIds, room.questions).catch(() => {});
        }
      } catch (err: any) {
        socket.emit('error_message', err.message);
      }
    });

    // Get Active Public Rooms
    socket.on('get_public_rooms', () => {
      socket.emit('public_rooms', gameService.getAllPublicRooms());
    });

    // Explicit leave (e.g. "Return to Dashboard" button)
    socket.on('leave_room', (data: { roomCode: string }) => {
      const room = gameService.getRoom(data.roomCode);
      if (!room) return;
      const name = room.players[socket.id]?.username || "A spectator";
      const updatedRoom = gameService.leaveRoom(data.roomCode, socket.id);
      socket.leave(data.roomCode);
      if (updatedRoom) {
        io.to(updatedRoom.code).emit('room_updated', updatedRoom);
        io.to(updatedRoom.code).emit('chat_message', {
          sender: "System",
          message: `${name} has left the room.`,
          timestamp: Date.now()
        });
      }
      io.emit('public_rooms', gameService.getAllPublicRooms());
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);

      for (const room of gameService.getAllRooms()) {
        if (room.players[socket.id] || room.spectators.includes(socket.id)) {
          const name = room.players[socket.id]?.username || "A spectator";
          const updatedRoom = gameService.leaveRoom(room.code, socket.id);

          if (updatedRoom) {
            io.to(updatedRoom.code).emit('room_updated', updatedRoom);
            io.to(updatedRoom.code).emit('chat_message', {
              sender: "System",
              message: `${name} has left the room.`,
              timestamp: Date.now()
            });
          }
          io.emit('public_rooms', gameService.getAllPublicRooms());
          break;
        }
      }
    });
  });
}
