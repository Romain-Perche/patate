import { useState, useRef, useLayoutEffect } from 'react';

const points = (n) => `${n} point${Math.abs(n) >= 2 ? 's' : ''}`;

export default function GameTable({
  pile_length, discardPile, drawnCard, myHand, rivalHand,
  handlePileClick, handleDiscardPileClick, handleDiscardDrawnCard, handleKeepDrawnCard,
  isReplacing, handleMyCardClick,
  phase, matchTimeRemaining, mySkipNextTurn, rivalSkipNextTurn, isMatching, declareMatch, skipMatch, submitMatch, cancelMatch,
  patateCalled, handlePatate,
  peeksLeft, peeked, handlePeek, myScore, rivalScore, handlePlayAgain,
  power, lastSwap, handleQueenLook, handleJackSwap, handleSkipPower
}) {
  const [picked, setPicked] = useState([]); // Jack: the (up to 2) cards chosen to swap
  const tableRef = useRef(null);

  // Jack swap: the new hands are already drawn, so each card starts at the other card's place and flies back.
  useLayoutEffect(() => {
    if (!lastSwap) return;
    const find = ({ who, index }) => tableRef.current.querySelector(`[data-slot="${who}-${index}"]`);
    const a = find(lastSwap.a), b = find(lastSwap.b);
    if (!a || !b) return;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    [[a, rb, ra], [b, ra, rb]].forEach(([el, from, to]) => {
      el.classList.add('flying');
      el.animate(
        [{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px)` }, { transform: 'none' }],
        { duration: 1000, easing: 'ease-in-out' }
      ).onfinish = () => el.classList.remove('flying');
    });
  }, [lastSwap?.id]);

  const myPower = power?.mine ? power.type : null;
  const isPicked = (who, index) => picked.some(s => s.who === who && s.index === index);
  const togglePick = (who, index) => setPicked(p =>
    isPicked(who, index) ? p.filter(s => !(s.who === who && s.index === index))
      : p.length < 2 ? [...p, { who, index }] : p);

  const renderHand = (hand, prefix) => {
    return hand.map((card, index) => {
      if (!card) return <div key={`${prefix}-${index}`} className="empty-slot">Vide</div>;
      const shownCard = peeked[`${prefix}-${index}`] || card;

      return (
        <img
          key={`${prefix}-${index}`}
          src={shownCard === 'hidden' ? '/images/cards/back.png' : `/images/cards/${shownCard}.png`}
          alt={prefix === 'my' ? 'Ta carte' : "Carte de l'adversaire"}
          data-slot={`${prefix}-${index}`}
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
    <main className="game-table" ref={tableRef}>
      <div className="pile-area">
        <div className='pile'>
          {pile_length > 0 && (
            <img
              src="/images/cards/back.png"
              alt="Pioche"
              className='card-image'
              onClick={handlePileClick}
            />
          )}
        </div>
        <div className='discard-pile'>
          {discardPile.length > 0 ? (
            <img
              src={`/images/cards/${discardPile[discardPile.length - 1]}.png`}
              alt="Défausse"
              className='card-image discard-card'
              onClick={handleDiscardPileClick}
            />
          ) : <div className="empty-slot">Défausse</div>}
        </div>
      </div>

      <div className='hands'>
        <div className="cards rival-hand">
          {renderHand(rivalHand, 'rival')}
        </div>
        <div className="cards my-hand">
          {renderHand(myHand, 'my')}
        </div>
      </div>

      <aside className="action-panel">
        {drawnCard && (
          <div className="drawn-card-area">
            <img
              src={`/images/cards/${drawnCard}.png`}
              alt="Carte piochée"
              className='card-image'
            />
            <div className="drawn-card-actions">
              {!isReplacing ? (
                <>
                  <button className="btn btn-ghost" onClick={handleDiscardDrawnCard}>Jeter</button>
                  <button className="btn btn-primary" onClick={handleKeepDrawnCard}>Garder</button>
                </>
              ) : (
                <p className="replace-instruction">Choisis une carte à remplacer</p>
              )}
            </div>
          </div>
        )}

        {phase === 'match' && !isMatching && (
          <div className="match-banner">
            <h2>Une carte à jeter ?</h2>
            <div className="match-actions">
              <button className="btn btn-primary" onClick={declareMatch}>Jeter une carte</button>
              <button className="btn btn-ghost" onClick={skipMatch}>Passer</button>
            </div>
            <p className="timer">Temps restant : {matchTimeRemaining} s</p>
          </div>
        )}

        {isMatching && (
          <div className="match-banner">
            <h2>Choisis la carte à jeter</h2>
            <p>Si elle ne va pas avec la défausse, tu passes ton prochain tour.</p>
            <div className="match-actions">
              <button className="btn btn-ghost" onClick={cancelMatch}>Annuler</button>
            </div>
          </div>
        )}

        {phase === 'power' && power && (
          <div className="match-banner">
            {myPower === 'queen' && (
              <>
                <h2>Dame !</h2>
                <p>Choisis une carte à regarder : une des tiennes ou une de l'adversaire.</p>
              </>
            )}
            {myPower === 'jack' && (
              <>
                <h2>Valet !</h2>
                <p>Choisis 2 cartes à échanger ({picked.length}/2).</p>
              </>
            )}
            {!myPower && <p>L'adversaire utilise le pouvoir {power.type === 'queen' ? "d'une Dame" : "d'un Valet"}…</p>}
            {myPower && (
              <div className="match-actions">
                {myPower === 'jack' && (
                  <button className="btn btn-primary" disabled={picked.length < 2} onClick={() => {
                    handleJackSwap(picked[0], picked[1]);
                    setPicked([]);
                  }}>Échanger</button>
                )}
                <button className="btn btn-ghost" onClick={() => {
                  handleSkipPower();
                  setPicked([]);
                }}>Passer</button>
              </div>
            )}
          </div>
        )}

        {phase === 'over' && (
          <div className="match-banner">
            <h2>{myScore < rivalScore ? 'Tu gagnes !' : myScore > rivalScore ? 'Tu perds !' : 'Égalité !'}</h2>
            <p>Toi : {points(myScore)} — Adversaire : {points(rivalScore)}</p>
            <div className="match-actions">
              <button className="btn btn-primary" onClick={handlePlayAgain}>Rejouer</button>
            </div>
          </div>
        )}

        {peeksLeft > 0 && phase !== 'over' && (
          <div className="note">{peeksLeft > 1 ? `Choisis ${peeksLeft} de tes cartes à regarder` : 'Choisis encore 1 de tes cartes à regarder'}</div>
        )}
        {patateCalled && phase !== 'over' && (
          <div className="note note-strong">Patate ! Dernier tour !</div>
        )}
        {mySkipNextTurn && <div className="skip-banner">Mauvaise carte : tu passes ton prochain tour</div>}
        {rivalSkipNextTurn && <div className="skip-banner">Mauvaise carte : l'adversaire passe son prochain tour</div>}

        {phase !== 'over' && !patateCalled && (
          <button className="btn btn-danger patate-button" onClick={handlePatate}>Patate !</button>
        )}
      </aside>
    </main>
  );
}
