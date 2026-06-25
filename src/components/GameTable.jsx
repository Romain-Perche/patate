import { useState, useEffect } from 'react';

export default function GameTable({
  pile_length, discardPile, drawnCard, myHand, rivalHand, isRevealed,
  handlePileClick, handleDiscardPileClick, handleDiscardDrawnCard, handleKeepDrawnCard, handleToggleReveal,
  isReplacing, handleMyCardClick,
  phase, matchTimeRemaining, mySkipNextTurn, rivalSkipNextTurn, isMatching, submitMatch, cancelMatch
}) {

  const renderHand = (hand, prefix) => {
    return hand.map((card, index) => {
      if (!card) return <div key={`${prefix}-${index}`} className="empty-slot">Empty</div>;

      return (
        <img
          key={`${prefix}-${index}`}
          src={card === 'hidden' ? '/images/cards/back.png' : `/images/cards/${card}.png`}
          alt={`${prefix} card`}
          className={`card-image ${prefix}-card`}
          onClick={() => {
            if (isReplacing && prefix === 'my') {
              handleMyCardClick(index);
            } else if (isMatching && prefix === 'my') {
              submitMatch(index);
            }
          }}
        />
      );
    });
  };

  return (
    <main className="game-table">
      {phase === 'match' && !isMatching && (
        <div className="match-banner">
          <h2>C'est le moment de jeter vos cartes !</h2>
          <p>Appuyez sur <strong>Entrée</strong> pour jeter une carte</p>
          <p>Appuyez sur <strong>Supprimer</strong> pour passer</p>
          <p>Temps restant: {matchTimeRemaining}s</p>
        </div>
      )}

      {isMatching && (
        <div className="match-banner">
          <h2>Sélectionnez une carte</h2>
          <p>Cliquez sur l'une de vos cartes pour la jeter.</p>
          <div className="match-actions">
            <button className="btn btn-danger" onClick={() => {
              cancelMatch();
            }}>Annuler</button>
          </div>
        </div>
      )}

      <div className="skip-banners">
        {mySkipNextTurn && <div className="skip-banner">Vous passez votre prochain tour !</div>}
        {rivalSkipNextTurn && <div className="skip-banner">L'adversaire passe son prochain tour !</div>}
      </div>

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
              onClick={handleDiscardPileClick}
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
            {!isReplacing ? (
              <>
                <button className="btn btn-danger" onClick={handleDiscardDrawnCard}>Jeter</button>
                <button className="btn btn-success" onClick={handleKeepDrawnCard}>Choisir</button>
              </>
            ) : (
              <p className="replace-instruction">Choisis une carte à remplacer</p>
            )}
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
