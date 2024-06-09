import './Launchpad.css';
import React from 'react';
import socket from '../../helpers/WebSocketService';

const Launchpad: React.FC = () => {
  const handleSendSet = (set: string, view: string) => {
    if (socket.is_ready()) {
      const data = {
        type: 'set',
        get: set,
        data: view,
      };
      socket.post(data);
    }
  };

  return (
    <div className="view_launchpad">
      <button onClick={() => handleSendSet('lp_view', 'dashboard')}>Task View</button>
      <button onClick={() => handleSendSet('lp_view', 'colors')}>Color</button>
    </div>
  );
};

export default Launchpad;
