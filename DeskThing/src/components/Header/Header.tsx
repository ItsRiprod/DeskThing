import './Header.css';
import React, { useEffect, useState, useRef } from 'react';
import socket, { socketData } from '../../helpers/WebSocketService';


const Header: React.FC = () => {
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('Null');
  const [visible, setVisible] = useState(false);
  const topIslandRef = useRef<HTMLDivElement>(null);

  const handleResponseMessage = (data: string) => {
    
    setMessage(JSON.stringify(data));
  };

  useEffect(() => {
    const listener = (msg: socketData) => {
      if (msg.type === 'response') {
        handleResponseMessage(msg.data as string);
      }
      if (msg.type === 'message') {
        handleResponseMessage(msg.data as string);
      }
      if (msg.type === 'error') {
        handleResponseMessage(msg.data as string);
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
      const data = { app: 'server', type: 'message', data: input + ''};
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
            <p>Button:</p>
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
