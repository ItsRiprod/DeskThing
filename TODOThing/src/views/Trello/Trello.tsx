import './Trello.css';
import React, { useEffect, useState } from 'react';
import socket, { board_data } from '../../helpers/WebSocketService';

const Spotify: React.FC = () => {
  const [boardData, setBoardData] = useState<board_data>();

  const handleBoardData = (data: string) => {
    try {
      const formattedData: board_data = JSON.parse(data);
      setBoardData(formattedData);
      console.log(formattedData);
    } catch (error) {
      console.error('Error parsing board data:', error);
    }
  };

  useEffect(() => {
    handleGetBoardData();
    const listener = (msg: any) => {
      if (msg.type === 'trello_board_data') {
        handleBoardData(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendGet = (get: string) => {
    if (socket.is_ready()) {
      const data = {
        type: 'get',
        get: get,
      };
      socket.post(data);
    }
  };

  const handleGetBoardData = () => {
    console.log('Getting board data...');
    if (socket.is_ready()) {
      const data = { type: 'get', get: 'boards_info' };
      socket.post(data);
    }
  };

  return (
    <div className="view_trello">
      {boardData ? (
        <div className="board_list">
          {boardData.map((board) => (
            <button className="board_card" key={board.id}>
              <h2>{board.name}</h2>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <button onClick={handleGetBoardData}>Get Boards</button>
          <h1>Trello Stuff</h1>
        </div>
      )}
    </div>
  );
};

export default Spotify;
