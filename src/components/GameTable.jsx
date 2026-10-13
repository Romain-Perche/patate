import { useState } from 'react';

export default function GameTable({
  pile_length, discardPile, drawnCard, myHand, rivalHand,
  handlePileClick, handleDiscardPileClick, handleDiscardDrawnCard, handleKeepDrawnCard,
  isReplacing, handleMyCardClick,
  phase, matchTimeRemaining, mySkipNextTurn, rivalSkipNextTurn, isMatching, submitMatch, cancelMatch,
  patateCalled, handlePatate,
  peeksLeft, peeked, handlePeek, myScore, rivalScore, handlePlayAgain,
  power, handleQueenLook, handleJackSwap, handleSkipPower
}) {
  const [picked, setPicked] = useState([]); // Jack: the (up to 2) cards chosen to swap
  const myPower = power?.mine ? power.type : null;
  const isPicked = (who, index) => picked.some(s => s.who === who && s.index === index);
  const togglePick = (who, index) => setPicked(p =>
    isPicked(who, index) ? p.filter(s => !(s.who === who && s.index === index))
      : p.length < 2 ? [...p, { who, index }] : p);

  const renderHand = (hand, prefix) => {
    return hand.map((card, index) => {
      if (!card) return <div key={`${prefix}-${index}`} className="empty-slot">Empty</div>;
      const shownCard = peeked[`${prefix}-${index}`] || card;

      return (
        <img
          key={`${prefix}-${index}`}
          src={shownCard === 'hidden' ? '/images/cards/back.png' : `/images/cards/${shownCard}.png`}
          alt={`${prefix} card`}
          className={`card-image ${prefix}-card${isPicked(prefix, index) ? ' selected' : ''}`}
          onClick={() => {
            if (myPower === 'queen') {
              handleQueenLook(prefix, index);
            } else if (myPower === 'jack') {
              togglePick(prefix, index);
            } else if (isReplacing && prefix === 'my') {
              handleMyCardClick(index);
            } else if (isMatching && prefix === 'my') {
              submitMatch(index);
            } else if (peeksLeft > 0 && prefix === 'my') {
              handlePeek(index);
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

      {phase === 'power' && power && (
        <div className="match-banner">
          {myPower === 'queen' && (
            <>
              <h2>Dame !</h2>
              <p>Clique sur une carte (la tienne ou celle de l'adversaire) pour la regarder.</p>
            </>
          )}
          {myPower === 'jack' && (
            <>
              <h2>Valet !</h2>
              <p>Choisis 2 cartes à échanger ({picked.length}/2).</p>
              <button className="btn btn-success" disabled={picked.length < 2} onClick={() => {
                handleJackSwap(picked[0], picked[1]);
                setPicked([]);
              }}>Échanger</button>
            </>
          )}
          {!myPower && <h2>L'adversaire utilise le pouvoir {power.type === 'queen' ? "d'une Dame" : "d'un Valet"}...</h2>}
          {myPower && (
            <button className="btn btn-danger" onClick={() => {
              handleSkipPower();
              setPicked([]);
            }}>Passer</button>
          )}
        </div>
      )}

      {phase === 'over' && (
        <div className="match-banner">
          <h2>Partie terminée !</h2>
          <p>Toi : {myScore} points — Adversaire : {rivalScore} points</p>
          <h2>{myScore < rivalScore ? 'Tu gagnes !' : myScore > rivalScore ? 'Tu perds !' : 'Égalité !'}</h2>
          <button className="btn btn-success" onClick={handlePlayAgain}>Rejouer</button>
        </div>
      )}
      {peeksLeft > 0 && phase !== 'over' && (
        <div className="skip-banner">Clique sur {peeksLeft} de tes cartes pour les regarder</div>
      )}
      {patateCalled && phase !== 'over' && (
        <div className="skip-banner">Patate ! Dernier tour !</div>
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

      {phase !== 'over' && !patateCalled && (
        <button className="btn btn-danger" onClick={handlePatate}>Patate !</button>
      )}
    </main>
  );
}
