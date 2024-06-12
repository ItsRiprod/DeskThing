import './Header.css';
import React, { useEffect, useState } from 'react';
import socket, { device_data } from '../../helpers/WebSocketService';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper';

const button_helper = new ButtonHelper();

const Header: React.FC = () => {
  const [input, setInput] = useState('');
  const [button, setButton] = useState('Null');
  const [message, setMessage] = useState('Null');
  const [local, setLocal] = useState(true);

  useEffect(() => {
    button_helper.setCallback((btn: Button, flv: EventFlavour) => {
      setButton(Button[btn] + ` ` + EventFlavour[flv]);
    });
  }, []);

  const handleResponseMessage = (data: string) => {
    setMessage(data);
  };

  const handleDeviceData = (data: device_data) => {
    //setLocal(data.device.is_active);
    console.log(data);
    setLocal(false);
  };

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'response') {
        handleResponseMessage(msg.data);
      }
      if (msg.type === 'device_data') {
        handleDeviceData(msg.data);
      }
      if (msg.type === 'message') {
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

  const handleGetDeviceData = () => {
    if (socket.is_ready()) {
      const data = { type: 'get', get: 'device_info' };
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
          <button
            className="button playbackButton"
            onClick={local ? handleGetDeviceData : () => setLocal(true)}
          >
            Playback: {local ? 'Computer' : 'Spotify'}
          </button>
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
