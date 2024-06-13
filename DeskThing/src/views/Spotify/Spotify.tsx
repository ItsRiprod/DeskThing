/* eslint-disable @typescript-eslint/no-explicit-any */
import './Spotify.css';
import React, { useEffect, useState } from 'react';
import socket, { device_data, song_data } from '../../helpers/WebSocketService';
import getBackgroundColor, { findContrastColor } from '../../helpers/ColorExtractor';

const Spotify: React.FC = () => {
  const [songData, setSongData] = useState<song_data>();
  const [deviceData, setDeviceData] = useState<device_data>();
  const [bgColor, setBgColor] = useState('#000000');
  const [txtColor, setTxtColor] = useState('#999999');
  const [imgData, setImgData] = useState<string>();
  const [offset, setOffset] = useState<number>();
  const [opacity, setOpacity] = useState<number>(100);
  const [transitioning, setTransitioning] = useState(true);
  const handleDeviceData = (data: device_data) => {
    setDeviceData(data);
  };

  
  const loadColor = async (imageId: string) => {
    const rgbColor = await getBackgroundColor(imageId);
    const contrast = findContrastColor(rgbColor);
    setTxtColor(`rgb(${contrast[0]}, ${contrast[1]}, ${contrast[2]})`);
    setBgColor(`rgb(${rgbColor[0]}, ${rgbColor[1]}, ${rgbColor[2]})`);
  };

  useEffect(() => {
    const handleSongData = (data: song_data) => {
      
      if (songData && data.name === songData.name) {
        loadColor(data.photo);
        setSongData(data);
  
      } else {
        setTransitioning(true);
        setOffset(150);
        setOpacity(0);
        setTimeout(() => {
          setTransitioning(false);
          loadColor(data.photo);
          setSongData(data);
          setOffset(-80);
          setTimeout(() => {
            setOpacity(100);
            setTransitioning(true);
            setOffset(0);
          }, 100)
        }, 700);
      }

    };

    const listener = (msg:any) => {
      if (msg.type === 'device_data') {
        handleDeviceData(msg.data);
      }
      if (msg.type === 'song_data') {
        handleSongData(msg.data);
      }
      if (msg.type === 'img_data') {
        setImgData(msg.data);
        loadColor(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, [ songData ]);

  useEffect(() => {
    handleGetSongData();
  }, [])
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
      const data = { app: 'spotify', type: 'get', request: 'song_info' };
      socket.post(data);
      const data2 = { app: 'spotify', type: 'get', request: 'device_info' };
      socket.post(data2);
    }
  };

  return (
    <div className="view_spotify">
      <div className="view_spotify_img_container" style={{backgroundColor: `${bgColor}`}}>
        <img style={{/*transform: `translateY(${offset}px)`, transition: `${transitioning ? 'transform 2s' : ''}`*/}} src={imgData || ''} alt="Image Loading..." />
      </div>
      <div
        className="view_spotify_info"
        style={{
          backgroundImage: `linear-gradient(to right, ${bgColor}, var(--bg-tinted-highlight))`,
          color: txtColor,
          
        }}
      >
        <p className="view_spotify_device">{`Listening On: ${deviceData?.device.name || 'Device name'}`}</p>
        <div className={`info_container ${transitioning ? 'spotify_fade' : ''} `} style={{transform: `translateX(${offset}px)`, opacity: `${opacity}`}}>
          <p className="view_spotify_album">{songData?.albumName || 'Album'}</p>
          <h1 className="view_spotify_title">{songData?.name || 'Song Title'}</h1>
          <h3 className="view_spotify_artist">{songData?.artistName || 'Artist'}</h3>
        </div>
      </div>
    </div>
  );
};

export default Spotify;
