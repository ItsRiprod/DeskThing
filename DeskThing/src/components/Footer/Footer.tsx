import './Footer.css';
import React, { useEffect, useState, useRef } from 'react';
import CountUpTimer from '../CountUpTimer'; // Ensure you have CountUpTimer defined in another file
import socket, { AUDIO_REQUESTS, socketData, song_data } from '../../helpers/WebSocketService';
import {
  IconPlay,
  IconPause,
  IconSkipForward,
  IconSkipBack,
  IconShuffle,
  IconRepeat,
  IconRepeatOne,
  IconAlbum,
  IconSkipForward15,
  IconSkipBack15,
} from '../icons';
import getBackgroundColor, { findContrastColor } from '../../helpers/ColorExtractor';


const Footer: React.FC = () => {
  const [local, setLocal] = useState(true);
  const [songData, setSongData] = useState<song_data>();
  const [imageData, setImageData] = useState<string>();
  const [play, setPlay] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [visible, setVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const playerIslandRef = useRef<HTMLDivElement>(null);

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
      setShuffle(data.shuffle_state);
      setRepeat(data.repeat_state);
  
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
  const handleSendSet = (request: string, payload = songData.id as any) => {
    if (socket.is_ready()) {
      const data = {
        app: 'utility',
        type: 'set',
        request: request,
        data: payload,
      };
      socket.post(data);
    }
  };

  const handleRepeat = () => {

    let newRepeat;

    switch (repeat) {
      case 'off':
        newRepeat = 'all';
        break;
      case 'all':
        newRepeat = 'track';
        break;
      case 'track':
        newRepeat = 'off';
        break;
      default:
        newRepeat = 'all';
        break;
    }
    setRepeat(newRepeat);

    handleSendSet(AUDIO_REQUESTS.REPEAT, newRepeat)

  };
  const handleShuffleToggle = () => {
    setShuffle((old) => !old);
    handleSendSet(AUDIO_REQUESTS.SHUFFLE, !shuffle)
  };

  const handleGetSongData = () => {
    if (socket.is_ready()) {
      const data = { app: 'utility', type: 'get', request: AUDIO_REQUESTS.SONG };
      socket.post(data);
    }
  };
  const setSpecificDuration = (ms: number) => {
    handleSendSet(AUDIO_REQUESTS.SEEK, ms)
  };

  const handleTouchOutside = (event: TouchEvent) => {
    if (playerIslandRef.current && !playerIslandRef.current.contains(event.target as Node)) {
      setVisible(false)
    }
  };

  const handleTouchInside = () => {
    if (playerIslandRef.current) {
      setVisible(true)
    }
  };

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchOutside);
    return () => {
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, []);

  const handlePlayPause = () => {
    setPlay(!play);
    play ? handleSendSet(AUDIO_REQUESTS.PAUSE, songData.id) : handleSendSet(AUDIO_REQUESTS.PLAY, songData.id);
  };

  return (
    <div className={`fixed flex max-w-full bottom-0 transition-all ease-out duration-200 ap_color ${visible ? 'h-36' : 'h-16'}`}
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
            <button className="" onClick={handleShuffleToggle}>
              {shuffle ? <IconShuffle iconSize={48} className={'text-green-500'} /> : <IconShuffle iconSize={48} />}
            </button>
            <button
              className="text-green-500"
              onClick={() => handleSendSet(AUDIO_REQUESTS.PREVIOUS, songData.id)}
            >
              {songData?.can_skip ? <IconSkipBack iconSize={48} /> : <IconSkipBack15 iconSize={48} />}
            </button>
            <button className="text-green-500" onClick={handlePlayPause}>
              {!play ? <IconPlay iconSize={48} /> : <IconPause iconSize={48} />}
            </button>
            <button className="text-green-500" onClick={() => handleSendSet(AUDIO_REQUESTS.NEXT, songData.id)}>
              {songData?.can_skip ? <IconSkipForward iconSize={48} /> : <IconSkipForward15 iconSize={48} />}
            </button>
            <button
              className=""
              onClick={handleRepeat}
            >
              {repeat == 'off' ? <IconRepeat iconSize={48} /> : repeat == 'all' ? <IconRepeat className={'text-green-500'} iconSize={48} /> : <IconRepeatOne className={'text-green-500'} iconSize={48} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
