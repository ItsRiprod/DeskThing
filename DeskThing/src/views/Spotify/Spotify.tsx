/* eslint-disable @typescript-eslint/no-explicit-any */
import './Spotify.css';
import React, { useEffect, useState } from 'react';
import socket, { device_data, song_data } from '../../helpers/WebSocketService';
import getBackgroundColor, { findContrastColor } from '../../helpers/ColorExtractor';

const Spotify: React.FC = () => {
  const [songData, setSongData] = useState<song_data>();
  const [play, setPlay] = useState(false);
  const [bgColor, setBgColor] = useState('#000000');
  const [txtColor, setTxtColor] = useState('#999999');
  const handleDeviceData = (data: device_data) => {
    setPlay(data.is_playing);
  };

  const handleSongData = (data: song_data) => {
    setSongData(data);
    loadColor(data.photo);
  };
  const loadColor = async (imageId: string) => {
    const rgbColor = await getBackgroundColor(imageId);
    const contrast = findContrastColor(rgbColor);
    setTxtColor(`rgb(${contrast[0]}, ${contrast[1]}, ${contrast[2]})`);
    setBgColor(`rgb(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]})`);
  };

  useEffect(() => {
    handleGetSongData();
    const listener = (msg:any) => {
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

  //const handleSendCommand = (command: string) => {
  //  if (socket.is_ready()) {
  //    const data = {
  //      type: 'command',
  //      command: command,
  //      spotify: !local,
  //      uri: songData?.uri || null,
  //    };
  //    socket.post(data);
  //  }
  //};

  const handleGetSongData = () => {
    if (socket.is_ready()) {
      const data = { type: 'get', get: 'song_info' };
      socket.post(data);
      const data2 = { type: 'get', get: 'device_info' };
      socket.post(data2);
    }
  };

  return (
    <div className="view_spotify">
      <div className="view_spotify_img_container">
        <img src={songData?.photo || ''} alt="Image Loading..." />
      </div>
      <div
        className="view_spotify_info"
        style={{
          backgroundImage: `linear-gradient(to right, ${bgColor} 15%, var(--bg-base))`,
          color: txtColor,
        }}
      >
        <h1 className="view_spotify_title">{songData?.name || 'Song Title'}</h1>
        <p className="view_spotify_artist">{songData?.artistName || 'Artist'}</p>
        <p className="">{play ? 'Playing' : 'Paused'}</p>
      </div>
    </div>
  );
};

export default Spotify;
