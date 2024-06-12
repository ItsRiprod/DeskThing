import './Footer.css';
import React, { useEffect, useState } from 'react';
import CountUpTimer from '../CountUpTimer'; // Ensure you have CountUpTimer defined in another file
import socket, { device_data, song_data } from '../../helpers/WebSocketService';
import {
  IconPlay,
  IconPause,
  IconSkipForward,
  IconSkipBack,
  IconShuffle,
  IconRepeat,
} from '../todothingUIcomponents';

const Footer: React.FC = () => {
  const [local, setLocal] = useState(true);
  const [songData, setSongData] = useState<song_data>();
  const [imageData, setImageData] = useState<string>();
  const [play, setPlay] = useState(false);

  const handleDeviceData = (data: device_data) => {
    //setLocal(!data.device.is_active);
    setLocal(false);
    setPlay(data.is_playing);
  };

  const handleSongData = (data: song_data) => {
    setSongData(data);
  };

  useEffect(() => {
    const listener = (msg: any) => {
      if (msg.type === 'device_data') {
        handleDeviceData(msg.data);
      }
      if (msg.type === 'song_data') {
        handleSongData(msg.data);
      }
      if (msg.type === 'img_data') {
        setImageData(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendCommand = (request: string) => {
    if (socket.is_ready()) {
      const data = {
        app: 'spotify',
        type: 'set',
        request: request,
        data: songData?.uri || null,
      };
      socket.post(data);
    }
  };

  const handleGetSongData = () => {
    if (socket.is_ready()) {
      const data = { app:'spotify', type: 'get', request: 'song_info' };
      socket.post(data);
      const data2 = { app:'spotify', type: 'get', request: 'device_info' };
      socket.post(data2);
    }
  };
  const setSpecificDuration = (ms: number) => {
    if (socket.is_ready()) {
      const data = {
        app: 'spotify',
        type: 'set',
        request: 'seek_track',
        position_ms: ms,
      };
      socket.post(data);
    }
  };

  const handlePlayPause = () => {
    setPlay(!play);
    play ? handleSendCommand('pause_track') : handleSendCommand('play_track');
  };

  return (
    <div className="audioPlayer">
      <button className="button getSongInfo" onClick={handleGetSongData}>
        <img width="170px" src={imageData || ''} alt="Switch to Spotify" />
      </button>
      <div className="audioPlayer_controls">
        {local ? (
          <div className="songInformation">
            <div className="songTitle">{' ' + ' - ' + ' '}</div>
            <div className="progressBar_container">
              <div className="progressBar_progress" style={{ width: `0%` }} />
              <p className="progressBar_timer">--:--</p>
            </div>
          </div>
        ) : (
          <div className="songInformation">
            <div className="songTitle">
              {songData?.name + ' - ' + songData?.artistName || 'Track Name'}
            </div>
            <div>
              <CountUpTimer
                onSongEnd={handleGetSongData}
                start={songData?.progress_ms || 0}
                end={songData?.duration_ms || 0}
                play={play}
                onTouchEnd={setSpecificDuration}
                handleSendCommand={handleSendCommand}
              />
            </div>
          </div>
        )}
        <div className="buttonContainer">
          <button
            className="mediaButton previous"
            onClick={() => handleSendCommand('previous_track')}
          >
            <IconRepeat iconSize={48} />
          </button>
          <button
            className="mediaButton previous"
            onClick={() => handleSendCommand('previous_track')}
          >
            <IconSkipBack />
          </button>
          <button className="mediaButton play" onClick={handlePlayPause}>
            {!play ? <IconPlay /> : <IconPause />}
          </button>
          <button className="mediaButton next" onClick={() => handleSendCommand('next_track')}>
            <IconSkipForward />
          </button>
          <button className="mediaButton next" onClick={() => handleSendCommand('next_track')}>
            <IconShuffle iconSize={48} className={'active'} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Footer;
