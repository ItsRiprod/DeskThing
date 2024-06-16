import './Header.css';
import React, { useEffect, useState, useRef } from 'react';
import socket from '../../helpers/WebSocketService';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper';

const button_helper = new ButtonHelper();

const Header: React.FC = () => {
  const [input, setInput] = useState('');
  const [button, setButton] = useState('Null');
  const [message, setMessage] = useState('Null');
  const [visible, setVisible] = useState(false);
  const topIslandRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    button_helper.setCallback((btn: Button, flv: EventFlavour) => {
      setButton(Button[btn] + ` ` + EventFlavour[flv]);
    });
  }, []);

  const handleResponseMessage = (data: string) => {
    
    setMessage(JSON.stringify(data));
  };

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'response') {
        handleResponseMessage(msg.data);
      }
      if (msg.type === 'message') {
        console.log('Message ', msg.data)
        handleResponseMessage(msg.data);
      }
      if (msg.type === 'error') {
        handleResponseMessage(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleTouchOutside = (event: TouchEvent) => {
    if (topIslandRef.current && !topIslandRef.current.contains(event.target as Node)) {
      setVisible(false)
    }
  };

  const handleTouchInside = () => {
      setVisible(true)
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
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
    <div className="debug_container">
      <div className={`debug ${visible ? 'visible' : ''}`} ref={topIslandRef} onTouchStart={handleTouchInside}>
        <div className="debug_content">
          <div className="debug_header">
            <h3>DEBUGGING</h3>
            <p>Button: {button}</p>
            <button className="button getDeviceInfo" onClick={handleSendMessage}>
              Send Command
            </button>
          </div>
          <code>Response: {message}</code>
        </div>
      </div>
    </div>
  );
};

export default Header;
