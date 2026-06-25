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
      currentTurnName,
      phase: room.phase,
      matchTimeRemaining: room.matchTimeRemaining,
      mySkipNextTurn: room.p1.skipNextTurn,
      rivalSkipNextTurn: room.p2 ? room.p2.skipNextTurn : false,
      drawnFromDiscard: room.p1.drawnFromDiscard
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
      currentTurnName,
      phase: room.phase,
      matchTimeRemaining: room.matchTimeRemaining,
      mySkipNextTurn: room.p2.skipNextTurn,
      rivalSkipNextTurn: room.p1 ? room.p1.skipNextTurn : false,
      drawnFromDiscard: room.p2.drawnFromDiscard
    });
  }
};

const endTurn = (roomCode) => {
  const room = rooms[roomCode];
  if (!room) return;

  room.phase = 'match';
  room.matchTimeRemaining = 5;
  room.pausedMatchTimer = false;

  if (room.p1) room.p1.skipMatchPhase = false;
  if (room.p2) room.p2.skipMatchPhase = false;

  if (room.matchInterval) clearInterval(room.matchInterval);

  sendGameState(roomCode);

  room.matchInterval = setInterval(() => {
    if (!room.pausedMatchTimer) {
      room.matchTimeRemaining--;
      sendGameState(roomCode);
      if (room.matchTimeRemaining <= 0) {
        clearInterval(room.matchInterval);
        room.matchInterval = null;
        room.phase = 'turn';
        nextTurn(roomCode);
      }
    }
  }, 1000);
};

const nextTurn = (roomCode) => {
  const room = rooms[roomCode];
  if (!room) return;

  let nextPlayerId = room.currentTurn === room.p1.id ? room.p2.id : room.p1.id;
  let nextPlayer = nextPlayerId === room.p1.id ? room.p1 : room.p2;

  if (nextPlayer.skipNextTurn) {
    nextPlayer.skipNextTurn = false;
    nextPlayerId = nextPlayerId === room.p1.id ? room.p2.id : room.p1.id;
  }

  room.currentTurn = nextPlayerId;
  sendGameState(roomCode);
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
      phase: 'turn',
      matchTimeRemaining: 0,
      pausedMatchTimer: false,
      matchInterval: null,
      p1: {
        id: socket.id,
        nickname: nickname,
        hand: [deck.pop(), deck.pop(), deck.pop(), deck.pop()],
        drawnCard: null,
        drawnFromDiscard: false,
        skipNextTurn: false,
        skipMatchPhase: false
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
        drawnCard: null,
        drawnFromDiscard: false,
        skipNextTurn: false,
        skipMatchPhase: false
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
    if (room.currentTurn === socket.id && room.phase === 'turn' && room.gamePile.length > 0) {
      let player = room.p1.id === socket.id ? room.p1 : room.p2;

      if (!player.drawnCard) {
        player.drawnCard = room.gamePile.pop();
        player.drawnFromDiscard = false;
        sendGameState(roomCode);
      }
    }
  });

  socket.on('drawFromDiscard', (roomCode) => {
    const room = rooms[roomCode];
    if (room.currentTurn === socket.id && room.phase === 'turn' && room.discardPile.length > 0) {
      let player = room.p1.id === socket.id ? room.p1 : room.p2;
      if (!player.drawnCard) {
        player.drawnCard = room.discardPile.pop();
        player.drawnFromDiscard = true;
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

      if (player.drawnCard && !player.drawnFromDiscard) {
        room.discardPile.push(player.drawnCard);
        player.drawnCard = null;
        endTurn(roomCode);
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
        player.drawnFromDiscard = false;
        endTurn(roomCode);
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

  socket.on('declareMatch', (roomCode) => {
    const room = rooms[roomCode];
    if (room.phase === 'match') {
      const player = room.p1.id === socket.id ? room.p1 : room.p2;
      if (player.skipNextTurn) return;
      room.pausedMatchTimer = true;
      sendGameState(roomCode);
    }
  });

  socket.on('cancelMatch', (roomCode) => {
    const room = rooms[roomCode];
    if (room.phase === 'match') {
      room.pausedMatchTimer = false;
      sendGameState(roomCode);
    }
  });

  socket.on('skipMatchPhase', (roomCode) => {
    const room = rooms[roomCode];
    if (room && room.phase === 'match') {
      const player = room.p1.id === socket.id ? room.p1 : room.p2;
      player.skipMatchPhase = true;
      if (room.p1.skipMatchPhase && room.p2.skipMatchPhase) {
        clearInterval(room.matchInterval);
        room.matchInterval = null;
        room.phase = 'turn';
        nextTurn(roomCode);
      }
    }
  });

  socket.on('submitMatch', (roomCode, index) => {
    const room = rooms[roomCode];
    if (room.phase === 'match') {
      const player = room.p1.id === socket.id ? room.p1 : room.p2;
      const topDiscard = room.discardPile[room.discardPile.length - 1];
      const getCardValue = (cardStr) => {
        if (cardStr === 'Joker') return 'Joker';
        return cardStr.split('_')[0];
      };
      const discardValue = getCardValue(topDiscard);
      const isMatch = getCardValue(player.hand[index]) === discardValue;

      if (isMatch) {
        room.discardPile.push(player.hand[index]);
        player.hand[index] = null;

      } else {
        player.skipNextTurn = true;
      }

      room.pausedMatchTimer = false;
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
