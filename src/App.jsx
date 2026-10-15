import { useState, useEffect } from 'react';
import './App.css';
import { io } from 'socket.io-client';
import Menu from './components/Menu';
import GameTable from './components/GameTable';

const socket = io();

export function App() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'waiting', 'game'
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [pileLength, setPileLength] = useState(0);
  const [discardPile, setDiscardPile] = useState([]);
  const [drawnCard, setDrawnCard] = useState(null);
  const [myHand, setMyHand] = useState(Array(4).fill(null));
  const [rivalHand, setRivalHand] = useState(Array(4).fill(null));
  const [isReplacing, setIsReplacing] = useState(false);
  const [currentTurnName, setCurrentTurnName] = useState('');
  const [phase, setPhase] = useState('turn');
  const [matchTimeRemaining, setMatchTimeRemaining] = useState(0);
  const [mySkipNextTurn, setMySkipNextTurn] = useState(false);
  const [rivalSkipNextTurn, setRivalSkipNextTurn] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [patateCalled, setPatateCalled] = useState(false);
  const [peeksLeft, setPeeksLeft] = useState(0);
  const [peeked, setPeeked] = useState({}); // 'my-0' / 'rival-3' -> card, shown for a short time
  const [power, setPower] = useState(null); // { type: 'queen' | 'jack', mine: bool }
  const [lastSwap, setLastSwap] = useState(null); // last Jack swap: { id, a: {who, index}, b: {who, index} }
  const [myScore, setMyScore] = useState(null);
  const [rivalScore, setRivalScore] = useState(null);

  const handlePileClick = () => {
    if (pileLength === 0) return;
    socket.emit('drawFromPile', currentRoom);
  };

  const handleDiscardPileClick = () => {
    if (discardPile.length === 0) return;
    socket.emit('drawFromDiscard', currentRoom);
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
      setMyHand(gameState.myHand);
      setRivalHand(gameState.rivalHand);
      setCurrentTurnName(gameState.currentTurnName);
      setPhase(gameState.phase);
      setMatchTimeRemaining(gameState.matchTimeRemaining);
      setMySkipNextTurn(gameState.mySkipNextTurn);
      setRivalSkipNextTurn(gameState.rivalSkipNextTurn);
      setPatateCalled(gameState.patateCalled);
      setPeeksLeft(gameState.peeksLeft);
      setPower(gameState.power);
      setLastSwap(gameState.lastSwap);
      setMyScore(gameState.myScore);
      setRivalScore(gameState.rivalScore);
      
      if (gameState.drawnFromDiscard) {
        setIsReplacing(true);
      } else if (!gameState.drawnCard) {
        setIsReplacing(false);
      }
    });

    socket.on('joinError', (message) => alert(message));

    socket.on('opponentLeft', () => {
      alert('Ton adversaire est parti.');
      setCurrentRoom(null);
      setScreen('menu');
    });

    socket.on('peekResult', (who, index, card) => {
      const key = `${who}-${index}`;
      setPeeked(p => ({ ...p, [key]: card }));
      setTimeout(() => setPeeked(p => {
        const rest = { ...p };
        delete rest[key];
        return rest;
      }), 2000); // ponytail: 2s to memorize, change here if too short
    });

    return () => {
      socket.off('roomJoined');
      socket.off('gameStart');
      socket.off('gameStateUpdate');
      socket.off('joinError');
      socket.off('opponentLeft');
      socket.off('peekResult');
    };
  }, []);

  useEffect(() => {
    if (phase === 'turn') {
      setIsMatching(false);
    }
  }, [phase]);

  const declareMatch = () => {
    if (mySkipNextTurn) return;
    socket.emit('declareMatch', currentRoom);
    setIsMatching(true);
  };
  const skipMatch = () => socket.emit('skipMatchPhase', currentRoom);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (phase === 'match' && !isMatching) {
        if (e.key === 'Enter') declareMatch();
        else if (e.key === 'Backspace') skipMatch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isMatching, currentRoom, mySkipNextTurn]);

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
        {currentRoom && screen === 'game' ? (
          <div className="room-info">C'est à {currentTurnName} de jouer</div>
        ) : currentRoom ? (
          <div className="room-info">Room Code: {currentRoom}</div>
        ) : null}
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
          myHand={myHand}
          rivalHand={rivalHand}
          handlePileClick={handlePileClick}
          handleDiscardPileClick={handleDiscardPileClick}
          handleDiscardDrawnCard={() => {
            socket.emit('discardDrawnCard', currentRoom);
            setIsReplacing(false);
          }}
          handleKeepDrawnCard={() => setIsReplacing(true)}
          isReplacing={isReplacing}
          handleMyCardClick={(index) => {
            if (isReplacing) {
              socket.emit('replaceCard', currentRoom, index);
              setIsReplacing(false);
            }
          }}
          phase={phase}
          matchTimeRemaining={matchTimeRemaining}
          mySkipNextTurn={mySkipNextTurn}
          rivalSkipNextTurn={rivalSkipNextTurn}
          isMatching={isMatching}
          declareMatch={declareMatch}
          skipMatch={skipMatch}
          patateCalled={patateCalled}
          handlePatate={() => socket.emit('patate', currentRoom)}
          peeksLeft={peeksLeft}
          peeked={peeked}
          handlePeek={(index) => socket.emit('peekCard', currentRoom, index)}
          power={power}
          lastSwap={lastSwap}
          handleQueenLook={(who, index) => socket.emit('queenLook', currentRoom, who, index)}
          handleJackSwap={(a, b) => socket.emit('jackSwap', currentRoom, a, b)}
          handleSkipPower={() => socket.emit('skipPower', currentRoom)}
          myScore={myScore}
          rivalScore={rivalScore}
          handlePlayAgain={() => socket.emit('playAgain', currentRoom)}
          submitMatch={(indice) => {
            socket.emit('submitMatch', currentRoom, indice);
            setIsMatching(false);
          }}
          cancelMatch={() => {
            socket.emit('cancelMatch', currentRoom);
            setIsMatching(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
