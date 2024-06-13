import './Header.css';
import React, { useEffect, useState } from 'react';
import socket from '../../helpers/WebSocketService';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper';

const button_helper = new ButtonHelper();

const Header: React.FC = () => {
  const [input, setInput] = useState('');
  const [button, setButton] = useState('Null');
  const [message, setMessage] = useState('Null');

  useEffect(() => {
    button_helper.setCallback((btn: Button, flv: EventFlavour) => {
      setButton(Button[btn] + ` ` + EventFlavour[flv]);
    });
  }, []);

  const handleResponseMessage = (data: string) => {
    setMessage(data);
  };

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'response') {
        handleResponseMessage(msg.data);
      }
      if (msg.type === 'message') {
        console.log(msg);
      }
      if (msg.type === 'error') {
        console.log(msg);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendMessage = () => {
    if (socket.is_ready()) {
      const data = { type: 'message', data: input + '' + button };
      socket.post(data);
      setInput('');
    }
  };

  return (
    <div className="debug">
      <div className="debug_pullTab"></div>
      <div className="debug_content">
        <div className="debug_header">
          <p>Button: {button}</p>
          <button className="button getDeviceInfo" onClick={handleSendMessage}>
            Send Command
          </button>
        </div>
        <code>Response: {message}</code>
      </div>
    </div>
  );
};

export default Header;
