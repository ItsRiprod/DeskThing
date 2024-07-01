import './Volume.css';
import React, { useEffect, useState } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper';
import socket, { device_data, socketData } from '../../helpers/WebSocketService';

const Volume: React.FC = () => {
  const [volume, setVolume] = useState(0);
  const [visible, setVisible] = useState(false);
  const buttonHelper = ButtonHelper.getInstance();

  const handleDeviceData = (data: device_data) => {

    setVolume(data.device.volume_percent);
  };
  useEffect(() => {
    const handleScroll = (left: boolean) => {
      if (volume <= 100 && volume >= 0) {
        if (left) {
          setVolume((oldVol) => oldVol - 5);
        } else {
          setVolume((oldVol) => oldVol + 5);
        }
        handleSendCommand('set_vol', volume);
      }
    };
    
    buttonHelper.addListener(Button.SCROLL_LEFT, EventFlavour.Short, () => handleScroll(true));
    buttonHelper.addListener(Button.SCROLL_RIGHT, EventFlavour.Short, () => handleScroll(false));

    return () => {
      buttonHelper.removeListener(Button.SCROLL_RIGHT, EventFlavour.Short)
      buttonHelper.removeListener(Button.SCROLL_LEFT, EventFlavour.Short)
    };
  }, [buttonHelper, volume]);

  

  useEffect(() => {
    setVisible(true);

    // Set visible to false after 2 seconds
    const timeout = setTimeout(() => {
      setVisible(false);
    }, 1500);

    // Cleanup the timeout to avoid memory leaks
    return () => clearTimeout(timeout);
  }, [volume]);

  useEffect(() => {
    const listener = (msg: socketData) => {
      if (msg.type === 'device_data') {
        handleDeviceData(msg.data as device_data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendCommand = (command: string, payload: number) => {
    if (socket.is_ready()) {
      const data = {
        type: 'set',
        request: command,
        app: 'utility',
        data: payload
      };
      socket.post(data);
    }
  };

  return (
    <div className={visible ? 'volumeControl visible' : 'volumeControl'}>
      <div className="volumeLevel" style={{ height: `${volume}%` }}></div>
    </div>
  );
};

export default Volume;
