const User = require('../models/User');
const Activity = require('../models/Activity');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

// Predefined texts for race
const RACE_TEXTS = [
  'Successful typing requires both accuracy and speed. When you practice daily, your muscle memory builds natural pathways that allow your fingers to glide effortlessly across the home row keys.',
  'Quantum computing utilizes superposition and entanglement to solve computational problems at speeds exceeding billions of times traditional silicon microprocessors.',
  'The only way of discovering the limits of the possible is to venture a little way past them into the impossible. Practice makes perfect in typing and in life.',
  'RESTful APIs use HTTP methods like GET, POST, PUT, and DELETE to manage resources. Client-side applications interact with these endpoints by sending JSON payloads in the request body.',
  'Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood and looked down one as far as I could.'
];

// Room State Enum
const ROOM_STATES = {
  WAITING: 'WAITING',
  MATCHED: 'MATCHED',
  LOADING: 'LOADING',
  COUNTDOWN: 'COUNTDOWN',
  RACING: 'RACING',
  FINISHED: 'FINISHED',
  CLOSED: 'CLOSED'
};

// In-memory sets to track state
global.onlineUsers = new Set(); // User ID strings
const socketUserMap = new Map(); // socket.id -> { userId, username }
const userSocketMap = new Map(); // userId -> socket.id
let matchmakingQueue = []; // array of { socketId, userId, username, joinedAt, timeoutNotified }
const activeRooms = new Map(); // roomId -> roomState

module.exports = (io) => {
  // matchmaking queue timeout checker (every 2 seconds)
  setInterval(() => {
    const now = Date.now();
    matchmakingQueue.forEach(p => {
      if (now - p.joinedAt > 30000 && !p.timeoutNotified) {
        p.timeoutNotified = true;
        io.to(p.socketId).emit('queue_timeout');
      }
    });
  }, 2000);

  io.on('connection', (socket) => {
    
    // Ping/Pong Latency Test
    socket.on('ping_test', (timestamp) => {
      socket.emit('pong_test', timestamp);
    });

    // 1. User Registration
    socket.on('register_user', ({ userId, username }) => {
      if (!userId) return;
      
      const userIdStr = userId.toString();
      global.onlineUsers.add(userIdStr);
      socketUserMap.set(socket.id, { userId: userIdStr, username });
      userSocketMap.set(userIdStr, socket.id);
      
      io.emit('online_status_change', { userId: userIdStr, isOnline: true });
    });

    // 2. Matchmaking Queue
    socket.on('join_queue', () => {
      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      // Check if already in queue
      if (matchmakingQueue.some(item => item.userId === userInfo.userId)) {
        return;
      }

      matchmakingQueue.push({
        socketId: socket.id,
        userId: userInfo.userId,
        username: userInfo.username,
        joinedAt: Date.now(),
        timeoutNotified: false
      });

      socket.emit('queue_joined');

      // Check queue for matchmaking
      if (matchmakingQueue.length >= 2) {
        const matched = matchmakingQueue.splice(0, 4); // up to 4 players
        const roomId = 'race_' + Math.random().toString(36).substring(2, 9);
        const randomText = RACE_TEXTS[Math.floor(Math.random() * RACE_TEXTS.length)];
        
        const roomState = {
          roomId,
          status: ROOM_STATES.MATCHED,
          text: randomText,
          players: matched.map(p => ({
            userId: p.userId,
            username: p.username,
            socketId: p.socketId,
            progress: 0,
            wpm: 0,
            accuracy: 100,
            finished: false,
            ready: false,
            disconnected: false,
            disconnectTimeout: null,
            consecutiveCorrect: 0,
            lastProgressUpdate: Date.now(),
            disqualified: false,
            powerups: { freeze: 0, nitro: 0 }
          })),
          startedAt: null,
          startTimeStamp: null,
          finishedCount: 0,
          winnerDeclared: false
        };
        
        activeRooms.set(roomId, roomState);

        // Notify client sockets directly
        matched.forEach(p => {
          io.to(p.socketId).emit('match_found', {
            roomId,
            text: randomText,
            players: roomState.players.map(pl => ({ userId: pl.userId, username: pl.username }))
          });
        });
      }
    });

    socket.on('leave_queue', () => {
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        matchmakingQueue = matchmakingQueue.filter(item => item.userId !== userInfo.userId);
        socket.emit('queue_left');
      }
    });

    // 3. Client Room Connection Handshake
    socket.on('join_room', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      socket.join(roomId);
      room.status = ROOM_STATES.LOADING;

      const player = room.players.find(p => p.userId === userInfo.userId);
      if (player) {
        // Disconnect recovery rejoin mapping
        if (player.disconnected) {
          player.disconnected = false;
          player.socketId = socket.id;
          if (player.disconnectTimeout) {
            clearTimeout(player.disconnectTimeout);
            player.disconnectTimeout = null;
          }
          io.to(roomId).emit('opponent_status_change', { userId: userInfo.userId, isOnline: true });
          socket.emit('race_reconnect_success', {
            roomId,
            text: room.text,
            players: room.players.map(p => ({
              userId: p.userId,
              username: p.username,
              progress: p.progress,
              wpm: p.wpm,
              accuracy: p.accuracy,
              finished: p.finished,
              disconnected: p.disconnected
            })),
            status: room.status,
            startTimeStamp: room.startTimeStamp
          });
          return;
        }
      }

      socket.emit('room_joined', { roomId });
    });

    socket.on('player_ready', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      const player = room.players.find(p => p.userId === userInfo.userId);
      if (player) {
        player.ready = true;
        io.to(roomId).emit('player_ready_status', { userId: userInfo.userId, ready: true });

        // Check if all players in the room are ready
        const allReady = room.players.every(p => p.ready || p.disconnected);
        if (allReady && room.status !== ROOM_STATES.COUNTDOWN && room.status !== ROOM_STATES.RACING) {
          room.status = ROOM_STATES.COUNTDOWN;
          room.startTimeStamp = Date.now() + 5000; // Synchronized start clock (5s out)

          io.to(roomId).emit('start_countdown', { startTimeStamp: room.startTimeStamp });

          setTimeout(() => {
            const activeRoom = activeRooms.get(roomId);
            if (activeRoom && activeRoom.status === ROOM_STATES.COUNTDOWN) {
              activeRoom.status = ROOM_STATES.RACING;
              activeRoom.startedAt = Date.now();
              io.to(roomId).emit('race_start');
            }
          }, 5000);
        }
      }
    });

    // 4. Server-Authoritative Progress Verification & Anti-Cheat
    socket.on('race_progress_update', ({ roomId, index, errors }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.status !== ROOM_STATES.RACING) return;

      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      const player = room.players.find(p => p.userId === userInfo.userId);
      if (!player || player.finished || player.disqualified) return;

      // Calculate stats authoritatively
      const progressPercent = Math.min(100, Math.round((index / room.text.length) * 100));
      const durationSeconds = (Date.now() - room.startedAt) / 1000;
      const calculatedWpm = durationSeconds > 0.5
        ? Math.round((index / 5) / (durationSeconds / 60))
        : 0;
      
      // Calculate accuracy
      const totalCharsTyped = index + (errors || 0);
      const calculatedAccuracy = totalCharsTyped > 0 
        ? Math.round((index / totalCharsTyped) * 100) 
        : 100;

      // Anti-Cheat Speed validation
      const timeDiff = (Date.now() - player.lastProgressUpdate) / 1000;
      const progressDiff = progressPercent - player.progress;
      let isCheating = false;
      let cheatReason = '';

      if (durationSeconds > 3 && calculatedWpm > 250) {
        isCheating = true;
        cheatReason = 'WPM_LIMIT_EXCEEDED';
      } else if (timeDiff > 0.1 && progressDiff > 40) { // Max 40% jump in < 100ms
        isCheating = true;
        cheatReason = 'IMPOSSIBLE_PROGRESS_JUMP';
      }

      if (isCheating) {
        player.disqualified = true;
        AuditLog.create({
          user: player.userId,
          sessionId: roomId,
          reason: cheatReason,
          details: { wpm: calculatedWpm, progress: progressPercent, duration: durationSeconds },
          ip: socket.handshake.address
        }).catch(err => console.error('AuditLog error:', err));

        socket.emit('player_disqualified', { reason: cheatReason });
        io.to(roomId).emit('opponent_disqualified', { userId: player.userId });
        return;
      }

      // Valid update
      player.progress = progressPercent;
      player.wpm = calculatedWpm;
      player.accuracy = calculatedAccuracy;
      player.lastProgressUpdate = Date.now();

      // Authoritative Powerup earning (1 random powerup every 15 consecutive correct typed chars)
      player.consecutiveCorrect++;
      if (player.consecutiveCorrect >= 15) {
        player.consecutiveCorrect = 0;
        const powerupOptions = ['freeze', 'nitro'];
        const reward = powerupOptions[Math.floor(Math.random() * powerupOptions.length)];
        player.powerups[reward] = (player.powerups[reward] || 0) + 1;
        
        socket.emit('powerup_earned', { powerupType: reward });
      }

      // Broadcast progress update to opponents in room
      socket.to(roomId).emit('opponent_progress', {
        userId: player.userId,
        progress: progressPercent,
        wpm: calculatedWpm,
        accuracy: calculatedAccuracy
      });
    });

    // 5. Authoritative Powerup Actions
    socket.on('request_use_powerup', ({ roomId, powerupType }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.status !== ROOM_STATES.RACING) return;

      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      const player = room.players.find(p => p.userId === userInfo.userId);
      if (player && player.powerups[powerupType] > 0) {
        player.powerups[powerupType]--;

        // Broadcast powerup trigger to all opponents in room
        socket.to(roomId).emit('powerup_triggered', {
          senderId: userInfo.userId,
          senderName: userInfo.username,
          powerupType
        });
      }
    });

    // 6. Authoritative Typing Finish
    socket.on('race_complete', async ({ roomId, wpm, accuracy }) => {
      const room = activeRooms.get(roomId);
      if (!room || room.status !== ROOM_STATES.RACING) return;

      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      const player = room.players.find(p => p.userId === userInfo.userId);
      if (player && !player.finished && !player.disqualified) {
        player.finished = true;
        player.wpm = wpm;
        player.accuracy = accuracy;
        room.finishedCount++;

        // Determine if they won (accuracy >= 90% and first to finish)
        let won = false;
        if (accuracy >= 90 && !room.winnerDeclared) {
          won = true;
          room.winnerDeclared = true;
          player.rank = 1;
        } else {
          player.rank = room.winnerDeclared ? room.finishedCount : 1;
        }

        io.to(roomId).emit('player_finished', {
          userId: userInfo.userId,
          username: userInfo.username,
          wpm,
          accuracy,
          rank: player.rank
        });

        // Update DB records
        try {
          const userObj = await User.findById(userInfo.userId);
          if (userObj) {
            if (won) {
              userObj.raceWins += 1;
              await Activity.create({
                user: userInfo.userId,
                username: userInfo.username,
                type: 'race_won',
                details: { wpm, accuracy }
              });

              // Check achievement: "First Blood"
              const currentAchievements = userObj.achievements.map(a => a.name);
              if (!currentAchievements.includes('First Blood')) {
                userObj.achievements.push({ name: 'First Blood', legacy: false });
                await Activity.create({
                  user: userInfo.userId,
                  username: userInfo.username,
                  type: 'achievement_unlocked',
                  details: { achievementName: 'First Blood' }
                });
              }
            } else {
              userObj.raceLosses += 1;
            }
            await userObj.save();
          }
        } catch (dbErr) {
          console.error('Error updating race completion stats:', dbErr);
        }

        // Check if all players completed
        checkRaceOver(roomId);
      }
    });

    // 7. Disconnection Recovery with Grace Timer
    socket.on('disconnect', () => {
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        const userIdStr = userInfo.userId;
        global.onlineUsers.delete(userIdStr);
        socketUserMap.delete(socket.id);
        userSocketMap.delete(userIdStr);
        matchmakingQueue = matchmakingQueue.filter(item => item.userId !== userIdStr);

        io.emit('online_status_change', { userId: userIdStr, isOnline: false });

        activeRooms.forEach((room, roomId) => {
          const player = room.players.find(p => p.userId === userIdStr);
          if (player) {
            player.disconnected = true;
            io.to(roomId).emit('opponent_status_change', { userId: userIdStr, isOnline: false });

            if (room.status === ROOM_STATES.RACING) {
              // 10-second grace period for recovery
              player.disconnectTimeout = setTimeout(() => {
                const checkRoom = activeRooms.get(roomId);
                if (checkRoom) {
                  const checkPlayer = checkRoom.players.find(p => p.userId === userIdStr);
                  if (checkPlayer && checkPlayer.disconnected) {
                    checkPlayer.finished = true;
                    checkPlayer.wpm = 0;
                    checkPlayer.accuracy = 0;
                    checkRoom.finishedCount++;
                    
                    io.to(roomId).emit('player_finished', {
                      userId: userIdStr,
                      username: checkPlayer.username,
                      wpm: 0,
                      accuracy: 0,
                      rank: checkRoom.winnerDeclared ? checkRoom.finishedCount : 1,
                      forfeited: true
                    });
                    
                    checkRaceOver(roomId);
                  }
                }
              }, 10000);
            } else if (room.status === ROOM_STATES.LOADING || room.status === ROOM_STATES.COUNTDOWN) {
              // If disconnected during starting phase, close room immediately
              io.to(roomId).emit('race_closed', { reason: 'Opponent disconnected before start' });
              activeRooms.delete(roomId);
            }
          }
        });
      }
    });

  });
};

const checkRaceOver = (roomId) => {
  const room = activeRooms.get(roomId);
  if (!room) return;

  const allFinished = room.players.every(p => p.finished || p.disconnected);
  if (allFinished || room.finishedCount === room.players.length) {
    room.status = ROOM_STATES.FINISHED;
    io.to(roomId).emit('race_over', {
      standings: room.players
        .sort((a, b) => {
          if (a.rank && b.rank) return a.rank - b.rank;
          if (a.rank) return -1;
          if (b.rank) return 1;
          return b.progress - a.progress;
        })
        .map(p => ({
          userId: p.userId,
          username: p.username,
          wpm: p.wpm,
          accuracy: p.accuracy,
          rank: p.rank
        }))
    });
    activeRooms.delete(roomId);
  }
};
