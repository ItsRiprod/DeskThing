import './App.css';
import React, { useEffect, useState } from 'react';
import ButtonHelper, { Button, EventFlavour } from './helpers/ButtonHelper';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { secondsFormat, secondsToMinutesFormat } from './helpers/TimeUtils';

const button_helper = new ButtonHelper();

const App: React.FC = (): JSX.Element => {
  const [input, setInput] = useState('');
  const [button, setButton] = useState('Null');
  const [message, setMessage] = useState('Null');
  const [play, setPlay] = useState(false);
  const [local, setLocal] = useState(false);
  const [songData, setSongData] = useState({
    data: {
      photo: null,
      duration_ms: 1,
      name: null,
      progress_ms: 1,
      artistName: null,
    },
  });

  // TODO: Move to @./helpers/WebSocketService.ts 
  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:8891', {
    onOpen: () => console.log('Connected to WebSocket server'),
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'response':
            setMessage(data.data);
            break;
          case 'trackData':
            setSongData(data);
            if (data.data.is_playing) {
              setPlay(true);
            } else {
              setPlay(false);
            }
            console.log(data);
            break;
          case 'deviceData':
            if (data.data.is_playing) {
              setPlay(true);
            } else {
              setPlay(false);
            }
            setLocal(!data.data.device.is_active);
            console.log(data);
            break;
          default:
            console.log('Unknown action from server message: ');
            console.log(data);
        }
      } catch (e) {
        console.error('Error parsing JSON message:', e);
        setMessage('Error');
      }
    },
    onError: (event) => console.error('WebSocket error: ', event),
    shouldReconnect: () => true, // Will attempt to reconnect on all close events
  });

  useEffect(() => {
    button_helper.addListener(Button.BUTTON_1, EventFlavour.Up, () => setButton('Button 1'));
    button_helper.addListener(Button.BUTTON_2, EventFlavour.Up, () => setButton('Button 2'));
    button_helper.addListener(Button.BUTTON_3, EventFlavour.Up, () => setButton('Button 3'));
    button_helper.addListener(Button.BUTTON_4, EventFlavour.Up, () => setButton('Button 4'));
    button_helper.addListener(Button.BUTTON_5, EventFlavour.Up, () => setButton('Button 5'));

    button_helper.addListener(Button.FRONT_BUTTON, EventFlavour.Up, handlePlayTrack);
    button_helper.addListener(Button.SCROLL_LEFT, EventFlavour.Up, () => setButton('Left Scroll'));
    button_helper.addListener(Button.SCROLL_RIGHT, EventFlavour.Up, () =>
      setButton('Right Scroll')
    );
    button_helper.addListener(Button.SCROLL_PRESS, EventFlavour.Up, () =>
      setButton('Scroll Press')
    );

    return () => {
      button_helper.removeListener(Button.BUTTON_1, EventFlavour.Up);
      button_helper.removeListener(Button.BUTTON_2, EventFlavour.Up);
      button_helper.removeListener(Button.BUTTON_3, EventFlavour.Up);
      button_helper.removeListener(Button.BUTTON_4, EventFlavour.Up);
      button_helper.removeListener(Button.BUTTON_5, EventFlavour.Up);
      button_helper.removeListener(Button.FRONT_BUTTON, EventFlavour.Up);
      button_helper.removeListener(Button.SCROLL_LEFT, EventFlavour.Up);
      button_helper.removeListener(Button.SCROLL_RIGHT, EventFlavour.Up);
      button_helper.removeListener(Button.SCROLL_PRESS, EventFlavour.Up);
    };
  }, []);

  const handleSendMessage = () => {
    if (button) {
      const data = {
        type: 'message',
        data: input + '' + button,
      };
      sendMessage(JSON.stringify(data));
      setInput('');
    }
  };

  const handleNextTrack = () => {
    if (local) {
      const data = {
        type: 'command',
        command: 'next_track',
        spotify: false,
      };
      sendMessage(JSON.stringify(data));
    } else {
      const data = {
        type: 'command',
        command: 'next_track',
        spotify: true,
      };
      sendMessage(JSON.stringify(data));
    }
  };
  const handlePreviousTrack = () => {
    if (local) {
      const data = {
        type: 'command',
        command: 'previous_track',
        spotify: false,
      };
      sendMessage(JSON.stringify(data));
    }
  };
  const handlePauseTrack = () => {
    if (local) {
      const data = {
        type: 'command',
        command: 'pause_track',
        spotify: false,
      };
      sendMessage(JSON.stringify(data));
    }
  };
  const handleGetBoards = () => {
    if (local) {
      const data = {
        type: 'command',
        command: 'pause_track',
        spotify: false,
      };
      sendMessage(JSON.stringify(data));
    }
  };
  const handlePlayTrack = () => {
    if (local) {
      setPlay((prev) => !prev);
      const data = {
        type: 'command',
        command: 'play_track',
        spotify: false,
      };
      sendMessage(JSON.stringify(data));
    }
  };
  const handleGetSongData = () => {
    const data = {
      type: 'get',
      get: 'song_info',
    };
    sendMessage(JSON.stringify(data));
  };
  const handleGetDeviceData = () => {
    if (button) {
      const data = {
        type: 'get',
        get: 'device_info',
      };
      sendMessage(JSON.stringify(data));
      handleGetSongData();
    }
  };

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  return (
    <div className="App">
      <header className="App-header">
        <div className="debug">
          <div className="debug_pullTab"></div>
          <p>Current Button: {button}</p>
          <p>Response: {message}</p>
          <p>IsLocal: {local ? 'true' : 'false'}</p>
          <button
            style={{ background: 'gray', aspectRatio: '1', border: 'none', padding: '15px' }}
            onClick={handleSendMessage}
          >
            {'->'}
          </button>
        </div>
        {/* Body Elements*/}
        <div className="body">
          <p style={{ fontSize: '70px', fontFamily: "'Bebas Neue', cursive" }}>TODOThing</p>
          <button className="getBoards" onClick={handleGetBoards}>
            Get Board
          </button>
        </div>
        {/* Footer Elements*/}
        <div className="audioPlayer">
          <div className="songInformation">
            <div className="songTitle">
              {songData?.data.name + ' - ' + songData?.data.artistName || 'Track Name'}
            </div>
            <div className="progressBar_container">
              <CountUpTimer
                onSongEnd={handleGetSongData}
                start={songData?.data.progress_ms || 0}
                end={songData?.data.duration_ms || 0}
                play={play}
              />
            </div>
          </div>
          <div className="buttonContainer">
            <button className="button getSongInfo" onClick={handleGetDeviceData}>
              <img src={songData?.data.photo || ''} alt="Icon" />
            </button>
            <button className="button previous" onClick={handlePreviousTrack}>
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
            <button className="button play" onClick={handlePlayTrack}>
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
            <button className="button next" onClick={handleNextTrack}>
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
      </header>
    </div>
  );
};

interface CountUpTimerProps {
  start?: number;
  end?: number;
  onSongEnd?: () => void; // Callback function to be called when the song ends
  play?: boolean;
}

const CountUpTimer: React.FC<CountUpTimerProps> = ({ start, end, onSongEnd, play }) => {
  const [seconds, setSeconds] = useState(0);
  const [secondsEnd, setSecondsEnd] = useState(60);
  useEffect(() => {
    const myInterval = setInterval(() => {
      if (play) {
        if (seconds < secondsEnd) {
          setSeconds(seconds + 1);
        } else {
          if (onSongEnd) {
            onSongEnd();
            setSeconds(0);
          }
        }
      }
    }, 1000);
    return () => {
      clearInterval(myInterval);
    };
  });

  useEffect(() => {
    if (start && end) {
      const startInSeconds = Math.round(start / 1000);
      const endInSeconds = Math.round(end / 1000);
      setSeconds(startInSeconds);
      setSecondsEnd(endInSeconds);
      console.log(start + ' ' + end);
    }
  }, [start, end]);
  return (
    <>
      <div
        className="progressBar_progress"
        style={{
          width: `${(seconds / secondsEnd) * 100 || 0}%`,
        }}
      />
      <p className="progressBar_timer">
        {secondsToMinutesFormat(seconds)}:{secondsFormat(seconds)}
      </p>
    </>
  );
};

export default App;
