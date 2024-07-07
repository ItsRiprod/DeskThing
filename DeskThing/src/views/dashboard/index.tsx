import { IconDevice } from '../../components/todothingUIcomponents';
import './styles.css';
import React, { useState, useEffect } from 'react';
import socket, { socketData } from '../../helpers/WebSocketService';
const Default: React.FC = (): JSX.Element => {
  const [time, setTime] = useState('00:00');
  const requestPreferences = () => {
    if (socket.is_ready()) {
      const data = {
        app: 'server',
        type: 'get',
      };
      socket.post(data);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (msg: socketData) => {
      if (msg.type === 'time') {
        setTime(msg.data as string);
        console.log(msg)
      }
    };

    socket.addSocketEventListener(listener);

    requestPreferences()
    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  return (
    <div className="view_default">
      <IconDevice iconSize={445} text={time} fontSize={150}/>
    </div>
  );
};

export default Default;
