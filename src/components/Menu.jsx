import { useState } from 'react';

export default function Menu({ nickname, setNickname, roomCodeInput, setRoomCodeInput, CreateRoom, JoinRoom }) {
  const [hasName, setHasName] = useState(false);

  if (!hasName) {
    return (
      <form className='menu' onSubmit={(e) => {
        e.preventDefault();
        if (nickname.trim()) setHasName(true);
      }}>
        <h2>Bienvenue</h2>
        <div className='input-group'>
          <label htmlFor="nickname">Pseudo</label>
          <input id="nickname" type="text" value={nickname} autoFocus
            onChange={(e) => setNickname(e.target.value)}
            placeholder="Ton pseudo" />
        </div>
        <button type="submit" className='btn btn-primary' disabled={!nickname.trim()}>Continuer</button>
      </form>
    );
  }

  return (
    <div className='menu'>
      <h2>Salut {nickname} !</h2>
      <div className='menu-actions'>
        <button onClick={CreateRoom} className='btn btn-primary create-room-button'>
          Créer une partie
        </button>
        <div className='divider'>OU</div>
        <div className='join-group'>
          <input
            type="text" value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            placeholder="Code de la partie"
            aria-label="Code de la partie"
          />
        </div>
        <button onClick={JoinRoom} className='btn btn-ghost join-room-button'>Rejoindre la partie</button>
      </div>
      <button className='link-button' onClick={() => setHasName(false)}>Changer de pseudo</button>
    </div>
  );
}
