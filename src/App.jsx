import { useState, useEffect } from 'react';
import './App.css';


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



export function App() {
  const [pile, setPile] = useState(createDeck());
  const [MyCards, setMyCards] = useState(Array(4).fill(null));
  const [YourCards, setYourCards] = useState(Array(4).fill(null));
  const [isFacedUp, setIsFacedUp] = useState(Array(8).fill(false))

  const distribute_cards = (pile) => {
    const newPile = pile.slice();
    const newMyCards = Array(4).fill(null);
    const newYourCards = Array(4).fill(null);
    for (let i = 0; i < 4; i++) {
      newMyCards[i] = newPile.pop();
    }
    setMyCards(newMyCards);
    for (let i = 0; i < 4; i++) {
      newYourCards[i] = newPile.pop();
    }
    setYourCards(newYourCards);
    setPile(newPile);
  }

  useEffect(() => {
    distribute_cards(pile);
  }, []);

  return (
    <div className="game-container">
      <header>
        <h1>Patate</h1>
      </header>
      <main className="game-table">
        <div className="cards">
          {MyCards.map((card, index) => {
            if (!card) return <div key={index} className="empty-slot">Empty</div>;
            return (
              <img
                key={index}
                src={`/images/cards/${card}.png`}
                alt={`${card}`}
                className="card-image"
              />
            );
          })}
        </div>
        <div className="cards">
          {YourCards.map((card, index) => {
            if (!card) return <div key={index} className="empty-slot">Empty</div>;
            return (
              <img
                key={index}
                src={`/images/cards/${card}.png`}
                alt={`${card}`}
                className="card-image"
              />
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default App;
