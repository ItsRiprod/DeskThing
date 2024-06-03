import './Trello.css';
import React, { useEffect, useState } from 'react';
import socket, { board_data, list_data, card_data } from '../../helpers/WebSocketService';

const Spotify: React.FC = () => {
  const [boardData, setBoardData] = useState<board_data>();
  const [boardkey, setBoardKey] = useState(-1);
  const [cardData, setCardData] = useState<card_data>();
  const [listData, setListData] = useState<list_data>();

  const handleBoardData = (data: string) => {
    try {
      const formattedData: board_data = JSON.parse(data);
      setBoardData(formattedData);
      console.log(formattedData);
    } catch (error) {
      console.error('Error parsing board data:', error);
    }
  };
  const handleCardData = (data: string) => {
    try {
      const formattedData = JSON.parse(data);
      setCardData(formattedData);
      console.log(formattedData);
    } catch (error) {
      console.error('Error parsing board data:', error);
    }
  };
  const handleListData = (data: string) => {
    try {
      const formattedData = JSON.parse(data);
      setListData(formattedData);
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
      if (msg.type === 'trello_card_data') {
        handleCardData(msg.data);
      }
      if (msg.type === 'trello_list_data') {
        handleListData(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendGet = (get: string, board_id = '') => {
    if (socket.is_ready()) {
      const data = {
        type: 'get',
        get: get,
        data: { board_id: board_id || null },
      };
      socket.post(data);
    }
  };

  const handleGetBoardData = () => {
    handleSendGet('boards_info');
  };
  const handleGetCardDataFromBoard = (id: string) => {
    handleSendGet('cards_from_board', id);
  };
  const handleGetCardDataFromList = (id: string) => {
    handleSendGet('cards_from_list', id);
  };
  const handleGetListData = (id: string) => {
    handleSendGet('lists_from_board', id);
  };

  const handleBoardClick = (key: number) => {
    console.log('Board Clicked:', key);
    if (boardData) {
      const id = boardData[key].id;
      handleGetListData(id);
      setBoardKey(key);
    }
  };

  return (
    <div className="view_trello">
      {boardData ? (
        boardkey == -1 ? (
          <div className="list">
            {boardData.map((board, index) => (
              <button className="card" onClick={() => handleBoardClick(index)} key={board.id}>
                <h2>{board.name}</h2>
              </button>
            ))}
          </div>
        ) : cardData ? (
          <div className="list">
            {cardData.map((card, index) => (
              <button className="card" key={card.id}>
                <h1>{card.name}</h1>
              </button>
            ))}
            <button onClick={() => setCardData(undefined)}>Go Back</button>
          </div>
        ) : listData ? (
          <div className="list">
            {listData.map((list, index) => (
              <button
                className="card"
                onClick={() => handleGetCardDataFromList(list.id)}
                key={list.id}
              >
                <h2>{list.name}</h2>
              </button>
            ))}
            <button onClick={() => setBoardKey(-1)}>Go Back</button>
          </div>
        ) : (
          <div></div>
        )
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
