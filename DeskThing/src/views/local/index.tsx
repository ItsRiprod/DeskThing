/* eslint-disable @typescript-eslint/no-explicit-any */
import './styles.css';
import React, { useEffect, useState } from 'react';
import socket, { socketData, song_data } from '../../helpers/WebSocketService';
import { IconAlbum } from '../../components/icons';
import { AppStore } from '../../store';

const Local: React.FC = () => {
  const [songData, setSongData] = useState<song_data>();
  const [imgData, setImgData] = useState<string>();
  const [offset, setOffset] = useState<number>();
  const [opacity, setOpacity] = useState<number>(100);
  const [transitioning, setTransitioning] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);


  const handleSongData = async (data: song_data) => {
    if (data.thumbnail) {
      setImgData(data.thumbnail)
      setImageLoaded(true)
    } else {
      setImageLoaded(false)
    }
    if (songData && data.track_name === songData.track_name) {
      setSongData(data);
    } else {
      setTransitioning(true);
      setOffset(150);
      setOpacity(0);
      setTimeout(async () => {
        setTransitioning(false);
        setSongData(data);
        setOffset(-80);
        setTimeout(() => {
          setOpacity(100);
          setTransitioning(true);
          setOffset(0);
        }, 100);
      }, 700);
    }

  };
  useEffect(() => {

    const listener = async (msg: socketData) => {
      if (msg.type === 'song') {
        await handleSongData(msg.data as song_data);
      }
    };

    const removeListener = socket.on('client', listener);

    return () => {
      removeListener();
    };
  },);

  useEffect(() => {
    const handleGetSongData = () => {
      const settings = AppStore.getSettings()
      const changeSource = settings.local?.change_source?.value == "true"
      // set playback location
      if (changeSource) {
        sendSettingsUpdate('utility', 'playback_location', 'local')
        if (socket.is_ready()) {
          const data = { app: 'local', type: 'get', request: 'song' };
          socket.post(data);
        }
      } else {
        if (socket.is_ready()) {
          const data = { app: 'utility', type: 'get', request: 'song' };
          socket.post(data);
        }
      }
      if (socket.is_ready()) {
        const data = { app: 'utility', type: 'get', request: 'song' };
        socket.post(data);
      }
    };

    handleGetSongData();
  }, [])

  
  const sendSettingsUpdate = (app: string, setting: string, value: string) => {
    if (socket.is_ready()) {
      const data = {
        app: app,
        type: 'set',
        request: 'update_setting',
        data: {
          setting: setting,
          value: value,
        }
      };
      socket.post(data);
    }
  }

  

  return (
    <div className={'flex h-screen w-screen overflow-hidden'}>
      <div className="items-center w-screen flex p-7 img_color text_color">
        <div className="grow-0 shrink-0 flex items-center sm:w-3/5 md:h-4/5 md:w-auto ">

        {imgData && (
          <img
              src={imgData}
              alt="Image"
              className={`grow-0 shrink-0 lg:h-full aspect-square rounded-xl ${!imageLoaded && 'hidden'} rounded-tl-[50px] shadow-2xl rounded-br-[50px] overflow-hidden`}
              onLoad={() => {setImageLoaded(true)}}
              onError={() => {setImageLoaded(false)}}
            />
          )}
          {!imageLoaded && <IconAlbum iconSize={300} />}
        </div>
        <div className="flex-col justify-between overflow-hidden text-left">
          <p className="absolute right-3 text-right bottom-24 font-semibold max-w-96 overflow-hidden">{`Listening On: ${songData?.device || 'Device name'}`}</p>
          <div className={`info_container ${transitioning ? 'transition-all ease-in-out duration-700' : ''} `} style={{transform: `translateX(${offset}px)`, opacity: `${opacity}`}}>
            <p className="m-3">{songData?.album || 'Album'}</p>
            <h1 className="m-3 font-bold text-4xl">{songData?.track_name || 'Song Title'}</h1>
            <h3 className="m-3">{songData?.artist || 'Artist'}</h3>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Local;
