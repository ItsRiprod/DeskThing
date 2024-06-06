import './Trello.css';
import React, { useEffect, useState } from 'react';
import socket from '../../helpers/WebSocketService';

import Organizations from './Organizations';
import Boards from './Boards';
import Cards from './Cards';
import Lists from './Lists';

interface defaultProps {
  handleSendGet: (command: string, id: string) => void;
}

function Default({ handleSendGet }: defaultProps) {
  return (
    <div className="trello_default">
      <h1>Default</h1>
      <button onClick={() => handleSendGet('org_info', '')}>Send Get</button>
    </div>
  );
}

const Spotify: React.FC = () => {
  const [data, setData] = useState<any>();

  const handleTrelloData = (data: any) => {
    try {
      const formattedData = JSON.parse(data.data);
      const finalData = {
        data: formattedData,
        type: data.type,
      }

      setData(finalData);
      console.log('Data:', finalData);
    } catch (error) {
      console.error('Error parsing trello data:', error);
    }
  };

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'trello_board_data') {
        handleTrelloData(msg);
      }
      if (msg.type === 'trello_card_data') {
        handleTrelloData(msg);
      }
      if (msg.type === 'trello_list_data') {
        handleTrelloData(msg);
      }
      if (msg.type === 'trello_org_data') {
        handleTrelloData(msg);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendGet = (get: string, id = '') => {
    if (socket.is_ready()) {
      const data = {
        type: 'get',
        get: get,
        data: { id: id || null },
      };
      socket.post(data);
    }
  };

  const renderView = () => {
    switch (data?.type || null) {
      case 'trello_org_data':
        return <Organizations data={data.data} handleSendGet={handleSendGet} />;
      case 'trello_board_data':
        return <Boards data={data.data} handleSendGet={handleSendGet} />;
      case 'trello_card_data':
        return <Cards data={data.data} handleSendGet={handleSendGet} />;
      case 'trello_list_data':
        return <Lists data={data.data} handleSendGet={handleSendGet} />;
      case 'default':
      default:
        return <Default handleSendGet={handleSendGet} />;
    }
  };
  return <div className="view_trello">{renderView()}</div>;
};

export default Spotify;
