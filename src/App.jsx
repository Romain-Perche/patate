import { useState, useEffect, useRef } from 'react';
import './App.css';
import { io } from 'socket.io-client';


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
      </header>

      {/* MENU SCREEN */}
      {screen === 'menu' && (
        <div className='menu'>
          <h2> Welcome to Patate </h2>
          <div className='input-group'>
            <label>Pseudo : </label>
            <input type="text" value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your name" />
          </div>
          <div className='menu-actions'>
            <button onClick={CreateRoom} className='create-room-button'>
              Create New Game
            </button>
            <div className='divider'>OR</div>
            <div className='join-group'>
              <input
                type="text" value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="Room Code"
              />
            </div>
            <button onClick={JoinRoom} className='join-room-button'>Join Game</button>
          </div>
        </div>
      )}

      <main className="game-table">
        <div className="pile-area">
          <div className='pile'>
            {pile.length > 0 && (
              <img
                src="/images/cards/back.png"
                alt="Pile"
                className='card-image'
                onClick={handlePileClick}
              />
            )}
          </div>
          <div className='discard-pile' style={{ minHeight: '150px', minWidth: '100px', display: 'flex', justifyContent: 'center' }}>
            {discardPile.length > 0 && (
              <img
                src={`/images/cards/${discardPile[discardPile.length - 1]}.png`}
                alt="Top Discard"
                className='card-image discard-card'
              />
            )}
          </div>
        </div>
        <div className='hands'>
          <div className="cards">
            {YourCards.map((card, index) => {
              if (!card) return <div key={index} className="empty-slot">Empty</div>;
              return (
                <img
                  key={index}
                  src={'/images/cards/back.png'}
                  alt={`${card}`}
                  className="card-image rival-card"
                />
              );
            })}
          </div>
          <div className="cards">
            {MyCards.map((card, index) => {
              if (!card) return <div key={index} className="empty-slot">Empty</div>;
              return (
                <img
                  key={index}
                  src={`/images/cards/back.png`}
                  alt={`${card}`}
                  className="card-image my-card"
                />
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
