import './Footer.css';
import React, { useEffect, useState } from 'react';
import CountUpTimer from '../CountUpTimer'; // Ensure you have CountUpTimer defined in another file
import WebSocketService, { device_data, song_data } from '../../helpers/WebSocketService';

const socket = new WebSocketService();

const Footer: React.FC = () => {
  const [local, setLocal] = useState(true);
  const [songData, setSongData] = useState<song_data>();
  const [play, setPlay] = useState(false);

  const handleDeviceData = (data: device_data) => {
    setLocal(!data.device.is_active);
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
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const handleSendCommand = (command: string) => {
    if (socket.is_ready()) {
      const data = {
        type: 'command',
        command: command,
        spotify: !local,
        uri: songData?.uri || null,
      };
      socket.post(data);
    }
  };

  const handleGetSongData = () => {
    if (socket.is_ready()) {
      const data = { type: 'get', get: 'song_info' };
      socket.post(data);
      const data2 = { type: 'get', get: 'device_info' };
      socket.post(data2);
    }
  };

  return (
    <div className="audioPlayer">
      <button className="button getSongInfo" onClick={handleGetSongData}>
        <img width="170px" src={songData?.photo || ''} alt="Switch to Spotify" />
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
            <div className="progressBar_container">
              <CountUpTimer
                onSongEnd={handleGetSongData}
                start={songData?.progress_ms || 0}
                end={songData?.duration_ms || 0}
                play={play}
              />
            </div>
          </div>
        )}
        <div className="buttonContainer">
          <button className="button previous" onClick={() => handleSendCommand('previous_track')}>
            <svg
              data-encore-id="icon"
              role="img"
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="icon"
              width="100"
              height="100"
            >
              <path d="M3.3 1a.7.7 0 0 1 .7.7v5.15l9.95-5.744a.7.7 0 0 1 1.05.606v12.575a.7.7 0 0 1-1.05.607L4 9.149V14.3a.7.7 0 0 1-.7.7H1.7a.7.7 0 0 1-.7-.7V1.7a.7.7 0 0 1 .7-.7h1.6z"></path>
            </svg>
          </button>
          <button
            className="button play"
            onClick={
              play ? () => handleSendCommand('pause_track') : () => handleSendCommand('play_track')
            }
          >
            {play ? (
              <svg
                data-encore-id="icon"
                role="img"
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="icon"
                width="100"
                height="100"
              >
                <path d="M2.7 1a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7H2.7zm8 0a.7.7 0 0 0-.7.7v12.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-2.6z"></path>
              </svg>
            ) : (
              <svg
                data-encore-id="icon"
                role="img"
                aria-hidden="true"
                viewBox="0 0 16 16"
                className="icon"
                width="100"
                height="100"
              >
                <path d="M3 1.713a.7.7 0 0 1 1.05-.607l10.89 6.288a.7.7 0 0 1 0 1.212L4.05 14.894A.7.7 0 0 1 3 14.288V1.713z"></path>
              </svg>
            )}
          </button>
          <button className="button next" onClick={() => handleSendCommand('next_track')}>
            <svg
              data-encore-id="icon"
              role="img"
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="icon"
              width="100"
              height="100"
            >
              <path d="M12.7 1a.7.7 0 0 0-.7.7v5.15L2.05 1.107A.7.7 0 0 0 1 1.712v12.575a.7.7 0 0 0 1.05.607L12 9.149V14.3a.7.7 0 0 0 .7.7h1.6a.7.7 0 0 0 .7-.7V1.7a.7.7 0 0 0-.7-.7h-1.6z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Footer;
