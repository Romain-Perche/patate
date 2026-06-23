import { useState, useEffect } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import Menu from './components/Menu';
import GameTable from './components/GameTable';

const socket = io('http://localhost:3000');

export function App() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'waiting', 'game'
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);

  const [pileLength, setPileLength] = useState(0);
  const [discardPile, setDiscardPile] = useState([]);
  const [drawnCard, setDrawnCard] = useState(null);
  const [isFacedUp, setIsFacedUp] = useState(Array(8).fill(false));

  const handlePileClick = () => {
    if (pileLength === 0) return;
    socket.emit('drawFromPile', currentRoom);
  };

  useEffect(() => {
    socket.on('roomJoined', (code) => {
      setCurrentRoom(code);
      setScreen('waiting');
    });

    socket.on('gameStart', () => {
      setScreen('game');
    });

    socket.on('gameStateUpdate', (gameState) => {
      console.log('gamestate : ', gameState);
      setPileLength(gameState.pile_length);
      setDiscardPile(gameState.discardPile);
      setDrawnCard(gameState.drawnCard);
    });

    return () => {
      if (socket) {
        socket.off('roomCreated');
        socket.off('gameStart');
        socket.off('gameStateUpdate');
      }
    };
  }, []);

  const CreateRoom = () => {
    if (nickname) {
      socket.emit('createRoom', nickname);
    } else {
      alert("Please enter a nickname first ! ");
    }
  };

  const JoinRoom = () => {
    if (nickname && roomCodeInput) {
      socket.emit('joinRoom', nickname, roomCodeInput);
    } else {
      alert("Please enter a nickname and a room code first ! ");
    }
  }

  return (
    <div className="game-container">
      <header>
        <h1>Patate</h1>
        {currentRoom && <div className="room-info">Room Code: {currentRoom}</div>}
      </header>

      {screen === 'menu' && (
        <Menu
          nickname={nickname} setNickname={setNickname}
          roomCodeInput={roomCodeInput} setRoomCodeInput={setRoomCodeInput}
          CreateRoom={CreateRoom} JoinRoom={JoinRoom}
        />
      )}

      {screen === 'waiting' && (
        <div className="waiting-screen">
          <h2>Waiting for opponent...</h2>
          <p>Share this room code: <strong>{currentRoom}</strong></p>
        </div>
      )}

      {screen === 'game' && (
        <GameTable
          pile_length={pileLength}
          discardPile={discardPile}
          drawnCard={drawnCard}
          handlePileClick={handlePileClick}
          handleDiscardDrawnCard={() => socket.emit('discardDrawnCard', currentRoom)}
          handleKeepDrawnCard={() => socket.emit('keepDrawnCard', currentRoom)}
        />
      )}
    </div>
  );
}

export default App;
