const { create } = require('domain');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Configure CORS to allow your Vite frontend to connect
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
});


const createDeck = () => {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  let deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push(`${value}_of_${suit}`);
    }
  }
  deck.push('Joker');
  deck.push('Joker');
  return shuffledDeck(deck);
}

const shuffledDeck = (deck) => {
  const newDeck = deck.slice();
  for (let i = 0; i < 54; i++) {
    let j = Math.floor(Math.random() * 54)
    const aux = newDeck[j];
    newDeck[j] = newDeck[i];
    newDeck[i] = aux;
  }
  return newDeck;
}


let p1;
let p2;
let hands = {};
let gamePile = createDeck();
let discardPile = [];
const rooms = {};

const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


io.on('connection', (socket) => {
  console.log('A user connected:', socket.id, 'creating pile...');

  socket.on('createRoom', (nickname) => {
    let roomCode = generateRoomCode();
    while (rooms[roomCode]) {
      roomCode = generateRoomCode();
    }
    rooms[roomCode] = {
      p1: {
        id: socket.id, nickname: nickname,
        hand: [gamePile.pop(), gamePile.pop(), gamePile.pop(), gamePile.pop()]
      }
    };
    socket.join(roomCode);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
