import { useState, useEffect, Suspense, lazy  } from 'react';
import ButtonHelper, { Button, EventFlavour } from '../helpers/ButtonHelper';
import socket from '../helpers/WebSocketService';
import Default from './default';
import './views.css';

import Overlay from '../components/Overlay/Overlay';

const ViewManager = () => {
  const [currentView, setCurrentView] = useState('Default');
  const buttonHelper = ButtonHelper.getInstance();
  const [preferredApps, setPreferredApps] = useState<string[]>([]);
  const [apps, setApps] = useState<string[]>([]);
  const [DynamicComponent, setDynamicComponent] = useState<React.LazyExoticComponent<any> | null>(null);

  const handleLongPress = (index: number, view: string) => {
    if (socket.is_ready()) {
      const data = {
        app: 'util', // this should match what you have set on eventEmitter
        type: 'set', // This is just for you to specify type (get, set, put, post, etc)
        request: 'add_app',
        data: {app: view, index: index},
      };
      socket.post(data);
    }
  }

  useEffect(() => {
    const handleButtonPress = (btn: Button, flv: EventFlavour) => {
      if (flv === EventFlavour.Up) {
        switch (btn) {
          case Button.BUTTON_1:
            setCurrentView(preferredApps[0]);
            break;
          case Button.BUTTON_2:
            setCurrentView(preferredApps[1]);
            break;
          case Button.BUTTON_3:
            setCurrentView(preferredApps[2]);
            break;
          case Button.BUTTON_4:
            setCurrentView(preferredApps[3]);
            break;
          case Button.BUTTON_5:
            setCurrentView('Default'); // Will be settings eventually
            break;
          default:
            break;
        }
      } else if (flv === EventFlavour.LongPress) {
        switch (btn) {
          // Handle long press actions
          case Button.BUTTON_1:
            handleLongPress(0, currentView);
            break;
          case Button.BUTTON_2:
            handleLongPress(1, currentView);
            break;
          case Button.BUTTON_3:
            handleLongPress(2, currentView);
            break;
          case Button.BUTTON_4:
            handleLongPress(3, currentView);
            break;
          default:
            break;
        }
      } else if (btn === Button.SWIPE) {
        switch (flv) {
          case EventFlavour.LeftSwipe:
            if (preferredApps.indexOf(currentView) != -1) {
              const currentIndexLeft = preferredApps.indexOf(currentView);
              if (currentIndexLeft > 0) {
                setCurrentView(preferredApps[currentIndexLeft - 1]);
              }
            } 
            break;
            case EventFlavour.RightSwipe:
              if (preferredApps.indexOf(currentView) != -1) {
                const currentIndexRight = preferredApps.indexOf(currentView);
                if (currentIndexRight < preferredApps.length - 1) {
                  setCurrentView(preferredApps[currentIndexRight + 1]);
                }
              }
            break;
        }
      }
    };



    buttonHelper.setCallback(handleButtonPress);

    return () => {
      buttonHelper.setCallback(null);
      buttonHelper.destroy();
    };
  }, [buttonHelper, preferredApps, currentView]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listener = (msg: any) => {
      if (msg.type === 'set_view') {
        setCurrentView(msg.data);
      } else if (msg.type === 'utility_pref_data') {
        setPreferredApps(msg.data.preferredApps);
        setApps(msg.data.modules);
      }
    };

    socket.addSocketEventListener(listener);

    return () => {
      socket.removeSocketEventListener(listener);
    };
  }, []);

  useEffect(() => {
    const loadDynamicComponent = async () => {
      if (currentView) {
        try {
          const importedComponent = await import(`./${currentView.toLowerCase()}/index.tsx`);
          setDynamicComponent(lazy(() => Promise.resolve({ default: importedComponent.default })));
        } catch (error) {
          console.error(`Error loading component for view: ${currentView}`, error);
        }
      } else {
        setDynamicComponent(null);
      }
    };

    loadDynamicComponent();
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case 'Default':
        return <Default />;
      default:
        if (DynamicComponent) {
          return (
            <Suspense fallback={<div>Loading...</div>}>
              <DynamicComponent />
            </Suspense>
          );
        }
        return <div>Component not found</div>;
      }
  };

  return (

      <div className="view_container">
        <Overlay currentView={currentView} preferredApps={preferredApps} apps={apps} setCurrentView={setCurrentView}>
          {renderView()}
        </Overlay>
      </div>
    )
};

export default ViewManager;
