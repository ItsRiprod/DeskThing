/* eslint-disable @typescript-eslint/no-explicit-any */
import './styles.css';
import React, { useEffect, useState } from 'react';
import socket, { socketData, song_data } from '../../helpers/WebSocketService';
import { IconAlbum } from '../../components/icons';
import { AppStore } from '../../store';

const Spotify: React.FC = () => {
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

  useEffect(() => {
    const handleGetSongData = () => {
      const settings = AppStore.getSettings()
      const changeSource = settings.spotify?.change_source?.value == "true"
      // set playback location
      if (changeSource) {
        sendSettingsUpdate('utility', 'playback_location', 'spotify')
        if (socket.is_ready()) {
          const data = { app: 'spotify', type: 'get', request: 'song' };
          socket.post(data);
        }
      } else {
        if (socket.is_ready()) {
          const data = { app: 'utility', type: 'get', request: 'song' };
          socket.post(data);
        }
      }
    };
    
    handleGetSongData();
  }, [])


  return (
    <div className={'flex font-geist h-screen overflow-hidden'}>
      <div className="items-center justify-center sm:justify-start w-full sm:pb-32 flex sm:px-10 sm:pl-10 img_color">
        <div className="flex sm:flex-row flex-col items-center sm:ml-10 sm:h-3/5">
          <div className="flex justify-between">
            <p className="m-3 text-xl sm:hidden">{songData?.album || 'Album'}</p>
            <p className="m-3 text-xl sm:hidden">{songData?.artist || 'Artist'}</p>
          </div>
          <div className="sm:w-3/5 w-4/5 max-h-full md:h-full md:w-auto">
            {imgData && (

              <img
              src={imgData}
              alt="Image"
              className={`shrink-0 grow-0 border-4 bg-cover aspect-square max-h-full ${!imageLoaded && 'hidden'} border-white shadow-2xl overflow-hidden`}
              onLoad={() => {setImageLoaded(true)}}
              onError={() => {setImageLoaded(false)}}
              />
            )}
            {!imageLoaded && <IconAlbum iconSize={300} />}
          </div>
        <div className="flex flex-col h-full overflow-hidden justify-between ml-4 text-left">
          <div className={`${transitioning ? 'transition-all ease-in-out duration-700' : ''} `} style={{transform: `translateX(${offset}px)`, opacity: `${opacity}`}}>
            <p className="m-3 hidden sm:block">{songData?.album || 'Album'}</p>
            <h1 className="m-3 text-5xl font-bold">{songData?.track_name || 'Song Title'}</h1>
            <h3 className="m-3 font-semibold sm:block hidden">{songData?.artist || 'Artist'}</h3>
          </div>
          <div className="sm:relative fixed right-5 sm:right-auto w-0 text-nowrap">
            <p className="-rotate-90 sm:rotate-0 left-0 sm:left-auto font-semibold">{`Listening On: ${songData?.device || 'Device name'}`}</p>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default Spotify;
