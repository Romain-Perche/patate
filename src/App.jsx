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

  const [pile, setPile] = useState([]);
  const [discardPile, setDiscardPile] = useState([]);
  const [MyCards, setMyCards] = useState(Array(4).fill(null));
  const [YourCards, setYourCards] = useState(Array(4).fill(null));
  const [isFacedUp, setIsFacedUp] = useState(Array(8).fill(false));

  const handlePileClick = () => {
    if (pile.length === 0) return;
    const newPile = [...pile];
    const drawnCard = newPile.pop();
    setPile(newPile);
    setDiscardPile([...discardPile, drawnCard]);
  };

  useEffect(() => {
    socket.on('roomCreated', (code, my_hand) => {
      setCurrentRoom(code);
      setScreen('waiting');
    });

    socket.on('gameStart', () => {
      setScreen('game');
    });

    socket.on('gameStateUpdate', (gameState) => {
      console.log('gamestate : ', gameState);
      setPile(gameState.pile);
      setDiscardPile(gameState.discardPile);
      setMyCards(gameState.myHand);
      setYourCards(gameState.rivalHand);
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
          pile={pile}
          discardPile={discardPile}
          MyCards={MyCards}
          YourCards={YourCards}
          handlePileClick={handlePileClick}
        />
      )}
    </div>
  );
}

export default App;
