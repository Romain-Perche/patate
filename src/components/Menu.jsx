export default function Menu({ nickname, setNickname, roomCodeInput, setRoomCodeInput, CreateRoom, JoinRoom }) {
  return (
    <div className='menu'>
      <h2> Welcome to Patate </h2>
      <div className='input-group'>
        <label>Pseudo : </label>
        <input type="text" value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter your name" />
      </div>
      <div className='menu-actions'>
        <button onClick={CreateRoom} className='create-room-button'>
          Create New Game
        </button>
        <div className='divider'>OR</div>
        <div className='join-group'>
          <input
            type="text" value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value)}
            placeholder="Room Code"
          />
        </div>
        <button onClick={JoinRoom} className='join-room-button'>Join Game</button>
      </div>
    </div>
  );
}
