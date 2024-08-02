import './Footer.css';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import CountUpTimer from '../CountUpTimer'; // Ensure you have CountUpTimer defined in another file
import socket, { AUDIO_REQUESTS, socketData, song_data } from '../../helpers/WebSocketService';
import { IconAlbum } from '../icons';
import getBackgroundColor, { findContrastColor } from '../../helpers/ColorExtractor';
import ButtonHelper, { Button, EventFlavour } from '../../helpers/ButtonHelper';
import controlHelper, { ControlKeys } from '../../store/controlStore';
import { PlayPause } from '../../utils/audioControlActions';

const Footer: React.FC = () => {
  const [local, setLocal] = useState(true);
  const [songData, setSongData] = useState<song_data>();
  const [imageData, setImageData] = useState<string>();
  const [play, setPlay] = useState(false);
  const [visible, setVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const playerIslandRef = useRef<HTMLDivElement>(null);
  const buttonHelper = ButtonHelper.getInstance();

  const handleBackgroundColor = async (photo: string) => {
    try {
      const bgColor = await getBackgroundColor(photo);
      const contrast = findContrastColor(bgColor);
      document.documentElement.style.setProperty('--color-albumText', `rgb(${contrast[0]}, ${contrast[1]}, ${contrast[2]})`);
      document.documentElement.style.setProperty('--color-albumColor', `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`);
    } catch (Exception) {
      console.log(Exception)
    }
  }

  useEffect(() => {

    const handleSongData = (data: song_data) => {
      setSongData(data);
      
      setLocal(false);
      setPlay(data.is_playing);
  
      if (data.thumbnail) {
        setImageData(data.thumbnail)
        try {
          handleBackgroundColor(data.thumbnail)
        } catch {
          console.log('Unable to set background color')
        }
      }
  
    };

    const listener = (msg: socketData) => {
      if (msg.type === 'song') {
        handleSongData(msg.data as song_data);
      }
    };

    const removeListener = socket.on('client', listener);
    return () => {
      removeListener()
      
    };
  }, []);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSendSet = useCallback((request: AUDIO_REQUESTS, payload: any = songData?.id) => {
    if (socket.is_ready()) {
      const data = {
        app: 'utility',
        type: 'set',
        request: request,
        data: payload,
      };
      socket.post(data);
    }
  }, [songData]);

  const handleGetSongData = useCallback(() => {
    if (socket.is_ready()) {
      const data = { app: 'utility', type: 'get', request: AUDIO_REQUESTS.SONG };
      socket.post(data);
    }
  }, []);
  const setSpecificDuration = useCallback((ms: number) => {
    handleSendSet(AUDIO_REQUESTS.SEEK, ms);
  }, [handleSendSet]);

  const handleTouchOutside = useCallback((event: TouchEvent) => {
    if (playerIslandRef.current && !playerIslandRef.current.contains(event.target as Node)) {
      setVisible(false);
    }
  }, []);

  const handleTouchInside = useCallback(() => {
    if (playerIslandRef.current) {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, []);

  useEffect(() => {

    buttonHelper.addListener(Button.SCROLL_PRESS, EventFlavour.Down, PlayPause)
    buttonHelper.addListener(Button.SCROLL_PRESS, EventFlavour.LongPress, () => {handleSendSet(AUDIO_REQUESTS.NEXT, songData.id)})
    return () => {
      buttonHelper.removeListener(Button.SCROLL_PRESS, EventFlavour.Down)
      buttonHelper.removeListener(Button.SCROLL_PRESS, EventFlavour.LongPress)
    }
  });

  const renderControlButton = useCallback((key: ControlKeys) => {
    const ControlComponent = controlHelper.getControlComponent(key);
    if (ControlComponent) {
      return <ControlComponent key={key} />;
    }
    return null;
  }, []);

  return (
    <div className={`fixed flex max-w-full bottom-0 transition-all ease-out duration-200 bg-zinc-900 ${visible ? 'h-36' : 'h-16'}`}
    ref={playerIslandRef}
    onTouchStart={handleTouchInside}>
        <button className='max-w-40' onTouchStart={handleGetSongData} onClick={handleGetSongData}>
            {imageData && (
              <img
              src={imageData}
                alt="Image"
                className=''
                onLoad={() => {setImageLoaded(true)}}
                onError={() => {setImageLoaded(false)}}
                style={{ display: imageLoaded ? 'block' : 'none' }}
              />
            )}
            {!imageLoaded && <IconAlbum className='' iconSize={128} />}
        </button>
      <div className="w-screen flex">
        <div className="w-full">
          {local ? (
            <div className="">
              <div className="songTitle">{' ' + ' - ' + ' '}</div>
              <div className="rounded-sm m-auto w-11/12 transition-all overflow-hidden bg-zinc-800 h-2">
                <div className="bg-green-500 static rounded-r-full h-full" style={{ width: `0%` }} />
                <p className="m-0 p-0 -translate-y-8 font-bold">--:--</p>
              </div>
            </div>
          ) : (
            <div className="">

              <div>
                <CountUpTimer
                  onSongEnd={handleGetSongData}
                  start={songData?.track_progress || 0}
                  end={songData?.track_duration || 0}
                  play={play}
                  onTouchStart={handleTouchInside}
                  onTouchEnd={setSpecificDuration}
                  handleSendSet={handleSendSet}
                >
                  <div className="songTitle">
                    {songData?.track_name || 'Track Name'}
                  </div>
                </CountUpTimer>
              </div>
            </div>
          )}
          <div className="overflow-hidden flex align-center justify-around pt-2 text-zinc-500">
            {renderControlButton(ControlKeys.Tray1)}
            {renderControlButton(ControlKeys.Tray2)}
            {renderControlButton(ControlKeys.Tray3)}
            {renderControlButton(ControlKeys.Tray4)}
            {renderControlButton(ControlKeys.Tray5)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
