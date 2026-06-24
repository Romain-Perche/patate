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

  const getHand = (hand, isRevealed, reverse = false) => {
    if (!hand) return [null, null, null, null];
    const processedHand = isRevealed ? [...hand] : hand.map(c => c ? 'hidden' : null);
    return reverse ? processedHand.reverse() : processedHand;
  };

  const currentTurnName = room.currentTurn === room.p1.id ? room.p1.nickname : (room.p2 ? room.p2.nickname : '');

  // Send state to p1
  if (room.p1 && room.p1.id) {
    io.to(room.p1.id).emit('gameStateUpdate', {
      pile_length: room.gamePile.length,
      discardPile: room.discardPile,
      drawnCard: room.p1.drawnCard,
      myHand: getHand(room.p1.hand, room.isRevealed, false),
      rivalHand: getHand(room.p2 ? room.p2.hand : null, room.isRevealed, true),
      isRevealed: room.isRevealed,
      currentTurnName
    });
  }

  // Send state to p2
  if (room.p2 && room.p2.id) {
    io.to(room.p2.id).emit('gameStateUpdate', {
      pile_length: room.gamePile.length,
      discardPile: room.discardPile,
      drawnCard: room.p2.drawnCard,
      myHand: getHand(room.p2.hand, room.isRevealed, false),
      rivalHand: getHand(room.p1 ? room.p1.hand : null, room.isRevealed, true),
      isRevealed: room.isRevealed,
      currentTurnName
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
      isRevealed: false,
      p1: {
        id: socket.id,
        nickname: nickname,
        hand: [deck.pop(), deck.pop(), deck.pop(), deck.pop()],
        drawnCard: null
      },
      p2: null,
      currentTurn: socket.id
    };

    console.log(`Socket ${socket.id} created and joined room ${roomCode}`);
    socket.join(roomCode);
    socket.emit('roomJoined', roomCode);
  });

  socket.on('joinRoom', (nickname, roomCode) => {
    const room = rooms[roomCode];
    if (room && !room.p2) {
      room.p2 = {
        id: socket.id,
        nickname: nickname,
        hand: [room.gamePile.pop(), room.gamePile.pop(), room.gamePile.pop(), room.gamePile.pop()], // give p2 their hand!
        drawnCard: null
      };
      socket.join(roomCode);
      socket.emit('roomJoined', roomCode);
      console.log(`Socket ${socket.id} joined room ${roomCode}`);

      // Start the game for both players
      io.to(roomCode).emit('gameStart');
      sendGameState(roomCode);
    } else {
      socket.emit('error', 'Room full or not found');
    }
  });

  socket.on('drawFromPile', (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.currentTurn === socket.id && room.gamePile.length > 0) {
      let player = null;
      if (room.p1.id === socket.id) player = room.p1;
      else player = room.p2;

      if (!player.drawnCard) {
        player.drawnCard = room.gamePile.pop();
        sendGameState(roomCode);
      }
    }
  });

  socket.on('discardDrawnCard', (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.currentTurn === socket.id) {
      let player = null;
      if (room.p1.id === socket.id) player = room.p1;
      else player = room.p2;

      if (player.drawnCard) {
        room.discardPile.push(player.drawnCard);
        player.drawnCard = null;
        room.currentTurn = room.currentTurn === room.p1.id ? room.p2.id : room.p1.id;
        sendGameState(roomCode);
      }
    }
  });

  socket.on('replaceCard', (roomCode, index) => {
    const room = rooms[roomCode];
    if (room && room.currentTurn === socket.id) {
      let player = room.p1.id === socket.id ? room.p1 : room.p2;
      if (player && player.drawnCard) {
        const oldCard = player.hand[index];
        player.hand[index] = player.drawnCard;
        room.discardPile.push(oldCard);
        player.drawnCard = null;
        room.currentTurn = room.currentTurn === room.p1.id ? room.p2.id : room.p1.id;
        sendGameState(roomCode);
      }
    }
  });

  socket.on('toggleReveal', (roomCode) => {
    const room = rooms[roomCode];
    if (room) {
      room.isRevealed = !room.isRevealed;
      sendGameState(roomCode);
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
