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

// Fisher-Yates: every card order has the same chance.
const shuffledDeck = (deck) => {
  const newDeck = deck.slice();
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

const cardPoints = (card) => {
  if (!card) return 0; // slot emptied by a match
  if (card === 'Joker') return -1;
  if (card === '10_of_clubs') return -2;
  const [value, , suit] = card.split('_');
  if (value === 'K' && (suit === 'hearts' || suit === 'diamonds')) return 0;
  if (value === 'A') return 1;
  if (['J', 'Q', 'K'].includes(value)) return 10;
  return Number(value);
}

const handScore = (hand) => hand.reduce((sum, card) => sum + cardPoints(card), 0);

module.exports = {
  createDeck,
  shuffledDeck,
  handScore
};
