const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createDeck } = require('./game');

const app = express();
const server = http.createServer(app);

// Configure CORS to allow your Vite frontend to connect
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
});

const rooms = {};

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const sendGameState = (roomCode) => {
  const room = rooms[roomCode];
  if (!room) return;

  // Send state to p1
  if (room.p1 && room.p1.id) {
    io.to(room.p1.id).emit('gameStateUpdate', {
      pile: room.gamePile,
      discardPile: room.discardPile,
      myHand: room.p1.hand,
      rivalHand: room.p2 ? room.p2.hand.map(() => null) : [null, null, null, null] // Hide rival's cards
    });
  }

  // Send state to p2
  if (room.p2 && room.p2.id) {
    io.to(room.p2.id).emit('gameStateUpdate', {
      pile: room.gamePile,
      discardPile: room.discardPile,
      myHand: room.p2.hand,
      rivalHand: room.p1 ? room.p1.hand.map(() => null) : [null, null, null, null]
    });
  }
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', (nickname) => {
    let roomCode = generateRoomCode();
    while (rooms[roomCode]) {
      roomCode = generateRoomCode();
    }
    
    const deck = createDeck();
    rooms[roomCode] = {
      gamePile: deck,
      discardPile: [],
      p1: {
        id: socket.id, 
        nickname: nickname,
        hand: [deck.pop(), deck.pop(), deck.pop(), deck.pop()]
      },
      p2: null
    };
    
    console.log(`Socket ${socket.id} created and joined room ${roomCode}`);
    socket.join(roomCode);
    socket.emit('roomCreated', roomCode, rooms[roomCode].p1.hand);
  });

  socket.on('joinRoom', (nickname, roomCode) => {
    const room = rooms[roomCode];
    if (room && !room.p2) {
      room.p2 = {
        id: socket.id,
        nickname: nickname,
        hand: [room.gamePile.pop(), room.gamePile.pop(), room.gamePile.pop(), room.gamePile.pop()]
      };
      socket.join(roomCode);
      console.log(`Socket ${socket.id} joined room ${roomCode}`);
      
      // Start the game for both players
      io.to(roomCode).emit('gameStart');
      sendGameState(roomCode);
    } else {
      socket.emit('error', 'Room full or not found');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
