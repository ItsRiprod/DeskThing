import './Volume.css';
import React, { useEffect, useState } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper';
import socket, { song_data, socketData } from '../../helpers/WebSocketService';
import controlHandler, { ControlKeys } from '../../helpers/controlHandler';

const Volume: React.FC = () => {
  const [volume, setVolume] = useState(0);
  const [visible, setVisible] = useState(false);
  const buttonHelper = ButtonHelper.getInstance();

  const handleDeviceData = (data: song_data) => {

    setVolume(data.volume);
  };
  useEffect(() => {
    buttonHelper.addListener(Button.SCROLL_LEFT, EventFlavour.Short, () => controlHandler.runControlAction(ControlKeys.DialScrollLeft));
    buttonHelper.addListener(Button.SCROLL_RIGHT, EventFlavour.Short, () => controlHandler.runControlAction(ControlKeys.DialScrollRight));

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
      if (msg.type === 'song') {
        handleDeviceData(msg.data as song_data);
      }
    };

    const removeListener = socket.on('client', listener);
    const unsubscribe = controlHandler.subscribeToSongDataUpdate(handleDeviceData);
    return () => {
      removeListener()
      unsubscribe()
    };
  }, []);

  return (
    <div className={visible ? 'volumeControl visible' : 'volumeControl'}>
      <div className="volumeLevel" style={{ height: `${volume}%` }}></div>
    </div>
  );
};

export default Volume;
