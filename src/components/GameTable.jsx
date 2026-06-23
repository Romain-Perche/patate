export default function GameTable({ pile_length, discardPile, drawnCard, handlePileClick, handleDiscardDrawnCard, handleKeepDrawnCard }) {
  const renderHiddenHand = (prefix) => {
    return [0, 1, 2, 3].map((index) => (
      <img
        key={`${prefix}-${index}`}
        src={'/images/cards/back.png'}
        alt="Hidden card"
        className={`card-image ${prefix}-card`}
      />
    ));
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
          {renderHiddenHand('rival')}
        </div>
        <div className="cards">
          {renderHiddenHand('my')}
        </div>
      </div>
    </main>
  );
}
