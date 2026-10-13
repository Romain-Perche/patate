const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { createDeck, handScore } = require('./game');

const app = express();
const server = http.createServer(app);

// Configure CORS to allow your Vite frontend to connect
// Same origin in prod; in dev, Vite proxies /socket.io here
const io = new Server(server);

// Serve the built React app (npm run build)
app.use(express.static(path.join(__dirname, '../dist')));

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

  const powerFor = (p) => room.power ? { type: room.power.type, mine: room.power.playerId === p.id } : null;

  const currentTurnName = room.currentTurn === room.p1.id ? room.p1.nickname : (room.p2 ? room.p2.nickname : '');

  // Send state to p1
  if (room.p1 && room.p1.id) {
    io.to(room.p1.id).emit('gameStateUpdate', {
      pile_length: room.gamePile.length,
      discardPile: room.discardPile,
      drawnCard: room.p1.drawnCard,
      myHand: getHand(room.p1.hand, room.isRevealed, false),
      rivalHand: getHand(room.p2 ? room.p2.hand : null, room.isRevealed, true),
      currentTurnName,
      phase: room.phase,
      matchTimeRemaining: room.matchTimeRemaining,
      mySkipNextTurn: room.p1.skipNextTurn,
      rivalSkipNextTurn: room.p2 ? room.p2.skipNextTurn : false,
      drawnFromDiscard: room.p1.drawnFromDiscard,
      patateCalled: !!room.patateBy,
      power: powerFor(room.p1),
      peeksLeft: room.p1.peeksLeft,
      myScore: room.phase === 'over' ? handScore(room.p1.hand) : null,
      rivalScore: room.phase === 'over' && room.p2 ? handScore(room.p2.hand) : null
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
      currentTurnName,
      phase: room.phase,
      matchTimeRemaining: room.matchTimeRemaining,
      mySkipNextTurn: room.p2.skipNextTurn,
      rivalSkipNextTurn: room.p1 ? room.p1.skipNextTurn : false,
      drawnFromDiscard: room.p2.drawnFromDiscard,
      patateCalled: !!room.patateBy,
      power: powerFor(room.p2),
      peeksLeft: room.p2.peeksLeft,
      myScore: room.phase === 'over' ? handScore(room.p2.hand) : null,
      rivalScore: room.phase === 'over' ? handScore(room.p1.hand) : null
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

  // The caller of Patate never plays again, so a skip flag on the caller does not matter.
  if (nextPlayerId !== room.patateBy && nextPlayer.skipNextTurn) {
    nextPlayer.skipNextTurn = false;
    nextPlayerId = nextPlayerId === room.p1.id ? room.p2.id : room.p1.id;
  }

  // Turn came back to the player who said Patate: game over (the other player had their last turn).
  if (nextPlayerId === room.patateBy) {
    room.phase = 'over';
    room.isRevealed = true;
    sendGameState(roomCode);
    return;
  }

  room.currentTurn = nextPlayerId;
  sendGameState(roomCode);
};


// A thrown Queen or Jack gives its owner a power. Returns true if a power started.
// backToMatch: the card was thrown in the match phase, so the match phase (and its timer) waits and then goes on.
const startPower = (roomCode, card, playerId, backToMatch) => {
  const value = card?.split('_')[0];
  if (value !== 'Q' && value !== 'J') return false;
  const room = rooms[roomCode];
  room.phase = 'power';
  room.power = { type: value === 'Q' ? 'queen' : 'jack', playerId, backToMatch };
  if (backToMatch) room.pausedMatchTimer = true;
  sendGameState(roomCode);
  return true;
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
        skipMatchPhase: false,
        peeksLeft: 2
      },
      p2: null,
      currentTurn: socket.id
    };

    console.log(`Socket ${socket.id} created and joined room ${roomCode}`);
    socket.join(roomCode);
    socket.emit('roomJoined', roomCode);
  });

  socket.on('joinRoom', (nickname, roomCode) => {
    roomCode = String(roomCode).trim().toUpperCase();
    const room = rooms[roomCode];
    if (room && !room.p2) {
      room.p2 = {
        id: socket.id,
        nickname: nickname,
        hand: [room.gamePile.pop(), room.gamePile.pop(), room.gamePile.pop(), room.gamePile.pop()], // give p2 their hand!
        drawnCard: null,
        drawnFromDiscard: false,
        skipNextTurn: false,
        skipMatchPhase: false,
        peeksLeft: 2
      };
      socket.join(roomCode);
      socket.emit('roomJoined', roomCode);
      console.log(`Socket ${socket.id} joined room ${roomCode}`);

      // Start the game for both players
      io.to(roomCode).emit('gameStart');
      sendGameState(roomCode);
    } else {
      socket.emit('joinError', 'Salle introuvable ou déjà pleine.');
    }
  });

  socket.on('drawFromPile', (roomCode) => {
    const room = rooms[roomCode];
    if (room.currentTurn === socket.id && room.phase === 'turn' && room.gamePile.length > 0) {
      let player = room.p1.id === socket.id ? room.p1 : room.p2;

      if (!player.drawnCard) {
        player.peeksLeft = 0;
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
        player.peeksLeft = 0;
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
        const card = player.drawnCard;
        room.discardPile.push(card);
        player.drawnCard = null;
        if (!startPower(roomCode, card, socket.id, false)) endTurn(roomCode);
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
        if (!startPower(roomCode, oldCard, socket.id, false)) endTurn(roomCode);
      }
    }
  });

  // A slot is a card place as the player sees it: 'my' = own hand, 'rival' = rival hand (shown reversed).
  const getSlot = (room, socketId, who, index) => {
    if (who !== 'my' && who !== 'rival') return null;
    const me = room.p1.id === socketId ? room.p1 : room.p2;
    const owner = who === 'my' ? me : (me === room.p1 ? room.p2 : room.p1);
    const i = who === 'my' ? index : owner.hand.length - 1 - index;
    return owner.hand[i] ? { hand: owner.hand, i } : null; // null = empty slot or bad index
  };

  const ownsPower = (room, type) => room && room.phase === 'power' && room.power.playerId === socket.id && room.power.type === type;

  const finishPower = (roomCode) => {
    const room = rooms[roomCode];
    const { backToMatch } = room.power;
    room.power = null;
    if (backToMatch) {
      room.phase = 'match';
      room.pausedMatchTimer = false;
      sendGameState(roomCode);
    } else {
      endTurn(roomCode);
    }
  };

  socket.on('queenLook', (roomCode, who, index) => {
    const room = rooms[roomCode];
    if (!ownsPower(room, 'queen')) return;
    const slot = getSlot(room, socket.id, who, index);
    if (!slot) return;
    socket.emit('peekResult', who, index, slot.hand[slot.i]);
    finishPower(roomCode);
  });

  // Blind swap of any 2 different cards (mine or rival's).
  socket.on('jackSwap', (roomCode, a, b) => {
    const room = rooms[roomCode];
    if (!ownsPower(room, 'jack')) return;
    const x = getSlot(room, socket.id, a?.who, a?.index);
    const y = getSlot(room, socket.id, b?.who, b?.index);
    if (!x || !y || (x.hand === y.hand && x.i === y.i)) return;
    [x.hand[x.i], y.hand[y.i]] = [y.hand[y.i], x.hand[x.i]];
    finishPower(roomCode);
  });

  socket.on('skipPower', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.phase !== 'power' || room.power.playerId !== socket.id) return;
    finishPower(roomCode);
  });

  socket.on('patate', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || !room.p2 || room.patateBy || room.phase === 'over') return;
    room.patateBy = socket.id; // the game ends when the turn would go back to this player
    sendGameState(roomCode);
  });

  // Look at one of your own cards. Only you get the answer.
  socket.on('peekCard', (roomCode, index) => {
    const room = rooms[roomCode];
    if (!room || room.phase === 'over') return;
    const player = room.p1.id === socket.id ? room.p1 : room.p2;
    if (!player || player.peeksLeft <= 0 || !player.hand[index]) return;
    player.peeksLeft--;
    socket.emit('peekResult', 'my', index, player.hand[index]);
    sendGameState(roomCode);
  });

  socket.on('playAgain', (roomCode) => {
    const room = rooms[roomCode];
    if (!room || room.phase !== 'over') return;
    const deck = createDeck();
    Object.assign(room, {
      gamePile: deck, discardPile: [], isRevealed: false, phase: 'turn', patateBy: null,
      currentTurn: room.p1.id
    });
    for (const p of [room.p1, room.p2]) {
      Object.assign(p, {
        hand: [deck.pop(), deck.pop(), deck.pop(), deck.pop()],
        drawnCard: null, drawnFromDiscard: false, skipNextTurn: false, skipMatchPhase: false, peeksLeft: 2
      });
    }
    sendGameState(roomCode);
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
        const card = player.hand[index];
        room.discardPile.push(card);
        player.hand[index] = null;
        if (startPower(roomCode, card, socket.id, true)) return;
      } else {
        player.skipNextTurn = true;
      }

      room.pausedMatchTimer = false;
      sendGameState(roomCode);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const [code, room] of Object.entries(rooms)) {
      if (room.p1?.id !== socket.id && room.p2?.id !== socket.id) continue;
      const other = room.p1.id === socket.id ? room.p2 : room.p1;
      if (other) io.to(other.id).emit('opponentLeft');
      if (room.matchInterval) clearInterval(room.matchInterval);
      io.in(code).socketsLeave(code);
      delete rooms[code];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
