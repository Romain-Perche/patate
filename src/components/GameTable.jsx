export default function GameTable({ pile_length, discardPile, drawnCard, myHand, rivalHand, isRevealed, handlePileClick, handleDiscardDrawnCard, handleKeepDrawnCard, handleToggleReveal }) {
  const renderHand = (hand, prefix) => {
    return hand.map((card, index) => {
      if (!card) return <div key={`${prefix}-${index}`} className="empty-slot">Empty</div>;
      return (
        <img
          key={`${prefix}-${index}`}
          src={card === 'hidden' ? '/images/cards/back.png' : `/images/cards/${card}.png`}
          alt={`${prefix} card`}
          className={`card-image ${prefix}-card`}
        />
      );
    });
  };

  return (
    <main className="game-table">
      <div className="pile-area">
        <div className='pile'>
          {pile_length > 0 && (
            <img
              src="/images/cards/back.png"
              alt="Pile"
              className='card-image'
              onClick={handlePileClick}
            />
          )}
        </div>
        <div className='discard-pile'>
          {discardPile.length > 0 && (
            <img
              src={`/images/cards/${discardPile[discardPile.length - 1]}.png`}
              alt="Top Discard"
              className='card-image discard-card'
            />
          )}
        </div>
      </div>

      {drawnCard && (
        <div className="drawn-card-area">
          <img
            src={`/images/cards/${drawnCard}.png`}
            alt="Drawn card"
            className='card-image'
          />
          <div className="drawn-card-actions">
            <button className="btn btn-danger" onClick={handleDiscardDrawnCard}>Jeter</button>
            <button className="btn btn-success" onClick={handleKeepDrawnCard}>Choisir</button>
          </div>
        </div>
      )}

      <div className='hands'>
        <div className="cards">
          {renderHand(rivalHand, 'rival')}
        </div>
        <div className="cards">
          {renderHand(myHand, 'my')}
        </div>
      </div>

      <button 
        className={`btn btn-reveal ${isRevealed ? 'btn-danger' : 'btn-success'}`} 
        onClick={handleToggleReveal}
      >
        {isRevealed ? 'Hide Game' : 'Reveal Game'}
      </button>
    </main>
  );
}
