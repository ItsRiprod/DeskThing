import React, { useState, useEffect } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../helpers/ButtonHelper';
import Spotify from './Spotify/Spotify';
import Default from './default/default';
import Trello from './Trello/Trello';
import './views.css';

const ViewManager = () => {
  const [currentView, setCurrentView] = useState('default');
  const buttonHelper = new ButtonHelper();

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
            setCurrentView('view2');
            break;
          case Button.BUTTON_4:
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

  const renderView = () => {
    switch (currentView) {
      case 'spotify':
        return <Spotify />;
      case 'trello':
        return <Trello />;
      case 'view2':
        return <Default />;
      case 'default':
      default:
        return <Default />;
    }
  };

  return <div className="view_container">{renderView()}</div>;
};

export default ViewManager;
