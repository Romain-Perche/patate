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

module.exports = {
  createDeck,
  shuffledDeck
};
