export default function GameTable({ pile, discardPile, MyCards, YourCards, handlePileClick }) {
  return (
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
            if (!card) return <div key={`rival-${index}`} className="empty-slot">Empty</div>;
            return (
              <img
                key={`rival-${index}`}
                src={'/images/cards/back.png'}
                alt="Rival card"
                className="card-image rival-card"
              />
            );
          })}
        </div>
        <div className="cards">
          {MyCards.map((card, index) => {
            if (!card) return <div key={`my-${index}`} className="empty-slot">Empty</div>;
            return (
              <img
                key={`my-${index}`}
                src={`/images/cards/back.png`}
                alt="My card"
                className="card-image my-card"
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}
