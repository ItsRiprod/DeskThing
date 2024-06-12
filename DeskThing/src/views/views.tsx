import { useState, useEffect, useMemo  } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../helpers/ButtonHelper';
import socket from '../helpers/WebSocketService';
import Spotify from './Spotify/Spotify';
import Default from './default/default';
import Trello from './Trello/Trello';
import Weather from './Weather/Weather';
import Launchpad from './Launchpad/Launchpad';
import Discord from './Discord/Discord';
import './views.css';


const ViewManager = () => {
  const [currentView, setCurrentView] = useState('default');
  const buttonHelper = useMemo(() => new ButtonHelper(), []);

  useEffect(() => {
    const handleButtonPress = (btn: Button, flv: EventFlavour) => {
      if (flv === EventFlavour.Up) {
        switch (btn) {
          case Button.BUTTON_1:
            setCurrentView('spotify');
            break;
          case Button.BUTTON_2:
            setCurrentView('trello');
            break;
          case Button.BUTTON_3:
            setCurrentView('weather');
            break;
          case Button.BUTTON_4:
            setCurrentView('launchpad');
            break;
          case Button.BUTTON_5:
            setCurrentView('default');
            break;
          default:
            break;
        }
      }
    };

    const noOpCallback = () => {};

    buttonHelper.setCallback(handleButtonPress);

    return () => {
      buttonHelper.setCallback(noOpCallback);
    };
  }, [buttonHelper]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (msg: any) => {
      if (msg.type === 'set_view') {
        setCurrentView(msg.data);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'spotify':
        return <Spotify />;
      case 'trello':
        return <Trello />;
      case 'weather':
        return <Weather />;
      case 'launchpad':
        return <Launchpad />;
      case 'discord':
        return <Discord />;
      default:
        return <Default />;
    }
  };

  return <div className="view_container">{renderView()}</div>;
};

export default ViewManager;
