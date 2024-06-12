import './Volume.css';
import React, { useEffect, useState } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper';
import socket, { device_data } from '../../helpers/WebSocketService';

const Volume: React.FC = () => {
  const [volume, setVolume] = useState(0);
  const [visible, setVisible] = useState(false);
  const buttonHelper = new ButtonHelper();

  const handleDeviceData = (data: device_data) => {

    setVolume(data.device.volume_percent);
  };
  useEffect(() => {
    const handleButtonPress = (btn: Button, flv: EventFlavour) => {
      if (flv === EventFlavour.Short) {
        switch (btn) {
          case Button.SCROLL_RIGHT:
            handleScroll(false);
            break;
          case Button.SCROLL_LEFT:
            handleScroll(true);
            break;
          default:
            break;
        }
      }
    };

    const noOpCallback = () => {};

    buttonHelper.setCallback(handleButtonPress);

    return () => {
      buttonHelper.setCallback(noOpCallback);
    };
  }, [buttonHelper]);

  const handleScroll = (left: boolean) => {
    if (volume < 100 && volume > 0) {
      if (left) {
        setVolume((oldVol) => oldVol - 5);
      } else {
        setVolume((oldVol) => oldVol + 5);
      }
      handleSendCommand('set_vol', volume);
    }
  };

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
    const listener = (msg: any) => {
      if (msg.type === 'device_data') {
        handleDeviceData(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendCommand = (command: string, payload: any) => {
    if (socket.is_ready()) {
      const data = {
        type: 'set',
        request: command,
        app: 'spotify',
        data: payload,
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
