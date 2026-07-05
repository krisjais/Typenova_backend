const User = require('../models/User');
const Activity = require('../models/Activity');

// Predefined texts for race so backend doesn't need frontend imports
const RACE_TEXTS = [
  'Successful typing requires both accuracy and speed. When you practice daily, your muscle memory builds natural pathways that allow your fingers to glide effortlessly across the home row keys.',
  'Quantum computing utilizes superposition and entanglement to solve computational problems at speeds exceeding billions of times traditional silicon microprocessors.',
  'The only way of discovering the limits of the possible is to venture a little way past them into the impossible. Practice makes perfect in typing and in life.',
  'RESTful APIs use HTTP methods like GET, POST, PUT, and DELETE to manage resources. Client-side applications interact with these endpoints by sending JSON payloads in the request body.',
  'Two roads diverged in a yellow wood, and sorry I could not travel both and be one traveler, long I stood and looked down one as far as I could.'
];

// In-memory sets to track state
global.onlineUsers = new Set(); // User ID strings
const socketUserMap = new Map(); // socket.id -> { userId, username }
const userSocketMap = new Map(); // userId -> socket.id
let matchmakingQueue = []; // array of { socketId, userId, username }
const activeRooms = new Map(); // roomId -> roomState

module.exports = (io) => {
  io.on('connection', (socket) => {
    // 1. User Registration
    socket.on('register_user', ({ userId, username }) => {
      if (!userId) return;
      
      const userIdStr = userId.toString();
      global.onlineUsers.add(userIdStr);
      socketUserMap.set(socket.id, { userId: userIdStr, username });
      userSocketMap.set(userIdStr, socket.id);
      
      // Broadcast online status update to everyone
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
        username: userInfo.username
      });

      socket.emit('queue_joined');

      // Check if matchmaking queue has enough players (2-4 players)
      if (matchmakingQueue.length >= 2) {
        const matched = matchmakingQueue.splice(0, 4); // Take up to 4 players
        const roomId = 'race_' + Math.random().toString(36).substring(2, 9);
        const randomText = RACE_TEXTS[Math.floor(Math.random() * RACE_TEXTS.length)];
        
        // Initialize room state
        const roomState = {
          roomId,
          text: randomText,
          players: matched.map(p => ({
            userId: p.userId,
            username: p.username,
            socketId: p.socketId,
            progress: 0,
            wpm: 0,
            accuracy: 100,
            finished: false,
            rank: null,
          })),
          started: false,
          finishedCount: 0,
          winnerDeclared: false
        };
        
        activeRooms.set(roomId, roomState);

        // Join sockets to room
        matched.forEach(p => {
          const clientSocket = io.sockets.sockets.get(p.socketId);
          if (clientSocket) clientSocket.join(roomId);
        });

        // Notify room about the match found
        io.to(roomId).emit('match_found', {
          roomId,
          text: randomText,
          players: roomState.players.map(p => ({ userId: p.userId, username: p.username }))
        });

        // Start countdown to begin race (5 seconds)
        let countdown = 5;
        const interval = setInterval(() => {
          io.to(roomId).emit('race_countdown', countdown);
          countdown--;
          if (countdown < 0) {
            clearInterval(interval);
            roomState.started = true;
            io.to(roomId).emit('race_start');
          }
        }, 1000);
      }
    });

    socket.on('leave_queue', () => {
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        matchmakingQueue = matchmakingQueue.filter(item => item.userId !== userInfo.userId);
        socket.emit('queue_left');
      }
    });

    // 3. Real-time Progress Sync
    socket.on('race_progress_update', ({ roomId, progress, wpm, accuracy }) => {
      const room = activeRooms.get(roomId);
      if (!room || !room.started) return;

      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      const player = room.players.find(p => p.userId === userInfo.userId);
      if (player && !player.finished) {
        player.progress = progress;
        player.wpm = wpm;
        player.accuracy = accuracy;

        // Broadcast progress update to everyone else in the room
        socket.to(roomId).emit('opponent_progress', {
          userId: userInfo.userId,
          progress,
          wpm,
          accuracy
        });
      }
    });

    // 4. Typing Complete
    socket.on('race_complete', async ({ roomId, wpm, accuracy }) => {
      const room = activeRooms.get(roomId);
      if (!room || !room.started) return;

      const userInfo = socketUserMap.get(socket.id);
      if (!userInfo) return;

      const player = room.players.find(p => p.userId === userInfo.userId);
      if (player && !player.finished) {
        player.finished = true;
        player.wpm = wpm;
        player.accuracy = accuracy;
        room.finishedCount++;

        // Determine if they won (must have accuracy > 90%)
        let won = false;
        if (accuracy >= 90 && !room.winnerDeclared) {
          won = true;
          room.winnerDeclared = true;
          player.rank = 1;
        } else {
          player.rank = room.winnerDeclared ? room.finishedCount : 1; // Fallback rank calculation
        }

        // Notify room that this player finished
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
              // Log activity
              await Activity.create({
                user: userInfo.userId,
                username: userInfo.username,
                type: 'race_won',
                details: { wpm, accuracy }
              });

              // Check achievement: "First Blood"
              const currentAchievements = userObj.achievements.map(a => a.name);
              if (!currentAchievements.includes('First Blood')) {
                userObj.achievements.push({ name: 'First Blood' });
                // Log achievement activity
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
          console.error('Error updating multiplayer stats:', dbErr);
        }

        // Check if all players finished
        const allFinished = room.players.every(p => p.finished);
        if (allFinished || room.finishedCount === room.players.length) {
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
      }
    });

    // 5. User Disconnection
    socket.on('disconnect', () => {
      const userInfo = socketUserMap.get(socket.id);
      if (userInfo) {
        const userIdStr = userInfo.userId;
        global.onlineUsers.delete(userIdStr);
        socketUserMap.delete(socket.id);
        userSocketMap.delete(userIdStr);
        matchmakingQueue = matchmakingQueue.filter(item => item.userId !== userIdStr);

        // Notify online status change
        io.emit('online_status_change', { userId: userIdStr, isOnline: false });

        // Handle disconnect during active rooms
        activeRooms.forEach((room, roomId) => {
          const player = room.players.find(p => p.userId === userIdStr);
          if (player) {
            player.finished = true;
            player.wpm = 0;
            player.accuracy = 0;
            
            socket.to(roomId).emit('opponent_disconnected', { userId: userIdStr });
            
            // Recalculate room end if needed
            const allFinished = room.players.every(p => p.finished);
            if (allFinished) {
              io.to(roomId).emit('race_over', {
                standings: room.players.map(p => ({
                  userId: p.userId,
                  username: p.username,
                  wpm: p.wpm,
                  accuracy: p.accuracy,
                  rank: p.rank
                }))
              });
              activeRooms.delete(roomId);
            }
          }
        });
      }
    });
  });
};
